// frontend/src/components/RootPulseNavbar.js
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useRootPulse } from '../context/RootPulseContext';
import {
  Layers,
  Compass,
  Cpu,
  Droplets,
  Activity,
  Bot,
  Settings,
  Sparkles,
  Wifi,
  Radio,
  BarChart3,
  Flame,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function RootPulseNavbar() {
  const {
    operatingMode,
    toggleOperatingMode,
    currentScenario,
    scenariosList,
    switchScenario,
    activeZone,
    setActiveZone,
    zones,
    alerts
  } = useRootPulse();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Live Sensors', path: '/sensors', icon: Wifi },
    { name: '3D Digital Twin', path: '/digital-twin', icon: Layers },
    { name: 'RootVision AI', path: '/rootvision', icon: Compass },
    { name: 'Soil Intelligence', path: '/intelligence', icon: Sparkles },
    { name: 'Field Zones', path: '/zones', icon: Cpu },
    { name: 'Predictive Irrigation', path: '/irrigation', icon: Droplets },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH_RISK').length;

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-xl border-b border-emerald-900/40 shadow-xl">
      {/* 1. Global Simulation & Live Telemetry Strip */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-900/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Badge */}
        <div className="flex items-center gap-2">
          <div
            onClick={toggleOperatingMode}
            className={`cursor-pointer px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              operatingMode === 'LIVE'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
            }`}
          >
            {operatingMode === 'LIVE' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>LIVE HARDWARE MODE</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>DEMO DATA (SIMULATION MODE)</span>
              </>
            )}
          </div>

          <span className="text-slate-400 hidden sm:inline">
            | Active Zone:
          </span>

          <select
            value={activeZone}
            onChange={(e) => setActiveZone(e.target.value)}
            className="bg-slate-900 text-emerald-400 font-semibold border border-emerald-800/60 rounded-md px-2 py-0.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.crop})
              </option>
            ))}
          </select>
        </div>

        {/* Right: Quick Scenario Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium hidden md:inline">
            Interactive Scenario:
          </span>
          <select
            value={currentScenario}
            onChange={(e) => switchScenario(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-emerald-700/50 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium max-w-[280px] sm:max-w-none"
          >
            {scenariosList.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white font-mono">
                  ROOTPULSE<span className="text-emerald-400"> 3D</span>
                </span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-emerald-400/80 tracking-wide uppercase">
                See Beneath the Soil. Predict Before the Problem.
              </p>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Alert Bell Badge */}
          <div className="flex items-center gap-3">
            {criticalAlertsCount > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{criticalAlertsCount} Stress Alerts</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Healthy Subsoil</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

