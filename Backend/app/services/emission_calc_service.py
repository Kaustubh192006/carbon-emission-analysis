"""
EmissionService (Synopsis Section 7.3 & 8.3):
CO2e calculation from activity data, emission factors, and IPCC GWP.
Derives emission-intensity indicators (e.g. tonnes CO2e per tonne of ethylene/chemical product).
Formula:
    Emissions (CO2e) = Sum [ Activity Data x Emission Factor x GWP ]
    where IPCC AR5 GWP: CO2=1, CH4=28, N2O=265
"""
from typing import Dict, Any, List

# IPCC Fifth Assessment Report (AR5) 100-year Global Warming Potential
GWP_VALUES = {
    "CO2": 1.0,
    "CH4": 28.0,
    "N2O": 265.0
}

# Standard Petrochemical & Industrial Emission Factors (t CO2e / unit)
DEFAULT_FACTORS = {
    "natural_gas_mwh": 0.202,     # t CO2e / MWh
    "grid_electricity_mwh": 0.386,# t CO2e / MWh
    "fuel_oil_mwh": 0.268,        # t CO2e / MWh
    "cracking_feedstock_t": 0.350 # t CO2e / tonne naphtha/ethane
}


def calculate_co2e_from_ghg(co2_tonnes: float = 0.0, ch4_tonnes: float = 0.0, n2o_tonnes: float = 0.0) -> Dict[str, Any]:
    """Calculate total CO2e from individual greenhouse gas quantities."""
    co2e_from_co2 = co2_tonnes * GWP_VALUES["CO2"]
    co2e_from_ch4 = ch4_tonnes * GWP_VALUES["CH4"]
    co2e_from_n2o = n2o_tonnes * GWP_VALUES["N2O"]
    total_co2e = co2e_from_co2 + co2e_from_ch4 + co2e_from_n2o

    return {
        "co2_tonnes": round(co2_tonnes, 2),
        "ch4_tonnes": round(ch4_tonnes, 4),
        "n2o_tonnes": round(n2o_tonnes, 4),
        "total_co2e": round(total_co2e, 2),
        "breakdown_pct": {
            "co2": round((co2e_from_co2 / total_co2e * 100) if total_co2e > 0 else 0, 1),
            "ch4": round((co2e_from_ch4 / total_co2e * 100) if total_co2e > 0 else 0, 1),
            "n2o": round((co2e_from_n2o / total_co2e * 100) if total_co2e > 0 else 0, 1)
        },
        "gwp_standards": "IPCC AR5 (CO2=1, CH4=28, N2O=265)"
    }


def calculate_co2e_from_activity(activities: List[Dict[str, Any]], production_tonnes: float = 1.0) -> Dict[str, Any]:
    """
    Calculate CO2e from multiple operational activities (fuel combustion, electricity, process).
    Each activity entry: {"name": str, "quantity": float, "factor": float, "unit": str, "gas": str}
    """
    total_co2e = 0.0
    itemized = []

    for item in activities:
        qty = float(item.get("quantity", 0.0))
        factor = float(item.get("factor", 0.0))
        gas = item.get("gas", "CO2").upper()
        gwp = GWP_VALUES.get(gas, 1.0)
        co2e = qty * factor * gwp
        total_co2e += co2e
        itemized.append({
            "name": item.get("name", "Activity"),
            "quantity": qty,
            "unit": item.get("unit", "units"),
            "emission_factor": factor,
            "gas": gas,
            "gwp": gwp,
            "co2e_tonnes": round(co2e, 2)
        })

    # Intensity indicators
    emission_intensity = (total_co2e / production_tonnes) if production_tonnes > 0 else 0.0

    return {
        "total_co2e": round(total_co2e, 2),
        "production_tonnes": round(production_tonnes, 2),
        "emission_intensity_t_per_t": round(emission_intensity, 4),
        "activities": itemized,
        "intensity_rating": "Best-in-Class" if emission_intensity < 0.40 else "Average" if emission_intensity < 0.65 else "Carbon Intensive"
    }
