import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LoginPage } from './components/LoginPage.jsx';
import { Header } from './components/Header.jsx';
import { SidebarNav } from './components/SidebarNav.jsx';
import { MapContainer } from './components/MapContainer.jsx';
import { HexInspectorDrawer } from './components/HexInspectorDrawer.jsx';
import { UserAnalyticsView } from './components/UserAnalyticsView.jsx';
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

function loadCachedRunners() {
  try {
    const raw = localStorage.getItem('runuram_runners_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      return new Map(Object.entries(parsed));
    }
  } catch (e) {
    console.warn('Failed to read runners cache:', e);
  }
  return new Map();
}

function saveCachedRunners(runnersMap) {
  try {
    const obj = Object.fromEntries(runnersMap);
    localStorage.setItem('runuram_runners_cache', JSON.stringify(obj));
  } catch (e) {
    // Ignore storage errors
  }
}

export function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [userProfile, setUserProfile] = useState(null);
  const [wsStatus, setWsStatus] = useState(wsService.status);
  const [wsLatency, setWsLatency] = useState(null);

  // App Navigation
  const [currentView, setCurrentView] = useState('map'); // 'map' | 'analytics' | 'factions'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Cache of known runner profiles: userId -> { username, color }
  const knownRunnersRef = useRef(loadCachedRunners());
  // Cache of requested hexagon details to prevent duplicate queries
  const requestedHexDetailsRef = useRef(new Set());

  // Map state
  const [selectedLandmark, setSelectedLandmark] = useState(KAZAN_LANDMARKS[0]);
  const [centerPosition, setCenterPosition] = useState(KAZAN_CENTER);

  // Protobuf realtime state
  const [capturedHexagonsMap, setCapturedHexagonsMap] = useState(new Map());
  const [selectedH3Index, setSelectedH3Index] = useState(null);
  const [hexagonDetails, setHexagonDetails] = useState(null);
  const [latestCapture, setLatestCapture] = useState(null);

  // Run Details & History State
  const [selectedRunForModal, setSelectedRunForModal] = useState(null);
  const [activeRunRoute, setActiveRunRoute] = useState(null);

  // Modals & events
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfileModalData, setActiveProfileModalData] = useState(null);
  const [isViewingOwnProfile, setIsViewingOwnProfile] = useState(true);
  const [tickerEvents, setTickerEvents] = useState([]);

  // Open player profile handler (0 = own, or any runner user_id)
  const handleOpenProfile = (userId = 0) => {
    if (!userId || userId === 0 || (userProfile && String(userId) === String(userProfile.user_id))) {
      setIsViewingOwnProfile(true);
      setActiveProfileModalData(userProfile);
      setShowProfileModal(true);
      if (wsService.status === 'connected') {
        wsService.requestUserProfile(0);
      }
    } else {
      setIsViewingOwnProfile(false);
      const cached = knownRunnersRef.current.get(String(userId));
      setActiveProfileModalData({
        user_id: userId,
        username: cached?.username || `Атлет #${userId}`,
        player_color_hex: cached?.color || getRunnerColor(userId),
        team_name: 'URAM Team',
        team_tag: 'URAM',
        team_color_hex: cached?.color || getRunnerColor(userId),
        total_distance_meters: 0,
        total_duration_seconds: 0,
        total_runs: 0,
        total_uram_points: 0,
        current_held_hexagons: 0
      });
      setShowProfileModal(true);
      if (wsService.status === 'connected') {
        wsService.requestUserProfile(userId);
      }
    }
  };

  // WebSocket listeners and lifecycle
  useEffect(() => {
    if (!authenticated) return;

    // 1. Connection status & latency
    const unsubStatus = wsService.on('status', ({ status }) => {
      setWsStatus(status);
    });

    const unsubLatency = wsService.on('latency', (latency) => {
      setWsLatency(latency);
    });

    // 2. UserProfile Protobuf response
    const unsubProfile = wsService.on('user_profile_response', (profile) => {
      if (profile) {
        console.log('[WebSocket] Received user profile:', profile);
        setUserProfile((prev) => ({
          ...prev,
          ...profile
        }));

        setActiveProfileModalData((prev) => {
          if (!prev) return profile;
          if (!profile.user_id || String(profile.user_id) === String(prev.user_id)) {
            return { ...prev, ...profile };
          }
          return prev;
        });

        if (profile.user_id && profile.username) {
          const color = profile.player_color_hex || getRunnerColor(profile.user_id);
          knownRunnersRef.current.set(String(profile.user_id), {
            username: profile.username,
            color: color
          });
          saveCachedRunners(knownRunnersRef.current);
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

    // 5. Viewport Protobuf response (2.1)
    const unsubViewport = wsService.on('subscribe_viewport_response', (resp) => {
      if (resp && resp.hexagons) {
        const unknownHexesToResolve = [];

        setCapturedHexagonsMap((prevMap) => {
          const newMap = new Map(prevMap);

          resp.hexagons.forEach((hex) => {
            const hexStr = h3Uint64ToHexString(hex.h3_index);
            const rawOwner = hex.owner_username?.trim();
            const userIdStr = hex.owner_user_id ? String(hex.owner_user_id) : null;
            const topScore = hex.top_score || 0;

            const isCaptured = Boolean(
              (rawOwner && rawOwner !== '' && rawOwner !== 'Бегун') ||
              (userIdStr && userIdStr !== '0') ||
              topScore > 0
            );

            if (isCaptured) {
              const cachedRunner = userIdStr ? knownRunnersRef.current.get(userIdStr) : null;
              const hasExplicitName = rawOwner && rawOwner !== '' && rawOwner !== 'Бегун' && rawOwner !== 'Атлет';
              const hasExplicitColor = hex.owner_color_hex && hex.owner_color_hex.startsWith('#') && hex.owner_color_hex.length >= 4 && hex.owner_color_hex !== '#000000';

              const ownerName = hasExplicitName
                ? rawOwner
                : (cachedRunner?.username || (userIdStr && userIdStr !== '0' ? `Атлет #${userIdStr}` : 'Бегун'));

              const ownerColor = hasExplicitColor
                ? hex.owner_color_hex
                : (cachedRunner?.color || getRunnerColor(userIdStr, hex.owner_color_hex));

              if (userIdStr && hasExplicitName) {
                knownRunnersRef.current.set(userIdStr, {
                  username: rawOwner,
                  color: ownerColor
                });
                saveCachedRunners(knownRunnersRef.current);
              }

              // Collect up to 3 unknown runners to resolve in background
              if (userIdStr && !cachedRunner && !hasExplicitName && !requestedHexDetailsRef.current.has(hexStr)) {
                requestedHexDetailsRef.current.add(hexStr);
                unknownHexesToResolve.push(hexStr);
              }

              newMap.set(hexStr, {
                h3_index: hexStr,
                is_captured: true,
                score: topScore,
                top_score: topScore,
                owner: {
                  id: userIdStr,
                  name: ownerName,
                  color: ownerColor,
                  club_name: 'URAM Team'
                }
              });
            } else {
              newMap.delete(hexStr);
            }
          });

          return newMap;
        });

        // Resolve unknown runners in background smoothly
        if (unknownHexesToResolve.length > 0 && wsService.status === 'connected') {
          unknownHexesToResolve.slice(0, 3).forEach((h3Idx, idx) => {
            setTimeout(() => {
              if (wsService.status === 'connected') {
                wsService.requestHexagonDetails(h3Idx);
              }
            }, (idx + 1) * 200);
          });
        }
      }
    });

    // 6. Hexagon Details Protobuf response (2.3)
    const unsubHexDetails = wsService.on('hexagon_details_response', (details) => {
      if (details) {
        setHexagonDetails(details);

        if (details.state && details.state.h3_index) {
          const hexStr = h3Uint64ToHexString(details.state.h3_index);
          const topLeader = details.leaderboard && details.leaderboard.length > 0 ? details.leaderboard[0] : null;
          const rawOwnerName = details.state.owner_username?.trim();
          const topScore = details.state.top_score || topLeader?.uram_points || 0;
          const rawOwnerId = details.state.owner_user_id || topLeader?.user_id;
          const userIdStr = rawOwnerId ? String(rawOwnerId) : null;

          const isCaptured = Boolean(
            (rawOwnerName && rawOwnerName !== '') ||
            (rawOwnerId && String(rawOwnerId) !== '0') ||
            topScore > 0 ||
            topLeader
          );

          if (isCaptured) {
            const finalOwnerName = (rawOwnerName && rawOwnerName !== '' && rawOwnerName !== 'Бегун')
              ? rawOwnerName
              : (topLeader?.username || (userIdStr ? `Атлет #${userIdStr}` : 'Бегун'));

            const finalOwnerColor = (details.state.owner_color_hex && details.state.owner_color_hex.startsWith('#') && details.state.owner_color_hex !== '#000000')
              ? details.state.owner_color_hex
              : (topLeader?.player_color_hex || getRunnerColor(rawOwnerId));

            if (userIdStr && finalOwnerName && finalOwnerName !== 'Бегун') {
              knownRunnersRef.current.set(userIdStr, {
                username: finalOwnerName,
                color: finalOwnerColor
              });
              saveCachedRunners(knownRunnersRef.current);
            }

            setCapturedHexagonsMap((prevMap) => {
              const newMap = new Map(prevMap);
              newMap.set(hexStr, {
                h3_index: hexStr,
                is_captured: true,
                score: topScore,
                top_score: topScore,
                owner: {
                  id: userIdStr,
                  name: finalOwnerName,
                  color: finalOwnerColor,
                  club_name: 'URAM Team'
                }
              });

              // Propagate real runner name and color to ALL their sectors on the map
              if (userIdStr) {
                for (const [k, v] of newMap.entries()) {
                  if (v.owner?.id === userIdStr && (v.owner?.color !== finalOwnerColor || v.owner?.name !== finalOwnerName)) {
                    newMap.set(k, {
                      ...v,
                      owner: {
                        ...v.owner,
                        name: finalOwnerName,
                        color: finalOwnerColor
                      }
                    });
                  }
                }
              }

              return newMap;
            });
          }
        }
      }
    });

    // 7. Hexagon Capture Realtime Pub/Sub Event (2.2)
    const unsubCapture = wsService.on('hexagon_capture_event', (event) => {
      const hexStr = h3Uint64ToHexString(event.h3_index);
      const newColor = event.new_owner_color_hex || '#fe4a09';
      const runnerName = event.new_owner_name || 'Бегун';
      const score = event.score_at_capture || 400;

      setCapturedHexagonsMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(hexStr, {
          h3_index: hexStr,
          is_captured: true,
          score: score,
          top_score: score,
          owner: {
            id: event.new_owner_id,
            name: runnerName,
            color: newColor,
            club_name: 'URAM Team'
          }
        });
        return newMap;
      });

      // Trigger realtime map pulse/flash animation on the captured hexagon
      setLatestCapture({
        h3Index: hexStr,
        color: newColor,
        timestamp: Date.now()
      });

      const tickerItem = {
        id: `cap-${Date.now()}-${hexStr}`,
        user: runnerName,
        clubColor: newColor,
        text: `захватил сектор #${hexStr.substring(0, 8)}...`,
        time: 'Только что (Live)',
        score: `+${score} PTS`
      };
      setTickerEvents((prev) => [tickerItem, ...prev.slice(0, 4)]);
    });

    wsService.connect();

    return () => {
      unsubStatus();
      unsubLatency();
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
    const loginName = user?.username || authData.user?.username || authData.user?.login || 'Атлет';
    setUserProfile({
      username: loginName,
      player_color_hex: getRunnerColor(user?.id || 0),
      total_distance_meters: 0,
      total_duration_seconds: 0,
      total_runs: 0,
      total_uram_points: 0,
      current_held_hexagons: 0
    });
    if (wsService.status === 'connected') {
      wsService.requestUserProfile(0);
    }
  };

  const handleLogout = () => {
    clearSession();
    wsService.disconnect();
    setAuthenticated(false);
    setUserProfile(null);
    setActiveProfileModalData(null);
    setCapturedHexagonsMap(new Map());
    setSelectedH3Index(null);
    setActiveRunRoute(null);
  };

  // Run selection handler: opens RunDetailsModal or requests from WS
  const handleSelectRun = (run) => {
    if (wsService.status === 'connected' && run.run_id) {
      wsService.requestRunDetails(run.run_id);
    }
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
          onOpenProfile={() => handleOpenProfile(0)}
          onLogout={handleLogout}
          userProfile={userProfile}
          wsStatus={wsStatus}
          wsLatency={wsLatency}
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
              latestCapture={latestCapture}
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
                onSelectRunner={(runnerUserId) => handleOpenProfile(runnerUserId)}
              />
            )}

            {/* Realtime Live Ticker */}
            <LiveTicker events={tickerEvents} />
          </div>

          {/* USER ANALYTICS VIEW */}
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
        </div>
      </div>

      {/* User / Runner Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profileData={activeProfileModalData || userProfile}
        isOwnProfile={isViewingOwnProfile}
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

