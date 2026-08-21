/**
 * RunUram Kazan API Service
 * 1. GET /api/v1/hexagons/area?lat={lat}&lng={lng}&radius={radius}&resolution={resolution}
 * 2. GET /api/v1/hexagons/{h3_index}
 * 3. GET /api/v1/leaderboard?limit={limit}
 */

import { getH3Index, getKRingHexes, getOrSeedHexDetails } from './h3Utils.js';
import { MOCK_RUNNERS, KAZAN_CLUBS } from './mockData.js';

// Configuration
let USE_MOCK_API = true;
let BACKEND_BASE_URL = 'http://localhost:8080';

export function setApiMode(useMock, baseUrl = 'http://localhost:8080') {
  USE_MOCK_API = useMock;
  if (baseUrl) BACKEND_BASE_URL = baseUrl;
}

export function getApiMode() {
  return { isMock: USE_MOCK_API, baseUrl: BACKEND_BASE_URL };
}

/**
 * GET /api/v1/hexagons/area
 * Parameters: lat, lng, radius (k-ring), resolution
 * Returns: { hexagons: [...] }
 */
export async function getHexagonsInArea({ lat, lng, radius = 5, resolution = 9 }) {
  if (!USE_MOCK_API) {
    try {
      const url = `${BACKEND_BASE_URL}/api/v1/hexagons/area?lat=${lat}&lng=${lng}&radius=${radius}&resolution=${resolution}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Real API failed, falling back to mock engine:', e);
    }
  }

  // Mock implementation using h3-js
  const centerH3 = getH3Index(lat, lng, resolution);
  if (!centerH3) {
    return { hexagons: [] };
  }

  const ringHexIndexes = getKRingHexes(centerH3, radius);
  const hexagons = ringHexIndexes.map((h3Index) => getOrSeedHexDetails(h3Index));

  return {
    status: 'STATUS_OK',
    center: { lat, lng, h3_index: centerH3 },
    radius,
    resolution,
    count: hexagons.length,
    hexagons
  };
}

/**
 * GET /api/v1/hexagons/{h3_index}
 * Returns detailed hex info: { h3_index, owner, score, captured_at, history }
 */
export async function getHexagonByH3Index(h3Index) {
  if (!USE_MOCK_API) {
    try {
      const url = `${BACKEND_BASE_URL}/api/v1/hexagons/${h3Index}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Real API failed, falling back to mock engine:', e);
    }
  }

  // Mock response
  const hexDetails = getOrSeedHexDetails(h3Index);
  return hexDetails;
}

/**
 * GET /api/v1/leaderboard
 * Parameters: limit=10
 * Returns: { leaders: [...] }
 */
export async function getLeaderboard(limit = 10, type = 'runners') {
  if (!USE_MOCK_API) {
    try {
      const url = `${BACKEND_BASE_URL}/api/v1/leaderboard?limit=${limit}&type=${type}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Real API failed, falling back to mock engine:', e);
    }
  }

  // Mock Runners Leaderboard
  if (type === 'runners') {
    const sortedRunners = [...MOCK_RUNNERS]
      .sort((a, b) => b.hexCount - a.hexCount)
      .slice(0, limit);

    return {
      status: 'STATUS_OK',
      updated_at: new Date().toISOString(),
      leaders: sortedRunners.map((runner, idx) => ({
        rank: idx + 1,
        id: runner.id,
        name: runner.name,
        handle: runner.handle,
        avatar: runner.avatar,
        club: runner.club.name,
        club_badge: runner.club.badge,
        club_color: runner.club.color,
        hex_count: runner.hexCount,
        score: runner.hexCount * 125,
        total_distance_km: runner.totalDistanceKm,
        avg_pace: runner.avgPace,
        streak_days: runner.streakDays
      }))
    };
  }

  // Mock Clubs Leaderboard
  const clubStats = Object.values(KAZAN_CLUBS).map((club) => {
    const clubRunners = MOCK_RUNNERS.filter((r) => r.club.id === club.id);
    const totalHexes = clubRunners.reduce((sum, r) => sum + r.hexCount, 0);
    const totalDistance = clubRunners.reduce((sum, r) => sum + r.totalDistanceKm, 0);
    return {
      id: club.id,
      name: club.name,
      badge: club.badge,
      color: club.color,
      members_count: club.membersCount,
      hex_count: totalHexes,
      score: totalHexes * 150,
      total_distance_km: Math.round(totalDistance)
    };
  }).sort((a, b) => b.hex_count - a.hex_count).slice(0, limit);

  return {
    status: 'STATUS_OK',
    updated_at: new Date().toISOString(),
    leaders: clubStats.map((club, idx) => ({
      rank: idx + 1,
      ...club
    }))
  };
}
