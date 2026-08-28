import React, { useState, useEffect } from 'react';
import {
  Flame,
  Shield,
  Thermometer,
  Droplets,
  Clock,
  RefreshCw,
  Navigation,
  AlertTriangle,
  HeartPulse,
  Trees,
  CheckCircle2,
  HardHat,
  Sparkles,
  Info
} from 'lucide-react';
import { formatTemp } from './heatConstants';
import { api } from './api';

export default function PersonalizedDashboard({
  userProfile,
  time = '14:00',
  isFahrenheit = false,
  activeRoute = null,
  onNavigateTab = () => {},
  onRefreshData = () => {}
}) {
  const [riskData, setRiskData] = useState(null);
  const [heatStatus, setHeatStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load personalized risk calculation whenever profile or time changes
  useEffect(() => {
    async function loadRiskAndStatus() {
      setLoading(true);
      try {
        const [rData, sData] = await Promise.all([
          api.calculatePersonalizedRisk({
            departure_time: time,
            age: userProfile?.age,
            age_group: userProfile?.id || userProfile?.age_group,
            worker_mode: userProfile?.worker_mode || false,
            occupation: userProfile?.occupation || 'construction',
            exertion_level: userProfile?.exertion_level || 'moderate',
            exposure_minutes: 30.0
          }),
          api.getHeatStatus().catch(() => null)
        ]);
        setRiskData(rData);
        if (sData) setHeatStatus(sData);
      } catch (err) {
        console.error('Failed to load personalized risk:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRiskAndStatus();
  }, [userProfile, time]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.refreshHeatData();
      if (res?.status) setHeatStatus(res.status);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const riskScore = riskData?.risk_score || 45;
  const riskLevel = riskData?.risk_level || 'MODERATE';
  const riskColor = riskData?.risk_color || '#eab308';
  const riskIcon = riskData?.risk_icon || '🟡';
  const env = riskData?.environmental;
  const worker = riskData?.worker_safety;
  const isWorker = userProfile?.worker_mode || userProfile?.id === 'worker';

  // Summary of route if available
  const routeSummary = activeRoute?.comparison_summary;
  const coolestRoute = activeRoute?.routes?.coolest;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Top Overview Banner: Profile & 2-Hour FortyGuard Live Sync ── */}
      <div
        className="glass-panel"
        style={{
          padding: '1.2rem 1.5rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.88) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            fontSize: '2.4rem',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            backgroundColor: `${riskColor}20`,
            border: `2px solid ${riskColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {riskData?.profile?.age_emoji || '🧒'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {riskData?.profile?.age_group_name || 'Personalized Profile'}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                backgroundColor: `${riskColor}25`,
                color: riskColor,
                border: `1px solid ${riskColor}50`
              }}>
                {riskIcon} {riskLevel} HEAT RISK
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              Selected Age: <strong style={{ color: '#f1f5f9' }}>{userProfile?.age || 10} years</strong> •{' '}
              Vulnerability Modifier:{' '}
              <strong style={{ color: '#38bdf8' }}>{riskData?.profile?.vulnerability_multiplier}x</strong>
              {isWorker && ` • ${riskData?.profile?.worker_details?.occupation || 'Outdoor Labor'}`}
            </p>
          </div>
        </div>

        {/* 2-Hour FortyGuard Refresh Telemetry Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          padding: '0.6rem 1rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 600 }}>
              ⏱️ {heatStatus?.last_updated_display || 'Last updated: 12 mins ago'}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>
              {heatStatus?.next_update_display || 'Next update: approx 108 mins'}
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Trigger Immediate FortyGuard 2-Hour Data Refresh"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '0.4rem 0.65rem',
              color: '#38bdf8',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* ── Contextual Heat Alert Banner ── */}
      {riskData?.alert_message && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            border: `1.5px solid ${riskColor}`,
            backgroundColor: `${riskColor}15`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <AlertTriangle size={22} color={riskColor} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', display: 'block' }}>
              {riskLevel === 'EXTREME' ? 'EMERGENCY HEAT WARNING' : 'PERSONALIZED HEAT ADVISORY'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              {riskData.alert_message}
            </span>
          </div>
        </div>
      )}

      {/* ── Core Metric Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* 1. Personalized Risk Gauge (0-100) */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Personalized Risk Score
            </span>
            <HeartPulse size={18} color={riskColor} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: riskColor, letterSpacing: '-0.03em' }}>
              {riskScore}
            </span>
            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ 100</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: `${riskColor}25`,
              color: riskColor
            }}>
              {riskLevel}
            </span>
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              width: `${riskScore}%`,
              height: '100%',
              borderRadius: '4px',
              backgroundColor: riskColor,
              transition: 'width 0.4s ease'
            }} />
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            0–25 Safe • 26–50 Moderate • 51–75 High • 76–100 Extreme
          </span>
        </div>

        {/* 2. FortyGuard Environmental Temperature */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              FortyGuard Air Temp
            </span>
            <Thermometer size={18} color="#ef4444" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em' }}>
              {formatTemp(env?.temperature_c || 37.5, isFahrenheit)}
            </span>
            <span style={{ fontSize: '0.76rem', color: '#f59e0b', fontWeight: 600 }}>
              HI: {formatTemp(env?.heat_index_c || 42.0, isFahrenheit)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
            <span>WBGT: {formatTemp(env?.wbgt_c || 31.0, isFahrenheit)}</span>
            <span>Humidity: {env?.humidity_pct || 79}%</span>
          </div>
        </div>

        {/* 3. Hydration Schedule & Fluid Rate */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Hydration Protocol
            </span>
            <Droplets size={18} color="#38bdf8" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
            {riskData?.hydration_reminder?.recommended_intake || '24 oz fluid / hour'}
          </span>
          <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: 0 }}>
            {riskData?.hydration_reminder?.schedule || 'Drink 1 cup (8 oz) every 15–20 minutes in heat.'}
          </p>
        </div>

        {/* 4. Worker Work/Rest or Vulnerability Status */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              {isWorker ? 'Work / Rest Protocol' : 'Vulnerability Status'}
            </span>
            {isWorker ? <HardHat size={18} color="#f59e0b" /> : <Shield size={18} color="#10b981" />}
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isWorker ? '#f59e0b' : '#10b981' }}>
            {isWorker ? worker?.work_rest_status : `${riskData?.profile?.vulnerability_multiplier}x Sensitivity`}
          </span>
          <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: 0 }}>
            {isWorker
              ? `Next cooling rest recommended in ${worker?.next_break_minutes || 20} min.`
              : `Age ${userProfile?.age || 10}: tailored precautions active.`}
          </p>
        </div>
      </div>

      {/* ── Split Cards: Action Guidance + Cooling Path Quick Link ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Recommended Safety Action */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Personalized Action Recommendation
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
            {riskData?.recommended_action}
          </p>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Key Safety Precautions for {riskData?.profile?.age_group_name}:
            </span>
            {riskData?.precautions?.slice(0, 3).map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <span style={{ color: '#38bdf8' }}>•</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cooling Path Recommendation */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Cooling Path Routing
                </h3>
              </div>
              <span className="badge badge-low">Canopy & Canal Relief</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
              {riskData?.route_recommendation || 'Coolest Route optimizes shaded tree canopies and waterway corridors.'}
            </p>
            {routeSummary && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  🛡️ {routeSummary.heat_reduction_pct}% Heat Stress Reduction
                </span>
                <span style={{ color: '#cbd5e1' }}>
                  +{routeSummary.extra_walking_minutes} min walking time
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('cool-routes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              borderRadius: '9px',
              color: '#ffffff',
              padding: '0.6rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Navigation size={15} />
            <span>Open Interactive Cool Route Planner</span>
          </button>
        </div>
      </div>
    </div>
  );
}
