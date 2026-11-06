// backend/src/services/rootpulseService.js
// RootPulse 3D Intelligence Engine, Multi-Depth IoT Processor, and Simulation Manager
'use strict';

// In-memory state with persistence fallback
const state = {
  currentScenario: 'scenario_1_optimal',
  operatingMode: 'SIMULATION', // 'LIVE' or 'SIMULATION'
  zones: {
    'zone_a': {
      id: 'zone_a',
      name: 'Zone A - North Orchard (Citrus/Apple)',
      crop: 'Citrus',
      soilType: 'Sandy Loam',
      rootDepthCm: 35,
      areaHectares: 2.5,
      irrigationType: 'Subsurface Drip',
      status: 'active'
    },
    'zone_b': {
      id: 'zone_b',
      name: 'Zone B - Central Fields (Maize/Corn)',
      crop: 'Maize',
      soilType: 'Clay Loam',
      rootDepthCm: 30,
      areaHectares: 4.2,
      irrigationType: 'Center Pivot',
      status: 'active'
    },
    'zone_c': {
      id: 'zone_c',
      name: 'Zone C - South Nursery (Seedlings)',
      crop: 'Tomato Seedlings',
      soilType: 'Peat Organic Mix',
      rootDepthCm: 15,
      areaHectares: 1.1,
      irrigationType: 'Micro-Sprinkler',
      status: 'active'
    },
    'zone_d': {
      id: 'zone_d',
      name: 'Zone D - East Plot (Legumes/Soybean)',
      crop: 'Soybean',
      soilType: 'Silt Loam',
      rootDepthCm: 25,
      areaHectares: 3.0,
      irrigationType: 'Drip System',
      status: 'active'
    }
  },
  latestReadings: {},
  history: [],
  rootObservations: [
    {
      id: 'ro_day1',
      zoneId: 'zone_a',
      date: '2026-10-15',
      label: 'Day 1 - Baseline Rhizotron Observation',
      estimatedLengthMm: 142.5,
      rootDensityPct: 18.4,
      tipCount: 24,
      healthStatus: 'HEALTHY',
      imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
      findings: 'Initial taproot penetration visible down to 18cm. Secondary lateral branch emergence noted.'
    },
    {
      id: 'ro_day14',
      zoneId: 'zone_a',
      date: '2026-10-29',
      label: 'Day 14 - Mid-Growth Observation',
      estimatedLengthMm: 284.2,
      rootDensityPct: 34.6,
      tipCount: 58,
      healthStatus: 'HEALTHY',
      imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80',
      findings: 'Strong lateral expansion at 20cm layer. Root elongation velocity averaged 10.1 mm/day.'
    },
    {
      id: 'ro_day30',
      zoneId: 'zone_a',
      date: '2026-11-05',
      label: 'Day 30 - Deep Root Maturation',
      estimatedLengthMm: 418.0,
      rootDensityPct: 49.2,
      tipCount: 92,
      healthStatus: 'HEALTHY',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      findings: 'Deep subsoil network stabilized at 30cm depth. Fine root hair proliferation indicates high nutrient absorption.'
    }
  ]
};

// Preset Scenarios
const SCENARIOS = {
  scenario_1_optimal: {
    id: 'scenario_1_optimal',
    name: 'Scenario 1: Optimal Root-Zone Equilibrium',
    description: 'Balanced moisture penetration across 10, 20, and 30 cm layers. Low soil compaction (<1000 kPa). Ideal biological growth conditions.',
    data: {
      zone_a: {
        layer_10cm: { moisture: 40.0, temp: 27.3, humidity: 64.6, ldr: 14, ec: 1.25, ph: 6.6, compaction: 820 },
        layer_20cm: { moisture: 37.6, temp: 26.9, humidity: 64.6, ldr: 14, ec: 1.30, ph: 6.7, compaction: 950 },
        layer_30cm: { moisture: 35.2, temp: 26.5, humidity: 64.6, ldr: 14, ec: 1.32, ph: 6.8, compaction: 1040 }
      },
      zone_b: {
        layer_10cm: { moisture: 40.1, temp: 23.1, ec: 1.15, ph: 6.5, compaction: 910 },
        layer_20cm: { moisture: 38.4, temp: 22.5, ec: 1.22, ph: 6.6, compaction: 1020 },
        layer_30cm: { moisture: 37.0, temp: 21.9, ec: 1.28, ph: 6.6, compaction: 1150 }
      },
      zone_c: {
        layer_10cm: { moisture: 42.0, temp: 24.0, ec: 1.10, ph: 6.4, compaction: 650 },
        layer_20cm: { moisture: 40.5, temp: 23.2, ec: 1.15, ph: 6.5, compaction: 780 },
        layer_30cm: { moisture: 39.0, temp: 22.5, ec: 1.20, ph: 6.5, compaction: 890 }
      },
      zone_d: {
        layer_10cm: { moisture: 36.0, temp: 22.0, ec: 1.35, ph: 6.8, compaction: 1100 },
        layer_20cm: { moisture: 34.5, temp: 21.5, ec: 1.40, ph: 6.8, compaction: 1180 },
        layer_30cm: { moisture: 33.2, temp: 20.9, ec: 1.42, ph: 6.9, compaction: 1250 }
      }
    }
  },
  scenario_2_shallow_drought: {
    id: 'scenario_2_shallow_drought',
    name: 'Scenario 2: Surface Wet / Deep Root Drought',
    description: 'Topsoil appears saturated (74%) due to light surface irrigation, but deep root zone at 30cm is critically dry (14%). Roots suffer invisible drought.',
    data: {
      zone_a: {
        layer_10cm: { moisture: 74.5, temp: 24.1, ec: 1.10, ph: 6.5, compaction: 1200 },
        layer_20cm: { moisture: 32.2, temp: 22.8, ec: 1.45, ph: 6.7, compaction: 2350 },
        layer_30cm: { moisture: 13.8, temp: 21.0, ec: 2.10, ph: 7.1, compaction: 2600 }
      },
      zone_b: {
        layer_10cm: { moisture: 68.0, temp: 25.0, ec: 1.18, ph: 6.6, compaction: 1400 },
        layer_20cm: { moisture: 35.0, temp: 23.5, ec: 1.50, ph: 6.8, compaction: 2100 },
        layer_30cm: { moisture: 18.5, temp: 22.0, ec: 1.95, ph: 7.0, compaction: 2450 }
      },
      zone_c: {
        layer_10cm: { moisture: 55.0, temp: 23.5, ec: 1.20, ph: 6.4, compaction: 900 },
        layer_20cm: { moisture: 28.0, temp: 22.0, ec: 1.60, ph: 6.7, compaction: 1600 },
        layer_30cm: { moisture: 16.0, temp: 21.2, ec: 1.90, ph: 6.9, compaction: 1900 }
      },
      zone_d: {
        layer_10cm: { moisture: 65.0, temp: 24.5, ec: 1.30, ph: 6.7, compaction: 1300 },
        layer_20cm: { moisture: 30.5, temp: 23.0, ec: 1.65, ph: 6.9, compaction: 2250 },
        layer_30cm: { moisture: 15.0, temp: 21.8, ec: 2.05, ph: 7.2, compaction: 2550 }
      }
    }
  },
  scenario_3_waterlogging: {
    id: 'scenario_3_waterlogging',
    name: 'Scenario 3: Subterranean Waterlogging & Hypoxia',
    description: 'Continuous flooding with moisture >90% across all layers. Severe lack of soil oxygen (anoxia) causing root respiration suffocation.',
    data: {
      zone_a: {
        layer_10cm: { moisture: 95.2, temp: 19.1, ec: 2.75, ph: 5.8, compaction: 650 },
        layer_20cm: { moisture: 92.4, temp: 18.5, ec: 2.85, ph: 5.7, compaction: 720 },
        layer_30cm: { moisture: 89.8, temp: 18.0, ec: 3.10, ph: 5.6, compaction: 780 }
      },
      zone_b: {
        layer_10cm: { moisture: 91.5, temp: 19.5, ec: 2.60, ph: 6.0, compaction: 700 },
        layer_20cm: { moisture: 88.0, temp: 18.8, ec: 2.70, ph: 5.9, compaction: 750 },
        layer_30cm: { moisture: 85.5, temp: 18.2, ec: 2.90, ph: 5.8, compaction: 800 }
      },
      zone_c: {
        layer_10cm: { moisture: 88.0, temp: 20.0, ec: 2.40, ph: 6.1, compaction: 600 },
        layer_20cm: { moisture: 84.0, temp: 19.2, ec: 2.50, ph: 6.0, compaction: 680 },
        layer_30cm: { moisture: 81.0, temp: 18.8, ec: 2.65, ph: 5.9, compaction: 720 }
      },
      zone_d: {
        layer_10cm: { moisture: 93.0, temp: 19.2, ec: 2.70, ph: 5.9, compaction: 680 },
        layer_20cm: { moisture: 90.0, temp: 18.6, ec: 2.80, ph: 5.8, compaction: 740 },
        layer_30cm: { moisture: 87.5, temp: 18.1, ec: 3.00, ph: 5.7, compaction: 790 }
      }
    }
  },
  scenario_4_thermal_stress: {
    id: 'scenario_4_thermal_stress',
    name: 'Scenario 4: Extreme Underground Heat Stress',
    description: 'Intense atmospheric heat radiating into soil. 10cm layer exceeds 38°C; roots experience thermal shock and cellular membrane degradation.',
    data: {
      zone_a: {
        layer_10cm: { moisture: 21.0, temp: 39.2, ec: 2.30, ph: 7.2, compaction: 1450 },
        layer_20cm: { moisture: 25.4, temp: 33.5, ec: 2.10, ph: 7.1, compaction: 1520 },
        layer_30cm: { moisture: 29.8, temp: 28.2, ec: 1.85, ph: 6.9, compaction: 1600 }
      },
      zone_b: {
        layer_10cm: { moisture: 19.5, temp: 40.1, ec: 2.45, ph: 7.3, compaction: 1500 },
        layer_20cm: { moisture: 23.0, temp: 34.0, ec: 2.20, ph: 7.1, compaction: 1580 },
        layer_30cm: { moisture: 27.5, temp: 29.0, ec: 1.90, ph: 7.0, compaction: 1650 }
      },
      zone_c: {
        layer_10cm: { moisture: 26.0, temp: 36.5, ec: 1.95, ph: 6.9, compaction: 1100 },
        layer_20cm: { moisture: 30.0, temp: 31.0, ec: 1.80, ph: 6.8, compaction: 1200 },
        layer_30cm: { moisture: 34.0, temp: 26.5, ec: 1.65, ph: 6.7, compaction: 1300 }
      },
      zone_d: {
        layer_10cm: { moisture: 22.5, temp: 38.8, ec: 2.25, ph: 7.2, compaction: 1400 },
        layer_20cm: { moisture: 26.0, temp: 32.8, ec: 2.05, ph: 7.0, compaction: 1490 },
        layer_30cm: { moisture: 30.2, temp: 27.9, ec: 1.80, ph: 6.9, compaction: 1560 }
      }
    }
  },
  scenario_5_compaction_hardpan: {
    id: 'scenario_5_compaction_hardpan',
    name: 'Scenario 5: Severe Plough-Pan Compaction Layer',
    description: 'Compaction exceeds 2700 kPa at 20cm depth. Root penetration physically blocked; water and roots diverted horizontally.',
    data: {
      zone_a: {
        layer_10cm: { moisture: 44.0, temp: 23.0, ec: 1.30, ph: 6.6, compaction: 950 },
        layer_20cm: { moisture: 31.0, temp: 22.4, ec: 1.80, ph: 6.8, compaction: 2850 },
        layer_30cm: { moisture: 19.5, temp: 21.5, ec: 2.15, ph: 7.0, compaction: 1950 }
      },
      zone_b: {
        layer_10cm: { moisture: 42.5, temp: 23.5, ec: 1.25, ph: 6.5, compaction: 1020 },
        layer_20cm: { moisture: 29.5, temp: 22.8, ec: 1.85, ph: 6.7, compaction: 2920 },
        layer_30cm: { moisture: 18.0, temp: 21.8, ec: 2.20, ph: 6.9, compaction: 2050 }
      },
      zone_c: {
        layer_10cm: { moisture: 40.0, temp: 22.8, ec: 1.20, ph: 6.4, compaction: 850 },
        layer_20cm: { moisture: 34.0, temp: 22.0, ec: 1.60, ph: 6.6, compaction: 2100 },
        layer_30cm: { moisture: 24.0, temp: 21.2, ec: 1.85, ph: 6.8, compaction: 1700 }
      },
      zone_d: {
        layer_10cm: { moisture: 43.0, temp: 23.2, ec: 1.28, ph: 6.6, compaction: 980 },
        layer_20cm: { moisture: 30.0, temp: 22.5, ec: 1.82, ph: 6.8, compaction: 2790 },
        layer_30cm: { moisture: 18.8, temp: 21.6, ec: 2.18, ph: 7.0, compaction: 1980 }
      }
    }
  }
};

// Seed initial history points
function generateInitialHistory() {
  const points = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000).toISOString();
    // slight noise around baseline
    const variance = (Math.sin(i / 3) * 2.5);
    points.push({
      timestamp,
      zone_a: {
        moisture_10: +(38.2 + variance).toFixed(1),
        moisture_20: +(36.5 + variance * 0.8).toFixed(1),
        moisture_30: +(35.1 + variance * 0.5).toFixed(1),
        temp_10: +(22.4 - variance * 0.7).toFixed(1),
        temp_20: +(21.8 - variance * 0.4).toFixed(1),
        temp_30: +(21.2 - variance * 0.2).toFixed(1),
        compaction_20: +(950 + variance * 25).toFixed(0),
        ec_20: +(1.30 + variance * 0.04).toFixed(2),
        ph_20: 6.7
      }
    });
  }
  return points;
}

state.history = generateInitialHistory();
state.latestReadings = JSON.parse(JSON.stringify(SCENARIOS.scenario_1_optimal.data));

// AI Stress Engine & Anomaly Detection
function analyzeZoneSoil(zoneId, zoneReadings) {
  const r10 = zoneReadings.layer_10cm;
  const r20 = zoneReadings.layer_20cm;
  const r30 = zoneReadings.layer_30cm;

  const alerts = [];
  let score = 100;
  let riskLevel = 'GREEN'; // GREEN, YELLOW, ORANGE, RED

  // 1. Moisture Disparity Check (Top vs Deep)
  const moistureGradient = r10.moisture - r30.moisture;
  if (moistureGradient > 35) {
    score -= 25;
    riskLevel = 'ORANGE';
    alerts.push({
      id: `alert_disp_${zoneId}`,
      zoneId,
      type: 'MOISTURE_DISPARITY',
      severity: 'HIGH_RISK',
      title: 'Severe Underground Moisture Stratification',
      evidence: `10cm Moisture: ${r10.moisture}% vs 30cm Moisture: ${r30.moisture}% (Δ${moistureGradient.toFixed(1)}%)`,
      cause: 'Shallow surface watering has not penetrated subsoil. Deep taproots are dehydrated while surface appears wet.',
      recommendation: 'Switch from rapid broadcast watering to deep pulse-drip irrigation. Verify subsoil infiltration rate.',
      confidence: 0.94
    });
  } else if (moistureGradient > 20) {
    score -= 12;
    if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
    alerts.push({
      id: `alert_disp_${zoneId}`,
      zoneId,
      type: 'MOISTURE_DISPARITY',
      severity: 'WARNING',
      title: 'Uneven Soil Moisture Distribution',
      evidence: `Upper soil moisture exceeds deep root zone by ${moistureGradient.toFixed(1)}%.`,
      cause: 'Water percolation lag or early-stage subsoil drying.',
      recommendation: 'Increase watering duration and lower application rate to facilitate downward capillary flow.',
      confidence: 0.88
    });
  }

  // 2. Waterlogging & Hypoxia Anoxia Check
  const avgMoisture = (r10.moisture + r20.moisture + r30.moisture) / 3;
  if (avgMoisture > 88) {
    score -= 35;
    riskLevel = 'RED';
    alerts.push({
      id: `alert_waterlog_${zoneId}`,
      zoneId,
      type: 'WATERLOGGING_ANOXIA',
      severity: 'CRITICAL',
      title: 'Critical Subterranean Waterlogging & Hypoxia',
      evidence: `All soil layers exceed 88% moisture (Mean: ${avgMoisture.toFixed(1)}%). Root respiration oxygen <5%.`,
      cause: 'Prolonged saturation from poor drainage or excessive irrigation. Anoxic denitrification occurring.',
      recommendation: 'HALT ALL IRRIGATION IMMEDIATELY. Open drainage furrows. Aerate soil perimeter to prevent root rot necrosis.',
      confidence: 0.96
    });
  } else if (avgMoisture > 78) {
    score -= 15;
    if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
    alerts.push({
      id: `alert_waterlog_${zoneId}`,
      zoneId,
      type: 'WATERLOGGING_ANOXIA',
      severity: 'WARNING',
      title: 'Excess Root-Zone Moisture',
      evidence: `Average profile moisture is elevated at ${avgMoisture.toFixed(1)}%.`,
      cause: 'Field capacity reached; drainage slow.',
      recommendation: 'Pause upcoming irrigation cycles until 20cm moisture drops below 60%.',
      confidence: 0.90
    });
  }

  // 3. Soil Compaction & Hardpan Layer
  const maxCompaction = Math.max(r10.compaction, r20.compaction, r30.compaction);
  if (maxCompaction > 2400) {
    score -= 28;
    if (riskLevel !== 'RED') riskLevel = 'ORANGE';
    const compDepth = r20.compaction === maxCompaction ? '20 cm' : r30.compaction === maxCompaction ? '30 cm' : '10 cm';
    alerts.push({
      id: `alert_comp_${zoneId}`,
      zoneId,
      type: 'SOIL_COMPACTION',
      severity: 'HIGH_RISK',
      title: 'Severe Hardpan Soil Compaction Detected',
      evidence: `Penetrometer resistance reached ${maxCompaction} kPa at ${compDepth} (Threshold: >2000 kPa).`,
      cause: 'Subsoil plow-pan formed by heavy agricultural machinery traffic or clay particle cementing.',
      recommendation: 'Perform strategic deep subsoiling (ripping) between rows to break the hardpan and restore root expansion.',
      confidence: 0.92
    });
  } else if (maxCompaction > 1800) {
    score -= 10;
    if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
    alerts.push({
      id: `alert_comp_${zoneId}`,
      zoneId,
      type: 'SOIL_COMPACTION',
      severity: 'WARNING',
      title: 'Elevated Soil Density / Compaction Warning',
      evidence: `Peak penetrometer reading: ${maxCompaction} kPa at mid-depth.`,
      cause: 'Gradual soil consolidation restricting fine lateral root proliferation.',
      recommendation: 'Incorporate organic matter / biochar and limit tractor axle loads across wet field rows.',
      confidence: 0.86
    });
  }

  // 4. Thermal Underground Stress Check
  if (r10.temp > 37 || r20.temp > 32) {
    score -= 20;
    if (riskLevel === 'GREEN') riskLevel = 'ORANGE';
    alerts.push({
      id: `alert_temp_${zoneId}`,
      zoneId,
      type: 'THERMAL_STRESS',
      severity: 'HIGH_RISK',
      title: 'Extreme Underground Thermal Root Stress',
      evidence: `Upper soil temperature reached ${r10.temp}°C; mid-zone at ${r20.temp}°C.`,
      cause: 'High ambient insolation on unmulched bare ground causing heat conduction to root depths.',
      recommendation: 'Deploy organic mulch or straw cover (5-7 cm depth) to buffer subterranean soil temperatures.',
      confidence: 0.95
    });
  }

  // 5. Salinity / EC Anomaly
  if (r20.ec > 2.5) {
    score -= 15;
    if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
    alerts.push({
      id: `alert_ec_${zoneId}`,
      zoneId,
      type: 'SALINITY_EC',
      severity: 'WARNING',
      title: 'Subsurface Salt Accumulation (High EC)',
      evidence: `EC reading: ${r20.ec} dS/m at 20cm (Normal range: 0.8 - 1.8 dS/m).`,
      cause: 'High mineral fertilizer salt deposition or low water flushing factor.',
      recommendation: 'Conduct scheduled leaching irrigation with low-salinity water to flush salts below 45cm.',
      confidence: 0.89
    });
  }

  score = Math.max(10, Math.min(100, score));

  return {
    zoneId,
    healthScore: score,
    riskLevel,
    readings: zoneReadings,
    alerts,
    timestamp: new Date().toISOString()
  };
}

// AquaRoot AI Predictive Irrigation
function getAquaRootRecommendation(zoneId) {
  const zone = state.zones[zoneId] || state.zones.zone_a;
  const readings = state.latestReadings[zoneId] || state.latestReadings.zone_a;
  const analysis = analyzeZoneSoil(zoneId, readings);

  const r10 = readings.layer_10cm.moisture;
  const r20 = readings.layer_20cm.moisture;
  const r30 = readings.layer_30cm.moisture;
  const comp = readings.layer_20cm.compaction;

  let recommendation = '';
  let priority = 'LOW';
  let suggestedLitersPerM2 = 0;
  let soakDurationMinutes = 0;
  let targetDepth = '20-30 cm';

  if (analysis.riskLevel === 'RED') {
    priority = 'NONE - SUPPRESSED';
    recommendation = 'DO NOT IRRIGATE. Soil profile is supersaturated with high waterlogging danger. Allow 48 hours natural transpiration.';
  } else if (r10 > 65 && r30 < 22) {
    priority = 'URGENT_DEEP_PENETRATION';
    suggestedLitersPerM2 = 14;
    soakDurationMinutes = 90;
    recommendation = `Shallow surface is wet (${r10}%) but deep root zone is starving (${r30}%). Do NOT broadcast water. Apply slow pulse drip irrigation (14 L/m² over 90 mins) to penetrate beyond 20cm without surface pooling.`;
  } else if (r20 < 25 && r30 < 25) {
    priority = 'HIGH';
    suggestedLitersPerM2 = 18;
    soakDurationMinutes = 120;
    recommendation = `Both 20cm (${r20}%) and 30cm (${r30}%) root layers are approaching permanent wilting point. Recommend 18 L/m² drip irrigation during early morning hours to replenish full root reservoir.`;
  } else if (r10 < 30) {
    priority = 'MEDIUM';
    suggestedLitersPerM2 = 8;
    soakDurationMinutes = 45;
    recommendation = `Topsoil moisture (${r10}%) has depleted. Mid and deep layers maintain adequate reserves. Apply light maintenance cycle of 8 L/m².`;
  } else {
    priority = 'OPTIMAL';
    suggestedLitersPerM2 = 0;
    soakDurationMinutes = 0;
    recommendation = `Optimal soil moisture equilibrium across all 3 depths (${r10}% / ${r20}% / ${r30}%). No irrigation required at this time.`;
  }

  return {
    zoneId,
    zoneName: zone.name,
    crop: zone.crop,
    soilType: zone.soilType,
    priority,
    suggestedLitersPerM2,
    soakDurationMinutes,
    targetDepth,
    recommendation,
    compactionLimiter: comp > 2000 ? 'High compaction at 20cm will reduce natural infiltration rate by ~40%.' : 'Normal infiltration conditions.',
    timestamp: new Date().toISOString()
  };
}

// Digital Twin Data Formatter for Three.js
function getDigitalTwinData(zoneId) {
  const zId = zoneId || 'zone_a';
  const readings = state.latestReadings[zId] || state.latestReadings.zone_a;
  const analysis = analyzeZoneSoil(zId, readings);
  const zone = state.zones[zId] || state.zones.zone_a;

  return {
    zoneId: zId,
    zoneInfo: zone,
    operatingMode: state.operatingMode,
    currentScenario: state.currentScenario,
    healthScore: analysis.healthScore,
    riskLevel: analysis.riskLevel,
    layers: [
      {
        id: 'layer_1',
        depthLabel: '10 cm (Topsoil Zone)',
        depthCm: 10,
        yPosition: 0.8,
        moisture: readings.layer_10cm.moisture,
        temperature: readings.layer_10cm.temp,
        ec: readings.layer_10cm.ec,
        ph: readings.layer_10cm.ph,
        compaction: readings.layer_10cm.compaction,
        rootPresencePct: 92,
        stressStatus: readings.layer_10cm.moisture < 25 ? 'DRY' : readings.layer_10cm.moisture > 85 ? 'WATERLOGGED' : 'NORMAL'
      },
      {
        id: 'layer_2',
        depthLabel: '20 cm (Mid Root Zone)',
        depthCm: 20,
        yPosition: 0.0,
        moisture: readings.layer_20cm.moisture,
        temperature: readings.layer_20cm.temp,
        ec: readings.layer_20cm.ec,
        ph: readings.layer_20cm.ph,
        compaction: readings.layer_20cm.compaction,
        rootPresencePct: 78,
        stressStatus: readings.layer_20cm.compaction > 2200 ? 'COMPACTED' : readings.layer_20cm.moisture < 25 ? 'DRY' : 'NORMAL'
      },
      {
        id: 'layer_3',
        depthLabel: '30 cm (Deep Subsoil)',
        depthCm: 30,
        yPosition: -0.8,
        moisture: readings.layer_30cm.moisture,
        temperature: readings.layer_30cm.temp,
        ec: readings.layer_30cm.ec,
        ph: readings.layer_30cm.ph,
        compaction: readings.layer_30cm.compaction,
        rootPresencePct: 54,
        stressStatus: readings.layer_30cm.moisture < 20 ? 'CRITICAL_DRY' : 'NORMAL'
      }
    ],
    alerts: analysis.alerts,
    timestamp: new Date().toISOString()
  };
}

/**
 * Ingest live telemetry from ESP32 MQTT / HTTP and update RootPulse 3D digital twin
 */
function updateFromLiveTelemetry(telemetry) {
  if (!telemetry) return;

  const soilMoisture = typeof telemetry.soilPct === 'number' ? telemetry.soilPct : 40;
  const temp = typeof telemetry.temperature === 'number' ? telemetry.temperature : 24.0;
  const hum = typeof telemetry.humidity === 'number' ? telemetry.humidity : 60;
  const ldr = typeof telemetry.ldrPct === 'number' ? telemetry.ldrPct : 50;

  state.operatingMode = 'LIVE';

  if (!state.latestReadings.zone_a) {
    state.latestReadings.zone_a = {};
  }

  // Update Zone A with real hardware telemetry
  state.latestReadings.zone_a = {
    layer_10cm: {
      moisture: soilMoisture,
      temp: temp,
      humidity: hum,
      ldr: ldr,
      ec: 1.25,
      ph: 6.6,
      compaction: 820
    },
    layer_20cm: {
      moisture: +(Math.max(5, soilMoisture * 0.94)).toFixed(1),
      temp: +(temp - 0.4).toFixed(1),
      humidity: hum,
      ldr: ldr,
      ec: 1.30,
      ph: 6.7,
      compaction: 950
    },
    layer_30cm: {
      moisture: +(Math.max(5, soilMoisture * 0.88)).toFixed(1),
      temp: +(temp - 0.8).toFixed(1),
      humidity: hum,
      ldr: ldr,
      ec: 1.35,
      ph: 6.8,
      compaction: 1080
    }
  };

  // Append point to history
  state.history.push({
    timestamp: new Date().toISOString(),
    zone_a: {
      moisture_10: soilMoisture,
      moisture_20: +(Math.max(5, soilMoisture * 0.94)).toFixed(1),
      moisture_30: +(Math.max(5, soilMoisture * 0.88)).toFixed(1),
      temp_10: temp,
      temp_20: +(temp - 0.4).toFixed(1),
      temp_30: +(temp - 0.8).toFixed(1),
      compaction_20: 950,
      ec_20: 1.30,
      ph_20: 6.7,
      humidity: hum,
      ldr: ldr
    }
  });

  if (state.history.length > 500) {
    state.history.shift();
  }
}

module.exports = {
  state,
  SCENARIOS,
  analyzeZoneSoil,
  getAquaRootRecommendation,
  getDigitalTwinData,
  updateFromLiveTelemetry
};

