// frontend/src/pages/DigitalTwinPage.js
import React, { useState } from 'react';
import { useRootPulse } from '../context/RootPulseContext';
import UndergroundDigitalTwin3D from '../components/UndergroundDigitalTwin3D';
import {
  Layers,
  Droplets,
  Thermometer,
  ShieldAlert,
  Eye,
  Sliders,
  Sparkles,
  Info,
  Activity,
  Compass
} from 'lucide-react';

export default function DigitalTwinPage() {
  const { activeZone, currentZoneInfo, currentZoneReadings, operatingMode } = useRootPulse();
  const [twinViewMode, setTwinViewMode] = useState('moisture');
  const [selectedLayer, setSelectedLayer] = useState('all');

  const readings = currentZoneReadings || {
    layer_10cm: { moisture: 38.2, temp: 22.4, ec: 1.25, ph: 6.6, compaction: 820 },
    layer_20cm: { moisture: 36.5, temp: 21.8, ec: 1.30, ph: 6.7, compaction: 950 },
    layer_30cm: { moisture: 35.1, temp: 21.2, ec: 1.32, ph: 6.8, compaction: 1040 }
  };

  const digitalTwinPayload = {
    zoneId: activeZone,
    layers: [
      { depthLabel: '10 cm', ...readings.layer_10cm },
      { depthLabel: '20 cm', ...readings.layer_20cm },
      { depthLabel: '30 cm', ...readings.layer_30cm }
    ]
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-emerald-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              3D SUBTERRANEAN DIGITAL TWIN
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Plot: {currentZoneInfo.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Volumetric Underground Soil & Root Architecture
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate and visualize moisture infiltration, subterranean thermal conduction, and soil compaction barriers at 10cm, 20cm, and 30cm depths.
          </p>
        </div>
      </div>

      {/* Main 3D Canvas Box */}
      <UndergroundDigitalTwin3D
        digitalTwinData={digitalTwinPayload}
        selectedLayer={selectedLayer}
        onSelectLayer={setSelectedLayer}
        activeMode={twinViewMode}
        onChangeMode={setTwinViewMode}
      />

      {/* Layer Depth Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Layer 1 */}
        <div className={`p-5 rounded-2xl border transition-all ${selectedLayer === '10cm' ? 'bg-emerald-950/40 border-emerald-400 shadow-xl' : 'bg-slate-900/70 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Horizon A (0 - 10 cm)</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Topsoil</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Organic Feeder Zone</h3>
          <p className="text-xs text-slate-400 mt-1">
            High biological activity, fine capillary root clusters, initial rainfall and irrigation absorption surface.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Moisture:</span>
              <strong className="text-white font-mono">{readings.layer_10cm.moisture}% VWC</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subsurface Temp:</span>
              <strong className="text-white font-mono">{readings.layer_10cm.temp}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Soil Compaction:</span>
              <strong className="text-white font-mono">{readings.layer_10cm.compaction} kPa</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Salinity EC:</span>
              <strong className="text-white font-mono">{readings.layer_10cm.ec} dS/m</strong>
            </div>
          </div>
        </div>

        {/* Layer 2 */}
        <div className={`p-5 rounded-2xl border transition-all ${selectedLayer === '20cm' ? 'bg-emerald-950/40 border-emerald-400 shadow-xl' : 'bg-slate-900/70 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Horizon B1 (10 - 20 cm)</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Mid Root</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Primary Lateral Root Zone</h3>
          <p className="text-xs text-slate-400 mt-1">
            Major structural root branching, prime location for plough-pan compaction barriers and perched water tables.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Moisture:</span>
              <strong className="text-white font-mono">{readings.layer_20cm.moisture}% VWC</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subsurface Temp:</span>
              <strong className="text-white font-mono">{readings.layer_20cm.temp}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Soil Compaction:</span>
              <strong className={`font-mono ${readings.layer_20cm.compaction > 2000 ? 'text-rose-400 font-bold' : 'text-white'}`}>
                {readings.layer_20cm.compaction} kPa
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Salinity EC:</span>
              <strong className="text-white font-mono">{readings.layer_20cm.ec} dS/m</strong>
            </div>
          </div>
        </div>

        {/* Layer 3 */}
        <div className={`p-5 rounded-2xl border transition-all ${selectedLayer === '30cm' ? 'bg-emerald-950/40 border-emerald-400 shadow-xl' : 'bg-slate-900/70 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Horizon B2 (20 - 30 cm)</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Subsoil</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Deep Taproot Reservoir</h3>
          <p className="text-xs text-slate-400 mt-1">
            Thermal buffer layer and ultimate drought resilience anchor; critical indicator of deep soil moisture drought.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Moisture:</span>
              <strong className={`font-mono ${readings.layer_30cm.moisture < 20 ? 'text-rose-400 font-bold' : 'text-white'}`}>
                {readings.layer_30cm.moisture}% VWC
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subsurface Temp:</span>
              <strong className="text-white font-mono">{readings.layer_30cm.temp}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Soil Compaction:</span>
              <strong className="text-white font-mono">{readings.layer_30cm.compaction} kPa</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Salinity EC:</span>
              <strong className="text-white font-mono">{readings.layer_30cm.ec} dS/m</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

