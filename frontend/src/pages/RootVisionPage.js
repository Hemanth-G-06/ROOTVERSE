// frontend/src/pages/RootVisionPage.js
// Visual Identity: HAXLR8 3.0 Clean Agricultural Design System
// Palette: #FFF9F1 (bg), #159F57 (primary green), #E8F7ED (light green), #F5D8B4 (peach border)
import React, { useState, useEffect } from 'react';
import { useRootPulse } from '../context/RootPulseContext';
import {
  Compass,
  Upload,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scan,
  Maximize2,
  Eye,
  Info,
  RefreshCw,
  Camera
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_HOST || 'http://localhost:5001';

export default function RootVisionPage() {
  const { activeZone, currentZoneInfo } = useRootPulse();
  const [observations, setObservations] = useState([
    {
      id: 'ro_101',
      date: '2026-10-10',
      label: 'Observation Day 1 — Taproot Penetration (Day 1)',
      imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=700&q=80',
      rootLengthMm: 168.4,
      rootDensityPct: 22.8,
      rootTipCount: 34,
      healthStatus: 'HEALTHY',
      findings: 'Strong primary taproot extension down to 18 cm. Active root hair differentiation.'
    },
    {
      id: 'ro_102',
      date: '2026-10-24',
      label: 'Observation Day 14 — Mid-Horizon Branching (Day 14)',
      imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=700&q=80',
      rootLengthMm: 312.6,
      rootDensityPct: 39.4,
      rootTipCount: 68,
      healthStatus: 'VIGOROUS_GROWTH',
      findings: 'Extensive secondary lateral branching between 15-25 cm. Root growth velocity: 10.3 mm/day.'
    },
    {
      id: 'ro_103',
      date: '2026-11-05',
      label: 'Observation Day 30 — Deep Taproot Subsoil Anchor (Day 30)',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
      rootLengthMm: 468.2,
      rootDensityPct: 53.1,
      rootTipCount: 112,
      healthStatus: 'OPTIMAL_MATURATION',
      findings: 'Deep subterranean anchor roots successfully penetrated 30 cm layer with high capillary density.'
    }
  ]);

  const [selectedBaseline, setSelectedBaseline] = useState('ro_101');
  const [selectedLatest, setSelectedLatest] = useState('ro_103');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeTab, setActiveTab] = useState('compare'); // 'compare' | 'history' | 'upload'
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchObservations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rootvision/history`);
      if (res.ok) {
        const json = await res.json();
        if (json.observations && json.observations.length > 0) {
          setObservations(json.observations);
        }
      }
    } catch (e) {
      console.warn('Could not fetch root observations:', e);
    }
  };

  const runComparison = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rootvision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observationId1: selectedBaseline, observationId2: selectedLatest })
      });
      if (res.ok) {
        const json = await res.json();
        setComparisonResult(json.comparison);
      }
    } catch (e) {
      console.warn('Comparison failed:', e);
    }
  };

  useEffect(() => {
    fetchObservations();
    runComparison();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append('label', uploadLabel || 'Rhizotron Root Observation');
    formData.append('zoneId', activeZone);

    try {
      const res = await fetch(`${API_BASE}/api/rootvision/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const json = await res.json();
        if (json.observation) {
          setObservations(prev => [json.observation, ...prev]);
          setActiveTab('history');
          setUploadFile(null);
          setUploadPreview(null);
          setUploadLabel('');
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const obs1 = observations.find(o => o.id === selectedBaseline) || observations[0];
  const obs2 = observations.find(o => o.id === selectedLatest) || observations[observations.length - 1];

  return (
    <div className="min-h-screen bg-[#FFF9F1] py-6 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Title Banner ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F7ED] text-[#126B3B] border border-[#159F57]/30">
                ROOTVISION AI — COMPUTER VISION ENGINE
              </span>
              <span className="text-xs text-[#667085] font-medium">
                Zone: {currentZoneInfo?.name || 'Zone A'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              ಬೇರುದರ್ಶನ — RootVision In-Situ Rhizotron Image Monitoring
            </h1>
            <p className="text-sm text-[#667085] mt-1 max-w-3xl">
              Transparent underground minirhizotron tube observation camera pipeline. Analyzes genuine plant root structures for elongation velocity, branching density, active apical root tips, and subterranean biomass expansion.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-[#FFF0DB] p-1.5 rounded-xl border border-[#F5D8B4] gap-1">
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'compare'
                  ? 'bg-[#159F57] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              Temporal Comparison
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#159F57] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              Observation Gallery ({observations.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#159F57] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              + Ingest Capture
            </button>
          </div>
        </div>

        {/* ── Scientific Limitations Notice (Mandated by Problem Statement) ── */}
        <div className="bg-[#DDF3FA] border border-[#078DC1]/40 rounded-xl p-4 flex items-start gap-3 text-xs text-[#172033]">
          <Info className="w-5 h-5 text-[#078DC1] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#078DC1] font-bold">Scientific & Image Processing Limitations:</strong> RootVision AI performs morphological skeletonization and pixel-contrast edge segmentation on roots visible against the transparent viewing tube. All derived lengths (mm) and area densities (%) are calibrated optical estimates. Whole-root-system architecture requires multi-angle minirhizotron coverage.
          </div>
        </div>

        {/* ── TAB 1: TEMPORAL COMPARISON ──────────────────────────────────── */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            {/* Observation Selectors */}
            <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#667085]">Baseline Capture:</span>
                <select
                  value={selectedBaseline}
                  onChange={(e) => { setSelectedBaseline(e.target.value); runComparison(); }}
                  className="bg-[#FFF9F1] border border-[#F5D8B4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#172033] focus:outline-none"
                >
                  {observations.map(o => (
                    <option key={o.id} value={o.id}>{o.date} — {o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#667085]">Latest Comparison:</span>
                <select
                  value={selectedLatest}
                  onChange={(e) => { setSelectedLatest(e.target.value); runComparison(); }}
                  className="bg-[#FFF9F1] border border-[#F5D8B4] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#172033] focus:outline-none"
                >
                  {observations.map(o => (
                    <option key={o.id} value={o.id}>{o.date} — {o.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={runComparison}
                className="bg-[#159F57] text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[#126B3B] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Scan className="w-4 h-4" /> Run CV Morphological Delta
              </button>
            </div>

            {/* Side-by-Side Genuine Root Observation Photographs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Baseline Image Card */}
              <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold bg-[#FFF0DB] text-[#E9A23B] px-2.5 py-0.5 rounded-full border border-[#F5D8B4]">
                    BASELINE CAPTURE ({obs1?.date})
                  </span>
                  <span className="text-xs text-[#667085]">{obs1?.label}</span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-[#F5D8B4] bg-slate-900 aspect-video">
                  <img
                    src={obs1?.imageUrl}
                    alt="Root observation baseline"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[11px] font-mono">
                    Depth: 0–35 cm | Apical Tips: {obs1?.rootTipCount}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#FFF9F1] p-2.5 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-[#667085] font-medium">Estimated Length</div>
                    <div className="font-extrabold text-[#172033] mt-0.5">{obs1?.rootLengthMm} mm</div>
                  </div>
                  <div className="bg-[#FFF9F1] p-2.5 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-[#667085] font-medium">Root Density</div>
                    <div className="font-extrabold text-[#159F57] mt-0.5">{obs1?.rootDensityPct}%</div>
                  </div>
                  <div className="bg-[#FFF9F1] p-2.5 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-[#667085] font-medium">Apical Tips</div>
                    <div className="font-extrabold text-[#078DC1] mt-0.5">{obs1?.rootTipCount}</div>
                  </div>
                </div>
              </div>

              {/* Comparison Image Card */}
              <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold bg-[#E8F7ED] text-[#159F57] px-2.5 py-0.5 rounded-full border border-[#159F57]/30">
                    FOLLOW-UP CAPTURE ({obs2?.date})
                  </span>
                  <span className="text-xs text-[#667085]">{obs2?.label}</span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-[#F5D8B4] bg-slate-900 aspect-video">
                  <img
                    src={obs2?.imageUrl}
                    alt="Root observation follow-up"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[11px] font-mono">
                    Depth: 0–35 cm | Apical Tips: {obs2?.rootTipCount}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#FFF9F1] p-2.5 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-[#667085] font-medium">Estimated Length</div>
                    <div className="font-extrabold text-[#172033] mt-0.5">{obs2?.rootLengthMm} mm</div>
                  </div>
                  <div className="bg-[#FFF9F1] p-2.5 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-[#667085] font-medium">Root Density</div>
                    <div className="font-extrabold text-[#159F57] mt-0.5">{obs2?.rootDensityPct}%</div>
                  </div>
                  <div className="bg-[#FFF9F1] p-2.5 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-[#667085] font-medium">Apical Tips</div>
                    <div className="font-extrabold text-[#078DC1] mt-0.5">{obs2?.rootTipCount}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Metrics & Interpretation Report */}
            {comparisonResult && (
              <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-[#172033] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#159F57]" />
                  Computer Vision Temporal Growth Report
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#FFF9F1] p-4 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-xs text-[#667085]">Total Elongation</div>
                    <div className="text-2xl font-black text-[#159F57] mt-1">
                      +{comparisonResult.metrics.totalElongationMm} <span className="text-xs">mm</span>
                    </div>
                  </div>

                  <div className="bg-[#FFF9F1] p-4 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-xs text-[#667085]">Growth Velocity</div>
                    <div className="text-2xl font-black text-[#078DC1] mt-1">
                      {comparisonResult.metrics.growthVelocityMmPerDay} <span className="text-xs">mm/day</span>
                    </div>
                  </div>

                  <div className="bg-[#FFF9F1] p-4 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-xs text-[#667085]">Density Change</div>
                    <div className="text-2xl font-black text-[#126B3B] mt-1">
                      +{comparisonResult.metrics.densityChangePct}%
                    </div>
                  </div>

                  <div className="bg-[#FFF9F1] p-4 rounded-xl border border-[#F5D8B4]/60">
                    <div className="text-xs text-[#667085]">Proliferation Status</div>
                    <div className="text-base font-bold text-[#E9A23B] mt-1.5">
                      {comparisonResult.metrics.proliferationStatus}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#E8F7ED] rounded-xl border border-[#159F57]/30 text-xs text-[#126B3B] leading-relaxed">
                  <strong>Agronomic Evaluation:</strong> {comparisonResult.interpretation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: OBSERVATION GALLERY ──────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {observations.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#159F57] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {item.date}
                  </span>
                  <span className="bg-[#FFF0DB] px-2 py-0.5 rounded-full font-semibold text-[#E9A23B]">
                    {item.healthStatus}
                  </span>
                </div>

                <div className="aspect-video rounded-xl overflow-hidden border border-[#F5D8B4] bg-slate-900">
                  <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
                </div>

                <h4 className="font-bold text-[#172033] text-sm">{item.label}</h4>
                <p className="text-xs text-[#667085] line-clamp-2">{item.findings}</p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F5D8B4]/40 text-center text-xs">
                  <div>
                    <div className="text-[#98A2B3] text-[10px]">Length</div>
                    <div className="font-bold text-[#172033]">{item.rootLengthMm} mm</div>
                  </div>
                  <div>
                    <div className="text-[#98A2B3] text-[10px]">Density</div>
                    <div className="font-bold text-[#159F57]">{item.rootDensityPct}%</div>
                  </div>
                  <div>
                    <div className="text-[#98A2B3] text-[10px]">Root Tips</div>
                    <div className="font-bold text-[#078DC1]">{item.rootTipCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 3: INGEST CAPTURE FORM ──────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#172033] mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#159F57]" />
              Upload Minirhizotron Root Observation Photograph
            </h3>
            <p className="text-xs text-[#667085] mb-6">
              Upload captured photographs from your transparent underground viewing tube. Images are processed with OpenCV contrast enhancement, edge segmentation, and morphological skeletonization.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Observation Label / Title</label>
                <input
                  type="text"
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  placeholder="e.g. Day 45 Subsoil Taproot Proliferation"
                  className="w-full bg-[#FFF9F1] border border-[#F5D8B4] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#159F57]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Select Root Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-[#667085] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E8F7ED] file:text-[#126B3B] hover:file:bg-[#159F57] hover:file:text-white file:transition-colors cursor-pointer"
                />
              </div>

              {uploadPreview && (
                <div className="mt-3 rounded-xl overflow-hidden border border-[#F5D8B4] max-h-60 bg-slate-900">
                  <img src={uploadPreview} alt="Upload preview" className="w-full h-full object-contain" />
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full bg-[#159F57] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#126B3B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing with OpenCV...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" /> Run Computer Vision Analysis
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
