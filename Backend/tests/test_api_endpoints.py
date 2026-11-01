"""
Integration and API Endpoint Tests (Synopsis Section 12 & 13)
Tests all core REST endpoints using FastAPI TestClient.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True


def test_api_facilities():
    response = client.get("/api/facilities")
    assert response.status_code == 200
    facilities = response.json()
    assert len(facilities) >= 10
    assert "facility_name" in facilities[0]


def test_api_emissions_summary():
    response = client.get("/api/emissions/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_co2e_tonnes"] > 0
    assert summary["active_facilities"] >= 10


def test_api_model_comparison():
    response = client.get("/api/models/comparison")
    assert response.status_code == 200
    data = response.json()
    assert len(data["models"]) >= 5
    assert data["champion_model"] == "Random Forest Regressor"


def test_api_forecast_prophet():
    payload = {
        "facility_id": 10001,
        "model": "prophet",
        "horizon_years": 3
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["forecast"]) == 3
    assert data["forecast"][0]["predicted_co2e"] > 0


def test_api_scenario_simulate():
    payload = {
        "baseline_co2e": 800000.0,
        "total_energy_mwh": 2500000.0,
        "renewable_share_pct": 20.0
    }
    response = client.post("/api/scenarios/1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["avoided_co2e"] > 0
    assert data["reduction_pct"] > 0

