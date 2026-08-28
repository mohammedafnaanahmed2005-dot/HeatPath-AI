"""
Comprehensive Test Suite for HeatPath AI Backend.
Covers FortyGuard reporting, NOAA heat index, thermodynamic risk engine,
age vulnerability classifications (ages 2, 10, 18, 35, 65), outdoor worker safety,
cooling path routing, 2-hour data refresh cycles, and missing data fallbacks.
"""

import pytest
import time
from fortyguard_service import fortyguard_service
from heat_engine import calculate_noaa_heat_index, classify_heat_risk
from routing import routing_service
from asset_audit import asset_audit_service
from simulation import simulation_service
from ai_agent import ai_heat_agent
from risk_config import (
    RISK_THRESHOLDS,
    AGE_CATEGORIES,
    WORKER_OCCUPATIONS,
    PHYSICAL_EXERTION_LEVELS,
    UPDATE_INTERVAL_SECONDS
)
from risk_engine import risk_engine, get_age_category, classify_risk_score
from daily_planner import daily_planner_service


# ─── 1. FortyGuard Reports & Data Integrity Tests ───────────────────
def test_fortyguard_reports_loaded():
    reports = fortyguard_service.get_all_reports()
    assert len(reports["reports"]) >= 9
    assert reports["reports"][0]["id"] == "FG-IND-001"
    assert "update_info" in reports["metadata"]


def test_fortyguard_status_and_2hr_refresh():
    status = fortyguard_service.get_status()
    assert status["status"] == "online"
    assert status["update_interval_seconds"] == 7200
    assert status["update_interval_hours"] == 2.0
    assert "last_updated_minutes_ago" in status
    assert "next_update_minutes" in status

    # Test refresh method
    initial_fetch_count = status["fetch_count"]
    refresh_result = fortyguard_service.refresh_data()
    assert refresh_result["success"] is True
    assert refresh_result["status"]["fetch_count"] == initial_fetch_count + 1
    assert refresh_result["status"]["last_updated_minutes_ago"] == 0


# ─── 2. Heat Engine & Physical Equations Tests ──────────────────────
def test_heat_index_calculation():
    hi_c, hi_f, cat = calculate_noaa_heat_index(35.0, relative_humidity=75.0)
    assert hi_c > 35.0
    assert any(term in cat for term in ["Extreme Caution", "Danger", "Extreme Danger", "Caution"])


def test_heat_risk_classification():
    low = classify_heat_risk(28.0)
    assert low["level"] == "low"
    ext = classify_heat_risk(42.0)
    assert ext["level"] == "extreme"


# ─── 3. Age Categories & Non-Overlapping Classification Tests ────────
def test_age_classification_non_overlapping():
    # Test exact age inputs specified in requirements
    # Age 2 -> Infant (0-3)
    cat_2 = get_age_category(age=2)
    assert cat_2["id"] == "infant"
    assert cat_2["vulnerability_multiplier"] == 1.55
    assert cat_2["base_risk_label"] == "VERY HIGH"

    # Age 10 -> Child (4-15)
    cat_10 = get_age_category(age=10)
    assert cat_10["id"] == "child"
    assert cat_10["vulnerability_multiplier"] == 1.30
    assert cat_10["base_risk_label"] == "HIGH"

    # Age 18 -> Young Adult (16-22)
    cat_18 = get_age_category(age=18)
    assert cat_18["id"] == "young_adult"
    assert cat_18["vulnerability_multiplier"] == 1.05

    # Age 35 -> Adult (23-50)
    cat_35 = get_age_category(age=35)
    assert cat_35["id"] == "adult"
    assert cat_35["vulnerability_multiplier"] == 1.00
    assert cat_35["base_risk_label"] == "MODERATE"

    # Age 65 -> Older Adult (51-100)
    cat_65 = get_age_category(age=65)
    assert cat_65["id"] == "older_adult"
    assert cat_65["vulnerability_multiplier"] == 1.45
    assert cat_65["base_risk_label"] == "VERY HIGH"


def test_age_group_string_lookup():
    assert get_age_category(age_group_id="infant")["id"] == "infant"
    assert get_age_category(age_group_id="child")["id"] == "child"
    assert get_age_category(age_group_id="young_adult")["id"] == "young_adult"
    assert get_age_category(age_group_id="adult")["id"] == "adult"
    assert get_age_category(age_group_id="older_adult")["id"] == "older_adult"


# ─── 4. Personalized Heat Risk Score & Threshold Tests ───────────────
def test_risk_score_monotonic_vulnerability():
    # At identical temperature 36°C and 30m exposure:
    # Infant (Age 2) and Older Adult (Age 65) should have higher risk scores than Adult (Age 35)
    risk_adult = risk_engine.calculate_risk(temperature_c=36.0, age=35, exposure_minutes=30.0)
    risk_child = risk_engine.calculate_risk(temperature_c=36.0, age=10, exposure_minutes=30.0)
    risk_infant = risk_engine.calculate_risk(temperature_c=36.0, age=2, exposure_minutes=30.0)
    risk_elderly = risk_engine.calculate_risk(temperature_c=36.0, age=65, exposure_minutes=30.0)

    assert risk_adult["risk_score"] < risk_child["risk_score"]
    assert risk_child["risk_score"] < risk_infant["risk_score"]
    assert risk_adult["risk_score"] < risk_elderly["risk_score"]
    assert 0.0 <= risk_adult["risk_score"] <= 100.0


def test_score_boundaries_and_classification():
    assert classify_risk_score(15)["level"] == "SAFE"
    assert classify_risk_score(35)["level"] == "MODERATE"
    assert classify_risk_score(65)["level"] == "HIGH"
    assert classify_risk_score(88)["level"] == "EXTREME"
    assert classify_risk_score(150)["score"] == 100.0  # Clamped


# ─── 5. Outdoor Worker Safety Mode & Workload Multiplier Tests ───────
def test_construction_worker_mode_age_30():
    # Construction worker age 30 with different exertion levels
    worker_light = risk_engine.calculate_risk(
        temperature_c=35.0, age=30, worker_mode=True,
        occupation="construction", exertion_level="light", exposure_minutes=45.0
    )
    worker_heavy = risk_engine.calculate_risk(
        temperature_c=35.0, age=30, worker_mode=True,
        occupation="construction", exertion_level="heavy", exposure_minutes=45.0
    )

    assert worker_heavy["risk_score"] > worker_light["risk_score"]
    assert worker_heavy["worker_safety"]["active"] is True
    assert "work_rest_status" in worker_heavy["worker_safety"]
    assert worker_heavy["hydration_reminder"]["active"] is True


def test_extreme_heat_emergency_detection():
    # 41°C ambient heat
    extreme_risk = risk_engine.calculate_risk(
        temperature_c=41.0, age=2, exposure_minutes=45.0
    )
    assert extreme_risk["risk_level"] == "EXTREME"
    assert "CRITICAL" in extreme_risk["alert_message"] or "EXTREME" in extreme_risk["alert_message"]
    assert extreme_risk["cooling_path_recommended"] is True


# ─── 6. Cooling Path Routing Tests ──────────────────────────────────
def test_cooling_path_calculation_with_profile():
    res = routing_service.plan_route_comparison(
        origin_id="N_CARSON_TRANSIT",
        destination_id="N_ESKENAZI_HEALTH",
        time_query="14:00",
        age=10,
        age_group="child"
    )
    assert "routes" in res
    assert "fastest" in res["routes"]
    assert "coolest" in res["routes"]
    
    cool_heat = res["routes"]["coolest"]["heat_exposure_score"]
    fast_heat = res["routes"]["fastest"]["heat_exposure_score"]
    assert cool_heat <= fast_heat
    assert res["comparison_summary"]["heat_reduction_pct"] >= 0


# ─── 7. 24-Hour Daily Heat Planner Tests ────────────────────────────
def test_daily_heat_planner():
    plan = daily_planner_service.generate_daily_plan(age=10, age_group="child")
    assert plan["total_periods"] == 6
    assert len(plan["periods"]) == 6
    # Verify period labels
    labels = [p["label"] for p in plan["periods"]]
    assert "Early Morning" in labels
    assert "Midday Peak Solar Heat" in labels
    assert "Overnight Ambient" in labels
    for p in plan["periods"]:
        assert "risk_score" in p
        assert "hydration_reminder" in p
        assert "activity_guidance" in p


# ─── 8. Missing Data & Graceful Fallback Tests ───────────────────────
def test_missing_environmental_parameters_graceful_handling():
    # Omit relative_humidity and heat_index_c
    res = risk_engine.calculate_risk(
        temperature_c=33.0,
        relative_humidity=None,
        heat_index_c=None,
        solar_factor=None,
        age=35
    )
    assert 0.0 <= res["risk_score"] <= 100.0
    assert res["environmental"]["temperature_c"] == 33.0


# ─── 9. Asset Audit, Simulation & AI Agent Tests ────────────────────
def test_asset_audit_ranking():
    audit = asset_audit_service.audit_assets(time_query="14:00")
    assert len(audit["assets"]) > 0
    scores = [a["priority_score"] for a in audit["assets"]]
    assert scores == sorted(scores, reverse=True)


def test_simulation_cooling_impact():
    sim = simulation_service.simulate_interventions(
        target_lat=39.7684,
        target_lng=-86.1580,
        time_query="14:00",
        interventions={"tree_canopy": True, "reflective_pavement": True, "tree_canopy_coverage_pct": 40, "pavement_albedo": 0.45}
    )
    assert sim["impact_metrics"]["ambient_reduction_c"] > 0
    assert sim["impact_metrics"]["surface_reduction_c"] > 0
    assert sim["after"]["ambient_temp_c"] < sim["before"]["ambient_temp_c"]


def test_ai_agent_reasoning():
    resp = ai_heat_agent.answer_query("Which route should I take to avoid heat?")
    assert "answer" in resp
    assert len(resp["answer"]) > 0
