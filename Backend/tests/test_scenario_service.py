"""
Unit Tests for Renewable-Energy Scenario Simulation (Synopsis Section 7.6 & 13)
Formula:
    Scenario Emissions = Baseline - (Renewable Share x Energy Displaced x Emission Factor)
    Reduction (%) = (Baseline - Scenario) / Baseline x 100
    Carbon Tax Savings = Avoided CO2e x Carbon Tax Rate ($50/t)
"""
import pytest
from app.services.scenario_service import simulate_renewable_impact


def test_scenario_20_percent_adoption():
    """Verify 20% renewable adoption reduces emissions and saves carbon tax."""
    res = simulate_renewable_impact(
        baseline_co2e=750000.0,
        total_energy_mwh=2000000.0,
        renewable_share_pct=20.0,
        displaced_fuel="grid_electricity",
        carbon_tax_rate=50.0,
        horizon_years=5
    )

    assert res["renewable_share_pct"] == 20.0
    assert res["avoided_co2e"] > 0.0
    assert res["scenario_co2e"] < res["baseline_co2e"]
    assert res["reduction_pct"] > 0.0
    assert res["annual_tax_savings_usd"] == res["avoided_co2e"] * 50.0
    assert len(res["trajectory"]) == 5


def test_scenario_zero_and_edge_cases():
    """Verify 0% renewable adoption gives zero avoidance."""
    res = simulate_renewable_impact(
        baseline_co2e=500000.0,
        total_energy_mwh=1000000.0,
        renewable_share_pct=0.0
    )
    assert res["avoided_co2e"] == 0.0
    assert res["reduction_pct"] == 0.0
    assert res["scenario_co2e"] == 500000.0

