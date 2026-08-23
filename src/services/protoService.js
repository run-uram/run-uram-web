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
  uint64 user_id = 1;
}

message UserProfileResponse {
  common.Status status = 1;
  uint64 user_id = 2;
  string username = 3;
  string email = 4;
  string player_color_hex = 5;
  uint64 team_id = 6;
  string team_tag = 7;
  
  double total_distance_meters = 8;
  int64 total_duration_seconds = 9;
  int32 total_runs = 10;
  int32 total_uram_points = 11;
  int32 current_held_hexagons = 12;
}
`;

const envelopeProto = `
syntax = "proto3";
package runuram.proto;

import "telemetry.proto";
import "events.proto";
import "gamemap.proto";
import "user.proto";

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
 * Helper to convert 64-bit H3 index integer/string to 15-char H3 hex representation
 */
export function h3Uint64ToHexString(val) {
  if (!val || val === '0' || val === 0) return '';
  if (typeof val === 'string') {
    // If it's already 15-char lowercase hex
    if (/^[0-9a-fA-F]{15}$/.test(val)) return val.toLowerCase();
    try {
      const b = BigInt(val);
      return b.toString(16).toLowerCase();
    } catch {
      return val;
    }
  }
  if (typeof val === 'bigint' || typeof val === 'number') {
    return val.toString(16).toLowerCase();
  }
  if (val && typeof val.toString === 'function') {
    try {
      return BigInt(val.toString()).toString(16).toLowerCase();
    } catch {
      return val.toString();
    }
  }
  return String(val);
}

/**
 * Helper to convert H3 hex string to BigInt / numeric string for Protobuf uint64
 */
export function hexStringToH3Uint64(hexStr) {
  if (!hexStr) return '0';
  try {
    return BigInt('0x' + hexStr).toString();
  } catch {
    return '0';
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
