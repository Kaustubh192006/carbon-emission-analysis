from typing import Any, Optional
from pathlib import Path
import json

import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.history_service import (
    get_facility_profile,
    get_facility_record,
    get_sector_summary,
    get_yearly_summary,
    load_merged_history,
)

from app.services.model_service import (
    MODEL_INPUT_FEATURE_COUNT,
    MODEL_OUTPUT_FEATURE_COUNT,
    feature_columns,
    model,
    preprocessor,
)


# ============================================================
# PATH CONFIGURATION
# ============================================================

APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

MODELS_DIR = PROJECT_ROOT / "Models"


def find_model_file(filename: str) -> Optional[Path]:

    possible_paths = [
        PROJECT_ROOT / "Models" / filename,
        BACKEND_DIR / "Models" / filename,
        APP_DIR / "Models" / filename,
    ]

    for path in possible_paths:
        if path.exists():
            return path

    return None


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Carbon Emission Prediction API",
    description=(
        "Machine Learning API for facility-level industrial "
        "carbon emission prediction and historical analytics"
    ),
    version="2.1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class PredictionRequest(BaseModel):
    facility_id: Optional[int] = None
    year: Optional[int] = None
    data: Optional[dict[str, Any]] = None


# ============================================================
# MODEL PREDICTION HELPER
# ============================================================

def _validate_model_input(
    input_data: pd.DataFrame,
) -> pd.DataFrame:

    missing_features = [
        feature
        for feature in feature_columns
        if feature not in input_data.columns
    ]

    if missing_features:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Required model features are missing.",
                "missing_features": missing_features,
            },
        )

    return input_data.loc[:, feature_columns].copy()


def _model_prediction(
    input_data: pd.DataFrame,
) -> tuple[float, float]:

    try:

        processed_data = preprocessor.transform(
            input_data
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Preprocessing failed: {str(exc)}",
        ) from exc

    try:

        prediction_log = float(
            model.predict(processed_data)[0]
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Model prediction failed: {str(exc)}",
        ) from exc

    try:

        prediction_original = float(
            np.expm1(prediction_log)
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Prediction inverse transformation failed: "
                f"{str(exc)}"
            ),
        ) from exc

    if not np.isfinite(prediction_original):

        raise HTTPException(
            status_code=500,
            detail="Model produced an invalid prediction.",
        )

    prediction_original = max(
        prediction_original,
        0.0,
    )

    return (
        prediction_original,
        prediction_log,
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Carbon Emission Prediction API is running",

        "model": "Random Forest Regressor",

        "model_estimators": getattr(
            model,
            "n_estimators",
            None,
        ),

        "features_required":
            MODEL_INPUT_FEATURE_COUNT,

        "transformed_features":
            MODEL_OUTPUT_FEATURE_COUNT,

        "prediction_scale":
            "original tCO2e via inverse log1p transformation",

        "endpoints": {
            "health": "/health",
            "facility": "/facility/{facility_id}",
            "predict": "/predict",
            "analytics": "/analytics/overview",
            "sectors": "/analytics/sectors",
            "model_metrics": "/model/metrics",
            "model_info": "/model/info",
        },
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    try:

        history = load_merged_history()

        history_loaded = not history.empty
        history_records = int(len(history))

    except Exception:

        history_loaded = False
        history_records = 0

    metrics_path = find_model_file(
        "model_metrics.json"
    )

    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None,
        "history_loaded": history_loaded,
        "history_records": history_records,
        "metrics_loaded": metrics_path is not None,
    }


# ============================================================
# MODEL METRICS
# ============================================================

@app.get("/model/metrics")
def model_metrics():

    metrics_path = find_model_file(
        "model_metrics.json"
    )

    if metrics_path is None:

        raise HTTPException(
            status_code=404,
            detail={
                "message":
                    "Model metrics file not found.",

                "searched_paths": [
                    str(
                        PROJECT_ROOT
                        / "Models"
                        / "model_metrics.json"
                    ),

                    str(
                        BACKEND_DIR
                        / "Models"
                        / "model_metrics.json"
                    ),

                    str(
                        APP_DIR
                        / "Models"
                        / "model_metrics.json"
                    ),
                ],
            },
        )

    try:

        with open(
            metrics_path,
            "r",
            encoding="utf-8",
        ) as file:

            metrics = json.load(file)

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to read model metrics: "
                f"{str(exc)}"
            ),
        ) from exc

    return {
        "model":
            "Random Forest Regressor",

        "metrics":
            metrics,

        "metrics_file":
            str(metrics_path),
    }


# ============================================================
# MODEL INFO
# ============================================================

@app.get("/model/info")
def model_info():

    metrics_path = find_model_file(
        "model_metrics.json"
    )

    return {

        "model_type":
            type(model).__name__,

        "number_of_trees":
            getattr(
                model,
                "n_estimators",
                None,
            ),

        "input_feature_count":
            MODEL_INPUT_FEATURE_COUNT,

        "processed_feature_count":
            MODEL_OUTPUT_FEATURE_COUNT,

        "feature_columns":
            feature_columns,

        "metrics_available":
            metrics_path is not None,

        "metrics_file":
            str(metrics_path)
            if metrics_path is not None
            else None,

        "prediction_target":
            "target_emissions",

        "prediction_scale":
            "tCO2e",

        "training_target_transform":
            "log1p",

        "inverse_transform":
            "expm1",
    }


# ============================================================
# FACILITY PROFILE
# ============================================================

@app.get("/facility/{facility_id}")
def facility_profile(
    facility_id: int,
    year: Optional[int] = None,
):

    try:

        return get_facility_profile(
            facility_id,
            year,
        )

    except KeyError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load facility profile: "
                f"{str(exc)}"
            ),
        ) from exc


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
def predict(
    request: PredictionRequest,
):

    try:

        source = "manual_input"
        metadata = {}

        # ----------------------------------------------------
        # Facility ID + year
        # ----------------------------------------------------

        if (
            request.facility_id is not None
            and request.year is not None
        ):

            source = "facility_history_lookup"

            input_data, metadata = get_facility_record(
                request.facility_id,
                request.year,
            )

        # ----------------------------------------------------
        # Manual input
        # ----------------------------------------------------

        elif request.data is not None:

            input_data = pd.DataFrame(
                [request.data]
            )

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Provide either facility_id + year "
                    "or a complete data object."
                ),
            )

        # ----------------------------------------------------
        # Validate
        # ----------------------------------------------------

        input_data = _validate_model_input(
            input_data
        )

        # ----------------------------------------------------
        # Predict
        # ----------------------------------------------------

        predicted_emission, prediction_log = (
            _model_prediction(input_data)
        )

        response = {

            "predicted_emission":
                predicted_emission,

            "prediction_log":
                prediction_log,

            "unit":
                "tCO2e",

            "source":
                source,

            "model":
                "Random Forest",
        }

        # ----------------------------------------------------
        # Metadata
        # ----------------------------------------------------

        if metadata:

            response.update({

                "facility": {

                    "id":
                        metadata["facility_id"],

                    "name":
                        metadata["facility_name"],
                },

                "prediction_year":
                    metadata["year"],

                "reference_emission":
                    metadata["actual_emission"],

                "history_status":
                    metadata["history_status"],

                "available_history_features":
                    metadata[
                        "available_history_features"
                    ],

                "historical_features":
                    metadata[
                        "historical_features"
                    ],
            })

        return response

    except HTTPException:
        raise

    except KeyError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Prediction failed: "
                f"{str(exc)}"
            ),
        ) from exc


# ============================================================
# ANALYTICS OVERVIEW
# ============================================================

@app.get("/analytics/overview")
def analytics_overview():

    try:

        history = load_merged_history()

        annual = get_yearly_summary()

        if not annual:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No historical analytics "
                    "data is available."
                ),
            )

        latest = annual[-1]

        previous = (
            annual[-2]
            if len(annual) >= 2
            else None
        )

        trend_change_pct = None

        if (
            previous
            and previous["total_emissions"] != 0
        ):

            trend_change_pct = (

                (
                    latest["total_emissions"]
                    - previous["total_emissions"]
                )
                /
                previous["total_emissions"]

            ) * 100.0

        return {

            "records":
                int(len(history)),

            "facilities":
                int(
                    history[
                        "Facility Id"
                    ].nunique()
                ),

            "year_start":
                int(
                    min(
                        item["year"]
                        for item in annual
                    )
                ),

            "year_end":
                int(
                    max(
                        item["year"]
                        for item in annual
                    )
                ),

            "latest_year":
                latest["year"],

            "latest_total_emissions":
                latest[
                    "total_emissions"
                ],

            "latest_average_emission":
                latest[
                    "average_emission"
                ],

            "latest_facilities":
                latest[
                    "facilities"
                ],

            "trend_change_pct":
                trend_change_pct,

            "annual_trend":
                annual,

            "model": {

                "name":
                    "Random Forest",

                "estimators":
                    getattr(
                        model,
                        "n_estimators",
                        None,
                    ),
            },
        }

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Analytics calculation failed: "
                f"{str(exc)}"
            ),
        ) from exc


# ============================================================
# SECTOR ANALYTICS
# ============================================================

@app.get("/analytics/sectors")
def analytics_sectors(
    year: Optional[int] = None,
):

    try:

        return get_sector_summary(year)

    except KeyError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Sector analytics failed: "
                f"{str(exc)}"
            ),
        ) from exc