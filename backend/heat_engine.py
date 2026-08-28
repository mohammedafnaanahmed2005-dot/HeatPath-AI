"""
Thermodynamic Heat Engine for HeatPath AI.
Ground-truth urban physics models incorporating FortyGuard reports,
diurnal solar lag, NOAA Heat Index, WBGT, and surface albedo dynamics.
"""

import math
from typing import Dict, Any, Tuple


def get_diurnal_hourly_multiplier(hour_float: float) -> float:
    """
    Computes diurnal thermal multiplier [0.0 - 1.0].
    Accounting for thermal inertia and asphalt heat storage:
    - Minimum ambient temperature occurs around 06:00 (sunrise): multiplier ~0.0
    - Peak ambient temperature occurs around 15:30 (3:30 PM): multiplier ~1.0
    """
    t = hour_float % 24.0
    # Peak at 15.5h (3:30 PM), minimum at 05.5h (5:30 AM)
    phase = (t - 15.5) / 24.0 * 2.0 * math.pi
    # Cosine wave scaled to [0, 1]
    mult = 0.5 * (1.0 + math.cos(phase))
    return round(mult, 4)


def get_solar_irradiance_factor(hour_float: float) -> float:
    """
    Computes solar irradiance factor (GHI) [0.0 - 1.0].
    Direct beam radiation peaks at solar noon (~12:45 PM in Indianapolis)
    and drops to 0 at night (before 06:30 and after 20:30).
    """
    t = hour_float % 24.0
    sunrise = 6.5   # 6:30 AM
    sunset = 20.5   # 8:30 PM
    
    if t < sunrise or t > sunset:
        return 0.0
    
    # Solar arc
    solar_progress = (t - sunrise) / (sunset - sunrise)
    ghi_factor = math.sin(solar_progress * math.pi)
    return round(max(0.0, ghi_factor), 4)


def estimate_surface_temperature(
    ambient_temp_c: float,
    albedo: float = 0.08,
    sky_view_factor: float = 0.65,
    canopy_shade_pct: float = 15.0,
    solar_factor: float = 1.0
) -> float:
    """
    Estimates road/pavement surface temperature (°C).
    T_surface = T_ambient + Delta_T_solar * (1 - albedo) * (1 - 0.80 * Shade) * [1 + 0.25 * (1 - SVF)]
    """
    # Max solar heating delta in direct noon sun on black asphalt is ~28 - 32°C above ambient
    max_solar_heating_delta = 30.0
    effective_solar = max_solar_heating_delta * solar_factor
    
    # Absorptance = 1 - albedo
    absorptance = max(0.1, 1.0 - albedo)
    
    # Shade factor
    shade_mitigation = max(0.0, 1.0 - (canopy_shade_pct / 100.0) * 0.80)
    
    # Street canyon trapping factor
    canyon_factor = 1.0 + 0.25 * (1.0 - sky_view_factor)
    
    surface_temp = ambient_temp_c + (effective_solar * absorptance * shade_mitigation * canyon_factor)
    return round(surface_temp, 2)


def calculate_noaa_heat_index(temperature_c: float, relative_humidity: float = 79.0) -> Tuple[float, float, str]:
    """
    Calculates NOAA Heat Index (apparent temperature) from air temperature (°C) and relative humidity (%).
    Returns (HI_Celsius, HI_Fahrenheit, Category).
    """
    t_f = (temperature_c * 9.0 / 5.0) + 32.0
    rh = relative_humidity

    if t_f < 80.0:
        # Simple formula
        hi_f = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))
    else:
        # Full Rothfusz regression equation
        hi_f = (-42.379 +
                (2.04901523 * t_f) +
                (10.14333127 * rh) -
                (0.22475541 * t_f * rh) -
                (0.00683783 * t_f * t_f) -
                (0.05481717 * rh * rh) +
                (0.00122874 * t_f * t_f * rh) +
                (0.00085282 * t_f * rh * rh) -
                (0.00000199 * t_f * t_f * rh * rh))
        
        # Adjustments
        if rh < 13.0 and 80.0 <= t_f <= 112.0:
            adj = ((13.0 - rh) / 4.0) * math.sqrt((17.0 - abs(t_f - 95.0)) / 17.0)
            hi_f -= adj
        elif rh > 85.0 and 80.0 <= t_f <= 87.0:
            adj = ((rh - 85.0) / 10.0) * ((87.0 - t_f) / 5.0)
            hi_f += adj

    hi_c = (hi_f - 32.0) * 5.0 / 9.0

    # NOAA Category
    if hi_f < 80.0:
        cat = "Normal / Minimal Stress"
    elif hi_f < 90.0:
        cat = "Caution (Fatigue Possible)"
    elif hi_f < 103.0:
        cat = "Extreme Caution (Heat Cramps / Exhaustion)"
    elif hi_f < 125.0:
        cat = "Danger (Heat Stroke Probable)"
    else:
        cat = "Extreme Danger (Heat Stroke Imminent)"

    return round(hi_c, 2), round(hi_f, 2), cat


def calculate_wbgt(temperature_c: float, relative_humidity: float = 79.0, solar_factor: float = 1.0) -> float:
    """
    Approximates Wet-Bulb Globe Temperature (WBGT in °C).
    Combines dry bulb, natural wet bulb, and black globe temperature.
    """
    # Stull formula for wet bulb temperature
    t = temperature_c
    rh = relative_humidity
    tw = (t * math.atan(0.151977 * math.sqrt(rh + 8.313659)) +
          math.atan(t + rh) -
          math.atan(rh - 1.676331) +
          0.00391838 * (rh ** 1.5) * math.atan(0.023101 * rh) -
          4.686035)
    
    # Globe temperature estimate
    tg = t + (12.0 * solar_factor)
    
    # WBGT = 0.7 Tw + 0.2 Tg + 0.1 Td
    wbgt = 0.7 * tw + 0.2 * tg + 0.1 * t
    return round(wbgt, 2)


def classify_heat_risk(temp_c: float) -> Dict[str, Any]:
    """Classifies thermal risk level, badge color, and recommendations."""
    if temp_c < 32.0:
        return {
            "level": "low",
            "label": "Low Risk",
            "color": "#10b981",
            "badge": "Comfortable",
            "emoji": "🟢",
            "advice": "Safe for extended outdoor activity with normal hydration."
        }
    elif temp_c < 36.0:
        return {
            "level": "moderate",
            "label": "Moderate Caution",
            "color": "#eab308",
            "badge": "Caution",
            "emoji": "🟡",
            "advice": "Hydrate regularly. Seek shade during prolonged exposure."
        }
    elif temp_c < 40.0:
        return {
            "level": "high",
            "label": "High Heat Risk",
            "color": "#f97316",
            "badge": "Extreme Caution",
            "emoji": "🟠",
            "advice": "Limit unshaded walking. Vulnerable individuals should use cool routes."
        }
    else:
        return {
            "level": "extreme",
            "label": "Extreme Danger",
            "color": "#ef4444",
            "badge": "Danger",
            "emoji": "🔴",
            "advice": "Dangerous heat stress. Walking outdoors requires active shading and misting."
        }
