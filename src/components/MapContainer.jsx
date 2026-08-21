import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { KAZAN_CENTER, KAZAN_BOUNDS } from '../services/mockData.js';
import { h3ToPolygonCoordinates } from '../services/h3Utils.js';

export function MapContainer({
  hexagons,
  selectedH3Index,
  onHexagonSelect,
  centerPosition,
  h3Resolution,
  onViewportChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const popupRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize MapLibre GL Map locked to Kazan and constrained zoom
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [KAZAN_CENTER.lng, KAZAN_CENTER.lat],
      zoom: KAZAN_CENTER.zoom,
      minZoom: 12.5,   // Constrain zoom so diameter is max ~20 hexes
      maxZoom: 17.5,   // High precision zoom
      maxBounds: KAZAN_BOUNDS,
      pitch: 25,
      bearing: 0,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);

      // Add Hexagon GeoJSON Source
      map.addSource('h3-hexagons-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Layer 1: Hexagon Fill
      map.addLayer({
        id: 'h3-hexagons-fill',
        type: 'fill',
        source: 'h3-hexagons-source',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'case',
            ['boolean', ['get', 'isSelected'], false], 0.45,
            ['boolean', ['get', 'isCaptured'], false], 0.22,
            0.05
          ]
        }
      });

      // Layer 2: Hexagon Border
      map.addLayer({
        id: 'h3-hexagons-line',
        type: 'line',
        source: 'h3-hexagons-source',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['get', 'isSelected'], false], '#ffffff',
            ['boolean', ['get', 'isCaptured'], false], ['get', 'color'],
            'rgba(255, 255, 255, 0.12)'
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'isSelected'], false], 2.5,
            ['boolean', ['get', 'isCaptured'], false], 1.2,
            0.8
          ],
          'line-opacity': 0.85
        }
      });

      // Hover Popup
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'maplibre-popup-industrial'
      });

      // Listen to map movement/pan/zoom to dynamically load hexes for user viewport
      map.on('moveend', () => {
        const center = map.getCenter();
        if (onViewportChange) {
          onViewportChange({ lat: center.lat, lng: center.lng });
        }
      });

      // Mousemove
      map.on('mousemove', 'h3-hexagons-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const props = feature.properties;

        const ownerHTML = props.isCaptured
          ? `<div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
               <img src="${props.ownerAvatar}" style="width:22px; height:22px; border-radius:6px; object-fit:cover; border:1px solid rgba(255,255,255,0.2);" />
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
        popupRef.current.remove();
      });

      // Click
      map.on('click', 'h3-hexagons-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const h3Idx = e.features[0].properties.h3Index;
          onHexagonSelect(h3Idx);
        }
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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

    const features = hexagons
      .map((hex) => {
        const coords = h3ToPolygonCoordinates(hex.h3_index);
        if (!coords) return null;

        const isSelected = hex.h3_index === selectedH3Index;
        const owner = hex.owner;

        return {
          type: 'Feature',
          properties: {
            h3Index: hex.h3_index,
            isCaptured: hex.is_captured,
            isSelected: isSelected,
            color: owner ? owner.color : '#27272a',
            ownerName: owner ? owner.name : 'Свободный сектор',
            ownerAvatar: owner ? owner.avatar : '',
            clubName: owner ? owner.club_name : '',
            score: hex.score || 0
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          }
        };
      })
      .filter(Boolean);

    source.setData({
      type: 'FeatureCollection',
      features
    });
  }, [mapLoaded, hexagons, selectedH3Index]);

  return (
    <div className="relative w-full h-full bg-zinc-950">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Industrial Floating Legend */}
      <div className="absolute bottom-6 left-6 z-20 panel-dock p-3 rounded-2xl border border-zinc-800/90 text-xs hidden sm:block pointer-events-auto">
        <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
          Клубы Казани
        </div>
        <div className="space-y-1.5 font-sans">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span>Incomsystem</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span>
            <span>Кремлёвская Стража</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            <span>Волга Пейс</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></span>
            <span>Тигры Кабана</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>
            <span>Innopolis Cyber</span>
          </div>
        </div>
      </div>
    </div>
  );
}
