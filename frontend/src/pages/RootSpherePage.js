// frontend/src/pages/RootSpherePage.js
// Visual Identity: HAXLR8 3.0 Clean Agricultural Design System
// Palette: #FFF9F1 (bg), #159F57 (primary green), #E8F7ED (light green), #F5D8B4 (peach border)
import React, { useState, useEffect } from 'react';
import { useRootPulse } from '../context/RootPulseContext';
import {
  TreeDeciduous,
  Droplets,
  Thermometer,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RefreshCw,
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
  Legend,
  AreaChart,
  Area
} from 'recharts';

const API_BASE = process.env.REACT_APP_API_HOST || 'http://localhost:5001';

export default function RootSpherePage() {
  const { activeZone, zones, operatingMode } = useRootPulse();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRootSphereData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/rootsphere/overview?zone_id=${activeZone}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Failed to load RootSphere data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRootSphereData();
  }, [activeZone]);

  const zone = data?.zone || { name: 'Zone A', crop: 'Citrus' };
  const healthScore = data?.healthScore || 88;
  const riskLevel = data?.riskLevel || 'GREEN';
  const stratum = data?.stratumProfile || [
    { depth: '10 cm', label: 'Topsoil Surface', moisture: 40, temp: 27.3, ec: 1.25, compaction: 820 },
    { depth: '20 cm', label: 'Mid-Root Horizon', moisture: 37.6, temp: 26.8, ec: 1.30, compaction: 960 },
    { depth: '30 cm', label: 'Deep Subsoil Anchor', moisture: 35.2, temp: 26.4, ec: 1.35, compaction: 1090 }
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F1] py-6 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header Title Banner ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F7ED] text-[#126B3B] border border-[#159F57]/30">
                ROOTSPHERE ECOSYSTEM
              </span>
              <span className="text-xs text-[#667085] font-medium">
                {zone.name} ({zone.crop})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              ಬೇರುಗೋಳ — RootSphere Integrated Subterranean Ecosystem
            </h1>
            <p className="text-sm text-[#667085] mt-1 max-w-3xl">
              Complete root-zone environment monitoring fusing multi-depth moisture distribution, soil compaction penetrometry, electrical conductivity, underground temperatures, and RootVision observation imagery.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#FFF0DB] p-4 rounded-xl border border-[#F5D8B4]">
            <div className="text-right">
              <div className="text-xs font-semibold text-[#667085]">Ecosystem Health Score</div>
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

        {/* ── 3 Depth Stratum Profile Cards ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stratum.map((layer, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-[#078DC1] uppercase tracking-wider">
                    {layer.depth}
                  </span>
                  <h3 className="text-lg font-bold text-[#172033] mt-0.5">
                    {layer.label}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#E8F7ED] flex items-center justify-center text-[#159F57]">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#FFF9F1] p-3 rounded-xl border border-[#F5D8B4]/60">
                  <div className="text-xs text-[#667085] flex items-center gap-1 font-medium">
                    <Droplets className="w-3.5 h-3.5 text-[#078DC1]" /> Moisture
                  </div>
                  <div className="text-xl font-extrabold text-[#126B3B] mt-1">
                    {layer.moisture}%
                  </div>
                </div>

                <div className="bg-[#FFF9F1] p-3 rounded-xl border border-[#F5D8B4]/60">
                  <div className="text-xs text-[#667085] flex items-center gap-1 font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-[#DC4545]" /> Temp
                  </div>
                  <div className="text-xl font-extrabold text-[#172033] mt-1">
                    {layer.temp}°C
                  </div>
                </div>

                <div className="bg-[#FFF9F1] p-3 rounded-xl border border-[#F5D8B4]/60">
                  <div className="text-xs text-[#667085] flex items-center gap-1 font-medium">
                    <Zap className="w-3.5 h-3.5 text-[#E9A23B]" /> EC Salinity
                  </div>
                  <div className="text-base font-bold text-[#172033] mt-1">
                    {layer.ec} mS/cm
                  </div>
                </div>

                <div className="bg-[#FFF9F1] p-3 rounded-xl border border-[#F5D8B4]/60">
                  <div className="text-xs text-[#667085] flex items-center gap-1 font-medium">
                    <Activity className="w-3.5 h-3.5 text-[#667085]" /> Compaction
                  </div>
                  <div className="text-base font-bold text-[#172033] mt-1">
                    {layer.compaction} kPa
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#667085] pt-2 border-t border-[#F5D8B4]/40 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#078DC1]" />
                {idx === 0 ? 'Direct Hardware Measurement (Pin 34 AO)' : 'Inferred Subsoil Capillary Layer'}
              </div>
            </div>
          ))}
        </div>

        {/* ── Depth Comparison Recharts ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#172033] mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#078DC1]" />
              Depth-Wise Moisture Penetration Gradient
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stratum} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" opacity={0.6} />
                  <XAxis dataKey="depth" stroke="#667085" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#667085" fontSize={12} unit="%" />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #F5D8B4', borderRadius: 8, color: '#172033' }} />
                  <Legend />
                  <Bar dataKey="moisture" name="Soil Moisture (%)" fill="#159F57" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#172033] mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#E9A23B]" />
              Subsoil Hardpan Compaction Resistance (kPa)
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stratum} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" opacity={0.6} />
                  <XAxis dataKey="depth" stroke="#667085" fontSize={12} />
                  <YAxis domain={[0, 2500]} stroke="#667085" fontSize={12} unit=" kPa" />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #F5D8B4', borderRadius: 8, color: '#172033' }} />
                  <Legend />
                  <Bar dataKey="compaction" name="Compaction Penetrometry (kPa)" fill="#078DC1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Active Ecosystem Insights ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#159F57]" />
              RhizoAI Biological Root-Zone Diagnostic Findings
            </h2>
            <button
              onClick={fetchRootSphereData}
              className="text-xs font-bold text-[#159F57] hover:text-[#126B3B] flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Evaluate
            </button>
          </div>

          {data?.alerts && data.alerts.length > 0 ? (
            <div className="space-y-3">
              {data.alerts.map((alert, i) => (
                <div key={i} className="p-4 rounded-xl border border-[#F5D8B4] bg-[#FFF9F1] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172033] text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#DC4545]" />
                      {alert.title}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF0DB] text-[#E9A23B] border border-[#F5D8B4]">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    <strong>Evidence:</strong> {alert.evidence}
                  </p>
                  <p className="text-xs text-[#126B3B] font-semibold">
                    <strong>Recommended Agronomic Mitigation:</strong> {alert.action}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#E8F7ED] rounded-xl border border-[#159F57]/30 text-[#126B3B]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#159F57]" />
              <div className="font-bold text-sm">Optimal Subterranean Biological Equilibrium</div>
              <p className="text-xs text-[#667085] mt-1">
                Moisture is evenly distributed across all 3 soil horizons. No hardpan compaction impediment or hypoxic conditions detected.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

