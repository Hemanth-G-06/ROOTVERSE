// backend/src/mqttBridge.js
// Robust MQTT bridge that forwards messages to wsBroadcast and saves telemetry to MongoDB
const mqtt = require('mqtt');
const { saveTelemetry, normalizePayload } = require('./services/telemetryService');
const { updateFromLiveTelemetry } = require('./services/rootpulseService');

function safeParse(str) {
  try { return JSON.parse(str); } catch (e) { return null; }
}

function start(options = {}) {
  const primaryUrl = options.mqttUrl || process.env.MQTT_URL || 'mqtt://10.82.161.183:1883';
  const {
    mqttUser = process.env.MQTT_USER || 'esp32com',
    mqttPass = process.env.MQTT_PASS || 'esp32aug',
    topics = ['esp32/telemetry', 'esp32/#'],
    clientId = process.env.MQTT_CLIENT_ID || `ag360-backend-${Math.floor(Math.random()*10000)}`,
    clean = (process.env.MQTT_CLEAN || 'false') === 'true',
    wsBroadcast // function(msgString) => void
  } = options;

  if (typeof wsBroadcast !== 'function') {
    throw new Error('mqttBridge.start requires wsBroadcast callback');
  }

  // Candidate URLs for auto-fallback:
  const candidateUrls = [
    primaryUrl,
    'mqtt://10.82.161.183:1883',
    'ws://10.76.50.208:8080/mqtt',
    'mqtt://10.76.50.208:1883'
  ].filter(Boolean);
  const brokerUrls = [...new Set(candidateUrls)];
  let urlIndex = 0;

  const connectOpts = {
    clientId,
    username: mqttUser || undefined,
    password: mqttPass || undefined,
    keepalive: 30,
    reconnectPeriod: 4000,
    connectTimeout: 8_000,
    clean,
    protocolVersion: 4
  };

  let client = null;
  let stopped = false;
  let subscribed = false;
  let hasLoggedError = false;

  function log(...args) { console.log('[mqttBridge]', ...args); }
  function errLog(...args) { console.error('[mqttBridge]', ...args); }

  function handleMessage(topic, payload) {
    let rawStr = payload ? payload.toString() : '';
    let data = safeParse(rawStr);

    // Normalize incoming telemetry (cleans up whitespace in keys like "humidit y", etc.)
    const normalized = normalizePayload(data || rawStr);

    if (normalized) {
      log(`📡 ESP32 Telemetry [${topic}]: Soil=${normalized.soilPct}% Temp=${normalized.temperature}°C Hum=${normalized.humidity}% LDR=${normalized.ldrPct}% R1=${normalized.relay1} R2=${normalized.relay2}`);

      // 1. Update RootPulse 3D in-memory digital twin & scenario state
      try {
        updateFromLiveTelemetry(normalized);
      } catch (e) {
        errLog('updateFromLiveTelemetry error', e && e.message);
      }

      // 2. Conditionally save to MongoDB if meaningful change detected
      try {
        saveTelemetry(normalized);
      } catch (e) {
        errLog('saveTelemetry error', e && e.message);
      }
    }

    // Broadcast to WebSocket clients
    try {
      const envelope = {
        topic,
        data: normalized || data || rawStr,
        ts: Date.now()
      };
      wsBroadcast(JSON.stringify(envelope));
    } catch (e) {
      errLog('wsBroadcast error', e && e.message);
    }
  }

  function ensureSubscribed() {
    if (!client) return;
    if (!client.connected) return;
    if (subscribed) return;

    topics.forEach((t) => {
      try {
        client.subscribe(t, { qos: 0 }, (err, granted) => {
          if (err) {
            errLog('subscribe error for', t, err && err.message);
            return;
          }
          log('subscribed', t, '->', (granted || []).map(g => `${g.topic}@${g.qos}`).join(','));
          subscribed = true;
        });
      } catch (e) {
        errLog('subscribe threw for', t, e && e.message);
      }
    });
  }

  function createClient() {
    if (stopped) return;
    if (client) return;

    const currentUrl = brokerUrls[urlIndex % brokerUrls.length];
    if (!hasLoggedError) log('attempting connection to', currentUrl, 'as', clientId);

    try {
      client = mqtt.connect(currentUrl, connectOpts);

      client.on('connect', () => {
        hasLoggedError = false;
        log('✅ Connected to MQTT broker:', currentUrl);
        subscribed = false;
        ensureSubscribed();
        try { client.publish('ag360/status', 'online', { retain: true, qos: 0 }); } catch(e) {}
      });

      client.on('message', (topic, payload) => {
        try {
          handleMessage(topic, payload);
        } catch (e) {
          errLog('message handler error', e && e.message);
        }
      });

      client.on('reconnect', () => {
        if (!hasLoggedError) log('reconnecting to', currentUrl);
      });

      client.on('close', () => {
        subscribed = false;
      });

      client.on('error', (err) => {
        if (!hasLoggedError) {
          hasLoggedError = true;
          console.warn(`[mqttBridge] ℹ️ Connection attempt to ${currentUrl} failed (${err && err.message}). Rotating to next candidate broker...`);
        }
        try { client.end(true); } catch (e) {}
        client = null;

        // Try next candidate URL
        urlIndex++;
        setTimeout(() => {
          if (!stopped) createClient();
        }, 5000);
      });
    } catch (e) {
      urlIndex++;
      setTimeout(() => { if (!stopped) createClient(); }, 5000);
    }
  }

  createClient();

  function stop() {
    stopped = true;
    if (!client) return;
    try {
      try { client.publish('ag360/status', 'offline', { retain: true, qos: 0 }, () => client.end(true)); } catch (e) { client.end(true); }
    } catch (e) {
      errLog('error stopping client', e && e.message);
    } finally {
      client = null;
    }
  }

  return {
    stop,
    get client() { return client; }
  };
}

module.exports = { start };
