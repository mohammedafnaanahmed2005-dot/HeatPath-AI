import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import HourlySlider from './HourlySlider';
import HeatSafetyProfileBar from './HeatSafetyProfileBar';
import PersonalizedDashboard from './PersonalizedDashboard';
import DailyHeatPlanner from './DailyHeatPlanner';
import WorkerSafetyPanel from './WorkerSafetyPanel';
import HeatMap from './HeatMap';
import RoutePlanner from './RoutePlanner';
import SimulationVideo from './SimulationVideo';
import ThermalAnalysisGraphs from './ThermalAnalysisGraphs';
import AssetHeatAudit from './AssetHeatAudit';
import DigitalTwinSandbox from './DigitalTwinSandbox';
import ReportsIntelligence from './ReportsIntelligence';
import AIAgentAdvisor from './AIAgentAdvisor';
import HackathonDemoModal from './HackathonDemoModal';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [time, setTime] = useState('14:00');
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  // Personalized Heat Safety Profile State
  const [userProfile, setUserProfile] = useState({
    id: 'child',
    age: 10,
    age_group: 'child',
    worker_mode: false,
    occupation: 'construction',
    exertion_level: 'moderate'
  });

  const [heatmapData, setHeatmapData] = useState(null);
  const [heatStatus, setHeatStatus] = useState(null);
  const [assetsData, setAssetsData] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedRouteType, setSelectedRouteType] = useState('coolest');
  const [selectedStation, setSelectedStation] = useState(null);
  const [digitalTwinResult, setDigitalTwinResult] = useState(null);
  const [digitalTwinCoords, setDigitalTwinCoords] = useState(null);
  const [transitPedestrianPos, setTransitPedestrianPos] = useState(null);

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Fetch Heatmap Grid data, Public Assets, and 2-Hour FortyGuard Status
  const loadData = async () => {
    try {
      const [hData, sData, aData] = await Promise.all([
        api.getHeatmap(time, 18),
        api.getHeatStatus().catch(() => null),
        api.auditAssets(time).catch(() => null)
      ]);
      setHeatmapData(hData);
      if (sData) setHeatStatus(sData);
      if (aData) setAssetsData(aData);
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [time]);

  // Periodic heartbeat for 2-hour update timer (every 30s)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const sData = await api.getHeatStatus();
        if (sData) setHeatStatus(sData);
      } catch (e) {
        // ignore background poll error
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleDemoStepApply = (stepConfig) => {
    if (stepConfig.tab) setActiveTab(stepConfig.tab);
    if (stepConfig.time) setTime(stepConfig.time);
    if (stepConfig.profile) setUserProfile((prev) => ({ ...prev, ...stepConfig.profile }));
    if (stepConfig.routeType) setSelectedRouteType(stepConfig.routeType);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFahrenheit={isFahrenheit}
        setIsFahrenheit={setIsFahrenheit}
        currentStats={heatmapData?.statistics}
        heatStatus={heatStatus}
        onOpenDemo={() => setIsDemoModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '16px 20px', maxWidth: '1800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Heat Safety Profile Filter Bar */}
        <HeatSafetyProfileBar
          userProfile={userProfile}
          onProfileChange={setUserProfile}
          onApplyProfile={(p) => {
            setUserProfile(p);
            loadData();
          }}
        />

        {/* Diurnal 24H Time Scrubber Bar */}
        <HourlySlider
          time={time}
          setTime={setTime}
          currentTime={time}
          onTimeChange={setTime}
          hourLabel={heatmapData?.hour_label}
          stats={heatmapData?.statistics}
          isFahrenheit={isFahrenheit}
        />

        {/* Tab 0: Personalized Safety Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px', minHeight: '650px' }}>
            <PersonalizedDashboard
              userProfile={userProfile}
              time={time}
              isFahrenheit={isFahrenheit}
              activeRoute={activeRoute}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefreshData={loadData}
            />
            <div style={{ height: '100%', minHeight: '580px' }}>
              <HeatMap
                heatmapData={heatmapData}
                activeRoute={activeRoute}
                selectedRouteData={activeRoute}
                selectedRouteType={selectedRouteType}
                activeRouteKey={selectedRouteType}
                assetsData={assetsData}
                isFahrenheit={isFahrenheit}
                time={time}
                selectedStation={selectedStation}
                setSelectedStation={setSelectedStation}
                transitPedestrianPos={transitPedestrianPos}
              />
            </div>
          </div>
        )}

        {/* Tab 1: Cool Routes View (Interactive Map + Route Planner) */}
        {activeTab === 'cool-routes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', minHeight: '650px' }}>
            <HeatMap
              heatmapData={heatmapData}
              activeRoute={activeRoute}
              selectedRouteData={activeRoute}
              selectedRouteType={selectedRouteType}
              activeRouteKey={selectedRouteType}
              assetsData={assetsData}
              isFahrenheit={isFahrenheit}
              time={time}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              transitPedestrianPos={transitPedestrianPos}
            />
            <RoutePlanner
              time={time}
              currentTime={time}
              isFahrenheit={isFahrenheit}
              userProfile={userProfile}
              onRouteCalculated={(routeData) => setActiveRoute(routeData)}
              selectedRouteType={selectedRouteType}
              setSelectedRouteType={setSelectedRouteType}
              activeRouteKey={selectedRouteType}
              setActiveRouteKey={setSelectedRouteType}
              routeResult={activeRoute}
            />
          </div>
        )}

        {/* Tab 2: Worker Safety Mode */}
        {activeTab === 'worker-safety' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px', minHeight: '650px' }}>
            <WorkerSafetyPanel
              userProfile={userProfile}
              onProfileChange={setUserProfile}
              time={time}
              isFahrenheit={isFahrenheit}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
            <div style={{ height: '100%', minHeight: '580px' }}>
              <HeatMap
                heatmapData={heatmapData}
                activeRoute={activeRoute}
                selectedRouteData={activeRoute}
                selectedRouteType={selectedRouteType}
                activeRouteKey={selectedRouteType}
                assetsData={assetsData}
                isFahrenheit={isFahrenheit}
                time={time}
                selectedStation={selectedStation}
                setSelectedStation={setSelectedStation}
                transitPedestrianPos={transitPedestrianPos}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Daily Heat Planner */}
        {activeTab === 'daily-planner' && (
          <DailyHeatPlanner
            userProfile={userProfile}
            isFahrenheit={isFahrenheit}
            currentTime={time}
            onSelectPeriodTime={(newTime) => setTime(newTime)}
          />
        )}

        {/* Tab 4: Satellite & Infrared (FLIR) View */}
        {activeTab === 'satellite-infrared' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  🛰️ Satellite Imagery & FLIR Thermal Radiometry Suite
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  High-resolution Earth Imagery fused with calibrated radiometric thermal bands (Ironbow, Inferno, Turbo)
                </p>
              </div>
              <div className="badge badge-extreme">FLIR Spectrum Calibrated</div>
            </div>
            <div style={{ height: '700px' }}>
              <HeatMap
                heatmapData={heatmapData}
                activeRoute={activeRoute}
                selectedRouteData={activeRoute}
                selectedRouteType={selectedRouteType}
                activeRouteKey={selectedRouteType}
                assetsData={assetsData}
                isFahrenheit={isFahrenheit}
                time={time}
                selectedStation={selectedStation}
                setSelectedStation={setSelectedStation}
                initialMapMode="infrared"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Simulation Video & Pedestrian Transit */}
        {activeTab === 'simulation-video' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
            <SimulationVideo
              isFahrenheit={isFahrenheit}
              selectedRouteData={activeRoute}
              activeRouteKey={selectedRouteType}
              onFrameUpdate={(frameTime) => setTime(frameTime)}
              onTransitStep={(coords) => setTransitPedestrianPos(coords)}
              onPedestrianUpdate={(coords) => setTransitPedestrianPos(coords)}
            />
            <div style={{ height: '100%', minHeight: '550px' }}>
              <HeatMap
                heatmapData={heatmapData}
                activeRoute={activeRoute}
                selectedRouteData={activeRoute}
                selectedRouteType={selectedRouteType}
                activeRouteKey={selectedRouteType}
                assetsData={assetsData}
                isFahrenheit={isFahrenheit}
                time={time}
                transitPedestrianPos={transitPedestrianPos}
                simPedestrianPos={transitPedestrianPos}
              />
            </div>
          </div>
        )}

        {/* Tab 6: Thermal Analysis & Graphs Dashboard */}
        {activeTab === 'analysis-graphs' && (
          <ThermalAnalysisGraphs isFahrenheit={isFahrenheit} />
        )}

        {/* Tab 7: Public Asset Heat Audit */}
        {activeTab === 'asset-audit' && (
          <AssetHeatAudit time={time} isFahrenheit={isFahrenheit} />
        )}

        {/* Tab 8: Digital Twin Microclimate Sandbox */}
        {activeTab === 'digital-twin' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <DigitalTwinSandbox
              time={time}
              isFahrenheit={isFahrenheit}
              onSimulateLocation={(coords, result) => {
                setDigitalTwinCoords(coords);
                if (result) setDigitalTwinResult(result);
              }}
            />
            <div style={{ height: '100%', minHeight: '550px' }}>
              <HeatMap
                heatmapData={heatmapData}
                assetsData={assetsData}
                isFahrenheit={isFahrenheit}
                time={time}
                digitalTwinCoords={digitalTwinCoords}
                digitalTwinResult={digitalTwinResult}
              />
            </div>
          </div>
        )}

        {/* Tab 9: FortyGuard 9 Reports Intelligence */}
        {activeTab === 'reports' && (
          <ReportsIntelligence isFahrenheit={isFahrenheit} />
        )}

        {/* Tab 10: Explainable AI Advisor */}
        {activeTab === 'ai-advisor' && (
          <AIAgentAdvisor />
        )}
      </main>

      {/* Interactive Hackathon Judge Demo Walkthrough Modal */}
      <HackathonDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onApplyStep={handleDemoStepApply}
        userProfile={userProfile}
        time={time}
      />
    </div>
  );
}
