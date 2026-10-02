from pathlib import Path
import json
import joblib


# Project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Model directory
MODEL_DIR = PROJECT_ROOT / "Models"


# Model files
MODEL_PATH = MODEL_DIR / "random_forest_emissions.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor_hist.pkl"
FEATURE_COLUMNS_PATH = MODEL_DIR / "feature_columns.json"


# Load trained model
model = joblib.load(MODEL_PATH)

# Load preprocessor
preprocessor = joblib.load(PREPROCESSOR_PATH)

# Load feature columns
with open(FEATURE_COLUMNS_PATH, "r", encoding="utf-8") as f:
    feature_columns = json.load(f)


print("Model loaded successfully")
print(f"Model: {MODEL_PATH}")
print(f"Preprocessor: {PREPROCESSOR_PATH}")
print(f"Number of features: {len(feature_columns)}")