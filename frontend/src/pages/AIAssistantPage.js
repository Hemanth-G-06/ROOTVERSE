// frontend/src/pages/AIAssistantPage.js
// Visual Identity: HAXLR8 3.0 Clean Agricultural Design System
// Palette: #FFF9F1 (bg), #159F57 (primary green), #E8F7ED (light green), #F5D8B4 (peach border)
import React, { useState, useRef, useEffect } from 'react';
import { useRootPulse } from '../context/RootPulseContext';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_HOST || 'http://localhost:5001';

const SUGGESTED_QUESTIONS = [
  'Why is my deep root zone dry?',
  'Should I irrigate Zone A today?',
  'What is causing soil compaction at 20 cm?',
  'Explain my underground root health score',
  'Is moisture distribution balanced across all 3 layers?',
  'Compare Zone A and Zone B'
];

export default function AIAssistantPage() {
  const { activeZone, currentZoneInfo } = useRootPulse();

  const [messages, setMessages] = useState([
    {
      id: 'msg_init',
      sender: 'assistant',
      text: `ನಮಸ್ಕಾರ / Hello! I am the RhizoAI Farmer Assistant for ${currentZoneInfo?.name || 'Zone A'}. I can answer questions about your subterranean root-zone health, multi-depth moisture penetration, subsoil compaction, and predictive irrigation advice grounded in your real sensor data.`,
      evidence: [
        'Connected to live ESP32 telemetry feed',
        'Consuming multi-depth soil moisture: 10cm, 20cm, 30cm',
        'Real-time RhizoAI disparity engine active'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          zoneId: activeZone
        })
      });

      if (res.ok) {
        const json = await res.json();
        const botMessage = {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: json.answer || json.reply || 'Analysis completed.',
          evidence: json.evidence || [],
          riskLevel: json.riskLevel || 'GREEN',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach the RhizoAI backend service. Please check your connection.',
          evidence: ['Backend offline or endpoint unreachable'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvidence = (id) => {
    setExpandedEvidence(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FFF9F1] py-6 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Title Banner ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F7ED] text-[#126B3B] border border-[#159F57]/30">
                RHIZOAI EXPLAINABLE ASSISTANT
              </span>
              <span className="text-xs text-[#667085] font-semibold">
                Context: {currentZoneInfo?.name || 'Zone A'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              ರೈತ ಸಹಾಯಕ — RhizoAI Farmer Intelligence Assistant
            </h1>
            <p className="text-sm text-[#667085] mt-1">
              Grounded conversational assistant providing evidence-backed answers on soil moisture disparity, compaction, and predictive irrigation timing.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#FFF0DB] px-3.5 py-2 rounded-xl border border-[#F5D8B4] text-xs font-bold text-[#172033]">
            <Bot className="w-4 h-4 text-[#159F57]" />
            <span>Active Zone: {activeZone.toUpperCase()}</span>
          </div>
        </div>

        {/* ── Suggested Questions Strip ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#667085] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#159F57]" /> Suggested Agronomic Inquiries:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap bg-[#FFF9F1] hover:bg-[#E8F7ED] text-[#172033] hover:text-[#126B3B] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#F5D8B4] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat Messages Container ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#F5D8B4] p-6 shadow-sm flex flex-col h-[520px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-2xl ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm ${
                    isAssistant ? 'bg-[#159F57]' : 'bg-[#078DC1]'
                  }`}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-2 rounded-2xl p-4 text-xs leading-relaxed ${
                    isAssistant
                      ? 'bg-[#E8F7ED] border border-[#159F57]/30 text-[#172033]'
                      : 'bg-[#DDF3FA] border border-[#078DC1]/30 text-[#172033]'
                  }`}>
                    <p className="font-medium text-[13px]">{msg.text}</p>

                    {/* Sensor Evidence Dropdown */}
                    {msg.evidence && msg.evidence.length > 0 && (
                      <div className="pt-2 border-t border-[#159F57]/20 mt-2">
                        <button
                          onClick={() => toggleEvidence(msg.id)}
                          className="flex items-center gap-1 font-bold text-[#126B3B] hover:underline text-[11px]"
                        >
                          {expandedEvidence[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          Sensor Evidence & Grounded Context ({msg.evidence.length})
                        </button>

                        {expandedEvidence[msg.id] && (
                          <ul className="mt-2 space-y-1 pl-4 list-disc text-[#667085] text-[11px]">
                            {msg.evidence.map((ev, i) => (
                              <li key={i}>{ev}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-[#98A2B3] text-right pt-1">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-md mr-auto">
                <div className="w-8 h-8 rounded-xl bg-[#159F57] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-[#E8F7ED] border border-[#159F57]/30 rounded-2xl p-3 text-xs text-[#126B3B] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating soil data with RhizoAI...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Bar ──────────────────────────────────────────────────── */}
          <div className="pt-4 border-t border-[#F5D8B4] mt-2">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about deep root moisture, compaction, or irrigation schedule..."
                className="flex-1 bg-[#FFF9F1] border border-[#F5D8B4] rounded-xl px-4 py-2.5 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#159F57]"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="bg-[#159F57] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#126B3B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
