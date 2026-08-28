import React, { useState } from 'react';
import { AGE_PROFILES, WORKER_OCCUPATIONS, PHYSICAL_EXERTION_LEVELS } from './heatConstants';
import { UserCheck, Shield, HardHat, Sparkles, Check, SlidersHorizontal, AlertTriangle } from 'lucide-react';

export default function HeatSafetyProfileBar({
  userProfile,
  onProfileChange,
  onApplyProfile
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const activeProfileId = userProfile?.id || 'child';
  const isWorker = userProfile?.worker_mode || activeProfileId === 'worker';

  const handleSelectProfile = (profile) => {
    if (profile.id === 'worker') {
      onProfileChange({
        ...userProfile,
        id: 'worker',
        age_group: 'adult',
        age: userProfile.age || 32,
        worker_mode: true,
        occupation: userProfile.occupation || 'construction',
        exertion_level: userProfile.exertion_level || 'heavy'
      });
    } else {
      onProfileChange({
        ...userProfile,
        id: profile.id,
        age_group: profile.id,
        age: profile.defaultAge,
        worker_mode: false
      });
    }
  };

  const handleApply = () => {
    if (onApplyProfile) onApplyProfile(userProfile);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2000);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '0.9rem 1.25rem',
        borderRadius: '14px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      {/* Top Bar: Title & Quick Profile Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={18} color="#38bdf8" />
          </div>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Heat Safety Profile
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.4rem' }}>
              (Personalized Age Vulnerability & Occupational Risk)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '7px',
              color: '#cbd5e1',
              padding: '0.35rem 0.65rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <SlidersHorizontal size={13} />
            <span>{isExpanded ? 'Simple View' : 'Customize Age / Workload'}</span>
          </button>

          <button
            onClick={handleApply}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: appliedNotice ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              borderRadius: '7px',
              color: '#ffffff',
              padding: '0.38rem 0.85rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {appliedNotice ? <Check size={14} /> : <UserCheck size={14} />}
            <span>{appliedNotice ? 'Profile Applied!' : 'Use My Profile'}</span>
          </button>
        </div>
      </div>

      {/* Profile Pills Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
        {AGE_PROFILES.map((p) => {
          const isSelected = p.id === 'worker' ? isWorker : activeProfileId === p.id && !isWorker;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectProfile(p)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.5rem 0.65rem',
                borderRadius: '9px',
                border: isSelected ? `2px solid ${p.badgeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: isSelected ? `${p.badgeColor}18` : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '1.05rem' }}>{p.emoji}</span>
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  backgroundColor: `${p.badgeColor}25`,
                  color: p.badgeColor
                }}>
                  {p.riskLevel}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e8f0', marginTop: '0.25rem' }}>
                {p.shortLabel}
              </span>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                {p.ageRange}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded Customizer (Age Slider & Worker Controls) */}
      {isExpanded && (
        <div style={{
          padding: '0.85rem',
          borderRadius: '9px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginTop: '0.2rem'
        }}>
          {/* Specific Age Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#cbd5e1' }}>
                Specific Age: <strong style={{ color: '#38bdf8' }}>{userProfile.age || 25} yrs</strong>
              </label>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Range: 0 – 100
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={userProfile.age || 25}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                let catId = 'adult';
                if (val <= 3) catId = 'infant';
                else if (val <= 15) catId = 'child';
                else if (val <= 22) catId = 'young_adult';
                else if (val <= 50) catId = 'adult';
                else catId = 'older_adult';

                onProfileChange({
                  ...userProfile,
                  age: val,
                  id: catId,
                  age_group: catId
                });
              }}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          {/* Outdoor Worker Options */}
          {isWorker && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                  Occupation
                </label>
                <select
                  value={userProfile.occupation || 'construction'}
                  onChange={(e) => onProfileChange({ ...userProfile, occupation: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.74rem'
                  }}
                >
                  {WORKER_OCCUPATIONS.map((occ) => (
                    <option key={occ.id} value={occ.id}>
                      {occ.icon} {occ.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                  Physical Exertion Level
                </label>
                <select
                  value={userProfile.exertion_level || 'heavy'}
                  onChange={(e) => onProfileChange({ ...userProfile, exertion_level: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.74rem'
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
          )}
        </div>
      )}
    </div>
  );
}
