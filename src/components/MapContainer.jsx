import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { KAZAN_CENTER, KAZAN_BOUNDS, MAP_STYLES } from '../services/mockData.js';
import { h3ToPolygonCoordinates, getViewportH3Cells, DEFAULT_H3_RESOLUTION } from '../services/h3Utils.js';

export function MapContainer({
  capturedHexagonsMap, // Map<string, HexagonData>
  selectedH3Index,
  onHexagonSelect,
  centerPosition,
  mapStyle = 'voyager',
  onViewportChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const popupRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewportCells, setViewportCells] = useState([]);
  const currentStyleRef = useRef(mapStyle);

  const onViewportChangeRef = useRef(onViewportChange);
  const onHexagonSelectRef = useRef(onHexagonSelect);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onHexagonSelectRef.current = onHexagonSelect;
  }, [onHexagonSelect]);

  // Compute viewport bounds and generate H3 res=9 cells for visible area
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

      // Generate all H3 res=9 cells covering this viewport
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
        const owner = capturedInfo?.owner;

        return {
          type: 'Feature',
          properties: {
            h3Index: h3Idx,
            isCaptured: isCaptured,
            isSelected: isSelected,
            color: isCaptured ? (owner?.color || capturedInfo?.color || '#f97316') : '#27272a',
            ownerName: isCaptured ? (owner?.name || capturedInfo?.owner_username || 'Бегун') : 'Свободный сектор',
            clubName: isCaptured ? (owner?.club_name || 'URAM Club') : 'URAM Kazan',
            score: capturedInfo?.score || capturedInfo?.top_score || 0
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          }
        };
      })
      .filter(Boolean);
  }, [viewportCells, capturedHexagonsMap, selectedH3Index]);

  // Setup MapLibre vector layers
  const setupLayers = useCallback((map) => {
    if (!map) return;

    if (!map.getSource('h3-hexagons-source')) {
      map.addSource('h3-hexagons-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }

    // Add hexagon layers on top of map features for crisp territorial boundaries
    if (!map.getLayer('h3-hexagons-fill')) {
      map.addLayer({
        id: 'h3-hexagons-fill',
        type: 'fill',
        source: 'h3-hexagons-source',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'case',
            ['boolean', ['get', 'isSelected'], false], 0.62,
            ['boolean', ['get', 'isCaptured'], false], 0.42,
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
            ['boolean', ['get', 'isSelected'], false], '#ffffff',
            ['boolean', ['get', 'isCaptured'], false], ['get', 'color'],
            'rgba(249, 115, 22, 0.38)'
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'isSelected'], false], 3.2,
            ['boolean', ['get', 'isCaptured'], false], 2.2,
            1.15
          ],
          'line-opacity': 0.92
        }
      });
    }
  }, []);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialStyle = MAP_STYLES[mapStyle] || MAP_STYLES.voyager;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [KAZAN_CENTER.lng, KAZAN_CENTER.lat],
      zoom: KAZAN_CENTER.zoom,
      minZoom: 11.0,
      maxZoom: 18.5,
      maxBounds: KAZAN_BOUNDS,
      pitch: 22,
      bearing: 0,
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

      // Initial viewport calculation
      updateViewportAndHexes(map);

      // Listen to map movement/zoom to dynamically load grid & request WS
      map.on('moveend', () => {
        updateViewportAndHexes(map);
      });

      // Mousemove hover
      map.on('mousemove', 'h3-hexagons-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const props = feature.properties;

        const ownerHTML = props.isCaptured
          ? `<div style="display:flex; align-items:center; gap:10px; margin-top:8px;">
               <div style="width:20px; height:20px; border-radius:6px; background:${props.color}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:11px; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
                 ${props.ownerName ? props.ownerName[0].toUpperCase() : 'R'}
               </div>
               <div>
                 <div style="font-weight:700; font-size:12px; color:#ffffff; letter-spacing:-0.2px;">${props.ownerName}</div>
                 <div style="font-size:10px; color:${props.color}; font-family:'JetBrains Mono', monospace; font-weight:600;">${props.clubName}</div>
               </div>
             </div>`
          : `<div style="display:flex; align-items:center; gap:6px; margin-top:6px; font-size:11px; color:#a1a1aa;">
               <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#71717a;"></span>
               <span>Нейтральный сектор</span>
             </div>`;

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 2px;">
              <div style="font-size:10px; font-family:'JetBrains Mono', monospace; color:#71717a; letter-spacing:0.5px; font-weight:600;">CELL: ${props.h3Index}</div>
              ${ownerHTML}
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); font-size:11px;">
                <span style="color:#a1a1aa;">Очки сектора:</span>
                <span style="font-weight:800; color:#f97316; font-family:'JetBrains Mono', monospace;">${props.score || 0} pts</span>
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

  // Update map style when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (currentStyleRef.current === mapStyle) return;
    currentStyleRef.current = mapStyle;

    const targetStyle = MAP_STYLES[mapStyle] || MAP_STYLES.voyager;
    mapInstanceRef.current.setStyle(targetStyle, { diff: false });
  }, [mapStyle]);

  // Update map position on landmark selection
  useEffect(() => {
    if (!mapInstanceRef.current || !centerPosition) return;
    mapInstanceRef.current.flyTo({
      center: [centerPosition.lng, centerPosition.lat],
      zoom: centerPosition.zoom || 15.0,
      pitch: 20,
      duration: 1000
    });
  }, [centerPosition]);

  // Sync GeoJSON source features smoothly without unnecessary flicker
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

  return (
    <div className="relative w-full h-full bg-zinc-950">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

export default MapContainer;
