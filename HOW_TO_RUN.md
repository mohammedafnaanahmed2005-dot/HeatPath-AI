# 🚀 HeatPath AI — Complete Run & Free Deployment Guide
### Track 1: Resilient Cities & Infrastructure • FortyGuard Global Hackathon

This guide provides complete instructions for running HeatPath AI locally, executing all automated test suites, and deploying the platform for **100% free** on **Vercel**, **Streamlit Community Cloud**, **Render**, or **Railway**.

---

## 💻 1. How to Run Locally

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** and `npm`

---

### Step A: Start the FastAPI Backend
Open a terminal in the project root:

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Endpoint:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **API Health Check:** `http://127.0.0.1:8000/api/health`

---

### Step B: Start the React + Vite Frontend
Open a second terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

- **Web Application URL:** `http://localhost:5173`

---

### Step C: Run the Full Backend Test Suite
```powershell
python -m pytest backend/test_backend.py -v
```

*(All 16 unit tests will execute and pass in < 0.2s).*

---

## 🌐 2. Free Cloud Deployment Options

### Option 1: Deploy Frontend on Vercel (100% Free)

HeatPath AI includes pre-configured `vercel.json` files for zero-configuration deployment on Vercel.

1. Push this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New Project"** and select your GitHub repository.
4. **Configuration Settings:**
   - **Root Directory:** `frontend` (or leave default if deploying root with root `vercel.json`)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables (Optional):**
     - `VITE_API_URL`: URL of your deployed backend (e.g. `https://heatpath-api.onrender.com`)
5. Click **"Deploy"**. Your app will be live on `https://your-project.vercel.app` in under 60 seconds!

---

### Option 2: Deploy Backend on Render (100% Free)

1. Go to [render.com](https://render.com) and create a free account.
2. Click **"New +"** $\to$ **"Web Service"**.
3. Connect your GitHub repository.
4. **Settings:**
   - **Name:** `heatpath-api`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free
5. Click **"Create Web Service"**.
6. Copy your Render URL (e.g., `https://heatpath-api.onrender.com`) and paste it as `VITE_API_URL` in your Vercel frontend settings.

---

### Option 3: Deploy Streamlit App on Streamlit Community Cloud (100% Free, 1-Click)

The repository includes a ready-to-run `streamlit_app.py` in the root folder.

1. Push repository to GitHub.
2. Go to [share.streamlit.io](https://share.streamlit.io).
3. Click **"New app"**.
4. Select your repository, branch (`main`), and set **Main file path** to `streamlit_app.py`.
5. Click **"Deploy!"**.
6. Your interactive HeatPath AI decision platform will be accessible immediately worldwide.

---

## 🧪 3. Verifying Key Endpoints

You can verify all endpoints with `curl` or PowerShell:

```powershell
# 1. FortyGuard 2-Hour Sync Status
curl http://127.0.0.1:8000/api/heat/status

# 2. Personalized Heat Risk Calculation (Age 10 Child)
curl -X POST http://127.0.0.1:8000/api/risk/calculate -H "Content-Type: application/json" -d "{\"age\": 10, \"departure_time\": \"14:00\", \"exposure_minutes\": 30}"

# 3. Outdoor Worker Risk Assessment
curl -X POST http://127.0.0.1:8000/api/risk/calculate -H "Content-Type: application/json" -d "{\"worker_mode\": true, \"occupation\": \"construction\", \"exertion_level\": \"heavy\"}"

# 4. 24-Hour Daily Heat Planner
curl http://127.0.0.1:8000/api/planner/daily?age=10

# 5. Cooling Path Routing
curl -X POST http://127.0.0.1:8000/api/route/cooling -H "Content-Type: application/json" -d "{\"origin_id\": \"N_CARSON_TRANSIT\", \"destination_id\": \"N_ESKENAZI_HEALTH\", \"time\": \"14:00\", \"age\": 10}"
```

---

## 🏆 4. Hackathon Judge Demo Workflow

1. Open the web app (`http://localhost:5173` or your Vercel URL).
2. Click the **"🏆 Demo Flow"** button in the top right navbar.
3. Click through the 7 interactive demo milestones:
   - **Step 1:** Observe baseline Indianapolis thermal grid.
   - **Step 2:** Select **🧒 Child (4–15 yrs, Age 10)**. Notice risk score jumps to **HIGH (72/100)**.
   - **Step 3:** Set time to **2:00 PM** (Peak diurnal heat).
   - **Step 4:** Navigate to **Cool Routes** $\to$ observe how the **Cooling Path** routes through tree canopies to reduce thermal stress by **56%**.
   - **Step 5:** Switch to **👷 Outdoor Worker Mode** $\to$ observe adaptive **Work/Rest ratio (30m work / 30m rest)** and hydration schedules.
   - **Step 6:** Switch to **👴 Older Adult (Age 65)** $\to$ inspect customized vulnerability advisories.
   - **Step 7:** Inspect the **2-Hour FortyGuard Update Badge** showing real-time cache freshness and next sync countdown.

---

## ⚖️ Safety Disclaimer
All recommendations, work/rest cycles, and hydration guides generated by HeatPath AI are provided for awareness, decision support, and urban planning. They do not constitute official occupational regulation compliance or medical diagnosis/treatment.
