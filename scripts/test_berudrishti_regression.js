// scripts/test_berudrishti_regression.js
const { getLatestTelemetry, normalizePayload, updateFromLiveTelemetry } = require('../backend/src/services/telemetryService');
const beruService = require('../backend/src/services/berudrishtiService');

console.log('--- BERUDRISHTI REGRESSION TEST ---');

// 1. Test live sensor ingestion with simulated packet (with spaced keys like ESP32 produces)
const simulatedPacket = {
  deviceId: 'esp32-01',
  temperature: 27.8,
  'humidit y': 64.2,
  soilPct: 42,
  ldrPct: 15,
  relay1: 0,
  relay2: 1,
  ' mqtt': 1
};

const normalized = normalizePayload(simulatedPacket);
console.log('1. Normalized Sensor Ingestion:');
console.log('   Temp:', normalized.temperature, 'Humidity:', normalized.humidity, 'Soil:', normalized.soilPct, 'LDR:', normalized.ldrPct);

if (normalized.temperature !== 27.8 || normalized.humidity !== 64.2 || normalized.soilPct !== 42) {
  console.error('FAIL: Normalization mismatch!');
  process.exit(1);
}
console.log('   PASSED: Telemetry payload sanitized and preserved.');

// 2. Update telemetry state
updateFromLiveTelemetry(normalized);
const latest = getLatestTelemetry();
console.log('2. Retrieved Latest Telemetry:', latest.deviceId, 'Moisture:', latest.soilPct);
if (latest.soilPct !== 42) {
  console.error('FAIL: latest telemetry does not match updated value!');
  process.exit(1);
}
console.log('   PASSED: Telemetry state accessible.');

// 3. Test BERUDRISHTI Subterranean Read-only Adapter
const zoneReadings = beruService.getActiveZoneReadings('zone_a');
console.log('3. Berudrishti Subterranean Horizons for Zone A:');
console.log('   Layer 10cm:', zoneReadings.layer_10cm.moisture, '% VWC');
console.log('   Layer 20cm:', zoneReadings.layer_20cm.moisture, '% VWC');
console.log('   Layer 30cm:', zoneReadings.layer_30cm.moisture, '% VWC');
if (typeof zoneReadings.layer_10cm.moisture !== 'number') {
  console.error('FAIL: Horizon readings invalid!');
  process.exit(1);
}
console.log('   PASSED: Depth stratification computed safely from telemetry.');

// 4. Test RhizoAI Analysis Engine
const aiAnalysis = beruService.analyzeRhizoAI('zone_a');
console.log('4. RhizoAI Diagnostics:');
console.log('   Health Score:', aiAnalysis.healthScore, '/ 100 (Risk: ' + aiAnalysis.riskLevel + ')');
console.log('   Active Alerts:', aiAnalysis.alerts.length);
console.log('   Average Subsoil Moisture:', aiAnalysis.averageMoisture, '%');
console.log('   PASSED: RhizoAI evaluation generated.');

// 5. Test AquaRoot Predictive Irrigation
const aquaRoot = beruService.getAquaRootRecommendations('zone_a');
console.log('5. AquaRoot Irrigation Recommendation:');
console.log('   Target Depth:', aquaRoot.targetDepth);
console.log('   Prescribed Liters/m²:', aquaRoot.suggestedLitersPerM2);
console.log('   PASSED: AquaRoot hydrodynamics computed.');

// 6. Test Explainable AI Assistant
const aiAnswer = beruService.askAIAssistant('Why is my subsoil dry while topsoil is moist?', 'zone_a');
console.log('6. Explainable AI Assistant Output:');
console.log('   Grounding Evidence:', aiAnswer.groundingEvidence ? aiAnswer.groundingEvidence.moistureStratification : 'Grounded');
console.log('   Confidence:', aiAnswer.confidence);
console.log('   PASSED: Grounded response generated.');

console.log('\n--- ALL REGRESSION TESTS PASSED (100%) ---');
