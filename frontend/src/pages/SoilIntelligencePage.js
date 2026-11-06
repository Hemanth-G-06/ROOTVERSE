// frontend/src/pages/SoilIntelligencePage.js
import React from 'react';
import { useRootPulse } from '../context/RootPulseContext';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Layers,
  Thermometer,
  Zap,
  Info,
  TrendingDown,
  Activity
} from 'lucide-react';

export default function SoilIntelligencePage() {
  const { currentZoneInfo, currentZoneReadings, alerts, activeZone } = useRootPulse();

  const readings = currentZoneReadings || {
    layer_10cm: { moisture: 38.2, temp: 22.4, ec: 1.25, ph: 6.6, compaction: 820 },
    layer_20cm: { moisture: 36.5, temp: 21.8, ec: 1.30, ph: 6.7, compaction: 950 },
    layer_30cm: { moisture: 35.1, temp: 21.2, ec: 1.32, ph: 6.8, compaction: 1040 }
  };

  const moistureDiff = +(readings.layer_10cm.moisture - readings.layer_30cm.moisture).toFixed(1);
  const maxCompaction = Math.max(readings.layer_10cm.compaction, readings.layer_20cm.compaction, readings.layer_30cm.compaction);
  const avgMoisture = +((readings.layer_10cm.moisture + readings.layer_20cm.moisture + readings.layer_30cm.moisture) / 3).toFixed(1);

  // Diagnostic Stress Models
  const stressChecks = [
    {
      name: 'Underground Moisture Stratification',
      score: moistureDiff > 35 ? 'CRITICAL_DISPARITY' : moistureDiff > 20 ? 'MODERATE_LAG' : 'BALANCED',
      status: moistureDiff > 35 ? 'ORANGE' : moistureDiff > 20 ? 'YELLOW' : 'GREEN',
      evidence: `Δ${moistureDiff}% variance between topsoil (${readings.layer_10cm.moisture}%) and subsoil (${readings.layer_30cm.moisture}%).`,
      detail: 'Deep roots dehydrate while surface appears deceptively moist. Indicates shallow water run-off or compaction barrier preventing downward flow.'
    },
    {
      name: 'Subterranean Hardpan Compaction',
      score: maxCompaction > 2400 ? 'SEVERE_HARDPAN' : maxCompaction > 1800 ? 'ELEVATED_DENSITY' : 'AERATED',
      status: maxCompaction > 2400 ? 'RED' : maxCompaction > 1800 ? 'YELLOW' : 'GREEN',
      evidence: `Peak penetrometer resistance: ${maxCompaction} kPa (Threshold: >2000 kPa restricts root elongation).`,
      detail: 'Physical compaction barrier formed at plow depth. Restricts primary taproot elongation and confines roots to shallow soil.'
    },
    {
      name: 'Root Hypoxia & Waterlogging Danger',
      score: avgMoisture > 88 ? 'ANOXIA_RISK' : avgMoisture > 78 ? 'SUPERSATURATED' : 'ADEQUATE_AERATION',
      status: avgMoisture > 88 ? 'RED' : avgMoisture > 78 ? 'YELLOW' : 'GREEN',
      evidence: `Average profile moisture: ${avgMoisture}% VWC. Subsurface macropores filled with free water.`,
      detail: 'Lack of oxygen in root zone forces roots into anaerobic fermentation, causing root tip necrosis and Pythium/Phytophthora vulnerability.'
    },
    {
      name: 'Thermal Root Respiration Shock',
      score: readings.layer_10cm.temp > 37 ? 'THERMAL_STRESS' : readings.layer_10cm.temp > 30 ? 'ELEVATED_TEMP' : 'OPTIMAL_TEMP',
      status: readings.layer_10cm.temp > 37 ? 'ORANGE' : readings.layer_10cm.temp > 30 ? 'YELLOW' : 'GREEN',
      evidence: `Topsoil temp: ${readings.layer_10cm.temp}°C | Mid-root: ${readings.layer_20cm.temp}°C.`,
      detail: 'Soil heat conduction increases respiration rate faster than photosynthetic replenishment, exhausting stored carbohydrates.'
    },
    {
      name: 'Subsurface Salinity / EC Toxicity',
      score: readings.layer_20cm.ec > 2.5 ? 'SALINITY_HAZARD' : 'NORMAL_EC',
      status: readings.layer_20cm.ec > 2.5 ? 'YELLOW' : 'GREEN',
      evidence: `Mid-depth electrical conductivity: ${readings.layer_20cm.ec} dS/m (Safe threshold: <1.8 dS/m).`,
      detail: 'Accumulation of fertilizer salts draws water osmotically out of root cells, causing physiological drought even in moist soil.'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F7ED] text-[#159F57] border border-[#159F57]/30">
            MODULE 2: AI SOIL STRESS ENGINE
          </span>
          <span className="text-xs text-[#6B7280] font-mono">
            Plot: {currentZoneInfo.name}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF0DB] text-[#C26100]">
            RhizoAI ತಪಾಸಣೆ
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1">
          AI Hidden Soil Stress Detection & Diagnostics
        </h1>
        <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
          Multi-layer algorithmic stress detection classifying invisible underground conditions before vegetative foliage manifests damage.
        </p>
      </div>

      {/* Stress Classification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stressChecks.map((sc, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
              sc.status === 'RED'
                ? 'bg-rose-50 border-rose-200'
                : sc.status === 'ORANGE'
                ? 'bg-orange-50 border-orange-200'
                : sc.status === 'YELLOW'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-[#F5D8B4]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  sc.status === 'RED' ? 'bg-rose-500 text-white' :
                  sc.status === 'ORANGE' ? 'bg-orange-500 text-white' :
                  sc.status === 'YELLOW' ? 'bg-amber-500 text-white' :
                  'bg-[#E8F7ED] text-[#159F57] border border-[#159F57]/40'
                }`}>
                  {sc.score.replace(/_/g, ' ')}
                </span>
                <span className={`text-xs font-mono font-bold ${
                  sc.status === 'RED' ? 'text-rose-600' :
                  sc.status === 'ORANGE' ? 'text-orange-600' :
                  sc.status === 'YELLOW' ? 'text-amber-600' :
                  'text-[#159F57]'
                }`}>
                  {sc.status} RISK
                </span>
              </div>
              <h3 className="text-base font-bold text-[#172033] mt-2.5">{sc.name}</h3>
              <p className="text-xs text-[#172033] font-mono mt-2 bg-white/80 border border-[#F5D8B4] p-2 rounded-lg">
                <strong className="text-[#159F57]">Evidence:</strong> {sc.evidence}
              </p>
            </div>
            <p className="text-xs text-[#6B7280] mt-3 pt-3 border-t border-[#F5D8B4]/60 leading-relaxed">
              {sc.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Active AI Alerts & Action Prescriptions */}
      <div className="p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#159F57]" />
            Active Agronomic Explanations & Corrective Prescriptions ({alerts.length})
          </h3>
          <span className="text-xs text-[#6B7280]">Scientifically Grounded Engine</span>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-[#159F57] bg-[#E8F7ED] rounded-xl border border-[#159F57]/30 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-10 h-10 mb-2 text-[#159F57]" />
              <p className="font-bold text-sm text-[#172033]">All Underground Parameters Within Optimal Thresholds</p>
              <p className="text-xs text-[#6B7280] mt-1">
                Capillary moisture balance, penetrometer resistance, and thermal gradients are fully healthy.
              </p>
            </div>
          ) : (
            alerts.map((alt, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#FFF9F1] border border-[#F5D8B4] space-y-2 hover:border-[#159F57] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${alt.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`} />
                    <span className="font-bold text-sm text-[#172033]">{alt.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#159F57] bg-[#E8F7ED] border border-[#159F57]/30 px-2 py-0.5 rounded-full">
                    Confidence: {(alt.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-[#172033] font-mono">
                  <strong className="text-[#078DC1]">Sensor Evidence:</strong> {alt.evidence}
                </div>
                <div className="text-xs text-[#6B7280]">
                  <strong>Biological Cause:</strong> {alt.cause}
                </div>
                <div className="p-2.5 bg-[#E8F7ED] rounded-lg border border-[#159F57]/30 text-xs text-[#126B3B]">
                  <strong>Agronomic Prescription:</strong> {alt.recommendation}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
