import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getTemperatureColor, getHeatRisk, THERMAL_PALETTES, formatTemp, RISK_THRESHOLDS } from './heatConstants';
import {
  Layers,
  Eye,
  Satellite,
  Flame,
  ShieldAlert,
  Navigation,
  Sparkles,
  Sliders,
  Trees,
  HardHat,
  Droplets,
  MapPin
} from 'lucide-react';

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

const createStationIcon = (riskColor) => {
  return L.divIcon({
    className: 'custom-station-icon',
    html: `<div style="background-color: ${riskColor}; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 12px ${riskColor};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const createCoolingShelterIcon = () => {
  return L.divIcon({
    className: 'custom-shelter-icon',
    html: `<div style="background: rgba(6, 78, 59, 0.95); border: 2px solid #10b981; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);">🌿</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const createAssetIcon = (badgeColor, type) => {
  const emoji = type === 'bus_stop' ? '🚏' : type === 'playground' ? '🛝' : type === 'hospital' ? '🏥' : type === 'school' ? '🏫' : '🏛️';
  return L.divIcon({
    className: 'custom-asset-icon',
    html: `<div style="background: rgba(17, 24, 39, 0.94); border: 2px solid ${badgeColor}; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.6);">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const createWaypointIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-waypoint-icon',
    html: `<div style="background: ${color}; color: #ffffff; font-weight: 800; font-size: 11px; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 0 10px ${color};">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createPedestrianIcon = () => {
  return L.divIcon({
    className: 'custom-pedestrian-icon',
    html: `<div style="background: #38bdf8; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 18px #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 12px;">🚶</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

// Shaded & Misting Cooling Shelter Assets
const COOLING_SHELTERS = [
  { id: 'SHELTER_01', name: 'Central Canal Riparian Underpass & Misting Pavilion', lat: 39.7702, lng: -86.1658, type: 'Misting Pavilion', cooling: '-4.8°C Relief', shade: '85% Canopy' },
  { id: 'SHELTER_02', name: 'Military Park Mature Oak Meadow Shade Arcade', lat: 39.7712, lng: -86.1720, type: 'Tree Canopy Oasis', cooling: '-5.2°C Relief', shade: '90% Canopy' },
  { id: 'SHELTER_03', name: 'White River State Promenade Waterway Spritz', lat: 39.7670, lng: -86.1710, type: 'River Corridor', cooling: '-3.9°C Relief', shade: '75% Canopy' },
  { id: 'SHELTER_04', name: 'Indiana Statehouse Plaza Shaded Misting Jets', lat: 39.7688, lng: -86.1627, type: 'Civic Cooling Station', cooling: '-4.1°C Relief', shade: '70% Canopy' },
  { id: 'SHELTER_05', name: 'Eskenazi Health Green Pergola Corridor', lat: 39.7760, lng: -86.1795, type: 'Hospital Green Buffer', cooling: '-4.5°C Relief', shade: '80% Canopy' }
];

// High-Risk & Low-Risk Zones
const RISK_ZONES = [
  { id: 'ZONE_HIGH_01', name: 'Downtown Unshaded Commercial Canyon', lat: 39.7684, lng: -86.1550, radius: 450, risk: 'EXTREME', color: '#ef4444', desc: 'Asphalt canyon with heavy HVAC heat exhaust.' },
  { id: 'ZONE_HIGH_02', name: 'West Logistics Freight Corridor', lat: 39.7240, lng: -86.1822, radius: 550, risk: 'EXTREME', color: '#ef4444', desc: 'Dark asphalt parking pads & diesel heat flux.' },
  { id: 'ZONE_LOW_01', name: 'Central Canal Riparian Cool Corridor', lat: 39.7700, lng: -86.1660, radius: 600, risk: 'SAFE', color: '#10b981', desc: 'Open waterway evaporative cooling & mature hardwood trees.' },
  { id: 'ZONE_LOW_02', name: 'Military Park & White River Greenbelt', lat: 39.7708, lng: -86.1700, radius: 500, risk: 'SAFE', color: '#10b981', desc: 'Dense tree canopy reducing ambient temps by up to 5.2°C.' }
];

export default function HeatMap({
  heatmapData,
  activeRoute,
  selectedRouteData,
  selectedRouteType = 'coolest',
  activeRouteKey = 'coolest',
  assetsData,
  digitalTwinResult,
  digitalTwinCoords,
  isFahrenheit = false,
  time = '14:00',
  selectedStation,
  setSelectedStation,
  transitPedestrianPos = null,
  simPedestrianPos = null,
  initialMapMode = 'dark'
}) {
  const [mapCenter, setMapCenter] = useState([39.7684, -86.1580]);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapMode, setMapMode] = useState(initialMapMode); // 'dark', 'satellite', 'infrared', 'street'
  const [activeLayerMode, setActiveLayerMode] = useState('heatmap'); // 'heatmap', 'cooling-path', 'risk-zones', 'cooling-areas', 'worker-safety'
  const [infraredPalette, setInfraredPalette] = useState('ironbow');
  const [infraredOpacity, setInfraredOpacity] = useState(0.65);

  const [showGrid, setShowGrid] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(false);

  const routeData = selectedRouteData || activeRoute;
  const currentRouteKey = selectedRouteType || activeRouteKey;
  const pedestrianPos = transitPedestrianPos || simPedestrianPos;

  // Auto-fit bounds if route selected
  useEffect(() => {
    if (routeData && routeData.routes && routeData.routes[currentRouteKey]) {
      const coords = routeData.routes[currentRouteKey].coordinates;
      if (coords && coords.length > 0) {
        setMapCenter(coords[Math.floor(coords.length / 2)]);
      }
    }
  }, [routeData, currentRouteKey]);

  // Recenter if digital twin coordinates change
  useEffect(() => {
    if (digitalTwinCoords && digitalTwinCoords.length === 2) {
      setMapCenter(digitalTwinCoords);
    }
  }, [digitalTwinCoords]);

  // Layer mode handler
  const handleLayerSwitch = (mode) => {
    setActiveLayerMode(mode);
    if (mode === 'heatmap') {
      setShowGrid(true);
      setShowRiskZones(false);
      setShowShelters(false);
    } else if (mode === 'cooling-path') {
      setShowGrid(true);
      setShowShelters(true);
      setShowRiskZones(false);
    } else if (mode === 'risk-zones') {
      setShowGrid(false);
      setShowRiskZones(true);
      setShowShelters(true);
    } else if (mode === 'cooling-areas') {
      setShowGrid(true);
      setShowShelters(true);
      setShowRiskZones(false);
    } else if (mode === 'worker-safety') {
      setShowGrid(true);
      setShowShelters(true);
      setShowRiskZones(true);
    }
  };

  // Base tile layer URL
  const getBaseTileUrl = () => {
    if (mapMode === 'satellite' || mapMode === 'infrared') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (mapMode === 'street') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '640px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      {/* ── Top Floating Layer & Basemap Switcher ── */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px',
        background: 'rgba(15, 23, 42, 0.90)',
        backdropFilter: 'blur(14px)',
        padding: '6px 10px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Five Requested Layer Switcher Modes */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'heatmap', label: 'Heatmap', icon: Flame },
            { id: 'cooling-path', label: 'Cooling Path', icon: Navigation },
            { id: 'risk-zones', label: 'Risk Zones', icon: ShieldAlert },
            { id: 'cooling-areas', label: 'Cooling Areas', icon: Trees },
            { id: 'worker-safety', label: 'Worker Safety', icon: HardHat }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeLayerMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleLayerSwitch(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '4px 8px',
                  borderRadius: '7px',
                  border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                  background: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: '0.73rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={13} color={isActive ? '#38bdf8' : '#94a3b8'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Basemap Options: Dark, Satellite (Google Earth style), FLIR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setMapMode('dark')}
            title="Dark Carto Basemap"
            style={{
              padding: '4px 7px',
              borderRadius: '6px',
              border: mapMode === 'dark' ? '1px solid #38bdf8' : '1px solid transparent',
              background: mapMode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: mapMode === 'dark' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🌙 Dark
          </button>

          <button
            onClick={() => setMapMode('satellite')}
            title="Satellite & 3D Earth Imagery"
            style={{
              padding: '4px 7px',
              borderRadius: '6px',
              border: mapMode === 'satellite' ? '1px solid #38bdf8' : '1px solid transparent',
              background: mapMode === 'satellite' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: mapMode === 'satellite' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🛰️ Satellite
          </button>

          <button
            onClick={() => setMapMode('infrared')}
            title="FLIR Calibrated Radiometric Heat Band"
            style={{
              padding: '4px 7px',
              borderRadius: '6px',
              border: mapMode === 'infrared' ? '1px solid #ef4444' : '1px solid transparent',
              background: mapMode === 'infrared' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
              color: mapMode === 'infrared' ? '#ef4444' : '#94a3b8',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔥 FLIR
          </button>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%', minHeight: '640px' }}
        attributionControl={false}
      >
        <ChangeView center={mapCenter} zoom={mapZoom} />

        {/* Base Tile Layer */}
        <TileLayer
          url={getBaseTileUrl()}
          maxZoom={19}
        />

        {/* 1. Thermal Grid Cells Layer */}
        {showGrid && heatmapData && heatmapData.grid_cells && (
          heatmapData.grid_cells.map((cell, idx) => {
            const risk = getHeatRisk(cell.temperature);
            const fillColor = mapMode === 'infrared'
              ? getTemperatureColor(cell.temperature)
              : risk.color;
            const fillOpacity = mapMode === 'infrared' ? infraredOpacity : 0.40;

            return (
              <Rectangle
                key={`cell-${idx}`}
                bounds={cell.bounds}
                pathOptions={{
                  fillColor: fillColor,
                  fillOpacity: fillOpacity,
                  weight: mapMode === 'infrared' ? 0.3 : 0.5,
                  color: mapMode === 'infrared' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <Popup>
                  <div style={{ padding: '0.25rem', minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#f3f4f6' }}>Thermal Matrix Node</strong>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: risk.color }}>{risk.icon} {risk.level}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.6 }}>
                      <div>🌡️ Ambient Heat: <strong style={{ color: '#ffffff' }}>{formatTemp(cell.temperature, isFahrenheit)}</strong></div>
                      <div>🔥 Surface Heat: <strong style={{ color: '#fb923c' }}>{formatTemp(cell.surface_temp, isFahrenheit)}</strong></div>
                      <div>💧 Heat Index: <strong style={{ color: '#38bdf8' }}>{formatTemp(cell.heat_index, isFahrenheit)}</strong></div>
                    </div>
                  </div>
                </Popup>
              </Rectangle>
            );
          })
        )}

        {/* 2. High-Risk & Low-Risk Zone Polygons */}
        {(showRiskZones || activeLayerMode === 'risk-zones' || activeLayerMode === 'worker-safety') && (
          RISK_ZONES.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                fillColor: zone.color,
                fillOpacity: 0.25,
                color: zone.color,
                weight: 2,
                dashArray: zone.risk === 'EXTREME' ? '4, 4' : undefined
              }}
            >
              <Popup>
                <div style={{ padding: '0.25rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: zone.color, textTransform: 'uppercase' }}>
                    {zone.risk === 'EXTREME' ? '⚠️ High-Risk Urban Heat Island' : '🌿 Low-Risk Urban Cool Oasis'}
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0.2rem 0', color: '#ffffff' }}>
                    {zone.name}
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0 }}>
                    {zone.desc}
                  </p>
                </div>
              </Popup>
            </Circle>
          ))
        )}

        {/* 3. Shaded & Misting Cooling Shelter Markers */}
        {(showShelters || activeLayerMode === 'cooling-areas' || activeLayerMode === 'cooling-path') && (
          COOLING_SHELTERS.map((sh) => (
            <Marker
              key={sh.id}
              position={[sh.lat, sh.lng]}
              icon={createCoolingShelterIcon()}
            >
              <Popup>
                <div style={{ padding: '0.25rem', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                    🌿 Cooling Refuge Station
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0.2rem 0', color: '#ffffff' }}>
                    {sh.name}
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#9ca3af', lineHeight: 1.5 }}>
                    <div>💧 Cooling Effect: <strong style={{ color: '#10b981' }}>{sh.cooling}</strong></div>
                    <div>🌳 Canopy Shading: <strong style={{ color: '#38bdf8' }}>{sh.shade}</strong></div>
                    <div>🏷️ Facility Type: {sh.type}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        )}

        {/* 4. FortyGuard Sensor Station Pins */}
        {showStations && heatmapData && heatmapData.stations && (
          heatmapData.stations.map((st) => {
            const risk = getHeatRisk(st.temperature);
            return (
              <Marker
                key={st.id}
                position={[st.lat, st.lng]}
                icon={createStationIcon(risk.color)}
                eventHandlers={{
                  click: () => {
                    if (setSelectedStation) setSelectedStation(st);
                  }
                }}
              >
                <Popup>
                  <div style={{ padding: '0.25rem', minWidth: '220px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                      FortyGuard Station • {st.id}
                    </div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0.2rem 0 0.4rem 0', color: '#ffffff' }}>
                      {st.name}
                    </h4>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.6 }}>
                      <div>🌡️ Ambient Temp: <strong style={{ color: '#ffffff' }}>{formatTemp(st.temperature, isFahrenheit)}</strong></div>
                      <div>🔥 Road Surface: <strong style={{ color: '#fb923c' }}>{formatTemp(st.surface_temp, isFahrenheit)}</strong></div>
                      <div>🌳 Canopy Coverage: <strong>{st.canopy_pct}%</strong></div>
                      <div>📐 Sky View Factor: <strong>{st.svf}</strong></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}

        {/* 5. Public Asset Markers */}
        {showAssets && assetsData && assetsData.assets && (
          assetsData.assets.map((asset) => (
            <Marker
              key={asset.id}
              position={[asset.lat, asset.lng]}
              icon={createAssetIcon(asset.urgency_color, asset.type)}
            >
              <Popup>
                <div style={{ padding: '0.25rem', minWidth: '230px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.68rem', color: asset.urgency_color, fontWeight: 700 }}>
                      Rank #{asset.rank} • {asset.badge}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f3f4f6' }}>
                      Score: {asset.priority_score}/100
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', margin: '0.2rem 0' }}>
                    {asset.name}
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
                    {asset.description}
                  </p>
                  <div style={{ background: 'rgba(31, 41, 55, 0.7)', padding: '0.35rem', borderRadius: '6px', fontSize: '0.74rem', color: '#d1d5db', marginBottom: '0.35rem' }}>
                    <div>🌡️ Temp: <strong>{formatTemp(asset.temperature_c, isFahrenheit)}</strong> | Shade: <strong>{asset.current_shade_pct}%</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        )}

        {/* 6. Active Routes Rendering */}
        {routeData && routeData.routes && (
          <>
            {Object.keys(routeData.routes).map((rKey) => {
              if (rKey === currentRouteKey) return null;
              const r = routeData.routes[rKey];
              if (!r || !r.coordinates) return null;
              return (
                <Polyline
                  key={`route-${rKey}`}
                  positions={r.coordinates}
                  pathOptions={{
                    color: r.color || '#6b7280',
                    weight: 4,
                    opacity: 0.35,
                    dashArray: '6, 6'
                  }}
                />
              );
            })}

            {routeData.routes[currentRouteKey] && routeData.routes[currentRouteKey].coordinates && (
              <>
                <Polyline
                  positions={routeData.routes[currentRouteKey].coordinates}
                  pathOptions={{
                    color: routeData.routes[currentRouteKey].color || '#10b981',
                    weight: 7,
                    opacity: 0.95
                  }}
                />

                {routeData.routes[currentRouteKey].coordinates.length > 0 && (
                  <>
                    <Marker
                      position={routeData.routes[currentRouteKey].coordinates[0]}
                      icon={createWaypointIcon('#3b82f6', 'A')}
                    >
                      <Popup><strong>Origin:</strong> {routeData.origin?.name || 'Origin'}</Popup>
                    </Marker>
                    <Marker
                      position={routeData.routes[currentRouteKey].coordinates[routeData.routes[currentRouteKey].coordinates.length - 1]}
                      icon={createWaypointIcon('#10b981', 'B')}
                    >
                      <Popup><strong>Destination:</strong> {routeData.destination?.name || 'Destination'}</Popup>
                    </Marker>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* 7. Pedestrian Simulation Marker */}
        {pedestrianPos && (
          <Marker position={pedestrianPos} icon={createPedestrianIcon()}>
            <Popup>
              <strong>🚶 Pedestrian Active Transit</strong>
            </Popup>
          </Marker>
        )}

        {/* 8. Digital Twin Simulation Intervention Zone */}
        {(digitalTwinResult?.target_location || digitalTwinCoords) && (
          <Circle
            center={digitalTwinResult?.target_location ? [digitalTwinResult.target_location.lat, digitalTwinResult.target_location.lng] : digitalTwinCoords}
            radius={350}
            pathOptions={{
              fillColor: '#10b981',
              fillOpacity: 0.35,
              color: '#34d399',
              weight: 2,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div style={{ padding: '0.2rem' }}>
                <strong style={{ color: '#34d399', fontSize: '0.85rem' }}>🌱 Digital Twin Cool Zone</strong>
                <p style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.2rem' }}>
                  {digitalTwinResult?.impact_metrics?.verdict || 'Active Microclimate Intervention Simulator'}
                </p>
              </div>
            </Popup>
          </Circle>
        )}
      </MapContainer>

      {/* Floating Centralized Map Legend */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        zIndex: 999,
        padding: '0.75rem 1rem',
        maxWidth: '340px',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <strong style={{ color: '#f3f4f6', fontSize: '0.8rem' }}>
            FortyGuard Thermal Risk Legend
          </strong>
          <span style={{ color: '#38bdf8', fontSize: '0.68rem', fontWeight: 700 }}>2-Hour Calibrated</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
            <span>Safe (0–25)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#facc15' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></span>
            <span>Moderate (26–50)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb923c' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }}></span>
            <span>High (51–75)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
            <span>Extreme (76–100)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
