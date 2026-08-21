import * as h3 from 'h3-js';
import { MOCK_RUNNERS, KAZAN_CLUBS, KAZAN_BOUNDS } from './mockData.js';

// Cache for hex ownership to maintain consistency across map moves and detail clicks
const hexStateCache = new Map();

/**
 * Check if a given H3 cell center falls strictly within Kazan bounding box
 */
export function isH3InKazanBounds(h3Index) {
  try {
    const [lat, lng] = h3.cellToLatLng(h3Index);
    const [[minLng, minLat], [maxLng, maxLat]] = KAZAN_BOUNDS;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  } catch (err) {
    return true; // Fallback
  }
}

/**
 * Get H3 index for a lat/lng coordinate
 */
export function getH3Index(lat, lng, resolution = 8) {
  try {
    return h3.latLngToCell(lat, lng, resolution);
  } catch (err) {
    console.error('Error calculating H3 index:', err);
  }
  return null;
}

/**
 * Get k-ring hexes around center (filtered strictly to Kazan boundary)
 */
export function getKRingHexes(centerH3, radius = 5) {
  try {
    const hexes = h3.gridDisk(centerH3, radius);
    // Optimization: Filter out any hexes that go beyond Kazan boundaries
    return hexes.filter(isH3InKazanBounds);
  } catch (err) {
    console.error('Error calculating gridDisk:', err);
  }
  return [centerH3];
}

/**
 * Convert an H3 Cell Index to GeoJSON Polygon coordinates [[lng, lat], ...]
 */
export function h3ToPolygonCoordinates(h3Index) {
  try {
    const boundary = h3.cellToBoundary(h3Index, true); // true = format as [lng, lat] GeoJSON
    if (boundary && boundary.length > 0) {
      // GeoJSON polygons require closing point (first point === last point)
      return [...boundary, boundary[0]];
    }
  } catch (err) {
    console.error(`Error converting h3Index ${h3Index} to polygon:`, err);
  }
  return null;
}

/**
 * Get or seed hex details for mock engine
 */
export function getOrSeedHexDetails(h3Index) {
  if (hexStateCache.has(h3Index)) {
    return hexStateCache.get(h3Index);
  }

  // Deterministic pseudo-random generation based on H3 index string hash
  let hash = 0;
  for (let i = 0; i < h3Index.length; i++) {
    hash = (hash << 5) - hash + h3Index.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const isCaptured = (positiveHash % 10) < 8;
  const runner = MOCK_RUNNERS[positiveHash % MOCK_RUNNERS.length];
  const score = isCaptured ? (positiveHash % 850) + 150 : 0;
  const capturedMinutesAgo = (positiveHash % 1440) + 5;
  const capturedDate = new Date(Date.now() - capturedMinutesAgo * 60 * 1000).toISOString();

  const details = {
    h3_index: h3Index,
    is_captured: isCaptured,
    score: score,
    captured_at: capturedDate,
    owner: isCaptured ? {
      id: runner.id,
      name: runner.name,
      handle: runner.handle,
      avatar: runner.avatar,
      club_name: runner.club.name,
      club_badge: runner.club.badge,
      color: runner.club.color,
      avg_pace: runner.avgPace
    } : null,
    history: isCaptured ? [
      {
        id: `h-1-${h3Index}`,
        runner: runner.name,
        action: 'Захвачен во время пробежки',
        date: new Date(Date.now() - capturedMinutesAgo * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        score: score
      },
      {
        id: `h-2-${h3Index}`,
        runner: 'Предыдущий бегун',
        action: 'Перехвачен конфликтный сектор',
        date: 'Вчера, 18:40',
        score: Math.max(50, score - 120)
      }
    ] : []
  };

  hexStateCache.set(h3Index, details);
  return details;
}

/**
 * Force set hex details (used when running simulator captures a hex)
 */
export function updateHexOwner(h3Index, runner, extraScore = 300) {
  const existing = hexStateCache.get(h3Index) || {};
  const newScore = (existing.score || 100) + extraScore;
  const updated = {
    h3_index: h3Index,
    is_captured: true,
    score: newScore,
    captured_at: new Date().toISOString(),
    owner: {
      id: runner.id,
      name: runner.name,
      handle: runner.handle,
      avatar: runner.avatar,
      club_name: runner.club.name,
      club_badge: runner.club.badge,
      color: runner.club.color,
      avg_pace: runner.avgPace
    },
    history: [
      {
        id: `h-new-${Date.now()}`,
        runner: runner.name,
        action: 'Захвачен прямо сейчас! 🔥',
        date: 'Только что',
        score: newScore
      },
      ...(existing.history || [])
    ]
  };

  hexStateCache.set(h3Index, updated);
  return updated;
}
