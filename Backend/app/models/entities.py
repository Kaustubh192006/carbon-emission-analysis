"""
SQLAlchemy ORM Entity Models for Carbon Emission Prediction Framework (P_132).
Maps 10 relational tables as defined in Section 8.1 & 10 of the Project Synopsis.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Facility(Base):
    """Facility master entity (Section 8.1)"""
    __tablename__ = "facility"

    facility_id = Column(Integer, primary_key=True, index=True)
    facility_name = Column(String(255), nullable=False, index=True)
    facility_type = Column(String(100), nullable=False)  # Petrochemical, Cracker, Refinery, Chemical
    location = Column(String(255), nullable=False)       # City, State, Country
    capacity_tpa = Column(Float, nullable=False)         # Tonnes Per Annum
    commissioned_date = Column(String(50), nullable=True)

    # Relationships
    emission_records = relationship("EmissionRecord", back_populates="facility", cascade="all, delete-orphan")
    energy_consumptions = relationship("EnergyConsumption", back_populates="facility", cascade="all, delete-orphan")
    production_records = relationship("ProductionData", back_populates="facility", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="facility", cascade="all, delete-orphan")


class EmissionSource(Base):
    """Emission source classification entity (combustion, flaring, process, fugitive)"""
    __tablename__ = "emission_source"

    source_id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)  # combustion, flaring, process, fugitive
    description = Column(Text, nullable=True)
    emission_factor = Column(Float, nullable=False) # default factor (t CO2e / unit)

    emission_records = relationship("EmissionRecord", back_populates="source")


class EnergyType(Base):
    """Energy carriers and electricity types"""
    __tablename__ = "energy_type"

    energy_type_id = Column(Integer, primary_key=True, index=True)
    energy_name = Column(String(100), nullable=False) # Natural Gas, Grid Electricity, Fuel Oil, Solar PV, Wind
    is_renewable = Column(Boolean, default=False)
    emission_factor = Column(Float, nullable=False)   # t CO2e per MWh or GJ
    factor_unit = Column(String(50), default="tCO2e/MWh")

    energy_consumptions = relationship("EnergyConsumption", back_populates="energy_type")


class EmissionRecord(Base):
    """Transactional emission measurement records"""
    __tablename__ = "emission_record"

    record_id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facility.facility_id"), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("emission_source.source_id"), nullable=False)
    record_date = Column(String(50), nullable=False, index=True) # YYYY-MM or YYYY
    co2_tonnes = Column(Float, default=0.0)
    ch4_tonnes = Column(Float, default=0.0)
    n2o_tonnes = Column(Float, default=0.0)
    co2e_tonnes = Column(Float, nullable=False)
    data_quality = Column(String(50), default="Measured - High") # Measured, Calculated, Estimated

    facility = relationship("Facility", back_populates="emission_records")
    source = relationship("EmissionSource", back_populates="emission_records")


class EnergyConsumption(Base):
    """Transactional energy consumption records"""
    __tablename__ = "energy_consumption"

    energy_id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facility.facility_id"), nullable=False, index=True)
    energy_type_id = Column(Integer, ForeignKey("energy_type.energy_type_id"), nullable=False)
    record_date = Column(String(50), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="MWh")

    facility = relationship("Facility", back_populates="energy_consumptions")
    energy_type = relationship("EnergyType", back_populates="energy_consumptions")


class ProductionData(Base):
    """Petrochemical production metrics and utilization records"""
    __tablename__ = "production_data"

    production_id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facility.facility_id"), nullable=False, index=True)
    record_date = Column(String(50), nullable=False, index=True)
    feedstock_tonnes = Column(Float, nullable=False)       # Feedstock processed
    ethylene_output_t = Column(Float, nullable=False)      # Ethylene / primary output (tonnes)
    utilisation_pct = Column(Float, nullable=False)        # Plant utilization %

    facility = relationship("Facility", back_populates="production_records")


class RenewableScenario(Base):
    """Renewable energy adoption what-if scenarios (10%, 20%, 30%, 50%)"""
    __tablename__ = "renewable_scenario"

    scenario_id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String(100), nullable=False)
    renewable_share_pct = Column(Float, nullable=False)    # 10.0, 20.0, 30.0, 50.0
    target_year = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)

    forecasts = relationship("Forecast", back_populates="scenario")


class MLModel(Base):
    """Registry of trained models (Random Forest, ARIMA, Prophet, Ridge, Linear)"""
    __tablename__ = "ml_model"

    model_id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)        # regression or time-series
    target_variable = Column(String(100), default="co2e_tonnes")
    parameters = Column(Text, nullable=True)               # JSON string of hyperparameters
    trained_at = Column(DateTime, default=datetime.utcnow)

    forecasts = relationship("Forecast", back_populates="model")
    evaluations = relationship("EvaluationResult", back_populates="model")


class Forecast(Base):
    """Saved forecast outputs per facility and scenario"""
    __tablename__ = "forecast"

    forecast_id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_model.model_id"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facility.facility_id"), nullable=False)
    scenario_id = Column(Integer, ForeignKey("renewable_scenario.scenario_id"), nullable=True)
    forecast_date = Column(String(50), nullable=False)
    predicted_co2e = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("MLModel", back_populates="forecasts")
    facility = relationship("Facility", back_populates="forecasts")
    scenario = relationship("RenewableScenario", back_populates="forecasts")


class EvaluationResult(Base):
    """Model evaluation metrics (MAE, RMSE, MAPE, R2)"""
    __tablename__ = "evaluation_result"

    evaluation_id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_model.model_id"), nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=False)
    mape = Column(Float, nullable=False)

    model = relationship("MLModel", back_populates="evaluations")
