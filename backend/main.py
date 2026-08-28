"""
HeatPath AI — FastAPI Backend Application.
AI-Powered Urban Heat Decision Intelligence Platform with
Personalized Age-Based Heat Risk, Cooling Paths & Outdoor Worker Safety.
All imports are FLAT (no subfolders) — every module lives in backend/.
"""

import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

load_dotenv()

# Flat imports — all modules in backend/
from fortyguard_service import fortyguard_service
from routing import routing_service
from asset_audit import asset_audit_service
from simulation import simulation_service
from ai_agent import ai_heat_agent
from risk_config import (
    RISK_THRESHOLDS,
    AGE_CATEGORIES,
    WORKER_OCCUPATIONS,
    PHYSICAL_EXERTION_LEVELS,
    UPDATE_INTERVAL_SECONDS,
    SAFETY_DISCLAIMER
)
from risk_engine import risk_engine, get_age_category
from daily_planner import daily_planner_service
from heat_engine import (
    get_diurnal_hourly_multiplier,
    get_solar_irradiance_factor,
    calculate_noaa_heat_index,
    calculate_wbgt,
    classify_heat_risk
)

app = FastAPI(
    title="HeatPath AI API",
    description="AI-Powered Urban Heat Decision Intelligence & Cooling Path Platform — Track 1",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Request Models ──────────────────────────────────────
class RouteRequest(BaseModel):
    origin_id: str = Field(..., example="N_CARSON_TRANSIT")
    destination_id: str = Field(..., example="N_ESKENAZI_HEALTH")
    time: str = Field(default="14:00", example="14:00")
    age: Optional[int] = Field(default=None, example=10)
    age_group: Optional[str] = Field(default="child", example="child")
    worker_mode: bool = Field(default=False)
    occupation: Optional[str] = Field(default="construction")
    exertion_level: Optional[str] = Field(default="moderate")
    max_acceptable_risk: Optional[str] = Field(default=None)


class RiskCalculationRequest(BaseModel):
    temperature_c: Optional[float] = Field(default=None, example=37.5)
    relative_humidity: Optional[float] = Field(default=79.0, example=79.0)
    heat_index_c: Optional[float] = Field(default=None)
    solar_factor: Optional[float] = Field(default=None)
    departure_time: str = Field(default="14:00", example="14:00")
    exposure_minutes: float = Field(default=30.0, ge=1.0, le=600.0, example=30.0)
    age: Optional[int] = Field(default=None, ge=0, le=120, example=10)
    age_group: Optional[str] = Field(default=None, example="child")
    worker_mode: bool = Field(default=False, example=False)
    occupation: Optional[str] = Field(default="construction", example="construction")
    exertion_level: Optional[str] = Field(default="moderate", example="moderate")
    route_shade_pct: Optional[float] = Field(default=15.0, ge=0.0, le=100.0)


class SimulationRequest(BaseModel):
    target_lat: float = Field(default=39.7684)
    target_lng: float = Field(default=-86.1580)
    time: str = Field(default="14:00")
    tree_canopy: bool = Field(default=True)
    tree_canopy_coverage_pct: int = Field(default=35, ge=5, le=80)
    reflective_pavement: bool = Field(default=True)
    pavement_albedo: float = Field(default=0.40, ge=0.10, le=0.70)
    cool_roofs: bool = Field(default=False)
    misting_stations: bool = Field(default=False)


class AIAgentQueryRequest(BaseModel):
    query: str = Field(..., example="Why is the Coolest Route recommended over the fastest route at 2 PM?")
    context: Optional[Dict[str, Any]] = None


# ─── System Health & Discovery ────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "HeatPath AI Backend",
        "version": "2.1.0",
        "status": "online",
        "track": "Track 1: Urban Heat & FortyGuard Intelligence",
        "city": "Indianapolis, IN",
        "features": [
            "Personalized Age-Based Heat Risk Engine",
            "Cooling Path Routing (Heat-Aware A*)",
            "Outdoor Worker Safety Mode",
            "2-Hour FortyGuard Live Data Refresh (7200s)",
            "24-Hour Daily Heat Planner (6 Time Periods)",
            "Satellite & Infrared Radiometry",
            "Heat Timelapse Simulation Video",
            "Thermal Graphs & Analysis Suite",
            "Public Asset Heat Vulnerability Audit",
            "Digital Twin Microclimate Sandbox",
            "Explainable AI Advisor"
        ],
        "data_status": fortyguard_service.get_status(),
        "documentation": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint for container and uptime monitoring."""
    status = fortyguard_service.get_status()
    return {
        "status": "healthy",
        "uptime_status": "ok",
        "fortyguard_service": status["status"],
        "cache_state": status["cache_state"],
        "last_updated_display": status["last_updated_display"],
        "next_update_display": status["next_update_display"],
        "reports_loaded": len(fortyguard_service.reports_cache)
    }


# ─── NEW: FortyGuard 2-Hour Refresh & Status Endpoints ─────────────
@app.get("/api/heat/status")
async def get_heat_data_status():
    """Returns 2-hour data sync status, elapsed/remaining time, and cache integrity."""
    return fortyguard_service.get_status()


@app.post("/api/heat/refresh")
async def refresh_heat_data():
    """Triggers an explicit data refresh cycle and resets the 2-hour timer."""
    return fortyguard_service.refresh_data()


@app.get("/api/heat/current")
async def get_current_heat_metrics(time: str = Query("14:00")):
    """Returns real-time metropolitan thermal metrics and sync status."""
    return fortyguard_service.get_current_metrics(time_query=time)


@app.get("/api/heat/history")
async def get_heat_history():
    """Returns 24-hour diurnal thermal history for Indianapolis metro core."""
    return fortyguard_service.get_heat_history()


# ─── NEW: Personalized Heat Risk Engine Endpoints ─────────────────
@app.post("/api/risk/calculate")
async def calculate_personalized_risk(req: RiskCalculationRequest):
    """
    Computes personalized 0–100 heat risk score, risk level, precautions,
    work/rest ratios, and route recommendation.
    """
    hour_float = fortyguard_service.parse_hour(req.departure_time)

    # If temperature is not explicitly provided, resolve from FortyGuard downtown reference
    if req.temperature_c is None:
        loc_data = fortyguard_service.calculate_location_temperature(
            lat=39.7684, lng=-86.1580, hour_float=hour_float
        )
        temp_c = loc_data["temperature_c"]
        hi_c = loc_data["heat_index_c"]
        sf = loc_data["solar_irradiance_factor"]
    else:
        temp_c = req.temperature_c
        hi_c = req.heat_index_c
        sf = req.solar_factor

    return risk_engine.calculate_risk(
        temperature_c=temp_c,
        relative_humidity=req.relative_humidity,
        heat_index_c=hi_c,
        solar_factor=sf,
        hour_float=hour_float,
        exposure_minutes=req.exposure_minutes,
        age=req.age,
        age_group=req.age_group,
        worker_mode=req.worker_mode,
        occupation=req.occupation,
        exertion_level=req.exertion_level,
        route_shade_pct=req.route_shade_pct
    )


@app.get("/api/recommendations")
async def get_profile_recommendations(
    age: Optional[int] = Query(None),
    age_group: Optional[str] = Query("adult"),
    worker_mode: bool = Query(False),
    time: str = Query("14:00")
):
    """Returns general safety recommendations tailored to age profile and worker mode."""
    hour_float = fortyguard_service.parse_hour(time)
    loc_data = fortyguard_service.calculate_location_temperature(39.7684, -86.1580, hour_float)
    return risk_engine.calculate_risk(
        temperature_c=loc_data["temperature_c"],
        hour_float=hour_float,
        age=age,
        age_group=age_group,
        worker_mode=worker_mode
    )


@app.get("/api/worker-risk")
async def get_worker_safety_risk(
    occupation: str = Query("construction"),
    exertion_level: str = Query("heavy"),
    time: str = Query("14:00"),
    exposure_minutes: float = Query(45.0)
):
    """Dedicated endpoint for Outdoor Worker Safety assessments and work/rest scheduling."""
    hour_float = fortyguard_service.parse_hour(time)
    loc_data = fortyguard_service.calculate_location_temperature(39.7684, -86.1580, hour_float)
    return risk_engine.calculate_risk(
        temperature_c=loc_data["temperature_c"],
        heat_index_c=loc_data["heat_index_c"],
        hour_float=hour_float,
        exposure_minutes=exposure_minutes,
        worker_mode=True,
        occupation=occupation,
        exertion_level=exertion_level
    )


# ─── NEW: 24-Hour Daily Heat Planner Endpoint ─────────────────────
@app.get("/api/planner/daily")
async def get_daily_heat_planner(
    age: Optional[int] = Query(None),
    age_group: Optional[str] = Query("adult"),
    worker_mode: bool = Query(False),
    occupation: Optional[str] = Query("construction"),
    exertion_level: Optional[str] = Query("moderate")
):
    """
    Generates 24-hour Daily Heat Planner across 6 diurnal periods
    (Early Morning, Late Morning, Midday Peak, Late Afternoon, Evening, Overnight).
    """
    return daily_planner_service.generate_daily_plan(
        age=age,
        age_group=age_group,
        worker_mode=worker_mode,
        occupation=occupation,
        exertion_level=exertion_level
    )


# ─── Routing & Cooling Path Endpoints ─────────────────────────────
@app.post("/api/route")
@app.post("/api/route/cooling")
async def calculate_cooling_route(req: RouteRequest):
    """
    Calculates Heat-Aware A* pathfinding comparisons (Fastest, Balanced, Cooling Path)
    tailored to age vulnerability profile, worker mode, and departure time.
    """
    res = routing_service.plan_route_comparison(
        origin_id=req.origin_id,
        destination_id=req.destination_id,
        time_query=req.time,
        age=req.age,
        age_group=req.age_group,
        worker_mode=req.worker_mode,
        occupation=req.occupation,
        exertion_level=req.exertion_level,
        max_acceptable_risk=req.max_acceptable_risk
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@app.get("/api/network/nodes")
async def get_network_nodes():
    """Returns all available network waypoints for route planning dropdowns."""
    return routing_service.get_network_nodes()


@app.get("/api/network")
async def get_road_network(time: str = Query("14:00")):
    """Returns the thermal-annotated road network graph with nodes and edges."""
    return routing_service.get_annotated_graph(time_query=time)


# ─── Heatmap & Microclimate Endpoints ─────────────────────────────
@app.get("/api/reports")
async def get_fortyguard_reports():
    """Returns the comprehensive dataset synthesized from all 9 FortyGuard Heat Intelligence Reports."""
    return fortyguard_service.get_all_reports()


@app.get("/api/heatmap")
async def get_heatmap(
    time: str = Query("14:00", description="Time of day, e.g. '10:00', '14:00', '18:00'"),
    grid_resolution: int = Query(18, ge=8, le=35, description="Thermal spatial resolution")
):
    """Generates the 24-hour urban heat grid, sensor station pins, and temperature statistics."""
    return await fortyguard_service.get_heatmap(time_query=time, grid_resolution=grid_resolution)


@app.get("/api/location")
async def get_location_heat(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    time: str = Query("14:00", description="Time of day")
):
    """Fetches high-resolution microclimate readings for any coordinate."""
    hour_float = fortyguard_service.parse_hour(time)
    return fortyguard_service.calculate_location_temperature(lat=lat, lng=lng, hour_float=hour_float)


# ─── Asset Audit & Simulation Endpoints ───────────────────────────
@app.get("/api/assets/audit")
async def audit_public_assets(time: str = Query("14:00")):
    """Ranks public assets using Track 1 multi-criteria Priority Score formula."""
    return asset_audit_service.audit_assets(time_query=time)


@app.post("/api/simulate")
async def simulate_interventions(req: SimulationRequest):
    """Digital Twin Simulator: Tests urban interventions and computes thermal reductions."""
    interventions_dict = {
        "tree_canopy": req.tree_canopy,
        "tree_canopy_coverage_pct": req.tree_canopy_coverage_pct,
        "reflective_pavement": req.reflective_pavement,
        "pavement_albedo": req.pavement_albedo,
        "cool_roofs": req.cool_roofs,
        "misting_stations": req.misting_stations
    }
    return simulation_service.simulate_interventions(
        target_lat=req.target_lat,
        target_lng=req.target_lng,
        time_query=req.time,
        interventions=interventions_dict
    )


# ─── Satellite & Infrared Radiometry Metadata ────────────────────
@app.get("/api/satellite-infrared")
async def get_satellite_infrared_info():
    """Returns metadata for satellite, Google Earth, and infrared thermal view layers."""
    return {
        "satellite_tile_url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        "dark_tile_url": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "street_tile_url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "google_earth_layer_note": "Calibrated satellite orthophoto & 3D radiometric thermal layer fusion",
        "infrared_palettes": {
            "ironbow": ["#00002a", "#1a0046", "#4b0082", "#8b0000", "#cd3700", "#ff6500", "#ffaa00", "#ffff00", "#ffffff"],
            "inferno": ["#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60", "#cf4446", "#ed6925", "#fb9b06", "#f7d03c", "#fcffa4"],
            "turbo": ["#30123b", "#4662d7", "#36aaf9", "#1ae4b6", "#72fe5e", "#c8ef34", "#faba39", "#f66b19", "#ca2a04", "#7a0403"],
            "classic": ["#0000ff", "#00ccff", "#00ff00", "#ffff00", "#ff8800", "#ff0000", "#cc0000"]
        },
        "thermal_range_c": {"min": 20.0, "max": 45.0},
        "thermal_range_f": {"min": 68.0, "max": 113.0}
    }


# ─── Simulation Video Timelapse Frames ───────────────────────────
@app.get("/api/simulation-video/frames")
async def get_simulation_video_frames(
    grid_resolution: int = Query(12, ge=6, le=20),
    origin_id: str = Query("N_CARSON_TRANSIT"),
    destination_id: str = Query("N_ESKENAZI_HEALTH"),
    age_group: str = Query("child"),
    worker_mode: bool = Query(False)
):
    """
    Generates 24 hourly thermal grid frames for animated heat timelapse video
    plus pedestrian route trajectory points for transit simulation overlay.
    """
    frames = []
    for hour in range(24):
        time_str = f"{hour:02d}:00"
        hour_float = float(hour)

        heatmap = await fortyguard_service.get_heatmap(
            time_query=time_str, grid_resolution=grid_resolution
        )

        frames.append({
            "hour": hour,
            "time_label": fortyguard_service._format_hour_label(hour_float),
            "statistics": heatmap["statistics"],
            "grid_cells": [
                {
                    "lat": c["lat"], "lng": c["lng"],
                    "temperature": c["temperature"],
                    "surface_temp": c["surface_temp"],
                    "risk": c["risk"],
                    "color": c["color"]
                }
                for c in heatmap["grid_cells"]
            ],
            "solar_irradiance": get_solar_irradiance_factor(hour_float),
            "diurnal_multiplier": get_diurnal_hourly_multiplier(hour_float)
        })

    # Generate route path for pedestrian transit simulation
    route_data = routing_service.plan_route_comparison(
        origin_id=origin_id,
        destination_id=destination_id,
        time_query="14:00",
        age_group=age_group,
        worker_mode=worker_mode
    )

    coolest_coords = []
    fastest_coords = []
    if "routes" in route_data:
        if "coolest" in route_data["routes"]:
            coolest_coords = route_data["routes"]["coolest"].get("coordinates", [])
        if "fastest" in route_data["routes"]:
            fastest_coords = route_data["routes"]["fastest"].get("coordinates", [])

    return {
        "total_frames": 24,
        "fps_suggested": 2,
        "frames": frames,
        "pedestrian_simulation": {
            "coolest_route_coords": coolest_coords,
            "fastest_route_coords": fastest_coords,
            "walking_speed_mps": 1.25,
            "comparison_summary": route_data.get("comparison_summary", {})
        }
    }


# ─── Analysis Charts Precomputed Data ─────────────────────────────
@app.get("/api/analysis/charts")
async def get_analysis_charts(time: str = Query("14:00")):
    """Precomputed analytical datasets for charts and visual summaries."""
    diurnal_data = []
    for h in range(24):
        hf = float(h)
        mult = get_diurnal_hourly_multiplier(hf)
        solar = get_solar_irradiance_factor(hf)
        ref = fortyguard_service.calculate_location_temperature(
            lat=39.7684, lng=-86.1580, hour_float=hf
        )
        hi_c, hi_f, hi_cat = calculate_noaa_heat_index(ref["temperature_c"], 79.0)
        wbgt = calculate_wbgt(ref["temperature_c"], 79.0, solar)

        diurnal_data.append({
            "hour": h,
            "label": fortyguard_service._format_hour_label(hf),
            "ambient_c": ref["temperature_c"],
            "ambient_f": ref["temperature_f"],
            "surface_c": ref["surface_temp_c"],
            "heat_index_c": hi_c,
            "wbgt_c": wbgt,
            "solar_ghi": round(solar, 3),
            "diurnal_mult": round(mult, 3),
            "risk_level": ref["risk"]["level"]
        })

    hour_float = fortyguard_service.parse_hour(time)
    solar = get_solar_irradiance_factor(hour_float)
    base_ambient = 37.5

    materials = [
        {"name": "Dark Asphalt", "albedo": 0.05, "color": "#1f2937"},
        {"name": "Aged Asphalt", "albedo": 0.08, "color": "#374151"},
        {"name": "Concrete", "albedo": 0.28, "color": "#9ca3af"},
        {"name": "Brick Pavers", "albedo": 0.30, "color": "#b45309"},
        {"name": "Cool Pavement", "albedo": 0.40, "color": "#60a5fa"},
        {"name": "Turfgrass", "albedo": 0.24, "color": "#22c55e"},
        {"name": "White Roof Coating", "albedo": 0.70, "color": "#f3f4f6"}
    ]

    from heat_engine import estimate_surface_temperature
    for m in materials:
        surf = estimate_surface_temperature(
            ambient_temp_c=base_ambient, albedo=m["albedo"],
            sky_view_factor=0.65, canopy_shade_pct=0.0, solar_factor=solar
        )
        m["surface_temp_c"] = round(surf, 1)
        m["surface_temp_f"] = round((surf * 9 / 5) + 32, 1)
        m["solar_absorption_pct"] = round((1.0 - m["albedo"]) * 100, 0)

    station_comparison = []
    for rep in fortyguard_service.reports_cache:
        tdata = fortyguard_service.calculate_location_temperature(
            lat=rep["location"]["lat"], lng=rep["location"]["lng"],
            hour_float=hour_float
        )
        station_comparison.append({
            "id": rep["id"],
            "name": rep["name"],
            "ambient_c": tdata["temperature_c"],
            "surface_c": tdata["surface_temp_c"],
            "heat_index_c": tdata["heat_index_c"],
            "canopy_pct": rep["canopy_cover_pct"],
            "svf": rep["sky_view_factor"],
            "uhi_intensity_c": rep.get("uhi_intensity_c", 0.0),
            "risk": tdata["risk"]["level"]
        })

    route_data = routing_service.plan_route_comparison(
        origin_id="N_CARSON_TRANSIT",
        destination_id="N_ESKENAZI_HEALTH",
        time_query=time
    )
    route_comparison = {}
    if "routes" in route_data:
        for rk, rv in route_data["routes"].items():
            route_comparison[rk] = {
                "label": rv.get("label", rk),
                "distance_m": rv.get("distance_meters", 0),
                "duration_min": rv.get("duration_minutes", 0),
                "avg_temp_c": rv.get("avg_temperature_c", 0),
                "avg_shade_pct": rv.get("avg_shade_pct", 0),
                "heat_exposure": rv.get("heat_exposure_score", 0),
                "color": rv.get("color", "#666")
            }

    return {
        "time": time,
        "diurnal_24h": diurnal_data,
        "material_albedo": materials,
        "station_comparison": station_comparison,
        "route_comparison": route_comparison,
        "summary_stats": route_data.get("comparison_summary", {})
    }


# ─── Explainable AI Heat Planning Agent ───────────────────────────
@app.post("/api/ai/ask")
async def ask_ai_heat_agent(req: AIAgentQueryRequest):
    """AI Heat Planning Agent answering queries regarding thermal risk and urban cooling."""
    return ai_heat_agent.answer_query(query=req.query, context=req.context)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
