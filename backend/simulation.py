"""
Digital Twin Urban Heat Intervention Simulator for HeatPath AI.
Simulates microclimate cooling impacts of Tree Canopy, Cool Pavement,
Cool Roofs, and Misting Structures. All imports are flat (no subfolders).
"""

from typing import Dict, List, Any
from fortyguard_service import fortyguard_service


class SimulationService:
    def simulate_interventions(
        self,
        target_lat: float = 39.7684,
        target_lng: float = -86.1580,
        time_query: str = "14:00",
        interventions: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Simulates microclimate thermal transformation before vs after interventions."""
        if interventions is None:
            interventions = {
                "tree_canopy": True, "reflective_pavement": True,
                "cool_roofs": False, "misting_stations": False,
                "tree_canopy_coverage_pct": 35, "pavement_albedo": 0.40
            }

        hour_float = fortyguard_service.parse_hour(time_query)
        baseline = fortyguard_service.calculate_location_temperature(
            lat=target_lat, lng=target_lng, hour_float=hour_float, intervention_cooling_delta=0.0
        )

        base_ambient_c = baseline["temperature_c"]
        base_surface_c = baseline["surface_temp_c"]
        base_heat_index_c = baseline["heat_index_c"]

        ambient_delta_c = 0.0
        surface_delta_c = 0.0
        applied_items = []
        cost_estimate_usd = 0
        co2_reduction_tons_yr = 0.0

        if interventions.get("tree_canopy", False):
            canopy_pct = interventions.get("tree_canopy_coverage_pct", 35)
            tree_ambient = (canopy_pct / 100.0) * 4.8
            tree_surface = (canopy_pct / 100.0) * 18.5
            ambient_delta_c += tree_ambient
            surface_delta_c += tree_surface
            applied_items.append({
                "type": "tree_canopy",
                "name": f"Deciduous Tree Canopy ({canopy_pct}% Coverage)",
                "ambient_cooling_c": round(tree_ambient, 2),
                "surface_cooling_c": round(tree_surface, 2),
                "mechanism": "Evapotranspirative latent heat absorption + solar interception"
            })
            cost_estimate_usd += int(canopy_pct * 850)
            co2_reduction_tons_yr += round(canopy_pct * 0.45, 1)

        if interventions.get("reflective_pavement", False):
            target_albedo = interventions.get("pavement_albedo", 0.40)
            albedo_delta = max(0.0, target_albedo - 0.08)
            pav_ambient = albedo_delta * 6.5
            pav_surface = albedo_delta * 38.0
            ambient_delta_c += pav_ambient
            surface_delta_c += pav_surface
            applied_items.append({
                "type": "reflective_pavement",
                "name": f"High-Albedo Cool Pavement (Albedo {target_albedo})",
                "ambient_cooling_c": round(pav_ambient, 2),
                "surface_cooling_c": round(pav_surface, 2),
                "mechanism": "High solar reflectance preventing sensible thermal storage"
            })
            cost_estimate_usd += 18500

        if interventions.get("cool_roofs", False):
            ambient_delta_c += 1.2
            surface_delta_c += 15.0
            applied_items.append({
                "type": "cool_roofs",
                "name": "High-Reflectance Commercial Cool Roof Coating",
                "ambient_cooling_c": 1.2, "surface_cooling_c": 15.0,
                "mechanism": "Reduces building HVAC cooling load & rooftop sensible exhaust"
            })
            cost_estimate_usd += 12000
            co2_reduction_tons_yr += 8.2

        if interventions.get("misting_stations", False):
            ambient_delta_c += 2.0
            surface_delta_c += 8.0
            applied_items.append({
                "type": "misting_stations",
                "name": "Solar-Powered Evaporative Misting Trellis",
                "ambient_cooling_c": 2.0, "surface_cooling_c": 8.0,
                "mechanism": "Direct flash evaporative cooling for pedestrian microclimate"
            })
            cost_estimate_usd += 7500

        ambient_delta_c = min(7.5, ambient_delta_c)
        surface_delta_c = min(28.0, surface_delta_c)

        simulated = fortyguard_service.calculate_location_temperature(
            lat=target_lat, lng=target_lng, hour_float=hour_float,
            intervention_cooling_delta=ambient_delta_c
        )

        sim_ambient_c = simulated["temperature_c"]
        sim_surface_c = max(sim_ambient_c, base_surface_c - surface_delta_c)
        sim_heat_index_c = simulated["heat_index_c"]
        heat_index_reduction_c = round(base_heat_index_c - sim_heat_index_c, 1)

        return {
            "target_location": {"lat": target_lat, "lng": target_lng},
            "time": time_query,
            "before": {
                "ambient_temp_c": round(base_ambient_c, 1),
                "ambient_temp_f": round((base_ambient_c * 9 / 5) + 32, 1),
                "surface_temp_c": round(base_surface_c, 1),
                "surface_temp_f": round((base_surface_c * 9 / 5) + 32, 1),
                "heat_index_c": round(base_heat_index_c, 1),
                "risk": baseline["risk"]
            },
            "after": {
                "ambient_temp_c": round(sim_ambient_c, 1),
                "ambient_temp_f": round((sim_ambient_c * 9 / 5) + 32, 1),
                "surface_temp_c": round(sim_surface_c, 1),
                "surface_temp_f": round((sim_surface_c * 9 / 5) + 32, 1),
                "heat_index_c": round(sim_heat_index_c, 1),
                "risk": simulated["risk"]
            },
            "impact_metrics": {
                "ambient_reduction_c": round(ambient_delta_c, 1),
                "ambient_reduction_f": round(ambient_delta_c * 9 / 5, 1),
                "surface_reduction_c": round(surface_delta_c, 1),
                "surface_reduction_f": round(surface_delta_c * 9 / 5, 1),
                "heat_index_reduction_c": heat_index_reduction_c,
                "heat_index_reduction_f": round(heat_index_reduction_c * 9 / 5, 1),
                "estimated_capital_cost_usd": cost_estimate_usd,
                "estimated_co2_offset_tons_yr": co2_reduction_tons_yr,
                "applied_interventions": applied_items,
                "verdict": f"Interventions produce a {round(ambient_delta_c, 1)}°C ({round(ambient_delta_c * 9 / 5, 1)}°F) ambient air cooling delta and reduce surface heat by {round(surface_delta_c, 1)}°C."
            }
        }


simulation_service = SimulationService()
