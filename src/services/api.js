/**
 * RunUram REST API Client
 */

import { getApiBaseUrl, getStoredAccessToken } from './authService.js';

function getAuthHeaders() {
  const token = getStoredAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * GET /api/v1/hexagons/area
 */
export async function getHexagonsInArea({ lat, lng, radius = 5, resolution = 9 }) {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/hexagons/area?lat=${lat}&lng=${lng}&radius=${radius}&resolution=${resolution}`;
  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('API getHexagonsInArea error:', e);
  }
  return { status: 'ERROR', hexagons: [] };
}

/**
 * GET /api/v1/hexagons/{h3_index}
 */
export async function getHexagonByH3Index(h3Index) {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/hexagons/${h3Index}`;
  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('API getHexagonByH3Index error:', e);
  }
  return null;
}

/**
 * GET /api/v1/leaderboard
 */
export async function getLeaderboard(limit = 10, type = 'runners') {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/leaderboard?limit=${limit}&type=${type}`;
  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('API getLeaderboard error:', e);
  }
  return { status: 'ERROR', leaders: [] };
}
