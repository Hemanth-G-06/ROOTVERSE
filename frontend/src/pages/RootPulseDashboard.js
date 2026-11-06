// frontend/src/pages/RootPulseDashboard.js
// Visual Identity: HAXLR8 3.0 Clean Agricultural Design System
// Palette: #FFF9F1 (bg), #159F57 (primary green), #E8F7ED (light green), #F5D8B4 (peach border)
import React, { useState, useEffect } from 'react';
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
  Info,
  Compass,
  TreeDeciduous,
  Wifi,
  Radio,
  Clock,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_HOST || 'http://localhost:5001';

export default function RootPulseDashboard() {
  const {
    activeZone,
    currentZoneInfo,
    currentZoneReadings,
    zones,
    alerts,
    currentScenario,
    operatingMode
  } = useRootPulse();

  const [twinViewMode, setTwinViewMode] = useState('moisture');
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [beruData, setBeruData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/rootsphere/overview?zone_id=${activeZone}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setBeruData(json);
      })
      .catch(() => {});
  }, [activeZone]);

  const readings = currentZoneReadings || {
    layer_10cm: { moisture: 40.0, temp: 27.3, ec: 1.25, ph: 6.6, compaction: 820 },
    layer_20cm: { moisture: 37.6, temp: 26.9, ec: 1.30, ph: 6.7, compaction: 950 },
    layer_30cm: { moisture: 35.2, temp: 26.5, ec: 1.32, ph: 6.8, compaction: 1040 }
  };

  const healthScore = beruData?.healthScore || currentZoneInfo?.healthScore || 88;
  const riskLevel = beruData?.riskLevel || currentZoneInfo?.riskLevel || 'GREEN';

  // Digital Twin payload for 3D component
  const digitalTwinPayload = {
    zoneId: activeZone,
    layers: [
      { depthLabel: '10 cm', moisture: readings.layer_10cm.moisture, temperature: readings.layer_10cm.temp, compaction: readings.layer_10cm.compaction, ec: readings.layer_10cm.ec, ph: readings.layer_10cm.ph },
      { depthLabel: '20 cm', moisture: readings.layer_20cm.moisture, temperature: readings.layer_20cm.temp, compaction: readings.layer_20cm.compaction, ec: readings.layer_20cm.ec, ph: readings.layer_20cm.ph },
      { depthLabel: '30 cm', moisture: readings.layer_30cm.moisture, temperature: readings.layer_30cm.temp, compaction: readings.layer_30cm.compaction, ec: readings.layer_30cm.ec, ph: readings.layer_30cm.ph }
    ]
  };

  const depthComparisonData = [
    { depth: '10 cm Topsoil', moisture: readings.layer_10cm.moisture, temp: readings.layer_10cm.temp, compaction: Math.round(readings.layer_10cm.compaction / 20) },
    { depth: '20 cm Mid-Root', moisture: readings.layer_20cm.moisture, temp: readings.layer_20cm.temp, compaction: Math.round(readings.layer_20cm.compaction / 20) },
    { depth: '30 cm Subsoil', moisture: readings.layer_30cm.moisture, temp: readings.layer_30cm.temp, compaction: Math.round(readings.layer_30cm.compaction / 20) }
  ];

  const moistureDisparity = Math.abs(readings.layer_10cm.moisture - readings.layer_30cm.moisture).toFixed(1);

  return (
    <div className="min-h-screen bg-[#FFF9F1] py-6 px-4 sm:px-6 lg:px-8 pb-20 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── A. Underground Soil Overview & Connectivity Banner ──────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                operatingMode === 'LIVE'
                  ? 'bg-[#E8F7ED] text-[#126B3B] border-[#159F57]/40'
                  : 'bg-[#FFF0DB] text-[#E9A23B] border-[#F5D8B4]'
              }`}>
                {operatingMode === 'LIVE' ? '● LIVE HARDWARE FEED (ESP32-01)' : 'SIMULATION DEMO MODE'}
              </span>
              <span className="text-xs text-[#667085] font-semibold">
                {currentZoneInfo?.name || 'Zone A — North Orchard'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              ಬೇರುದೃಷ್ಟಿ — Underground Soil Intelligence Dashboard
            </h1>
            <p className="text-sm text-[#667085] mt-1 max-w-3xl">
              Real-time multi-depth subterranean sensing, root-zone drought detection, hardpan compaction penetrometry, and 3D digital twin.
            </p>
          </div>

          {/* E. Soil Health Score Badge */}
          <div className="flex items-center gap-4 bg-[#FFF0DB] p-4 rounded-xl border border-[#F5D8B4]">
            <div className="text-right">
              <div className="text-xs font-semibold text-[#667085]">Root Health Score</div>
              <div className="text-2xl font-black text-[#126B3B] font-mono">
                {healthScore} <span className="text-xs text-[#98A2B3]">/ 100</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
              riskLevel === 'GREEN' ? 'bg-[#159F57] text-white' :
              riskLevel === 'YELLOW' ? 'bg-[#E9A23B] text-white' :
              'bg-[#DC4545] text-white'
            }`}>
              {riskLevel}
            </div>
          </div>
        </div>

        {/* ── C & D. 4 Primary Subterranean Metric Cards ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Surface Moisture */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#667085]">
              <span className="flex items-center gap-1.5"><Droplets className="w-4 h-4 text-[#159F57]" /> Topsoil (10 cm)</span>
              <span className="text-[10px] bg-[#E8F7ED] text-[#126B3B] px-2 py-0.5 rounded-full font-bold">Surface</span>
            </div>
            <div className="text-3xl font-black text-[#126B3B] font-mono">
              {readings.layer_10cm.moisture}%
            </div>
            <div className="text-xs text-[#667085]">
              Direct capacitive probe reading
            </div>
          </div>

          {/* Deep Subsoil Moisture */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#667085]">
              <span className="flex items-center gap-1.5"><Droplets className="w-4 h-4 text-[#078DC1]" /> Subsoil (30 cm)</span>
              <span className="text-[10px] bg-[#DDF3FA] text-[#078DC1] px-2 py-0.5 rounded-full font-bold">Anchor Root</span>
            </div>
            <div className="text-3xl font-black text-[#078DC1] font-mono">
              {readings.layer_30cm.moisture}%
            </div>
            <div className="text-xs text-[#667085]">
              Δ {moistureDisparity}% vertical disparity
            </div>
          </div>

          {/* Underground Temperature */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#667085]">
              <span className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-[#DC4545]" /> Soil Temp</span>
              <span className="text-[10px] bg-[#FFF0DB] text-[#E9A23B] px-2 py-0.5 rounded-full font-bold">DHT22 / Probe</span>
            </div>
            <div className="text-3xl font-black text-[#172033] font-mono">
              {readings.layer_10cm.temp}°C
            </div>
            <div className="text-xs text-[#667085]">
              Subsoil: {readings.layer_30cm.temp}°C (optimal)
            </div>
          </div>

          {/* Compaction Resistance */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#667085]">
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-[#E9A23B]" /> Compaction</span>
              <span className="text-[10px] bg-[#FFF0DB] text-[#E9A23B] px-2 py-0.5 rounded-full font-bold">20 cm Hardpan</span>
            </div>
            <div className="text-3xl font-black text-[#172033] font-mono">
              {readings.layer_20cm.compaction} <span className="text-xs font-medium text-[#667085]">kPa</span>
            </div>
            <div className="text-xs text-[#667085]">
              Threshold: &lt; 2000 kPa (penetrable)
            </div>
          </div>
        </div>

        {/* ── Main 3D Digital Twin & Depth Profile Grid ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ROOTPULSE 3D DIGITAL TWIN (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#159F57]" />
                  RootPulse 3D — Subterranean Digital Twin
                </h2>
                <p className="text-xs text-[#667085]">
                  Interactive WebGL visualization with subterranean root architecture, sensor nodes, and moisture heatmaps.
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex bg-[#FFF0DB] p-1 rounded-xl border border-[#F5D8B4] text-xs font-bold">
                <button
                  onClick={() => setTwinViewMode('moisture')}
                  className={`px-3 py-1 rounded-lg transition-all ${twinViewMode === 'moisture' ? 'bg-[#159F57] text-white shadow-sm' : 'text-[#667085]'}`}
                >
                  Moisture
                </button>
                <button
                  onClick={() => setTwinViewMode('temperature')}
                  className={`px-3 py-1 rounded-lg transition-all ${twinViewMode === 'temperature' ? 'bg-[#159F57] text-white shadow-sm' : 'text-[#667085]'}`}
                >
                  Temp
                </button>
                <button
                  onClick={() => setTwinViewMode('compaction')}
                  className={`px-3 py-1 rounded-lg transition-all ${twinViewMode === 'compaction' ? 'bg-[#159F57] text-white shadow-sm' : 'text-[#667085]'}`}
                >
                  Compaction
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="relative flex-1 min-h-[380px] rounded-xl overflow-hidden border border-[#F5D8B4] bg-[#0a0f1e]">
              <UndergroundDigitalTwin3D
                digitalTwinData={digitalTwinPayload}
                viewMode={twinViewMode}
                selectedLayer={selectedLayer}
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F5D8B4] text-[11px] text-[#172033] shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#159F57] animate-ping" />
                <span>Drag to Rotate | Scroll to Zoom</span>
              </div>
            </div>
          </div>

          {/* Depth Stratum Bar Chart & AquaRoot Quick Advice */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#172033] mb-3 flex items-center gap-2">
                <BarChart data={[]} /> Depth Moisture vs Temp Profile
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={depthComparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" opacity={0.5} />
                    <XAxis dataKey="depth" stroke="#667085" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#667085" fontSize={10} unit="%" />
                    <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #F5D8B4', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="moisture" name="Moisture %" fill="#159F57" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="temp" name="Temp °C" fill="#DC4545" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* J. AquaRoot Quick Recommendation */}
            <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#078DC1] uppercase tracking-wider flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> AquaRoot AI Intelligence
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7ED] text-[#126B3B] border border-[#159F57]/30">
                    ADVICE
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#172033]">
                  {readings.layer_30cm.moisture < 25 && readings.layer_10cm.moisture > 38
                    ? 'Deep Infiltration Drip Advised'
                    : 'Balanced Irrigation Maintained'}
                </h4>
                <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                  {readings.layer_30cm.moisture < 25
                    ? 'Topsoil is moist but deep root zone is starving. Run slow pulse-drip to allow capillary recharge without surface runoff.'
                    : 'Soil moisture is well-balanced across all horizons. Normal biological transpiration active.'}
                </p>
              </div>

              <Link
                to="/irrigation"
                className="mt-4 w-full bg-[#E8F7ED] text-[#126B3B] hover:bg-[#159F57] hover:text-white transition-colors py-2 rounded-xl text-xs font-bold text-center border border-[#159F57]/30 flex items-center justify-center gap-1.5"
              >
                Open AquaRoot Water Management <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── H, I & L: RhizoAI Insights & RootVision Capture ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* H & L: RhizoAI Insights & Stress Alerts */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#159F57]" />
                RhizoAI — Subsurface Stress Findings ({beruData?.alerts?.length || 0})
              </h3>
              <Link to="/intelligence" className="text-xs font-bold text-[#159F57] hover:underline">
                View All
              </Link>
            </div>

            {beruData?.alerts && beruData.alerts.length > 0 ? (
              <div className="space-y-3">
                {beruData.alerts.slice(0, 2).map((alert, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#F5D8B4] bg-[#FFF9F1] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#172033] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-[#DC4545]" /> {alert.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0DB] text-[#E9A23B] border border-[#F5D8B4]">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085]">{alert.evidence}</p>
                    <p className="text-xs text-[#126B3B] font-semibold mt-1">{alert.action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#E8F7ED] rounded-xl border border-[#159F57]/30 text-center text-[#126B3B]">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-[#159F57]" />
                <div className="font-bold text-sm">No Active Subterranean Stress</div>
                <div className="text-xs text-[#667085]">Soil moisture equilibrium and thermal gradient within normal bounds.</div>
              </div>
            )}
          </div>

          {/* I: RootVision Recent Observation Snapshot */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#078DC1]" />
                  RootVision AI — In-Situ Rhizotron Capture
                </h3>
                <span className="text-xs font-semibold text-[#667085]">
                  Day 30 Observation
                </span>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-32 h-24 rounded-xl overflow-hidden border border-[#F5D8B4] bg-slate-900 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80"
                    alt="Root observation snapshot"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-[#172033]">Apical Taproot & Branching System</div>
                  <div className="text-[#667085]">Estimated Length: <strong className="text-[#172033]">468.2 mm</strong></div>
                  <div className="text-[#667085]">Root Density: <strong className="text-[#159F57]">53.1%</strong></div>
                  <div className="text-[#667085]">Active Root Tips: <strong className="text-[#078DC1]">112 tips</strong></div>
                </div>
              </div>
            </div>

            <Link
              to="/rootvision"
              className="mt-4 w-full bg-[#DDF3FA] text-[#078DC1] hover:bg-[#078DC1] hover:text-white transition-colors py-2 rounded-xl text-xs font-bold text-center border border-[#078DC1]/30 flex items-center justify-center gap-1.5"
            >
              Open RootVision Computer Vision Gallery <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── K: Zone-Wise Soil Conditions Matrix ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#159F57]" />
              RootNet Multi-Zone Subterranean Health Matrix
            </h3>
            <Link to="/zones" className="text-xs font-bold text-[#159F57] hover:underline">
              Manage Field Zones
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(zones && zones.length > 0 ? zones : [
              { id: 'zone_a', name: 'Zone A — North Orchard', crop: 'Citrus', healthScore: 88, riskLevel: 'GREEN', topMoisture: 40, deepMoisture: 35.2 },
              { id: 'zone_b', name: 'Zone B — Central Plots', crop: 'Maize', healthScore: 82, riskLevel: 'GREEN', topMoisture: 36.8, deepMoisture: 32.4 },
              { id: 'zone_c', name: 'Zone C — Nursery Polyhouse', crop: 'Tomato', healthScore: 74, riskLevel: 'YELLOW', topMoisture: 46.0, deepMoisture: 39.5 },
              { id: 'zone_d', name: 'Zone D — East Plot', crop: 'Soybean', healthScore: 78, riskLevel: 'GREEN', topMoisture: 35.2, deepMoisture: 31.0 }
            ]).map((z, idx) => (
              <div key={idx} className="bg-[#FFF9F1] p-4 rounded-xl border border-[#F5D8B4] space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-[#172033]">{z.name}</h4>
                    <span className="text-xs text-[#667085]">{z.crop}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    z.riskLevel === 'GREEN' ? 'bg-[#E8F7ED] text-[#126B3B]' : 'bg-[#FFF0DB] text-[#E9A23B]'
                  }`}>
                    {z.healthScore}/100
                  </span>
                </div>
                <div className="pt-2 border-t border-[#F5D8B4]/40 flex justify-between text-xs text-[#667085]">
                  <span>Surface: <strong className="text-[#172033]">{z.topMoisture || 40}%</strong></span>
                  <span>Deep: <strong className="text-[#078DC1]">{z.deepMoisture || 35}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
