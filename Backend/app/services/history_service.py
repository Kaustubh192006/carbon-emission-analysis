from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from app.services.model_service import feature_columns


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "Data"

FACILITY_HISTORY_PATH = DATA_DIR / "facility_history.parquet"
HISTORY_REFERENCE_PATH = DATA_DIR / "df_hist_reference.parquet"


# Historical model features created during the EDA/feature-engineering stage.
HISTORICAL_FEATURES = [
    "emissions_lag_1",
    "emissions_lag_2",
    "emissions_lag_3",
    "emissions_avg_3",
    "emissions_avg_5",
    "emissions_change_1",
    "emissions_growth_1",
]


@lru_cache(maxsize=1)
def load_merged_history() -> pd.DataFrame:
    """Load and join facility records with precomputed historical features."""

    if not FACILITY_HISTORY_PATH.exists():
        raise FileNotFoundError(
            f"Facility history file not found: {FACILITY_HISTORY_PATH}"
        )

    if not HISTORY_REFERENCE_PATH.exists():
        raise FileNotFoundError(
            f"Historical feature file not found: {HISTORY_REFERENCE_PATH}"
        )

    facility_df = pd.read_parquet(FACILITY_HISTORY_PATH)
    reference_df = pd.read_parquet(HISTORY_REFERENCE_PATH)

    required_facility_keys = {"Facility Id", "Year"}
    required_reference_keys = {
        "Facility Id",
        "Year",
        *HISTORICAL_FEATURES,
    }

    missing_facility_keys = required_facility_keys - set(facility_df.columns)
    missing_reference_keys = required_reference_keys - set(reference_df.columns)

    if missing_facility_keys:
        raise RuntimeError(
            f"facility_history.parquet is missing columns: "
            f"{sorted(missing_facility_keys)}"
        )

    if missing_reference_keys:
        raise RuntimeError(
            f"df_hist_reference.parquet is missing columns: "
            f"{sorted(missing_reference_keys)}"
        )

    merged = facility_df.merge(
        reference_df,
        on=["Facility Id", "Year"],
        how="left",
        validate="one_to_one",
        suffixes=("", "_reference"),
    )

    # The model feature list must exist in the merged source data.
    missing_model_features = [
        feature
        for feature in feature_columns
        if feature not in merged.columns
    ]

    if missing_model_features:
        raise RuntimeError(
            "Merged history data is missing model features: "
            f"{missing_model_features}"
        )

    return merged


def _safe_value(value: Any) -> Any:
    """Convert pandas/numpy scalars and NaN to JSON-safe Python values."""

    if pd.isna(value):
        return None

    if hasattr(value, "item"):
        return value.item()

    return value


def _normalize_id_mask(series: pd.Series, value: int) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    return numeric.eq(int(value))


def _normalize_year_mask(series: pd.Series, value: int) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    return numeric.eq(int(value))


def get_available_years(facility_id: int) -> list[int]:
    """Return the years available for a facility."""

    df = load_merged_history()

    subset = df[_normalize_id_mask(df["Facility Id"], facility_id)]

    if subset.empty:
        return []

    years = pd.to_numeric(subset["Year"], errors="coerce").dropna()
    return sorted({int(year) for year in years})


def get_facility_record(
    facility_id: int,
    year: int,
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Return one model-ready row plus metadata for a facility/year."""

    df = load_merged_history()

    mask = _normalize_id_mask(df["Facility Id"], facility_id) & _normalize_year_mask(
        df["Year"], year
    )

    row_df = df.loc[mask].copy()

    if row_df.empty:
        available_years = get_available_years(facility_id)

        if not available_years:
            raise KeyError(
                f"Facility ID {facility_id} was not found in the historical dataset."
            )

        raise KeyError(
            f"Year {year} is not available for facility {facility_id}. "
            f"Available years: {available_years}"
        )

    if len(row_df) != 1:
        raise RuntimeError(
            f"Expected exactly one record for Facility Id={facility_id}, Year={year}; "
            f"found {len(row_df)}."
        )

    row = row_df.iloc[0]

    model_input = row_df.loc[:, feature_columns].copy()

    history_values = {
        feature: _safe_value(row[feature])
        for feature in HISTORICAL_FEATURES
    }

    available_history_count = sum(
        value is not None for value in history_values.values()
    )

    if available_history_count == len(HISTORICAL_FEATURES):
        history_status = "complete"
    elif available_history_count == 0:
        history_status = "limited"
    else:
        history_status = "partial"

    metadata = {
        "facility_id": int(row["Facility Id"]),
        "facility_name": _safe_value(row["Facility Name"]),
        "year": int(row["Year"]),
        "actual_emission": _safe_value(row.get("target_emissions")),
        "available_years": get_available_years(facility_id),
        "history_status": history_status,
        "available_history_features": available_history_count,
        "historical_features": history_values,
    }

    return model_input, metadata


def get_facility_profile(
    facility_id: int,
    year: int | None = None,
) -> dict[str, Any]:
    """Return a frontend-friendly facility profile."""

    available_years = get_available_years(facility_id)

    if not available_years:
        raise KeyError(
            f"Facility ID {facility_id} was not found in the historical dataset."
        )

    selected_year = int(year) if year is not None else int(max(available_years))

    model_input, metadata = get_facility_record(facility_id, selected_year)

    features = {
        feature: _safe_value(model_input.iloc[0][feature])
        for feature in feature_columns
    }

    return {
        **metadata,
        "features": features,
    }


def get_yearly_summary() -> list[dict[str, Any]]:
    """Return annual emission totals and facility counts."""

    df = load_merged_history().copy()

    summary = (
        df.groupby("Year", dropna=False)
        .agg(
            total_emissions=("target_emissions", "sum"),
            average_emission=("target_emissions", "mean"),
            facilities=("Facility Id", "nunique"),
        )
        .reset_index()
        .sort_values("Year")
    )

    return [
        {
            "year": int(row["Year"]),
            "total_emissions": float(row["total_emissions"]),
            "average_emission": float(row["average_emission"]),
            "facilities": int(row["facilities"]),
        }
        for _, row in summary.iterrows()
    ]


def get_sector_summary(year: int | None = None) -> dict[str, Any]:
    """Return sector emission distribution for a selected year."""

    df = load_merged_history().copy()

    years = pd.to_numeric(df["Year"], errors="coerce").dropna().astype(int)
    latest_year = int(year) if year is not None else int(years.max())

    year_df = df[years.eq(latest_year)]

    if year_df.empty:
        raise KeyError(f"No data available for year {latest_year}.")

    sector = (
        year_df.groupby("Industry Type (sectors)", dropna=False)["target_emissions"]
        .sum()
        .sort_values(ascending=False)
    )

    total = float(sector.sum())

    top = []
    for name, value in sector.head(4).items():
        safe_name = "Unknown" if pd.isna(name) else str(name)
        percentage = (float(value) / total * 100.0) if total else 0.0
        top.append(
            {
                "name": safe_name,
                "emissions": float(value),
                "percentage": percentage,
            }
        )

    top_total = sum(item["emissions"] for item in top)
    other_emissions = max(total - top_total, 0.0)

    if other_emissions > 0:
        top.append(
            {
                "name": "Other",
                "emissions": other_emissions,
                "percentage": (other_emissions / total * 100.0) if total else 0.0,
            }
        )

    return {
        "year": latest_year,
        "total_emissions": total,
        "sectors": top,
    }
