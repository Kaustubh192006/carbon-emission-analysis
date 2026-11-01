"""
Unit Tests for Emission Calculation (Synopsis Section 7.3 & 13)
Formula: Emissions (CO2e) = Sum [ Activity Data x Emission Factor x GWP ]
where IPCC AR5 GWP: CO2=1, CH4=28, N2O=265
"""
import pytest
from app.services.emission_calc_service import (
    calculate_co2e_from_ghg,
    calculate_co2e_from_activity,
    GWP_VALUES
)


def test_ipcc_ar5_gwp_factors():
    """Verify standard AR5 GWP values."""
    assert GWP_VALUES["CO2"] == 1.0
    assert GWP_VALUES["CH4"] == 28.0
    assert GWP_VALUES["N2O"] == 265.0


def test_ghg_co2e_conversion():
    """Verify exact calculation of CO2e from CO2, CH4, and N2O."""
    # 100 t CO2 + 10 t CH4 + 1 t N2O = 100*1 + 10*28 + 1*265 = 100 + 280 + 265 = 645 t CO2e
    res = calculate_co2e_from_ghg(co2_tonnes=100.0, ch4_tonnes=10.0, n2o_tonnes=1.0)
    assert res["total_co2e"] == 645.0
    assert res["co2_tonnes"] == 100.0
    assert res["ch4_tonnes"] == 10.0
    assert res["n2o_tonnes"] == 1.0
    assert "breakdown_pct" in res


def test_activity_to_co2e_and_intensity():
    """Verify calculation from fuel activity quantities and product intensity."""
    activities = [
        {"name": "Natural Gas Combustion", "quantity": 1000.0, "factor": 0.202, "gas": "CO2"},
        {"name": "Grid Electricity", "quantity": 500.0, "factor": 0.386, "gas": "CO2"}
    ]
    # Total = 1000 * 0.202 * 1 + 500 * 0.386 * 1 = 202 + 193 = 395 t CO2e
    # Production = 1000 t ethylene -> intensity = 395 / 1000 = 0.395 t CO2e / t
    res = calculate_co2e_from_activity(activities, production_tonnes=1000.0)
    assert res["total_co2e"] == 395.0
    assert res["emission_intensity_t_per_t"] == 0.395
    assert res["intensity_rating"] == "Best-in-Class"

