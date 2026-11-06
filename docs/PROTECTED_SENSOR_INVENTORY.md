# PROTECTED COMPONENTS INVENTORY — BERUDRISHTI (ಬೇರುದೃಷ್ಟಿ)

> **STRICT LIVE SENSOR BACKEND PROTECTION POLICY**  
> Under no circumstances must any of the components listed in this inventory be deleted, rewritten, refactored, or broken. All new modules must consume live sensor data through read-only adapters or existing APIs.

---

## 1. Protected Files & Modules

| Component | File Path | Protected Role | Access Policy |
| :--- | :--- | :--- | :--- |
| **MQTT Client Wrapper** | `backend/src/lib/mqttClient.js` | Direct MQTT TCP connection & publish | **READ/USE ONLY** (no rewriting) |
| **MQTT Bridge & Dispatcher** | `backend/src/mqttBridge.js` | Ingests `esp32/telemetry`, forwards to WebSocket | **IMMUTABLE** |
| **Telemetry Persistence Service** | `backend/src/services/telemetryService.js` | In-memory cache, meaningful change filter, MongoDB `Telemetry` save | **READ ONLY** (`getLatestTelemetry`) |
| **Live Telemetry API Router** | `backend/src/routes/telemetry.js` | `/api/telemetry/latest`, `/history`, `/relay` | **IMMUTABLE** |
| **Telemetry DB Model** | `backend/src/models/Telemetry.js` | MongoDB `telemetries` collection schema | **IMMUTABLE** |
| **WebSocket Server** | `backend/src/wsServer.js` | WebSocket server attached to HTTP `/ws` | **IMMUTABLE** |
| **Controller Service** | `backend/src/services/controllerService.js` | MQTT controller, relay threshold gating | **IMMUTABLE** |
| **Live Sensor Data Frontend Hook**| `frontend/src/hooks/useWebsocketTelemetry.js`| Multi-transport fallback (WS + MQTT + Polling) | **PRESERVED** |
| **ESP32 Firmware Source** | `iot/esp32/rootpulse_sensor.ino` | Firmware template matching live hardware | **IMMUTABLE** |

---

## 2. Protected Network & Broker Configurations

* **MQTT Broker URL:** `mqtt://10.82.161.183:1883` (Primary), `ws://10.76.50.208:8080/mqtt`
* **MQTT Credentials:** `username: "esp32com"`, `password: "esp32aug"`
* **Active Topics:**
  * `esp32/telemetry` (Incoming sensor stream)
  * `esp32/relay1` (Relay 1 actuation: `ON`/`OFF`)
  * `esp32/relay2` (Relay 2 actuation: `ON`/`OFF`)
  * `esp32/cmd` (Calibration commands: `soil_dry`, `soil_wet`)
  * `esp32/cfg/set` (Remote calibration JSON)
* **WebSocket Endpoints:**
  * `ws://localhost:5001/ws` (Backend WebSocket bridge)
  * `ws://10.76.50.208:8080` (Direct MQTT/WS server)

---

## 3. Protected Sensor Data Schema (Normalized Output)

Every reading consumed by new modules adheres to this structure:
```json
{
  "deviceId": "esp32-01",
  "temperature": 27.3,
  "humidity": 64.6,
  "soilPct": 40,
  "ldrPct": 14,
  "relay1": 0,
  "relay2": 0,
  "mqtt": 1,
  "timestamp": "2026-11-06T..."
}
```

---

## 4. Safe Read-Only Adapter Pattern for BERUDRISHTI Modules

All new modules (**RootSphere**, **RhizoAI**, **RootVision**, **AquaRoot**, **RootNet**, **SoilGuard**, and **AI Farmer Assistant**) read live sensor readings via:
```javascript
const { getLatestTelemetry } = require('./services/telemetryService');
// Always read-only. Never overwrites or mutates live hardware readings.
```

