// frontend/src/context/RootPulseContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const RootPulseContext = createContext(null);

const API_BASE = process.env.REACT_APP_API_HOST || 'http://localhost:5001';

export const RootPulseProvider = ({ children }) => {
  const [activeZone, setActiveZone] = useState('zone_a');
  const [operatingMode, setOperatingMode] = useState('SIMULATION'); // 'SIMULATION' | 'LIVE'
  const [currentScenario, setCurrentScenario] = useState('scenario_1_optimal');
  const [scenariosList, setScenariosList] = useState([]);
  const [zones, setZones] = useState([]);
  const [latestReadings, setLatestReadings] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch scenarios list
  const fetchScenarios = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/simulation/scenarios`);
      if (res.data.success) {
        setScenariosList(res.data.scenarios);
        if (res.data.currentScenario) setCurrentScenario(res.data.currentScenario);
        if (res.data.operatingMode) setOperatingMode(res.data.operatingMode);
      }
    } catch (e) {
      console.warn('Could not fetch scenarios from API, using defaults');
      setScenariosList([
        { id: 'scenario_1_optimal', name: 'Scenario 1: Optimal Growth', description: 'Balanced moisture across all 3 layers (<1000 kPa compaction).' },
        { id: 'scenario_2_shallow_drought', name: 'Scenario 2: Surface Wet / Deep Drought', description: 'Topsoil saturated, deep roots starved (14% at 30cm).' },
        { id: 'scenario_3_waterlogging', name: 'Scenario 3: Subsurface Waterlogging', description: 'Moisture >90% across all layers; root hypoxia danger.' },
        { id: 'scenario_4_thermal_stress', name: 'Scenario 4: Thermal Root Stress', description: 'Underground temperature exceeds 38°C; root cell shock.' },
        { id: 'scenario_5_compaction_hardpan', name: 'Scenario 5: Plough-Pan Compaction', description: 'Compaction >2800 kPa at 20cm; root penetration blocked.' }
      ]);
    }
  }, []);

  // Fetch all zones summary
  const fetchZones = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/zones`);
      if (res.data.success) {
        setZones(res.data.zones);
      }
    } catch (e) {
      console.warn('Could not fetch zones from API');
    }
  }, []);

  // Fetch latest readings and active alerts
  const fetchLatest = useCallback(async () => {
    try {
      const [readingsRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/sensors/latest`),
        axios.get(`${API_BASE}/api/ai/alerts`)
      ]);

      if (readingsRes.data.success) {
        setLatestReadings(readingsRes.data.zones);
        setOperatingMode(readingsRes.data.operatingMode || 'SIMULATION');
      }
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.alerts);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.warn('Could not fetch sensor data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
    fetchZones();
    fetchLatest();

    const interval = setInterval(() => {
      fetchLatest();
      fetchZones();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchScenarios, fetchZones, fetchLatest]);

  // Switch demo scenario
  const switchScenario = async (scenarioId) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/simulation/scenario`, { scenarioId });
      if (res.data.success) {
        setCurrentScenario(scenarioId);
        setOperatingMode('SIMULATION');
        setLatestReadings(res.data.latestReadings);
        await Promise.all([fetchZones(), fetchLatest()]);
      }
    } catch (e) {
      console.error('Failed to switch scenario:', e);
    } finally {
      setLoading(false);
    }
  };

  // Switch operating mode (LIVE vs SIMULATION)
  const toggleOperatingMode = async () => {
    const nextMode = operatingMode === 'SIMULATION' ? 'LIVE' : 'SIMULATION';
    try {
      const res = await axios.post(`${API_BASE}/api/simulation/mode`, { mode: nextMode });
      if (res.data.success) {
        setOperatingMode(nextMode);
      }
    } catch (e) {
      setOperatingMode(nextMode);
    }
  };

  const currentZoneReadings = latestReadings ? latestReadings[activeZone] || latestReadings.zone_a : null;
  const currentZoneInfo = zones.find(z => z.id === activeZone) || {
    id: 'zone_a',
    name: 'Zone A - North Orchard',
    crop: 'Citrus',
    soilType: 'Sandy Loam',
    healthScore: 88,
    riskLevel: 'GREEN'
  };

  return (
    <RootPulseContext.Provider
      value={{
        activeZone,
        setActiveZone,
        operatingMode,
        toggleOperatingMode,
        currentScenario,
        scenariosList,
        switchScenario,
        zones,
        currentZoneInfo,
        latestReadings,
        currentZoneReadings,
        alerts,
        loading,
        lastUpdated,
        refreshData: () => { fetchZones(); fetchLatest(); },
        apiBase: API_BASE
      }}
    >
      {children}
    </RootPulseContext.Provider>
  );
};

export const useRootPulse = () => useContext(RootPulseContext);
export default RootPulseContext;

