import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LoginPage } from './components/LoginPage.jsx';
import { Header } from './components/Header.jsx';
import { MapContainer } from './components/MapContainer.jsx';
import { HexagonDetailModal } from './components/HexagonDetailModal.jsx';
import { UserProfileModal } from './components/UserProfileModal.jsx';
import { LiveTicker } from './components/LiveTicker.jsx';

import { KAZAN_CENTER, KAZAN_LANDMARKS, INITIAL_TICKER_EVENTS } from './services/mockData.js';
import { isAuthenticated, getStoredUser, clearSession } from './services/authService.js';
import wsService from './services/wsService.js';
import { h3Uint64ToHexString } from './services/protoService.js';

export function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [userProfile, setUserProfile] = useState(null);
  const [wsStatus, setWsStatus] = useState(wsService.status);

  // Map state
  const [selectedLandmark, setSelectedLandmark] = useState(KAZAN_LANDMARKS[0]);
  const [h3Resolution, setH3Resolution] = useState(9);
  const [mapStyle, setMapStyle] = useState('voyager');
  const [centerPosition, setCenterPosition] = useState(KAZAN_CENTER);

  // Protobuf data
  const [hexagons, setHexagons] = useState([]);
  const [selectedH3Index, setSelectedH3Index] = useState(null);
  const [hexagonDetails, setHexagonDetails] = useState(null);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tickerEvents, setTickerEvents] = useState(INITIAL_TICKER_EVENTS);

  // Resolution Ref
  const h3ResolutionRef = useRef(h3Resolution);
  useEffect(() => {
    h3ResolutionRef.current = h3Resolution;
  }, [h3Resolution]);

  // WebSocket listeners and lifecycle
  useEffect(() => {
    if (!authenticated) return;

    // 1. Connection status
    const unsubStatus = wsService.on('status', ({ status }) => {
      setWsStatus(status);
    });

    // 2. UserProfile Protobuf response
    const unsubProfile = wsService.on('user_profile_response', (profile) => {
      if (profile) {
        setUserProfile(profile);
      }
    });

    // 3. Viewport Protobuf response (stream of hexagons in camera viewport)
    const unsubViewport = wsService.on('subscribe_viewport_response', (resp) => {
      if (resp && resp.hexagons) {
        const mapped = resp.hexagons.map((hex) => {
          const hexStr = h3Uint64ToHexString(hex.h3_index);
          const isCaptured = Boolean(hex.owner_username || (hex.owner_user_id && hex.owner_user_id !== '0'));
          return {
            h3_index: hexStr,
            is_captured: isCaptured,
            score: hex.top_score || 0,
            top_score: hex.top_score || 0,
            owner: isCaptured ? {
              id: hex.owner_user_id,
              name: hex.owner_username || 'Атлет',
              color: hex.owner_color_hex || '#f97316',
              club_name: 'URAM Team'
            } : null
          };
        });

        setHexagons((prev) => {
          const map = new Map(prev.map(h => [h.h3_index, h]));
          mapped.forEach(h => map.set(h.h3_index, h));
          return Array.from(map.values());
        });
      }
    });

    // 4. Hexagon Details Protobuf response
    const unsubHexDetails = wsService.on('hexagon_details_response', (details) => {
      if (details) {
        setHexagonDetails(details);
      }
    });

    // 5. Hexagon Capture Realtime Pub/Sub Event
    const unsubCapture = wsService.on('hexagon_capture_event', (event) => {
      const hexStr = h3Uint64ToHexString(event.h3_index);

      // Update hex in memory
      setHexagons((prev) =>
        prev.map((h) => {
          if (h.h3_index === hexStr) {
            return {
              ...h,
              is_captured: true,
              score: event.score_at_capture || 400,
              top_score: event.score_at_capture || 400,
              owner: {
                id: event.new_owner_id,
                name: event.new_owner_name || 'Бегун',
                color: event.new_owner_color_hex || '#f97316',
                club_name: 'URAM Club'
              }
            };
          }
          return h;
        })
      );

      // Add to Live Ticker
      const tickerItem = {
        id: `cap-${Date.now()}-${hexStr}`,
        user: event.new_owner_name || 'Бегун',
        clubColor: event.new_owner_color_hex || '#f97316',
        text: `Захватил гексагон #${hexStr.substring(0, 7)}...`,
        time: 'Только что (WS)',
        score: `+${event.score_at_capture || 400}`
      };
      setTickerEvents((prev) => [tickerItem, ...prev.slice(0, 2)]);
    });

    // Connect WebSocket
    wsService.connect();

    return () => {
      unsubStatus();
      unsubProfile();
      unsubViewport();
      unsubHexDetails();
      unsubCapture();
    };
  }, [authenticated]);

  // Handle Viewport changes from MapLibre camera move
  const handleViewportChange = useCallback(({ bounds }) => {
    if (bounds && wsService.status === 'connected') {
      wsService.subscribeViewport(bounds.swLng, bounds.swLat, bounds.neLng, bounds.neLat);
    }
  }, []);

  // Handle Hexagon Selection
  const handleHexagonSelect = (h3Index) => {
    setSelectedH3Index(h3Index);
    setHexagonDetails(null);
    if (wsService.status === 'connected') {
      wsService.requestHexagonDetails(h3Index);
    }
  };

  // Handle Landmark Navigation
  const handleSelectLandmark = (landmark) => {
    setSelectedLandmark(landmark);
    setCenterPosition({
      lat: landmark.lat,
      lng: landmark.lng,
      zoom: landmark.zoom
    });
  };

  // Handle Login
  const handleLoginSuccess = (authData) => {
    setAuthenticated(true);
    const user = getStoredUser();
    setUserProfile((prev) => ({
      ...prev,
      username: user?.username || authData.user?.username || 'Бегун'
    }));
  };

  // Handle Logout
  const handleLogout = () => {
    clearSession();
    wsService.disconnect();
    setAuthenticated(false);
    setUserProfile(null);
    setHexagons([]);
    setSelectedH3Index(null);
  };

  // If not logged in, display full LoginPage first
  if (!authenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const capturedCount = hexagons.filter((h) => h.is_captured).length;

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Top Header */}
      <Header
        selectedLandmark={selectedLandmark}
        onSelectLandmark={handleSelectLandmark}
        h3Resolution={h3Resolution}
        onChangeResolution={setH3Resolution}
        currentMapStyle={mapStyle}
        onSelectMapStyle={setMapStyle}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        userProfile={userProfile}
        wsStatus={wsStatus}
        stats={{
          hexCount: hexagons.length,
          capturedCount: capturedCount
        }}
      />

      {/* Main Map */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapContainer
          hexagons={hexagons}
          selectedH3Index={selectedH3Index}
          onHexagonSelect={handleHexagonSelect}
          centerPosition={centerPosition}
          h3Resolution={h3Resolution}
          mapStyle={mapStyle}
          onViewportChange={handleViewportChange}
        />

        {/* Selected Hexagon Protobuf Detail Drawer */}
        {selectedH3Index && (
          <HexagonDetailModal
            h3Index={selectedH3Index}
            onClose={() => {
              setSelectedH3Index(null);
              setHexagonDetails(null);
            }}
            detailsData={hexagonDetails}
          />
        )}

        {/* Realtime Live Ticker */}
        <LiveTicker events={tickerEvents} />
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profileData={userProfile}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
