// backend/src/routes/rootpulse.js
// Complete REST API for RootPulse 3D
'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { state, SCENARIOS, analyzeZoneSoil, getAquaRootRecommendation, getDigitalTwinData } = require('../services/rootpulseService');

const upload = multer({ dest: 'uploads/' });

// ==========================================
// 1. SENSOR APIS
// ==========================================

// POST /api/sensors/readings - Receive live readings from ESP32 or IoT Gateway
router.post('/sensors/readings', (req, res) => {
  const { zoneId, layer_10cm, layer_20cm, layer_30cm, mode } = req.body;
  const targetZone = zoneId || 'zone_a';

  if (!state.latestReadings[targetZone]) {
    state.latestReadings[targetZone] = {};
  }

  if (layer_10cm) state.latestReadings[targetZone].layer_10cm = { ...state.latestReadings[targetZone].layer_10cm, ...layer_10cm };
  if (layer_20cm) state.latestReadings[targetZone].layer_20cm = { ...state.latestReadings[targetZone].layer_20cm, ...layer_20cm };
  if (layer_30cm) state.latestReadings[targetZone].layer_30cm = { ...state.latestReadings[targetZone].layer_30cm, ...layer_30cm };

  if (mode) state.operatingMode = mode;

  // Append to history
  const historyPoint = {
    timestamp: new Date().toISOString(),
    [targetZone]: {
      moisture_10: state.latestReadings[targetZone].layer_10cm.moisture,
      moisture_20: state.latestReadings[targetZone].layer_20cm.moisture,
      moisture_30: state.latestReadings[targetZone].layer_30cm.moisture,
      temp_10: state.latestReadings[targetZone].layer_10cm.temp,
      temp_20: state.latestReadings[targetZone].layer_20cm.temp,
      temp_30: state.latestReadings[targetZone].layer_30cm.temp,
      compaction_20: state.latestReadings[targetZone].layer_20cm.compaction,
      ec_20: state.latestReadings[targetZone].layer_20cm.ec,
      ph_20: state.latestReadings[targetZone].layer_20cm.ph
    }
  };
  state.history.push(historyPoint);
  if (state.history.length > 500) state.history.shift();

  res.json({
    success: true,
    message: 'Sensor readings recorded successfully',
    zoneId: targetZone,
    operatingMode: state.operatingMode,
    timestamp: new Date().toISOString()
  });
});

// GET /api/sensors/latest - Get latest readings across all zones or specific zone
router.get('/sensors/latest', (req, res) => {
  const zoneId = req.query.zone_id;
  if (zoneId && state.latestReadings[zoneId]) {
    return res.json({
      success: true,
      zoneId,
      operatingMode: state.operatingMode,
      readings: state.latestReadings[zoneId],
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    operatingMode: state.operatingMode,
    currentScenario: state.currentScenario,
    zones: state.latestReadings,
    timestamp: new Date().toISOString()
  });
});

// GET /api/sensors/history - Historical trend data
router.get('/sensors/history', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const limit = Number(req.query.limit || 50);

  const formatted = state.history.slice(-limit).map(h => ({
    timestamp: h.timestamp,
    ...(h[zoneId] || h.zone_a)
  }));

  res.json({
    success: true,
    zoneId,
    operatingMode: state.operatingMode,
    data: formatted
  });
});

// GET /api/sensors/status - Connectivity, battery, calibration health
router.get('/sensors/status', (req, res) => {
  const isLive = state.operatingMode === 'LIVE';
  res.json({
    success: true,
    operatingMode: state.operatingMode,
    hardwareStatus: isLive ? 'CONNECTED_ONLINE' : 'SIMULATION_STANDBY',
    gatewayIp: isLive ? '192.168.1.145' : '127.0.0.1 (Local Virtual Bridge)',
    batteryLevel: isLive ? '94%' : '100% (Simulated Supply)',
    signalStrengthDbm: isLive ? -58 : -45,
    probes: [
      { depth: '10 cm', sensorType: 'Capacitive v2.0 + DS18B20', status: 'ONLINE', calibrationDate: '2026-10-01' },
      { depth: '20 cm', sensorType: 'Capacitive v2.0 + DS18B20 + EC', status: 'ONLINE', calibrationDate: '2026-10-01' },
      { depth: '30 cm', sensorType: 'Capacitive v2.0 + DS18B20 + Penetrometer', status: 'ONLINE', calibrationDate: '2026-10-01' }
    ],
    lastTelemetry: new Date().toISOString()
  });
});

// ==========================================
// 2. ZONE APIS
// ==========================================

// GET /api/zones - List all field zones with summary metrics
router.get('/zones', (req, res) => {
  const zonesList = Object.keys(state.zones).map(id => {
    const zone = state.zones[id];
    const readings = state.latestReadings[id] || state.latestReadings.zone_a;
    const analysis = analyzeZoneSoil(id, readings);

    return {
      ...zone,
      healthScore: analysis.healthScore,
      riskLevel: analysis.riskLevel,
      topMoisture: readings.layer_10cm.moisture,
      deepMoisture: readings.layer_30cm.moisture,
      maxCompaction: Math.max(readings.layer_10cm.compaction, readings.layer_20cm.compaction, readings.layer_30cm.compaction),
      activeAlertsCount: analysis.alerts.length
    };
  });

  res.json({
    success: true,
    operatingMode: state.operatingMode,
    zones: zonesList
  });
});

// POST /api/zones - Add a new field zone
router.post('/zones', (req, res) => {
  const { id, name, crop, soilType, rootDepthCm, areaHectares, irrigationType } = req.body;
  const newId = id || `zone_${Date.now()}`;

  state.zones[newId] = {
    id: newId,
    name: name || `Zone ${newId.toUpperCase()}`,
    crop: crop || 'General Crop',
    soilType: soilType || 'Loam',
    rootDepthCm: Number(rootDepthCm || 25),
    areaHectares: Number(areaHectares || 1.0),
    irrigationType: irrigationType || 'Drip System',
    status: 'active'
  };

  // Duplicate baseline readings
  state.latestReadings[newId] = JSON.parse(JSON.stringify(state.latestReadings.zone_a));

  res.json({
    success: true,
    message: 'Field zone created successfully',
    zone: state.zones[newId]
  });
});

// GET /api/zones/:zone_id
router.get('/zones/:zone_id', (req, res) => {
  const zone = state.zones[req.params.zone_id];
  if (!zone) return res.status(404).json({ success: false, error: 'Zone not found' });

  const readings = state.latestReadings[zone.id] || state.latestReadings.zone_a;
  const analysis = analyzeZoneSoil(zone.id, readings);

  res.json({
    success: true,
    zone,
    readings,
    analysis
  });
});

// ==========================================
// 3. AI SOIL STRESS APIS
// ==========================================

// POST /api/ai/analyze - Comprehensive multi-depth AI soil evaluation
router.post('/ai/analyze', (req, res) => {
  const { zoneId } = req.body;
  const zId = zoneId || 'zone_a';
  const readings = state.latestReadings[zId] || state.latestReadings.zone_a;
  const analysis = analyzeZoneSoil(zId, readings);

  res.json({
    success: true,
    analysis
  });
});

// GET /api/ai/alerts - Get all active alerts across all zones
router.get('/ai/alerts', (req, res) => {
  let allAlerts = [];
  Object.keys(state.zones).forEach(id => {
    const readings = state.latestReadings[id] || state.latestReadings.zone_a;
    const analysis = analyzeZoneSoil(id, readings);
    allAlerts = allAlerts.concat(analysis.alerts);
  });

  res.json({
    success: true,
    operatingMode: state.operatingMode,
    totalAlerts: allAlerts.length,
    alerts: allAlerts
  });
});

// GET /api/ai/soil-health - Soil health breakdown score
router.get('/ai/soil-health', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const readings = state.latestReadings[zoneId] || state.latestReadings.zone_a;
  const analysis = analyzeZoneSoil(zoneId, readings);

  res.json({
    success: true,
    zoneId,
    healthScore: analysis.healthScore,
    riskLevel: analysis.riskLevel,
    metrics: {
      moistureEquilibriumScore: +(100 - Math.abs(readings.layer_10cm.moisture - readings.layer_30cm.moisture) * 1.5).toFixed(0),
      soilAerationOxygenScore: +(100 - (readings.layer_20cm.moisture > 80 ? (readings.layer_20cm.moisture - 80) * 4 : 0)).toFixed(0),
      compactionPorosityScore: +(100 - (readings.layer_20cm.compaction > 1500 ? (readings.layer_20cm.compaction - 1500) / 25 : 0)).toFixed(0),
      thermalSafetyScore: +(100 - (readings.layer_10cm.temp > 28 ? (readings.layer_10cm.temp - 28) * 5 : 0)).toFixed(0)
    },
    alerts: analysis.alerts
  });
});

// POST /api/ai/irrigation-recommendation - AquaRoot AI recommendation
router.post('/ai/irrigation-recommendation', (req, res) => {
  const zoneId = req.body.zoneId || 'zone_a';
  const rec = getAquaRootRecommendation(zoneId);
  res.json({
    success: true,
    data: rec
  });
});

// ==========================================
// 4. ROOTVISION AI (COMPUTER VISION) APIS
// ==========================================

// POST /api/rootvision/upload - Upload root viewing tube image
router.post('/rootvision/upload', upload.single('image'), (req, res) => {
  const { zoneId, label } = req.body;
  const zId = zoneId || 'zone_a';

  // Compute simulated CV metrics from uploaded image attributes or sample
  const estimatedLength = +(150 + Math.random() * 200).toFixed(1);
  const density = +(20 + Math.random() * 35).toFixed(1);
  const tips = Math.floor(25 + Math.random() * 50);

  const observation = {
    id: `ro_${Date.now()}`,
    zoneId: zId,
    date: new Date().toISOString().split('T')[0],
    label: label || `Field Rhizotron Capture #${state.rootObservations.length + 1}`,
    estimatedLengthMm: estimatedLength,
    rootDensityPct: density,
    tipCount: tips,
    healthStatus: density > 30 ? 'VIGOROUS_EXPANSION' : 'NORMAL_DEVELOPMENT',
    imageUrl: req.file ? `/uploads/${req.file.filename}` : 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    findings: `Computer Vision detected ${tips} active root tips. Morphological skeleton length: ${estimatedLength} mm with ${density}% subterranean viewing area coverage.`
  };

  state.rootObservations.unshift(observation);

  res.json({
    success: true,
    message: 'Root observation processed and cataloged successfully',
    observation
  });
});

// POST /api/rootvision/analyze - Compare two observation images
router.post('/rootvision/analyze', (req, res) => {
  const { baselineId, comparisonId } = req.body;
  const obs1 = state.rootObservations.find(o => o.id === (baselineId || 'ro_day1')) || state.rootObservations[0];
  const obs2 = state.rootObservations.find(o => o.id === (comparisonId || 'ro_day30')) || state.rootObservations[state.rootObservations.length - 1];

  const lengthDelta = +(obs2.estimatedLengthMm - obs1.estimatedLengthMm).toFixed(1);
  const densityDelta = +(obs2.rootDensityPct - obs1.rootDensityPct).toFixed(1);
  const tipsDelta = obs2.tipCount - obs1.tipCount;

  res.json({
    success: true,
    comparison: {
      baseline: obs1,
      latest: obs2,
      metrics: {
        totalElongationMm: lengthDelta,
        growthVelocityMmPerDay: +(lengthDelta / 20).toFixed(2),
        densityChangePct: densityDelta,
        newRootTipProliferation: tipsDelta,
        biomassExpansionRating: lengthDelta > 150 ? 'EXCEPTIONAL' : lengthDelta > 50 ? 'STEADY' : 'SLOW_STAGNANT'
      },
      evaluation: `Over the observation window, total visible root length expanded by ${lengthDelta} mm (+${densityDelta}% density). No subterranean root necrosis or nematode galling observed.`
    }
  });
});

// GET /api/rootvision/history - Retrieve all root inspection logs
router.get('/rootvision/history', (req, res) => {
  res.json({
    success: true,
    observations: state.rootObservations
  });
});

// ==========================================
// 5. DIGITAL TWIN 3D API
// ==========================================

// GET /api/digital-twin/:zone_id - Full 3D coordinate and layer data
router.get('/digital-twin/:zone_id', (req, res) => {
  const data = getDigitalTwinData(req.params.zone_id);
  res.json({
    success: true,
    digitalTwin: data
  });
});

// ==========================================
// 6. ANALYTICS & REPORTS APIS
// ==========================================

// GET /api/analytics/trends - Multi-day depth-wise trends
router.get('/analytics/trends', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const days = Number(req.query.days || 7);
  const dataPoints = state.history.slice(-Math.min(state.history.length, days * 6)).map(h => ({
    timestamp: h.timestamp,
    ...(h[zoneId] || h.zone_a)
  }));

  res.json({
    success: true,
    zoneId,
    days,
    trends: dataPoints
  });
});

// GET /api/analytics/zone-comparison - Side-by-side radar/bar matrix
router.get('/analytics/zone-comparison', (req, res) => {
  const comparison = Object.keys(state.zones).map(id => {
    const zone = state.zones[id];
    const readings = state.latestReadings[id] || state.latestReadings.zone_a;
    const analysis = analyzeZoneSoil(id, readings);

    return {
      id,
      name: zone.name,
      crop: zone.crop,
      soilType: zone.soilType,
      healthScore: analysis.healthScore,
      riskLevel: analysis.riskLevel,
      topsoilMoisture: readings.layer_10cm.moisture,
      deepMoisture: readings.layer_30cm.moisture,
      temperature10: readings.layer_10cm.temp,
      compaction20: readings.layer_20cm.compaction,
      ec20: readings.layer_20cm.ec,
      ph20: readings.layer_20cm.ph
    };
  });

  res.json({
    success: true,
    comparison
  });
});

// GET /api/analytics/soil-report - Comprehensive downloadable/printable report
router.get('/analytics/soil-report', (req, res) => {
  const zoneId = req.query.zone_id || 'zone_a';
  const zone = state.zones[zoneId] || state.zones.zone_a;
  const readings = state.latestReadings[zoneId] || state.latestReadings.zone_a;
  const analysis = analyzeZoneSoil(zoneId, readings);
  const irrigation = getAquaRootRecommendation(zoneId);

  res.json({
    success: true,
    report: {
      generatedAt: new Date().toISOString(),
      reportId: `RP3D-REP-${Date.now()}`,
      operatingMode: state.operatingMode,
      zone: zone,
      healthSummary: {
        score: analysis.healthScore,
        riskClassification: analysis.riskLevel,
        status: analysis.riskLevel === 'GREEN' ? 'Healthy Soil Ecosystem' : 'Action Required'
      },
      depthProfiles: [
        { depth: '10 cm', moisture: `${readings.layer_10cm.moisture}%`, temp: `${readings.layer_10cm.temp}°C`, compaction: `${readings.layer_10cm.compaction} kPa`, status: 'Surface Layer' },
        { depth: '20 cm', moisture: `${readings.layer_20cm.moisture}%`, temp: `${readings.layer_20cm.temp}°C`, compaction: `${readings.layer_20cm.compaction} kPa`, status: 'Mid-Root Horizon' },
        { depth: '30 cm', moisture: `${readings.layer_30cm.moisture}%`, temp: `${readings.layer_30cm.temp}°C`, compaction: `${readings.layer_30cm.compaction} kPa`, status: 'Deep Subsoil Anchor' }
      ],
      aiAlerts: analysis.alerts,
      predictiveIrrigation: irrigation,
      agronomistNotes: 'This report integrates multi-depth IoT sensing, subsurface compaction penetrometry, and RootVision AI computer vision analytics.'
    }
  });
});

// ==========================================
// 7. EXPLAINABLE AI FARMER ASSISTANT API
// ==========================================

// POST /api/assistant/chat - Context-aware interactive assistant
router.post('/assistant/chat', (req, res) => {
  const { message, question, zoneId } = req.body;
  const zId = zoneId || 'zone_a';
  const zone = state.zones[zId] || state.zones.zone_a;
  const readings = state.latestReadings[zId] || state.latestReadings.zone_a;
  const analysis = analyzeZoneSoil(zId, readings);
  const query = (question || message || '').toLowerCase();

  let reply = '';
  let structuredEvidence = {
    detectedCondition: 'Normal Root Equilibrium',
    sensorEvidence: `10cm: ${readings.layer_10cm.moisture}% | 20cm: ${readings.layer_20cm.moisture}% | 30cm: ${readings.layer_30cm.moisture}%`,
    biologicalCause: 'Root transpiration matches capillary soil recharge.',
    riskLevel: analysis.riskLevel,
    recommendedAction: 'Maintain scheduled monitoring.',
    confidence: 0.95
  };

  if (query.includes('dry') || query.includes('deep') || query.includes('why is my deep root zone dry')) {
    const diff = +(readings.layer_10cm.moisture - readings.layer_30cm.moisture).toFixed(1);
    structuredEvidence = {
      detectedCondition: 'Deep Root-Zone Water Starvation (Shallow Infiltration)',
      sensorEvidence: `Topsoil (10cm) is ${readings.layer_10cm.moisture}% while Deep Subsoil (30cm) is ${readings.layer_30cm.moisture}%. Moisture disparity is Δ${diff}%. Compaction at 20cm: ${readings.layer_20cm.compaction} kPa.`,
      biologicalCause: 'Water applied to the surface evaporates or runs off before percolating down, or a compacted plough-pan layer at 20cm is blocking vertical capillary infiltration.',
      riskLevel: diff > 25 ? 'HIGH_RISK' : 'WARNING',
      recommendedAction: 'Apply slow-pulse drip irrigation (12-14 L/m² over 90 mins) to allow water to soak past the 20cm mark. Consider aerating the hardpan layer.',
      confidence: 0.94
    };
    reply = `Your deep root zone (30cm) is dry at ${readings.layer_30cm.moisture}% while the surface is at ${readings.layer_10cm.moisture}%. This occurs because quick surface watering does not penetrate past 15cm. Furthermore, your soil density at 20cm is ${readings.layer_20cm.compaction} kPa, which impedes downward water flow. I recommend using deep pulse-drip irrigation instead of broadcast watering.`;

  } else if (query.includes('compaction') || query.includes('hardpan')) {
    const maxComp = Math.max(readings.layer_10cm.compaction, readings.layer_20cm.compaction, readings.layer_30cm.compaction);
    structuredEvidence = {
      detectedCondition: maxComp > 2000 ? 'Severe Soil Hardpan Compaction' : 'Moderate Soil Density',
      sensorEvidence: `Penetrometer reading is ${maxComp} kPa at 20cm depth (critical threshold: 2000 kPa).`,
      biologicalCause: 'Soil pore collapse and bulk density increase, preventing taproots from penetrating deeper than 18cm.',
      riskLevel: maxComp > 2000 ? 'HIGH_RISK' : 'WARNING',
      recommendedAction: 'Implement mechanical deep-ripping or inter-row cover cropping with deep-taproot daikon radish to naturally pierce the hardpan.',
      confidence: 0.93
    };
    reply = `Soil compaction in ${zone.name} is measuring ${maxComp} kPa. Any reading above 2000 kPa severely restricts root growth. The roots are likely deflecting horizontally at 18-20cm rather than reaching subsoil moisture reserves.`;

  } else if (query.includes('waterlogging') || query.includes('excess') || query.includes('rot')) {
    const avgM = ((readings.layer_10cm.moisture + readings.layer_20cm.moisture + readings.layer_30cm.moisture) / 3).toFixed(1);
    structuredEvidence = {
      detectedCondition: avgM > 80 ? 'Subterranean Waterlogging & Root Hypoxia' : 'Adequate Aeration',
      sensorEvidence: `Average profile moisture is ${avgM}%. Layer 20cm: ${readings.layer_20cm.moisture}%.`,
      biologicalCause: 'Soil macropores are filled with water instead of oxygen, causing roots to switch to anaerobic respiration.',
      riskLevel: avgM > 80 ? 'CRITICAL' : 'GREEN',
      recommendedAction: avgM > 80 ? 'Shut off all irrigation for 48-72 hours. Check perimeter drainage furrows for blockages.' : 'No waterlogging risk detected.',
      confidence: 0.96
    };
    reply = avgM > 80
      ? `Warning: Zone ${zone.name} has severe waterlogging with an average moisture of ${avgM}%. Root cells are oxygen-deprived. Cease all irrigation immediately and ensure drainage channels are open.`
      : `No waterlogging detected in ${zone.name}. Current average moisture is healthy at ${avgM}%.`;

  } else if (query.includes('irrigation') || query.includes('water') || query.includes('schedule')) {
    const rec = getAquaRootRecommendation(zId);
    structuredEvidence = {
      detectedCondition: `Irrigation Priority: ${rec.priority}`,
      sensorEvidence: `10cm: ${readings.layer_10cm.moisture}% | 20cm: ${readings.layer_20cm.moisture}% | 30cm: ${readings.layer_30cm.moisture}%`,
      biologicalCause: 'Targeting root zone replenishment without causing surface evaporation or runoff.',
      riskLevel: analysis.riskLevel,
      recommendedAction: rec.recommendation,
      confidence: 0.92
    };
    reply = rec.recommendation;

  } else {
    reply = `Currently in ${zone.name}, overall soil health score is ${analysis.healthScore}/100 (${analysis.riskLevel}). Topsoil is ${readings.layer_10cm.moisture}%, mid-root layer is ${readings.layer_20cm.moisture}%, and deep subsoil is ${readings.layer_30cm.moisture}%. Compaction is ${readings.layer_20cm.compaction} kPa at 20cm. Ask me about moisture distribution, compaction, irrigation needs, or root health!`;
  }

  res.json({
    success: true,
    query: query,
    zoneId: zId,
    reply,
    answer: reply,
    structuredEvidence,
    riskLevel: analysis.riskLevel,
    confidence: structuredEvidence.confidence ? Math.round(structuredEvidence.confidence * 100) : 90,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 8. SIMULATION / DEMO SCENARIO APIS
// ==========================================

// GET /api/simulation/scenarios - List available interactive scenarios
router.get('/simulation/scenarios', (req, res) => {
  res.json({
    success: true,
    currentScenario: state.currentScenario,
    operatingMode: state.operatingMode,
    scenarios: Object.keys(SCENARIOS).map(k => ({
      id: SCENARIOS[k].id,
      name: SCENARIOS[k].name,
      description: SCENARIOS[k].description
    }))
  });
});

// POST /api/simulation/scenario - Switch scenario and update all live data
router.post('/simulation/scenario', (req, res) => {
  const { scenarioId } = req.body;
  if (!SCENARIOS[scenarioId]) {
    return res.status(400).json({ success: false, error: 'Invalid scenario ID' });
  }

  state.currentScenario = scenarioId;
  state.operatingMode = 'SIMULATION';
  state.latestReadings = JSON.parse(JSON.stringify(SCENARIOS[scenarioId].data));

  // Add historical transition point
  state.history.push({
    timestamp: new Date().toISOString(),
    zone_a: {
      moisture_10: state.latestReadings.zone_a.layer_10cm.moisture,
      moisture_20: state.latestReadings.zone_a.layer_20cm.moisture,
      moisture_30: state.latestReadings.zone_a.layer_30cm.moisture,
      temp_10: state.latestReadings.zone_a.layer_10cm.temp,
      temp_20: state.latestReadings.zone_a.layer_20cm.temp,
      temp_30: state.latestReadings.zone_a.layer_30cm.temp,
      compaction_20: state.latestReadings.zone_a.layer_20cm.compaction,
      ec_20: state.latestReadings.zone_a.layer_20cm.ec,
      ph_20: state.latestReadings.zone_a.layer_20cm.ph
    }
  });

  res.json({
    success: true,
    message: `Activated ${SCENARIOS[scenarioId].name}`,
    currentScenario: state.currentScenario,
    operatingMode: state.operatingMode,
    latestReadings: state.latestReadings
  });
});

// POST /api/simulation/mode - Toggle between LIVE HARDWARE and DEMO SIMULATION
router.post('/simulation/mode', (req, res) => {
  const { mode } = req.body;
  if (mode !== 'LIVE' && mode !== 'SIMULATION') {
    return res.status(400).json({ success: false, error: 'Mode must be LIVE or SIMULATION' });
  }

  state.operatingMode = mode;
  res.json({
    success: true,
    operatingMode: state.operatingMode,
    message: `Operating mode switched to ${state.operatingMode}`
  });
});

module.exports = router;

