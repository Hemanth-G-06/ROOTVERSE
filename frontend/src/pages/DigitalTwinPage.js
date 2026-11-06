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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#F5D8B4] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F7ED] text-[#159F57] border border-[#159F57]/30">
              MODULE 3: 3D SUBTERRANEAN DIGITAL TWIN
            </span>
            <span className="text-xs text-[#6B7280] font-mono">
              Plot: {currentZoneInfo.name}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF0DB] text-[#C26100]">
              ಬೇರುದೃಷ್ಟಿ 3D
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-1">
            Volumetric Underground Soil & Root Architecture
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
            Simulate and visualize moisture infiltration, subterranean thermal conduction, and soil compaction barriers at 10cm, 20cm, and 30cm depths in real time.
          </p>
        </div>
      </div>

      {/* Main 3D Canvas Box */}
      <div className="rounded-2xl border border-[#F5D8B4] bg-[#0d1814] overflow-hidden shadow-sm">
        <UndergroundDigitalTwin3D
          digitalTwinData={digitalTwinPayload}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayer}
          activeMode={twinViewMode}
          onChangeMode={setTwinViewMode}
        />
      </div>

      {/* Layer Depth Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Layer 1 */}
        <div className={`p-5 rounded-2xl border transition-all ${selectedLayer === '10cm' ? 'bg-[#E8F7ED] border-[#159F57] shadow-md' : 'bg-white border-[#F5D8B4] shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#159F57] uppercase tracking-wider">Horizon A (0 - 10 cm)</span>
            <span className="text-xs bg-[#FFF0DB] text-[#C26100] px-2 py-0.5 rounded-full font-medium">Topsoil</span>
          </div>
          <h3 className="text-lg font-bold text-[#172033] mt-1">Organic Feeder Zone</h3>
          <p className="text-xs text-[#6B7280] mt-1">
            High biological activity, fine capillary root clusters, initial rainfall and irrigation absorption surface.
          </p>
          <div className="mt-4 pt-3 border-t border-[#F5D8B4]/60 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Moisture:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_10cm.moisture}% VWC</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Subsurface Temp:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_10cm.temp}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Soil Compaction:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_10cm.compaction} kPa</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Salinity EC:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_10cm.ec} dS/m</strong>
            </div>
          </div>
        </div>

        {/* Layer 2 */}
        <div className={`p-5 rounded-2xl border transition-all ${selectedLayer === '20cm' ? 'bg-[#E8F7ED] border-[#159F57] shadow-md' : 'bg-white border-[#F5D8B4] shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#078DC1] uppercase tracking-wider">Horizon B1 (10 - 20 cm)</span>
            <span className="text-xs bg-[#DDF3FA] text-[#078DC1] px-2 py-0.5 rounded-full font-medium">Mid Root</span>
          </div>
          <h3 className="text-lg font-bold text-[#172033] mt-1">Primary Lateral Root Zone</h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Major structural root branching, prime location for plough-pan compaction barriers and perched water tables.
          </p>
          <div className="mt-4 pt-3 border-t border-[#F5D8B4]/60 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Moisture:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_20cm.moisture}% VWC</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Subsurface Temp:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_20cm.temp}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Soil Compaction:</span>
              <strong className={`font-mono ${readings.layer_20cm.compaction > 2000 ? 'text-rose-600 font-bold' : 'text-[#172033]'}`}>
                {readings.layer_20cm.compaction} kPa
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Salinity EC:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_20cm.ec} dS/m</strong>
            </div>
          </div>
        </div>

        {/* Layer 3 */}
        <div className={`p-5 rounded-2xl border transition-all ${selectedLayer === '30cm' ? 'bg-[#E8F7ED] border-[#159F57] shadow-md' : 'bg-white border-[#F5D8B4] shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#126B3B] uppercase tracking-wider">Horizon B2 (20 - 30 cm)</span>
            <span className="text-xs bg-[#E8F7ED] text-[#126B3B] px-2 py-0.5 rounded-full font-medium">Subsoil</span>
          </div>
          <h3 className="text-lg font-bold text-[#172033] mt-1">Deep Taproot Reservoir</h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Thermal buffer layer and ultimate drought resilience anchor; critical indicator of deep soil moisture drought.
          </p>
          <div className="mt-4 pt-3 border-t border-[#F5D8B4]/60 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Moisture:</span>
              <strong className={`font-mono ${readings.layer_30cm.moisture < 20 ? 'text-rose-600 font-bold' : 'text-[#172033]'}`}>
                {readings.layer_30cm.moisture}% VWC
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Subsurface Temp:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_30cm.temp}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Soil Compaction:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_30cm.compaction} kPa</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Salinity EC:</span>
              <strong className="text-[#172033] font-mono">{readings.layer_30cm.ec} dS/m</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
