import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LoginPage } from './components/LoginPage.jsx';
import { Header } from './components/Header.jsx';
import { SidebarNav } from './components/SidebarNav.jsx';
import { MapContainer } from './components/MapContainer.jsx';
import { HexInspectorDrawer } from './components/HexInspectorDrawer.jsx';
import { UserAnalyticsView } from './components/UserAnalyticsView.jsx';
import { FactionLeaderboardView } from './components/FactionLeaderboardView.jsx';
import { UserProfileModal } from './components/UserProfileModal.jsx';
import { RunDetailsModal } from './components/RunDetailsModal.jsx';
import { LiveTicker } from './components/LiveTicker.jsx';

import { KAZAN_CENTER, KAZAN_LANDMARKS, MOCK_RUNS_HISTORY } from './services/mockData.js';
import { isAuthenticated, getStoredUser, clearSession } from './services/authService.js';
import wsService from './services/wsService.js';
import { h3Uint64ToHexString } from './services/protoService.js';

// Runner palette for consistent distinct player colors across the map
const RUNNER_PALETTE = [
  '#fe4a09', // Electric Orange
  '#2563eb', // Vibrant Blue
  '#0284c7', // Cyber Cyan
  '#10b981', // Neon Emerald
  '#7c3aed', // Laser Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6'  // Teal
];

function getRunnerColor(userId, providedColor) {
  if (providedColor && providedColor.startsWith('#') && providedColor.length >= 4 && providedColor !== '#000000' && providedColor !== '#27272a') {
    return providedColor;
  }
  if (!userId || userId === '0' || userId === 0) return '#fe4a09';
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

  // App Navigation
  const [currentView, setCurrentView] = useState('map'); // 'map' | 'analytics' | 'factions'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Cache of known runner profiles: userId -> { username, color }
  const knownRunnersRef = useRef(new Map());
  // Cache of requested hexagon details to prevent duplicate queries
  const requestedHexDetailsRef = useRef(new Set());

  // Map state
  const [selectedLandmark, setSelectedLandmark] = useState(KAZAN_LANDMARKS[0]);
  const [centerPosition, setCenterPosition] = useState(KAZAN_CENTER);

  // Protobuf realtime state
  const [capturedHexagonsMap, setCapturedHexagonsMap] = useState(new Map());
  const [selectedH3Index, setSelectedH3Index] = useState(null);
  const [hexagonDetails, setHexagonDetails] = useState(null);

  // Run Details & History State
  const [selectedRunForModal, setSelectedRunForModal] = useState(null);
  const [activeRunRoute, setActiveRunRoute] = useState(null);

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
        setUserProfile((prev) => ({
          ...prev,
          ...profile
        }));
        if (profile.user_id && profile.username) {
          knownRunnersRef.current.set(String(profile.user_id), {
            username: profile.username,
            color: profile.player_color_hex || getRunnerColor(profile.user_id)
          });
        }
      }
    });

    // 3. User Runs Protobuf response
    const unsubUserRuns = wsService.on('get_user_runs_response', (resp) => {
      if (resp && resp.runs) {
        console.log('[WebSocket] Received user runs history:', resp.runs);
      }
    });

    // 4. Run Details Protobuf response
    const unsubRunDetails = wsService.on('get_run_details_response', (resp) => {
      if (resp) {
        console.log('[WebSocket] Received run details:', resp);
        const detailedRun = {
          ...resp.summary,
          route_points: resp.route_points,
          captured_h3_indices: (resp.captured_h3_indices || []).map(idx => h3Uint64ToHexString(idx))
        };
        setSelectedRunForModal(detailedRun);
      }
    });

    // 5. Viewport Protobuf response
    const unsubViewport = wsService.on('subscribe_viewport_response', (resp) => {
      if (resp && resp.hexagons) {
        if (resp.hexagons.length === 0) return;

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

            const cachedRunner = userIdStr ? knownRunnersRef.current.get(userIdStr) : null;
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

    // 6. Hexagon Details Protobuf response
    const unsubHexDetails = wsService.on('hexagon_details_response', (details) => {
      if (details) {
        setHexagonDetails(details);

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

              return newMap;
            });
          }
        }
      }
    });

    // 7. Hexagon Capture Realtime Pub/Sub Event
    const unsubCapture = wsService.on('hexagon_capture_event', (event) => {
      const hexStr = h3Uint64ToHexString(event.h3_index);

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
            color: event.new_owner_color_hex || '#fe4a09',
            club_name: 'URAM Club'
          }
        });
        return newMap;
      });

      const tickerItem = {
        id: `cap-${Date.now()}-${hexStr}`,
        user: event.new_owner_name || 'Бегун',
        clubColor: event.new_owner_color_hex || '#fe4a09',
        text: `Захватил гексагон #${hexStr.substring(0, 7)}...`,
        time: 'Только что (WS)',
        score: `+${event.score_at_capture || 400}`
      };
      setTickerEvents((prev) => [tickerItem, ...prev.slice(0, 3)]);
    });

    wsService.connect();

    return () => {
      unsubStatus();
      unsubProfile();
      unsubUserRuns();
      unsubRunDetails();
      unsubViewport();
      unsubHexDetails();
      unsubCapture();
    };
  }, [authenticated]);

  const viewportDebounceTimer = useRef(null);

  const handleViewportChange = useCallback(({ bounds }) => {
    if (!bounds || wsService.status !== 'connected') return;

    if (viewportDebounceTimer.current) {
      clearTimeout(viewportDebounceTimer.current);
    }

    viewportDebounceTimer.current = setTimeout(() => {
      wsService.subscribeViewport(bounds.swLng, bounds.swLat, bounds.neLng, bounds.neLat);
    }, 250);
  }, []);

  const handleHexagonSelect = (h3Index) => {
    setSelectedH3Index(h3Index);
    setHexagonDetails(null);
    if (wsService.status === 'connected') {
      wsService.requestHexagonDetails(h3Index);
    }
  };

  const handleSelectLandmark = (landmark) => {
    setSelectedLandmark(landmark);
    setCenterPosition({
      lat: landmark.lat,
      lng: landmark.lng,
      zoom: landmark.zoom
    });
  };

  const handleLoginSuccess = (authData) => {
    setAuthenticated(true);
    const user = getStoredUser();
    setUserProfile((prev) => ({
      ...prev,
      username: user?.username || authData.user?.username || 'smayflks',
      avatar_url: '/app_icon_stylized_run_svg.svg',
      team_name: 'Zilant Cyber-Runners',
      team_tag: 'ZLT',
      team_color_hex: '#fe4a09',
      total_distance_meters: 184600,
      total_duration_seconds: 54200,
      total_runs: 16,
      total_uram_points: 3380,
      current_held_hexagons: 42
    }));
  };

  const handleLogout = () => {
    clearSession();
    wsService.disconnect();
    setAuthenticated(false);
    setUserProfile(null);
    setCapturedHexagonsMap(new Map());
    setSelectedH3Index(null);
    setActiveRunRoute(null);
  };

  // Run selection handler: opens RunDetailsModal or requests from WS
  const handleSelectRun = (run) => {
    if (wsService.status === 'connected' && run.run_id) {
      wsService.requestRunDetails(run.run_id);
    }
    // Fallback / immediate data
    setSelectedRunForModal(run);
  };

  // View route on main map
  const handleViewRunOnMap = (run) => {
    setActiveRunRoute(run);
    setCurrentView('map');
  };

  if (!authenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const capturedCount = Array.from(capturedHexagonsMap.values()).filter((h) => h.is_captured).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f8]">
      {/* 1. Tactical Command Sidebar Navigation */}
      <SidebarNav
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Viewport Container */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Tactical HUD Header */}
        <Header
          selectedLandmark={selectedLandmark}
          onSelectLandmark={handleSelectLandmark}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={handleLogout}
          userProfile={userProfile}
          wsStatus={wsStatus}
          currentView={currentView}
          stats={{
            hexCount: capturedHexagonsMap.size,
            capturedCount: capturedCount
          }}
        />

        {/* View Switcher: Map Canvas | User Analytics | Faction Leaderboards */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* MAP VIEW */}
          <div className={`w-full h-full ${currentView === 'map' ? 'block' : 'hidden'}`}>
            <MapContainer
              capturedHexagonsMap={capturedHexagonsMap}
              selectedH3Index={selectedH3Index}
              onHexagonSelect={handleHexagonSelect}
              centerPosition={centerPosition}
              mapStyle="voyager"
              onViewportChange={handleViewportChange}
              activeRunRoute={activeRunRoute}
              onClearActiveRunRoute={() => setActiveRunRoute(null)}
            />

            {/* Selected Hexagon Inspector Drawer */}
            {selectedH3Index && (
              <HexInspectorDrawer
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

          {/* USER ANALYTICS & RUN HISTORY VIEW */}
          {currentView === 'analytics' && (
            <UserAnalyticsView
              userProfile={userProfile}
              onOpenHexOnMap={(h3Idx) => {
                setSelectedH3Index(h3Idx);
                setCurrentView('map');
              }}
              onSelectRun={handleSelectRun}
            />
          )}

          {/* FACTIONS & DISTRICT DOMINATION VIEW */}
          {currentView === 'factions' && (
            <FactionLeaderboardView
              onSelectDistrict={(dist) => {
                setCurrentView('map');
              }}
            />
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profileData={userProfile}
        onLogout={handleLogout}
      />

      {/* Run Details Modal */}
      <RunDetailsModal
        isOpen={Boolean(selectedRunForModal)}
        onClose={() => setSelectedRunForModal(null)}
        runData={selectedRunForModal}
        onViewOnMap={handleViewRunOnMap}
        onSelectHex={(hexStr) => {
          setSelectedRunForModal(null);
          setSelectedH3Index(hexStr);
          setCurrentView('map');
        }}
      />
    </div>
  );
}

export default App;
