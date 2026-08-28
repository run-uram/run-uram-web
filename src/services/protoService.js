import protobuf from 'protobufjs';

// Raw proto schema definitions bundled for reliable in-browser usage without extra network roundtrips
const commonProto = `
syntax = "proto3";
package common;

enum Status {
  STATUS_UNSPECIFIED = 0;
  STATUS_OK = 1;
  STATUS_UNAUTHORIZED = 2;
  STATUS_INVALID_DATA = 3;
  STATUS_GPS_ACCURACY_LOW = 4;
  STATUS_SPEED_LIMIT_EXCEEDED = 5;
  STATUS_SERVER_ERROR = 6;
}
`;

const locationProto = `
syntax = "proto3";
package location;

message LocationPoint {
  double latitude = 1;
  double longitude = 2;
  double altitude = 3;
  float speed = 4;
  float heading = 5;
  float accuracy = 6;
  int64 timestamp = 7;
  float accelerometer_z = 8;
  bool is_mock = 9;
}

message H3Cell {
  uint64 index = 1;
  int32 resolution = 2;
}
`;

const telemetryProto = `
syntax = "proto3";
package telemetry;

import "location.proto";
import "common.proto";

message LocationBatch {
  uint64 run_id = 1;
  int64 sequence_number = 2;
  repeated location.LocationPoint points = 3;
}

message LocationBatchAck {
  common.Status status = 1;
  location.H3Cell current_cell = 2;
  double total_distance_meters = 3;
  int64 total_duration_seconds = 4;
}
`;

const eventsProto = `
syntax = "proto3";
package events;

import "common.proto";

message StartRunRequest {
  common.Status status = 1;
}

message StartRunResponse {
  common.Status status = 1;
  uint64 run_id = 2;
}

message FinishRunRequest {
  common.Status status = 1;
}

message FinishRunResponse {
  common.Status status = 1;
  uint64 run_id = 2;
  double total_distance_meters = 3;
  uint32 duration_seconds = 4;
  uint32 hexes_claimed_count = 5;
  uint32 total_score = 6;
}
`;

const gamemapProto = `
syntax = "proto3";
package gamemap;

import "common.proto";

message HexagonState {
  uint64 h3_index = 1;
  uint64 owner_user_id = 2;
  string owner_username = 3;
  string owner_color_hex = 4;
  int32 top_score = 5;
}

message SubscribeViewportRequest {
  double south_west_lng = 1;
  double south_west_lat = 2;
  double north_east_lng = 3;
  double north_east_lat = 4;
}

message SubscribeViewportResponse {
  common.Status status = 1;
  repeated HexagonState hexagons = 2;
}

message HexagonCaptureEvent {
  uint64 h3_index = 1;
  uint64 new_owner_id = 2;
  string new_owner_name = 3;
  string new_owner_color_hex = 4;
  uint64 prev_owner_id = 5;
  int32 score_at_capture = 6;
  int64 timestamp = 7;
}

message GetHexagonDetailsRequest {
  uint64 h3_index = 1;
}

message HexagonLeaderboardEntry {
  uint64 user_id = 1;
  string username = 2;
  string player_color_hex = 3;
  int32 uram_points = 4;
  double total_distance_meters = 5;
  int32 visits_count = 6;
}

message HexagonDetailsResponse {
  common.Status status = 1;
  HexagonState state = 2;
  repeated HexagonLeaderboardEntry leaderboard = 3;
}
`;

const userProto = `
syntax = "proto3";
package user;

import "common.proto";

message GetUserProfileRequest {
  uint64 user_id = 1; // 0 = запросить свой собственный профиль
}

message UserProfileResponse {
  common.Status status = 1;
  uint64 user_id = 2;
  string username = 3;
  string email = 4;
  string player_color_hex = 5;
  string avatar_url = 6;

  // Информация о команде
  uint64 team_id = 7;
  string team_name = 8;
  string team_tag = 9;
  string team_color_hex = 10;
  string team_avatar_url = 11;

  // Агрегированная статистика бегуна
  double total_distance_meters = 12;
  int64 total_duration_seconds = 13;
  int32 total_runs = 14;
  int32 total_uram_points = 15;
  int32 current_held_hexagons = 16;
}
`;

const historyProto = `
syntax = "proto3";
package history;

import "common.proto";
import "location.proto";

message RunSummary {
  uint64 run_id = 1;
  string status = 2;
  double total_distance_meters = 3;
  int64 total_duration_seconds = 4;
  int32 uram_points_earned = 5;
  int64 started_at = 6;
  int64 finished_at = 7;
}

message GetUserRunsRequest {
  uint64 user_id = 1;
  int32 limit = 2;
  int32 offset = 3;
}

message GetUserRunsResponse {
  common.Status status = 1;
  repeated RunSummary runs = 2;
  int32 total_count = 3;
}

message GetRunDetailsRequest {
  uint64 run_id = 1;
}

message GetRunDetailsResponse {
  common.Status status = 1;
  RunSummary summary = 2;
  repeated location.LocationPoint route_points = 3;
  repeated uint64 captured_h3_indices = 4;
}
`;

const envelopeProto = `
syntax = "proto3";
package runuram.proto;

import "telemetry.proto";
import "events.proto";
import "gamemap.proto";
import "user.proto";
import "history.proto";

message Envelope {
  oneof payload {
    telemetry.LocationBatch location_frame = 1;
    telemetry.LocationBatchAck location_frame_ack = 2;

    events.StartRunRequest start_run_request = 3;
    events.StartRunResponse start_run_response = 4;
    events.FinishRunRequest finish_run_request = 5;
    events.FinishRunResponse finish_run_response = 6;

    gamemap.SubscribeViewportRequest subscribe_viewport_request = 7;
    gamemap.SubscribeViewportResponse subscribe_viewport_response = 8;
    gamemap.HexagonCaptureEvent hexagon_capture_event = 9;
    gamemap.GetHexagonDetailsRequest get_hexagon_details_request = 10;
    gamemap.HexagonDetailsResponse hexagon_details_response = 11;

    user.GetUserProfileRequest get_user_profile_request = 12;
    user.UserProfileResponse user_profile_response = 13;

    history.GetUserRunsRequest get_user_runs_request = 14;
    history.GetUserRunsResponse get_user_runs_response = 15;
    history.GetRunDetailsRequest get_run_details_request = 16;
    history.GetRunDetailsResponse get_run_details_response = 17;
  }
}
`;

// Initialize Protobuf Root
const root = new protobuf.Root();

// Parse all schemas into root
protobuf.parse(commonProto, root, { keepCase: true });
protobuf.parse(locationProto, root, { keepCase: true });
protobuf.parse(telemetryProto, root, { keepCase: true });
protobuf.parse(eventsProto, root, { keepCase: true });
protobuf.parse(gamemapProto, root, { keepCase: true });
protobuf.parse(userProto, root, { keepCase: true });
protobuf.parse(historyProto, root, { keepCase: true });
protobuf.parse(envelopeProto, root, { keepCase: true });

// Lookup Envelope Message Type
export const EnvelopeType = root.lookupType('runuram.proto.Envelope');
export const StatusEnum = root.lookupEnum('common.Status');

/**
 * Encode JS object into Protobuf Envelope binary buffer (Uint8Array)
 */
export function encodeEnvelope(payloadObj) {
  const errMsg = EnvelopeType.verify(payloadObj);
  if (errMsg) {
    throw new Error(`Protobuf verification failed: ${errMsg}`);
  }
  const message = EnvelopeType.create(payloadObj);
  return EnvelopeType.encode(message).finish();
}

/**
 * Decode Protobuf binary buffer into plain JS object
 */
export function decodeEnvelope(buffer) {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const message = EnvelopeType.decode(uint8);
  return EnvelopeType.toObject(message, {
    longs: String,
    enums: String,
    bytes: String,
    defaults: true,
    arrays: true,
    objects: true,
    oneofs: true
  });
}

/**
 * Helper to convert 64-bit H3 index integer/Long/string to 15-char H3 hex representation
 */
export function h3Uint64ToHexString(val) {
  if (!val || val === '0' || val === 0) return '';
  if (protobuf.util.Long && protobuf.util.Long.isLong(val)) {
    return val.toString(16).toLowerCase();
  }
  if (typeof val === 'string') {
    if (/^[0-9a-fA-F]{15,16}$/.test(val)) return val.toLowerCase();
    try {
      return BigInt(val).toString(16).toLowerCase();
    } catch {
      return val.toLowerCase();
    }
  }
  if (typeof val === 'bigint' || typeof val === 'number') {
    return BigInt(val).toString(16).toLowerCase();
  }
  if (val && typeof val.toString === 'function') {
    try {
      const s = val.toString();
      if (/^[0-9a-fA-F]{15,16}$/.test(s)) return s.toLowerCase();
      return BigInt(s).toString(16).toLowerCase();
    } catch {
      return val.toString();
    }
  }
  return String(val);
}

/**
 * Helper to convert H3 hex string to protobuf.util.Long (unsigned 64-bit) for Protobuf uint64
 */
export function hexStringToH3Uint64(hexStr) {
  if (!hexStr) return protobuf.util.Long ? protobuf.util.Long.UZERO : '0';
  if (protobuf.util.Long) {
    try {
      if (protobuf.util.Long.isLong(hexStr)) return hexStr;
      if (typeof hexStr === 'string') {
        const cleanHex = hexStr.startsWith('0x') || hexStr.startsWith('0X') ? hexStr.slice(2) : hexStr;
        return protobuf.util.Long.fromString(cleanHex, true, 16);
      }
      return protobuf.util.Long.fromValue(hexStr, true);
    } catch (e) {
      console.warn('Failed to parse hex string to Long:', e);
      return protobuf.util.Long.UZERO;
    }
  }
  try {
    return BigInt('0x' + hexStr);
  } catch {
    return 0n;
  }
}

export default {
  root,
  EnvelopeType,
  StatusEnum,
  encodeEnvelope,
  decodeEnvelope,
  h3Uint64ToHexString,
  hexStringToH3Uint64
};
