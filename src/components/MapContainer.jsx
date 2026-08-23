import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { KAZAN_CENTER, KAZAN_BOUNDS, MAP_STYLES } from '../services/mockData.js';
import { h3ToPolygonCoordinates } from '../services/h3Utils.js';

export function MapContainer({
  hexagons,
  selectedH3Index,
  onHexagonSelect,
  centerPosition,
  h3Resolution,
  mapStyle = 'voyager',
  onViewportChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const popupRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const currentStyleRef = useRef(mapStyle);

  const onViewportChangeRef = useRef(onViewportChange);
  const onHexagonSelectRef = useRef(onHexagonSelect);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onHexagonSelectRef.current = onHexagonSelect;
  }, [onHexagonSelect]);

  const emitViewportBounds = useCallback((map) => {
    if (!map || !onViewportChangeRef.current) return;
    try {
      const center = map.getCenter();
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      onViewportChangeRef.current({
        lat: center.lat,
        lng: center.lng,
        bounds: {
          swLng: sw.lng,
          swLat: sw.lat,
          neLng: ne.lng,
          neLat: ne.lat
        }
      });
    } catch (e) {
      console.warn('Error computing viewport bounds:', e);
    }
  }, []);

  const buildFeatures = useCallback(() => {
    return hexagons
      .map((hex) => {
        const coords = h3ToPolygonCoordinates(hex.h3_index);
        if (!coords) return null;

        const isSelected = hex.h3_index === selectedH3Index;
        const owner = hex.owner;
        const isCaptured = Boolean(hex.is_captured || (owner && owner.name));

        return {
          type: 'Feature',
          properties: {
            h3Index: hex.h3_index,
            isCaptured: isCaptured,
            isSelected: isSelected,
            color: owner?.color || hex.color || '#27272a',
            ownerName: owner?.name || hex.owner_username || 'Свободный сектор',
            ownerAvatar: owner?.avatar || '',
            clubName: owner?.club_name || hex.team_tag || 'Running Club',
            score: hex.score || hex.top_score || 0
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          }
        };
      })
      .filter(Boolean);
  }, [hexagons, selectedH3Index]);

  const setupLayers = useCallback((map) => {
    if (!map) return;

    if (!map.getSource('h3-hexagons-source')) {
      map.addSource('h3-hexagons-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: buildFeatures()
        }
      });
    }

    const layers = map.getStyle().layers || [];
    let firstLabelLayerId = undefined;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstLabelLayerId = layers[i].id;
        break;
      }
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
            ['boolean', ['get', 'isSelected'], false], 0.60,
            ['boolean', ['get', 'isCaptured'], false], 0.38,
            0.08
          ]
        }
      }, firstLabelLayerId);
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
            'rgba(255, 255, 255, 0.15)'
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'isSelected'], false], 2.5,
            ['boolean', ['get', 'isCaptured'], false], 1.5,
            0.8
          ],
          'line-opacity': 0.85
        }
      }, firstLabelLayerId);
    }
  }, [buildFeatures]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialStyle = MAP_STYLES[mapStyle] || MAP_STYLES.voyager;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [KAZAN_CENTER.lng, KAZAN_CENTER.lat],
      zoom: KAZAN_CENTER.zoom,
      minZoom: 9.5,
      maxZoom: 18.5,
      maxBounds: KAZAN_BOUNDS,
      pitch: 20,
      bearing: 0,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('style.load', () => {
      setupLayers(map);
      setMapLoaded(true);
    });

    map.on('load', () => {
      setupLayers(map);
      setMapLoaded(true);

      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'maplibre-popup-industrial'
      });

      // Fire initial bounds
      emitViewportBounds(map);

      // Listen to map movement/pan/zoom to dynamically load hexes via WebSocket
      map.on('moveend', () => {
        emitViewportBounds(map);
      });

      // Mousemove hover
      map.on('mousemove', 'h3-hexagons-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const props = feature.properties;

        const ownerHTML = props.isCaptured
          ? `<div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
               <div style="width:16px; height:16px; border-radius:4px; background:${props.color};"></div>
               <div>
                 <div style="font-weight:600; font-size:12px; color:#f4f4f5;">${props.ownerName}</div>
                 <div style="font-size:10px; color:${props.color}; font-family:'JetBrains Mono', monospace; font-weight:500;">${props.clubName}</div>
               </div>
             </div>`
          : `<div style="font-size:11px; color:#71717a; margin-top:4px; font-mono">Свободный сектор H3</div>`;

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family: 'Plus Jakarta Sans', sans-serif;">
              <div style="font-size:10px; font-family:'JetBrains Mono', monospace; color:#71717a; letter-spacing:0.5px;">CELL: ${props.h3Index}</div>
              ${ownerHTML}
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.08); font-size:11px;">
                <span style="color:#71717a;">Очки сектора:</span>
                <span style="font-weight:700; color:#f97316; font-family:'JetBrains Mono', monospace;">${props.score || 0} pts</span>
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
  }, [emitViewportBounds, setupLayers]);

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
      zoom: centerPosition.zoom || 14.5,
      pitch: 20,
      duration: 1200
    });
  }, [centerPosition]);

  // Sync GeoJSON source features
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const source = map.getSource('h3-hexagons-source');
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features: buildFeatures()
    });
  }, [mapLoaded, hexagons, selectedH3Index, buildFeatures]);

  return (
    <div className="relative w-full h-full bg-zinc-950">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

export default MapContainer;
