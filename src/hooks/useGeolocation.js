import { useState, useEffect, useRef, useCallback } from 'react';

// Reverse geocode using free Nominatim API (no key needed)
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    // Build a clean, short address: "City, State, Country"
    const a = data.address || {};
    const parts = [
      a.village || a.town || a.city || a.county || a.district || a.state_district,
      a.state,
      a.country,
    ].filter(Boolean);
    return parts.join(', ') || data.display_name || '';
  } catch (err) {
    console.error('Reverse geocode failed:', err);
    return null;
  }
};

export default function useGeolocation() {
  const [location, setLocation] = useState({
    loaded: false,
    coordinates: { lat: 0, lng: 0 },
    address: '',
    error: null,
    isManual: false,
  });

  const watchIdRef = useRef(null);
  const lastGeocodeRef = useRef({ lat: 0, lng: 0, time: 0 });
  // Track if user has set a manual override so GPS updates don't overwrite it
  const isManualRef = useRef(false);

  // ─── Manual Override ────────────────────────────────────────────────────────
  const setManualLocation = useCallback(async (lat, lng) => {
    isManualRef.current = true;
    // Clear GPS watch while in manual mode to save battery & avoid overrides
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const address = await reverseGeocode(lat, lng);
    lastGeocodeRef.current = { lat, lng, time: Date.now() };
    setLocation({
      loaded: true,
      coordinates: { lat, lng },
      address: address || '',
      error: null,
      isManual: true,
    });
  }, []);

  // ─── Reset to GPS tracking ──────────────────────────────────────────────────
  const resetToGPS = useCallback(() => {
    isManualRef.current = false;
    setLocation(prev => ({ ...prev, isManual: false }));
    startWatch(); // eslint-disable-line
  }, []); // eslint-disable-line

  // ─── GPS Watch ──────────────────────────────────────────────────────────────
  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) return;

    const onSuccess = async (position) => {
      // Don't override if user has manually set their location
      if (isManualRef.current) return;

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Throttle reverse geocode: only if moved > ~100m OR > 30s since last call
      const prev = lastGeocodeRef.current;
      const dist = Math.abs(lat - prev.lat) + Math.abs(lng - prev.lng);
      const timeDiff = Date.now() - prev.time;
      let address = null;
      if (dist > 0.001 || timeDiff > 30000) {
        address = await reverseGeocode(lat, lng);
        if (address) lastGeocodeRef.current = { lat, lng, time: Date.now() };
      }

      setLocation(prev => ({
        loaded: true,
        coordinates: { lat, lng },
        address: address || prev.address,
        error: null,
        isManual: false,
      }));
    };

    const onError = (error) => {
      if (isManualRef.current) return; // Ignore GPS errors in manual mode
      let errorMessage = 'Location unavailable.';
      switch (error.code) {
        case 1: errorMessage = 'Location permission denied. Use manual pin to set your location.'; break;
        case 2: errorMessage = 'Position unavailable. Use manual pin to set your location.'; break;
        case 3: errorMessage = 'GPS timeout. Use manual pin to set your location.'; break;
      }
      setLocation(prev => ({
        ...prev,
        loaded: true,
        error: { code: error.code, message: errorMessage },
      }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0, // Never use cached position — always get fresh fix
    });
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocation({
        loaded: true,
        coordinates: { lat: 0, lng: 0 },
        address: '',
        error: { code: 0, message: 'Geolocation not supported. Use manual pin.' },
        isManual: false,
      });
      return;
    }
    startWatch();
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatch]);

  return { ...location, setManualLocation, resetToGPS };
}
