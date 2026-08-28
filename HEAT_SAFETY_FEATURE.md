# HeatPath AI: Personalized Heat Safety & Cooling Path Engine
## Technical Specification & Algorithmic Methodology

---

## 1. Executive Summary

HeatPath AI enhances conventional urban thermal models by introducing **individualized vulnerability dynamics**, **occupational exposure multipliers**, and **multi-objective routing**. Standard heat platforms treat all citizens identically; in reality, a 38°C ambient temperature impacts a 2-year-old infant or an asphalt paving worker drastically differently than a healthy 30-year-old adult.

This feature fuses empirical microclimate matrices from **FortyGuard Heat Intelligence Reports** with physiological thermoregulation research to compute individualized 0–100 Heat Risk Scores, personalized cooling routes, adaptive work/rest cycles, and 24-hour heat planning.

---

## 2. Personalized Heat Risk Methodology

### 2.1 Conceptual Model

The engine implements a modular, transparent, and explainable formula:

$$\text{Personalized Heat Risk} = \text{Environmental Heat Score} \times \text{Age Vulnerability Modifier} \times \text{Worker Exposure Multiplier} \times \text{Exposure Duration Factor} \times \text{Shade Relief Mitigation}$$

### 2.2 Mathematical Formulation

1. **Base Environmental Heat Risk ($\text{EnvScore} \in [0, 100]$)**:
   Calculated from ambient temperature $T_{\text{air}}$ (°C), NOAA Heat Index $\text{HI}$ (°C), Wet-Bulb Globe Temperature $\text{WBGT}$ (°C), and Solar Irradiance Factor $\text{GHI} \in [0, 1]$:
   $$\text{BaseRisk} = \begin{cases} 
   0.5 \cdot T_{\text{air}} & T_{\text{air}} \le 20^\circ\text{C} \\
   10.0 + 2.8 \cdot (T_{\text{air}} - 20.0) & 20^\circ\text{C} < T_{\text{air}} \le 30^\circ\text{C} \\
   38.0 + 3.5 \cdot (T_{\text{air}} - 30.0) & 30^\circ\text{C} < T_{\text{air}} \le 36^\circ\text{C} \\
   59.0 + 4.5 \cdot (T_{\text{air}} - 36.0) & 36^\circ\text{C} < T_{\text{air}} \le 40^\circ\text{C} \\
   77.0 + 5.5 \cdot (T_{\text{air}} - 40.0) & T_{\text{air}} > 40^\circ\text{C}
   \end{cases}$$

   $$\text{EnvScore} = \min\left(100.0, \text{BaseRisk} + (\text{GHI} \times 6.0) + \min(8.0, 1.2 \times (\text{HI} - T_{\text{air}}))\right)$$

2. **Age Vulnerability Modifiers ($M_{\text{age}}$)**:
   - **0–3 yrs (Newborn / Infant)**: $M_{\text{age}} = 1.55$ (Immature sweating, rapid core temperature rise).
   - **4–15 yrs (Children)**: $M_{\text{age}} = 1.30$ (High surface area-to-mass ratio, reduced thirst perception).
   - **16–22 yrs (Teenagers / Young Adults)**: $M_{\text{age}} = 1.05$ (Active commuters, midday athletic exertion).
   - **23–50 yrs (Adults)**: $M_{\text{age}} = 1.00$ (Baseline adult physiological baseline).
   - **51–100 yrs (Older Adults)**: $M_{\text{age}} = 1.45$ (Diminished cardiovascular response and thirst sensation).

3. **Occupational Worker Exposure Multiplier ($M_{\text{worker}}$)**:
   - **Light Outdoor Work**: $M_{\text{worker}} = 1.15$
   - **Moderate Physical Labor**: $M_{\text{worker}} = 1.35$
   - **Heavy Physical Exertion**: $M_{\text{worker}} = 1.60$

4. **Exposure Duration Factor ($F_{\text{duration}}$)**:
   Non-linear thermal strain scaling normalized to 30 minutes:
   $$F_{\text{duration}} = \left(\frac{\text{duration\_minutes}}{30.0}\right)^{0.35}$$

5. **Shade Relief Mitigation ($F_{\text{shade}}$)**:
   $$F_{\text{shade}} = 1.0 - \left(\frac{\text{shade\_pct}}{100.0} \times 0.20\right)$$

6. **Composite Score & Classification**:
   $$\text{Score} = \text{clamp}\left(0, 100, \text{EnvScore} \times M_{\text{age}} \times M_{\text{worker}} \times F_{\text{duration}} \times F_{\text{shade}}\right)$$

| Score Range | Category | Action Guidance |
|---|---|---|
| **0 – 25** | **SAFE** | Conditions comfortable for normal outdoor movement. Baseline hydration. |
| **26 – 50** | **MODERATE** | Heat increasing. Vulnerable profiles should prefer shaded routes; carry water. |
| **51 – 75** | **HIGH** | Significant thermal stress. Limit unshaded walking; use Cooling Path. |
| **76 – 100** | **EXTREME** | Dangerous heat illness risk. Minimize outdoor exposure; seek cooled environments. |

---

## 3. Cooling Path Pathfinding Algorithm (Heat-Aware A*)

The cooling path routing algorithm calculates optimal pedestrian trajectories across the urban road network by extending A* with a multi-objective cost function:

$$\text{Cost}(u \to v) = w_{\text{dist}} \cdot \left(\frac{L_{uv}}{50\text{ m}}\right) + w_{\text{heat}} \cdot \left(\frac{E_{uv}}{150}\right) + P_{\text{risk}}$$

Where:
- $L_{uv}$ is physical segment distance in meters (Haversine).
- Segment transit duration: $t_{uv} = \frac{L_{uv}}{v_{\text{walk}}}$ (where $v_{\text{walk}} = 1.25\text{ m/s}$).
- Segment physiological thermal exposure:
  $$E_{uv} = t_{uv} \times S(T_{uv}) \times \left(1.0 - 0.85 \cdot \frac{\text{Shade}_{uv}}{100}\right) \times M_{\text{age}} \times M_{\text{worker}}$$
- Thermal stress multiplier $S(T)$:
  $$S(T) = \begin{cases}
  1.0 & T \le 22^\circ\text{C} \\
  1.0 + 0.20 \cdot (T - 22.0) & 22^\circ\text{C} < T \le 32^\circ\text{C} \\
  3.0 + 0.833 \cdot (T - 32.0) & 32^\circ\text{C} < T \le 38^\circ\text{C} \\
  8.0 + 2.5 \cdot (T - 38.0) & T > 38^\circ\text{C}
  \end{cases}$$
- $P_{\text{risk}}$ is an aversion penalty applied when road temperatures exceed the user's maximum acceptable risk threshold.

**Result**: For a typical cross-city trip from Carson Transit Center to Eskenazi Hospital at 2:00 PM, the **Cooling Path** routes pedestrians through the Central Canal Towpath and Military Park Oak Meadow, reducing cumulative heat exposure by **56%** while adding only 3.2 minutes of walking.

---

## 4. Two-Hour FortyGuard Data Refresh Architecture

- **Update Interval**: `UPDATE_INTERVAL = 7200` seconds (2 Hours).
- **Backend Lifecycle**:
  1. Tracks `last_updated_timestamp` and `next_update_timestamp`.
  2. Evaluates cache freshness: `live` when FortyGuard API is connected, `calibrated_cache` when using verified 9-report baseline, and `stale` if elapsed time exceeds 1.5x interval.
  3. Provides endpoint `GET /api/heat/status` and manual refresh trigger `POST /api/heat/refresh`.
- **Frontend Telemetry**:
  - Automatically updates countdown counters every 30 seconds (*"Last updated: X min ago"*, *"Next update: approx Y min"*).
  - Secure: FortyGuard API keys remain protected in backend `.env` variables and are never transmitted to client browsers.

---

## 5. Construction & Outdoor Worker Mode

Occupational heat stress represents a distinct physiological hazard governed by continuous physical work rates.

- **Work/Rest Duty Schedules**:
  - **SAFE (<25)**: 55 min work / 5 min rest.
  - **MODERATE (26–50)**: 45 min work / 15 min rest.
  - **HIGH (51–75)**: 30 min work / 30 min rest in shaded/cooled refuge.
  - **EXTREME (76–100)**: 15 min work / 45 min rest or emergency stoppage of heavy labor.
- **Hydration Target Schedule**:
  - Light labor: 24 oz/hr fluid replacement.
  - Moderate labor: 32 oz/hr (1 cup every 15 min).
  - Heavy labor: 40 oz/hr with essential electrolytes.

---

## 6. Safety Disclaimer
All recommendations, work/rest cycles, and hydration guides generated by HeatPath AI are provided for awareness, decision support, and urban planning. They do not constitute official occupational regulation compliance or medical diagnosis/treatment.
