# HeatPath AI — Urban Heat Decision Intelligence Platform
### Track 1: Resilient Cities & Infrastructure • FortyGuard Global Hackathon

HeatPath AI is an AI-powered personalized urban heat safety and cooling-path platform powered by **FortyGuard microclimate intelligence**. By fusing empirical telemetry from 9 Indianapolis FortyGuard Heat Intelligence Reports, physical microclimate models, and thermodynamic principles, HeatPath AI delivers personalized, age-aware heat vulnerability assessments, shaded cooling route pathfinding, outdoor worker safety monitoring, and a 24-hour daily heat planner.

---

## 🌟 Key Features

### 1. 👶 Personalized Age-Based Heat Risk Engine
- **Non-Overlapping Age Brackets**:
  - **Newborn / Infant (0–3 yrs)**: Very High vulnerability (1.55x modifier).
  - **Children (4–15 yrs)**: High vulnerability (1.30x modifier).
  - **Teenagers / Young Adults (16–22 yrs)**: Moderate–High vulnerability (1.05x modifier).
  - **Adults (23–50 yrs)**: Baseline Moderate vulnerability (1.00x modifier).
  - **Older Adults (51–100 yrs)**: Very High vulnerability (1.45x modifier).
- **Explainable 0–100 Risk Score**:
  $$\text{Personalized Risk} = \text{EnvHeatScore} \times \text{AgeVulnerability} \times \text{WorkerExertion} \times \text{ExposureDurationMod} \times \text{ShadeRelief}$$
- Categorized into **SAFE (0–25)**, **MODERATE (26–50)**, **HIGH (51–75)**, and **EXTREME (76–100)**.

### 2. 👷 Construction & Outdoor Worker Safety Mode
- Occupational heat index & Wet-Bulb Globe Temperature (WBGT) monitoring.
- Occupational profiles: Construction, Road Paving, Delivery Courier, Traffic, Vendor, Maintenance.
- Physical exertion multipliers: Light (1.15x), Moderate (1.35x), Heavy (1.60x).
- Adaptive work/rest duty cycles (e.g., 45m work / 15m rest, 30m / 30m in high heat).
- Active continuous exposure stopwatch and nearest shaded cooling refuge navigation.

### 3. 🌿 Heat-Aware Cooling Path Routing (Heat-Aware A*)
- Multi-objective pathfinding minimizing both walking distance and cumulative physiological thermal strain.
- Shaded canopy routing through Indianapolis Central Canal towpath and Military Park cuts thermal exposure by **up to 56%** while adding minimal walking time.
- Dynamic route penalties when road segments exceed user-configured risk thresholds.

### 4. ⏱️ Robust 2-Hour FortyGuard Data Refresh (`UPDATE_INTERVAL = 7200s`)
- Automated 2-hour data synchronization cycles with live/cached status tracking.
- Transparent UI indicators: *"Last updated: X minutes ago"* and *"Next update: approximately Y minutes"*.
- Secure backend credential handling preventing API key exposure.

### 5. 📅 24-Hour Daily Heat Planner
- Dynamic hourly microclimate recommendations across 6 diurnal periods:
  1. **6 AM – 9 AM**: Early Morning
  2. **9 AM – 12 PM**: Late Morning
  3. **12 PM – 3 PM**: Midday Peak Solar Heat
  4. **3 PM – 6 PM**: Late Afternoon Thermal Lag
  5. **6 PM – 9 PM**: Evening Cooling
  6. **9 PM – 6 AM**: Overnight Ambient
- Period-specific activity level guidance, hydration targets, and shaded waypoints.

### 6. 🛰️ Multi-Layer Map Suite & FLIR Radiometry
- Layer toggles: `[Heatmap]`, `[Cooling Path]`, `[Risk Zones]`, `[Cooling Areas]`, `[Worker Safety]`.
- Basemaps: Dark Carto, Satellite / 3D Google Earth Imagery, and calibrated FLIR Infrared thermal spectrum (Ironbow, Inferno, Turbo).

---

## 🏛️ System Architecture

```
                               ┌─────────────────────────────┐
                               │   FortyGuard Microclimate   │
                               │  9 Reports + API Telemetry  │
                               └──────────────┬──────────────┘
                                              │ (2-Hour Cycle / 7200s)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FastAPI Backend (Python)                               │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ fortyguard_service.py│    risk_engine.py    │   daily_planner.py│      routing.py      │
│ • 2-Hour Sync Engine │ • Age Vulnerability  │ • 6 Diurnal Blocks│ • Heat-Aware A*      │
│ • Station Matrices   │ • Worker Exertion    │ • Period Advisory │ • Cooling Path Comp  │
│ • Thermal Cache      │ • 0-100 Score Model  │ • Hydration Target│ • Network Nodes/Edges│
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
                                              │
                                   REST JSON Endpoints
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Vite + React Frontend (Flat UI)                           │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ HeatSafetyProfileBar │ PersonalizedDashboard│ DailyHeatPlanner  │  WorkerSafetyPanel   │
│ • 6 Quick Profiles   │ • 0-100 Risk Gauge   │ • 24H Timeline    │ • Work/Rest Status   │
│ • Age Slider (0-100) │ • 2-Hour Countdown   │ • Activity Advice │ • Exposure Stopwatch │
│ • Worker Multipliers │ • Contextual Alerts  │ • Shaded Shelters │ • Hydration Tracker  │
├──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┤
│ HeatMap.jsx: Leaflet + Satellite & Google Earth Basemaps + FLIR Radiometry Overlay     │
│ HackathonDemoModal.jsx: 1-Click Step-by-Step Interactive Judge Scenario Stepper        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root service metadata and feature discovery |
| `GET` | `/api/health` | Service health, cache state, and update telemetry |
| `GET` | `/api/heat/status` | 2-hour update timer status, elapsed/remaining minutes |
| `POST` | `/api/heat/refresh` | Triggers immediate FortyGuard data refresh cycle |
| `GET` | `/api/heat/current` | Real-time metropolitan thermal readings |
| `GET` | `/api/heat/history` | 24-hour diurnal thermal curve history |
| `POST` | `/api/risk/calculate` | Calculates personalized 0–100 risk score and advisories |
| `GET` | `/api/recommendations` | Tailored safety recommendations by age and profile |
| `GET` | `/api/worker-risk` | Dedicated Outdoor Worker Safety and work/rest schedule |
| `GET` | `/api/planner/daily` | 24-hour Daily Heat Planner across 6 diurnal periods |
| `POST` | `/api/route/cooling` | Heat-Aware A* pathfinding (Fastest vs Cooling Path) |
| `GET` | `/api/network/nodes` | Road network waypoints for route dropdowns |
| `GET` | `/api/heatmap` | 24-hour thermal grid cells and station pins |
| `GET` | `/api/reports` | Comprehensive dataset from 9 FortyGuard reports |
| `GET` | `/api/assets/audit` | Public asset vulnerability ranking & priority score |
| `POST` | `/api/simulate` | Digital Twin microclimate cooling simulator |
| `GET` | `/api/simulation-video/frames` | 24-frame timelapse video data with pedestrian transit |
| `GET` | `/api/analysis/charts` | Precomputed analytical datasets for thermal curves |
| `POST` | `/api/ai/ask` | Explainable AI Heat Planning Agent |

---

## 🔐 Environment Variables (`.env`)

Create a `.env` file in the root or `backend/` directory:

```env
# FortyGuard API Configuration
FORTYGUARD_API_KEY=your_fortyguard_api_key_here
FORTYGUARD_API_URL=https://api.fortyguard.com/v1

# Server Port
PORT=8000
HOST=127.0.0.1
```

*(If `FORTYGUARD_API_KEY` is omitted, the system seamlessly uses calibrated FortyGuard 9-station empirical matrices with zero disruptions).*

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** and `npm`

### 2. Run Backend
```powershell
# In project root
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

### 3. Run Frontend
```powershell
# In project root
cd frontend
npm install
npm run dev
```
Frontend Web Application accessible at: `http://localhost:5173`

### 4. Run Backend Tests
```powershell
# In project root
python -m pytest backend/test_backend.py -v
```

---

## 🏆 Hackathon Demo Scenario Instructions

To demonstrate the platform to judges:

1. Click the **"🏆 Demo Flow"** button in the top right navbar to open the interactive walkthrough modal.
2. Step 1: Open HeatPath AI and observe Indianapolis baseline thermal map (>38°C on downtown asphalt).
3. Step 2: Select **🧒 Child (4–15 yrs, Age 10)** in the Safety Profile Bar. Notice how risk elevates to **HIGH (Score 72/100)** due to age vulnerability.
4. Step 3: Set departure time to **2:00 PM** (Peak solar heat).
5. Step 4: Click **"Cool Routes"** tab. Observe how the **Cooling Path** routes commuters through the Canal Towpath and Military Park canopy, reducing thermal stress by **56%**.
6. Step 5: Switch to **👷 Outdoor Worker Mode (Heavy Work)**. Observe the active **Work/Rest Protocol (30m work / 30m rest)**, fluid schedule (40 oz/hr), and exposure stopwatch.
7. Step 6: Switch to **👴 Older Adult (51–100 yrs, Age 65)**. View heightened vulnerability advisories and heat avoidance warnings.
8. Step 7: Check the top right **2-Hour FortyGuard Update Badge** showing real-time cache freshness and next scheduled sync countdown.

---

## ⚖️ Safety Disclaimer
General urban heat safety recommendations provided for awareness and decision support. Not intended as occupational regulation compliance or medical diagnosis/treatment.
