"""
HeatPath AI — Streamlit Application
Interactive Urban Heat Decision Intelligence Platform for Streamlit Community Cloud.
Track 1: Resilient Cities & Infrastructure • FortyGuard Global Hackathon
"""

import os
import sys

# Ensure backend directory is in path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import streamlit as st
import pandas as pd
from datetime import datetime, timezone

from fortyguard_service import fortyguard_service
from risk_config import (
    RISK_THRESHOLDS,
    AGE_CATEGORIES,
    WORKER_OCCUPATIONS,
    PHYSICAL_EXERTION_LEVELS,
    SAFETY_DISCLAIMER
)
from risk_engine import risk_engine, get_age_category
from daily_planner import daily_planner_service
from routing import routing_service
from asset_audit import asset_audit_service
from simulation import simulation_service
from ai_agent import ai_heat_agent
def format_temp(c, f=False):
    return f"{(c * 9 / 5) + 32:.1f}°F" if f else f"{c:.1f}°C"

# ─── Streamlit Page Config ──────────────────────────────────────────
st.set_page_config(
    page_title="HeatPath AI — Urban Heat Safety & Cooling Platform",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─── Custom CSS ─────────────────────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #0b0f19; }
    .stApp { background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0b0f19 75%); color: #f8fafc; }
    .metric-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        backdrop-filter: blur(10px);
        margin-bottom: 12px;
    }
    .badge-safe { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
    .badge-mod { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid #eab308; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
    .badge-high { background: rgba(249, 115, 22, 0.2); color: #f97316; border: 1px solid #f97316; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
    .badge-ext { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
</style>
""", unsafe_allow_html=True)

# ─── Sidebar Controls ───────────────────────────────────────────────
with st.sidebar:
    st.image("https://img.icons8.com/isometric/96/fire-element.png", width=64)
    st.title("HeatPath AI")
    st.caption("FortyGuard Urban Thermal Intelligence • Track 1")

    st.markdown("---")
    st.subheader("👤 Heat Safety Profile")

    profile_option = st.selectbox(
        "Select Age Profile",
        options=[
            ("👶 Newborn / Infant (0–3 yrs)", "infant", 2),
            ("🧒 Children (4–15 yrs)", "child", 10),
            ("🧑 Teenagers / Young Adults (16–22 yrs)", "young_adult", 18),
            ("👨 Adults (23–50 yrs)", "adult", 35),
            ("👴 Older Adults (51–100 yrs)", "older_adult", 65),
            ("👷 Outdoor Worker Mode", "worker", 32)
        ],
        format_func=lambda x: x[0],
        index=1
    )

    age_cat_id = profile_option[1]
    default_age = profile_option[2]

    is_worker = age_cat_id == "worker"
    worker_toggle = st.checkbox("Enable Outdoor Worker Safety Mode", value=is_worker)

    specific_age = st.slider("Specific Age", min_value=0, max_value=100, value=default_age)

    worker_occ = "construction"
    worker_exertion = "heavy"
    if worker_toggle:
        st.markdown("#### 👷 Worker Specifics")
        worker_occ = st.selectbox(
            "Occupation",
            options=list(WORKER_OCCUPATIONS.keys()),
            format_func=lambda k: f"{WORKER_OCCUPATIONS[k]['icon']} {WORKER_OCCUPATIONS[k]['title']}"
        )
        worker_exertion = st.selectbox(
            "Exertion Level",
            options=["light", "moderate", "heavy"],
            format_func=lambda k: f"{k.capitalize()} ({PHYSICAL_EXERTION_LEVELS[k]['multiplier']}x)"
        )

    st.markdown("---")
    st.subheader("🕒 Diurnal Time of Day")
    time_val = st.select_slider(
        "Departure Time",
        options=[f"{h:02d}:00" for h in range(24)],
        value="14:00"
    )

    use_fahrenheit = st.toggle("Show Fahrenheit (°F)", value=False)

    st.markdown("---")
    # 2-Hour Status
    status = fortyguard_service.get_status()
    st.caption(f"⏱️ **{status['last_updated_display']}**")
    st.caption(f"🔄 **{status['next_update_display']}**")
    if st.button("🔄 Sync FortyGuard Data"):
        fortyguard_service.refresh_data()
        st.success("Refreshed FortyGuard Matrix!")

# ─── Navigation Tabs ────────────────────────────────────────────────
tab_dash, tab_route, tab_planner, tab_worker, tab_audit, tab_twin, tab_reports, tab_ai = st.tabs([
    "🛡️ Safety Dashboard",
    "🌿 Cooling Path",
    "📅 Daily Planner",
    "👷 Worker Safety",
    "🚨 Asset Audit",
    "🌱 Digital Twin",
    "📊 FortyGuard Data",
    "🤖 AI Advisor"
])

# ─── Tab 1: Safety Dashboard ────────────────────────────────────────
with tab_dash:
    st.header("Personalized Heat Safety Dashboard")

    risk_res = risk_engine.calculate_risk(
        temperature_c=37.5,
        hour_float=fortyguard_service.parse_hour(time_val),
        age=specific_age,
        age_group=age_cat_id,
        worker_mode=worker_toggle,
        occupation=worker_occ,
        exertion_level=worker_exertion,
        exposure_minutes=30.0
    )

    score = risk_res["risk_score"]
    level = risk_res["risk_level"]
    color = risk_res["risk_color"]
    env = risk_res["environmental"]

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric(
            label="Personalized Risk Score",
            value=f"{score}/100",
            delta=f"{level} RISK"
        )
    with col2:
        t_disp = f"{(env['temperature_c']*9/5)+32:.1f}°F" if use_fahrenheit else f"{env['temperature_c']:.1f}°C"
        st.metric(
            label="Ambient Air Temp",
            value=t_disp,
            delta=f"HI: {(env['heat_index_c']*9/5)+32:.1f}°F" if use_fahrenheit else f"HI: {env['heat_index_c']:.1f}°C"
        )
    with col3:
        st.metric(
            label="Age Vulnerability",
            value=f"{risk_res['profile']['vulnerability_multiplier']}x",
            delta=risk_res['profile']['age_group_name']
        )
    with col4:
        st.metric(
            label="Hydration Rate",
            value=risk_res["hydration_reminder"]["recommended_intake"],
            delta="Scheduled Fluid Intake"
        )

    # Alert Box
    if level in ["HIGH", "EXTREME"]:
        st.error(f"⚠️ **{risk_res['alert_message']}**")
    else:
        st.info(f"ℹ️ **{risk_res['alert_message']}**")

    col_a, col_b = st.columns(2)
    with col_a:
        st.subheader("📋 Tailored Action Recommendations")
        st.write(risk_res["recommended_action"])
        st.markdown("**Key Precautions:**")
        for p in risk_res["precautions"]:
            st.write(f"- {p}")

    with col_b:
        st.subheader("🌿 Cooling Path Recommendation")
        st.write(risk_res["route_recommendation"])
        if worker_toggle:
            st.markdown("#### 👷 Work / Rest Schedule")
            st.warning(f"**Protocol:** {risk_res['worker_safety']['work_rest_status']}")
            st.write(f"Next cooling break in **{risk_res['worker_safety']['next_break_minutes']} min**.")

# ─── Tab 2: Cooling Path ────────────────────────────────────────────
with tab_route:
    st.header("Heat-Aware Cooling Path Planner")
    nodes = routing_service.get_network_nodes()
    node_names = {n["id"]: f"{n['name']} ({n['type']})" for n in nodes}

    c1, c2 = st.columns(2)
    with c1:
        orig = st.selectbox("Origin Waypoint", options=list(node_names.keys()), format_func=lambda k: node_names[k], index=2)
    with c2:
        dest = st.selectbox("Destination Waypoint", options=list(node_names.keys()), format_func=lambda k: node_names[k], index=13)

    if orig != dest:
        route_comp = routing_service.plan_route_comparison(
            origin_id=orig,
            destination_id=dest,
            time_query=time_val,
            age=specific_age,
            age_group=age_cat_id,
            worker_mode=worker_toggle,
            occupation=worker_occ,
            exertion_level=worker_exertion
        )

        if "routes" in route_comp:
            summary = route_comp["comparison_summary"]
            st.success(f"🛡️ **{summary['key_takeaway']}**")

            r_cols = st.columns(3)
            for i, r_key in enumerate(["fastest", "balanced", "coolest"]):
                r = route_comp["routes"].get(r_key)
                if r:
                    with r_cols[i]:
                        st.markdown(f"### {r['label']}")
                        st.caption(r['badge'])
                        t_str = f"{(r['avg_temperature_c']*9/5)+32:.1f}°F" if use_fahrenheit else f"{r['avg_temperature_c']:.1f}°C"
                        st.write(f"🌡️ **Avg Temp:** {t_str}")
                        st.write(f"⏱️ **Duration:** {r['duration_minutes']} min")
                        st.write(f"📏 **Distance:** {r['distance_km']} km")
                        st.write(f"🌳 **Canopy Shade:** {r['avg_shade_pct']}%")
                        st.write(f"🔥 **Heat Dose:** {r['heat_exposure_score']}")

# ─── Tab 3: Daily Planner ───────────────────────────────────────────
with tab_planner:
    st.header("24-Hour Daily Heat Planner")
    plan = daily_planner_service.generate_daily_plan(
        age=specific_age,
        age_group=age_cat_id,
        worker_mode=worker_toggle,
        occupation=worker_occ,
        exertion_level=worker_exertion
    )

    st.write(f"Diurnal heat schedule for **{plan['profile']['age_group_name']}** • Peak Stress: **{plan['peak_risk_period']}**")

    p_cols = st.columns(len(plan["periods"]))
    for i, p in enumerate(plan["periods"]):
        with p_cols[i]:
            st.markdown(f"#### {p['icon']} {p['label']}")
            st.caption(p['time_range'])
            t_str = f"{(p['ambient_temp_c']*9/5)+32:.1f}°F" if use_fahrenheit else f"{p['ambient_temp_c']:.1f}°C"
            st.markdown(f"**Temp:** {t_str}")
            st.markdown(f"**Risk:** {p['risk_score']} ({p['risk_level']})")
            st.write(f"**Activity:** {p['activity_level']}")
            st.caption(f"💧 {p['hydration_reminder']}")

# ─── Tab 4: Worker Safety ───────────────────────────────────────────
with tab_worker:
    st.header("Outdoor Worker Heat Safety Suite")
    w_risk = risk_engine.calculate_risk(
        temperature_c=38.0,
        hour_float=14.0,
        worker_mode=True,
        occupation=worker_occ,
        exertion_level=worker_exertion,
        exposure_minutes=45.0
    )

    st.markdown(f"### Occupational Risk Score: **{w_risk['risk_score']}/100 ({w_risk['risk_level']})**")
    st.warning(f"Protocol: {w_risk['worker_safety']['work_rest_status']}")

    wc1, wc2 = st.columns(2)
    with wc1:
        st.write(f"👷 **Occupation:** {WORKER_OCCUPATIONS[worker_occ]['title']}")
        st.write(f"⚡ **Physical Exertion:** {worker_exertion.capitalize()} ({PHYSICAL_EXERTION_LEVELS[worker_exertion]['multiplier']}x)")
        st.write(f"💧 **Fluid Target:** {w_risk['hydration_reminder']['recommended_intake']}")
    with wc2:
        st.write(f"🌿 **Nearest Cooling Refuge:** {w_risk['worker_safety']['nearest_cooling_shelter']}")
        st.write(f"⏱️ **Next Break Countdown:** ~{w_risk['worker_safety']['next_break_minutes']} mins")

# ─── Tab 5: Asset Audit ─────────────────────────────────────────────
with tab_audit:
    st.header("Public Asset Heat Vulnerability Audit")
    audit_data = asset_audit_service.audit_assets(time_query=time_val)
    st.write(f"Total Assets Audited: **{len(audit_data['assets'])}** | Critical Count: **{audit_data['critical_count']}**")

    df_assets = pd.DataFrame([
        {
            "Rank": a["rank"],
            "Name": a["name"],
            "Type": a["type"],
            "Priority Score": a["priority_score"],
            "Temp (°C)": a["temperature_c"],
            "Shade (%)": a["current_shade_pct"],
            "Target Intervention": a["target_intervention"]
        }
        for a in audit_data["assets"]
    ])
    st.dataframe(df_assets, use_container_width=True)

# ─── Tab 6: Digital Twin ────────────────────────────────────────────
with tab_twin:
    st.header("Digital Twin Urban Intervention Sandbox")
    tree_c = st.slider("Tree Canopy Coverage (%)", 5, 80, 35)
    albedo = st.slider("Pavement Albedo", 0.10, 0.70, 0.40)

    sim_res = simulation_service.simulate_interventions(
        target_lat=39.7684,
        target_lng=-86.1580,
        time_query=time_val,
        interventions={"tree_canopy": True, "reflective_pavement": True, "tree_canopy_coverage_pct": tree_c, "pavement_albedo": albedo}
    )

    st.success(f"🌱 **Verdict:** {sim_res['impact_metrics']['verdict']}")
    st.write(f"Ambient Reduction: **-{sim_res['impact_metrics']['ambient_reduction_c']}°C** | Surface Reduction: **-{sim_res['impact_metrics']['surface_reduction_c']}°C**")

# ─── Tab 7: FortyGuard Data ─────────────────────────────────────────
with tab_reports:
    st.header("FortyGuard Heat Intelligence Reports")
    rep_data = fortyguard_service.get_all_reports()
    st.write(f"Loaded **{len(rep_data['reports'])}** FortyGuard Reports for Indianapolis metro grid.")
    for rep in rep_data["reports"]:
        with st.expander(f"{rep['id']}: {rep['name']}"):
            st.write(f"**Land Cover:** {rep['land_cover']}")
            st.write(f"**Peak Temp:** {rep['peak_daytime_temp_c']}°C | **Surface:** {rep['peak_surface_temp_c']}°C")
            st.write(f"**Canopy:** {rep['canopy_cover_pct']}% | **SVF:** {rep['sky_view_factor']}")
            st.write(f"**Key Risks:** {', '.join(rep.get('key_risk_factors', []))}")

# ─── Tab 8: AI Advisor ──────────────────────────────────────────────
with tab_ai:
    st.header("AI Urban Heat Planning Advisor")
    user_q = st.text_input("Ask HeatPath AI Advisor:", "Why is the Coolest Route recommended over the fastest route at 2 PM?")
    if st.button("Ask Advisor") and user_q:
        ans = ai_heat_agent.answer_query(user_q)
        st.markdown(ans["answer"])

st.markdown("---")
st.caption(f"⚖️ {SAFETY_DISCLAIMER}")
