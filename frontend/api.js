/**
 * HeatPath AI — API Client Service
 * Flat structure: frontend/api.js
 * Supports both default object and named exports
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err);
    throw err;
  }
}

// Named exports
export const getRoot = () => fetchJson('/');
export const getHealth = () => fetchJson('/api/health');
export const getReports = () => fetchJson('/api/reports');
export const getHeatStatus = () => fetchJson('/api/heat/status');
export const refreshHeatData = () => fetchJson('/api/heat/refresh', { method: 'POST' });
export const getHeatCurrent = (time = '14:00') => fetchJson(`/api/heat/current?time=${encodeURIComponent(time)}`);
export const getHeatHistory = () => fetchJson('/api/heat/history');

export const getHeatmap = (time = '14:00', gridResolution = 18) =>
  fetchJson(`/api/heatmap?time=${encodeURIComponent(time)}&grid_resolution=${gridResolution}`);

export const getLocationHeat = (lat, lng, time = '14:00') =>
  fetchJson(`/api/location?lat=${lat}&lng=${lng}&time=${encodeURIComponent(time)}`);

export const getNetwork = (time = '14:00') =>
  fetchJson(`/api/network?time=${encodeURIComponent(time)}`);

export const getNetworkNodes = () => fetchJson('/api/network/nodes');
export const fetchNetworkNodes = getNetworkNodes;

export const calculateRoute = (originId, destinationId, time = '14:00', profile = {}) =>
  fetchJson('/api/route/cooling', {
    method: 'POST',
    body: JSON.stringify({
      origin_id: originId,
      destination_id: destinationId,
      time,
      age: profile.age,
      age_group: profile.age_group || profile.id,
      worker_mode: profile.worker_mode || false,
      occupation: profile.occupation || 'construction',
      exertion_level: profile.exertion_level || 'moderate',
      max_acceptable_risk: profile.max_acceptable_risk || null,
    }),
  });
export const calculateRoutes = calculateRoute;

export const calculatePersonalizedRisk = (params) =>
  fetchJson('/api/risk/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });

export const getDailyHeatPlanner = (params = {}) => {
  const query = new URLSearchParams();
  if (params.age !== undefined && params.age !== null) query.append('age', params.age);
  if (params.age_group) query.append('age_group', params.age_group);
  if (params.worker_mode) query.append('worker_mode', 'true');
  if (params.occupation) query.append('occupation', params.occupation);
  if (params.exertion_level) query.append('exertion_level', params.exertion_level);
  return fetchJson(`/api/planner/daily?${query.toString()}`);
};

export const getWorkerSafetyRisk = (params = {}) => {
  const query = new URLSearchParams({
    occupation: params.occupation || 'construction',
    exertion_level: params.exertion_level || 'heavy',
    time: params.time || '14:00',
    exposure_minutes: params.exposure_minutes || 45,
  });
  return fetchJson(`/api/worker-risk?${query.toString()}`);
};

export const getRecommendations = (params = {}) => {
  const query = new URLSearchParams({
    age_group: params.age_group || 'adult',
    worker_mode: params.worker_mode ? 'true' : 'false',
    time: params.time || '14:00',
  });
  if (params.age) query.append('age', params.age);
  return fetchJson(`/api/recommendations?${query.toString()}`);
};

export const auditAssets = (time = '14:00') =>
  fetchJson(`/api/assets/audit?time=${encodeURIComponent(time)}`);

export const simulateInterventions = (params) =>
  fetchJson('/api/simulate', {
    method: 'POST',
    body: JSON.stringify(params),
  });

export const getSatelliteInfraredMeta = () => fetchJson('/api/satellite-infrared');

export const getSimulationVideoFrames = (
  gridResolution = 12,
  originId = 'N_CARSON_TRANSIT',
  destinationId = 'N_ESKENAZI_HEALTH',
  ageGroup = 'child',
  workerMode = false
) =>
  fetchJson(
    `/api/simulation-video/frames?grid_resolution=${gridResolution}&origin_id=${originId}&destination_id=${destinationId}&age_group=${ageGroup}&worker_mode=${workerMode}`
  );
export const fetchSimulationVideoFrames = getSimulationVideoFrames;

export const getAnalysisCharts = (time = '14:00') =>
  fetchJson(`/api/analysis/charts?time=${encodeURIComponent(time)}`);

export const askAIAgent = (query, context = null) =>
  fetchJson('/api/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ query, context }),
  });

// Default export object
export const api = {
  getRoot,
  getHealth,
  getReports,
  getHeatStatus,
  refreshHeatData,
  getHeatCurrent,
  getHeatHistory,
  getHeatmap,
  getLocationHeat,
  getNetwork,
  getNetworkNodes,
  fetchNetworkNodes,
  calculateRoute,
  calculateRoutes,
  calculatePersonalizedRisk,
  getDailyHeatPlanner,
  getWorkerSafetyRisk,
  getRecommendations,
  auditAssets,
  simulateInterventions,
  getSatelliteInfraredMeta,
  getSimulationVideoFrames,
  fetchSimulationVideoFrames,
  getAnalysisCharts,
  askAIAgent,
};

// Added aliases here
export const fetchAssetAudit = api.auditAssets;
export const simulateDigitalTwin = api.simulateInterventions;
export const fetchFortyGuardReports = api.getReports;

export default api;
