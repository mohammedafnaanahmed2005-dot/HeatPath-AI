"""
Public Asset Heat Vulnerability Auditor for HeatPath AI.
Ranks bus stops, playgrounds, schools, hospitals using Track 1 multi-criteria formula:
  Priority Score = 0.50 * Peak Heat + 0.25 * Exposure Duration + 0.15 * Lack of Shade + 0.10 * Vulnerability
All imports are flat (no subfolders).
"""

from typing import Dict, List, Any
from data_assets import PUBLIC_ASSETS_DATA
from fortyguard_service import fortyguard_service


class AssetAuditService:
    def audit_assets(self, time_query: str = "14:00") -> Dict[str, Any]:
        """Evaluates and ranks all public assets by heat exposure priority."""
        hour_float = fortyguard_service.parse_hour(time_query)
        scored_assets = []

        for asset in PUBLIC_ASSETS_DATA:
            tdata = fortyguard_service.calculate_location_temperature(
                lat=asset["lat"], lng=asset["lng"], hour_float=hour_float
            )

            temp_c = tdata["temperature_c"]
            surface_c = tdata["surface_temp_c"]
            shade_pct = asset["current_shade_pct"]
            duration_mins = asset["exposure_duration_mins"]
            vuln_pct = asset["vulnerable_population_pct"]

            # Normalize each dimension to 0-100
            heat_score = min(100.0, max(0.0, (temp_c - 28.0) / (42.0 - 28.0) * 100.0))
            duration_score = min(100.0, max(0.0, (duration_mins / 60.0) * 100.0))
            shade_deficit_score = min(100.0, max(0.0, (100.0 - shade_pct)))
            vulnerability_score = min(100.0, max(0.0, vuln_pct))

            # Weighted priority
            priority = (0.50 * heat_score +
                        0.25 * duration_score +
                        0.15 * shade_deficit_score +
                        0.10 * vulnerability_score)
            priority = round(min(100.0, priority), 1)

            # Urgency badge
            if priority >= 80:
                badge, urgency_color = "🔴 Critical", "#ef4444"
            elif priority >= 60:
                badge, urgency_color = "🟠 High", "#f97316"
            elif priority >= 40:
                badge, urgency_color = "🟡 Moderate", "#eab308"
            else:
                badge, urgency_color = "🟢 Low", "#10b981"

            scored_assets.append({
                "id": asset["id"],
                "name": asset["name"],
                "type": asset["type"],
                "lat": asset["lat"],
                "lng": asset["lng"],
                "description": asset["description"],
                "daily_users": asset["daily_users"],
                "vulnerable_population_pct": vuln_pct,
                "current_shade_pct": shade_pct,
                "exposure_duration_mins": duration_mins,
                "temperature_c": round(temp_c, 1),
                "temperature_f": round((temp_c * 9 / 5) + 32, 1),
                "surface_temp_c": round(surface_c, 1),
                "heat_index_c": tdata["heat_index_c"],
                "risk": tdata["risk"],
                "priority_score": priority,
                "heat_component": round(heat_score, 1),
                "duration_component": round(duration_score, 1),
                "shade_deficit_component": round(shade_deficit_score, 1),
                "vulnerability_component": round(vulnerability_score, 1),
                "badge": badge,
                "urgency_color": urgency_color,
                "target_intervention": asset["target_intervention"]
            })

        scored_assets.sort(key=lambda a: a["priority_score"], reverse=True)
        for i, a in enumerate(scored_assets):
            a["rank"] = i + 1

        return {
            "time": time_query,
            "total_assets": len(scored_assets),
            "critical_count": sum(1 for a in scored_assets if a["priority_score"] >= 80),
            "assets": scored_assets
        }


asset_audit_service = AssetAuditService()
