import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF, OVERLAY_MOUSE_TARGET } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Layers, Locate, MapPin, Navigation, X } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import useStore from '../store/useStore';
import { useSocket } from '../contexts/SocketContext';

// --- Google Maps dark theme styling ---
const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0B0F1A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0F1A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7A99" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#8FA0C0" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#556682" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0F1A2A" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C6E47" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1A2233" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1E2A3D" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6B7A99" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1E2A3D" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#263349" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#8FA0C0" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#131929" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#556682" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#070B14" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3A4F73" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#070B14" }] },
];

const STREET_MAP_STYLES = [];
const TERRAIN_MAP_STYLES = [];

const MAP_THEMES = {
  dark: { label: 'Dark', styles: DARK_MAP_STYLES, mapTypeId: 'roadmap' },
  street: { label: 'Street', styles: STREET_MAP_STYLES, mapTypeId: 'roadmap' },
  satellite: { label: 'Satellite', styles: [], mapTypeId: 'satellite' },
  hybrid: { label: 'Hybrid', styles: [], mapTypeId: 'hybrid' },
  terrain: { label: 'Terrain', styles: TERRAIN_MAP_STYLES, mapTypeId: 'terrain' },
};

const containerStyle = { width: '100%', height: '100%' };

// --- Avatar Marker Component ---
function AvatarMarker({ position, photoUrl, isOnline, isCurrentUser, name, onClick, isPinMode }) {
  const borderColor = isCurrentUser ? '#00F5D4' : isOnline ? '#00F5D4' : '#6B7A99';

  return (
    <OverlayViewF
      position={position}
      mapPaneName={OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
    >
      <div
        className="avatar-marker-container"
        onClick={onClick}
        style={{ cursor: isPinMode && isCurrentUser ? 'crosshair' : 'pointer', position: 'relative', width: 48, height: 48 }}
      >
        {/* Pulse ring for current user */}
        {isCurrentUser && (
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              background: isPinMode ? 'rgba(255,200,0,0.2)' : 'rgba(0,245,212,0.15)',
              animation: 'sonar 2s ease-out infinite',
              borderColor: isPinMode ? 'rgba(255,200,0,0.5)' : undefined,
            }}
          />
        )}

        {/* Avatar image */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: `3px solid ${isPinMode && isCurrentUser ? '#FFC800' : borderColor}`,
            overflow: 'hidden',
            background: '#131929',
            boxShadow: (isOnline || isCurrentUser)
              ? `0 0 16px ${isPinMode && isCurrentUser ? 'rgba(255,200,0,0.6)' : 'rgba(0,245,212,0.6)'}`
              : 'none',
            filter: (!isOnline && !isCurrentUser) ? 'grayscale(1)' : 'none',
            opacity: (!isOnline && !isCurrentUser) ? 0.7 : 1,
          }}
        >
          <img
            src={photoUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'default'}`; }}
          />
        </div>

        {/* Online indicator dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid #131929',
            background: (isOnline || isCurrentUser) ? '#00F5D4' : '#6B7A99',
          }}
        />

        {/* Name label */}
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 4,
            whiteSpace: 'nowrap',
            fontSize: 10,
            fontWeight: 700,
            color: isPinMode && isCurrentUser ? '#FFC800' : (isCurrentUser ? '#00F5D4' : '#E8EDF5'),
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {isCurrentUser ? (isPinMode ? '📌 Drop here' : 'You') : name}
        </div>
      </div>
    </OverlayViewF>
  );
}

// --- Info Window Component ---
function InfoPopup({ data, onClose }) {
  if (!data) return null;

  return (
    <OverlayViewF
      position={data.position}
      mapPaneName={OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: 0, y: -70 })}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          background: '#131929',
          color: '#E8EDF5',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(0,245,212,0.3)',
          minWidth: 160,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          position: 'relative',
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 4, right: 6,
            background: 'none', border: 'none', color: '#6B7A99',
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
          }}
        >×</button>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: data.isCurrentUser ? '#00F5D4' : '#E8EDF5' }}>
          {data.isCurrentUser ? 'You' : data.name}
        </h4>
        {data.address && (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6B7A99' }}>📍 {data.address}</p>
        )}
        {data.distance && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#00F5D4', fontWeight: 700, fontFamily: 'monospace' }}>
            📏 {data.distance} away
          </p>
        )}
        {data.lastSeen && (
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6B7A99', fontFamily: 'monospace' }}>
            🕐 {new Date(data.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {/* Arrow */}
        <div style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
          borderTop: '6px solid #131929',
        }} />
      </motion.div>
    </OverlayViewF>
  );
}

// --- Main MapView ---
export default function MapView({ friends }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDhq-vVMfPkHbaiFLyhR029wjr0tHKj0ng';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  });

  const location = useGeolocation();
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  // Manual pin mode: user clicks on map to reposition themselves
  const [pinMode, setPinMode] = useState(false);
  const [showPinBanner, setShowPinBanner] = useState(false);

  const user = useStore((state) => state.user);
  const activeGroupId = useStore((state) => state.activeGroupId);
  const distances = useStore((state) => state.distances);
  const socket = useSocket();

  const mapRef = useRef(null);
  const hasCentered = useRef(false);

  // Broadcast location via socket whenever it changes
  useEffect(() => {
    if (socket && location.loaded && user && activeGroupId && !location.error &&
        location.coordinates.lat !== 0) {
      socket.emit('location-update', {
        userId: user._id,
        groupId: activeGroupId,
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        address: location.address || 'Tracking...',
      });
    }
  }, [socket, location.coordinates.lat, location.coordinates.lng, location.address, user, activeGroupId]);

  const center = useMemo(() => {
    if (location.loaded && location.coordinates.lat !== 0) {
      return { lat: location.coordinates.lat, lng: location.coordinates.lng };
    }
    return { lat: 18.2949, lng: 83.8938 }; // Default: Srikakulam district, AP
  }, [location.loaded, location.coordinates.lat, location.coordinates.lng]);

  // Auto-center once on first valid location
  useEffect(() => {
    if (mapRef.current && location.loaded && location.coordinates.lat !== 0 && !hasCentered.current) {
      mapRef.current.panTo({ lat: location.coordinates.lat, lng: location.coordinates.lng });
      mapRef.current.setZoom(15);
      hasCentered.current = true;
    }
  }, [location.loaded, location.coordinates.lat, location.coordinates.lng]);

  const onLoad = useCallback((map) => { mapRef.current = map; }, []);
  const onUnmount = useCallback(() => { mapRef.current = null; }, []);

  const handleRecenter = () => {
    if (mapRef.current && location.loaded && location.coordinates.lat !== 0) {
      mapRef.current.panTo({ lat: location.coordinates.lat, lng: location.coordinates.lng });
      mapRef.current.setZoom(15);
    }
  };

  // Handle map click in pin mode → set manual location
  const handleMapClick = useCallback(async (e) => {
    if (!pinMode) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    await location.setManualLocation(lat, lng);
    setPinMode(false);
    setShowPinBanner(false);
    // Pan to the new location
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
    }
  }, [pinMode, location.setManualLocation]);

  const handleEnterPinMode = () => {
    setPinMode(true);
    setShowPinBanner(true);
    setSelectedInfo(null);
  };

  const handleCancelPinMode = () => {
    setPinMode(false);
    setShowPinBanner(false);
  };

  const handleResetGPS = () => {
    location.resetToGPS();
    hasCentered.current = false;
  };

  const formatDist = (km) => {
    if (km == null) return '';
    if (km < 1) return `${(km * 1000).toFixed(0)}m`;
    if (km < 10) return `${km.toFixed(1)}km`;
    return `${Math.round(km)}km`;
  };

  const theme = MAP_THEMES[selectedTheme];

  const mapOptions = useMemo(() => ({
    styles: theme.styles,
    mapTypeId: theme.mapTypeId,
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: 'greedy',
    backgroundColor: '#0B0F1A',
    cursor: pinMode ? 'crosshair' : undefined,
  }), [selectedTheme, pinMode]);

  // --- Loading / Error / No key states ---
  if (!apiKey) {
    return (
      <div className="relative w-full h-full bg-deep flex items-center justify-center">
        <div className="glass-panel rounded-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-primary font-display font-bold text-lg mb-2">Google Maps API Key Required</h3>
          <p className="text-muted text-sm mb-4">
            Add your API key to the <code className="text-neon-teal bg-deep/50 px-1.5 py-0.5 rounded text-xs">.env</code> file:
          </p>
          <div className="bg-deep/80 rounded-lg p-3 text-left font-mono text-xs text-neon-teal border border-glass">
            VITE_GOOGLE_MAPS_API_KEY=your_key_here
          </div>
          <p className="text-muted text-[10px] mt-3">Then restart the dev server.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative w-full h-full bg-deep flex items-center justify-center">
        <div className="glass-panel rounded-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-neon-pink font-display font-bold text-lg mb-2">Map Failed to Load</h3>
          <p className="text-muted text-sm">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-full bg-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-neon-teal/30 border-t-neon-teal rounded-full animate-spin" />
          <p className="text-muted text-xs font-mono">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-deep">
      {/* Sonar keyframes */}
      <style>{`@keyframes sonar{0%{transform:scale(1);opacity:0.7}100%{transform:scale(2.2);opacity:0}}`}</style>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onClick={pinMode ? handleMapClick : () => setSelectedInfo(null)}
      >
        {/* Current User Marker */}
        {location.loaded && location.coordinates.lat !== 0 && (
          <AvatarMarker
            position={{ lat: location.coordinates.lat, lng: location.coordinates.lng }}
            photoUrl={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Me'}`}
            isOnline={true}
            isCurrentUser={true}
            isPinMode={pinMode}
            name="You"
            onClick={() => {
              if (pinMode) return;
              setSelectedInfo({
                position: { lat: location.coordinates.lat, lng: location.coordinates.lng },
                name: 'You',
                address: location.address || 'Tracking...',
                isCurrentUser: true,
              });
            }}
          />
        )}

        {/* Friend Markers */}
        {friends.map((friend) => {
          if (!friend.currentLocation || !friend.currentLocation.lat) return null;
          const dist = distances[friend._id];
          const distLabel = formatDist(dist);

          return (
            <AvatarMarker
              key={friend._id}
              position={{ lat: friend.currentLocation.lat, lng: friend.currentLocation.lng }}
              photoUrl={friend.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
              isOnline={friend.isOnline}
              isCurrentUser={false}
              isPinMode={false}
              name={friend.username}
              onClick={() => setSelectedInfo({
                position: { lat: friend.currentLocation.lat, lng: friend.currentLocation.lng },
                name: friend.username,
                address: friend.currentLocation.address || 'Unknown',
                distance: distLabel,
                lastSeen: friend.lastSeen,
                isCurrentUser: false,
              })}
            />
          );
        })}

        {/* Info popup */}
        {selectedInfo && (
          <InfoPopup data={selectedInfo} onClose={() => setSelectedInfo(null)} />
        )}
      </GoogleMap>

      {/* ── Pin Mode Banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showPinBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500/90 backdrop-blur-md text-black text-sm font-semibold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 animate-bounce" />
            Click anywhere on the map to set your exact location
            <button
              onClick={handleCancelPinMode}
              className="ml-2 w-5 h-5 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top-Left Controls ────────────────────────────────────────── */}
      <div className="absolute top-16 md:top-4 left-4 z-[1000] flex gap-2">
        {/* Theme selector */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="w-10 h-10 rounded-lg bg-surface/90 backdrop-blur-md border border-glass flex items-center justify-center text-muted hover:text-neon-teal transition-colors shadow-lg"
          >
            <Layers className="w-5 h-5" />
          </button>
          {showThemeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-12 left-0 bg-surface/95 backdrop-blur-md border border-glass rounded-lg overflow-hidden shadow-xl"
            >
              {Object.entries(MAP_THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedTheme(key); setShowThemeMenu(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
                    selectedTheme === key
                      ? 'text-neon-teal bg-neon-teal/10'
                      : 'text-muted hover:text-primary hover:bg-deep/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Recenter */}
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-lg bg-surface/90 backdrop-blur-md border border-glass flex items-center justify-center text-muted hover:text-neon-teal transition-colors shadow-lg"
          title="Re-center on your location"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Set Manual Location */}
        <button
          onClick={pinMode ? handleCancelPinMode : handleEnterPinMode}
          className={`w-10 h-10 rounded-lg backdrop-blur-md border flex items-center justify-center transition-colors shadow-lg ${
            pinMode
              ? 'bg-amber-500/90 border-amber-400 text-black'
              : 'bg-surface/90 border-glass text-muted hover:text-amber-400 hover:border-amber-400/50'
          }`}
          title={pinMode ? 'Cancel pin mode' : 'Manually set your location on map'}
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* Reset to GPS (only shown when in manual mode) */}
        {location.isManual && (
          <button
            onClick={handleResetGPS}
            className="w-10 h-10 rounded-lg bg-surface/90 backdrop-blur-md border border-glass flex items-center justify-center text-muted hover:text-neon-teal transition-colors shadow-lg"
            title="Return to GPS tracking"
          >
            <Navigation className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── HUD ─────────────────────────────────────────────────────── */}
      <div className="absolute bottom-24 md:bottom-6 left-4 z-[1000] pointer-events-none flex flex-col gap-1">
        <div className="flex items-center gap-2 text-neon-teal font-mono text-xs opacity-80">
          <Crosshair
            className={`w-4 h-4 ${location.loaded && !location.error && !location.isManual ? 'animate-spin' : ''}`}
            style={{ animationDuration: '4s' }}
          />
          <span>LAT: {location.coordinates.lat.toFixed(6)}</span>
          {location.isManual && (
            <span className="text-amber-400 text-[9px] font-bold ml-1 border border-amber-400/40 px-1 py-0.5 rounded">MANUAL</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-neon-teal font-mono text-xs opacity-80 ml-6">
          <span>LNG: {location.coordinates.lng.toFixed(6)}</span>
        </div>
        {location.address && (
          <div className="text-neon-teal font-mono text-[10px] opacity-80 ml-6 mt-1 max-w-[280px] truncate">
            📍 {location.address}
          </div>
        )}
        {location.error && (
          <div className="mt-2 text-neon-pink font-mono text-xs bg-surface/90 p-2 rounded border border-neon-pink/30 pointer-events-auto max-w-[300px]">
            <span className="font-bold">{location.error.message}</span>
            <br />
            <span className="text-amber-400 text-[10px]">👆 Use the 📌 pin button above to manually set your location.</span>
          </div>
        )}
      </div>
    </div>
  );
}
