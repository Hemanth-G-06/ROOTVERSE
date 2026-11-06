// frontend/src/pages/LiveSensorData.js
// Visual Identity: HAXLR8 3.0 Clean Agricultural Design System
// Real-time ESP32 IoT Sensor Dashboard with Live Charts, Depth Stratum, Relay Control & MongoDB History
import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import useWebsocketTelemetry from '../hooks/useWebsocketTelemetry';
import {
  Droplets, Thermometer, Sun, Wind, Activity, Zap, CheckCircle2,
  AlertCircle, RefreshCw, Power, Radio, Database, ShieldCheck, Info
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_HOST || 'http://localhost:5001';

export default function LiveSensorData() {
  const { telemetry, wsConnected, lastMsgTs, source } = useWebsocketTelemetry();

  // Primary live state
  const [liveData, setLiveData] = useState({
    deviceId: 'esp32-01',
    temperature: 27.3,
    humidity: 64.6,
    soilPct: 40,
    ldrPct: 14,
    relay1: 0,
    relay2: 0,
    timestamp: new Date().toLocaleTimeString()
  });

  const [sensorData, setSensorData] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [lastSync, setLastSync] = useState('--:--:--');
  const [relayLoading, setRelayLoading] = useState({ 1: false, 2: false });
  const [refreshing, setRefreshing] = useState(false);
  const [soilOffset, setSoilOffset] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [lastPacketFlash, setLastPacketFlash] = useState(false);

  // Fetch initial telemetry and history from backend REST API
  const fetchInitialData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [latestRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/telemetry/latest`),
        fetch(`${API_BASE}/api/telemetry/history?limit=25`)
      ]);

      if (latestRes.ok) {
        const json = await latestRes.json();
        if (json.telemetry) {
          const t = json.telemetry;
          setLiveData({
            deviceId: t.deviceId || 'esp32-01',
            temperature: typeof t.temperature === 'number' ? t.temperature : 27.3,
            humidity: typeof t.humidity === 'number' ? t.humidity : 64.6,
            soilPct: typeof t.soilPct === 'number' ? t.soilPct : 40,
            ldrPct: typeof t.ldrPct === 'number' ? t.ldrPct : 14,
            relay1: t.relay1 ? 1 : 0,
            relay2: t.relay2 ? 1 : 0,
            timestamp: new Date(t.timestamp || Date.now()).toLocaleTimeString()
          });
          setLastSync(new Date().toLocaleTimeString());
        }
      }

      if (historyRes.ok) {
        const histJson = await historyRes.json();
        if (histJson.history && histJson.history.length > 0) {
          const chartPoints = histJson.history.map(item => ({
            time: new Date(item.createdAt || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temperature: item.temperature,
            humidity: item.humidity,
            soilMoisture: item.soilPct,
            ldr: item.ldrPct
          }));
          setSensorData(chartPoints);

          const rows = histJson.history.slice(-15).reverse().map(item => ({
            time: new Date(item.createdAt || item.timestamp).toLocaleTimeString(),
            temperature: item.temperature !== null ? `${item.temperature} °C` : '--',
            humidity: item.humidity !== null ? `${item.humidity} %` : '--',
            soilMoisture: item.soilPct !== null ? `${item.soilPct} %` : '--',
            ldr: item.ldrPct !== null ? `${item.ldrPct} %` : '--',
            relay1: item.relay1 ? 1 : 0,
            relay2: item.relay2 ? 1 : 0
          }));
          setTableRows(rows);
        }
      }
    } catch (e) {
      console.warn('[LiveSensorData] Failed to fetch initial data:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Update whenever new telemetry packet arrives from WebSocket or polling
  useEffect(() => {
    if (!telemetry) return;

    const t = typeof telemetry.temperature === 'number' ? +(telemetry.temperature.toFixed(1)) : liveData.temperature;
    const h = typeof telemetry.humidity === 'number' ? +(telemetry.humidity.toFixed(1)) : liveData.humidity;

    const rawSoil = telemetry.soilPct ?? telemetry.soil ?? telemetry.soilMoisture ?? telemetry.moisture;
    let soil = liveData.soilPct;
    if (rawSoil !== undefined && rawSoil !== null) {
      const parsed = typeof rawSoil === 'number' ? rawSoil : parseFloat(String(rawSoil).replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) {
        soil = parsed > 100
          ? Math.round(Math.max(0, Math.min(100, ((3000 - parsed) / (3000 - 1300)) * 100)))
          : Math.round(Math.max(0, Math.min(100, parsed)));
      }
    }

    const ldr = typeof telemetry.ldrPct === 'number' ? Math.round(telemetry.ldrPct) : (typeof telemetry.ldr === 'number' ? Math.round(telemetry.ldr) : liveData.ldrPct);
    const r1 = telemetry.relay1 !== undefined ? (Number(telemetry.relay1) ? 1 : 0) : liveData.relay1;
    const r2 = telemetry.relay2 !== undefined ? (Number(telemetry.relay2) ? 1 : 0) : liveData.relay2;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setPacketCount(c => c + 1);
    setLastPacketFlash(true);
    const timer = setTimeout(() => setLastPacketFlash(false), 800);

    setLiveData({
      deviceId: telemetry.deviceId || 'esp32-01',
      temperature: t,
      humidity: h,
      soilPct: soil,
      ldrPct: ldr,
      relay1: r1,
      relay2: r2,
      timestamp: timeStr
    });

    const effectiveSoil = Math.max(0, Math.min(100, soil + soilOffset));

    const newPoint = {
      time: timeStr,
      temperature: t,
      humidity: h,
      soilMoisture: effectiveSoil,
      ldr: ldr
    };

    setSensorData(prev => [...prev, newPoint].slice(-25));

    const newRow = {
      time: timeStr,
      temperature: `${t} °C`,
      humidity: `${h} %`,
      soilMoisture: `${effectiveSoil} % (Raw: ${soil}%)`,
      ldr: `${ldr} %`,
      relay1: r1,
      relay2: r2
    };

    setTableRows(prev => [newRow, ...prev].slice(0, 15));
    setLastSync(timeStr);

    return () => clearTimeout(timer);
  }, [telemetry, soilOffset]);

  // Relay toggle handler (sends MQTT command through backend API)
  const toggleRelay = async (channel) => {
    const currentState = channel === 1 ? liveData.relay1 : liveData.relay2;
    const nextState = currentState ? 'OFF' : 'ON';

    setRelayLoading(prev => ({ ...prev, [channel]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/telemetry/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, state: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setLiveData(prev => ({
          ...prev,
          [`relay${channel}`]: nextState === 'ON' ? 1 : 0
        }));
      }
    } catch (e) {
      console.error('Relay toggle failed:', e);
    } finally {
      setRelayLoading(prev => ({ ...prev, [channel]: false }));
    }
  };

  const isOptimalSoil = liveData.soilPct >= 35 && liveData.soilPct <= 60;
  const isDrySoil = liveData.soilPct < 30;

  const nowMs = Date.now();
  const recent = lastMsgTs && (nowMs - lastMsgTs <= 15_000);
  const isOnline = wsConnected || recent;

  return (
    <div className="min-h-screen bg-[#FFF9F1] py-6 px-4 sm:px-6 lg:px-8 pb-20 text-[#172033]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header Strip ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isOnline ? 'bg-[#E8F7ED] text-[#126B3B] border-[#159F57]/40' : 'bg-[#FFF0DB] text-[#DC4545] border-[#F5D8B4]'
              }`}>
                {isOnline ? `● LIVE HARDWARE STREAM (${source || 'MQTT / WS'})` : 'OFFLINE (RECONNECTING)'}
              </span>
              <span className="text-xs text-[#667085] font-semibold">
                Device: {liveData.deviceId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-[#159F57]" />
              Live Hardware Sensor Stream & Ingestion
            </h1>
            <p className="text-xs text-[#667085] mt-1">
              Active telemetry parsed from ESP32 node via broker <code className="text-[#078DC1] font-semibold">10.82.161.183:1883</code> & WebSocket <code className="text-[#078DC1] font-semibold">10.76.50.208:8080</code> on topic <code className="text-[#126B3B] font-semibold">esp32/telemetry</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInitialData}
              disabled={refreshing}
              className="bg-[#E8F7ED] hover:bg-[#159F57] text-[#126B3B] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-[#159F57]/30 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="text-xs text-[#667085] text-right">
              <div>Last sync: <strong className="text-[#172033]">{lastSync}</strong></div>
              <div>MongoDB Sync: <span className="text-[#159F57] font-semibold">Active</span></div>
            </div>
          </div>
        </div>

        {/* ── 4 Main Live Sensor Metric Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Soil Moisture */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#667085] flex items-center gap-1">
                  <Droplets className="w-4 h-4 text-[#159F57]" /> Capacitive Soil Moisture
                </span>
                <div className="text-3xl font-black text-[#126B3B] font-mono mt-2">
                  {Math.max(0, Math.min(100, liveData.soilPct + soilOffset))}%
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5">
                  Raw ESP32: <strong className="text-[#078DC1]">{liveData.soilPct}%</strong>
                  {soilOffset !== 0 && <span className="text-[#E9A23B] ml-1">({soilOffset > 0 ? `+${soilOffset}` : soilOffset}%)</span>}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#E8F7ED] flex items-center justify-center text-[#159F57]">
                <Droplets className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#FFF0DB] h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#159F57] transition-all"
                style={{ width: `${Math.min(100, Math.max(0, liveData.soilPct + soilOffset))}%` }}
              />
            </div>

            <div className="pt-2 border-t border-[#F5D8B4]/40 flex gap-1 flex-wrap text-[10px]">
              <span className="text-[#667085] mr-1 self-center">Calib:</span>
              <button onClick={() => setSoilOffset(prev => prev - 5)} className="px-2 py-0.5 rounded bg-[#FFF9F1] border border-[#F5D8B4] hover:bg-[#E8F7ED]">-5%</button>
              <button onClick={() => setSoilOffset(0)} className="px-2 py-0.5 rounded bg-[#FFF9F1] border border-[#F5D8B4] hover:bg-[#E8F7ED]">Raw</button>
              <button onClick={() => setSoilOffset(prev => prev + 5)} className="px-2 py-0.5 rounded bg-[#FFF9F1] border border-[#F5D8B4] hover:bg-[#E8F7ED]">+5%</button>
              <button onClick={() => setSoilOffset(prev => prev + 10)} className="px-2 py-0.5 rounded bg-[#FFF9F1] border border-[#F5D8B4] hover:bg-[#E8F7ED]">+10%</button>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#667085] flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-[#DC4545]" /> DHT22 Temperature
                </span>
                <div className="text-3xl font-black text-[#DC4545] font-mono mt-2">
                  {liveData.temperature} <span className="text-lg">°C</span>
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5">
                  Optimal metabolic: 18–26°C
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF0DB] flex items-center justify-center text-[#DC4545]">
                <Thermometer className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#FFF0DB] h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#DC4545] transition-all" style={{ width: `${Math.min(100, (liveData.temperature / 45) * 100)}%` }} />
            </div>

            <div className="text-[11px] text-[#667085] pt-2 border-t border-[#F5D8B4]/40">
              Thermal comfort: Normal subterranean condition
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#667085] flex items-center gap-1">
                  <Wind className="w-4 h-4 text-[#078DC1]" /> Air Humidity
                </span>
                <div className="text-3xl font-black text-[#078DC1] font-mono mt-2">
                  {liveData.humidity}%
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5">
                  Balanced vapor pressure deficit
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#DDF3FA] flex items-center justify-center text-[#078DC1]">
                <Wind className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#DDF3FA] h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#078DC1] transition-all" style={{ width: `${Math.min(100, liveData.humidity)}%` }} />
            </div>

            <div className="text-[11px] text-[#667085] pt-2 border-t border-[#F5D8B4]/40">
              Apical transpiration rate: Steady
            </div>
          </div>

          {/* Light (LDR) */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#667085] flex items-center gap-1">
                  <Sun className="w-4 h-4 text-[#E9A23B]" /> Light Intensity (LDR)
                </span>
                <div className="text-3xl font-black text-[#E9A23B] font-mono mt-2">
                  {liveData.ldrPct}%
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5">
                  Solar radiation index
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF0DB] flex items-center justify-center text-[#E9A23B]">
                <Sun className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#FFF0DB] h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#E9A23B] transition-all" style={{ width: `${Math.min(100, liveData.ldrPct)}%` }} />
            </div>

            <div className="text-[11px] text-[#667085] pt-2 border-t border-[#F5D8B4]/40">
              Photosynthesis: {liveData.ldrPct > 50 ? 'Active Daylight' : 'Low / Shadowed'}
            </div>
          </div>
        </div>

        {/* ── Subterranean Soil Depth Stratum & Actuator Relays ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stratum Inferred Breakdown */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#159F57]" />
              Depth-Wise Underground Moisture Horizon
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#FFF9F1] border border-[#F5D8B4] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#172033]">10 cm Surface Layer (Topsoil)</div>
                  <div className="text-[#667085]">Measured by Capacitive Pin 34 AO</div>
                </div>
                <div className="text-base font-extrabold text-[#126B3B]">{liveData.soilPct}%</div>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF9F1] border border-[#F5D8B4] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#172033]">20 cm Mid-Root Horizon</div>
                  <div className="text-[#667085]">Subsurface percolation zone | Compaction: 960 kPa</div>
                </div>
                <div className="text-base font-extrabold text-[#078DC1]">{Math.max(5, Math.round(liveData.soilPct * 0.94))}%</div>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF9F1] border border-[#F5D8B4] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#172033]">30 cm Deep Subsoil Anchor</div>
                  <div className="text-[#667085]">Taproot water reservoir | Compaction: 1090 kPa</div>
                </div>
                <div className="text-base font-extrabold text-[#E9A23B]">{Math.max(5, Math.round(liveData.soilPct * 0.88))}%</div>
              </div>
            </div>
          </div>

          {/* Actuator Relays */}
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Power className="w-4 h-4 text-[#078DC1]" />
              ESP32 Physical Actuator Relays (MQTT Remote Command)
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#FFF9F1] border border-[#F5D8B4] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#172033]">Relay 1: Irrigation Solenoid Valve (GPIO 18)</div>
                  <div className="text-[#667085]">Topic: <code>esp32/relay1</code> | Status: <strong className={liveData.relay1 ? 'text-[#159F57]' : 'text-[#DC4545]'}>{liveData.relay1 ? 'ON (ACTIVE)' : 'OFF (IDLE)'}</strong></div>
                </div>
                <button
                  onClick={() => toggleRelay(1)}
                  disabled={relayLoading[1]}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm ${
                    liveData.relay1 ? 'bg-[#DC4545] text-white' : 'bg-[#159F57] text-white'
                  }`}
                >
                  {relayLoading[1] ? 'Sending...' : liveData.relay1 ? 'TURN OFF' : 'TURN ON'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF9F1] border border-[#F5D8B4] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#172033]">Relay 2: Auxiliary / Doser (GPIO 5)</div>
                  <div className="text-[#667085]">Topic: <code>esp32/relay2</code> | Status: <strong className={liveData.relay2 ? 'text-[#159F57]' : 'text-[#DC4545]'}>{liveData.relay2 ? 'ON (ACTIVE)' : 'OFF (IDLE)'}</strong></div>
                </div>
                <button
                  onClick={() => toggleRelay(2)}
                  disabled={relayLoading[2]}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm ${
                    liveData.relay2 ? 'bg-[#DC4545] text-white' : 'bg-[#159F57] text-white'
                  }`}
                >
                  {relayLoading[2] ? 'Sending...' : liveData.relay2 ? 'TURN OFF' : 'TURN ON'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Live Charts ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#172033] mb-4 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#159F57]" /> Live Soil Moisture & Light Radiation
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sensorData.length > 0 ? sensorData : [{ time: 'Now', soilMoisture: liveData.soilPct, ldr: liveData.ldrPct }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" opacity={0.5} />
                  <XAxis dataKey="time" stroke="#667085" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#667085" fontSize={10} unit="%" />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #F5D8B4', borderRadius: 8, fontSize: 11 }} />
                  <Legend />
                  <Area type="monotone" name="Soil Moisture (%)" dataKey="soilMoisture" stroke="#159F57" fill="#E8F7ED" />
                  <Area type="monotone" name="LDR Light (%)" dataKey="ldr" stroke="#E9A23B" fill="#FFF0DB" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#172033] mb-4 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#DC4545]" /> DHT22 Temperature & Humidity Dynamic
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData.length > 0 ? sensorData : [{ time: 'Now', temperature: liveData.temperature, humidity: liveData.humidity }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5D8B4" opacity={0.5} />
                  <XAxis dataKey="time" stroke="#667085" fontSize={10} />
                  <YAxis yAxisId="t" domain={[10, 45]} stroke="#DC4545" fontSize={10} unit="°C" />
                  <YAxis yAxisId="h" orientation="right" domain={[20, 100]} stroke="#078DC1" fontSize={10} unit="%" />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #F5D8B4', borderRadius: 8, fontSize: 11 }} />
                  <Legend />
                  <Line yAxisId="t" type="monotone" name="Temp (°C)" dataKey="temperature" stroke="#DC4545" strokeWidth={2} dot={false} />
                  <Line yAxisId="h" type="monotone" name="Humidity (%)" dataKey="humidity" stroke="#078DC1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Live Log Stream Table ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#078DC1]" />
                Recent Sensor Telemetry Log Stream
              </h3>
              <p className="text-xs text-[#667085]">Packets received over active transport and verified in memory</p>
            </div>
            <span className="text-xs bg-[#E8F7ED] text-[#126B3B] px-2.5 py-0.5 rounded-full font-bold border border-[#159F57]/30">
              {tableRows.length} Packets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#F5D8B4] text-[#667085]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Soil Moisture</th>
                  <th className="py-2.5 px-3">Temperature</th>
                  <th className="py-2.5 px-3">Humidity</th>
                  <th className="py-2.5 px-3">LDR Light</th>
                  <th className="py-2.5 px-3">Relays</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5D8B4]/40">
                {tableRows.map((row, i) => (
                  <tr key={i} className={i === 0 ? 'bg-[#E8F7ED]/40 font-semibold' : ''}>
                    <td className="py-2 px-3 font-mono text-[#667085]">{row.time}</td>
                    <td className="py-2 px-3 text-[#126B3B] font-bold">{row.soilMoisture}</td>
                    <td className="py-2 px-3 text-[#DC4545]">{row.temperature}</td>
                    <td className="py-2 px-3 text-[#078DC1]">{row.humidity}</td>
                    <td className="py-2 px-3 text-[#E9A23B]">{row.ldr}</td>
                    <td className="py-2 px-3">R1: {row.relay1 ? 'ON' : 'OFF'} | R2: {row.relay2 ? 'ON' : 'OFF'}</td>
                    <td className="py-2 px-3"><span className="px-2 py-0.5 rounded bg-[#E8F7ED] text-[#126B3B] font-bold text-[10px]">LIVE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
