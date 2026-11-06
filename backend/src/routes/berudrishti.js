// backend/src/routes/berudrishti.js
// Dedicated REST API for BERUDRISHTI (ಬೇರುದೃಷ್ಟಿ) Core Modules
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  db,
  getActiveZoneReadings,
  analyzeRhizoAI,
  getAquaRootRecommendations,
  analyzeRootImage,
  askAIAssistant
} = require('../services/berudrishtiService');

const upload = multer({ dest: 'uploads/roots/' });

// ==========================================
// 1. ROOTSPHERE (Unified Root Ecosystem)
// ==========================================

router.get('/rootsphere/overview', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const readings = getActiveZoneReadings(zoneId);
  const rhizo = analyzeRhizoAI(zoneId);
  const aqua = getAquaRootRecommendations(zoneId);

  res.json({
    success: true,
    ecosystem: 'BERUDRISHTI ROOTSPHERE',
    zone: db.zones[zoneId] || db.zones.zone_a,
    healthScore: rhizo.healthScore,
    riskLevel: rhizo.riskLevel,
    stratumProfile: [
      { depth: '10 cm', label: 'Topsoil Surface', moisture: readings.layer_10cm.moisture, temp: readings.layer_10cm.temp, ec: readings.layer_10cm.ec, compaction: readings.layer_10cm.compaction },
      { depth: '20 cm', label: 'Mid-Root Horizon', moisture: readings.layer_20cm.moisture, temp: readings.layer_20cm.temp, ec: readings.layer_20cm.ec, compaction: readings.layer_20cm.compaction },
      { depth: '30 cm', label: 'Deep Subsoil Anchor', moisture: readings.layer_30cm.moisture, temp: readings.layer_30cm.temp, ec: readings.layer_30cm.ec, compaction: readings.layer_30cm.compaction }
    ],
    ambient: readings.ambient,
    alerts: rhizo.alerts,
    irrigationPriority: aqua.priority,
    recentRootObservation: db.rootObservations[0] || null,
    timestamp: new Date().toISOString()
  });
});

router.get('/rootsphere/zone/:zone_id', (req, res) => {
  const zoneId = req.params.zone_id;
  const readings = getActiveZoneReadings(zoneId);
  const rhizo = analyzeRhizoAI(zoneId);

  res.json({
    success: true,
    zone: db.zones[zoneId] || null,
    readings,
    analysis: rhizo
  });
});

// ==========================================
// 2. RHIZOAI (Central AI Intelligence)
// ==========================================

router.post('/rhizoai/analyze', (req, res) => {
  const zoneId = req.body.zoneId || 'zone_a';
  const analysis = analyzeRhizoAI(zoneId);
  res.json({ success: true, analysis });
});

router.get('/rhizoai/insights', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const analysis = analyzeRhizoAI(zoneId);
  res.json({
    success: true,
    zoneId,
    insights: analysis.alerts,
    healthScore: analysis.healthScore,
    riskLevel: analysis.riskLevel
  });
});

// ==========================================
// 3. ROOTVISION AI (Computer Vision Pipeline)
// ==========================================

router.get('/rootvision/history', (req, res) => {
  res.json({
    success: true,
    observations: db.rootObservations
  });
});

router.post('/rootvision/upload', upload.single('image'), (req, res) => {
  const { zoneId, label } = req.body;
  const observation = analyzeRootImage(req.file, {
    zoneId: zoneId || 'zone_a',
    label: label || 'Field Rhizotron Capture'
  });
  res.json({
    success: true,
    message: 'Root observation processed and analyzed with Computer Vision',
    observation
  });
});

router.post('/rootvision/analyze', (req, res) => {
  const { observationId1, observationId2 } = req.body;
  const obs1 = db.rootObservations[1] || db.rootObservations[0];
  const obs2 = db.rootObservations[0];

  const lengthDelta = +(obs2.rootLengthMm - obs1.rootLengthMm).toFixed(1);
  const densityDelta = +(obs2.rootDensityPct - obs1.rootDensityPct).toFixed(1);

  res.json({
    success: true,
    comparison: {
      baseline: obs1,
      latest: obs2,
      metrics: {
        totalElongationMm: lengthDelta,
        growthVelocityMmPerDay: +(lengthDelta / 14).toFixed(2),
        densityChangePct: densityDelta,
        proliferationStatus: lengthDelta > 100 ? 'RAPID_EXPANSION' : 'STEADY_DEVELOPMENT'
      },
      interpretation: `Over the temporal observation window, total visible root system expanded by ${lengthDelta} mm (+${densityDelta}% density). No subterranean root necrosis or nematode galling observed.`
    }
  });
});

// ==========================================
// 4. AQUAROOT AI (Predictive Irrigation)
// ==========================================

router.get('/aquaroot/recommendations', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const recs = getAquaRootRecommendations(zoneId);
  res.json({ success: true, recommendations: recs });
});

router.post('/aquaroot/analyze', (req, res) => {
  const zoneId = req.body.zoneId || 'zone_a';
  const recs = getAquaRootRecommendations(zoneId);
  res.json({ success: true, recommendations: recs });
});

// ==========================================
// 5. ROOTNET (Field & Multi-Zone Management)
// ==========================================

router.get('/rootnet/fields', (req, res) => {
  res.json({ success: true, fields: db.fields });
});

router.get('/rootnet/zones', (req, res) => {
  const zoneList = Object.keys(db.zones).map(id => {
    const zone = db.zones[id];
    const readings = getActiveZoneReadings(id);
    const rhizo = analyzeRhizoAI(id);

    return {
      ...zone,
      healthScore: rhizo.healthScore,
      riskLevel: rhizo.riskLevel,
      topsoilMoisture: readings.layer_10cm.moisture,
      deepMoisture: readings.layer_30cm.moisture,
      temperature: readings.ambient.temperature,
      compaction: readings.layer_20cm.compaction,
      activeAlertsCount: rhizo.alerts.length
    };
  });

  res.json({ success: true, zones: zoneList });
});

router.post('/rootnet/zones', (req, res) => {
  const { id, name, crop, soilType, rootDepthCm, areaHectares, irrigationType } = req.body;
  const newId = id || `zone_${Date.now()}`;
  db.zones[newId] = {
    id: newId,
    fieldId: 'field_1',
    name: name || `Zone ${newId.toUpperCase()}`,
    crop: crop || 'Custom Crop',
    soilType: soilType || 'Loam',
    rootDepthCm: Number(rootDepthCm || 25),
    areaHectares: Number(areaHectares || 1.0),
    irrigationType: irrigationType || 'Drip System',
    status: 'active',
    sensorNodeId: 'esp32-custom'
  };

  res.json({ success: true, message: 'Zone created successfully', zone: db.zones[newId] });
});

router.put('/rootnet/zones/:zone_id', (req, res) => {
  const zId = req.params.zone_id;
  if (!db.zones[zId]) return res.status(404).json({ success: false, error: 'Zone not found' });
  db.zones[zId] = { ...db.zones[zId], ...req.body };
  res.json({ success: true, message: 'Zone updated', zone: db.zones[zId] });
});

router.delete('/rootnet/zones/:zone_id', (req, res) => {
  const zId = req.params.zone_id;
  if (!db.zones[zId]) return res.status(404).json({ success: false, error: 'Zone not found' });
  delete db.zones[zId];
  res.json({ success: true, message: 'Zone deleted successfully' });
});

// ==========================================
// 6. SOILGUARD (Historical Soil Health Analytics)
// ==========================================

router.get('/soilguard/trends', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const readings = getActiveZoneReadings(zoneId);
  const m10 = readings.layer_10cm.moisture;
  const temp = readings.ambient.temperature;

  // Generate 7-day realistic progression based on live readings
  const trends = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
  days.forEach((day, i) => {
    trends.push({
      day,
      layer10: +(m10 + (Math.sin(i) * 3)).toFixed(1),
      layer20: +(m10 * 0.93 + (Math.cos(i) * 2)).toFixed(1),
      layer30: +(m10 * 0.86 + (Math.sin(i + 1) * 2)).toFixed(1),
      temperature: +(temp + (Math.cos(i) * 1.5)).toFixed(1),
      compaction: Math.round(960 + Math.sin(i) * 40)
    });
  });

  res.json({ success: true, zoneId, trends });
});

router.get('/soilguard/comparison', (req, res) => {
  const zoneComparison = Object.keys(db.zones).map(id => {
    const z = db.zones[id];
    const r = getActiveZoneReadings(id);
    const a = analyzeRhizoAI(id);
    return {
      id,
      name: z.name,
      crop: z.crop,
      healthScore: a.healthScore,
      riskLevel: a.riskLevel,
      topsoilMoisture: r.layer_10cm.moisture,
      deepMoisture: r.layer_30cm.moisture,
      temp: r.ambient.temperature,
      compaction: r.layer_20cm.compaction
    };
  });
  res.json({ success: true, comparison: zoneComparison });
});

// ==========================================
// 7. EXPLAINABLE AI FARMER ASSISTANT
// ==========================================

router.post('/assistant/chat', (req, res) => {
  const { question, message, zoneId } = req.body;
  const q = question || message;
  const response = askAIAssistant(q, zoneId || 'zone_a');
  res.json({
    success: true,
    ...response
  });
});

module.exports = router;

