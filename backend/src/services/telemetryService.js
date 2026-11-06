// backend/src/services/telemetryService.js
'use strict';

const Telemetry = require('../models/Telemetry');

let lastSavedTelemetry = null;
let lastSavedTimestamp = 0;
let latestLiveTelemetry = {
  deviceId: 'esp32-01',
  temperature: 27.3,
  humidity: 64.6,
  soilPct: 40,
  ldrPct: 14,
  relay1: 0,
  relay2: 0,
  mqtt: 1,
  timestamp: new Date()
};

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // Force save at least once every 5 minutes

/**
 * Deep key sanitizer:
 * Strips whitespace, lowercases keys, and handles malformed keys (e.g., "humidit y" -> "humidity", " mqtt" -> "mqtt")
 */
function sanitizeRawObject(raw) {
  if (!raw) return {};
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      // If it fails to parse because of trailing commas or spaces, try lenient extraction
      try {
        const cleanedStr = raw.replace(/\r?\n|\r/g, ' ').trim();
        obj = JSON.parse(cleanedStr);
      } catch (e2) {
        return {};
      }
    }
  }

  if (typeof obj !== 'object' || obj === null) return {};

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    const cleanKey = String(k).replace(/\s+/g, '').toLowerCase();
    clean[cleanKey] = v;
  }
  return clean;
}

function parseNumeric(val, fallback = null) {
  if (val === undefined || val === null) return fallback;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return !isNaN(n) && isFinite(n) ? n : fallback;
}

/**
 * Normalize and parse raw payload from MQTT or HTTP
 */
function normalizePayload(payload) {
  if (!payload) return null;

  const clean = sanitizeRawObject(payload);

  const rawTemp = clean['temperature'] ?? clean['temp'] ?? clean['t'];
  const rawHum = clean['humidity'] ?? clean['hum'] ?? clean['h'];
  const rawSoil = clean['soilpct'] ?? clean['soil_pct'] ?? clean['soilmoisture'] ?? clean['soil_moisture'] ?? clean['soilraw'] ?? clean['soil_raw'] ?? clean['soil'] ?? clean['moisture'] ?? clean['s'];
  const rawLdr = clean['ldrpct'] ?? clean['ldr'] ?? clean['light'] ?? clean['l'];

  const temp = parseNumeric(rawTemp, null);
  const hum = parseNumeric(rawHum, null);
  let soil = parseNumeric(rawSoil, null);
  if (soil !== null && soil > 100) {
    soil = Math.round(Math.max(0, Math.min(100, ((3000 - soil) / (3000 - 1300)) * 100)));
  }
  const ldr = parseNumeric(rawLdr, null);

  const r1Raw = clean['relay1'] ?? clean['r1'] ?? 0;
  const r2Raw = clean['relay2'] ?? clean['r2'] ?? 0;
  const r1 = (String(r1Raw).toUpperCase() === 'ON' || Number(r1Raw) === 1) ? 1 : 0;
  const r2 = (String(r2Raw).toUpperCase() === 'ON' || Number(r2Raw) === 1) ? 1 : 0;

  const deviceId = String(clean['deviceid'] ?? clean['device'] ?? 'esp32-01').trim();
  const isMqtt = clean['mqtt'] ? 1 : 0;

  return {
    deviceId: deviceId || 'esp32-01',
    temperature: temp !== null ? +(temp.toFixed(1)) : null,
    humidity: hum !== null ? +(hum.toFixed(1)) : null,
    soilPct: soil !== null ? Math.round(soil) : null,
    ldrPct: ldr !== null ? Math.round(ldr) : null,
    relay1: r1,
    relay2: r2,
    mqtt: isMqtt,
    raw: payload,
    timestamp: new Date()
  };
}

/**
 * Check if the new reading differs significantly from the last saved reading.
 */
function isMeaningfulChange(current, last, lastTs) {
  if (!last) return true; // First reading always saved

  const now = Date.now();
  if (now - lastTs >= HEARTBEAT_INTERVAL_MS) {
    return true; // Periodic heartbeat
  }

  // Check relay state change
  if (current.relay1 !== last.relay1 || current.relay2 !== last.relay2) {
    return true;
  }

  // Check temperature delta (>= 0.4°C)
  if (typeof current.temperature === 'number' && typeof last.temperature === 'number') {
    if (Math.abs(current.temperature - last.temperature) >= 0.4) return true;
  } else if (current.temperature !== last.temperature) {
    return true;
  }

  // Check humidity delta (>= 1.5%)
  if (typeof current.humidity === 'number' && typeof last.humidity === 'number') {
    if (Math.abs(current.humidity - last.humidity) >= 1.5) return true;
  } else if (current.humidity !== last.humidity) {
    return true;
  }

  // Check soil moisture delta (>= 1%)
  if (typeof current.soilPct === 'number' && typeof last.soilPct === 'number') {
    if (Math.abs(current.soilPct - last.soilPct) >= 1.0) return true;
  } else if (current.soilPct !== last.soilPct) {
    return true;
  }

  // Check LDR delta (>= 2%)
  if (typeof current.ldrPct === 'number' && typeof last.ldrPct === 'number') {
    if (Math.abs(current.ldrPct - last.ldrPct) >= 2.0) return true;
  } else if (current.ldrPct !== last.ldrPct) {
    return true;
  }

  return false;
}

/**
 * Save telemetry to MongoDB conditionally on meaningful change
 */
async function saveTelemetry(rawPayload) {
  try {
    const doc = normalizePayload(rawPayload);
    if (!doc) return null;

    // Cache latest live telemetry in memory immediately
    latestLiveTelemetry = doc;

    // Check if change is meaningful
    const meaningful = isMeaningfulChange(doc, lastSavedTelemetry, lastSavedTimestamp);

    if (meaningful) {
      lastSavedTelemetry = { ...doc };
      lastSavedTimestamp = Date.now();

      // Non-blocking save to MongoDB
      Telemetry.create({
        deviceId: doc.deviceId,
        temperature: doc.temperature,
        humidity: doc.humidity,
        soilPct: doc.soilPct,
        ldrPct: doc.ldrPct,
        relay1: doc.relay1,
        relay2: doc.relay2,
        raw: doc.raw,
        createdAt: doc.timestamp
      })
      .then(saved => {
        console.log(`[telemetryService] 💾 Meaningful change saved to MongoDB: Soil=${doc.soilPct}% Temp=${doc.temperature}°C Hum=${doc.humidity}% LDR=${doc.ldrPct}% R1=${doc.relay1} R2=${doc.relay2}`);
      })
      .catch(err => {
        console.warn('[telemetryService] MongoDB save warning:', err && err.message);
      });
    }

    return doc;
  } catch (err) {
    console.error('[telemetryService] unexpected error', err && err.message);
    return null;
  }
}

/**
 * Get the latest known live telemetry
 */
function getLatestTelemetry() {
  return latestLiveTelemetry;
}

module.exports = {
  saveTelemetry,
  normalizePayload,
  sanitizeRawObject,
  getLatestTelemetry,
  isMeaningfulChange
};
