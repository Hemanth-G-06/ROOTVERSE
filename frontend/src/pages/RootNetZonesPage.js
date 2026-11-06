// frontend/src/pages/RootNetZonesPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useRootPulse } from '../context/RootPulseContext';
import {
  Cpu,
  Plus,
  Layers,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Maximize2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function RootNetZonesPage() {
  const { zones, activeZone, setActiveZone, apiBase, refreshData } = useRootPulse();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    crop: '',
    soilType: 'Clay Loam',
    rootDepthCm: 30,
    areaHectares: 2.0,
    irrigationType: 'Drip System'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreateZone = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${apiBase}/api/zones`, formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          crop: '',
          soilType: 'Clay Loam',
          rootDepthCm: 30,
          areaHectares: 2.0,
          irrigationType: 'Drip System'
        });
        refreshData();
      }
    } catch (err) {
      console.error('Failed to create zone:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-emerald-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              MODULE 6: ROOTNET
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Multi-Zone Soil Intelligence Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Agricultural Field Zones & Multi-Depth Nodes
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Monitor and contrast spatial soil stratification, crop root profiles, and compaction barriers across all registered plots.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Zone</span>
        </button>
      </div>

      {/* Field Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {zones.map((z) => (
          <div
            key={z.id}
            onClick={() => setActiveZone(z.id)}
            className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
              z.id === activeZone
                ? 'bg-emerald-950/40 border-emerald-500 shadow-2xl scale-[1.02]'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold">
                  {z.id.toUpperCase()}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  z.riskLevel === 'GREEN' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  z.riskLevel === 'YELLOW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {z.healthScore || 85} / 100
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-2">{z.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Crop: <strong className="text-slate-300">{z.crop}</strong></p>
              <p className="text-xs text-slate-400">Soil: <strong className="text-slate-300">{z.soilType}</strong></p>

              {/* Subsurface Horizon Badges */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                <div className="p-2 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Top (10cm)</span>
                  <span className="text-xs font-bold font-mono text-white">{z.topMoisture || 38}%</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Deep (30cm)</span>
                  <span className="text-xs font-bold font-mono text-white">{z.deepMoisture || 35}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>{z.id === activeZone ? 'Currently Selected' : 'Select Zone'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Register Field Zone */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Register New Agricultural Field Zone</h2>
            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Vineyard Block 4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Crop Variety</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pinot Noir Grape"
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Soil Texture</label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Silt Loam">Silt Loam</option>
                    <option value="Peat Compost">Peat Compost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Root Depth (cm)</label>
                  <input
                    type="number"
                    value={formData.rootDepthCm}
                    onChange={(e) => setFormData({ ...formData, rootDepthCm: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.areaHectares}
                    onChange={(e) => setFormData({ ...formData, areaHectares: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow"
                >
                  {submitting ? 'Registering...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

