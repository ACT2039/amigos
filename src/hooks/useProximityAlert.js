import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import useStore from '../store/useStore';

// Proximity alert hook: listens for proximity-alert socket events
// Shows a popup and plays a short sound when friends are nearby
export default function useProximityAlert() {
  const socket = useSocket();
  const user = useStore((state) => state.user);
  const [alert, setAlert] = useState(null); // { friendName, friendPhoto, distanceKm }
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !user) return;

    const handleProximity = (data) => {
      // Determine which friend is nearby (the other one)
      let friendName, friendPhoto;
      if (data.user1.id === user._id) {
        friendName = data.user2.username;
        friendPhoto = data.user2.photo;
      } else if (data.user2.id === user._id) {
        friendName = data.user1.username;
        friendPhoto = data.user1.photo;
      } else {
        return; // Alert not for this user
      }

      setAlert({ friendName, friendPhoto, distanceKm: data.distanceKm });

      // Play a short notification sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.5); // C6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
      } catch (e) {
        // Audio not available, that's fine
      }

      // Auto-dismiss after 5 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAlert(null), 5000);
    };

    socket.on('proximity-alert', handleProximity);
    return () => {
      socket.off('proximity-alert', handleProximity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [socket, user]);

  return { alert, dismiss: () => setAlert(null) };
}
