"""
Urban Road Network & Personalized Cooling Path Service for HeatPath AI.
Constructs thermal-attributed walking networks across Indianapolis and
runs multi-objective route comparisons (Fastest vs Balanced vs Coolest / Cooling Path)
incorporating individual age vulnerability and occupational worker multipliers.
All imports are flat (no subfolders).
"""

import math
from typing import Dict, List, Any, Optional
from heat_astar import HeatAStarRouter, haversine_distance_m
from fortyguard_service import fortyguard_service
from risk_engine import get_age_category, risk_engine
from risk_config import PHYSICAL_EXERTION_LEVELS


class RoutingService:
    def __init__(self):
        self.router = HeatAStarRouter(walking_speed_mps=1.25)
        self.base_graph = self._build_indianapolis_network()

    def _build_indianapolis_network(self) -> Dict[str, Any]:
        """Builds comprehensive topological road network for Indianapolis urban center."""
        nodes = {
            "N_MONUMENT_CIRCLE": {"name": "Monument Circle Center", "lat": 39.768403, "lng": -86.158068, "type": "civic"},
            "N_MARKET_EAST": {"name": "East Market & Delaware St", "lat": 39.768500, "lng": -86.153000, "type": "commercial"},
            "N_CARSON_TRANSIT": {"name": "Carson Transit Center", "lat": 39.764800, "lng": -86.148800, "type": "transit"},
            "N_WASHINGTON_EAST": {"name": "Washington & Alabama St", "lat": 39.767200, "lng": -86.151500, "type": "arterial"},
            "N_WASHINGTON_WEST": {"name": "Washington & Capitol Ave", "lat": 39.767300, "lng": -86.162500, "type": "arterial"},
            "N_CAPITOL_NORTH": {"name": "Capitol & Ohio St", "lat": 39.770000, "lng": -86.162400, "type": "street"},
            "N_STATE_HOUSE": {"name": "Indiana Statehouse Plaza", "lat": 39.768800, "lng": -86.162700, "type": "civic"},
            "N_CANAL_SOUTH": {"name": "Canal Walk South Basin", "lat": 39.768000, "lng": -86.166500, "type": "riparian"},
            "N_CANAL_MID": {"name": "Canal Walk Ohio St Bridge", "lat": 39.770200, "lng": -86.165800, "type": "riparian"},
            "N_CANAL_NORTH": {"name": "Canal Walk Michigan St", "lat": 39.774500, "lng": -86.164500, "type": "riparian"},
            "N_MILITARY_PARK_E": {"name": "Military Park East Entrance", "lat": 39.770500, "lng": -86.168500, "type": "park"},
            "N_MILITARY_PARK_W": {"name": "Military Park West Lawn", "lat": 39.771200, "lng": -86.172000, "type": "park"},
            "N_WHITE_RIVER_STATE": {"name": "White River Promenade", "lat": 39.767000, "lng": -86.171000, "type": "park"},
            "N_ESKENAZI_HEALTH": {"name": "Eskenazi Health Complex", "lat": 39.776000, "lng": -86.179500, "type": "hospital"},
            "N_IUPUI_CAMPUS_CTR": {"name": "IUPUI Campus Center", "lat": 39.774000, "lng": -86.176000, "type": "campus"},
            "N_MASS_AVE_S": {"name": "Mass Ave & Delaware St", "lat": 39.771500, "lng": -86.153500, "type": "arts_district"},
            "N_MASS_AVE_N": {"name": "Mass Ave Cultural Trail", "lat": 39.776500, "lng": -86.148000, "type": "arts_district"},
            "N_FOUNTAIN_SQUARE": {"name": "Fountain Square South Plaza", "lat": 39.751200, "lng": -86.141500, "type": "neighborhood"},
            "N_MERIDIAN_SOUTH": {"name": "South Meridian & Morris St", "lat": 39.750000, "lng": -86.158500, "type": "arterial"},
            "N_MERIDIAN_NORTH": {"name": "North Meridian & 10th St", "lat": 39.781500, "lng": -86.157500, "type": "arterial"}
        }

        edges = [
            {"u": "N_CARSON_TRANSIT", "v": "N_WASHINGTON_EAST", "name": "E Washington St High-Traffic Arterial", "surface": "asphalt", "shade_pct": 10, "albedo": 0.06},
            {"u": "N_WASHINGTON_EAST", "v": "N_MARKET_EAST", "name": "Delaware St Commercial Transit Corridor", "surface": "asphalt", "shade_pct": 14, "albedo": 0.07},
            {"u": "N_MARKET_EAST", "v": "N_MONUMENT_CIRCLE", "name": "East Market Street", "surface": "asphalt_concrete", "shade_pct": 20, "albedo": 0.12},
            {"u": "N_MONUMENT_CIRCLE", "v": "N_WASHINGTON_WEST", "name": "W Market / Capitol Connector", "surface": "asphalt", "shade_pct": 18, "albedo": 0.08},
            {"u": "N_WASHINGTON_WEST", "v": "N_STATE_HOUSE", "name": "Capitol Ave Unshaded Asphalt", "surface": "asphalt", "shade_pct": 15, "albedo": 0.06},
            {"u": "N_STATE_HOUSE", "v": "N_CAPITOL_NORTH", "name": "North Capitol Corridor", "surface": "asphalt", "shade_pct": 16, "albedo": 0.08},
            {"u": "N_CAPITOL_NORTH", "v": "N_MERIDIAN_NORTH", "name": "North Meridian Highway Arterial", "surface": "asphalt", "shade_pct": 12, "albedo": 0.05},
            {"u": "N_WASHINGTON_WEST", "v": "N_CANAL_SOUTH", "name": "Historic Canal Walk South Shaded Trail", "surface": "pervious_stone", "shade_pct": 65, "albedo": 0.28},
            {"u": "N_CANAL_SOUTH", "v": "N_CANAL_MID", "name": "Central Canal Riparian Canopy Promenade", "surface": "stone_pavers", "shade_pct": 75, "albedo": 0.30},
            {"u": "N_CANAL_MID", "v": "N_CANAL_NORTH", "name": "Canal North Tree-Lined Towpath", "surface": "crushed_gravel_lawn", "shade_pct": 70, "albedo": 0.25},
            {"u": "N_CANAL_MID", "v": "N_MILITARY_PARK_E", "name": "Military Park Tree Shaded Arcade", "surface": "turf_paver", "shade_pct": 80, "albedo": 0.24},
            {"u": "N_MILITARY_PARK_E", "v": "N_MILITARY_PARK_W", "name": "Military Park Oak Meadow Walk", "surface": "pervious_path", "shade_pct": 85, "albedo": 0.22},
            {"u": "N_MILITARY_PARK_E", "v": "N_WHITE_RIVER_STATE", "name": "White River Promenade & Green Riverway", "surface": "concrete_lawn", "shade_pct": 70, "albedo": 0.26},
            {"u": "N_CANAL_SOUTH", "v": "N_WHITE_RIVER_STATE", "name": "South Canal Lawn Promenade", "surface": "lawn_path", "shade_pct": 60, "albedo": 0.25},
            {"u": "N_CANAL_NORTH", "v": "N_IUPUI_CAMPUS_CTR", "name": "IUPUI Green Courtyard Connector", "surface": "brick_pavers", "shade_pct": 55, "albedo": 0.26},
            {"u": "N_IUPUI_CAMPUS_CTR", "v": "N_ESKENAZI_HEALTH", "name": "Health Campus Shaded Walkway", "surface": "concrete_canopy", "shade_pct": 60, "albedo": 0.32},
            {"u": "N_MILITARY_PARK_W", "v": "N_IUPUI_CAMPUS_CTR", "name": "West Campus Tree Avenue", "surface": "concrete", "shade_pct": 50, "albedo": 0.25},
            {"u": "N_MILITARY_PARK_W", "v": "N_ESKENAZI_HEALTH", "name": "Direct Hospital Parkway (Partly Shaded)", "surface": "asphalt", "shade_pct": 30, "albedo": 0.12},
            {"u": "N_MARKET_EAST", "v": "N_MASS_AVE_S", "name": "Mass Ave Cultural Trail Phase 1", "surface": "colored_pavers", "shade_pct": 45, "albedo": 0.28},
            {"u": "N_MASS_AVE_S", "v": "N_MASS_AVE_N", "name": "Mass Ave Arts Shaded Storefront Walk", "surface": "brick_pavers", "shade_pct": 48, "albedo": 0.25},
            {"u": "N_MONUMENT_CIRCLE", "v": "N_MASS_AVE_S", "name": "Northeast Diagonal Street Corridor", "surface": "asphalt", "shade_pct": 25, "albedo": 0.10},
            {"u": "N_CARSON_TRANSIT", "v": "N_FOUNTAIN_SQUARE", "name": "Virginia Ave Connector to Fountain Sq", "surface": "asphalt", "shade_pct": 20, "albedo": 0.08},
            {"u": "N_WASHINGTON_WEST", "v": "N_MERIDIAN_SOUTH", "name": "South Meridian Arterial", "surface": "asphalt", "shade_pct": 12, "albedo": 0.06},
            {"u": "N_MERIDIAN_SOUTH", "v": "N_FOUNTAIN_SQUARE", "name": "Morris St Cross-Connector", "surface": "asphalt", "shade_pct": 18, "albedo": 0.08}
        ]

        for edge in edges:
            u_node = nodes[edge["u"]]
            v_node = nodes[edge["v"]]
            length = haversine_distance_m(u_node["lat"], u_node["lng"], v_node["lat"], v_node["lng"])
            edge["length_m"] = round(length, 1)

        return {"nodes": nodes, "edges": edges}

    def get_annotated_graph(self, time_query: str = "14:00") -> Dict[str, Any]:
        """Dynamically attributes current FortyGuard thermal values to every graph node and edge."""
        hour_float = fortyguard_service.parse_hour(time_query)
        graph = {"nodes": dict(self.base_graph["nodes"]), "edges": []}

        for nid, ninfo in graph["nodes"].items():
            tdata = fortyguard_service.calculate_location_temperature(
                lat=ninfo["lat"], lng=ninfo["lng"], hour_float=hour_float
            )
            ninfo["temperature_c"] = tdata["temperature_c"]
            ninfo["temperature_f"] = tdata["temperature_f"]
            ninfo["heat_index_c"] = tdata["heat_index_c"]
            ninfo["risk"] = tdata["risk"]

        for base_edge in self.base_graph["edges"]:
            edge = dict(base_edge)
            u_node = graph["nodes"][edge["u"]]
            v_node = graph["nodes"][edge["v"]]
            mid_lat = (u_node["lat"] + v_node["lat"]) / 2.0
            mid_lng = (u_node["lng"] + v_node["lng"]) / 2.0
            tdata = fortyguard_service.calculate_location_temperature(
                lat=mid_lat, lng=mid_lng, hour_float=hour_float
            )
            shade_ratio = edge.get("shade_pct", 15.0) / 100.0
            edge_temp_c = tdata["temperature_c"] - (shade_ratio * 3.2)
            edge["temperature_c"] = round(edge_temp_c, 2)
            edge["temperature_f"] = round((edge_temp_c * 9 / 5) + 32, 2)
            graph["edges"].append(edge)

        return graph

    def get_network_nodes(self) -> List[Dict[str, Any]]:
        """Returns all available network nodes for route planning dropdowns."""
        nodes_list = []
        for nid, ninfo in self.base_graph["nodes"].items():
            nodes_list.append({
                "id": nid,
                "name": ninfo["name"],
                "type": ninfo["type"],
                "lat": ninfo["lat"],
                "lng": ninfo["lng"]
            })
        return sorted(nodes_list, key=lambda n: n["name"])

    def plan_route_comparison(
        self,
        origin_id: str,
        destination_id: str,
        time_query: str = "14:00",
        age: Optional[int] = None,
        age_group: Optional[str] = "adult",
        worker_mode: bool = False,
        occupation: Optional[str] = "construction",
        exertion_level: Optional[str] = "moderate",
        max_acceptable_risk: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculates and compares Fastest, Balanced, and Coolest routes with personalized modifiers."""
        graph = self.get_annotated_graph(time_query)

        # Resolve user vulnerability factors
        age_cat = get_age_category(age=age, age_group_id=age_group)
        vuln_mult = age_cat["vulnerability_multiplier"]

        worker_mult = 1.0
        if worker_mode:
            exert_key = str(exertion_level).lower() if exertion_level else "moderate"
            worker_mult = PHYSICAL_EXERTION_LEVELS.get(exert_key, {}).get("multiplier", 1.35)

        # 1. Fastest Route (pure distance minimization)
        fastest = self.router.find_route(
            graph=graph, start_node_id=origin_id, goal_node_id=destination_id,
            dist_weight=1.0, heat_weight=0.0, time_query=time_query,
            vulnerability_multiplier=vuln_mult, worker_multiplier=worker_mult,
            max_acceptable_risk=None
        )

        # 2. Coolest Route (Cooling Path - maximum heat avoidance & canopy preference)
        coolest = self.router.find_route(
            graph=graph, start_node_id=origin_id, goal_node_id=destination_id,
            dist_weight=0.10, heat_weight=0.90, time_query=time_query,
            vulnerability_multiplier=vuln_mult, worker_multiplier=worker_mult,
            max_acceptable_risk=max_acceptable_risk
        )

        # 3. Balanced Route (compromise between distance and shade)
        balanced = self.router.find_route(
            graph=graph, start_node_id=origin_id, goal_node_id=destination_id,
            dist_weight=0.50, heat_weight=0.50, time_query=time_query,
            vulnerability_multiplier=vuln_mult, worker_multiplier=worker_mult,
            max_acceptable_risk=max_acceptable_risk
        )

        if not fastest:
            return {"error": f"No valid route found between {origin_id} and {destination_id}"}

        fastest_heat = fastest["heat_exposure_score"]
        coolest_heat = coolest["heat_exposure_score"] if coolest else fastest_heat
        balanced_heat = balanced["heat_exposure_score"] if balanced else fastest_heat

        heat_reduction_pct = 0.0
        if fastest_heat > 0:
            heat_reduction_pct = max(0.0, round(((fastest_heat - coolest_heat) / fastest_heat) * 100.0, 1))

        extra_minutes = 0.0
        if coolest and fastest:
            extra_minutes = max(0.0, round(coolest["duration_minutes"] - fastest["duration_minutes"], 1))

        # Calculate personalized route risk assessments
        hour_float = fortyguard_service.parse_hour(time_query)
        coolest_risk = risk_engine.calculate_risk(
            temperature_c=coolest["avg_temperature_c"] if coolest else fastest["avg_temperature_c"],
            exposure_minutes=coolest["duration_minutes"] if coolest else fastest["duration_minutes"],
            hour_float=hour_float,
            age=age,
            age_group=age_group,
            worker_mode=worker_mode,
            occupation=occupation,
            exertion_level=exertion_level,
            route_shade_pct=coolest["avg_shade_pct"] if coolest else 15.0
        )

        fastest_risk = risk_engine.calculate_risk(
            temperature_c=fastest["avg_temperature_c"],
            exposure_minutes=fastest["duration_minutes"],
            hour_float=hour_float,
            age=age,
            age_group=age_group,
            worker_mode=worker_mode,
            occupation=occupation,
            exertion_level=exertion_level,
            route_shade_pct=fastest["avg_shade_pct"]
        )

        return {
            "origin": graph["nodes"].get(origin_id, {}),
            "destination": graph["nodes"].get(destination_id, {}),
            "departure_time": time_query,
            "profile_context": {
                "age": age,
                "age_group": age_cat["id"],
                "age_group_name": age_cat["name"],
                "age_emoji": age_cat["emoji"],
                "worker_mode": worker_mode,
                "vulnerability_multiplier": vuln_mult,
                "worker_multiplier": worker_mult
            },
            "routes": {
                "fastest": {
                    "label": "Fastest Route",
                    "badge": f"{fastest_risk['risk_icon']} {fastest_risk['risk_level']} Heat Exposure",
                    "color": "#ef4444",
                    "personalized_risk_score": fastest_risk["risk_score"],
                    "personalized_risk_level": fastest_risk["risk_level"],
                    **(fastest or {})
                },
                "balanced": {
                    "label": "Balanced Route",
                    "badge": "🟠 Moderate Compromise",
                    "color": "#f59e0b",
                    **(balanced or {})
                },
                "coolest": {
                    "label": "Cooling Path (Recommended)",
                    "badge": f"🟢 {heat_reduction_pct}% Lower Heat Stress",
                    "color": "#10b981",
                    "personalized_risk_score": coolest_risk["risk_score"],
                    "personalized_risk_level": coolest_risk["risk_level"],
                    **(coolest or {})
                }
            },
            "comparison_summary": {
                "recommended_route": "coolest",
                "heat_reduction_pct": heat_reduction_pct,
                "extra_walking_minutes": extra_minutes,
                "temperature_differential_c": round(fastest["avg_temperature_c"] - (coolest["avg_temperature_c"] if coolest else fastest["avg_temperature_c"]), 1),
                "shade_increase_pct": round((coolest["avg_shade_pct"] if coolest else fastest["avg_shade_pct"]) - fastest["avg_shade_pct"], 1),
                "key_takeaway": f"The Cooling Path reduces cumulative thermal exposure by {heat_reduction_pct}% while adding only {extra_minutes} min walking time for {age_cat['name']}."
            }
        }


routing_service = RoutingService()
