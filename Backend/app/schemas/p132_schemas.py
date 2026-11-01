"""
Pydantic schemas for Project P_132 API requests and responses.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FacilityCreate(BaseModel):
    facility_name: str
    facility_type: str = "Petrochemical / Steam Cracker"
    location: str
    capacity_tpa: float
    commissioned_date: Optional[str] = None


class FacilityResponse(BaseModel):
    facility_id: int
    facility_name: str
    facility_type: str
    location: str
    capacity_tpa: float
    commissioned_date: Optional[str] = None

    class Config:
        from_attributes = True


class ActivityItem(BaseModel):
    name: str
    quantity: float
    unit: str = "MWh"
    factor: float = 0.202
    gas: str = "CO2"


class EmissionCalculateRequest(BaseModel):
    activities: List[ActivityItem]
    production_tonnes: float = 1.0


class ForecastRequest(BaseModel):
    facility_id: int
    model_type: str = Field(default="random_forest", description="random_forest, arima, prophet, or ridge")
    horizon_years: int = Field(default=3, ge=1, le=5)
    scenario_id: Optional[int] = None
    renewable_share_pct: Optional[float] = None


class ScenarioCreateRequest(BaseModel):
    scenario_name: str
    renewable_share_pct: float
    target_year: int
    description: Optional[str] = None


class ScenarioSimulateRequest(BaseModel):
    baseline_co2e: float
    total_energy_mwh: float
    renewable_share_pct: float
    displaced_fuel: str = "grid_electricity"
    carbon_tax_rate: float = 50.0
    horizon_years: int = 5

