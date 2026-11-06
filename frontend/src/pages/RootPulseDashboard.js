// frontend/src/pages/RootPulseDashboard.js
import React, { useState } from 'react';
import { useRootPulse } from '../context/RootPulseContext';
import UndergroundDigitalTwin3D from '../components/UndergroundDigitalTwin3D';
import {
  Layers,
  Droplets,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';

export default function RootPulseDashboard() {
  const {
    activeZone,
    currentZoneInfo,
    currentZoneReadings,
    zones,
    alerts,
    currentScenario,
    scenariosList,
    switchScenario,
    operatingMode,
    apiBase
  } = useRootPulse();

  const [twinViewMode, setTwinViewMode] = useState('moisture');
  const [selectedLayer, setSelectedLayer] = useState('all');

  const readings = currentZoneReadings || {
    layer_10cm: { moisture: 38.2, temp: 22.4, ec: 1.25, ph: 6.6, compaction: 820 },
    layer_20cm: { moisture: 36.5, temp: 21.8, ec: 1.30, ph: 6.7, compaction: 950 },
    layer_30cm: { moisture: 35.1, temp: 21.2, ec: 1.32, ph: 6.8, compaction: 1040 }
  };

  const healthScore = currentZoneInfo?.healthScore || 85;
  const riskLevel = currentZoneInfo?.riskLevel || 'GREEN';

  // Digital Twin formatted payload
  const digitalTwinPayload = {
    zoneId: activeZone,
    layers: [
      {
        depthLabel: '10 cm',
        moisture: readings.layer_10cm.moisture,
        temperature: readings.layer_10cm.temp,
        compaction: readings.layer_10cm.compaction,
        ec: readings.layer_10cm.ec,
        ph: readings.layer_10cm.ph
      },
      {
        depthLabel: '20 cm',
        moisture: readings.layer_20cm.moisture,
        temperature: readings.layer_20cm.temp,
        compaction: readings.layer_20cm.compaction,
        ec: readings.layer_20cm.ec,
        ph: readings.layer_20cm.ph
      },
      {
        depthLabel: '30 cm',
        moisture: readings.layer_30cm.moisture,
        temperature: readings.layer_30cm.temp,
        compaction: readings.layer_30cm.compaction,
        ec: readings.layer_30cm.ec,
        ph: readings.layer_30cm.ph
      }
    ]
  };

  // Recharts layer depth profile data
  const depthComparisonData = [
    { depth: '10 cm (Topsoil)', moisture: readings.layer_10cm.moisture, temp: readings.layer_10cm.temp, compaction: readings.layer_10cm.compaction / 30 },
    { depth: '20 cm (Mid Root)', moisture: readings.layer_20cm.moisture, temp: readings.layer_20cm.temp, compaction: readings.layer_20cm.compaction / 30 },
    { depth: '30 cm (Deep Subsoil)', moisture: readings.layer_30cm.moisture, temp: readings.layer_30cm.temp, compaction: readings.layer_30cm.compaction / 30 }
  ];

  const moistureDisparity = Math.abs(readings.layer_10cm.moisture - readings.layer_30cm.moisture).toFixed(1);
  const maxCompaction = Math.max(readings.layer_10cm.compaction, readings.layer_20cm.compaction, readings.layer_30cm.compaction);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              {operatingMode} FEED
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Active: {currentZoneInfo.name} ({currentZoneInfo.crop})
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Subterranean Soil Intelligence & Root Twin
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Continuous multi-depth sensing, hidden compaction detection, and root-zone water penetration analytics.
          </p>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-700/40">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-400">Soil Health Score</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {healthScore} <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg ${
            riskLevel === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/60' :
            riskLevel === 'YELLOW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/60' :
            riskLevel === 'ORANGE' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/60' :
            'bg-rose-500/20 text-rose-400 border border-rose-500/60'
          }`}>
            {riskLevel}
          </div>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 10cm Topsoil */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">10 cm Topsoil Horizon</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{readings.layer_10cm.moisture}%</span>
            <span className="text-xs text-slate-400">Moisture</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Temp: <strong className="text-slate-200">{readings.layer_10cm.temp}°C</strong></span>
            <span>Density: <strong className="text-slate-200">{readings.layer_10cm.compaction} kPa</strong></span>
          </div>
        </div>

        {/* Card 2: 20cm Mid-Root */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">20 cm Mid Root-Zone</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{readings.layer_20cm.moisture}%</span>
            <span className="text-xs text-slate-400">Moisture</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Temp: <strong className="text-slate-200">{readings.layer_20cm.temp}°C</strong></span>
            <span>Density: <strong className={readings.layer_20cm.compaction > 2000 ? 'text-rose-400 font-bold' : 'text-slate-200'}>{readings.layer_20cm.compaction} kPa</strong></span>
          </div>
        </div>

        {/* Card 3: 30cm Deep Subsoil */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">30 cm Deep Taproot</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${readings.layer_30cm.moisture < 20 ? 'text-rose-400' : 'text-white'}`}>
              {readings.layer_30cm.moisture}%
            </span>
            <span className="text-xs text-slate-400">Moisture</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Temp: <strong className="text-slate-200">{readings.layer_30cm.temp}°C</strong></span>
            <span>Density: <strong className="text-slate-200">{readings.layer_30cm.compaction} kPa</strong></span>
          </div>
        </div>

        {/* Card 4: Disparity & Compaction Index */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Subsurface Risk Index</span>
            <div className={`p-2 rounded-xl ${maxCompaction > 2000 || moistureDisparity > 30 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${moistureDisparity > 25 ? 'text-amber-400' : 'text-white'}`}>
              Δ{moistureDisparity}%
            </span>
            <span className="text-xs text-slate-400">Depth Disparity</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Hardpan: <strong className={maxCompaction > 2000 ? 'text-rose-400' : 'text-slate-200'}>{maxCompaction > 2000 ? 'Detected' : 'Normal'}</strong></span>
            <span>EC: <strong className="text-slate-200">{readings.layer_20cm.ec} dS/m</strong></span>
          </div>
        </div>
      </div>

      {/* Main Section: 3D Underground Digital Twin & Live Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Underground Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Underground Soil Digital Twin
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Interactive 3D WebGL • Real-time Volumetric Heatmap
            </span>
          </div>

          <UndergroundDigitalTwin3D
            digitalTwinData={digitalTwinPayload}
            selectedLayer={selectedLayer}
            onSelectLayer={setSelectedLayer}
            activeMode={twinViewMode}
            onChangeMode={setTwinViewMode}
          />
        </div>

        {/* Right: Depth Gradient Chart & AI Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Depth-wise Moisture & Compaction Horizon Chart */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-emerald-400" />
                Depth Gradient Horizon (10cm - 30cm)
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono">Live Profile</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depthComparisonData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="depth" stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="moisture" name="Moisture (%)" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Soil Stratification Insight:</strong>{' '}
                {readings.layer_10cm.moisture - readings.layer_30cm.moisture > 30 ? (
                  <span className="text-amber-300">
                    High stratification detected (Δ{moistureDisparity}%). Deep roots are missing surface irrigation.
                  </span>
                ) : (
                  <span className="text-slate-300">
                    Hydraulic balance between surface and deep subsoil is within safe agronomical tolerance.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active AI Underground Alerts */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Underground Stress Diagnostics ({alerts.length})
              </h3>
              <span className="text-[11px] text-slate-400">Explainable AI</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No subsurface stress conditions detected. Equilibrium maintained.
                </div>
              ) : (
                alerts.map((alt, i) => (
                  <div
                    key={alt.id || i}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                      alt.severity === 'CRITICAL'
                        ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                        : alt.severity === 'HIGH_RISK'
                        ? 'bg-orange-950/30 border-orange-800/60 text-orange-200'
                        : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {alt.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40">
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono">
                      <strong>Evidence:</strong> {alt.evidence}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      <strong>Cause:</strong> {alt.cause}
                    </p>
                    <div className="pt-1 border-t border-white/10 text-[11px] text-emerald-300 font-medium">
                      <strong>Action:</strong> {alt.recommendation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: RootNet Zone Quick Switcher */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              RootNet Field Zones Multi-Monitoring
            </h3>
            <p className="text-xs text-slate-400">
              Live status overview across all agricultural plots and crop types.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`p-4 rounded-2xl border transition-all ${
                z.id === activeZone
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{z.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  z.riskLevel === 'GREEN' ? 'bg-emerald-500/20 text-emerald-300' :
                  z.riskLevel === 'YELLOW' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-rose-500/20 text-rose-300'
                }`}>
                  {z.healthScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Crop: {z.crop} • Soil: {z.soilType}</p>
              <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Topsoil (10cm)</span>
                  <span className="font-mono font-bold text-slate-200">{z.topMoisture || 38}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Deep (30cm)</span>
                  <span className="font-mono font-bold text-slate-200">{z.deepMoisture || 35}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

