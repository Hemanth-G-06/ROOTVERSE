// frontend/src/hooks/useWebsocketTelemetry.js
import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt from 'mqtt';

/**
 * Universal Telemetry Hook with Robust Multi-Transport Auto-Fallback:
 * 1. Direct MQTT-over-WebSocket at ws://10.76.50.208:8080 (and ws://10.76.50.208:8080/mqtt)
 * 2. Raw Native WebSocket at ws://10.76.50.208:8080
 * 3. Backend WebSocket at ws://localhost:5001/ws
 * 4. Active REST Polling fallback to /api/telemetry/latest every 2s
 *
 * Automatically falls back to whichever transport is alive and receiving packets!
 */

// Lenient sanitizer for incoming keys (handles "humidit y", " mqtt", string numbers, etc.)
function sanitizeTelemetry(raw) {
  if (!raw) return null;
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Unwrap envelope if nested
  if (obj && obj.data && typeof obj.data === 'object') {
    obj = obj.data;
  }

  if (typeof obj !== 'object' || obj === null) return null;

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[String(k).replace(/\s+/g, '').toLowerCase()] = v;
  }

  const parseNum = (val) => {
    if (val === undefined || val === null) return null;
    const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return !isNaN(n) && isFinite(n) ? n : null;
  };

  const temp = parseNum(clean['temperature'] ?? clean['temp'] ?? clean['t']);
  const hum = parseNum(clean['humidity'] ?? clean['hum'] ?? clean['h']);
  const rawSoil = clean['soilpct'] ?? clean['soil_pct'] ?? clean['soilmoisture'] ?? clean['soil_moisture'] ?? clean['soilraw'] ?? clean['soil_raw'] ?? clean['soil'] ?? clean['moisture'] ?? clean['s'];
  let soil = parseNum(rawSoil);
  if (soil !== null && soil > 100) {
    // If raw 12-bit ADC value was sent, accurately map from capacitive curve (Dry ~3000, Wet ~1300)
    soil = Math.round(Math.max(0, Math.min(100, ((3000 - soil) / (3000 - 1300)) * 100)));
  }
  const ldr = parseNum(clean['ldrpct'] ?? clean['ldr'] ?? clean['light'] ?? clean['l']);

  const r1Raw = clean['relay1'] ?? clean['r1'] ?? 0;
  const r2Raw = clean['relay2'] ?? clean['r2'] ?? 0;
  const r1 = (String(r1Raw).toUpperCase() === 'ON' || Number(r1Raw) === 1) ? 1 : 0;
  const r2 = (String(r2Raw).toUpperCase() === 'ON' || Number(r2Raw) === 1) ? 1 : 0;

  return {
    deviceId: String(clean['deviceid'] ?? clean['device'] ?? 'esp32-01'),
    temperature: temp !== null ? +(temp.toFixed(1)) : null,
    humidity: hum !== null ? +(hum.toFixed(1)) : null,
    soilPct: soil !== null ? Math.round(soil) : null,
    ldrPct: ldr !== null ? Math.round(ldr) : null,
    relay1: r1,
    relay2: r2,
    mqtt: clean['mqtt'] ? 1 : 0,
    raw: obj,
    timestamp: new Date()
  };
}

export default function useWebsocketTelemetry() {
  const [telemetry, setTelemetry] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastMsgTs, setLastMsgTs] = useState(null);
  const [source, setSource] = useState('Connecting...');

  const mqttClientRef = useRef(null);
  const externalWsRef = useRef(null);
  const backendWsRef = useRef(null);
  const lastMsgTsRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const onPacketReceived = useCallback((raw, transportName) => {
    const data = sanitizeTelemetry(raw);
    if (!data) return;

    // Verify it contains at least one sensor reading
    if (data.soilPct === null && data.temperature === null && data.humidity === null && data.ldrPct === null) {
      return;
    }

    const now = Date.now();
    lastMsgTsRef.current = now;
    setLastMsgTs(now);
    setTelemetry(data);
    setWsConnected(true);
    setSource(transportName);
  }, []);

  useEffect(() => {
    let active = true;

    // 1. External WebSocket Server URL (from user instruction: 10.76.50.208:8080)
    const EXTERNAL_WS_URLS = [
      'ws://10.76.50.208:8080/mqtt',
      'ws://10.76.50.208:8080',
      'ws://10.82.161.183:8080/mqtt'
    ];

    // Backend API & WS URLs
    const apiHost = process.env.REACT_APP_API_HOST || 'http://localhost:5001';
    const cleanHost = apiHost.replace(/^https?:\/\//i, '');
    const isHttps = window.location.protocol === 'https:' || apiHost.startsWith('https:');
    const BACKEND_WS_URL = `${isHttps ? 'wss' : 'ws'}://${cleanHost}/ws`;
    const HTTP_POLL_URL = `${apiHost.replace(/\/+$/, '')}/api/telemetry/latest`;

    // ------------------------------------------------------------------------
    // Transport A: Direct MQTT over WebSocket (tries 10.76.50.208:8080/mqtt)
    // ------------------------------------------------------------------------
    function connectMqttOverWs() {
      if (!active) return;
      try {
        if (mqttClientRef.current && mqttClientRef.current.connected) return;

        const client = mqtt.connect('ws://10.76.50.208:8080/mqtt', {
          clientId: `ag360_ui_${Math.random().toString(16).slice(2, 8)}`,
          username: process.env.REACT_APP_MQTT_USER || 'esp32com',
          password: process.env.REACT_APP_MQTT_PASS || 'esp32aug',
          reconnectPeriod: 5000,
          connectTimeout: 8000,
          clean: true
        });

        mqttClientRef.current = client;

        client.on('connect', () => {
          if (!active) return;
          console.log('[useWebsocketTelemetry] Connected to MQTT-WS at 10.76.50.208:8080');
          client.subscribe('esp32/telemetry', { qos: 0 });
          client.subscribe('esp32/#', { qos: 0 });
        });

        client.on('message', (topic, payload) => {
          if (!active) return;
          onPacketReceived(payload.toString(), 'MQTT-WS (10.76.50.208)');
        });

        client.on('error', () => {});
        client.on('close', () => {});
      } catch (e) {}
    }

    // ------------------------------------------------------------------------
    // Transport B: Raw WebSocket connection to 10.76.50.208:8080
    // ------------------------------------------------------------------------
    function connectRawExternalWs() {
      if (!active) return;
      try {
        if (externalWsRef.current && (externalWsRef.current.readyState === WebSocket.OPEN || externalWsRef.current.readyState === WebSocket.CONNECTING)) {
          return;
        }

        const ws = new WebSocket('ws://10.76.50.208:8080');
        externalWsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          console.log('[useWebsocketTelemetry] Raw WebSocket connected to 10.76.50.208:8080');
        };

        ws.onmessage = (evt) => {
          if (!active) return;
          onPacketReceived(evt.data, 'WebSocket (10.76.50.208:8080)');
        };

        ws.onclose = () => {
          if (active) setTimeout(connectRawExternalWs, 5000);
        };
        ws.onerror = () => {};
      } catch (e) {
        if (active) setTimeout(connectRawExternalWs, 5000);
      }
    }

    // ------------------------------------------------------------------------
    // Transport C: Backend WebSocket at ws://localhost:5001/ws
    // ------------------------------------------------------------------------
    function connectBackendWs() {
      if (!active) return;
      try {
        if (backendWsRef.current && (backendWsRef.current.readyState === WebSocket.OPEN || backendWsRef.current.readyState === WebSocket.CONNECTING)) {
          return;
        }

        const ws = new WebSocket(BACKEND_WS_URL);
        backendWsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          console.log('[useWebsocketTelemetry] Backend WebSocket connected to', BACKEND_WS_URL);
        };

        ws.onmessage = (evt) => {
          if (!active) return;
          onPacketReceived(evt.data, 'Backend WS (/ws)');
        };

        ws.onclose = () => {
          if (active) setTimeout(connectBackendWs, 3000);
        };
        ws.onerror = () => {};
      } catch (e) {
        if (active) setTimeout(connectBackendWs, 4000);
      }
    }

    // ------------------------------------------------------------------------
    // Transport D: Active REST Polling Fallback (/api/telemetry/latest)
    // ------------------------------------------------------------------------
    async function pollTelemetryHttp() {
      if (!active) return;
      try {
        const res = await fetch(HTTP_POLL_URL, { cache: 'no-cache' });
        if (res.ok) {
          const json = await res.json();
          if (json && json.telemetry) {
            onPacketReceived(json.telemetry, 'HTTP Rest Polling');
          }
        }
      } catch (e) {}
    }

    // Start all candidate connections
    connectMqttOverWs();
    connectRawExternalWs();
    connectBackendWs();
    pollTelemetryHttp();

    // Poll every 2 seconds to guarantee continuous live updates
    pollIntervalRef.current = setInterval(pollTelemetryHttp, 2000);

    // Watchdog check for stale state
    const staleInterval = setInterval(() => {
      const now = Date.now();
      if (lastMsgTsRef.current && (now - lastMsgTsRef.current > 15_000)) {
        setWsConnected(false);
      }
    }, 4000);

    return () => {
      active = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      clearInterval(staleInterval);
      try { if (mqttClientRef.current) mqttClientRef.current.end(true); } catch (e) {}
      try { if (externalWsRef.current) externalWsRef.current.close(); } catch (e) {}
      try { if (backendWsRef.current) backendWsRef.current.close(); } catch (e) {}
    };
  }, [onPacketReceived]);

  return { telemetry, wsConnected, lastMsgTs, source };
}
