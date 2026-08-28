import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { Layers, Eye, Compass, Shield, Maximize2, Navigation, X, CheckCircle2 } from 'lucide-react';
import { KAZAN_CENTER, KAZAN_BOUNDS, MAP_STYLES, FACTIONS } from '../services/mockData.js';
import { h3ToPolygonCoordinates, getViewportH3Cells, DEFAULT_H3_RESOLUTION } from '../services/h3Utils.js';

export function MapContainer({
  capturedHexagonsMap, // Map<string, HexagonData>
  selectedH3Index,
  onHexagonSelect,
  centerPosition,
  mapStyle = 'voyager',
  onViewportChange,
  activeRunRoute = null, // Run details with route_points & captured_h3_indices
  onClearActiveRunRoute
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const popupRef = useRef(null);
  const startMarkerRef = useRef(null);
  const finishMarkerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewportCells, setViewportCells] = useState([]);
  const [showLegend, setShowLegend] = useState(true);
  const [pitch3d, setPitch3d] = useState(true);

  const onViewportChangeRef = useRef(onViewportChange);
  const onHexagonSelectRef = useRef(onHexagonSelect);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onHexagonSelectRef.current = onHexagonSelect;
  }, [onHexagonSelect]);

  // Compute viewport bounds and generate H3 cells for visible area
  const updateViewportAndHexes = useCallback((map) => {
    if (!map) return;
    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const viewportBounds = {
        swLng: sw.lng,
        swLat: sw.lat,
        neLng: ne.lng,
        neLat: ne.lat
      };

      const cells = getViewportH3Cells(viewportBounds, DEFAULT_H3_RESOLUTION);
      setViewportCells(cells);

      if (onViewportChangeRef.current) {
        onViewportChangeRef.current({
          lat: map.getCenter().lat,
          lng: map.getCenter().lng,
          bounds: viewportBounds
        });
      }
    } catch (e) {
      console.warn('Error updating viewport H3 cells:', e);
    }
  }, []);

  // Set of H3 cells belonging to active run
  const activeRunHexSet = useMemo(() => {
    if (!activeRunRoute || !activeRunRoute.captured_h3_indices) return new Set();
    return new Set(activeRunRoute.captured_h3_indices);
  }, [activeRunRoute]);

  // Construct GeoJSON features merging visible H3 grid and captured states
  const features = useMemo(() => {
    if (!viewportCells || viewportCells.length === 0) return [];

    return viewportCells
      .map((h3Idx) => {
        const coords = h3ToPolygonCoordinates(h3Idx);
        if (!coords) return null;

        const capturedInfo = capturedHexagonsMap?.get ? capturedHexagonsMap.get(h3Idx) : capturedHexagonsMap?.[h3Idx];
        const isCaptured = Boolean(capturedInfo && (capturedInfo.is_captured || capturedInfo.owner));
        const isSelected = h3Idx === selectedH3Index;
        const isRunHex = activeRunHexSet.has(h3Idx);
        const owner = capturedInfo?.owner;

        // Default or faction color
        let hexColor = isRunHex 
          ? '#2563eb' 
          : (isCaptured ? (owner?.color || capturedInfo?.color || '#fe4a09') : 'rgba(37,99,235,0.06)');

        return {
          type: 'Feature',
          properties: {
            h3Index: h3Idx,
            isCaptured: isCaptured,
            isSelected: isSelected,
            isRunHex: isRunHex,
            color: hexColor,
            ownerName: isCaptured ? (owner?.name || capturedInfo?.owner_username || 'Бегун') : 'Свободный сектор',
            clubName: isCaptured ? (owner?.club_name || 'URAM Team') : 'URAM Kazan',
            score: capturedInfo?.score || capturedInfo?.top_score || 0
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          }
        };
      })
      .filter(Boolean);
  }, [viewportCells, capturedHexagonsMap, selectedH3Index, activeRunHexSet]);

  // GeoJSON LineString for active run route GPS points
  const runRouteGeoJson = useMemo(() => {
    if (!activeRunRoute || !activeRunRoute.route_points || activeRunRoute.route_points.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const coordinates = activeRunRoute.route_points.map(pt => [pt.longitude, pt.latitude]);

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            runId: activeRunRoute.run_id || activeRunRoute.id,
            title: activeRunRoute.title || 'Маршрут забега'
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      ]
    };
  }, [activeRunRoute]);

  // Setup MapLibre vector layers
  const setupLayers = useCallback((map) => {
    if (!map) return;

    // 1. H3 Hexagons Source & Layers
    if (!map.getSource('h3-hexagons-source')) {
      map.addSource('h3-hexagons-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }

    if (!map.getLayer('h3-hexagons-fill')) {
      map.addLayer({
        id: 'h3-hexagons-fill',
        type: 'fill',
        source: 'h3-hexagons-source',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'case',
            ['boolean', ['get', 'isSelected'], false], 0.80,
            ['boolean', ['get', 'isRunHex'], false], 0.65,
            ['boolean', ['get', 'isCaptured'], false], 0.45,
            0.08
          ]
        }
      });
    }

    if (!map.getLayer('h3-hexagons-line')) {
      map.addLayer({
        id: 'h3-hexagons-line',
        type: 'line',
        source: 'h3-hexagons-source',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['get', 'isSelected'], false], '#2563eb',
            ['boolean', ['get', 'isRunHex'], false], '#1d4ed8',
            ['boolean', ['get', 'isCaptured'], false], ['get', 'color'],
            'rgba(37, 99, 235, 0.25)'
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'isSelected'], false], 3.5,
            ['boolean', ['get', 'isRunHex'], false], 3.0,
            ['boolean', ['get', 'isCaptured'], false], 2.2,
            1.0
          ],
          'line-opacity': 0.95
        }
      });
    }

    // 2. Active Run GPS Route Line Source & Layers
    if (!map.getSource('run-route-source')) {
      map.addSource('run-route-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }

    // Casing/Glow layer under route
    if (!map.getLayer('run-route-casing')) {
      map.addLayer({
        id: 'run-route-casing',
        type: 'line',
        source: 'run-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 8.0,
          'line-opacity': 0.85
        }
      });
    }

    // Primary route line
    if (!map.getLayer('run-route-line')) {
      map.addLayer({
        id: 'run-route-line',
        type: 'line',
        source: 'run-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 4.5,
          'line-opacity': 1.0
        }
      });
    }
  }, []);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialStyle = MAP_STYLES.voyager;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [KAZAN_CENTER.lng, KAZAN_CENTER.lat],
      zoom: KAZAN_CENTER.zoom,
      minZoom: 11.0,
      maxZoom: 18.5,
      maxBounds: KAZAN_BOUNDS,
      pitch: pitch3d ? 28 : 0,
      bearing: -8,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    const handleStyleLoad = () => {
      setupLayers(map);
      setMapLoaded(true);
    };

    map.on('style.load', handleStyleLoad);

    map.on('load', () => {
      setupLayers(map);
      setMapLoaded(true);

      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'maplibre-popup-industrial'
      });

      updateViewportAndHexes(map);

      map.on('moveend', () => {
        updateViewportAndHexes(map);
      });

      // Mousemove hover tooltip
      map.on('mousemove', 'h3-hexagons-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const props = feature.properties;

        const ownerHTML = props.isCaptured
          ? `<div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
               <div style="width:22px; height:22px; border-radius:6px; background:${props.color}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:11px; box-shadow:0 2px 5px rgba(0,0,0,0.15);">
                 ${props.ownerName ? props.ownerName[0].toUpperCase() : 'R'}
               </div>
               <div>
                 <div style="font-weight:700; font-size:12px; color:#0f172a;">${props.ownerName}</div>
                 <div style="font-size:10px; color:${props.color}; font-family:'JetBrains Mono', monospace; font-weight:700;">${props.clubName}</div>
               </div>
             </div>`
          : `<div style="display:flex; align-items:center; gap:6px; margin-top:6px; font-size:11px; color:#64748b;">
               <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#94a3b8;"></span>
               <span>Свободный сектор</span>
             </div>`;

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="padding: 2px;">
              <div style="font-size:10px; font-family:'JetBrains Mono', monospace; color:#64748b; font-weight:600;">H3: ${props.h3Index}</div>
              ${ownerHTML}
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:6px; border-top:1px solid rgba(226,232,240,0.9); font-size:11px;">
                <span style="color:#64748b;">Рекорд сектора:</span>
                <span style="font-weight:800; color:#fe4a09; font-family:'JetBrains Mono', monospace;">${props.score || 0} pts</span>
              </div>
            </div>`
          )
          .addTo(map);
      });

      map.on('mouseleave', 'h3-hexagons-fill', () => {
        map.getCanvas().style.cursor = '';
        if (popupRef.current) popupRef.current.remove();
      });

      // Click on Hexagon
      map.on('click', 'h3-hexagons-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const h3Idx = e.features[0].properties.h3Index;
          if (onHexagonSelectRef.current) {
            onHexagonSelectRef.current(h3Idx);
          }
        }
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [setupLayers, updateViewportAndHexes]);

  // Update map position on landmark selection
  useEffect(() => {
    if (!mapInstanceRef.current || !centerPosition) return;
    mapInstanceRef.current.flyTo({
      center: [centerPosition.lng, centerPosition.lat],
      zoom: centerPosition.zoom || 15.0,
      pitch: pitch3d ? 28 : 0,
      duration: 1000
    });
  }, [centerPosition, pitch3d]);

  // Sync GeoJSON source features
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const source = map.getSource('h3-hexagons-source');
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features: features
    });
  }, [mapLoaded, features]);

  // Sync Active Run Route & Fit Bounds
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const routeSource = map.getSource('run-route-source');
    if (routeSource) {
      routeSource.setData(runRouteGeoJson);
    }

    // Clean existing start/finish markers
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (finishMarkerRef.current) {
      finishMarkerRef.current.remove();
      finishMarkerRef.current = null;
    }

    if (activeRunRoute && activeRunRoute.route_points && activeRunRoute.route_points.length > 0) {
      const points = activeRunRoute.route_points;
      const startPt = points[0];
      const finishPt = points[points.length - 1];

      // Add Start Marker (Green / Cyan badge)
      const startEl = document.createElement('div');
      startEl.className = 'w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-lg';
      startEl.innerText = 'START';
      startMarkerRef.current = new maplibregl.Marker({ element: startEl })
        .setLngLat([startPt.longitude, startPt.latitude])
        .addTo(map);

      // Add Finish Marker (Blue / Flag badge)
      const finishEl = document.createElement('div');
      finishEl.className = 'w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-lg';
      finishEl.innerText = 'FINISH';
      finishMarkerRef.current = new maplibregl.Marker({ element: finishEl })
        .setLngLat([finishPt.longitude, finishPt.latitude])
        .addTo(map);

      // Fit bounds to the route
      const bounds = new maplibregl.LngLatBounds();
      points.forEach(pt => bounds.extend([pt.longitude, pt.latitude]));
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 16.5,
        duration: 1200
      });
    }
  }, [mapLoaded, runRouteGeoJson, activeRunRoute]);

  const togglePitch = () => {
    if (!mapInstanceRef.current) return;
    const nextPitch = !pitch3d;
    setPitch3d(nextPitch);
    mapInstanceRef.current.easeTo({
      pitch: nextPitch ? 28 : 0,
      duration: 500
    });
  };

  return (
    <div className="relative w-full h-full bg-[#f0f4f8]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Tactical Layer Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="p-1.5 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl flex items-center gap-1 shadow-lg shadow-slate-900/5">
          {/* 3D Pitch Toggle */}
          <button
            onClick={togglePitch}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              pitch3d 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Переключить 3D перспективу карты"
          >
            {pitch3d ? '3D HUD' : '2D GRID'}
          </button>
        </div>
      </div>

      {/* Active Run Banner when viewing a specific run on map */}
      {activeRunRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 border border-blue-200 backdrop-blur-xl shadow-xl shadow-blue-900/10 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Navigation size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                {activeRunRoute.title || `Просмотр забега #${activeRunRoute.run_id || activeRunRoute.id}`}
              </span>
              <span className="text-[11px] text-blue-600 font-mono font-medium">
                {activeRunRoute.total_distance_meters ? (activeRunRoute.total_distance_meters / 1000).toFixed(2) : (activeRunRoute.distanceKm || '0')} км • {activeRunRoute.captured_h3_indices?.length || 0} сот
              </span>
            </div>
          </div>

          <button
            onClick={onClearActiveRunRoute}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-xs font-bold text-slate-600 transition cursor-pointer"
            title="Вернуться к общей карте города"
          >
            <X size={13} />
            <span>Сбросить</span>
          </button>
        </div>
      )}

      {/* Floating Faction Territory Legend */}
      {showLegend && (
        <div className="absolute bottom-6 left-4 z-20 p-3.5 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl flex flex-col gap-2.5 shadow-xl shadow-slate-900/5 max-w-xs select-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Shield size={13} className="text-blue-600" /> ФРАКЦИОННЫЙ КОНТРОЛЬ
            </span>
            <button 
              onClick={() => setShowLegend(false)}
              className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {FACTIONS.map((f) => (
              <div key={f.id} className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-sm">{f.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-800 truncate">{f.shortName}</span>
                  <span className="text-[10px] font-bold" style={{ color: f.color }}>{f.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapContainer;
