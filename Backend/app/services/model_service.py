from pathlib import Path
import json
import joblib


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_DIR = PROJECT_ROOT / "Models"

MODEL_PATH = MODEL_DIR / "random_forest_emissions.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor_hist.pkl"
FEATURE_COLUMNS_PATH = MODEL_DIR / "feature_columns.json"


# ============================================================
# LOAD SAVED MODEL ARTIFACTS
# ============================================================

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)

with open(FEATURE_COLUMNS_PATH, "r", encoding="utf-8") as f:
    json_feature_columns = json.load(f)


# The fitted preprocessor is the authoritative source for the exact
# original feature names. This protects the API from a typo/mismatch
# in feature_columns.json.
preprocessor_feature_columns = list(
    getattr(preprocessor, "feature_names_in_", [])
)

feature_columns = (
    preprocessor_feature_columns
    if preprocessor_feature_columns
    else json_feature_columns
)

MODEL_INPUT_FEATURE_COUNT = len(feature_columns)
MODEL_OUTPUT_FEATURE_COUNT = getattr(model, "n_features_in_", None)


if MODEL_INPUT_FEATURE_COUNT != 20:
    raise RuntimeError(
        f"Expected 20 model input features, found {MODEL_INPUT_FEATURE_COUNT}."
    )


print("Model loaded successfully")
print(f"Model: {MODEL_PATH}")
print(f"Preprocessor: {PREPROCESSOR_PATH}")
print(f"Number of input features: {MODEL_INPUT_FEATURE_COUNT}")
print(f"Number of transformed features: {MODEL_OUTPUT_FEATURE_COUNT}")
