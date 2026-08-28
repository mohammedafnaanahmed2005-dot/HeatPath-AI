import React, { useState, useEffect } from 'react';
import {
  HardHat,
  ShieldAlert,
  Thermometer,
  Droplets,
  Clock,
  Trees,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Activity,
  Flame,
  Sparkles
} from 'lucide-react';
import { WORKER_OCCUPATIONS, PHYSICAL_EXERTION_LEVELS, formatTemp } from './heatConstants';
import { api } from './api';

export default function WorkerSafetyPanel({
  userProfile,
  onProfileChange,
  time = '14:00',
  isFahrenheit = false,
  onNavigateTab = () => {}
}) {
  const [workerRisk, setWorkerRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exposureMinutes, setExposureMinutes] = useState(45);
  const [timerSeconds, setTimerSeconds] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const occupation = userProfile?.occupation || 'construction';
  const exertionLevel = userProfile?.exertion_level || 'heavy';

  useEffect(() => {
    async function loadWorkerRisk() {
      setLoading(true);
      try {
        const data = await api.getWorkerSafetyRisk({
          occupation,
          exertion_level: exertionLevel,
          time,
          exposure_minutes: exposureMinutes
        });
        setWorkerRisk(data);
      } catch (err) {
        console.error('Failed to load worker safety metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkerRisk();
  }, [occupation, exertionLevel, time, exposureMinutes]);

  // Exposure Timer Countdown
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const riskScore = workerRisk?.risk_score || 72;
  const riskLevel = workerRisk?.risk_level || 'HIGH';
  const riskColor = workerRisk?.risk_color || '#f97316';
  const env = workerRisk?.environmental;
  const workerSafety = workerRisk?.worker_safety;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.88) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)'
          }}>
            <HardHat size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Outdoor Worker Heat Safety Suite
              </h2>
              <span className="badge badge-extreme">Occupational Health</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              Dynamic work/rest cycles, hydration monitoring, and thermal stress mitigation
            </p>
          </div>
        </div>

        {/* Occupation & Exertion Quick Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            value={occupation}
            onChange={(e) => onProfileChange({ ...userProfile, occupation: e.target.value, worker_mode: true })}
            style={{
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#f8fafc',
              padding: '0.45rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            {WORKER_OCCUPATIONS.map((occ) => (
              <option key={occ.id} value={occ.id}>
                {occ.icon} {occ.label}
              </option>
            ))}
          </select>

          <select
            value={exertionLevel}
            onChange={(e) => onProfileChange({ ...userProfile, exertion_level: e.target.value, worker_mode: true })}
            style={{
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#f8fafc',
              padding: '0.45rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            {PHYSICAL_EXERTION_LEVELS.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label} ({ex.mult})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Extreme Heat Emergency Banner if High/Extreme */}
      {(riskLevel === 'HIGH' || riskLevel === 'EXTREME') && (
        <div style={{
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: `${riskColor}20`,
          border: `1.5px solid ${riskColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={24} color={riskColor} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.84rem', color: '#ffffff', display: 'block' }}>
              HIGH OCCUPATIONAL HEAT STRESS ALERT
            </strong>
            <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
              {workerRisk?.alert_message || 'Mandatory shade breaks and fluid replenishment required to prevent heat exhaustion.'}
            </span>
          </div>
        </div>
      )}

      {/* 4 Core Worker Telemetry Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* 1. Worker Heat Risk Score */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Worker Heat Risk Score
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: riskColor }}>
              {riskScore}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ 100</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: `${riskColor}25`,
              color: riskColor
            }}>
              {riskLevel}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            Multipliers: 1.0x (Age) × {workerRisk?.profile?.worker_details?.exertion_level ? `${PHYSICAL_EXERTION_LEVELS.find(e => e.id === exertionLevel)?.mult} (${exertionLevel})` : '1.35x'}
          </span>
        </div>

        {/* 2. Work / Rest Duty Status */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Recommended Work / Rest
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b' }}>
            {workerSafety?.work_rest_status || '45m work / 15m rest'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
            Standard ratio: {workerSafety?.recommended_work_rest_ratio || '45m work / 15m rest'}
          </span>
        </div>

        {/* 3. Hydration Target Rate */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Hydration Target
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
            {workerRisk?.hydration_reminder?.recommended_intake || '32 oz fluid / hour'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
            1 cup (8 oz) every 15 minutes with electrolytes.
          </span>
        </div>

        {/* 4. Nearest Cooling Refuge */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Nearest Cooling Refuge
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>
            🌿 {workerSafety?.nearest_cooling_shelter || 'Central Canal Shaded Pavilion'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
            ~350m distance (4 min shaded walk)
          </span>
        </div>
      </div>

      {/* Heat Exposure Stopwatch & Break Schedule Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Exposure Stopwatch Timer */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Continuous Heat Exposure Timer
          </span>
          <div style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: timerSeconds <= 300 ? '#ef4444' : '#38bdf8',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.05em'
          }}>
            {formatTimer(timerSeconds)}
          </div>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>
            {timerSeconds === 0 ? '⚠️ TIME FOR MANDATORY SHADE BREAK & HYDRATION' : `Next scheduled break in ${Math.ceil(timerSeconds / 60)} minutes`}
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: isTimerRunning ? '#eab308' : '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '0.45rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isTimerRunning ? <Pause size={15} /> : <Play size={15} />}
              <span>{isTimerRunning ? 'Pause Work' : 'Start Exposure Timer'}</span>
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(exposureMinutes * 60);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#cbd5e1',
                padding: '0.45rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Work Shift Guidelines & Disclaimer */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
              Safety Guidelines for {WORKER_OCCUPATIONS.find(o => o.id === occupation)?.label || 'Outdoor Personnel'}
            </h3>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              <li>Enforce buddy monitoring for heat illness symptoms (slurred speech, confusion, pale skin).</li>
              <li>Provide active canopy shade structures and misting fans at job staging areas.</li>
              <li>Pre-hydrate with 16 oz water before beginning the outdoor shift.</li>
              <li>Schedule asphalt paving and high-exertion tasks before 11:00 AM or after 6:00 PM.</li>
            </ul>
          </div>

          <div style={{
            fontSize: '0.68rem',
            color: '#94a3b8',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '0.5rem',
            fontStyle: 'italic'
          }}>
            ⚠️ {workerRisk?.disclaimer || 'App safety recommendations provided for decision support; verify with job site safety coordinator.'}
          </div>
        </div>
      </div>
    </div>
  );
}
