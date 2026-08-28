import React from 'react';
import { Sun, Moon, Clock, Flame, CloudSun } from 'lucide-react';

export default function HourlySlider({
  currentTime,
  time,
  onTimeChange,
  setTime,
  hourLabel,
  stats,
  isFahrenheit = false
}) {
  const activeTime = currentTime || time || '14:00';
  const handleTimeChange = onTimeChange || setTime || (() => {});

  // Convert "14:00" to hour integer [0-23]
  const currentHour = parseInt(activeTime.split(':')[0], 10) || 14;

  const quickPresets = [
    { label: '6 AM Sunrise', value: '06:00', icon: '🌅' },
    { label: '10 AM Morning', value: '10:00', icon: '🌤️' },
    { label: '12:45 PM Solar Noon', value: '12:45', icon: '☀️' },
    { label: '2:30 PM Peak Heat', value: '14:30', icon: '🔥' },
    { label: '6 PM Evening', value: '18:00', icon: '🌇' },
    { label: '12 AM Night UHI', value: '00:00', icon: '🌙' }
  ];

  return (
    <div style={{
      backgroundColor: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0.85rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      {/* Top row: Current time display + quick preset buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: currentHour >= 6 && currentHour <= 19 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            padding: '0.4rem',
            borderRadius: '8px',
            border: currentHour >= 6 && currentHour <= 19 ? '1px solid #f59e0b' : '1px solid #6366f1'
          }}>
            {currentHour >= 6 && currentHour <= 19 ? (
              <Sun size={18} color="#f59e0b" />
            ) : (
              <Moon size={18} color="#818cf8" />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f3f4f6' }}>
                {activeTime}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>
                {hourLabel || (currentHour >= 12 ? (currentHour === 12 ? '12:00 PM' : `${currentHour - 12}:00 PM`) : (currentHour === 0 ? '12:00 AM' : `${currentHour}:00 AM`))}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
              {currentHour >= 13 && currentHour <= 17 ? '🔴 Peak Thermal Lag & Asphalt Heat Release (DTR Active)' :
               currentHour >= 10 && currentHour <= 12 ? '🟠 Rising Solar Irradiance (GHI Peak)' :
               currentHour >= 18 && currentHour <= 21 ? '🟡 Post-Sunset Sensible Re-radiation' : '🔵 Nocturnal UHI Trapping Phase'}
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {quickPresets.map((preset) => {
            const isPresetActive = activeTime === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handleTimeChange(preset.value)}
                style={{
                  background: isPresetActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(31, 41, 55, 0.6)',
                  border: isPresetActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isPresetActive ? '#38bdf8' : '#9ca3af',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: isPresetActive ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{preset.icon}</span> {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly Scrubber Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#6b7280', minWidth: '40px' }}>00:00</span>
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={currentHour}
          onChange={(e) => {
            const h = parseInt(e.target.value, 10);
            handleTimeChange(`${h.toString().padStart(2, '0')}:00`);
          }}
          style={{
            flex: 1,
            accentColor: '#38bdf8',
            cursor: 'pointer',
            height: '6px'
          }}
        />
        <span style={{ fontSize: '0.7rem', color: '#6b7280', minWidth: '40px', textAlign: 'right' }}>23:00</span>
      </div>
    </div>
  );
}
