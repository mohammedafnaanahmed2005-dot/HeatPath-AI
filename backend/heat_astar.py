"""
Heat-Aware A* Pathfinding Algorithm with Age & Occupational Vulnerability Multipliers.
Optimizes pedestrian routing through urban heat networks by balancing
physical walking distance, diurnal solar radiation, shade relief, and
individual physiological thermal stress.
All imports are flat (no subfolders).
"""

import math
import heapq
from typing import Dict, List, Any, Optional, Tuple


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes exact great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def calculate_thermal_stress_multiplier(temperature_c: float) -> float:
    """
    Non-linear physiological thermal strain multiplier.
    - <= 22°C: Neutral base strain (1.0x)
    - 22°C - 32°C: Mild exertion strain (1.0x - 3.0x)
    - 32°C - 38°C: Steep increase in cardiovascular stress (3.0x - 8.0x)
    - > 38°C: Severe heat stroke risk (8.0x - 20.0x+)
    """
    if temperature_c <= 22.0:
        return 1.0
    elif temperature_c <= 32.0:
        return 1.0 + (0.20 * (temperature_c - 22.0))
    elif temperature_c <= 38.0:
        return 3.0 + (0.833 * (temperature_c - 32.0))
    else:
        return 8.0 + (2.5 * (temperature_c - 38.0))


class HeatAStarRouter:
    def __init__(self, walking_speed_mps: float = 1.25):
        self.walking_speed_mps = walking_speed_mps  # Standard adult walking pace ~4.5 km/h

    def find_route(
        self,
        graph: Dict[str, Any],
        start_node_id: str,
        goal_node_id: str,
        dist_weight: float = 0.5,
        heat_weight: float = 0.5,
        time_query: str = "14:00",
        vulnerability_multiplier: float = 1.0,
        worker_multiplier: float = 1.0,
        max_acceptable_risk: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Executes Personalized Heat-Aware A* pathfinding.
        Cost = w_dist * (Distance / 50m) + w_heat * (HeatExposure * VulnMult * WorkerMult / 150) + RiskPenalty
        """
        nodes = graph["nodes"]
        edges = graph["edges"]

        if start_node_id not in nodes or goal_node_id not in nodes:
            return None

        # Build adjacency list
        adj: Dict[str, List[Dict[str, Any]]] = {nid: [] for nid in nodes}
        for edge in edges:
            u, v = edge["u"], edge["v"]
            if u in adj and v in adj:
                adj[u].append({"to": v, "edge": edge})
                adj[v].append({"to": u, "edge": edge})

        goal_node = nodes[goal_node_id]

        # Priority queue stores tuples: (f_score, counter, current_node_id, current_path, g_dist, g_heat)
        counter = 0
        frontier = []
        heapq.heappush(frontier, (0.0, counter, start_node_id, [start_node_id], 0.0, 0.0))

        cost_so_far: Dict[str, float] = {start_node_id: 0.0}
        best_path_data: Optional[Dict[str, Any]] = None

        while frontier:
            f, _, current, path, dist_accum, heat_accum = heapq.heappop(frontier)

            if current == goal_node_id:
                best_path_data = {
                    "path_nodes": path,
                    "total_distance_m": dist_accum,
                    "total_heat_exposure": heat_accum
                }
                break

            for neighbor in adj[current]:
                next_node_id = neighbor["to"]
                edge_info = neighbor["edge"]

                edge_length = edge_info.get("length_m", 100.0)
                edge_temp = edge_info.get("temperature_c", 35.0)
                edge_shade_pct = edge_info.get("shade_pct", 15.0)

                # Segment walking time
                segment_time_sec = edge_length / self.walking_speed_mps

                # Heat exposure = time * thermal stress * shade relief * vulnerability factors
                stress_mult = calculate_thermal_stress_multiplier(edge_temp)
                shade_relief = max(0.15, 1.0 - (edge_shade_pct / 100.0 * 0.85))
                
                # Combined physiological exposure
                segment_heat_exposure = (
                    segment_time_sec * stress_mult * shade_relief * vulnerability_multiplier * worker_multiplier
                )

                # Penalize edges exceeding user max acceptable risk threshold
                risk_penalty = 0.0
                if max_acceptable_risk:
                    max_r = max_acceptable_risk.lower()
                    if max_r == "safe" and edge_temp > 30.0:
                        risk_penalty += (edge_temp - 30.0) * 2.0
                    elif max_r == "moderate" and edge_temp > 35.0:
                        risk_penalty += (edge_temp - 35.0) * 3.0
                    elif max_r == "high" and edge_temp > 39.0:
                        risk_penalty += (edge_temp - 39.0) * 5.0

                # Multi-objective edge cost
                normalized_dist_cost = edge_length / 50.0
                normalized_heat_cost = segment_heat_exposure / 150.0
                step_cost = (dist_weight * normalized_dist_cost) + (heat_weight * normalized_heat_cost) + risk_penalty

                new_g = cost_so_far[current] + step_cost
                new_dist = dist_accum + edge_length
                new_heat = heat_accum + segment_heat_exposure

                if next_node_id not in cost_so_far or new_g < cost_so_far[next_node_id]:
                    cost_so_far[next_node_id] = new_g
                    
                    # Heuristic: Haversine distance to goal
                    next_node = nodes[next_node_id]
                    h_dist = haversine_distance_m(next_node["lat"], next_node["lng"], goal_node["lat"], goal_node["lng"])
                    h_cost = dist_weight * (h_dist / 50.0)
                    
                    f_score = new_g + h_cost
                    counter += 1
                    heapq.heappush(frontier, (f_score, counter, next_node_id, path + [next_node_id], new_dist, new_heat))

        if not best_path_data:
            return None

        # Reconstruct route segment telemetry
        path_nodes = best_path_data["path_nodes"]
        coordinates = []
        segments = []
        temps = []
        shades = []

        for i in range(len(path_nodes) - 1):
            u_id, v_id = path_nodes[i], path_nodes[i+1]
            u_n, v_n = nodes[u_id], nodes[v_id]
            
            matched_edge = None
            for e in edges:
                if (e["u"] == u_id and e["v"] == v_id) or (e["u"] == v_id and e["v"] == u_id):
                    matched_edge = e
                    break

            e_name = matched_edge["name"] if matched_edge else f"{u_n['name']} to {v_n['name']}"
            e_temp = matched_edge.get("temperature_c", 35.0) if matched_edge else 35.0
            e_shade = matched_edge.get("shade_pct", 15.0) if matched_edge else 15.0
            e_len = matched_edge.get("length_m", 100.0) if matched_edge else haversine_distance_m(u_n["lat"], u_n["lng"], v_n["lat"], v_n["lng"])
            e_surf = matched_edge.get("surface", "asphalt") if matched_edge else "asphalt"

            temps.append(e_temp)
            shades.append(e_shade)

            if i == 0:
                coordinates.append([u_n["lat"], u_n["lng"]])
            coordinates.append([v_n["lat"], v_n["lng"]])

            segments.append({
                "from_node": u_id,
                "from_name": u_n["name"],
                "to_node": v_id,
                "to_name": v_n["name"],
                "street_name": e_name,
                "surface_type": e_surf,
                "distance_m": round(e_len, 1),
                "duration_seconds": round(e_len / self.walking_speed_mps, 1),
                "temperature_c": round(e_temp, 1),
                "temperature_f": round((e_temp * 9/5) + 32, 1),
                "shade_pct": e_shade
            })

        avg_temp_c = sum(temps) / len(temps) if temps else 35.0
        avg_shade_pct = sum(shades) / len(shades) if shades else 15.0
        total_dist_m = best_path_data["total_distance_m"]
        total_duration_sec = total_dist_m / self.walking_speed_mps

        return {
            "path_nodes": path_nodes,
            "coordinates": coordinates,
            "distance_meters": round(total_dist_m, 1),
            "distance_km": round(total_dist_m / 1000.0, 2),
            "distance_miles": round(total_dist_m / 1609.34, 2),
            "duration_seconds": round(total_duration_sec, 0),
            "duration_minutes": round(total_duration_sec / 60.0, 1),
            "avg_temperature_c": round(avg_temp_c, 1),
            "avg_temperature_f": round((avg_temp_c * 9/5) + 32, 1),
            "avg_shade_pct": round(avg_shade_pct, 1),
            "heat_exposure_score": round(best_path_data["total_heat_exposure"], 1),
            "segments_count": len(segments),
            "segments": segments
        }
