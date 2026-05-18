import User from '../models/User.js';
import Location from '../models/Location.js';
import Group from '../models/Group.js';

// Haversine formula for accurate distance in km
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Track proximity cooldowns: key = sorted pair "userId1-userId2", value = timestamp
const proximityCooldowns = new Map();
const PROXIMITY_THRESHOLD_KM = 0.5; // 500 meters
const PROXIMITY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// In-memory location cache for fast distance calcs
const locationCache = new Map(); // userId -> { lat, lng, address, groupIds }

export default function setupSockets(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error:`, error);
    });

    // Join a specific group room
    socket.on('join-group', async ({ groupId, userId }) => {
      try {
        socket.join(groupId);
        socket.userId = userId;
        console.log(`User ${userId} joined group room ${groupId}`);
        
        if (userId) {
          await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).catch(err => 
            console.error(`Error updating user ${userId} online status:`, err.message)
          );
          socket.to(groupId).emit('user-online', { userId });
        }
      } catch (error) {
        console.error('Error in join-group:', error);
        socket.emit('error', { message: 'Failed to join group' });
      }
    });

    // Handle real-time location updates
    socket.on('location-update', async (data) => {
      const { userId, groupId, lat, lng, address } = data;
      
      if (!userId || !groupId || lat == null || lng == null) return;

      // Update location cache
      const cached = locationCache.get(userId) || { lat: 0, lng: 0, address: '', groupIds: new Set() };
      cached.lat = lat;
      cached.lng = lng;
      cached.address = address || '';
      cached.groupIds.add(groupId);
      locationCache.set(userId, cached);

      // Broadcast location to group
      socket.to(groupId).emit('location-updated', {
        userId, lat, lng, address, updatedAt: new Date()
      });

      // Calculate distances to all other online members in this group
      try {
        const group = await Group.findById(groupId).select('members').lean();
        if (!group) return;

        const distances = [];
        
        for (const memberId of group.members) {
          const mId = memberId.toString();
          if (mId === userId) continue;
          
          const friendLoc = locationCache.get(mId);
          if (!friendLoc || friendLoc.lat === 0) continue;

          const distKm = haversineDistance(lat, lng, friendLoc.lat, friendLoc.lng);
          distances.push({ friendId: mId, distanceKm: Math.round(distKm * 100) / 100 });

          // Check proximity for "Say Hi" feature
          if (distKm <= PROXIMITY_THRESHOLD_KM) {
            const pairKey = [userId, mId].sort().join('-');
            const lastAlert = proximityCooldowns.get(pairKey) || 0;
            
            if (Date.now() - lastAlert > PROXIMITY_COOLDOWN_MS) {
              proximityCooldowns.set(pairKey, Date.now());
              
              // Get friend's username for the alert
              const friend = await User.findById(mId).select('username profilePhoto').lean();
              const currentUser = await User.findById(userId).select('username profilePhoto').lean();
              
              if (friend && currentUser) {
                // Alert both users
                io.to(groupId).emit('proximity-alert', {
                  user1: { id: userId, username: currentUser.username, photo: currentUser.profilePhoto },
                  user2: { id: mId, username: friend.username, photo: friend.profilePhoto },
                  distanceKm
                });
              }
            }
          }
        }

        // Send distance data to the user who moved
        if (distances.length > 0) {
          socket.emit('distance-update', { distances });
        }
      } catch (err) {
        console.error('Error calculating distances:', err);
      }

      // Save to database (non-blocking)
      try {
        await Location.findOneAndUpdate(
          { userId },
          { latitude: lat, longitude: lng, address },
          { upsert: true, new: true }
        );
        
        await User.findByIdAndUpdate(userId, {
          currentLocation: { lat, lng, address, updatedAt: new Date() },
          lastSeen: new Date(),
          isOnline: true
        });
      } catch (error) {
        console.error('Error saving location:', error);
      }
    });

    socket.on('leave-group', ({ groupId }) => {
      socket.leave(groupId);
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() }).catch(err => 
          console.error(`Error updating user ${socket.userId} offline status:`, err.message)
        );
      }
      // Clear location cache on disconnect
      if (socket.userId) {
        locationCache.delete(socket.userId);
      }
    });
  });

  // Handle IO-level errors
  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
}
