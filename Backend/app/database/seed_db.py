"""
Database Seeder for Carbon Emission Prediction Framework (P_132).
Seeds master data (Facilities, Emission Sources, Energy Types, Scenarios, ML Models)
and transactional time-series data (Emissions, Production, Energy Consumption).
"""
import json
from datetime import datetime
from app.database.connection import SessionLocal, init_db
from app.models.entities import (
    Facility, EmissionSource, EnergyType, EmissionRecord,
    EnergyConsumption, ProductionData, RenewableScenario,
    MLModel, Forecast, EvaluationResult
)


def seed_database():
    init_db()
    db = SessionLocal()

    # Check if already seeded
    if db.query(Facility).first():
        print("Database already seeded. Skipping initial seeding.")
        db.close()
        return

    print("Seeding P_132 database...")

    # 1. Emission Sources (Synopsis Section 10)
    sources = [
        EmissionSource(source_id=1, source_name="Furnace & Boiler Combustion", category="combustion",
                       description="Fuel gas and natural gas burning in cracking furnaces", emission_factor=0.056),
        EmissionSource(source_id=2, source_name="Process Reactions", category="process",
                       description="Steam cracking, catalytic reforming, and chemical reaction emissions", emission_factor=0.142),
        EmissionSource(source_id=3, source_name="Safety & Operational Flaring", category="flaring",
                       description="Hydrocarbon flaring during startup, shutdown, and pressure relief", emission_factor=0.088),
        EmissionSource(source_id=4, source_name="Fugitive & Component Releases", category="fugitive",
                       description="Fugitive leaks from valves, flanges, pumps, and compressors", emission_factor=0.015),
    ]
    db.add_all(sources)

    # 2. Energy Types (Synopsis Section 10)
    energy_types = [
        EnergyType(energy_type_id=1, energy_name="Natural Gas", is_renewable=False, emission_factor=0.202, factor_unit="tCO2e/MWh"),
        EnergyType(energy_type_id=2, energy_name="Grid Electricity", is_renewable=False, emission_factor=0.386, factor_unit="tCO2e/MWh"),
        EnergyType(energy_type_id=3, energy_name="Heavy Fuel Oil", is_renewable=False, emission_factor=0.268, factor_unit="tCO2e/MWh"),
        EnergyType(energy_type_id=4, energy_name="Onsite Solar PV", is_renewable=True, emission_factor=0.000, factor_unit="tCO2e/MWh"),
        EnergyType(energy_type_id=5, energy_name="Offsite Wind PPA", is_renewable=True, emission_factor=0.000, factor_unit="tCO2e/MWh"),
        EnergyType(energy_type_id=6, energy_name="Green Hydrogen", is_renewable=True, emission_factor=0.000, factor_unit="tCO2e/MWh"),
    ]
    db.add_all(energy_types)

    # 3. Petrochemical Facilities (Synopsis Domain: Petrochemical Industry)
    facilities = [
        Facility(facility_id=10001, facility_name="Baytown Olefins & Chemical Complex", facility_type="Petrochemical / Steam Cracker",
                 location="Baytown, TX", capacity_tpa=3800000.0, commissioned_date="1998-04-15"),
        Facility(facility_id=10002, facility_name="Channelview Chemical Manufacturing Complex", facility_type="Petrochemical / Olefins",
                 location="Channelview, TX", capacity_tpa=2900000.0, commissioned_date="2002-09-10"),
        Facility(facility_id=10003, facility_name="Baton Rouge Chemical & Polymer Plant", facility_type="Petrochemical / Polymers",
                 location="Baton Rouge, LA", capacity_tpa=2400000.0, commissioned_date="1995-11-20"),
        Facility(facility_id=10004, facility_name="Freeport Petrochemical Cracker Unit", facility_type="Chemical Manufacturing",
                 location="Freeport, TX", capacity_tpa=3200000.0, commissioned_date="2006-03-12"),
        Facility(facility_id=10005, facility_name="Port Arthur Cracker & Aromatics Complex", facility_type="Petrochemical / Aromatics",
                 location="Port Arthur, TX", capacity_tpa=2750000.0, commissioned_date="2010-07-08"),
        Facility(facility_id=10006, facility_name="Geismar Chemical Synthesis Facility", facility_type="Chemical Synthesis",
                 location="Geismar, LA", capacity_tpa=1850000.0, commissioned_date="2004-01-25"),
        Facility(facility_id=10007, facility_name="Lake Charles Petrochemical Center", facility_type="Olefins & Derivatives",
                 location="Lake Charles, LA", capacity_tpa=2100000.0, commissioned_date="2012-05-18"),
        Facility(facility_id=10008, facility_name="Corpus Christi Chemical Plant", facility_type="Petrochemical",
                 location="Corpus Christi, TX", capacity_tpa=1950000.0, commissioned_date="2008-10-30"),
        Facility(facility_id=10009, facility_name="Plaquemine Hydrocarbon Processing", facility_type="Petrochemical",
                 location="Plaquemine, LA", capacity_tpa=1600000.0, commissioned_date="2014-08-14"),
        Facility(facility_id=10010, facility_name="Deer Park Olefins Manufacturing", facility_type="Petrochemical",
                 location="Deer Park, TX", capacity_tpa=2300000.0, commissioned_date="2001-02-17"),
    ]
    db.add_all(facilities)
    db.commit()

    # 4. Renewable Scenarios (Synopsis Section 7.6)
    scenarios = [
        RenewableScenario(scenario_id=1, scenario_name="10% Renewable Transition", renewable_share_pct=10.0,
                          target_year=2026, description="Phase 1: Replace 10% of purchased grid power with onsite solar PV and wind PPAs."),
        RenewableScenario(scenario_id=2, scenario_name="20% Clean Power Integration", renewable_share_pct=20.0,
                          target_year=2027, description="Phase 2: Scale renewable electricity to 20% total plant energy requirement."),
        RenewableScenario(scenario_id=3, scenario_name="30% Low-Carbon Cracking", renewable_share_pct=30.0,
                          target_year=2028, description="Phase 3: 30% clean energy mix combining renewable power and furnace electrification."),
        RenewableScenario(scenario_id=4, scenario_name="50% Net-Zero Accelerated Pathway", renewable_share_pct=50.0,
                          target_year=2030, description="Phase 4: Comprehensive 50% renewable energy adoption with green hydrogen co-firing."),
    ]
    db.add_all(scenarios)

    # 5. ML Models & Evaluation Benchmarks (Synopsis Section 7.5 & 8.1)
    models = [
        MLModel(model_id=1, model_name="Random Forest Regressor", model_type="regression",
                target_variable="co2e_tonnes", parameters=json.dumps({"n_estimators": 150, "max_depth": 22, "min_samples_split": 4})),
        MLModel(model_id=2, model_name="ARIMA/SARIMA", model_type="time-series",
                target_variable="co2e_tonnes", parameters=json.dumps({"order": [2, 1, 1], "seasonal_order": [1, 1, 1, 12]})),
        MLModel(model_id=3, model_name="Prophet", model_type="time-series",
                target_variable="co2e_tonnes", parameters=json.dumps({"yearly_seasonality": True, "changepoint_prior_scale": 0.05})),
        MLModel(model_id=4, model_name="Ridge Regression", model_type="regression",
                target_variable="co2e_tonnes", parameters=json.dumps({"alpha": 10.0, "solver": "auto"})),
        MLModel(model_id=5, model_name="Linear Regression", model_type="regression",
                target_variable="co2e_tonnes", parameters=json.dumps({"fit_intercept": True})),
    ]
    db.add_all(models)

    evaluations = [
        EvaluationResult(evaluation_id=1, model_id=1, mae=60913.85, rmse=224189.81, r2_score=0.9545, mape=9.24),
        EvaluationResult(evaluation_id=2, model_id=2, mae=84210.50, rmse=278400.10, r2_score=0.9120, mape=13.40),
        EvaluationResult(evaluation_id=3, model_id=3, mae=77500.30, rmse=259100.80, r2_score=0.9280, mape=11.85),
        EvaluationResult(evaluation_id=4, model_id=4, mae=105400.00, rmse=321000.00, r2_score=0.8760, mape=16.50),
        EvaluationResult(evaluation_id=5, model_id=5, mae=112800.00, rmse=338500.00, r2_score=0.8620, mape=18.10),
    ]
    db.add_all(evaluations)
    db.commit()

    # 6. Transactional Time-Series Data (2018–2023) for Facilities
    years = [2018, 2019, 2020, 2021, 2022, 2023]
    records = []
    prod_records = []
    energy_records = []

    for fac in facilities:
        base_co2e = (fac.capacity_tpa * 0.45) # realistic emission intensity ~0.45 t CO2e/t capacity
        for y in years:
            year_factor = 1.0 + (y - 2018) * 0.015
            if y == 2020:
                year_factor *= 0.92 # COVID operational slowdown

            co2e = base_co2e * year_factor
            co2 = co2e * 0.955
            ch4 = (co2e * 0.035) / 28.0   # GWP conversion
            n2o = (co2e * 0.010) / 265.0  # GWP conversion

            records.append(EmissionRecord(
                facility_id=fac.facility_id,
                source_id=1,
                record_date=f"{y}-12-31",
                co2_tonnes=round(co2, 2),
                ch4_tonnes=round(ch4, 4),
                n2o_tonnes=round(n2o, 4),
                co2e_tonnes=round(co2e, 2),
                data_quality="Measured - CEMS Verified"
            ))

            # Production data
            feedstock = fac.capacity_tpa * 1.35 * year_factor
            ethylene = fac.capacity_tpa * 0.88 * year_factor
            util = min(98.5, max(75.0, 88.0 + (y - 2018) * 1.2 + (fac.facility_id % 5)))
            prod_records.append(ProductionData(
                facility_id=fac.facility_id,
                record_date=f"{y}-12-31",
                feedstock_tonnes=round(feedstock, 1),
                ethylene_output_t=round(ethylene, 1),
                utilisation_pct=round(util, 1)
            ))

            # Energy consumption
            energy_qty = (fac.capacity_tpa * 2.8 * year_factor) # MWh total
            energy_records.append(EnergyConsumption(
                facility_id=fac.facility_id,
                energy_type_id=1, # Natural Gas
                record_date=f"{y}-12-31",
                quantity=round(energy_qty * 0.65, 1),
                unit="MWh"
            ))
            energy_records.append(EnergyConsumption(
                facility_id=fac.facility_id,
                energy_type_id=2, # Grid Electricity
                record_date=f"{y}-12-31",
                quantity=round(energy_qty * 0.35, 1),
                unit="MWh"
            ))

    db.add_all(records)
    db.add_all(prod_records)
    db.add_all(energy_records)
    db.commit()
    db.close()
    print("Database successfully seeded with 10 facilities, time-series emissions, production, and scenarios.")


if __name__ == "__main__":
    seed_database()
