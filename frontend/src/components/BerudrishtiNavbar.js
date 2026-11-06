// frontend/src/components/BerudrishtiNavbar.js
// Visual Identity: HAXLR8 3.0 Clean Agricultural Design System
// Palette: #FFF9F1 (bg), #159F57 (primary green), #E8F7ED (light green), #F5D8B4 (peach border)
import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Globe2,
  TreeDeciduous
} from 'lucide-react';

export default function BerudrishtiNavbar() {
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/', icon: Activity },
    { name: 'Live Sensors', path: '/sensors', icon: Wifi },
    { name: 'RootSphere', path: '/rootsphere', icon: TreeDeciduous },
    { name: 'RhizoAI Engine', path: '/intelligence', icon: Sparkles },
    { name: 'RootPulse 3D', path: '/digital-twin', icon: Layers },
    { name: 'RootVision AI', path: '/rootvision', icon: Compass },
    { name: 'AquaRoot Water', path: '/irrigation', icon: Droplets },
    { name: 'RootNet Zones', path: '/zones', icon: Cpu },
    { name: 'SoilGuard Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Farmer Assistant', path: '/assistant', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  // Mobile Bottom Bar items (inspired by HAXLR8 mobile layout)
  const mobileBottomItems = [
    { name: 'Overview', path: '/', icon: Activity },
    { name: 'Sensors', path: '/sensors', icon: Wifi },
    { name: 'RootSphere', path: '/rootsphere', icon: TreeDeciduous },
    { name: '3D Twin', path: '/digital-twin', icon: Layers },
    { name: 'Assistant', path: '/assistant', icon: Bot },
  ];

  const activeAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH_RISK').length;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#F5D8B4] shadow-sm">
      {/* ── Top Notification & Telemetry Status Bar ────────────────────────── */}
      <div className="bg-[#FFF0DB] border-b border-[#F5D8B4] px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-3 text-[#172033]">
        <div className="flex items-center gap-2">
          {/* Live vs Sim Mode Toggle */}
          <button
            onClick={toggleOperatingMode}
            className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition-all text-[11px] shadow-sm ${
              operatingMode === 'LIVE'
                ? 'bg-[#159F57] text-white animate-pulse'
                : 'bg-white text-[#E9A23B] border border-[#E9A23B]'
            }`}
            title="Click to toggle between Live Hardware and Simulation"
          >
            {operatingMode === 'LIVE' ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>● LIVE HARDWARE FEED</span>
              </>
            ) : (
              <>
                <Radio className="w-3 h-3 text-[#E9A23B]" />
                <span>SIMULATION MODE</span>
              </>
            )}
          </button>

          <span className="text-[#98A2B3] hidden sm:inline">|</span>

          {/* Active Field Zone Selector */}
          <div className="hidden sm:flex items-center gap-1.5 text-[#667085]">
            <span>Zone:</span>
            <select
              value={activeZone}
              onChange={(e) => setActiveZone(e.target.value)}
              className="bg-white border border-[#F5D8B4] rounded-lg px-2 py-0.5 text-xs font-semibold text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#159F57]"
            >
              {zones && zones.length > 0 ? (
                zones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.crop})
                  </option>
                ))
              ) : (
                <>
                  <option value="zone_a">Zone A — North Orchard (ಕಿತ್ತಳೆ)</option>
                  <option value="zone_b">Zone B — Central Plots (ಮೆಕ್ಕೆಜೋಳ)</option>
                  <option value="zone_c">Zone C — Nursery Polyhouse (ಟೊಮೆಟೊ)</option>
                  <option value="zone_d">Zone D — East Plot (ದ್ವಿದಳ ಧಾನ್ಯ)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Right side: Scenario Switcher in Simulation Mode */}
        <div className="flex items-center gap-3">
          {operatingMode === 'SIMULATION' && scenariosList && scenariosList.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[#667085] hidden md:inline">Demo Scenario:</span>
              <select
                value={currentScenario}
                onChange={(e) => switchScenario(e.target.value)}
                className="bg-white border border-[#F5D8B4] rounded-lg px-2 py-0.5 text-xs font-medium text-[#172033] focus:outline-none"
              >
                {scenariosList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeAlertsCount > 0 && (
            <Link
              to="/intelligence"
              className="bg-[#DC4545] text-white px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <span>{activeAlertsCount} Stress Alerts</span>
            </Link>
          )}

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#126B3B] font-semibold bg-[#E8F7ED] px-2 py-0.5 rounded-full border border-[#159F57]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#159F57]" />
            <span>Underground Protection Active</span>
          </div>
        </div>
      </div>

      {/* ── Main Branding & Desktop Navigation ────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Dual-Language Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#159F57] to-[#126B3B] flex items-center justify-center text-white shadow-md shadow-[#159F57]/20 transition-transform group-hover:scale-105">
              <TreeDeciduous className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#126B3B] tracking-tight">
                  ಬೇರುದೃಷ್ಟಿ
                </span>
                <span className="text-lg font-bold text-[#172033] tracking-wide">
                  BERUDRISHTI
                </span>
              </div>
              <p className="text-[10px] font-semibold text-[#078DC1] uppercase tracking-wider -mt-0.5">
                AI-Powered Underground Soil Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#E8F7ED] text-[#126B3B] border border-[#159F57]/40 shadow-sm'
                      : 'text-[#667085] hover:text-[#172033] hover:bg-[#FFF0DB]/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#159F57]' : 'text-[#98A2B3]'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Hamburger Button for Mobile/Tablet */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#172033] hover:bg-[#FFF0DB] border border-[#F5D8B4] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ───────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-[#F5D8B4] px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="text-[11px] font-bold text-[#98A2B3] uppercase px-3 py-1">
            BERUDRISHTI Modules
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#E8F7ED] text-[#126B3B] border border-[#159F57]/40'
                      : 'text-[#667085] hover:bg-[#FFF0DB]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#159F57]' : 'text-[#98A2B3]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (HAXLR8 3.0 Reference) ─────────────── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#F5D8B4] px-2 py-1 shadow-2xl flex justify-around items-center">
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#159F57] font-bold'
                  : 'text-[#667085] font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-[#E8F7ED]' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#159F57]' : 'text-[#98A2B3]'}`} />
              </div>
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col items-center justify-center py-1 px-3 text-[#667085] font-medium"
        >
          <div className="p-1">
            <Menu className="w-5 h-5 text-[#98A2B3]" />
          </div>
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </div>
    </header>
  );
}

