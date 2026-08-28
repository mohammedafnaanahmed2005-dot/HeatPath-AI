import React, { useState, useEffect } from 'react';
import { Cpu, TreePine, Sparkles, Droplets, Home, ArrowDownRight, DollarSign, Leaf } from 'lucide-react';
import { api } from './api';
import { formatTemp } from './heatConstants';

export default function DigitalTwinSandbox({ time, isFahrenheit, onSimulateLocation }) {
  const [treeCanopy, setTreeCanopy] = useState(true);
  const [treeCoverage, setTreeCoverage] = useState(35);
  const [reflectivePavement, setReflectivePavement] = useState(true);
  const [pavementAlbedo, setPavementAlbedo] = useState(0.40);
  const [coolRoofs, setCoolRoofs] = useState(false);
  const [mistingStations, setMistingStations] = useState(false);

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.simulateInterventions({
        target_lat: 39.7684,
        target_lng: -86.1580,
        time,
        tree_canopy: treeCanopy,
        tree_canopy_coverage_pct: treeCoverage,
        reflective_pavement: reflectivePavement,
        pavement_albedo: pavementAlbedo,
        cool_roofs: coolRoofs,
        misting_stations: mistingStations,
      });
      setSimResult(res);
      if (onSimulateLocation) {
        onSimulateLocation([39.7684, -86.1580]);
      }
    } catch (err) {
      console.error('Digital Twin Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [treeCanopy, treeCoverage, reflectivePavement, pavementAlbedo, coolRoofs, mistingStations, time]);

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'rgba(168, 85, 247, 0.15)',
          padding: '10px',
          borderRadius: '12px',
          color: '#a855f7',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}>
          <Cpu size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            Digital Twin Microclimate Cooling Sandbox
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Simulate urban cooling interventions in real-time with localized surface & ambient delta calculations
          </p>
        </div>
      </div>

      {/* Main Grid: Sliders on left, Real-time Impact on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Intervention Sliders */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
            Intervention Parameters
          </h3>

          {/* 1. Tree Canopy */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TreePine size={16} color="#10b981" />
                <b>Deciduous Tree Canopy Coverage</b>
              </span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{treeCanopy ? `${treeCoverage}%` : 'Disabled'}</span>
            </div>
            <input
              type="range"
              min="5"
              max="70"
              value={treeCoverage}
              disabled={!treeCanopy}
              onChange={(e) => setTreeCoverage(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>

          {/* 2. Reflective Cool Pavement */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#38bdf8" />
                <b>Pavement Surface Albedo (Reflectance)</b>
              </span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{reflectivePavement ? pavementAlbedo.toFixed(2) : '0.08 (Asphalt)'}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.65"
              step="0.05"
              value={pavementAlbedo}
              disabled={!reflectivePavement}
              onChange={(e) => setPavementAlbedo(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          {/* 3. Toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => setCoolRoofs(!coolRoofs)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: coolRoofs ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                background: coolRoofs ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30,41,59,0.4)',
                color: coolRoofs ? '#f59e0b' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Home size={16} />
              <span>Cool Roof Retrofit</span>
            </button>

            <button
              onClick={() => setMistingStations(!mistingStations)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: mistingStations ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                background: mistingStations ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30,41,59,0.4)',
                color: mistingStations ? '#38bdf8' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Droplets size={16} />
              <span>Solar Misting Jets</span>
            </button>
          </div>
        </div>

        {/* Real-Time Impact Dashboard */}
        {simResult && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
              Microclimate Cooling Impact
            </h3>

            {/* Cooling Deltas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '14px',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ambient Air Cooling</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  -{simResult.impact_metrics?.ambient_reduction_c}°C
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>
                  From {formatTemp(simResult.before?.ambient_temp_c, isFahrenheit)} → <b style={{ color: '#34d399' }}>{formatTemp(simResult.after?.ambient_temp_c, isFahrenheit)}</b>
                </div>
              </div>

              <div style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '14px',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Surface Temp Cooling</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  -{simResult.impact_metrics?.surface_reduction_c}°C
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>
                  From {formatTemp(simResult.before?.surface_temp_c, isFahrenheit)} → <b style={{ color: '#38bdf8' }}>{formatTemp(simResult.after?.surface_temp_c, isFahrenheit)}</b>
                </div>
              </div>
            </div>

            {/* Cost & Carbon Offset */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(30, 41, 59, 0.5)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ESTIMATED CAPITAL COST</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    ${simResult.impact_metrics?.estimated_cost_usd?.toLocaleString() || '45,000'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Leaf size={18} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ANNUAL CO₂ OFFSET</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
                    {simResult.impact_metrics?.co2_offset_tons_yr || '14.5'} tons/yr
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
