/**
 * WebSocket Management Service for Protobuf Communication
 */

import { encodeEnvelope, decodeEnvelope, hexStringToH3Uint64 } from './protoService.js';
import { getWsBaseUrl, getStoredWsTicket, refreshWsTicket, isAuthenticated } from './authService.js';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;
    this.manualDisconnect = false;
    this.lastError = null;
    this.activeSubscribedBox = null;
  }

  /**
   * Subscribe to incoming envelope events or specific payload types
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    return () => {
      this.off(eventType, callback);
    };
  }

  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      for (const cb of this.listeners.get(eventType)) {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in WS event listener for "${eventType}":`, e);
        }
      }
    }
  }

  setStatus(status, error = null) {
    this.status = status;
    this.lastError = error;
    console.log(`[WebSocket Status] ➔ ${status.toUpperCase()}`, error || '');
    this.emit('status', { status, error });
  }

  /**
   * Connect to WebSocket server using current ticket
   */
  async connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.manualDisconnect = false;
    let ticket = getStoredWsTicket();

    // If no ticket or expired, try to refresh if user is authenticated
    if (!ticket && isAuthenticated()) {
      try {
        console.log('[WebSocket] Requesting fresh ws-ticket from REST API...');
        ticket = await refreshWsTicket();
      } catch (err) {
        console.warn('Could not obtain ticket before WS connect:', err);
      }
    }

    const wsBase = getWsBaseUrl();
    const delimiter = wsBase.includes('?') ? '&' : '?';
    const wsUrl = ticket ? `${wsBase}${delimiter}token=${encodeURIComponent(ticket)}` : wsBase;

    console.log(`[WebSocket] Connecting to: ${wsUrl} (ticket: ${ticket ? ticket.substring(0, 10) + '...' : 'none'})`);
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        console.log('%c✅ WebSocket Connected via Protobuf Envelope', 'color: #10b981; font-weight: bold; font-size: 13px;');

        // Automatically fetch own user profile on connect
        this.requestUserProfile(0);
      };

      this.ws.onmessage = (event) => {
        try {
          const envelope = decodeEnvelope(event.data);
          const payloadKey = Object.keys(envelope).find(k => envelope[k] !== null && envelope[k] !== undefined) || 'unknown';
          console.log(`%c📥 [Protobuf Received] payload: %c${payloadKey}`, 'color: #3b82f6; font-weight: bold;', 'color: #60a5fa;', envelope);
          this.handleIncomingEnvelope(envelope);
        } catch (err) {
          console.error('Failed to decode Protobuf binary message:', err, event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`%c🔌 WebSocket Closed (code ${event.code}, reason: ${event.reason || 'none'})`, 'color: #f59e0b;');
        this.ws = null;
        if (!this.manualDisconnect) {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        } else {
          this.setStatus('disconnected');
        }
      };

      this.ws.onerror = (err) => {
        console.warn('⚠️ WebSocket Error:', err);
        this.setStatus('error', err);
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      this.setStatus('error', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Dispatch parsed Protobuf Envelope to listeners
   */
  handleIncomingEnvelope(envelope) {
    this.emit('envelope', envelope);

    if (envelope.user_profile_response) {
      this.emit('user_profile_response', envelope.user_profile_response);
    }
    if (envelope.subscribe_viewport_response) {
      this.emit('subscribe_viewport_response', envelope.subscribe_viewport_response);
    }
    if (envelope.hexagon_capture_event) {
      this.emit('hexagon_capture_event', envelope.hexagon_capture_event);
    }
    if (envelope.hexagon_details_response) {
      this.emit('hexagon_details_response', envelope.hexagon_details_response);
    }
    if (envelope.location_frame_ack) {
      this.emit('location_frame_ack', envelope.location_frame_ack);
    }
    if (envelope.start_run_response) {
      this.emit('start_run_response', envelope.start_run_response);
    }
    if (envelope.finish_run_response) {
      this.emit('finish_run_response', envelope.finish_run_response);
    }
  }

  /**
   * Send Protobuf message wrapped in Envelope
   */
  sendEnvelope(envelopePayload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send envelope: WebSocket is not open (status:', this.status, ')');
      return false;
    }

    try {
      const buffer = encodeEnvelope(envelopePayload);
      const payloadKey = Object.keys(envelopePayload)[0] || 'unknown';
      console.log(`%c📤 [Protobuf Sent] payload: %c${payloadKey}`, 'color: #f97316; font-weight: bold;', 'color: #fb923c;', envelopePayload);
      this.ws.send(buffer);
      return true;
    } catch (err) {
      console.error('Failed to encode and send envelope:', err);
      return false;
    }
  }

  /**
   * Request own or other runner's profile (user_id: 0 = self)
   */
  requestUserProfile(userId = 0) {
    return this.sendEnvelope({
      get_user_profile_request: {
        user_id: userId
      }
    });
  }

  /**
   * Subscribe to map viewport bounding box with spatial containment caching & throttling
   */
  subscribeViewport(swLng, swLat, neLng, neLat, force = false) {
    const sw_lng = Number(swLng);
    const sw_lat = Number(swLat);
    const ne_lng = Number(neLng);
    const ne_lat = Number(neLat);

    if (isNaN(sw_lng) || isNaN(sw_lat) || isNaN(ne_lng) || isNaN(ne_lat)) {
      return false;
    }

    const now = Date.now();

    // Check if the current camera viewport is already covered by the active subscribed buffered box
    if (!force && this.activeSubscribedBox) {
      const { swLng: bSwLng, swLat: bSwLat, neLng: bNeLng, neLat: bNeLat, time } = this.activeSubscribedBox;
      const isWithinBounds = (
        sw_lng >= bSwLng &&
        sw_lat >= bSwLat &&
        ne_lng <= bNeLng &&
        ne_lat <= bNeLat
      );

      // If within buffered bounds and younger than 40 seconds, skip sending redundant WS packets
      if (isWithinBounds && (now - time < 40000)) {
        return true;
      }
    }

    // Add a 20% spatial buffer around the viewport so small pans/zooms don't fire extra requests
    const lngSpan = Math.max(Math.abs(ne_lng - sw_lng), 0.005);
    const latSpan = Math.max(Math.abs(ne_lat - sw_lat), 0.005);
    const bufferLng = lngSpan * 0.20;
    const bufferLat = latSpan * 0.20;

    const bufferedSwLng = sw_lng - bufferLng;
    const bufferedSwLat = sw_lat - bufferLat;
    const bufferedNeLng = ne_lng + bufferLng;
    const bufferedNeLat = ne_lat + bufferLat;

    this.activeSubscribedBox = {
      swLng: bufferedSwLng,
      swLat: bufferedSwLat,
      neLng: bufferedNeLng,
      neLat: bufferedNeLat,
      time: now
    };

    return this.sendEnvelope({
      subscribe_viewport_request: {
        south_west_lng: bufferedSwLng,
        south_west_lat: bufferedSwLat,
        north_east_lng: bufferedNeLng,
        north_east_lat: bufferedNeLat
      }
    });
  }

  /**
   * Request detailed stats and leaderboard for a specific H3 hexagon
   */
  requestHexagonDetails(h3Index) {
    return this.sendEnvelope({
      get_hexagon_details_request: {
        h3_index: hexStringToH3Uint64(h3Index)
      }
    });
  }

  /**
   * Start a running session
   */
  startRun() {
    return this.sendEnvelope({
      start_run_request: {
        status: 1
      }
    });
  }

  /**
   * Finish current running session
   */
  finishRun() {
    return this.sendEnvelope({
      finish_run_request: {
        status: 1
      }
    });
  }

  /**
   * Send GPS telemetry batch
   */
  sendLocationBatch(runId, sequenceNumber, points) {
    return this.sendEnvelope({
      location_frame: {
        run_id: runId,
        sequence_number: sequenceNumber,
        points: points
      }
    });
  }

  /**
   * Automatic reconnect logic with ticket renewal
   */
  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached.');
      return;
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;

    console.log(`[WebSocket] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(async () => {
      if (isAuthenticated()) {
        try {
          await refreshWsTicket();
        } catch (e) {
          console.warn('Ticket refresh during reconnect attempt failed:', e);
        }
      }
      this.connect();
    }, delay);
  }

  /**
   * Disconnect manually
   */
  disconnect() {
    this.manualDisconnect = true;
    this.activeSubscribedBox = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}

export const wsService = new WebSocketService();
export default wsService;
