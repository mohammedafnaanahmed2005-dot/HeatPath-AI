import React from 'react';
import {
  Flame,
  Navigation,
  Satellite,
  PlayCircle,
  BarChart3,
  ShieldAlert,
  Cpu,
  FileText,
  Sparkles,
  Radio,
  Clock,
  HardHat,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isFahrenheit = false,
  setIsFahrenheit = () => {},
  currentStats,
  stats,
  heatStatus,
  onOpenDemo = () => {}
}) {
  const displayStats = currentStats || stats;

  const navItems = [
    { id: 'dashboard', label: 'Safety Dashboard', icon: ShieldCheck, badge: 'Live' },
    { id: 'cool-routes', label: 'Cool Routes', icon: Navigation, badge: '56% Cooler' },
    { id: 'worker-safety', label: 'Worker Safety', icon: HardHat, badge: 'Work/Rest' },
    { id: 'daily-planner', label: 'Daily Planner', icon: Clock, badge: '24H' },
    { id: 'satellite-infrared', label: 'Satellite & FLIR', icon: Satellite, badge: 'Thermal' },
    { id: 'simulation-video', label: 'Simulation Video', icon: PlayCircle, badge: 'Video' },
    { id: 'analysis-graphs', label: 'Graphs', icon: BarChart3, badge: 'Curves' },
    { id: 'asset-audit', label: 'Asset Audit', icon: ShieldAlert, badge: 'Triage' },
    { id: 'digital-twin', label: 'Digital Twin', icon: Cpu, badge: 'Sandbox' },
    { id: 'reports', label: 'FortyGuard Data', icon: FileText, badge: '9 Reports' },
    { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles, badge: 'Agent' }
  ];

  return (
    <header style={{
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '0.6rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.6rem'
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #38bdf8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(249, 115, 22, 0.45)'
        }}>
          <Flame size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>
              HeatPath <span style={{ color: '#38bdf8' }}>AI</span>
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '0.12rem 0.4rem',
              borderRadius: '999px',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              TRACK 1
            </span>
          </div>
          <p style={{ fontSize: '0.68rem', color: '#9ca3af', margin: 0 }}>
            FortyGuard Urban Thermal Intelligence • Indianapolis, IN
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#38bdf8' : '#9ca3af',
                fontSize: '0.75rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.6rem',
                  padding: '0.08rem 0.3rem',
                  borderRadius: '4px',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: 600
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Hackathon Demo Button, Unit Toggle & Live Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Hackathon Demo Trigger Button */}
        <button
          onClick={onOpenDemo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.38rem 0.75rem',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)'
          }}
        >
          <Award size={14} />
          <span>Demo Flow</span>
        </button>

        {/* °C / °F Unit Toggle Button */}
        <button
          onClick={() => setIsFahrenheit(!isFahrenheit)}
          title="Toggle Temperature Unit (°C / °F)"
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '8px',
            padding: '0.35rem 0.6rem',
            color: '#38bdf8',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {isFahrenheit ? '°F' : '°C'}
        </button>
      </div>
    </header>
  );
}
