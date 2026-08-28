import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Layers, ShieldCheck, Sun, Flame, Wind, MapPin } from 'lucide-react';
import { api } from './api';
import { formatTemp } from './heatConstants';

export default function ReportsIntelligence({ isFahrenheit }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const data = await api.getReports();
        if (data?.reports) {
          setReports(data.reports);
          setSelectedReport(data.reports[0]);
        }
      } catch (err) {
        console.error('Failed to load FortyGuard reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'rgba(249, 115, 22, 0.15)',
          padding: '10px',
          borderRadius: '12px',
          color: '#f97316',
          border: '1px solid rgba(249, 115, 22, 0.3)'
        }}>
          <FileSpreadsheet size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            FortyGuard Heat Intelligence Reports Synthesis (9 Reports)
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Empirical urban canopy microclimate parameters, sky view factors (SVF), and thermal flux benchmarks
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
        {reports.map((rep) => {
          const isSelected = selectedReport?.id === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep)}
              style={{
                background: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                border: isSelected ? '2px solid #f97316' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316' }}>{rep.id}</span>
                <span className="badge badge-high">{rep.land_cover?.split('/')[0] || 'Urban'}</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                {rep.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Canopy: <b style={{ color: '#10b981' }}>{rep.canopy_cover_pct}%</b> | SVF: <b style={{ color: '#38bdf8' }}>{rep.sky_view_factor}</b>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '6px'
              }}>
                <span style={{ color: '#cbd5e1' }}>Peak Ambient: <b>{formatTemp(rep.peak_daytime_temp_c, isFahrenheit)}</b></span>
                <span style={{ color: '#ef4444' }}>Surface: <b>{formatTemp(rep.peak_surface_temp_c, isFahrenheit)}</b></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Report Detailed Breakdown */}
      {selectedReport && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
            {selectedReport.id}: {selectedReport.name} Detailed Microclimate Profile
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ color: '#94a3b8' }}>Anthropogenic Heat Flux</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {selectedReport.anthropogenic_heat_wm2} W/m²
              </div>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ color: '#94a3b8' }}>UHI Thermal Intensity Delta</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f97316', marginTop: '2px' }}>
                +{selectedReport.uhi_intensity_c}°C
              </div>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ color: '#94a3b8' }}>Dominant Ground Materials</div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
                {selectedReport.dominant_materials?.join(', ')}
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '0.78rem',
            color: '#cbd5e1'
          }}>
            <b style={{ color: '#10b981' }}>FortyGuard Recommended Mitigations:</b>{' '}
            {selectedReport.recommended_interventions?.join(' • ')}
          </div>
        </div>
      )}
    </div>
  );
}
