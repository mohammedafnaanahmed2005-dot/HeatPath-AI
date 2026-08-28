"""
Centralized Configuration for HeatPath AI Risk & Vulnerability Engine.
Defines risk score boundaries, age categories, worker exposure multipliers,
work/rest ratios, 2-hour update interval, and standard UI risk colors.
"""

from typing import Dict, Any

# ─── Risk Score Thresholds (0 - 100 Scale) ─────────────────────────
RISK_THRESHOLDS = {
    "safe": {"min": 0, "max": 25, "label": "SAFE", "color": "#10b981", "badge": "Comfortable", "icon": "🟢"},
    "moderate": {"min": 26, "max": 50, "label": "MODERATE", "color": "#eab308", "badge": "Caution", "icon": "🟡"},
    "high": {"min": 51, "max": 75, "label": "HIGH", "color": "#f97316", "badge": "Extreme Caution", "icon": "🟠"},
    "extreme": {"min": 76, "max": 100, "label": "EXTREME", "color": "#ef4444", "badge": "Danger", "icon": "🔴"}
}

# ─── Age Category Definitions & Vulnerability Modifiers ────────────
# Non-overlapping age brackets: 0-3, 4-15, 16-22, 23-50, 51-100
AGE_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "infant": {
        "id": "infant",
        "name": "Newborn / Infant",
        "emoji": "👶",
        "age_min": 0,
        "age_max": 3,
        "base_risk_label": "VERY HIGH",
        "vulnerability_multiplier": 1.55,
        "max_safe_temp_c": 28.0,
        "precautions": [
            "Avoid direct heat exposure and unshaded outdoor environments.",
            "Keep infants in a well-ventilated, cool or air-conditioned space.",
            "Ensure regular feedings and hydration per caregiver/pediatric guidance.",
            "CRITICAL: Never leave infants or young children in parked vehicles.",
            "Monitor for flushed skin, lethargy, or reduced diaper output as signs of heat distress."
        ]
    },
    "child": {
        "id": "child",
        "name": "Children",
        "emoji": "🧒",
        "age_min": 4,
        "age_max": 15,
        "base_risk_label": "HIGH",
        "vulnerability_multiplier": 1.30,
        "max_safe_temp_c": 31.0,
        "precautions": [
            "Encourage scheduled hydration breaks every 15-20 minutes of play.",
            "Limit strenuous outdoor play and sports during peak afternoon heat (12 PM - 4 PM).",
            "Always choose shaded parkways, canal trails, and tree-lined walkways.",
            "Apply broad-spectrum sunscreen and wear breathable, light-colored hats.",
            "Provide child-friendly heat warnings and ensure access to misting or water stations."
        ]
    },
    "young_adult": {
        "id": "young_adult",
        "name": "Teenagers / Young Adults",
        "emoji": "🧑",
        "age_min": 16,
        "age_max": 22,
        "base_risk_label": "MODERATE–HIGH",
        "vulnerability_multiplier": 1.05,
        "max_safe_temp_c": 34.0,
        "precautions": [
            "Maintain proactive hydration before, during, and after outdoor athletics or transit.",
            "Reduce intense outdoor workouts during peak solar irradiance (11 AM - 3 PM).",
            "Select cooler, shaded pedestrian corridors when commuting across campus or downtown.",
            "Take periodic cooling breaks in shaded green spaces or air-conditioned facilities."
        ]
    },
    "adult": {
        "id": "adult",
        "name": "Adults",
        "emoji": "👨",
        "age_min": 23,
        "age_max": 50,
        "base_risk_label": "MODERATE",
        "vulnerability_multiplier": 1.00,
        "max_safe_temp_c": 35.0,
        "precautions": [
            "Drink plenty of water throughout the day and replenish essential electrolytes.",
            "Heed heat exposure warnings during midday urban commuting.",
            "Incorporate cooling rest periods during prolonged pedestrian transit.",
            "Prioritize lower-heat walking routes through urban tree canopies."
        ]
    },
    "older_adult": {
        "id": "older_adult",
        "name": "Older Adults",
        "emoji": "👴",
        "age_min": 51,
        "age_max": 100,
        "base_risk_label": "VERY HIGH",
        "vulnerability_multiplier": 1.45,
        "max_safe_temp_c": 29.5,
        "precautions": [
            "Remain in air-conditioned or well-shaded indoor environments during peak heat.",
            "Drink cool fluids regularly even before feeling thirsty to prevent dehydration.",
            "Avoid prolonged direct heat exposure, especially along asphalt corridors.",
            "Check on older adult neighbors and family members during high heat advisories.",
            "Seek immediate medical attention if experiencing dizziness, nausea, or rapid pulse."
        ]
    }
}

# ─── Outdoor Worker Mode Configuration ──────────────────────────────
WORKER_OCCUPATIONS: Dict[str, Dict[str, Any]] = {
    "construction": {"title": "Construction Worker", "default_exertion": "heavy", "icon": "🏗️"},
    "road_worker": {"title": "Road & Paving Worker", "default_exertion": "heavy", "icon": "🚧"},
    "delivery": {"title": "Delivery & Courier Worker", "default_exertion": "moderate", "icon": "📦"},
    "traffic_worker": {"title": "Traffic & Parking Worker", "default_exertion": "moderate", "icon": "🚦"},
    "street_vendor": {"title": "Street Vendor / Merchant", "default_exertion": "light", "icon": "🛒"},
    "maintenance": {"title": "Outdoor Maintenance Worker", "default_exertion": "moderate", "icon": "🧹"}
}

PHYSICAL_EXERTION_LEVELS: Dict[str, Dict[str, Any]] = {
    "light": {
        "multiplier": 1.15,
        "description": "Light outdoor duties (standing, periodic walking, inspecting, light handling)",
        "hydration_rate_oz_per_hr": 24,
        "base_work_rest_ratio": "50m work / 10m rest"
    },
    "moderate": {
        "multiplier": 1.35,
        "description": "Moderate physical labor (continuous walking, lifting <20 lbs, equipment handling)",
        "hydration_rate_oz_per_hr": 32,
        "base_work_rest_ratio": "45m work / 15m rest"
    },
    "heavy": {
        "multiplier": 1.60,
        "description": "Heavy physical exertion (heavy lifting, shoveling, roofing, asphalt paving)",
        "hydration_rate_oz_per_hr": 40,
        "base_work_rest_ratio": "30m work / 30m rest"
    }
}

# ─── Two-Hour Data Update Configuration ────────────────────────────
UPDATE_INTERVAL_SECONDS = 7200  # 2 Hours = 7200 seconds

# ─── Safety Disclaimer ─────────────────────────────────────────────
SAFETY_DISCLAIMER = (
    "General urban heat safety recommendations provided for awareness and decision support. "
    "Not intended as occupational regulation compliance or medical diagnosis/treatment."
)
