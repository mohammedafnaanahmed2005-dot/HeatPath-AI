import React, { useState, useEffect, useRef } from 'react';
import { fetchSimulationVideoFrames } from './api';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Film,
  Activity,
  ShieldCheck,
  Download,
  Flame,
  Sun,
  Moon,
  Gauge
} from 'lucide-react';
import { formatTemp } from './heatConstants';

export default function SimulationVideo({
  onFrameUpdate,
  onTransitStep,
  onPedestrianUpdate,
  selectedRouteData,
  activeRouteKey = 'coolest',
  isFahrenheit = false
}) {
  const [framesData, setFramesData] = useState(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(14); // Default to 2 PM (index 14)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x, 8x
  const [simulationMode, setSimulationMode] = useState('heat_evolution'); // 'heat_evolution' or 'pedestrian_transit'
  const [pedestrianProgress, setPedestrianProgress] = useState(0.0); // 0.0 to 1.0

  const intervalRef = useRef(null);

  const handlePedestrianChange = onTransitStep || onPedestrianUpdate;

  // Load simulation frames
  useEffect(() => {
    async function loadFrames() {
      try {
        const data = await fetchSimulationVideoFrames(14);
        setFramesData(data);
      } catch (err) {
        console.error('Failed to load simulation frames:', err);
      }
    }
    loadFrames();
  }, []);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      const stepMs = Math.max(100, 1000 / (playbackSpeed * 2));
      intervalRef.current = setInterval(() => {
        if (simulationMode === 'heat_evolution') {
          setCurrentFrameIndex((prev) => {
            const next = (prev + 1) % 24;
            return next;
          });
        } else {
          // Pedestrian transit simulation along active route
          setPedestrianProgress((prev) => {
            const next = prev + 0.04 * playbackSpeed;
            if (next >= 1.0) {
              setIsPlaying(false);
              return 1.0;
            }
            return next;
          });
        }
      }, stepMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, simulationMode]);

  // Sync frame with parent map
  useEffect(() => {
    if (framesData && framesData.frames && framesData.frames[currentFrameIndex]) {
      const frame = framesData.frames[currentFrameIndex];
      const hourStr = `${frame.hour.toString().padStart(2, '0')}:00`;
      if (onFrameUpdate) onFrameUpdate(hourStr);
    }
  }, [currentFrameIndex, framesData, onFrameUpdate]);

  // Compute Pedestrian Simulation Position along coordinates
  useEffect(() => {
    if (simulationMode === 'pedestrian_transit' && selectedRouteData && selectedRouteData.routes) {
      const route = selectedRouteData.routes[activeRouteKey];
      if (route && route.coordinates && route.coordinates.length > 1) {
        const coords = route.coordinates;
        const totalSegments = coords.length - 1;
        const exactIndex = pedestrianProgress * totalSegments;
        const segIndex = Math.min(totalSegments - 1, Math.floor(exactIndex));
        const segFrac = exactIndex - segIndex;

        const p1 = coords[segIndex];
        const p2 = coords[segIndex + 1];

        const currentPos = [
          p1[0] + (p2[0] - p1[0]) * segFrac,
          p1[1] + (p2[1] - p1[1]) * segFrac
        ];

        if (handlePedestrianChange) handlePedestrianChange(currentPos);
      }
    } else {
      if (handlePedestrianChange) handlePedestrianChange(null);
    }
  }, [pedestrianProgress, simulationMode, selectedRouteData, activeRouteKey, handlePedestrianChange]);

  const currentFrame = framesData?.frames?.[currentFrameIndex];
  const activeRoute = selectedRouteData?.routes?.[activeRouteKey];

  // Real-time HUD calculations for pedestrian
  const isCoolest = activeRouteKey === 'coolest';
  const instantaneousTemp = isCoolest
    ? 31.8 + Math.sin(pedestrianProgress * Math.PI) * 1.8
    : 38.5 + Math.sin(pedestrianProgress * Math.PI) * 2.2;
  const roadSurfaceHeat = isCoolest
    ? 35.4 + Math.sin(pedestrianProgress * Math.PI) * 4.0
    : 63.8 + Math.sin(pedestrianProgress * Math.PI) * 6.5;
  const currentShade = isCoolest ? 78 : 14;
  const cumulativeHeatDose = Math.round((pedestrianProgress * (activeRoute?.heat_exposure_score || 850)) * 1.2);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.45rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <Film size={20} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f3f4f6', margin: 0 }}>
              Urban Heat & Cool Route Simulation Video
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>
              24-Hour thermal timelapse and real-time pedestrian transit telemetry
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', background: 'rgba(31, 41, 55, 0.7)', borderRadius: '8px', padding: '0.2rem' }}>
          <button
            onClick={() => {
              setSimulationMode('heat_evolution');
              setIsPlaying(false);
            }}
            style={{
              background: simulationMode === 'heat_evolution' ? '#38bdf8' : 'transparent',
              color: simulationMode === 'heat_evolution' ? '#0f172a' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            24h Timelapse
          </button>
          <button
            onClick={() => {
              setSimulationMode('pedestrian_transit');
              setIsPlaying(false);
              setPedestrianProgress(0);
            }}
            style={{
              background: simulationMode === 'pedestrian_transit' ? '#10b981' : 'transparent',
              color: simulationMode === 'pedestrian_transit' ? '#0f172a' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Pedestrian Transit
          </button>
        </div>
      </div>

      {/* Video / Simulation HUD Display */}
      <div style={{
        background: 'radial-gradient(circle at top, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {simulationMode === 'heat_evolution' ? (
          <>
            {/* 24-Hour Diurnal Video HUD */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>
                  {currentFrame?.hour >= 6 && currentFrame?.hour <= 19 ? '☀️' : '🌙'}
                </span>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f3f4f6' }}>
                    {currentFrame?.time_label || '14:00 PM'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                    Diurnal Solar Flux: {Math.round((currentFrame?.solar_irradiance || 0) * 100)}%
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Average City Heat</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: currentFrame?.statistics?.avg_temp_c > 35 ? '#ef4444' : '#38bdf8' }}>
                  {formatTemp(currentFrame?.statistics?.avg_temp_c || 25.0, isFahrenheit ? 'F' : 'C')}
                </div>
              </div>
            </div>

            {/* Scrubber Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#6b7280', marginBottom: '0.2rem' }}>
                <span>00:00 (Night UHI)</span>
                <span style={{ color: '#f59e0b' }}>12:45 (Solar Noon)</span>
                <span style={{ color: '#ef4444' }}>15:30 (Peak Lag)</span>
                <span>23:00</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={currentFrameIndex}
                onChange={(e) => setCurrentFrameIndex(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Pedestrian Transit Simulation HUD */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  backgroundColor: isCoolest ? '#10b981' : '#ef4444',
                  color: '#0f172a',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px'
                }}>
                  {isCoolest ? '🟢 COOLEST ROUTE SIMULATION' : '🔴 FASTEST ROUTE SIMULATION'}
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f3f4f6', marginTop: '0.3rem' }}>
                  Progress: {Math.round(pedestrianProgress * 100)}%
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Cumulative Heat Dose</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isCoolest ? '#34d399' : '#f87171' }}>
                  {cumulativeHeatDose} <span style={{ fontSize: '0.7rem' }}>J/cm²</span>
                </div>
              </div>
            </div>

            {/* Pedestrian Live Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.7)', padding: '0.6rem', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Instantaneous Ambient</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: instantaneousTemp > 36 ? '#ef4444' : '#38bdf8' }}>
                  {formatTemp(instantaneousTemp, isFahrenheit ? 'F' : 'C')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Road Surface Heat</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fb923c' }}>
                  {formatTemp(roadSurfaceHeat, isFahrenheit ? 'F' : 'C')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Shade Protection</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                  {currentShade}%
                </div>
              </div>
            </div>

            {/* Progress Scrubber */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={pedestrianProgress}
              onChange={(e) => setPedestrianProgress(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: isCoolest ? '#10b981' : '#ef4444', cursor: 'pointer' }}
            />
          </>
        )}

        {/* Video Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? '#ef4444' : '#38bdf8',
                color: '#0f172a',
                fontWeight: 800,
                border: 'none',
                borderRadius: '8px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s'
              }}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? 'Pause' : 'Play Video'}</span>
            </button>

            <button
              onClick={() => {
                if (simulationMode === 'heat_evolution') setCurrentFrameIndex(0);
                else setPedestrianProgress(0);
                setIsPlaying(false);
              }}
              style={{
                background: 'rgba(31, 41, 55, 0.8)',
                color: '#d1d5db',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Playback Speed Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Speed:</span>
            {[1, 2, 4, 8].map((spd) => (
              <button
                key={`spd-${spd}`}
                onClick={() => setPlaybackSpeed(spd)}
                style={{
                  background: playbackSpeed === spd ? 'rgba(56, 189, 248, 0.3)' : 'rgba(31, 41, 55, 0.5)',
                  border: playbackSpeed === spd ? '1px solid #38bdf8' : '1px solid transparent',
                  color: playbackSpeed === spd ? '#38bdf8' : '#9ca3af',
                  padding: '0.2rem 0.45rem',
                  borderRadius: '5px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: playbackSpeed === spd ? 700 : 500
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
