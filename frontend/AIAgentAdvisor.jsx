import React, { useState } from 'react';
import { Bot, Send, Sparkles, MessageSquare, Lightbulb } from 'lucide-react';
import { api } from './api';

export default function AIAgentAdvisor() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your **HeatPath AI Urban Planning Advisor**, powered by FortyGuard heat intelligence data and thermodynamics models. Ask me about cool pedestrian routes, public asset vulnerability triage, or digital twin cooling simulations!'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    'Why is the Coolest route better than Fastest at 2 PM?',
    'Which bus stops have the highest heat priority score?',
    'How much does 40% tree canopy reduce ambient temperature?',
    'What are the key findings from FortyGuard Report FG-IND-001?'
  ];

  const handleSend = async (queryText) => {
    const text = queryText || inputQuery;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askAIAgent(text);
      const aiMsg = {
        sender: 'ai',
        text: res.answer || 'No response available.',
        confidence: res.confidence
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Apologies, I encountered an error querying the urban heat knowledge base.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '650px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #38bdf8 100%)',
          padding: '10px',
          borderRadius: '12px',
          color: '#ffffff',
          boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
        }}>
          <Bot size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            AI Urban Heat Planning Advisor
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Explainable decision intelligence grounded in FortyGuard empirical reports & thermodynamics
          </p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(30, 41, 59, 0.5)',
              color: '#cbd5e1',
              fontSize: '0.72rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lightbulb size={12} color="#f59e0b" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={idx}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: isUser ? 'rgba(249, 115, 22, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: isUser ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                color: '#f8fafc',
                whiteSpace: 'pre-line'
              }}
            >
              {!isUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#a855f7', fontWeight: 700, fontSize: '0.72rem' }}>
                  <Sparkles size={12} />
                  <span>HEATPATH ADVISOR</span>
                </div>
              )}
              {m.text}
            </div>
          );
        })}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 16px', color: '#94a3b8', fontSize: '0.75rem' }}>
            Thinking with urban heat models...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '10px' }}
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about cool routes, tree canopy impacts, asset heat triage..."
          style={{
            flex: 1,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem'
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
            border: 'none',
            color: '#ffffff',
            padding: '0 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
