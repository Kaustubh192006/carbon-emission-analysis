"""
ScenarioService (Synopsis Section 7.6 & 8.3):
Renewable-energy impact modeling and what-if sustainability simulations.
Formula:
    Scenario Emissions = Baseline Forecast - (Renewable Share x Energy Displaced x Emission Factor of Displaced Fuel)
    Reduction (%) = (Baseline - Scenario) / Baseline x 100
    Carbon Tax Savings = Avoided CO2e x Carbon Tax Rate ($50/tonne CO2e)
"""
from typing import Dict, Any, List

# Emission factor of displaced fuels (t CO2e / MWh)
DISPLACED_FUEL_FACTORS = {
    "grid_electricity": 0.386, # Average fossil-heavy grid power
    "natural_gas": 0.202,      # Industrial natural gas combustion
    "heavy_fuel_oil": 0.268,   # Process furnace heavy fuel oil
    "coal_combustion": 0.340   # Industrial coal/coke
}

DEFAULT_CARBON_TAX_PER_TONNE = 50.0 # $50 / metric tonne CO2e (IMF / EU ETS benchmark)


def simulate_renewable_impact(
    baseline_co2e: float,
    total_energy_mwh: float,
    renewable_share_pct: float,
    displaced_fuel: str = "grid_electricity",
    carbon_tax_rate: float = DEFAULT_CARBON_TAX_PER_TONNE,
    horizon_years: int = 5
) -> Dict[str, Any]:
    """
    Simulate carbon emission reduction and economic savings from renewable energy adoption.
    """
    share_decimal = min(1.0, max(0.0, renewable_share_pct / 100.0))
    ef_displaced = DISPLACED_FUEL_FACTORS.get(displaced_fuel, 0.386)

    # Displaced energy in MWh
    displaced_energy_mwh = total_energy_mwh * share_decimal
    avoided_co2e_annual = displaced_energy_mwh * ef_displaced

    # Cap avoided emissions at 85% of baseline (process emissions cannot be fully eliminated by electricity)
    max_abatement = baseline_co2e * 0.85
    avoided_co2e_annual = min(avoided_co2e_annual, max_abatement * share_decimal)

    scenario_co2e_annual = max(0.0, baseline_co2e - avoided_co2e_annual)
    reduction_pct = ((baseline_co2e - scenario_co2e_annual) / baseline_co2e * 100.0) if baseline_co2e > 0 else 0.0

    carbon_tax_savings_annual = avoided_co2e_annual * carbon_tax_rate
    cumulative_co2e_saved = avoided_co2e_annual * horizon_years
    cumulative_tax_savings = carbon_tax_savings_annual * horizon_years

    # Year-by-year transition trajectory
    trajectory = []
    base_year = 2024
    for i in range(1, horizon_years + 1):
        year = base_year + i
        # Gradual ramp-up towards target share
        ramp_factor = min(1.0, i / max(1, horizon_years - 1))
        yr_share = renewable_share_pct * ramp_factor
        yr_avoided = avoided_co2e_annual * ramp_factor
        yr_scenario = max(0.0, baseline_co2e - yr_avoided)
        trajectory.append({
            "year": year,
            "target_share_pct": round(yr_share, 1),
            "baseline_co2e": round(baseline_co2e * (1 + (i * 0.01)), 2), # slight baseline growth
            "scenario_co2e": round(yr_scenario, 2),
            "avoided_co2e": round(yr_avoided, 2),
            "tax_savings_usd": round(yr_avoided * carbon_tax_rate, 2)
        })

    return {
        "scenario_name": f"{renewable_share_pct:.0f}% Renewable Adoption Pathway",
        "renewable_share_pct": renewable_share_pct,
        "displaced_fuel": displaced_fuel,
        "displaced_fuel_factor": ef_displaced,
        "total_energy_mwh": round(total_energy_mwh, 1),
        "displaced_energy_mwh": round(displaced_energy_mwh, 1),
        "baseline_co2e": round(baseline_co2e, 2),
        "scenario_co2e": round(scenario_co2e_annual, 2),
        "avoided_co2e": round(avoided_co2e_annual, 2),
        "reduction_pct": round(reduction_pct, 2),
        "annual_tax_savings_usd": round(carbon_tax_savings_annual, 2),
        "cumulative_co2e_saved": round(cumulative_co2e_saved, 2),
        "cumulative_tax_savings_usd": round(cumulative_tax_savings, 2),
        "sustainability_rating": (
            "Exemplary / Net-Zero Leader" if reduction_pct >= 40.0 else
            "Strong Abatement" if reduction_pct >= 20.0 else
            "Moderate Impact" if reduction_pct >= 10.0 else
            "Initial Transition"
        ),
        "trajectory": trajectory
    }

