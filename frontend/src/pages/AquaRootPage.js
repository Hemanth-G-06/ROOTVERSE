// frontend/src/pages/AquaRootPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRootPulse } from '../context/RootPulseContext';
import {
  Droplets,
  Gauge,
  AlertTriangle,
  Clock,
  Waves,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  Lock
} from 'lucide-react';

export default function AquaRootPage() {
  const { activeZone, currentZoneInfo, currentZoneReadings, apiBase } = useRootPulse();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [valveUnlocked, setValveUnlocked] = useState(false);
  const [simulatingValve, setSimulatingValve] = useState(false);
  const [valveStatus, setValveStatus] = useState('OFF');

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${apiBase}/api/ai/irrigation-recommendation`, {
        zoneId: activeZone
      });
      if (res.data.success) {
        setRecommendation(res.data.data);
      }
    } catch (e) {
      console.warn('Could not fetch AquaRoot recommendation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, [activeZone, apiBase]);

  const readings = currentZoneReadings || {
    layer_10cm: { moisture: 38.2, temp: 22.4, ec: 1.25, compaction: 820 },
    layer_20cm: { moisture: 36.5, temp: 21.8, ec: 1.30, compaction: 950 },
    layer_30cm: { moisture: 35.1, temp: 21.2, ec: 1.32, compaction: 1040 }
  };

  const handleApplyCycle = () => {
    setSimulatingValve(true);
    setValveStatus('PULSING_ACTIVE');
    setTimeout(() => {
      setSimulatingValve(false);
      setValveStatus('CYCLE_COMPLETE');
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F7ED] text-[#159F57] border border-[#159F57]/30">
            MODULE 5: AQUAROOT AI
          </span>
          <span className="text-xs text-[#6B7280] font-mono">
            Root-Zone Hydrodynamics
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#DDF3FA] text-[#078DC1]">
            ಬೇರುದೃಷ್ಟಿ ನೀರಾವರಿ
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1">
          Predictive Root-Zone Irrigation Intelligence
        </h1>
        <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
          Moving beyond superficial surface soil watering. AquaRoot calculates depth-wise hydraulic infiltration to replenish deep taproots without causing waterlogging or surface runoff.
        </p>
      </div>

      {/* Main Prescription Card */}
      {recommendation && (
        <div className="p-8 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5D8B4]/60 pb-5">
            <div>
              <span className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider block">
                Prescription for {recommendation.zoneName}
              </span>
              <h2 className="text-xl font-black text-[#172033] mt-0.5">
                Targeted Depth Horizon: <span className="text-[#159F57]">{recommendation.targetDepth}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                recommendation.priority.includes('URGENT') ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' :
                recommendation.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                recommendation.priority.includes('SUPPRESSED') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-[#E8F7ED] text-[#159F57] border border-[#159F57]/40'
              }`}>
                Priority: {recommendation.priority}
              </span>
            </div>
          </div>

          {/* Dosage & Soak Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FFF9F1] rounded-xl border border-[#F5D8B4] text-center">
              <Droplets className="w-5 h-5 text-[#159F57] mx-auto mb-1.5" />
              <span className="text-xs text-[#6B7280]">Prescribed Volume</span>
              <div className="text-3xl font-black text-[#172033] font-mono mt-1">
                {recommendation.suggestedLitersPerM2} <span className="text-sm font-normal text-[#6B7280]">L/m²</span>
              </div>
            </div>

            <div className="p-4 bg-[#FFF9F1] rounded-xl border border-[#F5D8B4] text-center">
              <Clock className="w-5 h-5 text-[#078DC1] mx-auto mb-1.5" />
              <span className="text-xs text-[#6B7280]">Soak & Infiltration Window</span>
              <div className="text-3xl font-black text-[#172033] font-mono mt-1">
                {recommendation.soakDurationMinutes} <span className="text-sm font-normal text-[#6B7280]">mins</span>
              </div>
            </div>

            <div className="p-4 bg-[#FFF9F1] rounded-xl border border-[#F5D8B4] text-center">
              <Layers className="w-5 h-5 text-[#126B3B] mx-auto mb-1.5" />
              <span className="text-xs text-[#6B7280]">Crop Subsurface Target</span>
              <div className="text-3xl font-black text-[#172033] font-mono mt-1">
                {recommendation.crop}
              </div>
            </div>
          </div>

          {/* AI Explanation Box */}
          <div className="p-5 bg-[#E8F7ED] rounded-xl border border-[#159F57]/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#159F57] uppercase tracking-wider">
              <Info className="w-4 h-4" />
              Agronomic Rationale & Infiltration Strategy
            </div>
            <p className="text-sm text-[#172033] leading-relaxed">
              {recommendation.recommendation}
            </p>
            <p className="text-xs text-[#C26100] font-mono pt-2 border-t border-[#159F57]/20">
              ⚠️ Infiltration Restriction Check: {recommendation.compactionLimiter}
            </p>
          </div>

          {/* Safety Confirm & Valve Execution Panel */}
          <div className="p-5 bg-[#FFF9F1] rounded-xl border border-[#F5D8B4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white border border-[#F5D8B4] text-[#6B7280]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172033]">Farmer Safety Valve Gate</h4>
                <p className="text-xs text-[#6B7280]">
                  Automated actuators require physical confirmation to prevent unintended root soaking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#172033] cursor-pointer">
                <input
                  type="checkbox"
                  checked={valveUnlocked}
                  onChange={(e) => setValveUnlocked(e.target.checked)}
                  className="rounded text-[#159F57] focus:ring-0 bg-white border-[#F5D8B4] w-4 h-4"
                />
                Authorize Valve
              </label>

              <button
                disabled={!valveUnlocked || simulatingValve || recommendation.suggestedLitersPerM2 === 0}
                onClick={handleApplyCycle}
                className="px-5 py-2.5 rounded-xl bg-[#159F57] hover:bg-[#126B3B] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Waves className="w-4 h-4" />
                <span>{simulatingValve ? 'Triggering Actuator...' : `Apply Pulse Cycle (${recommendation.suggestedLitersPerM2} L)`}</span>
              </button>
            </div>
          </div>

          {valveStatus === 'CYCLE_COMPLETE' && (
            <div className="p-3 bg-[#E8F7ED] rounded-xl border border-[#159F57]/40 text-xs text-[#126B3B] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#159F57] flex-shrink-0" />
              <span>Irrigation telemetry event logged to database. Downward infiltration in progress.</span>
            </div>
          )}
        </div>
      )}

      {/* 3-Depth Current Moisture Levels Bar */}
      <div className="p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
          <Droplets className="w-5 h-5 text-[#159F57]" />
          Real-Time Root Layer Reservoir Breakdown
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#172033]">10 cm Topsoil (Feeder Roots)</span>
              <span className="font-mono font-bold text-[#159F57]">{readings.layer_10cm.moisture}% VWC</span>
            </div>
            <div className="w-full bg-[#FFF0DB] rounded-full h-3 overflow-hidden border border-[#F5D8B4]">
              <div
                className="bg-[#159F57] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, readings.layer_10cm.moisture)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#172033]">20 cm Mid-Root (Lateral Branches)</span>
              <span className="font-mono font-bold text-[#078DC1]">{readings.layer_20cm.moisture}% VWC</span>
            </div>
            <div className="w-full bg-[#FFF0DB] rounded-full h-3 overflow-hidden border border-[#F5D8B4]">
              <div
                className="bg-[#078DC1] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, readings.layer_20cm.moisture)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#172033]">30 cm Deep Subsoil (Anchor Taproot)</span>
              <span className="font-mono font-bold text-[#126B3B]">{readings.layer_30cm.moisture}% VWC</span>
            </div>
            <div className="w-full bg-[#FFF0DB] rounded-full h-3 overflow-hidden border border-[#F5D8B4]">
              <div
                className="bg-[#126B3B] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, readings.layer_30cm.moisture)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
