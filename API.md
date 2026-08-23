# 🏃 Running Cup (RunUram) — API & Protocol Buffers Reference

Документация протокола взаимодействия веб-клиента и бэкенда **Running Cup** (Казань).  
Архитектура построена на комбинации **HTTP REST (Stateless JWT авторизация и тикеты)** и **WebSocket + Protocol Buffers (бинарный стриминг карты, телеметрии и событий)**.

---

## 📌 Содержание
1. [Общая архитектура взаимодействия](#1-общая-архитектура-взаимодействия)
2. [REST API: Авторизация и WS-тикеты](#2-rest-api-авторизация-и-ws-тикеты)
   - [POST /api/v1/auth/login](#1-post-apiv1authlogin)
   - [GET /api/v1/auth/ws-ticket](#2-get-apiv1authws-ticket)
3. [WebSocket: Подключение и рукопожатие](#3-websocket-подключение-и-рукопожатие)
4. [Protocol Buffers (Protobuf v3) Спецификация](#4-protocol-buffers-protobuf-v3-спецификация)
   - [Envelope (Корневой конверт)](#envelope-корневой-конверт)
   - [1. Пользователь и Статистика (user.proto)](#1-пользователь-и-статистика-userproto)
   - [2. Карта и Гексагоны (gamemap.proto)](#2-карта-и-гексагоны-gamemapproto)
   - [3. Жизненный цикл забега (events.proto)](#3-жизненный-цикл-забега-eventsproto)
   - [4. Телеметрия забега (telemetry.proto & location.proto)](#4-телеметрия-забега-telemetryproto--locationproto)
   - [5. Общие статусы и ошибки (common.proto)](#5-общие-статусы-и-ошибки-commonproto)
5. [H3 Геопространственная дискретизация](#5-h3-геопространственная-дискретизация)
6. [Сценарии работы клиента](#6-сценарии-работы-клиента)

---

## 1. Общая архитектура взаимодействия

```
┌─────────────────┐                                  ┌───────────────────┐
│                 │  1. POST /api/v1/auth/login      │                   │
│                 │ ───────────────────────────────> │                   │
│                 │ <─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                   │
│                 │   access_token + ws_ticket       │                   │
│   Web / Mobile  │                                  │    C++ Backend    │
│     Клиент      │  2. WS Connect ?token=ws_ticket  │      Server       │
│                 │ ═══════════════════════════════> │    (Docker)       │
│                 │ <═══════════════════════════════ │                   │
│                 │    Binary Protobuf (Envelope)    │                   │
│                 │                                  │                   │
│                 │  3. Reconnect: ws-ticket renew   │                   │
│                 │ ───────────────────────────────> │                   │
│                 │   (Bearer Authorization header)  │                   │
└─────────────────┘                                  └───────────────────┘
```

---

## 2. REST API: Авторизация и WS-тикеты

### 1. `POST /api/v1/auth/login`
Авторизация атлета в системе.

#### Заголовки:
```http
Content-Type: application/json
```

#### Тело запроса (Request Body):
```json
{
  "login": "runner_kazan",
  "password": "password123"
}
```

#### Успешный ответ (`200 OK`):
```json
{
  "status": "success",
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "ws_ticket": "9a8f2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "expires_in": 3600
}
```

#### Ошибки:
* `400 Bad Request`: `{"status": "error", "message": "Invalid request body"}`
* `401 Unauthorized`: `{"status": "error", "message": "Invalid credentials"}`

---

### 2. `GET /api/v1/auth/ws-ticket`
Запрос нового одноразового WebSocket-тикета при разрыве связи или переподключении.

#### Заголовки:
```http
Authorization: Bearer <access_token>
```

#### Успешный ответ (`200 OK`):
```json
{
  "status": "success",
  "ws_ticket": "f1e2d3c4-b5a6-7890-1234-56789abcdef0"
}
```

#### Ошибки:
* `401 Unauthorized`: `{"status": "error", "message": "Invalid or expired access token"}`

---

## 3. WebSocket: Подключение и рукопожатие

* **URL подключения:** `ws://<host>:<port>/ws?token=<ws_ticket>`
* **Продолжительность жизни тикета:** ~30 секунд (проверяется сервером при рукопожатии).
* **Формат передачи данных:** Двоичный (`binaryType = "arraybuffer"`).
* **Корневое сообщение:** Все сообщения упаковываются в Protobuf-сообщение `runuram.proto.Envelope`.

---

## 4. Protocol Buffers (Protobuf v3) Спецификация

### Envelope (Корневой конверт)
[`proto/envelope.proto`](file:///c:/Users/Apc/Desktop/Projects/runningcup/web/proto/envelope.proto)

```protobuf
syntax = "proto3";
package runuram.proto;

import "telemetry.proto";
import "events.proto";
import "gamemap.proto";
import "user.proto";

message Envelope {
  oneof payload {
    // 1. Телеметрия забега
    telemetry.LocationBatch location_frame = 1;
    telemetry.LocationBatchAck location_frame_ack = 2;

    // 2. Управление жизненным циклом забега
    events.StartRunRequest start_run_request = 3;
    events.StartRunResponse start_run_response = 4;
    events.FinishRunRequest finish_run_request = 5;
    events.FinishRunResponse finish_run_response = 6;

    // 3. Карта и стриминг гео-данных
    gamemap.SubscribeViewportRequest subscribe_viewport_request = 7;
    gamemap.SubscribeViewportResponse subscribe_viewport_response = 8;
    gamemap.HexagonCaptureEvent hexagon_capture_event = 9;
    gamemap.GetHexagonDetailsRequest get_hexagon_details_request = 10;
    gamemap.HexagonDetailsResponse hexagon_details_response = 11;

    // 4. Профиль и статистика
    user.GetUserProfileRequest get_user_profile_request = 12;
    user.UserProfileResponse user_profile_response = 13;
  }
}
```

---

### 1. Пользователь и Статистика (`user.proto`)
[`proto/user.proto`](file:///c:/Users/Apc/Desktop/Projects/runningcup/web/proto/user.proto)

#### Запрос профиля (`GetUserProfileRequest`):
```protobuf
message GetUserProfileRequest {
  uint64 user_id = 1; // 0 = запросить свой собственный профиль
}
```

#### Ответ профиля (`UserProfileResponse`):
```protobuf
message UserProfileResponse {
  common.Status status = 1;
  uint64 user_id = 2;
  string username = 3;
  string email = 4;
  string player_color_hex = 5; // Например, "#f97316"
  uint64 team_id = 6;
  string team_tag = 7;         // Например, "URAM"
  
  // Агрегированная статистика
  double total_distance_meters = 8;  // Суммарная дистанция
  int64 total_duration_seconds = 9;  // Время бега
  int32 total_runs = 10;             // Количество завершенных забегов
  int32 total_uram_points = 11;      // Очки Uram Points
  int32 current_held_hexagons = 12;  // Удерживаемые соты прямо сейчас
}
```

---

### 2. Карта и Гексагоны (`gamemap.proto`)
[`proto/gamemap.proto`](file:///c:/Users/Apc/Desktop/Projects/runningcup/web/proto/gamemap.proto)

#### Подписка на видимую область карты:
```protobuf
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

message HexagonState {
  uint64 h3_index = 1;         // Uber H3 index (uint64)
  uint64 owner_user_id = 2;    // ID владельца (0 = нейтральный)
  string owner_username = 3;   // Имя владельца
  string owner_color_hex = 4;  // Цвет владельца
  int32 top_score = 5;         // Текущий рекорд ячейки
}
```

#### Realtime Pub/Sub Событие захвата:
```protobuf
message HexagonCaptureEvent {
  uint64 h3_index = 1;
  uint64 new_owner_id = 2;
  string new_owner_name = 3;
  string new_owner_color_hex = 4;
  uint64 prev_owner_id = 5;
  int32 score_at_capture = 6;
  int64 timestamp = 7;
}
```

#### Детали конкретного гексагона:
```protobuf
message GetHexagonDetailsRequest {
  uint64 h3_index = 1;
}

message HexagonDetailsResponse {
  common.Status status = 1;
  HexagonState state = 2;
  repeated HexagonLeaderboardEntry leaderboard = 3;
}

message HexagonLeaderboardEntry {
  uint64 user_id = 1;
  string username = 2;
  string player_color_hex = 3;
  int32 uram_points = 4;
  double total_distance_meters = 5;
  int32 visits_count = 6;
}
```

---

### 3. Жизненный цикл забега (`events.proto`)
[`proto/events.proto`](file:///c:/Users/Apc/Desktop/Projects/runningcup/web/proto/events.proto)

#### Старт забега:
```protobuf
message StartRunRequest {
  common.Status status = 1;
}

message StartRunResponse {
  common.Status status = 1;
  uint64 run_id = 2;
}
```

#### Финиш забега:
```protobuf
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
```

---

### 4. Телеметрия забега (`telemetry.proto` & `location.proto`)

```protobuf
message LocationBatch {
  uint64 run_id = 1;
  int64 sequence_number = 2;                // Порядковый номер пакета (1, 2, 3...)
  repeated location.LocationPoint points = 3; // Массив GPS-точек
}

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

message LocationBatchAck {
  common.Status status = 1;
  location.H3Cell current_cell = 2;
  double total_distance_meters = 3;
  int64 total_duration_seconds = 4;
}
```

---

### 5. Общие статусы и ошибки (`common.proto`)

```protobuf
enum Status {
  STATUS_UNSPECIFIED = 0;
  STATUS_OK = 1;
  STATUS_UNAUTHORIZED = 2;
  STATUS_INVALID_DATA = 3;
  STATUS_GPS_ACCURACY_LOW = 4;
  STATUS_SPEED_LIMIT_EXCEEDED = 5;
  STATUS_SERVER_ERROR = 6;
}
```

---

## 5. H3 Геопространственная дискретизация

В проекте используется геопространственная гексагональная сетка **Uber H3**.

| Разрешение | Длина ребра | Площадь ячейки | Применение в Running Cup |
|:---|:---|:---|:---|
| **H3-8** | ~461 м | ~0.737 км² | Парковые зоны, набережные (Кабан, Волга, Миллениум) |
| **H3-9** | ~174 м | ~0.105 км² (10.5 га) | **Основной игровой режим**: кварталы, экстрим-парк УРАМ, Кремль |
| **H3-10** | ~65 м | ~0.015 км² (1.5 га) | Высокоточный трекинг спринтов и локальных дорожек |

---

## 6. Сценарии работы клиента

### А. Вход и инициализация
1. Клиент выполняет `POST /api/v1/auth/login` $\rightarrow$ сохраняет `access_token` и `ws_ticket`.
2. Клиент открывает бинарный сокет `ws://<host>:<port>/ws?token=<ws_ticket>`.
3. При открытии сокета клиент отправляет `GetUserProfileRequest { user_id: 0 }`.
4. Сервер отвечает `UserProfileResponse`, заполняя данные в профиле игрока.

### Б. Стриминг карты
1. При перемещении карты клиент отправляет `SubscribeViewportRequest { south_west_lng, south_west_lat, north_east_lng, north_east_lat }`.
2. Сервер отправляет `SubscribeViewportResponse` со списком `HexagonState`.
3. При захвате сектора другим атлетом сервер пушит `HexagonCaptureEvent` $\rightarrow$ гексагон на клиенте мгновенно меняет цвет и владельца.
