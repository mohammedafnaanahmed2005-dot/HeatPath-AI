import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  RotateCcw,
  Shield,
  Navigation,
  HardHat,
  HeartPulse,
  Clock,
  X
} from 'lucide-react';

export default function HackathonDemoModal({
  isOpen,
  onClose,
  onApplyStep = () => {},
  userProfile,
  time = '14:00'
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const DEMO_STEPS = [
    {
      step: 1,
      title: 'Open HeatPath AI & Set Base Urban Heat',
      desc: 'HeatPath AI fuses FortyGuard 9-station microclimate data across Indianapolis, revealing severe urban heat island zones (>38°C on asphalt).',
      actionLabel: 'Initialize Profile',
      apply: () => onApplyStep({ tab: 'dashboard', time: '14:00', profile: { id: 'adult', age: 35, worker_mode: false } })
    },
    {
      step: 2,
      title: 'Select Vulnerable Profile: 🧒 Child (4–15 yrs, Age 10)',
      desc: 'Children have higher metabolic heat generation and thinner skin, elevating baseline risk from MODERATE to HIGH.',
      actionLabel: 'Apply Child Profile',
      apply: () => onApplyStep({ tab: 'dashboard', time: '14:00', profile: { id: 'child', age: 10, worker_mode: false } })
    },
    {
      step: 3,
      title: 'Select Peak Heat Departure Time: 2:00 PM',
      desc: 'Diurnal solar radiation peaks around midday, producing extreme surface temperatures exceeding 62°C on downtown commercial asphalt.',
      actionLabel: 'Set Time to 2:00 PM',
      apply: () => onApplyStep({ tab: 'cool-routes', time: '14:00', profile: { id: 'child', age: 10, worker_mode: false } })
    },
    {
      step: 4,
      title: 'Generate Heat-Aware Cooling Path vs Fastest Route',
      desc: 'Heat-Aware A* pathfinding calculates a shaded route through the historic Central Canal and Military Park canopy, slashing cumulative heat stress by 56%.',
      actionLabel: 'Inspect Cooling Path',
      apply: () => onApplyStep({ tab: 'cool-routes', time: '14:00', routeType: 'coolest', profile: { id: 'child', age: 10, worker_mode: false } })
    },
    {
      step: 5,
      title: 'Switch to 👷 Outdoor Worker Mode (Heavy Labor)',
      desc: 'Occupational metabolic heat flux from continuous physical labor adds an additional 1.6x risk multiplier, requiring proactive work/rest duty cycles.',
      actionLabel: 'Activate Worker Mode',
      apply: () => onApplyStep({ tab: 'worker-safety', time: '14:00', profile: { id: 'worker', age: 32, worker_mode: true, occupation: 'construction', exertion_level: 'heavy' } })
    },
    {
      step: 6,
      title: 'Switch to 👴 Older Adult (51–100 yrs, Age 65)',
      desc: 'Older adults face 1.45x vulnerability due to reduced cardiovascular reserve, triggering emergency heat avoidance warnings.',
      actionLabel: 'Switch to Older Adult',
      apply: () => onApplyStep({ tab: 'dashboard', time: '14:00', profile: { id: 'older_adult', age: 65, worker_mode: false } })
    },
    {
      step: 7,
      title: 'Verify 2-Hour FortyGuard Live Data Refresh (7200s)',
      desc: 'Automated 2-hour synchronization cycles ensure thermal matrices and route heat costs stay calibrated to evolving urban microclimates.',
      actionLabel: 'View FortyGuard Sync Status',
      apply: () => onApplyStep({ tab: 'reports', time: '14:00' })
    }
  ];

  if (!isOpen) return null;

  const current = DEMO_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      DEMO_STEPS[nextStep].apply();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      DEMO_STEPS[prevStep].apply();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '1.75rem',
          borderRadius: '20px',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)', padding: '0.45rem', borderRadius: '10px' }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                FortyGuard Hackathon Demo Scenario
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Step {current.step} of {DEMO_STEPS.length}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%`,
            height: '100%',
            backgroundColor: '#38bdf8',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Step Content */}
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
            Demo Milestone {current.step}
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            {current.title}
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
            {current.desc}
          </p>
        </div>

        {/* Navigation Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: currentStep === 0 ? '#64748b' : '#cbd5e1',
              padding: '0.5rem 0.9rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            <span>Previous</span>
          </button>

          <button
            onClick={currentStep === DEMO_STEPS.length - 1 ? onClose : handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '0.5rem 1.1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
            }}
          >
            <span>{currentStep === DEMO_STEPS.length - 1 ? 'Finish Demo' : current.actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
