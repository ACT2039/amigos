import { create } from 'zustand';

// Try to load initial user from localStorage
let initialUser = null;
try {
  const storedUser = localStorage.getItem('userInfo');
  if (storedUser && storedUser !== 'undefined') {
    initialUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.error("Failed to parse userInfo from localStorage", e);
  localStorage.removeItem('userInfo');
}

let initialGroupId = null;
try {
  const stored = localStorage.getItem('activeGroupId');
  if (stored && stored !== 'undefined') initialGroupId = stored;
} catch (e) {}

const useStore = create((set) => ({
  // Auth State
  user: initialUser,
  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('userInfo', JSON.stringify(user));
    } else {
      localStorage.removeItem('userInfo');
    }
  },
  logout: () => {
    set({ user: null, activeGroupId: null, friendsLocations: [], distances: {} });
    localStorage.removeItem('userInfo');
    localStorage.removeItem('activeGroupId');
  },

  // Group & Friends State
  activeGroupId: initialGroupId,
  setActiveGroup: (groupId) => {
    set({ activeGroupId: groupId, distances: {} });
    if (groupId) {
      localStorage.setItem('activeGroupId', groupId);
    } else {
      localStorage.removeItem('activeGroupId');
    }
  },
  
  friendsLocations: [],
  setFriendsLocations: (locations) => set({ friendsLocations: locations }),
  
  // Distance map: { friendId: distanceKm }
  distances: {},
  setDistances: (distArr) => {
    const map = {};
    distArr.forEach(d => { map[d.friendId] = d.distanceKm; });
    set({ distances: map });
  },

  // Update a single friend's location (from socket)
  updateFriendLocation: (userId, locationData) => set((state) => {
    const existingIndex = state.friendsLocations.findIndex(f => f._id === userId);
    
    if (existingIndex >= 0) {
      const updatedLocations = [...state.friendsLocations];
      updatedLocations[existingIndex] = {
        ...updatedLocations[existingIndex],
        currentLocation: { lat: locationData.lat, lng: locationData.lng, address: locationData.address },
        lastSeen: locationData.updatedAt || new Date(),
        isOnline: true
      };
      return { friendsLocations: updatedLocations };
    }
    return state;
  })
}));

export default useStore;
