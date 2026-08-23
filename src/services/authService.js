/**
 * Authentication and Token Management Service
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'runuram_access_token',
  WS_TICKET: 'runuram_ws_ticket',
  TICKET_EXPIRES_AT: 'runuram_ws_ticket_expires_at',
  USER_INFO: 'runuram_user_info',
  API_URL: 'runuram_custom_api_url',
  WS_URL: 'runuram_custom_ws_url'
};

const DEFAULT_API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';
const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || '';

export function getApiBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEYS.API_URL);
  if (saved !== null && saved !== undefined) return saved;
  return DEFAULT_API_URL;
}

export function getWsBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEYS.WS_URL);
  if (saved) return saved;
  if (DEFAULT_WS_URL) return DEFAULT_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function setCustomUrls(apiUrl, wsUrl) {
  if (apiUrl !== undefined) localStorage.setItem(STORAGE_KEYS.API_URL, apiUrl.trim().replace(/\/$/, ''));
  if (wsUrl !== undefined) localStorage.setItem(STORAGE_KEYS.WS_URL, wsUrl.trim());
}

export function getStoredAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getStoredWsTicket() {
  return localStorage.getItem(STORAGE_KEYS.WS_TICKET);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession({ accessToken, wsTicket, expiresIn, user }) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (wsTicket) localStorage.setItem(STORAGE_KEYS.WS_TICKET, wsTicket);
  if (expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem(STORAGE_KEYS.TICKET_EXPIRES_AT, expiresAt.toString());
  }
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.WS_TICKET);
  localStorage.removeItem(STORAGE_KEYS.TICKET_EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
}

export function isAuthenticated() {
  return Boolean(getStoredAccessToken());
}

/**
 * POST /api/v1/auth/login
 * Request: { login, password }
 * Response: { status: "success", access_token, ws_ticket, expires_in }
 */
export async function login(loginStr, passwordStr) {
  const base = getApiBaseUrl();
  const endpoint = base ? `${base}/api/v1/auth/login` : '/api/v1/auth/login';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: loginStr,
        password: passwordStr
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status !== 'success') {
      throw new Error(data.message || data.error || `Ошибка авторизации (HTTP ${res.status})`);
    }

    const sessionData = {
      accessToken: data.access_token,
      wsTicket: data.ws_ticket,
      expiresIn: data.expires_in || 3600,
      user: {
        login: loginStr,
        username: loginStr,
        authenticatedAt: new Date().toISOString()
      }
    };

    saveSession(sessionData);
    return { success: true, ...sessionData };
  } catch (err) {
    console.warn('Backend login request error:', err);
    throw err;
  }
}

/**
 * GET/POST /api/v1/auth/ws-ticket
 * Header: Authorization: Bearer <access_token>
 * Response: { status: "success", ws_ticket: "..." }
 */
export async function refreshWsTicket() {
  const token = getStoredAccessToken();
  if (!token) {
    throw new Error('Нет сохранённого токена авторизации');
  }

  const base = getApiBaseUrl();
  const endpoint = base ? `${base}/api/v1/auth/ws-ticket` : '/api/v1/auth/ws-ticket';

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Try POST if GET returned 404 or 405
    if (res.status === 405 || res.status === 404) {
      const postRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const postData = await postRes.json().catch(() => ({}));
      if (postRes.ok && postData.status === 'success' && postData.ws_ticket) {
        localStorage.setItem(STORAGE_KEYS.WS_TICKET, postData.ws_ticket);
        return postData.ws_ticket;
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status !== 'success' || !data.ws_ticket) {
      throw new Error(data.message || `Не удалось обновить WebSocket тикет (HTTP ${res.status})`);
    }

    localStorage.setItem(STORAGE_KEYS.WS_TICKET, data.ws_ticket);
    return data.ws_ticket;
  } catch (err) {
    console.warn('Failed to refresh WS ticket:', err);
    throw err;
  }
}

export default {
  getApiBaseUrl,
  getWsBaseUrl,
  setCustomUrls,
  getStoredAccessToken,
  getStoredWsTicket,
  getStoredUser,
  saveSession,
  clearSession,
  isAuthenticated,
  login,
  refreshWsTicket
};
