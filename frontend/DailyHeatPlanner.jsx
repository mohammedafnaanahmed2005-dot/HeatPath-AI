import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Thermometer,
  Shield,
  Droplets,
  Navigation,
  Trees,
  AlertTriangle,
  HardHat,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatTemp } from './heatConstants';
import { api } from './api';

export default function DailyHeatPlanner({
  userProfile,
  isFahrenheit = false,
  currentTime = '14:00',
  onSelectPeriodTime = () => {}
}) {
  const [plannerData, setPlannerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState('midday_peak');

  useEffect(() => {
    async function loadPlan() {
      setLoading(true);
      try {
        const data = await api.getDailyHeatPlanner({
          age: userProfile?.age,
          age_group: userProfile?.id || userProfile?.age_group,
          worker_mode: userProfile?.worker_mode || false,
          occupation: userProfile?.occupation || 'construction',
          exertion_level: userProfile?.exertion_level || 'moderate'
        });
        setPlannerData(data);
      } catch (err) {
        console.error('Failed to fetch daily heat planner:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [userProfile]);

  const periods = plannerData?.periods || [];
  const activePeriod = periods.find((p) => p.id === selectedPeriodId) || periods[2] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.2rem 1.5rem',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Clock size={20} color="#38bdf8" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              24-Hour Daily Heat Planner
            </h2>
            <span className="badge badge-low">Diurnal FortyGuard Intelligence</span>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Personalized heat forecasts & activity recommendations for{' '}
            <strong style={{ color: '#38bdf8' }}>{plannerData?.profile?.age_group_name || 'Selected Profile'}</strong>
            {userProfile?.worker_mode && ' (Outdoor Worker Mode Active)'}
          </p>
        </div>

        <div style={{ fontSize: '0.74rem', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          🔥 Peak Thermal Stress: <strong>{plannerData?.peak_risk_period || '12 PM – 3 PM'}</strong>
        </div>
      </div>

      {/* 6 Diurnal Period Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        {periods.map((p) => {
          const isSelected = p.id === selectedPeriodId;
          return (
            <div
              key={p.id}
              onClick={() => {
                setSelectedPeriodId(p.id);
                if (onSelectPeriodTime) onSelectPeriodTime(p.representative_time);
              }}
              className="glass-panel"
              style={{
                padding: '0.85rem',
                borderRadius: '12px',
                border: isSelected ? `2px solid ${p.risk_color}` : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: isSelected ? `${p.risk_color}18` : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  backgroundColor: `${p.risk_color}25`,
                  color: p.risk_color
                }}>
                  {p.risk_level}
                </span>
              </div>

              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                {p.label}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {p.time_range}
              </span>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: p.risk_color }}>
                  {formatTemp(p.ambient_temp_c, isFahrenheit)}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                  Risk: {p.risk_score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Period Detailed Breakdown */}
      {activePeriod && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: `1.5px solid ${activePeriod.risk_color}50`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{activePeriod.icon}</span>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {activePeriod.label} ({activePeriod.time_range})
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                  Representative Time: {activePeriod.representative_time} • Surface Temp: {formatTemp(activePeriod.surface_temp_c, isFahrenheit)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                padding: '0.25rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: `${activePeriod.risk_color}25`,
                color: activePeriod.risk_color,
                border: `1px solid ${activePeriod.risk_color}60`
              }}>
                {activePeriod.risk_icon} {activePeriod.risk_level} (Score {activePeriod.risk_score}/100)
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Activity Level Guidance */}
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                Recommended Activity Level
              </span>
              <strong style={{ fontSize: '0.88rem', color: activePeriod.risk_color, display: 'block', marginBottom: '0.25rem' }}>
                {activePeriod.activity_level}
              </strong>
              <p style={{ fontSize: '0.76rem', color: '#cbd5e1', margin: 0 }}>
                {activePeriod.activity_guidance}
              </p>
            </div>

            {/* Hydration Guidance */}
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Droplets size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Hydration Target
                </span>
              </div>
              <strong style={{ fontSize: '0.88rem', color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>
                {activePeriod.hydration_reminder}
              </strong>
              <p style={{ fontSize: '0.76rem', color: '#cbd5e1', margin: 0 }}>
                Drink cool water at regular 15-minute intervals.
              </p>
            </div>

            {/* Shaded Cooling Areas */}
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <Trees size={15} color="#10b981" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Nearby Cooling / Shaded Areas
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {activePeriod.cooling_areas?.map((c, i) => (
                  <span key={i} style={{ fontSize: '0.76rem', color: '#f1f5f9' }}>
                    🌿 {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Period Precautions */}
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
              Period Precautions:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem' }}>
              {activePeriod.precautions?.map((prec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.76rem', color: '#cbd5e1' }}>
                  <span style={{ color: activePeriod.risk_color }}>•</span>
                  <span>{prec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
