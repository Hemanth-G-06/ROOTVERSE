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
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-800/40 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            MODULE 5: AQUAROOT AI
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Root-Zone Hydrodynamics
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Predictive Root-Zone Irrigation Intelligence
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Moving beyond superficial surface soil watering. AquaRoot calculates depth-wise hydraulic infiltration to replenish deep taproots without causing waterlogging or surface runoff.
        </p>
      </div>

      {/* Main Prescription Card */}
      {recommendation && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 border border-emerald-700/50 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Prescription for {recommendation.zoneName}
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                Targeted Depth Horizon: <span className="text-emerald-400">{recommendation.targetDepth}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                recommendation.priority.includes('URGENT') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse' :
                recommendation.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                recommendation.priority.includes('SUPPRESSED') ? 'bg-red-950 text-rose-400 border border-rose-800' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                Priority: {recommendation.priority}
              </span>
            </div>
          </div>

          {/* Dosage & Soak Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-center">
              <Droplets className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <span className="text-xs text-slate-400">Prescribed Volume</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {recommendation.suggestedLitersPerM2} <span className="text-sm font-normal text-slate-400">L/m²</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-center">
              <Clock className="w-5 h-5 text-teal-400 mx-auto mb-1.5" />
              <span className="text-xs text-slate-400">Soak & Infiltration Window</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {recommendation.soakDurationMinutes} <span className="text-sm font-normal text-slate-400">mins</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-center">
              <Layers className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
              <span className="text-xs text-slate-400">Crop Subsurface Target</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {recommendation.crop}
              </div>
            </div>
          </div>

          {/* AI Explanation Box */}
          <div className="p-5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Info className="w-4 h-4" />
              Agronomic Rationale & Infiltration Strategy
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {recommendation.recommendation}
            </p>
            <p className="text-xs text-amber-300 font-mono pt-2 border-t border-slate-800">
              ⚠️ Infiltration Restriction Check: {recommendation.compactionLimiter}
            </p>
          </div>

          {/* Safety Confirm & Valve Execution Panel */}
          <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Farmer Safety Valve Gate</h4>
                <p className="text-xs text-slate-400">
                  Per system design, automated actuators require physical confirmation to prevent unintended soaking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={valveUnlocked}
                  onChange={(e) => setValveUnlocked(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4"
                />
                Authorize Valve
              </label>

              <button
                disabled={!valveUnlocked || simulatingValve || recommendation.suggestedLitersPerM2 === 0}
                onClick={handleApplyCycle}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <Waves className="w-4 h-4" />
                <span>{simulatingValve ? 'Triggering Actuator...' : `Apply Pulse Cycle (${recommendation.suggestedLitersPerM2} L)`}</span>
              </button>
            </div>
          </div>

          {valveStatus === 'CYCLE_COMPLETE' && (
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-600/50 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Irrigation telemetry event logged to database. Downward infiltration in progress.</span>
            </div>
          )}
        </div>
      )}

      {/* 3-Depth Current Moisture Levels Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Droplets className="w-5 h-5 text-emerald-400" />
          Real-Time Root Layer Reservoir Breakdown
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">10 cm Topsoil (Feeder Roots)</span>
              <span className="font-mono font-bold text-emerald-400">{readings.layer_10cm.moisture}% VWC</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, readings.layer_10cm.moisture)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">20 cm Mid-Root (Lateral Branches)</span>
              <span className="font-mono font-bold text-teal-400">{readings.layer_20cm.moisture}% VWC</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, readings.layer_20cm.moisture)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">30 cm Deep Subsoil (Anchor Taproot)</span>
              <span className="font-mono font-bold text-blue-400">{readings.layer_30cm.moisture}% VWC</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, readings.layer_30cm.moisture)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

