import React, { useState, useEffect } from 'react';
import { calculateRoutes, fetchNetworkNodes } from './api';
import {
  Navigation,
  Clock,
  Thermometer,
  Trees,
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  HeartPulse
} from 'lucide-react';
import { formatTemp } from './heatConstants';

export default function RoutePlanner({
  time,
  currentTime,
  isFahrenheit = false,
  userProfile = {},
  onRouteCalculated,
  selectedRouteType,
  setSelectedRouteType,
  activeRouteKey,
  setActiveRouteKey,
  routeResult: externalRouteResult
}) {
  const activeTime = time || currentTime || '14:00';
  const currentRouteKey = selectedRouteType || activeRouteKey || 'coolest';
  const handleSelectRouteKey = setSelectedRouteType || setActiveRouteKey || (() => {});

  const [nodes, setNodes] = useState([]);
  const [originId, setOriginId] = useState('N_CARSON_TRANSIT');
  const [destId, setDestId] = useState('N_ESKENAZI_HEALTH');
  const [internalRouteResult, setInternalRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSegments, setShowSegments] = useState(false);

  const routeResult = externalRouteResult || internalRouteResult;

  // Load available network nodes
  useEffect(() => {
    async function loadNodes() {
      try {
        const nodeList = await fetchNetworkNodes();
        setNodes(nodeList || []);
      } catch (err) {
        console.error('Failed to load nodes:', err);
      }
    }
    loadNodes();
  }, []);

  const handlePlanRoute = async (oId = originId, dId = destId, t = activeTime, prof = userProfile) => {
    if (oId === dId) {
      setError('Origin and destination cannot be identical.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await calculateRoutes(oId, dId, t, prof);
      setInternalRouteResult(data);
      if (onRouteCalculated) {
        onRouteCalculated(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate routes.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically plan initial route on mount or when time or profile changes
  useEffect(() => {
    handlePlanRoute(originId, destId, activeTime, userProfile);
  }, [activeTime, userProfile]);

  const activeRoute = routeResult?.routes?.[currentRouteKey];
  const summary = routeResult?.comparison_summary;
  const profileContext = routeResult?.profile_context;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.45rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <Navigation size={20} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f3f4f6', margin: 0 }}>
              Personalized Cooling Path Planner
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
              Heat-Aware A* pathfinding incorporating age vulnerability and diurnal FortyGuard heat
            </p>
          </div>
        </div>
        <div className="badge badge-low">
          {profileContext?.age_emoji || '🧒'} {profileContext?.age_group_name || 'Personalized'}
        </div>
      </div>

      {/* Node Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
            Origin (Start Waypoint)
          </label>
          <select
            value={originId}
            onChange={(e) => {
              setOriginId(e.target.value);
              handlePlanRoute(e.target.value, destId, activeTime, userProfile);
            }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#f3f4f6',
              padding: '0.5rem 0.65rem',
              fontSize: '0.78rem',
              outline: 'none'
            }}
          >
            {nodes.map((n) => (
              <option key={`orig-${n.id}`} value={n.id}>
                {n.name} ({n.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
            Destination (End Waypoint)
          </label>
          <select
            value={destId}
            onChange={(e) => {
              setDestId(e.target.value);
              handlePlanRoute(originId, e.target.value, activeTime, userProfile);
            }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#f3f4f6',
              padding: '0.5rem 0.65rem',
              fontSize: '0.78rem',
              outline: 'none'
            }}
          >
            {nodes.map((n) => (
              <option key={`dest-${n.id}`} value={n.id}>
                {n.name} ({n.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '0.75rem', color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Route Options Comparison Cards */}
      {routeResult?.routes && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {['fastest', 'balanced', 'coolest'].map((rKey) => {
            const r = routeResult.routes[rKey];
            if (!r) return null;
            const isSelected = currentRouteKey === rKey;
            return (
              <div
                key={rKey}
                onClick={() => handleSelectRouteKey(rKey)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: isSelected ? `2px solid ${r.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${r.color}20` : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                    {r.label}
                  </span>
                </div>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                  {r.badge}
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: r.color }}>
                    {formatTemp(r.avg_temperature_c, isFahrenheit)}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    {r.duration_minutes} min
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94a3b8' }}>
                  <span>{r.distance_km} km</span>
                  <span>{r.avg_shade_pct}% shade</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Summary Banner */}
      {summary && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>
              🛡️ {summary.heat_reduction_pct}% Lower Heat Exposure via Cooling Path
            </span>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              +{summary.extra_walking_minutes} min walking
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#d1fae5', margin: 0 }}>
            {summary.key_takeaway}
          </p>
        </div>
      )}

      {/* Route Telemetry & Segment Turn-by-Turn Accordion */}
      {activeRoute && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => setShowSegments(!showSegments)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.2rem 0'
            }}
          >
            <span>{showSegments ? 'Hide Segment Microclimates' : `View ${activeRoute.segments_count || 0} Road Segments`}</span>
            {showSegments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showSegments && activeRoute.segments && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
              {activeRoute.segments.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.5rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.72rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#f8fafc', display: 'block' }}>
                      {seg.street_name}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.66rem' }}>
                      {seg.distance_m}m • {seg.surface_type} • {seg.shade_pct}% shade
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, color: seg.temperature_c > 36 ? '#ef4444' : '#10b981' }}>
                    {formatTemp(seg.temperature_c, isFahrenheit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
