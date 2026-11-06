// frontend/src/pages/RootVisionPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Maximize2
} from 'lucide-react';

export default function RootVisionPage() {
  const { apiBase, activeZone, currentZoneInfo } = useRootPulse();
  const [observations, setObservations] = useState([]);
  const [selectedBaseline, setSelectedBaseline] = useState('ro_day1');
  const [selectedLatest, setSelectedLatest] = useState('ro_day30');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [activeTab, setActiveTab] = useState('compare'); // 'compare' | 'history' | 'upload'

  // Fetch observations
  const fetchObservations = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/rootvision/history`);
      if (res.data.success) {
        setObservations(res.data.observations);
      }
    } catch (e) {
      console.warn('Could not fetch root observations');
    }
  };

  // Run CV comparison between 2 observations
  const runComparison = async () => {
    try {
      const res = await axios.post(`${apiBase}/api/rootvision/analyze`, {
        baselineId: selectedBaseline,
        comparisonId: selectedLatest
      });
      if (res.data.success) {
        setComparisonResult(res.data.comparison);
      }
    } catch (e) {
      console.warn('Comparison failed');
    }
  };

  useEffect(() => {
    fetchObservations();
  }, [apiBase]);

  useEffect(() => {
    runComparison();
  }, [selectedBaseline, selectedLatest, observations]);

  // Handle mock / actual image upload
  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const res = await axios.post(`${apiBase}/api/rootvision/upload`, {
        zoneId: activeZone,
        label: uploadLabel || 'Field Rhizotron Capture'
      });
      if (res.data.success) {
        setUploadLabel('');
        await fetchObservations();
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const baselineObj = observations.find(o => o.id === selectedBaseline) || observations[0];
  const latestObj = observations.find(o => o.id === selectedLatest) || observations[observations.length - 1];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-emerald-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              MODULE 4: ROOTVISION AI
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Minirhizotron Computer Vision
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Subterranean Root Morphology & Growth Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            In-situ transparent observation tube analysis using computer vision to quantify root length, lateral branching density, and elongation velocity over time.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'compare' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Temporal Comparison
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Observation Log ({observations.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload Observation
          </button>
        </div>
      </div>

      {/* Mode 1: Temporal Side-by-Side Comparison */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* Observation Selector Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Baseline Capture (Day 1 / Previous):
              </label>
              <select
                value={selectedBaseline}
                onChange={(e) => setSelectedBaseline(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                {observations.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.label} ({obs.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Comparison Capture (Latest / Current):
              </label>
              <select
                value={selectedLatest}
                onChange={(e) => setSelectedLatest(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                {observations.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.label} ({obs.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Comparison Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Baseline Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Baseline State</span>
                  <h3 className="text-base font-bold text-white">{baselineObj?.label}</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono">{baselineObj?.date}</span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video bg-black flex items-center justify-center">
                <img
                  src={baselineObj?.imageUrl}
                  alt="Baseline root"
                  className="w-full h-full object-cover filter contrast-125 brightness-90"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-emerald-300 font-mono">
                  Minirhizotron Tube Raw
                </div>
                {/* CV Edge Overlay Simulated Lines */}
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/20" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Total Length</div>
                  <div className="text-sm font-bold text-white font-mono">{baselineObj?.estimatedLengthMm} mm</div>
                </div>
                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Coverage Density</div>
                  <div className="text-sm font-bold text-white font-mono">{baselineObj?.rootDensityPct}%</div>
                </div>
                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Active Tips</div>
                  <div className="text-sm font-bold text-white font-mono">{baselineObj?.tipCount}</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                {baselineObj?.findings}
              </p>
            </div>

            {/* Latest Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-800/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">Growth Progression</span>
                  <h3 className="text-base font-bold text-white">{latestObj?.label}</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono">{latestObj?.date}</span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-emerald-600/50 aspect-video bg-black flex items-center justify-center">
                <img
                  src={latestObj?.imageUrl}
                  alt="Latest root"
                  className="w-full h-full object-cover filter contrast-125 brightness-95"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/80 backdrop-blur-sm text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                  <Scan className="w-3 h-3 text-emerald-400" />
                  CV Morphological Mask
                </div>
                {/* CV Edge Overlay Simulated Lines */}
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/40" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 bg-slate-950/80 rounded-xl border border-emerald-900/50">
                  <div className="text-[10px] text-slate-400">Total Length</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">{latestObj?.estimatedLengthMm} mm</div>
                </div>
                <div className="p-2 bg-slate-950/80 rounded-xl border border-emerald-900/50">
                  <div className="text-[10px] text-slate-400">Coverage Density</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">{latestObj?.rootDensityPct}%</div>
                </div>
                <div className="p-2 bg-slate-950/80 rounded-xl border border-emerald-900/50">
                  <div className="text-[10px] text-slate-400">Active Tips</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">{latestObj?.tipCount}</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                {latestObj?.findings}
              </p>
            </div>
          </div>

          {/* Computer Vision Differential Growth Metrics */}
          {comparisonResult && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-700/50 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Temporal Differential Root Dynamics
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  {comparisonResult.metrics.biomassExpansionRating} GROWTH
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-800/40">
                  <span className="text-xs text-slate-400">Net Length Elongation</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    +{comparisonResult.metrics.totalElongationMm} mm
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-800/40">
                  <span className="text-xs text-slate-400">Growth Velocity</span>
                  <div className="text-2xl font-black text-teal-400 font-mono mt-1">
                    {comparisonResult.metrics.growthVelocityMmPerDay} mm/day
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-800/40">
                  <span className="text-xs text-slate-400">Density Delta</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    +{comparisonResult.metrics.densityChangePct}%
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-800/40">
                  <span className="text-xs text-slate-400">New Root Tips</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    +{comparisonResult.metrics.newRootTipProliferation}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/70 p-4 rounded-xl border border-slate-800 leading-relaxed">
                <strong>Agronomic Evaluation:</strong> {comparisonResult.evaluation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Observation Log History */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {observations.map((obs) => (
            <div key={obs.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
                <img src={obs.imageUrl} alt={obs.label} className="w-full h-full object-cover" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-400">
                  {obs.date}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">{obs.label}</h4>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Length</span>
                  <strong className="text-emerald-400 font-mono">{obs.estimatedLengthMm}mm</strong>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Density</span>
                  <strong className="text-emerald-400 font-mono">{obs.rootDensityPct}%</strong>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Tips</span>
                  <strong className="text-emerald-400 font-mono">{obs.tipCount}</strong>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{obs.findings}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mode 3: Image Upload & Computer Vision Processing */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Upload New Minirhizotron Root Capture</h2>
            <p className="text-xs text-slate-400 mt-1">
              Supports automated image preprocessing, skeletonization, and root tip segmentation.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Observation Title / Note:
              </label>
              <input
                type="text"
                placeholder="e.g. Day 45 Post-Subsoiling Root Regeneration"
                value={uploadLabel}
                onChange={(e) => setUploadLabel(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-950/60 transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">Drag & drop rhizotron camera capture here</p>
              <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, TIFF up to 25MB</p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-emerald-300 hover:bg-slate-700"
              >
                Browse Files
              </button>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <span>Processing Computer Vision Model...</span>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>Execute RootVision Analysis</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

