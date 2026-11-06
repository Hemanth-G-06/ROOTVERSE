import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ── Original ag360 pages (preserved) ──────────────────────────────────────
import Home from './pages/Home';
import IrrigationControl from './pages/IrrigationControl';
import LiveSensorData from './pages/LiveSensorData';
import DiseaseDetection from './pages/DiseaseDetection';
import PlantInfo from './pages/PlantInfo';
import MyFarm from './pages/MyFarm';
import VoiceAssistant from './pages/VoiceAssistant';
import Settings from './pages/Settings';
import About from './pages/About';

// ── BERUDRISHTI (ಬೇರುದೃಷ್ಟಿ) Core Modules ──────────────────────────────────
import RootPulseDashboard from './pages/RootPulseDashboard';
import RootSpherePage from './pages/RootSpherePage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import RootVisionPage from './pages/RootVisionPage';
import SoilIntelligencePage from './pages/SoilIntelligencePage';
import AquaRootPage from './pages/AquaRootPage';
import RootNetZonesPage from './pages/RootNetZonesPage';
import SoilGuardAnalyticsPage from './pages/SoilGuardAnalyticsPage';
import AIAssistantPage from './pages/AIAssistantPage';

// ── BERUDRISHTI Context & Navbar ──────────────────────────────────────────
import { RootPulseProvider } from './context/RootPulseContext';
import BerudrishtiNavbar from './components/BerudrishtiNavbar';

import './App.css';

function App() {
  return (
    <RootPulseProvider>
      <Router>
        <div className="App" style={{ minHeight: '100vh', backgroundColor: '#FFF9F1', color: '#172033' }}>
          <BerudrishtiNavbar />
          <main>
            <Routes>
              {/* ── BERUDRISHTI (primary routes) ── */}
              <Route path="/" element={<RootPulseDashboard />} />
              <Route path="/rootsphere" element={<RootSpherePage />} />
              <Route path="/sensors" element={<LiveSensorData />} />
              <Route path="/digital-twin" element={<DigitalTwinPage />} />
              <Route path="/rootvision" element={<RootVisionPage />} />
              <Route path="/intelligence" element={<SoilIntelligencePage />} />
              <Route path="/irrigation" element={<AquaRootPage />} />
              <Route path="/zones" element={<RootNetZonesPage />} />
              <Route path="/analytics" element={<SoilGuardAnalyticsPage />} />
              <Route path="/assistant" element={<AIAssistantPage />} />

              {/* ── Original ag360 routes (strictly preserved) ── */}
              <Route path="/home-legacy" element={<Home />} />
              <Route path="/disease" element={<DiseaseDetection />} />
              <Route path="/plant" element={<PlantInfo />} />
              <Route path="/farm" element={<MyFarm />} />
              <Route path="/voice" element={<VoiceAssistant />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
        </div>
      </Router>
    </RootPulseProvider>
  );
}

export default App;
