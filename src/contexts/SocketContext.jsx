import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const user = useStore((state) => state.user);
  const activeGroupId = useStore((state) => state.activeGroupId);
  const updateFriendLocation = useStore((state) => state.updateFriendLocation);
  const setDistances = useStore((state) => state.setDistances);

  useEffect(() => {
    if (!user) return;

    // Prioritize VITE_API_URL (with /api stripped) if provided, otherwise fallback
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
    
    const newSocket = io(socketUrl, { withCredentials: true });
    setSocket(newSocket);

    // Listen for location updates from friends
    newSocket.on('location-updated', (data) => {
      updateFriendLocation(data.userId, data);
    });

    // Listen for distance calculations
    newSocket.on('distance-update', (data) => {
      if (data.distances) setDistances(data.distances);
    });

    // Listen for user online/offline events
    newSocket.on('user-online', (data) => {
      updateFriendLocation(data.userId, { isOnline: true });
    });

    // Listen for group deletion
    newSocket.on('group-deleted', (data) => {
      const state = useStore.getState();
      if (state.activeGroupId === data.groupId) {
        state.setActiveGroup(null);
        alert('This group was permanently deleted by the admin.');
        window.location.reload(); // Refresh to clean up state and refetch groups
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Join/leave group rooms when activeGroupId changes
  useEffect(() => {
    if (!socket || !user || !activeGroupId) return;

    socket.emit('join-group', { groupId: activeGroupId, userId: user._id });

    return () => {
      socket.emit('leave-group', { groupId: activeGroupId });
    };
  }, [socket, activeGroupId, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
