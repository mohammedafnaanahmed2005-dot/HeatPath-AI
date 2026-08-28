import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Bus, School, Stethoscope, Trees, Filter, ArrowUpRight } from 'lucide-react';
import { api } from './api';
import { formatTemp } from './heatConstants';

export default function AssetHeatAudit({ time, isFahrenheit }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      try {
        const data = await api.auditAssets(time);
        if (data?.assets) {
          setAssets(data.assets);
        }
      } catch (err) {
        console.error('Failed to load asset audit:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, [time]);

  const filteredAssets = filterType === 'all'
    ? assets
    : assets.filter((a) => a.type === filterType);

  const getIcon = (type) => {
    switch (type) {
      case 'bus_stop': return <Bus size={16} color="#38bdf8" />;
      case 'playground': return <Trees size={16} color="#10b981" />;
      case 'school': return <School size={16} color="#f59e0b" />;
      case 'hospital': return <Stethoscope size={16} color="#ef4444" />;
      default: return <AlertTriangle size={16} color="#f97316" />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Formula Explanation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            padding: '10px',
            borderRadius: '12px',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
              Public Asset Heat Vulnerability Audit & Triage
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Track 1 Multi-Criteria Priority Ranking Formula: 50% Peak Heat + 25% Duration + 15% Shade Deficit + 10% Vulnerability
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'bus_stop', label: 'Bus Stops' },
            { id: 'playground', label: 'Playgrounds' },
            { id: 'school', label: 'Schools' },
            { id: 'hospital', label: 'Hospitals' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: filterType === f.id ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.06)',
                background: filterType === f.id ? 'rgba(249,115,22,0.2)' : 'rgba(30,41,59,0.5)',
                color: filterType === f.id ? '#f97316' : '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Table / Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
        {filteredAssets.map((asset, idx) => (
          <div
            key={asset.id}
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: idx === 0 ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative'
            }}
          >
            {/* Rank Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getIcon(asset.type)}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  {asset.type.replace('_', ' ')}
                </span>
              </div>
              <div style={{
                background: asset.priority_score > 75 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: asset.priority_score > 75 ? '#ef4444' : '#f59e0b',
                border: `1px solid ${asset.priority_score > 75 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                Score: {asset.priority_score}
              </div>
            </div>

            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
              {asset.name}
            </div>

            {/* Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'rgba(30, 41, 59, 0.4)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.72rem'
            }}>
              <div>Ambient: <b style={{ color: '#f97316' }}>{formatTemp(asset.ambient_temp_c, isFahrenheit)}</b></div>
              <div>Surface: <b style={{ color: '#ef4444' }}>{formatTemp(asset.surface_temp_c, isFahrenheit)}</b></div>
              <div>Shade: <b style={{ color: '#38bdf8' }}>{asset.current_shade_pct}%</b></div>
              <div>Vulnerable Pop: <b style={{ color: '#fbbf24' }}>{asset.vulnerable_population_pct}%</b></div>
            </div>

            {/* Target Intervention */}
            <div style={{
              fontSize: '0.72rem',
              color: '#cbd5e1',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '8px 10px',
              borderRadius: '6px'
            }}>
              <b style={{ color: '#10b981' }}>Target Cooling Action:</b> {asset.target_intervention}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
