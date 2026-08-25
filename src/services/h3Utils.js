import * as h3 from 'h3-js';
import { KAZAN_BOUNDS } from './mockData.js';

export const DEFAULT_H3_RESOLUTION = 9;

// Memoization cache for H3 cell polygon coordinates to prevent recalculating trig on every render
const polygonCache = new Map();

/**
 * Check if a given H3 cell center falls strictly within Kazan bounding box
 */
export function isH3InKazanBounds(h3Index) {
  try {
    const [lat, lng] = h3.cellToLatLng(h3Index);
    const [[minLng, minLat], [maxLng, maxLat]] = KAZAN_BOUNDS;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  } catch (err) {
    return true;
  }
}

/**
 * Get H3 index for a lat/lng coordinate
 */
export function getH3Index(lat, lng, resolution = DEFAULT_H3_RESOLUTION) {
  try {
    return h3.latLngToCell(lat, lng, resolution);
  } catch (err) {
    console.error('Error calculating H3 index:', err);
  }
  return null;
}

/**
 * Convert an H3 Cell Index to GeoJSON Polygon coordinates [[lng, lat], ...]
 * Result is cached in memory.
 */
export function h3ToPolygonCoordinates(h3Index) {
  if (!h3Index) return null;

  if (polygonCache.has(h3Index)) {
    return polygonCache.get(h3Index);
  }

  try {
    const boundary = h3.cellToBoundary(h3Index, true); // true = format as [lng, lat] GeoJSON
    if (boundary && boundary.length > 0) {
      // Ensure closing point (first === last)
      const first = boundary[0];
      const last = boundary[boundary.length - 1];
      const isClosed = first[0] === last[0] && first[1] === last[1];
      const result = isClosed ? boundary : [...boundary, first];
      polygonCache.set(h3Index, result);
      return result;
    }
  } catch (err) {
    console.error(`Error converting h3Index ${h3Index} to polygon:`, err);
  }
  return null;
}

/**
 * Generate all H3 res=9 cells covering the given viewport bounding box,
 * clamped to Kazan bounds to ensure performance and prevent massive allocations.
 */
export function getViewportH3Cells(bounds, resolution = DEFAULT_H3_RESOLUTION) {
  if (!bounds) return [];

  const [[kazanMinLng, kazanMinLat], [kazanMaxLng, kazanMaxLat]] = KAZAN_BOUNDS;

  // Add 15% buffer around viewport for seamless edge-to-edge grid coverage
  const lngSpan = Math.abs(bounds.neLng - bounds.swLng);
  const latSpan = Math.abs(bounds.neLat - bounds.swLat);
  const bufferLng = lngSpan * 0.15;
  const bufferLat = latSpan * 0.15;

  // Clamp viewport bounds to Kazan region
  const swLat = Math.max(bounds.swLat - bufferLat, kazanMinLat);
  const swLng = Math.max(bounds.swLng - bufferLng, kazanMinLng);
  const neLat = Math.min(bounds.neLat + bufferLat, kazanMaxLat);
  const neLng = Math.min(bounds.neLng + bufferLng, kazanMaxLng);

  if (swLat >= neLat || swLng >= neLng) {
    return [];
  }

  try {
    // h3.polygonToCells expects polygon ring as [[lat, lng], ...]
    const poly = [
      [swLat, swLng],
      [neLat, swLng],
      [neLat, neLng],
      [swLat, neLng],
      [swLat, swLng]
    ];

    const cells = h3.polygonToCells(poly, resolution);
    return cells;
  } catch (err) {
    console.error('Error generating viewport H3 cells:', err);
    return [];
  }
}
