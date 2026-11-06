// frontend/src/pages/AIAssistantPage.js
// RootPulse AI Farmer Assistant — Explainable AI conversational interface
import React, { useState, useRef, useEffect, useContext } from 'react';
import { RootPulseContext } from '../context/RootPulseContext';

const API_BASE = process.env.REACT_APP_API_HOST || 'http://localhost:5001';

const SUGGESTED_QUESTIONS = [
  'Why is my deep root zone dry?',
  'Which soil layer needs attention right now?',
  'Is my moisture distribution balanced across all layers?',
  'Why is Zone B showing a warning?',
  'Should I irrigate today?',
  'How has soil health changed this week?',
  'What is causing high compaction risk?',
  'Which zone is most critical right now?',
];

const RISK_COLORS = {
  GREEN: '#10b981',
  YELLOW: '#f59e0b',
  ORANGE: '#f97316',
  RED: '#ef4444',
};

function EvidenceCard({ evidence }) {
  const [expanded, setExpanded] = useState(false);
  if (!evidence) return null;
  return (
    <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 14px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, paddingLeft: 0 }}
      >
        {expanded ? '▼' : '▶'} Show Sensor Evidence & Analysis
      </button>
      {expanded && (
        <div style={{ marginTop: 10, fontSize: 13, color: '#cbd5e1' }}>
          {evidence.detectedConditions && evidence.detectedConditions.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#e2e8f0' }}>Detected Conditions:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {evidence.detectedConditions.map((c, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: RISK_COLORS[c.risk] || '#e2e8f0', fontWeight: 600 }}>[{c.risk}]</span>{' '}
                    {c.condition}: {c.message}
                    {c.sensorEvidence && (
                      <span style={{ color: '#94a3b8', fontSize: 11 }}> — {c.sensorEvidence}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evidence.layerSummary && (
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#e2e8f0' }}>Layer Summary:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {Object.entries(evidence.layerSummary).map(([layer, info]) => (
                  <li key={layer} style={{ marginBottom: 3 }}>
                    <span style={{ color: '#7dd3fc' }}>{layer.replace('_', ' ').toUpperCase()}</span>:{' '}
                    Moisture {info.moisture}% | Temp {info.temp}°C | Compaction {info.compaction} kPa
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 18,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
          background: isUser ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.2)',
          border: isUser ? '1px solid #6366f1' : '1px solid #10b981',
        }}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '75%',
          background: isUser ? 'rgba(99,102,241,0.15)' : 'rgba(15,23,42,0.8)',
          border: isUser ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(16,185,129,0.2)',
          borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
          padding: '12px 16px',
        }}
      >
        {/* Risk badge */}
        {msg.riskLevel && (
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                background: RISK_COLORS[msg.riskLevel] || '#94a3b8',
                color: '#000',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {msg.riskLevel}
            </span>
            {msg.confidence && (
              <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 11 }}>
                Confidence: {msg.confidence}%
              </span>
            )}
          </div>
        )}
        <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </div>
        {msg.structuredEvidence && <EvidenceCard evidence={msg.structuredEvidence} />}
        <div style={{ marginTop: 6, color: '#475569', fontSize: 11, textAlign: isUser ? 'right' : 'left' }}>
          {msg.timestamp}
        </div>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  const ctx = useContext(RootPulseContext);
  const selectedZone = ctx?.activeZone || ctx?.selectedZone || 'zone_a';
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '🌱 Hello! I am the RootPulse AI Farmer Assistant. Ask me anything about your underground soil conditions, root-zone health, irrigation advice, or historical trends. I use real sensor data to give you explainable, evidence-based answers.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question) return;
    setInput('');
    const userMsg = { role: 'user', content: question, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, zoneId: selectedZone }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || data.message || 'I could not generate a response.',
          riskLevel: data.riskLevel,
          confidence: data.confidence,
          structuredEvidence: data.structuredEvidence,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Could not reach the backend. Please ensure the server is running on port 5001.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          background: 'rgba(15,23,42,0.95)',
          borderBottom: '1px solid rgba(16,185,129,0.2)',
          padding: '20px 24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, color: '#10b981', fontWeight: 700 }}>
          🤖 RootPulse AI Farmer Assistant
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
          Explainable AI recommendations powered by real underground sensor data
        </p>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 12,
              color: '#10b981',
            }}
          >
            Zone: {selectedZone.replace('_', ' ').toUpperCase()}
          </span>
          <span
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 12,
              color: '#818cf8',
            }}
          >
            Model: Rule-Based + ML Anomaly Detection
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 185px)' }}>
        {/* Sidebar: Suggested questions */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            background: 'rgba(15,23,42,0.6)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 12px',
            overflowY: 'auto',
          }}
        >
          <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Suggested Questions
          </div>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 6,
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
                lineHeight: 1.4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(16,185,129,0.1)';
                e.target.style.borderColor = 'rgba(16,185,129,0.3)';
                e.target.style.color = '#10b981';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.03)';
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.color = '#94a3b8';
              }}
            >
              {q}
            </button>
          ))}

          {/* Zone info panel */}
          <div
            style={{
              marginTop: 16,
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div style={{ color: '#10b981', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Active Zone</div>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>
              {selectedZone.replace('_', ' ').toUpperCase()}
            </div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
              Switch zones using the top navbar selector to get zone-specific analysis.
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {messages.map((msg, i) => (
              <AssistantMessage key={i} msg={msg} />
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10b981', fontSize: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(16,185,129,0.2)',
                    border: '1px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '4px 12px 12px 12px',
                    padding: '12px 16px',
                  }}
                >
                  <span style={{ color: '#10b981' }}>Analyzing sensor data</span>
                  <span style={{ animation: 'blink 1s infinite' }}> ...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,23,42,0.95)',
              display: 'flex',
              gap: 10,
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about soil conditions, root zone health, irrigation needs… (Enter to send)"
              rows={2}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#e2e8f0',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '0 20px',
                borderRadius: 10,
                border: 'none',
                background: loading || !input.trim() ? 'rgba(16,185,129,0.3)' : '#10b981',
                color: '#000',
                fontWeight: 700,
                fontSize: 14,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⏳' : '→ Send'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}

