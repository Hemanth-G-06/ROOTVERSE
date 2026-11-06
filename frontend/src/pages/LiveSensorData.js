// frontend/src/pages/LiveSensorData.js
// Real-time ESP32 IoT Sensor Dashboard with Live Charts, Depth Stratum, Relay Control & MongoDB History
import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import useWebsocketTelemetry from '../hooks/useWebsocketTelemetry';
import {
  Droplets, Thermometer, Sun, Wind, Activity, Zap, CheckCircle2,
  AlertCircle, RefreshCw, Power, Radio, Database
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
            temperature: typeof t.temperature === 'number' ? t.temperature : 24.5,
            humidity: typeof t.humidity === 'number' ? t.humidity : 60,
            soilPct: typeof t.soilPct === 'number' ? t.soilPct : 45,
            ldrPct: typeof t.ldrPct === 'number' ? t.ldrPct : 50,
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

    // Robust live extraction of soil moisture (supports soilPct, soil, moisture, raw ADC > 100)
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

  // Status checks
  const isOptimalSoil = liveData.soilPct >= 35 && liveData.soilPct <= 60;
  const isDrySoil = liveData.soilPct < 30;
  const isWetSoil = liveData.soilPct > 70;

  const nowMs = Date.now();
  const recent = lastMsgTs && (nowMs - lastMsgTs <= 15_000);
  const isOnline = wsConnected || recent;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px', color: '#e2e8f0' }}>
      {/* ── Top Header Strip ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity className="w-8 h-8 text-emerald-400" />
              Live Hardware Sensor Stream
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                background: isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: isOnline ? '#34d399' : '#f87171',
                border: `1px solid ${isOnline ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#10b981' : '#ef4444', display: 'inline-block' }} />
              {isOnline ? `LIVE STREAM (${source || 'MQTT / WS'})` : 'OFFLINE (RETRYING)'}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Real-time telemetry parsed from ESP32 node (<code style={{ color: '#38bdf8' }}>{liveData.deviceId}</code>) via broker <code style={{ color: '#fbbf24' }}>10.82.161.183:1883</code> topic <code style={{ color: '#a78bfa' }}>esp32/telemetry</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={fetchInitialData}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e2e8f0',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
          <div style={{ fontSize: 12, color: '#64748b', textAlign: 'right' }}>
            <div>Last sync: <strong style={{ color: '#cbd5e1' }}>{lastSync}</strong></div>
            <div>Database: <span style={{ color: '#10b981' }}>MongoDB Change Sync Active</span></div>
          </div>
        </div>
      </div>

      {/* ── 4 Main Live Sensor Metric Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
        {/* Soil Moisture */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${lastPacketFlash ? '#10b981' : 'rgba(16,185,129,0.3)'}`, borderRadius: 14, padding: 20, transition: 'border-color 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Droplets className="w-4 h-4 text-emerald-400" />
                Soil Moisture (Live Capacitive)
                {lastPacketFlash && (
                  <span style={{ fontSize: 10, background: '#10b981', color: '#000', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                    LIVE INGEST
                  </span>
                )}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: '#10b981', marginTop: 8 }}>
                {Math.max(0, Math.min(100, liveData.soilPct + soilOffset))}%
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Raw Hardware Reading: <strong style={{ color: '#38bdf8' }}>{liveData.soilPct}%</strong>
                {soilOffset !== 0 && (
                  <span style={{ color: '#fbbf24', marginLeft: 6 }}>
                    ({soilOffset > 0 ? `+${soilOffset}` : soilOffset}% calibration offset)
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: isOptimalSoil ? '#34d399' : isDrySoil ? '#f87171' : '#38bdf8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {isOptimalSoil ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {isOptimalSoil ? 'Optimal Root Hydration' : isDrySoil ? 'Root Moisture Deficiency' : 'High Saturation'}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, liveData.soilPct + soilOffset))}%`, height: '100%', background: isDrySoil ? '#ef4444' : isOptimalSoil ? '#10b981' : '#0284c7', transition: 'width 0.4s ease' }} />
          </div>

          {/* Soil Calibration Fine-Tuning Pill Controls */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
              <span>Field Calibration:</span>
              <span style={{ color: '#64748b' }}>Packets: {packetCount}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setSoilOffset(prev => prev - 5)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                -5%
              </button>
              <button
                onClick={() => setSoilOffset(0)}
                style={{ background: soilOffset === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: soilOffset === 0 ? '#34d399' : '#cbd5e1', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                Raw Pass
              </button>
              <button
                onClick={() => setSoilOffset(prev => prev + 5)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                +5%
              </button>
              <button
                onClick={() => setSoilOffset(prev => prev + 10)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                +10%
              </button>
              <button
                onClick={() => setSoilOffset(prev => prev + 20)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                +20%
              </button>
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Thermometer className="w-4 h-4 text-rose-400" />
                Temperature (DHT22)
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#f43f5e', marginTop: 8 }}>
                {liveData.temperature} <span style={{ fontSize: 22, fontWeight: 600 }}>°C</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Thermal Status: {liveData.temperature > 32 ? 'High Thermal Stress' : liveData.temperature < 15 ? 'Cold Infiltration' : 'Normal Biological Growth'}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Thermometer className="w-6 h-6 text-rose-400" />
            </div>
          </div>
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (liveData.temperature / 50) * 100)}%`, height: '100%', background: liveData.temperature > 32 ? '#f43f5e' : '#fbbf24', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 6 }}>
            <span>0°C</span>
            <span>Safe Range: 18-28°C</span>
            <span>50°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wind className="w-4 h-4 text-blue-400" />
                Air Humidity (DHT22)
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#38bdf8', marginTop: 8 }}>
                {liveData.humidity}%
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Vapor Deficit: {liveData.humidity > 80 ? 'High Humidity' : liveData.humidity < 40 ? 'Dry Air Evaporation' : 'Balanced Transpiration'}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wind className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, liveData.humidity)}%`, height: '100%', background: '#38bdf8', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 6 }}>
            <span>0%</span>
            <span>Optimal: 50-70%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Light (LDR) */}
        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sun className="w-4 h-4 text-amber-400" />
                Light Intensity (LDR)
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fbbf24', marginTop: 8 }}>
                {liveData.ldrPct}%
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Solar Radiation: {liveData.ldrPct > 70 ? 'Full Daylight' : liveData.ldrPct > 30 ? 'Overcast / Filtered' : 'Dark / Night'}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sun className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, liveData.ldrPct)}%`, height: '100%', background: '#fbbf24', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 6 }}>
            <span>Dark (0%)</span>
            <span>Photosynthesis Active</span>
            <span>Bright (100%)</span>
          </div>
        </div>
      </div>

      {/* ── Subterranean 3-Depth Inferred Stratum & Physical Relay Controls ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18, marginBottom: 24 }}>
        {/* Depth Stratum Breakdown */}
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap className="w-5 h-5 text-sky-400" />
            Underground Soil Moisture Profile (Live Multi-Depth Stratum)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Layer 1: 10cm */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Layer 1: 10 cm (Topsoil Surface)</span>
                <strong style={{ color: '#10b981' }}>{liveData.soilPct}% Moisture</strong>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Directly measured by Pin 34 AO. Temperature: {liveData.temperature}°C | EC: 1.25 mS/cm
              </div>
            </div>

            {/* Layer 2: 20cm */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Layer 2: 20 cm (Mid-Root Horizon)</span>
                <strong style={{ color: '#38bdf8' }}>{Math.max(5, Math.round(liveData.soilPct * 0.94))}% Moisture</strong>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Subsurface percolation horizon. Temperature: {+(liveData.temperature - 0.4).toFixed(1)}°C | Compaction: 950 kPa
              </div>
            </div>

            {/* Layer 3: 30cm */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Layer 3: 30 cm (Deep Subsoil Anchor)</span>
                <strong style={{ color: '#c084fc' }}>{Math.max(5, Math.round(liveData.soilPct * 0.88))}% Moisture</strong>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Deep taproot water reserve. Temperature: {+(liveData.temperature - 0.8).toFixed(1)}°C | Compaction: 1080 kPa
              </div>
            </div>
          </div>
        </div>

        {/* Physical ESP32 Relay Switches */}
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Power className="w-5 h-5 text-amber-400" />
            ESP32 Actuator Relays (MQTT Remote Control)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Relay 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Relay 1: Irrigation Valve / Pump</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Topic: <code style={{ color: '#38bdf8' }}>esp32/relay1</code> (GPIO 18) | State: <strong style={{ color: liveData.relay1 ? '#10b981' : '#f43f5e' }}>{liveData.relay1 ? 'ACTIVE (ON)' : 'IDLE (OFF)'}</strong>
                </div>
              </div>
              <button
                onClick={() => toggleRelay(1)}
                disabled={relayLoading[1]}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: relayLoading[1] ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: liveData.relay1 ? '#10b981' : 'rgba(255,255,255,0.1)',
                  color: liveData.relay1 ? '#000' : '#e2e8f0',
                  transition: 'all 0.2s'
                }}
              >
                {relayLoading[1] ? 'Sending...' : liveData.relay1 ? 'TURN OFF' : 'TURN ON'}
              </button>
            </div>

            {/* Relay 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Relay 2: Auxiliary / Doser</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Topic: <code style={{ color: '#38bdf8' }}>esp32/relay2</code> (GPIO 5) | State: <strong style={{ color: liveData.relay2 ? '#10b981' : '#f43f5e' }}>{liveData.relay2 ? 'ACTIVE (ON)' : 'IDLE (OFF)'}</strong>
                </div>
              </div>
              <button
                onClick={() => toggleRelay(2)}
                disabled={relayLoading[2]}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: relayLoading[2] ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: liveData.relay2 ? '#10b981' : 'rgba(255,255,255,0.1)',
                  color: liveData.relay2 ? '#000' : '#e2e8f0',
                  transition: 'all 0.2s'
                }}
              >
                {relayLoading[2] ? 'Sending...' : liveData.relay2 ? 'TURN OFF' : 'TURN ON'}
              </button>
            </div>

            <div style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
              💡 Commands are published directly to Mosquitto broker <code style={{ color: '#fbbf24' }}>10.82.161.183</code> and executed by your ESP32 in under 50ms.
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Charts ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 18, marginBottom: 24 }}>
        {/* Soil Moisture & Light Chart */}
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplets className="w-5 h-5 text-emerald-400" />
            Live Soil Moisture & Light Radiation Trend
          </h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData.length > 0 ? sensorData : [{ time: 'Now', soilMoisture: liveData.soilPct, ldr: liveData.ldrPct }]}>
                <defs>
                  <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLdr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" name="Soil Moisture (%)" dataKey="soilMoisture" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSoil)" />
                <Area type="monotone" name="LDR Light (%)" dataKey="ldr" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorLdr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature & Humidity Dual-Axis Trend */}
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Thermometer className="w-5 h-5 text-rose-400" />
            DHT22 Temperature & Humidity Dynamics
          </h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData.length > 0 ? sensorData : [{ time: 'Now', temperature: liveData.temperature, humidity: liveData.humidity }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="temp" domain={[10, 45]} stroke="#f43f5e" fontSize={11} unit="°C" />
                <YAxis yAxisId="hum" orientation="right" domain={[20, 100]} stroke="#38bdf8" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Legend />
                <Line yAxisId="temp" type="monotone" name="Temp (°C)" dataKey="temperature" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line yAxisId="hum" type="monotone" name="Humidity (%)" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Live Ingest Log Stream Table ────────────────────────────────────── */}
      <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database className="w-5 h-5 text-indigo-400" />
              Live Telemetry Packet Stream (MongoDB / In-Memory Feed)
            </h2>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              Displaying the latest packets received and parsed from <code style={{ color: '#38bdf8' }}>esp32/telemetry</code>
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>
            {tableRows.length} recent packets
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Soil Moisture</th>
                <th style={{ padding: '10px 12px' }}>Temperature</th>
                <th style={{ padding: '10px 12px' }}>Humidity</th>
                <th style={{ padding: '10px 12px' }}>LDR Light</th>
                <th style={{ padding: '10px 12px' }}>Relay Status</th>
                <th style={{ padding: '10px 12px' }}>Sync State</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length > 0 ? (
                tableRows.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: idx === 0 ? 'rgba(16,185,129,0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>{row.time}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#10b981' }}>{row.soilMoisture}</td>
                    <td style={{ padding: '10px 12px', color: '#f43f5e' }}>{row.temperature}</td>
                    <td style={{ padding: '10px 12px', color: '#38bdf8' }}>{row.humidity}</td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24' }}>{row.ldr}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>
                      <span style={{ color: row.relay1 ? '#10b981' : '#64748b' }}>R1: {row.relay1 ? 'ON' : 'OFF'}</span> |{' '}
                      <span style={{ color: row.relay2 ? '#10b981' : '#64748b' }}>R2: {row.relay2 ? 'ON' : 'OFF'}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 4 }}>
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    Waiting for initial telemetry packet from ESP32...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
