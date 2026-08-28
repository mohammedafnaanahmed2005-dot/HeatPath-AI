"""
Indianapolis Public Assets Dataset for Heat Vulnerability Auditing.
Includes Bus Stops, Community Playgrounds, Public Schools, Hospitals, and Civic Plazas.
"""

PUBLIC_ASSETS_DATA = [
    {
        "id": "ASSET_001",
        "name": "Julia M. Carson Transit Center - Bay 4",
        "type": "bus_stop",
        "lat": 39.7645,
        "lng": -86.1485,
        "daily_users": 4200,
        "vulnerable_population_pct": 68,
        "current_shade_pct": 12,
        "exposure_duration_mins": 25,
        "pavement_type": "dark_asphalt",
        "description": "Central transit boarding hub with heavy commuter waiting volume and direct sun exposure.",
        "target_intervention": "Cantilevered high-reflectance shade sail + solar misting jets"
    },
    {
        "id": "ASSET_002",
        "name": "Crispus Attucks Community Playground",
        "type": "playground",
        "lat": 39.7780,
        "lng": -86.1750,
        "daily_users": 650,
        "vulnerable_population_pct": 92,
        "current_shade_pct": 18,
        "exposure_duration_mins": 45,
        "pavement_type": "black_rubber_mulch",
        "description": "Neighborhood youth playground with unshaded black play surface reaching 62°C.",
        "target_intervention": "Mature deciduous tree perimeter + cool light-colored pour-in-place rubber surfacing"
    },
    {
        "id": "ASSET_003",
        "name": "Eskenazi Hospital Outpatient Transit Plaza",
        "type": "hospital",
        "lat": 39.7760,
        "lng": -86.1795,
        "daily_users": 1800,
        "vulnerable_population_pct": 85,
        "current_shade_pct": 35,
        "exposure_duration_mins": 15,
        "pavement_type": "concrete",
        "description": "Outpatient patient pickup and transit waiting zone serving elderly and immunocompromised patients.",
        "target_intervention": "Shaded green pergola corridor & misting cooling pavilion"
    },
    {
        "id": "ASSET_004",
        "name": "Washington & Delaware Bus Transfer Point",
        "type": "bus_stop",
        "lat": 39.7672,
        "lng": -86.1515,
        "daily_users": 2100,
        "vulnerable_population_pct": 62,
        "current_shade_pct": 15,
        "exposure_duration_mins": 20,
        "pavement_type": "aged_asphalt",
        "description": "Busy downtown bus connection stop flanked by tall asphalt street canyons.",
        "target_intervention": "Smart solar-powered bus shelter with green roof"
    },
    {
        "id": "ASSET_005",
        "name": "Fountain Square Community Park & Splash Zone",
        "type": "playground",
        "lat": 39.7512,
        "lng": -86.1415,
        "daily_users": 850,
        "vulnerable_population_pct": 78,
        "current_shade_pct": 28,
        "exposure_duration_mins": 50,
        "pavement_type": "paved_concrete",
        "description": "Historic neighborhood public square lacking overhead canopy during midday.",
        "target_intervention": "Shade sails over open seating + expanded tree planter pits"
    },
    {
        "id": "ASSET_006",
        "name": "Arsenal Tech High School Bus Loading Zone",
        "type": "school",
        "lat": 39.7725,
        "lng": -86.1310,
        "daily_users": 1500,
        "vulnerable_population_pct": 80,
        "current_shade_pct": 10,
        "exposure_duration_mins": 20,
        "pavement_type": "asphalt",
        "description": "Wide asphalt bus loading strip for over 1,500 students with zero shade cover.",
        "target_intervention": "Covered solar awning walkway + high-albedo cool pavement"
    },
    {
        "id": "ASSET_007",
        "name": "Monument Circle South Steps",
        "type": "plaza",
        "lat": 39.7684,
        "lng": -86.1580,
        "daily_users": 3500,
        "vulnerable_population_pct": 45,
        "current_shade_pct": 22,
        "exposure_duration_mins": 30,
        "pavement_type": "brick_pavers",
        "description": "Iconic gathering steps exposed to solar radiation and glass reflection glare.",
        "target_intervention": "Deployable thermal umbrellas and high-pressure pedestrian cooling mister arches"
    },
    {
        "id": "ASSET_008",
        "name": "West Michigan & IUPUI Campus Bus Stop",
        "type": "bus_stop",
        "lat": 39.7745,
        "lng": -86.1645,
        "daily_users": 1950,
        "vulnerable_population_pct": 50,
        "current_shade_pct": 40,
        "exposure_duration_mins": 12,
        "pavement_type": "concrete",
        "description": "University transit corridor with moderate shade from nearby canal trees.",
        "target_intervention": "Extend tree canopy westward along Michigan St sidewalk"
    }
]
