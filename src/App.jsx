import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header.jsx';
import { MapContainer } from './components/MapContainer.jsx';
import { HexagonDetailModal } from './components/HexagonDetailModal.jsx';
import { LeaderboardPanel } from './components/LeaderboardPanel.jsx';
import { RunSimulator } from './components/RunSimulator.jsx';
import { LiveTicker } from './components/LiveTicker.jsx';
import { ApiExplorerModal } from './components/ApiExplorerModal.jsx';

import { getHexagonsInArea } from './services/api.js';
import { KAZAN_CENTER, KAZAN_LANDMARKS, INITIAL_TICKER_EVENTS } from './services/mockData.js';
import { getKRingHexes, getH3Index, updateHexOwner } from './services/h3Utils.js';

export function App() {
  const [selectedLandmark, setSelectedLandmark] = useState(KAZAN_LANDMARKS[0]);
  const [h3Resolution, setH3Resolution] = useState(9);
  const [centerPosition, setCenterPosition] = useState(KAZAN_CENTER);

  const [hexagons, setHexagons] = useState([]);
  const [selectedH3Index, setSelectedH3Index] = useState(null);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showApiExplorer, setShowApiExplorer] = useState(false);

  const [tickerEvents, setTickerEvents] = useState(INITIAL_TICKER_EVENTS);

  // Stats calculation
  const capturedHexesCount = hexagons.filter((h) => h.is_captured).length;

  // Dynamic API Fetcher for current map center / viewport coordinates
  const fetchAreaHexagons = useCallback((lat, lng, res = h3Resolution) => {
    getHexagonsInArea({
      lat,
      lng,
      radius: 4, // Radius 4 gives ~61 hexes total, exactly ~18-20 hexes across the viewport diameter
      resolution: res
    }).then((data) => {
      setHexagons(data.hexagons || []);
    });
  }, [h3Resolution]);

  // Initial load & resolution change
  useEffect(() => {
    fetchAreaHexagons(centerPosition.lat, centerPosition.lng, h3Resolution);
  }, [centerPosition.lat, centerPosition.lng, h3Resolution, fetchAreaHexagons]);

  // Handle Landmark Selection
  const handleSelectLandmark = (landmark) => {
    setSelectedLandmark(landmark);
    const newPos = {
      lat: landmark.lat,
      lng: landmark.lng,
      zoom: landmark.zoom
    };
    setCenterPosition(newPos);
    fetchAreaHexagons(landmark.lat, landmark.lng, h3Resolution);
  };

  // Handle Map Panning/Movement by user -> dynamically query API for new viewport hexes!
  const handleViewportChange = useCallback(({ lat, lng }) => {
    fetchAreaHexagons(lat, lng, h3Resolution);
  }, [fetchAreaHexagons, h3Resolution]);

  // Handle Hexagon Click
  const handleHexagonSelect = (h3Index) => {
    setSelectedH3Index(h3Index);
  };

  // Handle Run Simulation Hex Capture
  const handleSimulateCapture = (runner, routePreset) => {
    const centerH3 = getH3Index(centerPosition.lat, centerPosition.lng, h3Resolution);
    const ring = getKRingHexes(centerH3, 3);
    const randomHexIndex = ring[Math.floor(Math.random() * ring.length)];

    const updated = updateHexOwner(randomHexIndex, runner, 400);

    setHexagons((prev) =>
      prev.map((h) => (h.h3_index === randomHexIndex ? updated : h))
    );

    const newEvent = {
      id: `evt-${Date.now()}`,
      user: runner.name,
      clubColor: runner.club.color,
      text: `Захвачен сектор при забеге (${routePreset === 'uram' ? 'УРАМ' : 'Кремль'})`,
      time: 'Только что',
      score: '+400'
    };

    setTickerEvents((prev) => [newEvent, ...prev.slice(0, 2)]);
    setSelectedH3Index(randomHexIndex);
  };

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Navigation Header */}
      <Header
        selectedLandmark={selectedLandmark}
        onSelectLandmark={handleSelectLandmark}
        h3Resolution={h3Resolution}
        onChangeResolution={(res) => setH3Resolution(res)}
        onToggleLeaderboard={() => setShowLeaderboard((prev) => !prev)}
        onToggleSimulator={() => setShowSimulator((prev) => !prev)}
        onToggleApiExplorer={() => setShowApiExplorer(true)}
        stats={{
          hexCount: hexagons.length,
          capturedCount: capturedHexesCount,
          activeRunners: 42
        }}
      />

      {/* Map Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapContainer
          hexagons={hexagons}
          selectedH3Index={selectedH3Index}
          onHexagonSelect={handleHexagonSelect}
          centerPosition={centerPosition}
          h3Resolution={h3Resolution}
          onViewportChange={handleViewportChange}
        />

        {/* Selected Hexagon Detail Drawer (GET /api/v1/hexagons/{h3_index}) */}
        {selectedH3Index && (
          <HexagonDetailModal
            h3Index={selectedH3Index}
            onClose={() => setSelectedH3Index(null)}
            onCaptureHexagon={(h3Idx) => {
              const defaultRunner = {
                id: 999,
                name: 'Атлет (Текущий игрок)',
                handle: '@current_runner',
                avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2318181b"/><circle cx="50" cy="38" r="18" fill="%2371717a"/><path d="M20 85 C20 62 34 52 50 52 C66 52 80 62 80 85 Z" fill="%2371717a"/></svg>`,
                club: { name: 'Incomsystem', badge: '⚡', color: '#f97316' },
                avgPace: '4:10 мин/км'
              };
              const updated = updateHexOwner(h3Idx, defaultRunner, 500);
              setHexagons((prev) => prev.map((h) => (h.h3_index === h3Idx ? updated : h)));
              setSelectedH3Index(h3Idx);
            }}
          />
        )}

        {/* Leaderboard Panel (GET /api/v1/leaderboard) */}
        {showLeaderboard && (
          <LeaderboardPanel
            onClose={() => setShowLeaderboard(false)}
            onSelectRunnerHexes={() => {}}
          />
        )}

        {/* Run Simulator */}
        {showSimulator && (
          <RunSimulator
            onClose={() => setShowSimulator(false)}
            onSimulateCapture={handleSimulateCapture}
          />
        )}

        {/* Live Event Ticker */}
        <LiveTicker events={tickerEvents} />
      </div>

      {/* API Explorer Modal */}
      {showApiExplorer && (
        <ApiExplorerModal
          currentH3Index={selectedH3Index}
          onClose={() => setShowApiExplorer(false)}
        />
      )}
    </div>
  );
}
