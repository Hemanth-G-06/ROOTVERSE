// backend/src/routes/telemetry.js
'use strict';

const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');
const { getLatestTelemetry, saveTelemetry } = require('../services/telemetryService');
const { updateFromLiveTelemetry } = require('../services/rootpulseService');
const mqttClient = require('../lib/mqttClient');

// GET /api/telemetry/latest or /api/telemetry
router.get(['/', '/latest'], async (req, res) => {
  const cached = getLatestTelemetry();
  if (cached) {
    return res.json({
      success: true,
      source: 'memory_cache',
      telemetry: cached
    });
  }

  // Fallback to latest entry in MongoDB
  try {
    const latestDoc = await Telemetry.findOne().sort({ createdAt: -1 }).lean().exec();
    if (latestDoc) {
      return res.json({
        success: true,
        source: 'mongodb',
        telemetry: {
          deviceId: latestDoc.deviceId,
          temperature: latestDoc.temperature,
          humidity: latestDoc.humidity,
          soilPct: latestDoc.soilPct,
          ldrPct: latestDoc.ldrPct,
          relay1: latestDoc.relay1,
          relay2: latestDoc.relay2,
          timestamp: latestDoc.createdAt
        }
      });
    }
  } catch (err) {
    console.warn('[routes/telemetry] DB query fallback error:', err && err.message);
  }

  res.json({
    success: true,
    source: 'initial_default',
    telemetry: {
      deviceId: 'esp32-01',
      temperature: 27.3,
      humidity: 64.6,
      soilPct: 40,
      ldrPct: 14,
      relay1: 0,
      relay2: 0,
      timestamp: new Date()
    }
  });
});

// GET /api/telemetry/history
router.get('/history', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  try {
    const docs = await Telemetry.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    res.json({
      success: true,
      count: docs.length,
      history: docs.reverse()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/telemetry/relay - Publish relay ON/OFF command to ESP32 over MQTT
router.post('/relay', async (req, res) => {
  const { channel, state } = req.body;
  const ch = Number(channel) === 2 ? 2 : 1;
  const action = (String(state).toUpperCase() === 'ON' || String(state) === '1') ? 'ON' : 'OFF';
  const topic = `esp32/relay${ch}`;

  try {
    await mqttClient.publish(topic, action);
    console.log(`[routes/telemetry] 🔌 Published relay command: ${topic} -> ${action}`);
    res.json({ success: true, message: `Command ${action} sent to ${topic}`, channel: ch, state: action });
  } catch (err) {
    console.error(`[routes/telemetry] ❌ Relay publish error:`, err && err.message);
    res.status(500).json({ success: false, error: err && err.message });
  }
});

// POST /api/telemetry - Allow direct HTTP posting from ESP32 or gateways
router.post('/', async (req, res) => {
  try {
    const saved = await saveTelemetry(req.body);
    if (saved) {
      updateFromLiveTelemetry(saved);
      return res.json({ success: true, message: 'Telemetry received and processed', telemetry: saved });
    }
    res.status(400).json({ success: false, error: 'Invalid telemetry payload' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
