// frontend/src/pages/SoilGuardAnalyticsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRootPulse } from '../context/RootPulseContext';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  Droplets,
  Layers,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export default function SoilGuardAnalyticsPage() {
  const { activeZone, currentZoneInfo, apiBase } = useRootPulse();
  const [timeWindow, setTimeWindow] = useState('7d'); // '24h' | '7d' | '30d'
  const [trends, setTrends] = useState([]);
  const [report, setReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchTrends = async () => {
    try {
      const days = timeWindow === '24h' ? 1 : timeWindow === '7d' ? 7 : 30;
      const res = await axios.get(`${apiBase}/api/analytics/trends?zone_id=${activeZone}&days=${days}`);
      if (res.data.success) {
        setTrends(res.data.trends);
      }
    } catch (e) {
      console.warn('Could not fetch analytics trends');
    }
  };

  const generateReport = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/analytics/soil-report?zone_id=${activeZone}`);
      if (res.data.success) {
        setReport(res.data.report);
        setShowReportModal(true);
      }
    } catch (e) {
      console.warn('Could not generate report');
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [activeZone, timeWindow, apiBase]);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-emerald-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              MODULE 7: SOILGUARD ANALYTICS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Historical Underground Database
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Historical Soil Dynamics & Agronomic Reporting
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Evaluate longitudinal root-zone water retention, subterranean thermal buffering, and soil compaction degradation trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {['24h', '7d', '30d'].map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  timeWindow === tw ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>

          <button
            onClick={generateReport}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Chart 1: Multi-Depth Moisture Curves */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Subterranean Moisture Stratification Trend</h3>
              <p className="text-xs text-slate-400">Comparing 10cm, 20cm, and 30cm depth moisture percentages over time</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Unit: % Volumetric Water Content</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => t.slice(11, 16)} tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="moisture_10" name="10 cm (Topsoil)" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="moisture_20" name="20 cm (Mid-Root)" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="moisture_30" name="30 cm (Deep Subsoil)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Subterranean Soil Temperature & Compaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subsurface Temperature */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-400" />
              Thermal Conduction Gradient (°C)
            </h3>
            <span className="text-xs text-slate-400">10cm vs 30cm Buffer</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => t.slice(11, 16)} tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[15, 45]} unit="°C" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="temp_10" name="10 cm Temp" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} dot={false} />
                <Area type="monotone" dataKey="temp_30" name="30 cm Subsoil" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compaction History */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              Soil Density & Compaction Horizon (kPa)
            </h3>
            <span className="text-xs text-slate-400">Hardpan Threshold: 2000 kPa</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => t.slice(11, 16)} tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[500, 3200]} unit=" kPa" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="compaction_20" name="20 cm Mid-Horizon" stroke="#f97316" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Downloadable / Printable Report Modal */}
      {showReportModal && report && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Official Report</span>
                <h2 className="text-xl font-bold text-white">{report.reportId}</h2>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Target Zone:</span>
                  <strong className="text-white text-sm">{report.zone.name}</strong>
                  <span className="block text-slate-400">Crop: {report.zone.crop} • Soil: {report.zone.soilType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Soil Health Status:</span>
                  <strong className="text-emerald-400 text-sm">{report.healthSummary.status}</strong>
                  <span className="block text-slate-400">Score: {report.healthSummary.score} / 100 ({report.healthSummary.riskClassification})</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Depth Profile Readings:</h4>
                <div className="grid grid-cols-3 gap-3">
                  {report.depthProfiles.map((dp, i) => (
                    <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <strong className="text-emerald-400 block">{dp.depth}</strong>
                      <div>Moisture: {dp.moisture}</div>
                      <div>Temp: {dp.temp}</div>
                      <div>Compaction: {dp.compaction}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">Predictive Irrigation Recommendation:</h4>
                <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  {report.predictiveIrrigation.recommendation}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 italic pt-2">
                {report.agronomistNotes} • Generated at {new Date(report.generatedAt).toLocaleString()}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

