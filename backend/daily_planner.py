"""
Daily Heat Planner for HeatPath AI.
Generates personalized, time-of-day cooling schedules across 6 diurnal periods
using dynamic FortyGuard microclimate matrices and personalized risk modifiers.
All imports are flat (no subfolders).
"""

from typing import Dict, List, Any, Optional
from fortyguard_service import fortyguard_service
from risk_engine import risk_engine, get_age_category
from heat_engine import get_solar_irradiance_factor


DAILY_PERIOD_DEFINITIONS = [
    {
        "id": "early_morning",
        "time_range": "6 AM – 9 AM",
        "label": "Early Morning",
        "representative_hour": 7.5,
        "time_str": "07:30",
        "icon": "🌅",
        "cooling_areas": ["Military Park Shaded Trails", "Canal Walk Towpath (East Bank)"]
    },
    {
        "id": "late_morning",
        "time_range": "9 AM – 12 PM",
        "label": "Late Morning",
        "representative_hour": 10.5,
        "time_str": "10:30",
        "icon": "☀️",
        "cooling_areas": ["White River Promenade Canopy", "Eskenazi Hospital Shaded Plaza"]
    },
    {
        "id": "midday_peak",
        "time_range": "12 PM – 3 PM",
        "label": "Midday Peak Solar Heat",
        "representative_hour": 13.5,
        "time_str": "13:30",
        "icon": "🔥",
        "cooling_areas": ["Statehouse Fountain Misting Pavilion", "Central Canal Riparian Underpass"]
    },
    {
        "id": "late_afternoon",
        "time_range": "3 PM – 6 PM",
        "label": "Late Afternoon Thermal Lag",
        "representative_hour": 16.0,
        "time_str": "16:00",
        "icon": "🌡️",
        "cooling_areas": ["Mass Ave Covered Arcades", "Military Park Oak Meadow Shade"]
    },
    {
        "id": "evening",
        "time_range": "6 PM – 9 PM",
        "label": "Evening Cooling",
        "representative_hour": 19.5,
        "time_str": "19:30",
        "icon": "🌆",
        "cooling_areas": ["Monument Circle Tree Plaza", "Canal Basin Green Parkway"]
    },
    {
        "id": "overnight",
        "time_range": "9 PM – 6 AM",
        "label": "Overnight Ambient",
        "representative_hour": 2.0,
        "time_str": "02:00",
        "icon": "🌙",
        "cooling_areas": ["Open Urban Green Corridors"]
    }
]


class DailyHeatPlannerService:
    def generate_daily_plan(
        self,
        age: Optional[int] = None,
        age_group: Optional[str] = "adult",
        worker_mode: bool = False,
        occupation: Optional[str] = "construction",
        exertion_level: Optional[str] = "moderate"
    ) -> Dict[str, Any]:
        """
        Synthesizes a 24-hour diurnal heat schedule customized for the user's safety profile.
        Uses actual 24-hour FortyGuard microclimate variations.
        """
        age_cat = get_age_category(age=age, age_group_id=age_group)
        periods_output = []

        # Reference coordinate: Downtown Indianapolis Core (Monument Circle)
        ref_lat = 39.7684
        ref_lng = -86.1580

        for period in DAILY_PERIOD_DEFINITIONS:
            hour_float = period["representative_hour"]

            # Compute microclimate for this period from FortyGuard model
            loc_data = fortyguard_service.calculate_location_temperature(
                lat=ref_lat, lng=ref_lng, hour_float=hour_float
            )

            # Compute personalized risk for this period
            risk_result = risk_engine.calculate_risk(
                temperature_c=loc_data["temperature_c"],
                relative_humidity=79.0,
                heat_index_c=loc_data["heat_index_c"],
                solar_factor=loc_data["solar_irradiance_factor"],
                hour_float=hour_float,
                exposure_minutes=30.0,
                age=age,
                age_group=age_group,
                worker_mode=worker_mode,
                occupation=occupation,
                exertion_level=exertion_level,
                route_shade_pct=loc_data.get("canopy_cover_pct", 20.0)
            )

            # Generate period-specific activity level & precautions
            activity_level, activity_guidance = self._determine_activity_level(
                risk_level=risk_result["risk_level"],
                age_cat=age_cat,
                worker_mode=worker_mode,
                period_id=period["id"]
            )

            periods_output.append({
                "id": period["id"],
                "time_range": period["time_range"],
                "label": period["label"],
                "representative_time": period["time_str"],
                "icon": period["icon"],
                "ambient_temp_c": loc_data["temperature_c"],
                "ambient_temp_f": loc_data["temperature_f"],
                "surface_temp_c": loc_data["surface_temp_c"],
                "heat_index_c": loc_data["heat_index_c"],
                "solar_irradiance": loc_data["solar_irradiance_factor"],
                "risk_score": risk_result["risk_score"],
                "risk_level": risk_result["risk_level"],
                "risk_color": risk_result["risk_color"],
                "risk_badge": risk_result["risk_badge"],
                "risk_icon": risk_result["risk_icon"],
                "activity_level": activity_level,
                "activity_guidance": activity_guidance,
                "recommended_route": risk_result["route_recommendation"],
                "cooling_areas": period["cooling_areas"],
                "hydration_reminder": risk_result["hydration_reminder"]["recommended_intake"],
                "precautions": risk_result["precautions"][:3],
                "worker_work_rest": risk_result["worker_safety"]["work_rest_status"] if worker_mode else None
            })

        return {
            "profile": {
                "age": age,
                "age_group": age_cat["id"],
                "age_group_name": age_cat["name"],
                "age_emoji": age_cat["emoji"],
                "worker_mode": worker_mode,
                "occupation": occupation if worker_mode else None,
                "exertion_level": exertion_level if worker_mode else None
            },
            "total_periods": len(periods_output),
            "peak_risk_period": "Midday Peak Solar Heat (12 PM – 3 PM)" if not worker_mode else "Late Afternoon Thermal Lag (3 PM – 6 PM)",
            "periods": periods_output
        }

    def _determine_activity_level(
        self,
        risk_level: str,
        age_cat: Dict[str, Any],
        worker_mode: bool,
        period_id: str
    ) -> tuple[str, str]:
        """Determines tailored activity level descriptor and specific practical advice."""
        if risk_level == "SAFE":
            return (
                "Full Outdoor Activity Allowed",
                "Optimal window for outdoor exercise, commuting, play, and heavy tasks."
            )
        elif risk_level == "MODERATE":
            if worker_mode:
                return (
                    "Moderate Work with 15m Breaks",
                    "Maintain continuous hydration; schedule heavy lifting before peak solar noon."
                )
            elif age_cat["id"] in ["infant", "older_adult"]:
                return (
                    "Light Activity in Shaded Areas",
                    "Keep outdoor exposure under 20 minutes and drink cool fluids."
                )
            else:
                return (
                    "Moderate Outdoor Activity with Hydration",
                    "Wear sunscreen and sunglasses; prefer shaded corridors."
                )
        elif risk_level == "HIGH":
            if worker_mode:
                return (
                    "Reduced Workload / Mandatory 30m Shade Rest",
                    "Rotate workers into shaded or air-conditioned break areas; enforce electrolyte intake."
                )
            elif age_cat["id"] in ["infant", "older_adult"]:
                return (
                    "Stay Indoors / Minimal Heat Exposure",
                    "Vulnerable individuals should avoid outdoor transit; use air-conditioned transit."
                )
            else:
                return (
                    "Limit Strenuous Exertion",
                    "Postpone intense running or athletics; choose Heat-Aware Cool Routes."
                )
        else:  # EXTREME
            if worker_mode:
                return (
                    "CRITICAL: Halt Heavy Physical Labor",
                    "Dangerous thermal stress. Mandatory active cooling and fluid replenishment."
                )
            return (
                "Dangerous Heat: Avoid All Outdoor Exposure",
                "Stay in air-conditioned environments. Heat illness risk is severe."
            )


daily_planner_service = DailyHeatPlannerService()
