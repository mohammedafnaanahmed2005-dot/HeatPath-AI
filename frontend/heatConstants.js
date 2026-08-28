/**
 * HeatPath AI — Centralized Heat Constants & Risk Configurations.
 * Defines thermal color scales, risk thresholds, age profiles,
 * worker exertion levels, and FLIR infrared palettes.
 */

// ─── Risk Score Thresholds (0 - 100) ───────────────────────────────
export const RISK_THRESHOLDS = {
  safe: { min: 0, max: 25, label: 'SAFE', color: '#10b981', badge: 'Comfortable', icon: '🟢' },
  moderate: { min: 26, max: 50, label: 'MODERATE', color: '#eab308', badge: 'Caution', icon: '🟡' },
  high: { min: 51, max: 75, label: 'HIGH', color: '#f97316', badge: 'Extreme Caution', icon: '🟠' },
  extreme: { min: 76, max: 100, label: 'EXTREME', color: '#ef4444', badge: 'Danger', icon: '🔴' }
};

// ─── Age Profile Categories (Non-Overlapping) ─────────────────────
export const AGE_PROFILES = [
  {
    id: 'infant',
    label: 'Newborn / Infant',
    shortLabel: 'Infant',
    ageRange: '0–3 years',
    ageMin: 0,
    ageMax: 3,
    defaultAge: 2,
    emoji: '👶',
    riskLevel: 'VERY HIGH',
    badgeColor: '#ef4444',
    description: 'Immature thermoregulation; cannot self-hydrate or escape heat without caregiver.'
  },
  {
    id: 'child',
    label: 'Children',
    shortLabel: 'Child',
    ageRange: '4–15 years',
    ageMin: 4,
    ageMax: 15,
    defaultAge: 10,
    emoji: '🧒',
    riskLevel: 'HIGH',
    badgeColor: '#f97316',
    description: 'Higher metabolic heat generation per mass; prone to forgetting hydration during play.'
  },
  {
    id: 'young_adult',
    label: 'Teenagers / Young Adults',
    shortLabel: 'Teen / Youth',
    ageRange: '16–22 years',
    ageMin: 16,
    ageMax: 22,
    defaultAge: 18,
    emoji: '🧑',
    riskLevel: 'MODERATE–HIGH',
    badgeColor: '#eab308',
    description: 'Active urban commuters & student athletes; vulnerable during intense midday exertion.'
  },
  {
    id: 'adult',
    label: 'Adults',
    shortLabel: 'Adult',
    ageRange: '23–50 years',
    ageMin: 23,
    ageMax: 50,
    defaultAge: 35,
    emoji: '👨',
    riskLevel: 'MODERATE',
    badgeColor: '#38bdf8',
    description: 'Standard baseline tolerance; heat stress increases with commute duration and solar load.'
  },
  {
    id: 'older_adult',
    label: 'Older Adults',
    shortLabel: 'Older Adult',
    ageRange: '51–100 years',
    ageMin: 51,
    ageMax: 100,
    defaultAge: 65,
    emoji: '👴',
    riskLevel: 'VERY HIGH',
    badgeColor: '#ef4444',
    description: 'Reduced sweat gland response and cardiovascular reserve; elevated risk of heat stroke.'
  },
  {
    id: 'worker',
    label: 'Outdoor Worker Mode',
    shortLabel: 'Outdoor Worker',
    ageRange: 'Occupational Risk',
    ageMin: 18,
    ageMax: 70,
    defaultAge: 32,
    emoji: '👷',
    riskLevel: 'VERY HIGH OCCUPATIONAL',
    badgeColor: '#f59e0b',
    description: 'Construction, road paving, and delivery personnel subject to sustained high heat flux.'
  }
];

// ─── Worker Occupations & Physical Exertion Levels ─────────────────
export const WORKER_OCCUPATIONS = [
  { id: 'construction', label: 'Construction Worker', icon: '🏗️', defaultExertion: 'heavy' },
  { id: 'road_worker', label: 'Road & Paving Worker', icon: '🚧', defaultExertion: 'heavy' },
  { id: 'delivery', label: 'Delivery & Courier Worker', icon: '📦', defaultExertion: 'moderate' },
  { id: 'traffic_worker', label: 'Traffic & Parking Worker', icon: '🚦', defaultExertion: 'moderate' },
  { id: 'street_vendor', label: 'Street Vendor / Merchant', icon: '🛒', defaultExertion: 'light' },
  { id: 'maintenance', label: 'Outdoor Maintenance Worker', icon: '🧹', defaultExertion: 'moderate' }
];

export const PHYSICAL_EXERTION_LEVELS = [
  { id: 'light', label: 'Light Outdoor Work', desc: 'Standing, inspecting, light tool handling', mult: '1.15x' },
  { id: 'moderate', label: 'Moderate Labor', desc: 'Continuous walking, carrying <20 lbs, equipment handling', mult: '1.35x' },
  { id: 'heavy', label: 'Heavy Physical Work', desc: 'Roofing, shoveling, paving, heavy lifting', mult: '1.60x' }
];

// ─── Thermal Palettes ──────────────────────────────────────────────
export const THERMAL_PALETTES = {
  ironbow: ['#00002a', '#1a0046', '#4b0082', '#8b0000', '#cd3700', '#ff6500', '#ffaa00', '#ffff00', '#ffffff'],
  inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d03c', '#fcffa4'],
  turbo: ['#30123b', '#4662d7', '#36aaf9', '#1ae4b6', '#72fe5e', '#c8ef34', '#faba39', '#f66b19', '#ca2a04', '#7a0403'],
  classic: ['#0000ff', '#00ccff', '#00ff00', '#ffff00', '#ff8800', '#ff0000', '#cc0000']
};

export function getTemperatureColor(tempC) {
  if (tempC < 24) return '#38bdf8';
  if (tempC < 29) return '#10b981';
  if (tempC < 33) return '#eab308';
  if (tempC < 37) return '#f97316';
  return '#ef4444';
}

export function getHeatRisk(tempC) {
  if (tempC < 29) return { level: 'SAFE', color: '#10b981', badge: 'Comfortable', icon: '🟢' };
  if (tempC < 33) return { level: 'MODERATE', color: '#eab308', badge: 'Caution', icon: '🟡' };
  if (tempC < 37) return { level: 'HIGH', color: '#f97316', badge: 'Extreme Caution', icon: '🟠' };
  return { level: 'EXTREME', color: '#ef4444', badge: 'Danger', icon: '🔴' };
}

export function formatTemp(tempC, isFahrenheit = false) {
  if (tempC === null || tempC === undefined || isNaN(tempC)) return '--';
  if (isFahrenheit) {
    const f = (tempC * 9) / 5 + 32;
    return `${f.toFixed(1)}°F`;
  }
  return `${Number(tempC).toFixed(1)}°C`;
}
