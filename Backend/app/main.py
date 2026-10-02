from fastapi import FastAPI
from pydantic import BaseModel
from Backend.app.services.model_service import model, preprocessor, feature_columns

app = FastAPI(
    title="Carbon Emission Prediction API",
    description="Machine Learning API for industrial carbon emission prediction",
    version="1.0.0"
)


class PredictionRequest(BaseModel):
    data: dict


@app.get("/")
def root():
    return {
        "message": "Carbon Emission Prediction API is running",
        "model": "Random Forest",
        "features_required": len(feature_columns)
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None
    }