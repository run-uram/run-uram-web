import React, { useEffect, useState, useCallback } from 'react';
import { LoginPage } from './components/LoginPage.jsx';
import { Header } from './components/Header.jsx';
import { MapContainer } from './components/MapContainer.jsx';
import { HexagonDetailModal } from './components/HexagonDetailModal.jsx';
import { UserProfileModal } from './components/UserProfileModal.jsx';
import { LiveTicker } from './components/LiveTicker.jsx';

import { KAZAN_CENTER, KAZAN_LANDMARKS } from './services/mockData.js';
import { isAuthenticated, getStoredUser, clearSession } from './services/authService.js';
import wsService from './services/wsService.js';
import { h3Uint64ToHexString } from './services/protoService.js';

// Runner palette for consistent distinct player colors across the map
const RUNNER_PALETTE = [
  '#f97316', // Orange
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#eab308', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#14b8a6'  // Teal
];

function getRunnerColor(userId, providedColor) {
  if (providedColor && providedColor.startsWith('#') && providedColor.length >= 4 && providedColor !== '#000000' && providedColor !== '#27272a') {
    return providedColor;
  }
  if (!userId || userId === '0' || userId === 0) return '#f97316';
  const str = String(userId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const index = Math.abs(hash) % RUNNER_PALETTE.length;
  return RUNNER_PALETTE[index];
}

export function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [userProfile, setUserProfile] = useState(null);
  const [wsStatus, setWsStatus] = useState(wsService.status);

  // Cache of known runner profiles: userId -> { username, color }
  const knownRunnersRef = React.useRef(new Map());
  // Cache of requested hexagon details to prevent duplicate queries
  const requestedHexDetailsRef = React.useRef(new Set());

  // Map state
  const [selectedLandmark, setSelectedLandmark] = useState(KAZAN_LANDMARKS[0]);
  const [mapStyle, setMapStyle] = useState('voyager');
  const [centerPosition, setCenterPosition] = useState(KAZAN_CENTER);

  // Protobuf realtime state
  const [capturedHexagonsMap, setCapturedHexagonsMap] = useState(new Map());
  const [selectedH3Index, setSelectedH3Index] = useState(null);
  const [hexagonDetails, setHexagonDetails] = useState(null);

  // Modals & events
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tickerEvents, setTickerEvents] = useState([]);

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
        if (profile.user_id && profile.username) {
          knownRunnersRef.current.set(String(profile.user_id), {
            username: profile.username,
            color: profile.player_color_hex || getRunnerColor(profile.user_id)
          });
        }
      }
    });

    // 3. Viewport Protobuf response (stream of hexagons in camera viewport)
    const unsubViewport = wsService.on('subscribe_viewport_response', (resp) => {
      if (resp && resp.hexagons) {
        if (resp.hexagons.length === 0) {
          return;
        }

        const hexesToPrefetch = [];

        setCapturedHexagonsMap((prevMap) => {
          let hasChanges = false;
          const newMap = new Map(prevMap);

          resp.hexagons.forEach((hex) => {
            const hexStr = h3Uint64ToHexString(hex.h3_index);
            const isCaptured = Boolean(hex.owner_username || (hex.owner_user_id && hex.owner_user_id !== '0'));
            const existing = newMap.get(hexStr);
            const rawOwner = hex.owner_username?.trim();
            const userIdStr = hex.owner_user_id ? String(hex.owner_user_id) : null;

            // Check if we already know this user from runner cache
            const cachedRunner = userIdStr ? knownRunnersRef.current.get(userIdStr) : null;

            // Check if existing map record has explicit resolved name (e.g. from hexagon_details_response)
            const existingName = existing?.owner?.name;
            const hasExistingExplicitName = existingName && existingName !== 'Бегун' && existingName !== 'Атлет' && !existingName.startsWith('Атлет #');
            const hasNewExplicitName = rawOwner && rawOwner !== 'Бегун' && rawOwner !== 'Атлет';

            const ownerName = hasNewExplicitName
              ? rawOwner
              : (cachedRunner?.username || (hasExistingExplicitName ? existingName : (rawOwner || (isCaptured ? (userIdStr && userIdStr !== '0' ? `Атлет #${userIdStr}` : 'Бегун') : null))));

            const ownerColor = (hex.owner_color_hex && hex.owner_color_hex.startsWith('#') && hex.owner_color_hex !== '#000000')
              ? hex.owner_color_hex
              : (cachedRunner?.color || existing?.owner?.color || getRunnerColor(userIdStr, hex.owner_color_hex));

            const topScore = hex.top_score || existing?.score || 0;

            // Register in runner cache if explicit name is available
            if (userIdStr && hasNewExplicitName) {
              knownRunnersRef.current.set(userIdStr, {
                username: rawOwner,
                color: ownerColor
              });
            }

            const hexData = {
              h3_index: hexStr,
              is_captured: isCaptured,
              score: topScore,
              top_score: topScore,
              owner: isCaptured ? {
                id: hex.owner_user_id || existing?.owner?.id,
                name: ownerName,
                color: ownerColor,
                club_name: existing?.owner?.club_name || 'URAM Team'
              } : null
            };

            // If captured hex doesn't have an explicit runner name yet, queue for prefetch
            if (isCaptured && (!hasNewExplicitName && !hasExistingExplicitName && !cachedRunner)) {
              if (!requestedHexDetailsRef.current.has(hexStr)) {
                hexesToPrefetch.push(hexStr);
              }
            }

            if (!existing || existing.score !== hexData.score || existing.is_captured !== hexData.is_captured || existing.owner?.name !== hexData.owner?.name || existing.owner?.color !== hexData.owner?.color) {
              newMap.set(hexStr, hexData);
              hasChanges = true;
            }
          });

          return hasChanges ? newMap : prevMap;
        });

        // Prefetch details for newly discovered captured hexagons in viewport (throttled)
        if (hexesToPrefetch.length > 0 && wsService.status === 'connected') {
          hexesToPrefetch.slice(0, 8).forEach((h3Idx, idx) => {
            requestedHexDetailsRef.current.add(h3Idx);
            setTimeout(() => {
              if (wsService.status === 'connected') {
                wsService.requestHexagonDetails(h3Idx);
              }
            }, idx * 60);
          });
        }
      }
    });

    // 4. Hexagon Details Protobuf response
    const unsubHexDetails = wsService.on('hexagon_details_response', (details) => {
      if (details) {
        setHexagonDetails(details);

        // Sync detailed owner and leaderboard information into capturedHexagonsMap & runner cache
        if (details.state && details.state.h3_index) {
          const hexStr = h3Uint64ToHexString(details.state.h3_index);
          const topLeader = details.leaderboard && details.leaderboard.length > 0 ? details.leaderboard[0] : null;
          const rawOwnerName = details.state.owner_username?.trim();
          const hasExplicitOwner = rawOwnerName && rawOwnerName !== 'Атлет' && rawOwnerName !== 'Бегун';

          const resolvedOwner = hasExplicitOwner ? rawOwnerName : (topLeader?.username || rawOwnerName || null);
          const isCaptured = Boolean(resolvedOwner || (details.state.owner_user_id && details.state.owner_user_id !== '0') || topLeader);
          const finalOwnerName = resolvedOwner || (isCaptured ? (topLeader?.username || 'Бегун') : null);
          const rawOwnerId = details.state.owner_user_id || topLeader?.user_id;
          const finalOwnerColor = details.state.owner_color_hex || topLeader?.player_color_hex || getRunnerColor(rawOwnerId, details.state.owner_color_hex);
          const finalScore = details.state.top_score || topLeader?.uram_points || 0;

          // Save to known runners cache
          if (rawOwnerId && finalOwnerName && finalOwnerName !== 'Бегун') {
            knownRunnersRef.current.set(String(rawOwnerId), {
              username: finalOwnerName,
              color: finalOwnerColor
            });
          }

          if (isCaptured) {
            setCapturedHexagonsMap((prevMap) => {
              const newMap = new Map(prevMap);
              newMap.set(hexStr, {
                h3_index: hexStr,
                is_captured: true,
                score: finalScore,
                top_score: finalScore,
                owner: {
                  id: rawOwnerId,
                  name: finalOwnerName,
                  color: finalOwnerColor,
                  club_name: 'URAM Team'
                }
              });

              // Also update any other hexagons owned by this user
              if (rawOwnerId && finalOwnerName) {
                newMap.forEach((val, key) => {
                  if (val.owner && String(val.owner.id) === String(rawOwnerId) && (!val.owner.name || val.owner.name === 'Бегун' || val.owner.name.startsWith('Атлет #'))) {
                    newMap.set(key, {
                      ...val,
                      owner: {
                        ...val.owner,
                        name: finalOwnerName,
                        color: finalOwnerColor
                      }
                    });
                  }
                });
              }

              return newMap;
            });
          }
        }
      }
    });

    // 5. Hexagon Capture Realtime Pub/Sub Event
    const unsubCapture = wsService.on('hexagon_capture_event', (event) => {
      const hexStr = h3Uint64ToHexString(event.h3_index);

      // Update captured hex in lookup map
      setCapturedHexagonsMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(hexStr, {
          h3_index: hexStr,
          is_captured: true,
          score: event.score_at_capture || 400,
          top_score: event.score_at_capture || 400,
          owner: {
            id: event.new_owner_id,
            name: event.new_owner_name || 'Бегун',
            color: event.new_owner_color_hex || '#f97316',
            club_name: 'URAM Club'
          }
        });
        return newMap;
      });

      // Add to Live Ticker
      const tickerItem = {
        id: `cap-${Date.now()}-${hexStr}`,
        user: event.new_owner_name || 'Бегун',
        clubColor: event.new_owner_color_hex || '#f97316',
        text: `Захватил гексагон #${hexStr.substring(0, 7)}...`,
        time: 'Только что (WS)',
        score: `+${event.score_at_capture || 400}`
      };
      setTickerEvents((prev) => [tickerItem, ...prev.slice(0, 3)]);
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

  // Viewport change debouncer ref
  const viewportDebounceTimer = React.useRef(null);

  // Handle Viewport changes from MapLibre camera move with smart debounce
  const handleViewportChange = useCallback(({ bounds }) => {
    if (!bounds || wsService.status !== 'connected') return;

    if (viewportDebounceTimer.current) {
      clearTimeout(viewportDebounceTimer.current);
    }

    viewportDebounceTimer.current = setTimeout(() => {
      wsService.subscribeViewport(bounds.swLng, bounds.swLat, bounds.neLng, bounds.neLat);
    }, 250);
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
    setCapturedHexagonsMap(new Map());
    setSelectedH3Index(null);
  };

  // If not logged in, display full LoginPage first
  if (!authenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const capturedCount = Array.from(capturedHexagonsMap.values()).filter((h) => h.is_captured).length;

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Top Header */}
      <Header
        selectedLandmark={selectedLandmark}
        onSelectLandmark={handleSelectLandmark}
        currentMapStyle={mapStyle}
        onSelectMapStyle={setMapStyle}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        userProfile={userProfile}
        wsStatus={wsStatus}
        stats={{
          hexCount: capturedHexagonsMap.size,
          capturedCount: capturedCount
        }}
      />

      {/* Main Map with H3 Res=9 Grid */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapContainer
          capturedHexagonsMap={capturedHexagonsMap}
          selectedH3Index={selectedH3Index}
          onHexagonSelect={handleHexagonSelect}
          centerPosition={centerPosition}
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
