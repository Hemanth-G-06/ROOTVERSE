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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F7ED] text-[#159F57] border border-[#159F57]/30">
              MODULE 7: SOILGUARD ANALYTICS
            </span>
            <span className="text-xs text-[#6B7280] font-mono">
              Historical Underground Database
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF0DB] text-[#C26100]">
              ಸಾಯಿಲ್‌ಗಾರ್ಡ್ ವಿಶ್ಲೇಷಣೆ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1">
            Historical Soil Dynamics & Agronomic Reporting
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
            Evaluate longitudinal root-zone water retention, subterranean thermal buffering, and soil compaction degradation trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-[#FFF9F1] rounded-xl border border-[#F5D8B4]">
            {['24h', '7d', '30d'].map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  timeWindow === tw ? 'bg-[#159F57] text-white shadow' : 'text-[#6B7280] hover:text-[#172033]'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>

          <button
            onClick={generateReport}
            className="px-4 py-2 rounded-xl bg-[#159F57] hover:bg-[#126B3B] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Chart 1: Multi-Depth Moisture Curves */}
      <div className="p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#159F57]" />
            <div>
              <h3 className="text-base font-bold text-[#172033]">Subterranean Moisture Stratification Trend</h3>
              <p className="text-xs text-[#6B7280]">Comparing 10cm, 20cm, and 30cm depth moisture percentages over time</p>
            </div>
          </div>
          <span className="text-xs text-[#6B7280] font-mono">Unit: % Volumetric Water Content</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" />
              <XAxis dataKey="timestamp" stroke="#6B7280" tickFormatter={(t) => t ? t.slice(11, 16) : ''} tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F5D8B4', borderRadius: '0.75rem', fontSize: '12px', color: '#172033', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="moisture_10" name="10 cm (Topsoil)" stroke="#159F57" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="moisture_20" name="20 cm (Mid-Root)" stroke="#078DC1" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="moisture_30" name="30 cm (Deep Subsoil)" stroke="#126B3B" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Subterranean Soil Temperature & Compaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subsurface Temperature */}
        <div className="p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-500" />
              Thermal Conduction Gradient (°C)
            </h3>
            <span className="text-xs text-[#6B7280]">10cm vs 30cm Buffer</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" />
                <XAxis dataKey="timestamp" stroke="#6B7280" tickFormatter={(t) => t ? t.slice(11, 16) : ''} tick={{ fontSize: 11 }} />
                <YAxis stroke="#6B7280" domain={[15, 45]} unit="°C" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F5D8B4', borderRadius: '0.75rem', fontSize: '12px', color: '#172033', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="temp_10" name="10 cm Temp" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} dot={false} />
                <Area type="monotone" dataKey="temp_30" name="30 cm Subsoil" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compaction History */}
        <div className="p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              Soil Density & Compaction Horizon (kPa)
            </h3>
            <span className="text-xs text-[#6B7280]">Hardpan Threshold: 2000 kPa</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" />
                <XAxis dataKey="timestamp" stroke="#6B7280" tickFormatter={(t) => t ? t.slice(11, 16) : ''} tick={{ fontSize: 11 }} />
                <YAxis stroke="#6B7280" domain={[500, 3200]} unit=" kPa" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F5D8B4', borderRadius: '0.75rem', fontSize: '12px', color: '#172033', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#F5D8B4] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F5D8B4]/60 pb-4">
              <div>
                <span className="text-xs text-[#159F57] font-bold uppercase tracking-wider">Official Report</span>
                <h2 className="text-xl font-bold text-[#172033]">{report.reportId}</h2>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-[#FFF9F1] hover:bg-[#FFF0DB] border border-[#F5D8B4] text-xs font-semibold text-[#172033] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#172033]">
              <div className="grid grid-cols-2 gap-4 bg-[#FFF9F1] p-4 rounded-xl border border-[#F5D8B4]">
                <div>
                  <span className="text-[#6B7280] block">Target Zone:</span>
                  <strong className="text-[#172033] text-sm">{report.zone.name}</strong>
                  <span className="block text-[#6B7280]">Crop: {report.zone.crop} • Soil: {report.zone.soilType}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Soil Health Status:</span>
                  <strong className="text-[#159F57] text-sm">{report.healthSummary.status}</strong>
                  <span className="block text-[#6B7280]">Score: {report.healthSummary.score} / 100 ({report.healthSummary.riskClassification})</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#172033] mb-2">Depth Profile Readings:</h4>
                <div className="grid grid-cols-3 gap-3">
                  {report.depthProfiles.map((dp, i) => (
                    <div key={i} className="p-3 bg-[#FFF9F1] rounded-xl border border-[#F5D8B4] space-y-1">
                      <strong className="text-[#159F57] block">{dp.depth}</strong>
                      <div>Moisture: {dp.moisture}</div>
                      <div>Temp: {dp.temp}</div>
                      <div>Compaction: {dp.compaction}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#172033] mb-1">Predictive Irrigation Recommendation:</h4>
                <p className="p-3 bg-[#E8F7ED] rounded-xl border border-[#159F57]/30 text-[#172033]">
                  {report.predictiveIrrigation.recommendation}
                </p>
              </div>

              <div className="text-[11px] text-[#6B7280] italic pt-2">
                {report.agronomistNotes} • Generated at {new Date(report.generatedAt).toLocaleString()}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#F5D8B4]/60">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 text-[#172033] text-xs font-bold hover:bg-gray-200"
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
