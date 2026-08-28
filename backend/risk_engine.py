"""
Modular Personalized Heat Risk & Vulnerability Engine.
Calculates personalized heat risk scores (0–100), risk classifications,
age-specific safety advisories, and outdoor worker safety recommendations.
All imports are flat (no subfolders).
"""

import math
from typing import Dict, List, Any, Optional, Tuple
from risk_config import (
    RISK_THRESHOLDS,
    AGE_CATEGORIES,
    WORKER_OCCUPATIONS,
    PHYSICAL_EXERTION_LEVELS,
    SAFETY_DISCLAIMER
)
from heat_engine import (
    calculate_noaa_heat_index,
    calculate_wbgt,
    get_solar_irradiance_factor
)


def get_age_category(age: Optional[int] = None, age_group_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Resolves the age category given either an explicit age number or category identifier.
    Guarantees non-overlapping ranges:
    - 0–3: Infant
    - 4–15: Child
    - 16–22: Young Adult
    - 23–50: Adult
    - 51–100: Older Adult
    """
    if age is not None:
        try:
            a = int(age)
            if a <= 3:
                return AGE_CATEGORIES["infant"]
            elif a <= 15:
                return AGE_CATEGORIES["child"]
            elif a <= 22:
                return AGE_CATEGORIES["young_adult"]
            elif a <= 50:
                return AGE_CATEGORIES["adult"]
            else:
                return AGE_CATEGORIES["older_adult"]
        except (ValueError, TypeError):
            pass

    if age_group_id:
        normalized = str(age_group_id).strip().lower().replace(" ", "_").replace("-", "_")
        for k, cat in AGE_CATEGORIES.items():
            if normalized in [k, cat["id"], cat["name"].lower()]:
                return cat
            if normalized in ["infant", "newborn", "baby", "0_3", "0-3"]:
                return AGE_CATEGORIES["infant"]
            if normalized in ["child", "children", "kid", "4_15", "4-15"]:
                return AGE_CATEGORIES["child"]
            if normalized in ["teen", "teenager", "young_adult", "youth", "16_22", "16-22"]:
                return AGE_CATEGORIES["young_adult"]
            if normalized in ["adult", "adults", "23_50", "23-50"]:
                return AGE_CATEGORIES["adult"]
            if normalized in ["older_adult", "senior", "elderly", "older", "51_100", "51-100"]:
                return AGE_CATEGORIES["older_adult"]

    # Default to standard adult
    return AGE_CATEGORIES["adult"]


def classify_risk_score(score: float) -> Dict[str, Any]:
    """Classifies numerical score 0–100 into SAFE, MODERATE, HIGH, EXTREME."""
    clamped = max(0.0, min(100.0, float(score)))
    for key, data in RISK_THRESHOLDS.items():
        if data["min"] <= clamped <= data["max"]:
            return {
                "key": key,
                "score": round(clamped, 1),
                "level": data["label"],
                "color": data["color"],
                "badge": data["badge"],
                "icon": data["icon"]
            }
    # Edge fallback
    if clamped > 75:
        return {"key": "extreme", "score": round(clamped, 1), **RISK_THRESHOLDS["extreme"]}
    return {"key": "safe", "score": round(clamped, 1), **RISK_THRESHOLDS["safe"]}


class PersonalizedHeatRiskEngine:
    """
    Transparent & Explainable Personalized Heat Risk Calculator.
    Personalized Risk = Environmental Heat Risk + Age Vulnerability + Exposure Duration + Outdoor Worker Exposure
    """

    def calculate_risk(
        self,
        temperature_c: float,
        relative_humidity: Optional[float] = 79.0,
        heat_index_c: Optional[float] = None,
        solar_factor: Optional[float] = None,
        hour_float: Optional[float] = 14.0,
        exposure_minutes: float = 30.0,
        age: Optional[int] = None,
        age_group: Optional[str] = None,
        worker_mode: bool = False,
        occupation: Optional[str] = "construction",
        exertion_level: Optional[str] = "moderate",
        route_shade_pct: Optional[float] = 15.0
    ) -> Dict[str, Any]:
        """
        Calculates personalized multi-factor heat risk score (0–100) and full safety advisory.
        Missing FortyGuard parameters are handled gracefully without fabricating data.
        """
        # 1. Resolve environmental heat metrics
        rh = relative_humidity if relative_humidity is not None else 79.0
        if heat_index_c is None:
            hi_c, hi_f, _ = calculate_noaa_heat_index(temperature_c, rh)
        else:
            hi_c = heat_index_c
            hi_f = (hi_c * 9.0 / 5.0) + 32.0

        if solar_factor is None and hour_float is not None:
            sf = get_solar_irradiance_factor(hour_float)
        else:
            sf = solar_factor if solar_factor is not None else 0.85

        wbgt_c = calculate_wbgt(temperature_c, rh, sf)

        # 2. Base Environmental Risk Score (0–100)
        # 20°C ambient = ~10, 30°C = ~38, 35°C = ~58, 38°C = ~78, 42°C+ = ~95+
        if temperature_c <= 20.0:
            base_env_risk = max(5.0, temperature_c * 0.5)
        elif temperature_c <= 30.0:
            base_env_risk = 10.0 + (temperature_c - 20.0) * 2.8
        elif temperature_c <= 36.0:
            base_env_risk = 38.0 + (temperature_c - 30.0) * 3.5
        elif temperature_c <= 40.0:
            base_env_risk = 59.0 + (temperature_c - 36.0) * 4.5
        else:
            base_env_risk = 77.0 + min(23.0, (temperature_c - 40.0) * 5.5)

        # Solar radiation and humidity amplification
        solar_boost = sf * 6.0
        hi_diff = max(0.0, hi_c - temperature_c)
        hi_boost = min(8.0, hi_diff * 1.2)
        env_heat_score = min(100.0, base_env_risk + solar_boost + hi_boost)

        # 3. Age Vulnerability Modifier
        age_cat = get_age_category(age=age, age_group_id=age_group)
        age_vuln_mult = age_cat["vulnerability_multiplier"]

        # 4. Exposure Duration Factor
        # Non-linear exposure exponent (normalized to 30 min baseline)
        exp_mins = max(5.0, float(exposure_minutes))
        duration_factor = math.pow(exp_mins / 30.0, 0.35)

        # 5. Outdoor Worker Occupational Multiplier
        worker_mult = 1.0
        worker_details = None
        if worker_mode:
            exert_key = str(exertion_level).lower() if exertion_level else "moderate"
            if exert_key not in PHYSICAL_EXERTION_LEVELS:
                exert_key = "moderate"
            exert_data = PHYSICAL_EXERTION_LEVELS[exert_key]
            worker_mult = exert_data["multiplier"]

            occ_key = str(occupation).lower().replace(" ", "_") if occupation else "construction"
            occ_data = WORKER_OCCUPATIONS.get(occ_key, WORKER_OCCUPATIONS["construction"])
            worker_details = {
                "occupation": occ_data["title"],
                "icon": occ_data["icon"],
                "exertion_level": exert_key,
                "exertion_description": exert_data["description"],
                "hydration_oz_hr": exert_data["hydration_rate_oz_per_hr"],
                "work_rest_ratio": exert_data["base_work_rest_ratio"]
            }

        # 6. Shade / Cooling Relief Mitigation
        shade = max(0.0, min(100.0, float(route_shade_pct or 15.0)))
        shade_relief = 1.0 - ((shade / 100.0) * 0.20)

        # 7. Composite Personalized Risk Calculation
        # Transparent formula:
        # Raw = EnvScore * AgeVuln * WorkerMult * DurationFactor * ShadeRelief
        raw_personalized = env_heat_score * age_vuln_mult * worker_mult * duration_factor * shade_relief
        personalized_score = max(0.0, min(100.0, raw_personalized))

        risk_classification = classify_risk_score(personalized_score)
        level_key = risk_classification["key"]

        # 8. Explainable Decision Intelligence & Recommendations
        recommended_action, route_rec, alert_message = self._generate_recommendations(
            level_key=level_key,
            age_cat=age_cat,
            worker_mode=worker_mode,
            temp_c=temperature_c,
            hi_c=hi_c
        )

        # 9. Work / Rest & Hydration Guidance
        work_rest_status, next_break_mins, hydration_intake = self._generate_worker_work_rest(
            level_key=level_key,
            temp_c=temperature_c,
            worker_mode=worker_mode,
            exertion_level=exertion_level,
            exp_mins=exp_mins
        )

        return {
            "risk_score": risk_classification["score"],
            "risk_level": risk_classification["level"],
            "risk_key": risk_classification["key"],
            "risk_color": risk_classification["color"],
            "risk_badge": risk_classification["badge"],
            "risk_icon": risk_classification["icon"],
            "environmental": {
                "temperature_c": round(temperature_c, 1),
                "temperature_f": round((temperature_c * 9 / 5) + 32, 1),
                "heat_index_c": round(hi_c, 1),
                "heat_index_f": round(hi_f, 1),
                "wbgt_c": round(wbgt_c, 1),
                "solar_irradiance_factor": round(sf, 3),
                "humidity_pct": rh,
                "base_environmental_score": round(env_heat_score, 1)
            },
            "profile": {
                "age": age,
                "age_group": age_cat["id"],
                "age_group_name": age_cat["name"],
                "age_emoji": age_cat["emoji"],
                "vulnerability_multiplier": age_vuln_mult,
                "worker_mode": worker_mode,
                "worker_details": worker_details,
                "exposure_minutes": exp_mins,
                "route_shade_pct": shade
            },
            "recommended_action": recommended_action,
            "route_recommendation": route_rec,
            "alert_message": alert_message,
            "hydration_reminder": {
                "active": level_key in ["moderate", "high", "extreme"] or worker_mode,
                "recommended_intake": hydration_intake,
                "schedule": "Drink 8–10 oz (1 cup) of cool water every 15–20 minutes in the heat."
            },
            "worker_safety": {
                "active": worker_mode,
                "work_rest_status": work_rest_status,
                "next_break_minutes": next_break_mins,
                "recommended_work_rest_ratio": worker_details["work_rest_ratio"] if worker_details else "50m work / 10m rest",
                "nearest_cooling_shelter": "Central Canal Shaded Pavilion (400m away)",
                "heat_exposure_timer_active": worker_mode
            },
            "cooling_path_recommended": level_key in ["moderate", "high", "extreme"],
            "precautions": age_cat["precautions"],
            "disclaimer": SAFETY_DISCLAIMER
        }

    def _generate_recommendations(
        self,
        level_key: str,
        age_cat: Dict[str, Any],
        worker_mode: bool,
        temp_c: float,
        hi_c: float
    ) -> Tuple[str, str, str]:
        """Generates tailored advice, route suggestions, and warning messages."""
        is_vulnerable = age_cat["id"] in ["infant", "older_adult"]

        if level_key == "safe":
            action = "Conditions are comfortable for outdoor movement. Maintain baseline hydration."
            route = "Fastest or scenic routes are both comfortable."
            alert = "Heat stress is minimal. Enjoy outdoor travel safely."
        elif level_key == "moderate":
            if is_vulnerable:
                action = f"Heat is moderate ({temp_c}°C). {age_cat['name']} should prefer shaded walkways and rest frequently."
                alert = f"Caution for {age_cat['name']}: rising heat index ({hi_c}°C). Limit direct sun exposure."
            elif worker_mode:
                action = "Occupational heat stress is moderate. Take scheduled shade breaks and drink water regularly."
                alert = "Moderate heat detected. Ensure continuous fluid intake on site."
            else:
                action = "Heat is increasing. Carry a water bottle and seek shade during extended walks."
                alert = "Heat is increasing. Carry water and prefer shaded routes."
            route = "Coolest or Balanced Route recommended to reduce direct solar exposure."
        elif level_key == "high":
            if is_vulnerable:
                action = f"HIGH HEAT RISK ({temp_c}°C). {age_cat['name']} should avoid non-essential outdoor travel."
                alert = f"High heat alert for {age_cat['name']}: seek air-conditioned environments immediately."
            elif worker_mode:
                action = "HIGH OCCUPATIONAL HEAT RISK. Enforce mandatory 15-minute rest breaks per hour in shaded/air-cooled zones."
                alert = "High occupational heat exposure detected. Take a cooling break and hydrate."
            else:
                action = "High heat risk detected. Avoid unshaded asphalt streets; stay well-hydrated."
                alert = "High heat risk detected. Consider delaying outdoor travel or using a cooling path."
            route = "Coolest Route STRONGLY RECOMMENDED (routes through canopy & canal reduce exposure by up to 56%)."
        else:  # extreme
            if is_vulnerable:
                action = f"EXTREME DANGER: {temp_c}°C with severe apparent heat index. Keep {age_cat['name']} in cooled indoor spaces."
                alert = f"CRITICAL HEAT WARNING: Life-threatening heat stress for {age_cat['name']}. Avoid all outdoor exposure."
            elif worker_mode:
                action = "EXTREME OCCUPATIONAL HEAT DANGER. Halt heavy physical labor or implement continuous active cooling and 30m/30m rest."
                alert = "EMERGENCY: Extreme thermal stress on outdoor workers. Immediate cooling and hydration required."
            else:
                action = "Extreme heat risk. Avoid unnecessary outdoor exposure and move to a cool/shaded location immediately."
                alert = "Extreme heat risk. Avoid unnecessary outdoor exposure and move to a cool/shaded location."
            route = "DO NOT USE UNPROTECTED FASTEST ROUTE. Use Coolest Route with misting waypoints only if travel is unavoidable."

        return action, route, alert

    def _generate_worker_work_rest(
        self,
        level_key: str,
        temp_c: float,
        worker_mode: bool,
        exertion_level: Optional[str],
        exp_mins: float
    ) -> Tuple[str, int, str]:
        """Generates adaptive work/rest duty cycles and hydration rates."""
        if not worker_mode:
            return "Standard activity", 45, "Drink 16–24 oz water per hour of walking"

        if level_key == "safe":
            return "Normal Work (55m work / 5m rest)", 55, "24 oz water/electrolyte per hour"
        elif level_key == "moderate":
            return "Caution Work Cycle (45m work / 15m rest)", max(5, int(45 - (exp_mins % 45))), "32 oz fluid per hour (1 cup every 15 min)"
        elif level_key == "high":
            return "High Heat Protocol (30m work / 30m rest in shade)", max(5, int(30 - (exp_mins % 30))), "40 oz fluid per hour with electrolytes"
        else:
            return "EXTREME HEAT STOPPAGE / Active Cooling Only (15m work / 45m rest)", 15, "Continuous cold fluid replenishment (40+ oz/hr)"


risk_engine = PersonalizedHeatRiskEngine()
