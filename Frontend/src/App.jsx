import { memo, useEffect, useMemo, useState } from "react";

import "./App.css";

import DataExplorerView from "./components/DataExplorerView";
import ForecastingView from "./components/ForecastingView";
import ScenarioView from "./components/ScenarioView";
import ModelComparisonView from "./components/ModelComparisonView";
import ResultsView from "./components/ResultsView";



const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const YEARS = [
  2030, 2029, 2028, 2027, 2026, 2025, 2024,
  2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012
];



const SectionIcon = memo(({ id, className = "", size = 18 }) => {
  switch (id) {
    case "dashboard":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="3" width="7.5" height="5" rx="2" />
          <rect x="13.5" y="11" width="7.5" height="10" rx="2" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
        </svg>
      );
    case "predictions":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <path d="M19.5 2.5V5.5M18 4H21" strokeWidth="1.5" />
        </svg>
      );
    case "analytics":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 20.5H21" />
          <path d="M4.5 15.5L9.5 10.5L14 14L20 6.5" />
          <polyline points="15.5 6.5 20 6.5 20 11" />
          <circle cx="9.5" cy="10.5" r="1.3" fill="currentColor" />
          <circle cx="14" cy="14" r="1.3" fill="currentColor" />
          <circle cx="20" cy="6.5" r="1.7" fill="currentColor" />
        </svg>
      );
    case "facilities":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 21V10L9 6V12L15 8V14L21 11V21H3Z" />
          <line x1="7" y1="17" x2="7.01" y2="17" strokeWidth="3" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
          <line x1="17" y1="17" x2="17.01" y2="17" strokeWidth="3" />
        </svg>
      );
    case "explore":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      );
    case "forecast":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "scenarios":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v8" />
          <path d="m4.93 10.93 4.24 4.24" />
          <path d="M2 12h8" />
          <path d="M14 12c0 4.42-3.58 8-8 8" />
          <circle cx="17.5" cy="6.5" r="3.5" />
          <path d="M17.5 10v12" />
          <path d="M14 16h7" />
        </svg>
      );
    case "models":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
          <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case "results":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    default:
      return null;
  }
});

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", badge: null },
  { id: "explore", label: "Data Explorer", badge: "IPCC" },
  { id: "forecast", label: "Forecasting", badge: "2035" },
  { id: "scenarios", label: "Scenario Analysis", badge: "50%" },
  { id: "models", label: "Model Benchmark", badge: "R² 0.95" },
  { id: "results", label: "Audit & Export", badge: "CSV" },
  { id: "predictions", label: "ML Estimator", badge: null },
  { id: "analytics", label: "Macro Trends", badge: null },
  { id: "facilities", label: "Facilities", badge: "10" },
];



const MODEL_PERFORMANCE = {
  r2: 0.954537,
  mae: 60913.85,
  rmse: 224189.81,
  smape: 21.77,
  training: "2014–2022",
  validation: "2023",
  records: 6179,
};


const VIEW_META = {

  dashboard: {

    eyebrow: "CARBON EMISSION INTELLIGENCE",

    title: <>Understand emissions. <em>Build a cleaner tomorrow.</em></>,

    subtitle:

      "Explore real-world EPA GHGP facility data, understand long-term emission patterns, and use machine learning to estimate facility-level emissions.",

    image: "/dashboard-sunset.jpg",

    imageLabel: "A cleaner tomorrow",

    imageCaption: "Sustainability begins with understanding the data.",

  },

  predictions: {

    eyebrow: "AI EMISSION PREDICTION",

    title: <>Predict with <em>historical context.</em></>,

    subtitle:

      "Select a real facility and reporting year. CarbonAI retrieves the historical model features automatically and evaluates the saved Random Forest pipeline.",

    image: "/predictions-tree.jpg",

    imageLabel: "Environmental intelligence",

    imageCaption: "Historical patterns become actionable predictions.",

  },

  analytics: {

    eyebrow: "DATA & ANALYTICS",

    title: <>See the emissions <em>landscape.</em></>,

    subtitle:

      "Explore year-wise and sector-wise emission patterns directly from the 88,080 facility-year records in the project dataset.",

    image: "/analytics-aerial.jpg",

    imageLabel: "From a wider view",

    imageCaption: "Macro-level patterns reveal where emissions concentrate.",

  },

  explore: {
    eyebrow: "DATA EXPLORER & INGESTION",
    title: <>Ingest activity data. <em>Analyze correlations.</em></>,
    subtitle: "Upload plant-level production CSVs, inspect operational correlation heatmaps, and query historical facility emissions.",
    image: "/analytics-aerial.jpg",
    imageLabel: "Activity explorer",
    imageCaption: "Multivariate relationships between throughput, power, and emissions.",
  },

  forecast: {
    eyebrow: "TIME-SERIES FORECASTING",
    title: <>Project future emissions with <em>statistical rigor.</em></>,
    subtitle: "Deploy ARIMA/SARIMA, Meta Prophet, or Random Forest autoregressive models with 95% confidence intervals and ADF stationarity checks.",
    image: "/predictions-tree.jpg",
    imageLabel: "Forecasting studio",
    imageCaption: "Forward-looking trajectories over 1 to 5-year planning horizons.",
  },

  scenarios: {
    eyebrow: "SUSTAINABILITY MODELING",
    title: <>Simulate <em>renewable energy impact.</em></>,
    subtitle: "What-if scenario simulator: calculate avoided emissions and carbon tax savings from 10% to 50% renewable adoption displacing fossil fuels.",
    image: "/dashboard-sunset.jpg",
    imageLabel: "Decarbonization pathway",
    imageCaption: "Emissions_scenario = Baseline - (Renewable_Share × Displaced_Energy × EF)",
  },

  models: {
    eyebrow: "ACADEMIC BENCHMARK",
    title: <>Rigorous <em>model comparison.</em></>,
    subtitle: "Compare Random Forest against ARIMA, Prophet, Ridge, and Linear Regression using MAE, RMSE, MAPE, and R² under IEEE Std 830-1998 standards.",
    image: "/facilities-road.jpg",
    imageLabel: "Model evaluation",
    imageCaption: "Champion: Random Forest Regressor with R² = 0.9545.",
  },

  results: {
    eyebrow: "AUDIT & EXPORT",
    title: <>Generate audit-ready <em>sustainability reports.</em></>,
    subtitle: "Download formal CSV forecast reports and calculate exact IPCC AR5 GWP conversions and emission intensity benchmarks.",
    image: "/dashboard-sunset.jpg",
    imageLabel: "Audit trail",
    imageCaption: "Downloadable dataset for compliance and academic defense.",
  },

  facilities: {

    eyebrow: "FACILITY INTELLIGENCE",

    title: <>Explore every <em>facility.</em></>,

    subtitle:

      "Inspect a real reporting facility, its profile, historical context, and the prediction generated by the same production ML pipeline.",

    image: "/facilities-road.jpg",

    imageLabel: "Facility explorer",

    imageCaption: "Move from the dataset to a specific reporting facility.",

  },

};



const formatNumber = (value, maximumFractionDigits = 2) => {

  if (value === null || value === undefined || Number.isNaN(Number(value))) {

    return "—";

  }



  return new Intl.NumberFormat("en-US", {

    minimumFractionDigits: 0,

    maximumFractionDigits,

  }).format(Number(value));

};



const formatPercent = (value, digits = 1) => {

  if (value === null || value === undefined || Number.isNaN(Number(value))) {

    return "—";

  }



  return `${Number(value).toFixed(digits)}%`;

};



const getSectorRows = (payload) => {

  const raw = Array.isArray(payload)

    ? payload

    : payload?.sectors || payload?.data || payload?.summary || [];



  if (!Array.isArray(raw)) return [];



  return raw

    .map((row) => ({

      name:

        row?.sector ||

        row?.name ||

        row?.industry_sector ||

        row?.["Industry Type (sectors)"] ||

        "Other",

      value: Number(

        row?.total_emissions ?? row?.emissions ?? row?.value ?? row?.total ?? 0

      ),

    }))

    .filter((row) => Number.isFinite(row.value) && row.value >= 0)

    .sort((a, b) => b.value - a.value);

};



const getErrorMessage = (payload, fallback) => {

  if (typeof payload?.detail === "string") return payload.detail;

  if (payload?.detail?.message) return payload.detail.message;

  return fallback;

};



async function fetchJson(url, options = {}) {

  const response = await fetch(url, options);

  let payload = null;



  try {

    payload = await response.json();

  } catch {

    payload = null;

  }



  if (!response.ok) {

    throw new Error(

      getErrorMessage(payload, `Request failed (${response.status})`)

    );

  }



  return payload;

}



function App() {

  const [activeView, setActiveView] = useState("dashboard");
  const [visitedViews, setVisitedViews] = useState(() => new Set(["dashboard"]));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);



  const [analytics, setAnalytics] = useState(null);

  const [sectorRows, setSectorRows] = useState([]);

  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [dashboardError, setDashboardError] = useState("");



  const [facilityId, setFacilityId] = useState("1004377");

  const [year, setYear] = useState("2023");

  const [facilityProfile, setFacilityProfile] = useState(null);

  const [facilityLoading, setFacilityLoading] = useState(false);

  const [facilityError, setFacilityError] = useState("");



  const [showPrediction, setShowPrediction] = useState(false);

  const [prediction, setPrediction] = useState(null);

  const [predictionDetails, setPredictionDetails] = useState(null);

  const [predictionLoading, setPredictionLoading] = useState(false);

  const [predictionError, setPredictionError] = useState("");



  useEffect(() => {

    let cancelled = false;



    async function loadProjectData() {

      setDashboardLoading(true);

      setDashboardError("");



      try {

        const overview = await fetchJson(`${API_BASE}/analytics/overview`);

        if (cancelled) return;



        setAnalytics(overview);



        try {

          const sectors = await fetchJson(

            `${API_BASE}/analytics/sectors?year=${overview.latest_year}`

          );

          if (!cancelled) setSectorRows(getSectorRows(sectors));

        } catch {

          if (!cancelled) setSectorRows([]);

        }

      } catch (error) {

        if (!cancelled) {

          setDashboardError(

            error.message || "Unable to load project analytics."

          );

        }

      } finally {

        if (!cancelled) setDashboardLoading(false);

      }

    }



    loadProjectData();



    return () => {

      cancelled = true;

    };

  }, []);



  useEffect(() => {

    if (activeView !== "facilities") return undefined;



    // Clear any previous prediction whenever the selected
    // facility or reporting year changes.
    setPrediction(null);

    setPredictionDetails(null);

    setPredictionError("");



    const id = Number(facilityId);

    const selectedYear = Number(year);



    if (!Number.isInteger(id) || id <= 0) {

      setFacilityProfile(null);

      setFacilityError("Enter a valid numeric Facility ID.");

      return undefined;

    }



    let cancelled = false;



    async function loadFacilityProfile() {

      setFacilityLoading(true);

      setFacilityError("");



      try {

        const profile = await fetchJson(

          `${API_BASE}/facility/${id}?year=${selectedYear}`

        );



        if (!cancelled) setFacilityProfile(profile);

      } catch (error) {

        if (!cancelled) {

          setFacilityProfile(null);

          setFacilityError(

            error.message || "Unable to retrieve the facility profile."

          );

        }

      } finally {

        if (!cancelled) setFacilityLoading(false);

      }

    }



    loadFacilityProfile();



    return () => {

      cancelled = true;

    };

  }, [activeView, facilityId, year]);



  const chartRows = useMemo(

    () =>

      (analytics?.annual_trend || []).map((row) => ({

        year: Number(row.year),

        value: Number(row.total_emissions) || 0,

      })),

    [analytics]

  );



  const chartMax = useMemo(

    () => Math.max(...chartRows.map((row) => row.value), 1),

    [chartRows]

  );



  const sectorTotal = useMemo(

    () => sectorRows.reduce((sum, row) => sum + row.value, 0),

    [sectorRows]

  );



  const latestAnnual = analytics?.annual_trend?.length

    ? analytics.annual_trend[analytics.annual_trend.length - 1]

    : null;



  const referenceComparison = useMemo(() => {

    const reference = Number(predictionDetails?.reference_emission);

    const predicted = Number(prediction);



    if (

      !Number.isFinite(reference) ||

      reference <= 0 ||

      !Number.isFinite(predicted)

    ) {

      return null;

    }



    const difference = predicted - reference;



    return {

      difference,

      percentage: (difference / reference) * 100,

    };

  }, [prediction, predictionDetails]);



  const profileFields = useMemo(() => {

    if (!facilityProfile || typeof facilityProfile !== "object") return [];



    return Object.entries(facilityProfile).filter(

      ([key, value]) =>

        !["historical_features", "history", "years"].includes(key) &&

        value !== null &&

        value !== undefined &&

        typeof value !== "object"

    );

  }, [facilityProfile]);



  const navigate = (view) => {

    setActiveView(view);

    setVisitedViews((prev) => {
      if (prev.has(view)) return prev;
      const next = new Set(prev);
      next.add(view);
      return next;
    });

    setShowPrediction(false);

    window.scrollTo(0, 0);

  };



  const openPrediction = () => {

    setPredictionError("");

    setShowPrediction(true);

  };



  const runPrediction = async (event) => {

    event.preventDefault();

    setPredictionLoading(true);

    setPredictionError("");

    setPrediction(null);

    setPredictionDetails(null);



    try {

      const id = Number(facilityId);

      const selectedYear = Number(year);



      if (!Number.isInteger(id) || id <= 0) {

        throw new Error("Enter a valid Facility ID.");

      }



      if (

        !Number.isInteger(selectedYear) ||

        selectedYear < 2012 ||

        selectedYear > 2023

      ) {

        throw new Error("Choose a prediction year from 2012 to 2023.");

      }



      const result = await fetchJson(`${API_BASE}/predict`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          facility_id: id,

          year: selectedYear,

        }),

      });



      if (result?.predicted_emission === undefined) {

        throw new Error("The API did not return a valid prediction.");

      }



      setPrediction(Number(result.predicted_emission));

      setPredictionDetails(result);

    } catch (error) {

      setPredictionError(

        error.message || "Unable to connect to the prediction API."

      );

    } finally {

      setPredictionLoading(false);

    }

  };



  const hero = VIEW_META[activeView] || VIEW_META.dashboard;



  const renderHero = () => (

    <section className={`view-hero hero-${activeView}`}>

      <div className="hero-copy">

        <div className="eyebrow">
          <SectionIcon id={activeView} size={14} className="eyebrow-icon" />
          <span>{hero.eyebrow}</span>
        </div>

        <h1>{hero.title}</h1>

        <p className="hero-subtitle">{hero.subtitle}</p>



        <div className="hero-actions">

          {activeView !== "analytics" && (

            <button

              className="button button-primary"

              type="button"

              onClick={() => {

                if (activeView === "dashboard") {

                  navigate("analytics");

                } else {

                  openPrediction();

                }

              }}

            >

              {activeView === "dashboard"

                ? "Explore Analytics"

                : "Predict Emissions"}{" "}

              →

            </button>

          )}



          <button

            className="button button-secondary"

            type="button"

            onClick={() =>

              navigate(activeView === "analytics" ? "dashboard" : "analytics")

            }

          >

            {activeView === "analytics" ? "Back to Dashboard" : "View Analytics"}

          </button>

        </div>

      </div>



      <div

        className="hero-media"

        style={{ backgroundImage: `url("${hero.image}")` }}

        role="img"

        aria-label={hero.imageCaption}

      >

        <div className="hero-media-overlay"></div>

        <div className="hero-media-card">

          <span className="hero-media-mark"><SectionIcon id={activeView} size={18} /></span>

          <strong>{hero.imageLabel}</strong>

          <span>{hero.imageCaption}</span>

        </div>

      </div>

    </section>

  );



  const renderDashboard = () => (

    <>

      {renderHero()}



      <section className="stats-grid">

        <StatCard

          label="Dataset coverage"

          value={formatNumber(analytics?.records, 0)}

          unit="facility-year records"

          note={

            analytics

              ? `${analytics.year_start}–${analytics.year_end}`

              : "Loading..."

          }

          accent="green"

        />

        <StatCard

          label="Unique facilities"

          value={formatNumber(analytics?.facilities, 0)}

          unit="facilities"

          note="EPA GHGP historical dataset"

          accent="amber"

        />

        <StatCard

          label="Latest reporting year"

          value={analytics?.latest_year ?? "—"}

          unit="reporting year"

          note={

            analytics?.latest_total_emissions

              ? `${formatNumber(analytics.latest_total_emissions)} tCO₂e`

              : "Loading..."

          }

          accent="blue"

        />

        <StatCard

          label="ML configuration"

          value={analytics?.model?.estimators ?? 200}

          unit="Random Forest trees"

          note="20 model input features"

          accent="purple"

        />

      </section>



      <section className="dashboard-grid">

        <div className="panel trend-panel">

          <PanelHeading

            kicker="TIME SERIES"

            title="Annual emission trend"

            subtitle="Total reported direct emissions across reporting years."

            chip={`${analytics?.year_start ?? "—"}–${analytics?.year_end ?? "—"}`}

          />



          <div className="trend-chart">

            {chartRows.map((row) => {

              const percentage = (row.value / chartMax) * 100;

              return (

                <div className="trend-column" key={row.year}>

                  <span className="trend-value">{formatNumber(row.value / 1e9, 2)}B</span>

                  <div

                    className="trend-bar"

                    style={{ height: `${Math.max(percentage, 3)}%` }}

                    title={`${row.year}: ${formatNumber(row.value)} tCO₂e`}

                  />

                  <span>{row.year}</span>

                </div>

              );

            })}

          </div>

        </div>



        <div className="panel sector-panel">

          <PanelHeading

            kicker="INDUSTRY MIX"

            title="Sector distribution"

            subtitle={`Share of emissions in ${analytics?.latest_year ?? "latest year"}.`}

          />



          <div className="donut-wrap">

            <div

              className="donut"

              style={{

                background:

                  sectorRows.length > 0

                    ? `conic-gradient(#c8f33a 0 ${Math.min(

                        ((sectorRows[0]?.value || 0) / Math.max(sectorTotal, 1)) * 100,

                        100

                      )}%, #ffbe55 0 78%, #b579ff 0 90%, #54c7ff 0 96%, #47e1c1 0 100%)`

                    : "conic-gradient(#263024 0 100%)",

              }}

            >

              <div className="donut-hole">

                <strong>{analytics?.latest_year ?? "—"}</strong>

                <span>Reporting year</span>

              </div>

            </div>



            <div className="sector-list">

              {sectorRows.slice(0, 5).map((row, index) => {

                const pct = sectorTotal

                  ? (row.value / sectorTotal) * 100

                  : 0;

                return (

                  <div className="sector-row" key={`${row.name}-${index}`}>

                    <span className="sector-dot" data-index={index} />

                    <span className="sector-name">{row.name}</span>

                    <strong>{pct.toFixed(1)}%</strong>

                  </div>

                );

              })}

            </div>

          </div>

        </div>



        <div className="panel prediction-teaser">

          <PanelHeading

            kicker="AI PREDICTION"

            title="Facility estimate"

            subtitle="Use the real facility history already loaded by FastAPI."

            badge="AI"

          />



          <div className="prediction-steps">

            <PredictionStep

              number="01"

              title="Choose a facility"

              text="Select Facility ID + reporting year."

            />

            <PredictionStep

              number="02"

              title="Retrieve history"

              text="Lag, rolling averages, change and growth are automatic."

            />

            <PredictionStep

              number="03"

              title="Run Random Forest"

              text="Saved preprocessing + model pipeline."

            />

          </div>



          <button className="button button-primary full-button" onClick={openPrediction}>

            Predict Emissions →

          </button>

        </div>

      </section>



      <section className="bottom-grid">

        <div className="panel insight-panel">

          <PanelHeading

            kicker="PROJECT INSIGHT"

            title="What the data says"

            subtitle="A compact, data-backed interpretation of the current project state."

            badge="LIVE"

          />



          <div className="insight-card">

            <strong>

              {latestAnnual?.year

                ? `${latestAnnual.year} is the latest reporting year in the project.`

                : "Historical emissions are connected to the dashboard."}

            </strong>

            <p>

              {latestAnnual

                ? `${formatNumber(

                    latestAnnual.total_emissions

                  )} tCO₂e were reported across ${formatNumber(

                    latestAnnual.facilities,

                    0

                  )} facilities in ${latestAnnual.year}.`

                : "The dashboard is reading directly from the FastAPI analytics endpoint."}

            </p>

          </div>



          <div className="status-grid">

            <div>

              <span>Trend change</span>

              <strong>

                {analytics?.trend_change_pct === null ||

                analytics?.trend_change_pct === undefined

                  ? "—"

                  : `${analytics.trend_change_pct >= 0 ? "+" : ""}${analytics.trend_change_pct.toFixed(

                      1

                    )}%`}

              </strong>

            </div>

            <div>

              <span>Latest average</span>

              <strong>

                {formatNumber(analytics?.latest_average_emission)} tCO₂e

              </strong>

            </div>

          </div>

        </div>



        <div className="panel project-status">

          <PanelHeading

            kicker="MODEL STATUS"

            title="Production pipeline"

            subtitle="The UI is connected to your saved Random Forest model and project history."

          />



          <div className="status-list">

            <StatusItem title="API" value="Connected" />

            <StatusItem title="Historical records" value={formatNumber(analytics?.records, 0)} />

            <StatusItem title="Features" value="20 model inputs" />

            <StatusItem title="Model" value={`Random Forest · ${analytics?.model?.estimators ?? 200} trees`} />

          </div>

        </div>

      </section>

    </>

  );



  const renderPredictions = () => (

    <>

      {renderHero()}



      <section className="workspace-grid">

        <div className="panel prediction-workspace">

          <PanelHeading

            kicker="PREDICTION WORKSPACE"

            title="Facility-level emission estimate"

            subtitle="No manual historical-feature calculation is required."

            badge="AI"

          />



          <div className="selection-grid">

            <div className="field">

              <label>Facility ID</label>

              <input

                type="number"

                min="1"

                value={facilityId}

                onChange={(event) => setFacilityId(event.target.value)}

                placeholder="1004377"

              />

            </div>



            <div className="field">

              <label>Reporting year</label>

              <select

                value={year}

                onChange={(event) => setYear(event.target.value)}

              >

                {YEARS.map((availableYear) => (

                  <option key={availableYear} value={availableYear}>

                    {availableYear}

                  </option>

                ))}

              </select>

            </div>

          </div>



          <div className="feature-strip">

            <div>

              <b>HISTORY</b>

              <span>7 engineered features</span>

            </div>

            <div>

              <b>PIPELINE</b>

              <span>Saved preprocessor</span>

            </div>

            <div>

              <b>MODEL</b>

              <span>{analytics?.model?.estimators ?? 200}-tree Random Forest</span>

            </div>

          </div>



          <div className="prediction-showcase">

            <span className="result-label">Latest prediction</span>

            <strong>

              {prediction === null

                ? "—"

                : `${formatNumber(prediction)} tCO₂e`}

            </strong>

            <small>

              {predictionDetails?.facility?.name

                ? `${predictionDetails.facility.name} · ${predictionDetails.prediction_year}`

                : "Run a prediction to populate the result."}

            </small>

          </div>



          {referenceComparison && (

            <div className="comparison-grid">

              <div>

                <span>Reference emission</span>

                <strong>

                  {formatNumber(predictionDetails.reference_emission)} tCO₂e

                </strong>

              </div>

              <div>

                <span>Prediction difference</span>

                <strong>

                  {formatNumber(referenceComparison.difference)} tCO₂e

                </strong>

              </div>

              <div>

                <span>Relative difference</span>

                <strong>{formatPercent(referenceComparison.percentage)}</strong>

              </div>

            </div>

          )}



          {predictionError && (

            <div className="prediction-error">{predictionError}</div>

          )}



          <div className="workspace-actions">

            <button

              className="button button-primary"

              type="button"

              onClick={runPrediction}

              disabled={predictionLoading}

            >

              {predictionLoading ? "Analyzing facility…" : "Run Prediction →"}

            </button>

          </div>

        </div>



        <div className="panel feature-panel">

          <PanelHeading

            kicker="MODEL INPUTS"

            title="Automatically retrieved history"

            subtitle="These are the historical features sent to the saved ML pipeline."

          />



          {predictionDetails?.historical_features ? (

            <div className="feature-list">

              {Object.entries(predictionDetails.historical_features).map(

                ([name, value]) => (

                  <div className="feature-item" key={name}>

                    <span>{name}</span>

                    <strong>

                      {value === null || value === undefined

                        ? "Unavailable"

                        : formatNumber(value, 4)}

                    </strong>

                  </div>

                )

              )}

            </div>

          ) : (

            <div className="empty-state">

              <div className="empty-icon">✦</div>

              <strong>No prediction yet</strong>

              <p>

                Run the prediction to see the exact historical feature values

                retrieved from the project data.

              </p>

            </div>

          )}

        </div>

      </section>



      <section className="bottom-grid">

        <div className="panel insight-panel">

          <PanelHeading

            kicker="WHY THIS IS ROBUST"

            title="The model sees the facility in context"

            subtitle="The backend retrieves the same historical features used during training."

          />

          <div className="status-grid three">

            <div>

              <span>Facility context</span>

              <strong>Location + industry</strong>

            </div>

            <div>

              <span>History</span>

              <strong>Lag + rolling features</strong>

            </div>

            <div>

              <span>Inference</span>

              <strong>Saved preprocessing + RF</strong>

            </div>

          </div>

        </div>



        <div className="panel project-status">

          <PanelHeading

            kicker="REFERENCE"

            title="Historical comparison"

            subtitle="Useful for evaluating the model on known facility-year records."

          />

          {referenceComparison ? (

            <div className="insight-card">

              <strong>

                Prediction is{" "}

                {referenceComparison.difference >= 0 ? "above" : "below"} the

                reference.

              </strong>

              <p>

                Reference: {formatNumber(predictionDetails.reference_emission)}{" "}

                tCO₂e. Difference:{" "}

                {formatNumber(referenceComparison.difference)} tCO₂e (

                {formatPercent(referenceComparison.percentage)}).

              </p>

            </div>

          ) : (

            <div className="empty-state compact">

              <strong>Reference comparison appears after a run.</strong>

            </div>

          )}

        </div>

      </section>

    </>

  );



  const renderAnalytics = () => (

    <>

      {renderHero()}



      <section className="stats-grid">

        <StatCard

          label="Dataset coverage"

          value={formatNumber(analytics?.records, 0)}

          unit="facility-year records"

          note={`${analytics?.year_start ?? "—"}–${analytics?.year_end ?? "—"}`}

          accent="green"

        />

        <StatCard

          label="Unique facilities"

          value={formatNumber(analytics?.facilities, 0)}

          unit="facilities"

          note="EPA GHGP historical dataset"

          accent="amber"

        />

        <StatCard

          label="Latest year"

          value={analytics?.latest_year ?? "—"}

          unit="reporting year"

          note={`${formatNumber(analytics?.latest_total_emissions)} tCO₂e`}

          accent="blue"

        />

        <StatCard

          label="Model"

          value={analytics?.model?.estimators ?? 200}

          unit="trees"

          note="Random Forest Regressor"

          accent="purple"

        />

      </section>



      <section className="dashboard-grid analytics-dashboard-grid">

        <div className="panel wide trend-panel">

          <PanelHeading

            kicker="ANNUAL TREND"

            title="Emissions across reporting years"

            subtitle="Historical total reported direct emissions from the project dataset."

          />

          <div className="trend-chart tall">

            {chartRows.map((row) => (

              <div className="trend-column" key={`analytics-${row.year}`}>

                <span className="trend-value">

                  {formatNumber(row.value / 1e9, 2)}B

                </span>

                <div

                  className="trend-bar"

                  style={{

                    height: `${Math.max((row.value / chartMax) * 100, 3)}%`,

                  }}

                />

                <span>{row.year}</span>

              </div>

            ))}

          </div>

        </div>



        <div className="panel insight-panel analytics-sector-card">

          <PanelHeading

            kicker="SECTOR ANALYSIS"

            title="Industry distribution"

            subtitle={`Top sectors in ${analytics?.latest_year ?? "latest year"}.`}

          />



          <div className="analytics-sector-list sector-list-large">

            {sectorRows.map((row, index) => {

              const pct = sectorTotal

                ? (row.value / sectorTotal) * 100

                : 0;

              return (

                <div className="analytics-sector-row" key={`${row.name}-a-${index}`}>

                  <div className="analytics-sector-top">

                    <span className="sector-dot" data-index={index} />

                    <span>{row.name}</span>

                    <strong>{pct.toFixed(1)}%</strong>

                  </div>

                  <div className="sector-track">

                    <span style={{ width: `${pct}%` }} />

                  </div>

                  <small>{formatNumber(row.value)} tCO₂e</small>

                </div>

              );

            })}

          </div>

        </div>

      </section>

      <section className="model-performance-section">
        <div className="panel model-performance-panel">
          <PanelHeading
            kicker="MODEL PERFORMANCE"
            title="Validation performance"
            subtitle="Held-out 2023 evaluation of the production Random Forest model."
            badge="VALIDATED"
          />

          <div className="performance-grid">
            <PerformanceMetric label="R² score" value={MODEL_PERFORMANCE.r2.toFixed(6)} note="Variance explained" accent="green" />
            <PerformanceMetric label="MAE" value={`${formatNumber(MODEL_PERFORMANCE.mae, 2)} tCO₂e`} note="Mean absolute error" accent="amber" />
            <PerformanceMetric label="RMSE" value={`${formatNumber(MODEL_PERFORMANCE.rmse, 2)} tCO₂e`} note="Root mean squared error" accent="blue" />
            <PerformanceMetric label="sMAPE" value={`${MODEL_PERFORMANCE.smape.toFixed(2)}%`} note="Symmetric percentage error" accent="purple" />
          </div>

          <div className="validation-summary">
            <div><span>Training period</span><strong>{MODEL_PERFORMANCE.training}</strong></div>
            <div><span>Validation period</span><strong>{MODEL_PERFORMANCE.validation}</strong></div>
            <div><span>Validation records</span><strong>{formatNumber(MODEL_PERFORMANCE.records, 0)}</strong></div>
            <div><span>Estimator</span><strong>{analytics?.model?.estimators ?? 200}-tree Random Forest</strong></div>
          </div>

          <div className="performance-note">
            <span className="performance-note-icon">✓</span>
            <p>The model was trained on historical facility-year records and evaluated on 2023 data. These are the project’s reported held-out validation metrics.</p>
          </div>
        </div>
      </section>

    </>

  );



  const renderFacilities = () => (

    <>

      {renderHero()}



      <section className="workspace-grid">

        <div className="panel facility-search-panel">

          <PanelHeading

            kicker="FACILITY EXPLORER"

            title="Inspect a real reporting facility"

            subtitle="Use the same Facility ID and year you would use in the prediction workflow."

          />



          <div className="selection-grid">

            <div className="field">

              <label>Facility ID</label>

              <input

                type="number"

                min="1"

                value={facilityId}

                onChange={(event) => setFacilityId(event.target.value)}

              />

            </div>



            <div className="field">

              <label>Reporting year</label>

              <select

                value={year}

                onChange={(event) => setYear(event.target.value)}

              >

                {YEARS.map((availableYear) => (

                  <option key={`facility-${availableYear}`} value={availableYear}>

                    {availableYear}

                  </option>

                ))}

              </select>

            </div>

          </div>



          {facilityError && <div className="prediction-error">{facilityError}</div>}



          {facilityLoading ? (

            <div className="empty-state">

              <div className="spinner" />

              <strong>Loading facility profile…</strong>

              <p>Retrieving the real record from the project history.</p>

            </div>

          ) : facilityProfile ? (

            <div className="profile-grid">

              {profileFields.map(([key, value]) => (

                <div className="profile-card" key={`profile-${key}`}>

                  <span>{key.replaceAll("_", " ")}</span>

                  <strong>{String(value)}</strong>

                </div>

              ))}

            </div>

          ) : (

            <div className="empty-state">

              <div className="empty-icon">⌁</div>

              <strong>Choose a facility</strong>

              <p>Enter a valid Facility ID from the project dataset.</p>

            </div>

          )}

        </div>



        <div className="panel feature-panel">

          <PanelHeading

            kicker="FACILITY PREDICTION"

            title="Run the saved model"

            subtitle="Use the selected facility-year record without manually entering engineered features."

            badge="AI"

          />



          <div className="prediction-showcase compact">

            <span className="result-label">Current result</span>

            <strong>

              {prediction === null

                ? "—"

                : `${formatNumber(prediction)} tCO₂e`}

            </strong>

            <small>

              {predictionDetails?.facility?.name

                ? `${predictionDetails.facility.name} · ${predictionDetails.prediction_year}`

                : "No prediction generated yet."}

            </small>

          </div>



          <button className="button button-primary full-button" onClick={openPrediction}>

            Predict This Facility →

          </button>

        </div>

      </section>



      <section className="bottom-grid">

        <div className="panel insight-panel">

          <PanelHeading

            kicker="FACILITY CONTEXT"

            title="What this profile gives you"

            subtitle="A professional view of the exact record used by the ML system."

          />

          <div className="status-grid three">

            <div>

              <span>Profile</span>

              <strong>Location + NAICS + sector</strong>

            </div>

            <div>

              <span>History</span>

              <strong>Facility-year emissions</strong>

            </div>

            <div>

              <span>Inference</span>

              <strong>Random Forest estimate</strong>

            </div>

          </div>

        </div>



        <div className="panel project-status">

          <PanelHeading

            kicker="NEXT STEP"

            title="Predict this facility"

            subtitle="Use the same selected Facility ID and reporting year."

          />

          <button className="button button-secondary full-button" onClick={openPrediction}>

            Open Prediction Center →

          </button>

        </div>

      </section>

    </>

  );



  return (

    <div className="app">

      <video

        className="site-background-video"

        autoPlay

        muted

        loop

        playsInline

        preload="metadata"

        poster="/carbonai-earth-background-poster.jpg"

        aria-hidden="true"

      >

        <source

          src="/carbonai-earth-background-web-optimized.mp4"

          type="video/mp4"

        />

      </video>

      <div className="site-background-overlay" aria-hidden="true" />



      {/* Floating Luxury Dock Sidebar (Reference Match) */}
      <aside
        className={`floating-dock-sidebar ${sidebarCollapsed ? "dock-collapsed" : "dock-expanded"}`}
      >
        {/* Dock Header */}
        <div className="dock-header">
          <div className="dock-brand-group">
            <div className="dock-logo-mark">CO₂</div>
            {!sidebarCollapsed && (
              <div className="dock-brand-meta">
                <strong>CarbonAI</strong>
                <span>P_132 Petrochemical</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="dock-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Navigation Dock" : "Collapse Navigation Dock"}
            aria-label="Toggle Navigation Dock"
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Dock Nav Items List */}
        <nav className="dock-nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                className={`dock-nav-item ${isActive ? "active" : ""}`}
                type="button"
                onClick={() => navigate(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {/* Glowing Left Indicator Bar (Reference Match) */}
                {isActive && <span className="dock-active-glow-bar" />}

                <span className="dock-icon-box">
                  <SectionIcon id={item.id} className="dock-svg-icon" size={18} />
                </span>

                {!sidebarCollapsed && (
                  <span className="dock-item-label">{item.label}</span>
                )}

                {!sidebarCollapsed && item.badge && (
                  <span className="dock-item-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dock Footer Status Card */}
        <div className="dock-footer">
          <div className="dock-status-card" title="Random Forest Ensemble Model Online">
            <span className="dock-status-dot" />
            {!sidebarCollapsed && (
              <div className="dock-status-details">
                <strong>ML Engine Live</strong>
                <small>RF Champion · R² 0.9545</small>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main
        className={`main-content view-${activeView} ${
          sidebarCollapsed ? "main-collapsed-dock" : "main-expanded-dock"
        }`}
      >

        {dashboardError && (

          <div className="prediction-error page-alert">{dashboardError}</div>

        )}



        <div style={{ display: activeView === "dashboard" ? "block" : "none" }}>
          {visitedViews.has("dashboard") && renderDashboard()}
        </div>

        <div style={{ display: activeView === "explore" ? "block" : "none" }}>
          {visitedViews.has("explore") && <DataExplorerView apiBase={API_BASE} />}
        </div>

        <div style={{ display: activeView === "forecast" ? "block" : "none" }}>
          {visitedViews.has("forecast") && <ForecastingView apiBase={API_BASE} />}
        </div>

        <div style={{ display: activeView === "scenarios" ? "block" : "none" }}>
          {visitedViews.has("scenarios") && <ScenarioView apiBase={API_BASE} />}
        </div>

        <div style={{ display: activeView === "models" ? "block" : "none" }}>
          {visitedViews.has("models") && <ModelComparisonView apiBase={API_BASE} />}
        </div>

        <div style={{ display: activeView === "results" ? "block" : "none" }}>
          {visitedViews.has("results") && <ResultsView apiBase={API_BASE} />}
        </div>

        <div style={{ display: activeView === "predictions" ? "block" : "none" }}>
          {visitedViews.has("predictions") && renderPredictions()}
        </div>

        <div style={{ display: activeView === "analytics" ? "block" : "none" }}>
          {visitedViews.has("analytics") && renderAnalytics()}
        </div>

        <div style={{ display: activeView === "facilities" ? "block" : "none" }}>
          {visitedViews.has("facilities") && renderFacilities()}
        </div>



        <footer>CarbonAI · Carbon Emission Analysis Platform</footer>

      </main>



      {showPrediction && (

        <div

          className="prediction-modal"

          role="dialog"

          aria-modal="true"

          aria-labelledby="prediction-title"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) {

              setShowPrediction(false);

            }

          }}

        >

          <div className="prediction-modal-content">

            <div className="modal-header">

              <div>

                <p className="eyebrow">AI EMISSION PREDICTION</p>

                <h2 id="prediction-title">Facility Prediction</h2>

                <p>

                  Choose a real facility and reporting year. CarbonAI will

                  retrieve the historical ML features automatically.

                </p>

              </div>



              <button

                className="modal-close"

                type="button"

                onClick={() => setShowPrediction(false)}

                aria-label="Close prediction dialog"

              >

                ×

              </button>

            </div>



            <form onSubmit={runPrediction}>

              <div className="prediction-form">

                <div className="form-section-title">

                  <span>01</span>

                  <div>

                    <h3>Facility selection</h3>

                    <p>Only Facility ID + Year are required.</p>

                  </div>

                </div>



                <div className="field">

                  <label>Facility ID</label>

                  <input

                    type="number"

                    min="1"

                    value={facilityId}

                    onChange={(event) => setFacilityId(event.target.value)}

                    required

                  />

                </div>



                <div className="field">

                  <label>Prediction year</label>

                  <select

                    value={year}

                    onChange={(event) => setYear(event.target.value)}

                    required

                  >

                    {YEARS.map((availableYear) => (

                      <option key={`predict-${availableYear}`} value={availableYear}>

                        {availableYear}

                      </option>

                    ))}

                  </select>

                </div>



                <div className="form-section-title">

                  <span>02</span>

                  <div>

                    <h3>Automatic feature engineering</h3>

                    <p>

                      The backend retrieves facility profile data plus lagged

                      emissions, rolling averages, change and growth.

                    </p>

                  </div>

                </div>



                <div className="feature-strip">

                  <div>

                    <b>PROFILE</b>

                    <span>Location + industry + monitoring</span>

                  </div>

                  <div>

                    <b>HISTORY</b>

                    <span>7 engineered features</span>

                  </div>

                  <div>

                    <b>PIPELINE</b>

                    <span>Saved preprocessor + Random Forest</span>

                  </div>

                </div>

              </div>



              {predictionError && (

                <div className="prediction-error">{predictionError}</div>

              )}



              {predictionDetails && (

                <div className="prediction-success">

                  <span>Predicted Carbon Emission</span>

                  <strong>{formatNumber(prediction)} tCO₂e</strong>

                  <small>

                    {predictionDetails.facility?.name ||

                      `Facility ${predictionDetails.facility?.id || facilityId}`}

                    {predictionDetails.prediction_year

                      ? ` · ${predictionDetails.prediction_year}`

                      : ""}

                  </small>

                </div>

              )}



              {predictionDetails?.historical_features && (

                <div className="feature-modal-panel">

                  <div className="panel-heading">

                    <div>

                      <p className="panel-kicker">MODEL INPUTS</p>

                      <h2>Historical feature values</h2>

                    </div>

                    <span className="panel-chip accent">

                      {predictionDetails.available_history_features ?? 7} features

                    </span>

                  </div>



                  <div className="feature-list">

                    {Object.entries(predictionDetails.historical_features).map(

                      ([name, value]) => (

                        <div className="feature-item" key={name}>

                          <span>{name}</span>

                          <strong>

                            {value === null || value === undefined

                              ? "Unavailable"

                              : formatNumber(value, 4)}

                          </strong>

                        </div>

                      )

                    )}

                  </div>

                </div>

              )}



              {referenceComparison && (

                <div className="comparison-grid">

                  <div>

                    <span>Reference emission</span>

                    <strong>

                      {formatNumber(predictionDetails.reference_emission)} tCO₂e

                    </strong>

                  </div>

                  <div>

                    <span>Absolute difference</span>

                    <strong>

                      {formatNumber(referenceComparison.difference)} tCO₂e

                    </strong>

                  </div>

                  <div>

                    <span>Relative difference</span>

                    <strong>

                      {formatPercent(referenceComparison.percentage)}

                    </strong>

                  </div>

                </div>

              )}



              <div className="modal-actions">

                <button

                  type="button"

                  className="button button-secondary"

                  onClick={() => {

                    setShowPrediction(false);

                    setPredictionError("");

                  }}

                >

                  Close

                </button>

                <button

                  type="submit"

                  className="button button-primary"

                  disabled={predictionLoading}

                >

                  {predictionLoading ? "Analyzing facility…" : "Predict Emissions →"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}



function PanelHeading({ kicker, title, subtitle, chip, badge }) {

  return (

    <div className="panel-heading">

      <div>

        {kicker && <p className="panel-kicker">{kicker}</p>}

        <h2>{title}</h2>

        {subtitle && <p>{subtitle}</p>}

      </div>



      {(chip || badge) && (

        <span className={`panel-chip ${badge ? "accent" : ""}`}>

          {badge || chip}

        </span>

      )}

    </div>

  );

}



function StatCard({ label, value, unit, note, accent }) {

  return (

    <article className={`stat-card stat-${accent}`}>

      <span className="card-kicker">{label}</span>

      <strong>{value}</strong>

      <small>{unit}</small>

      <p>{note}</p>

      <span className="stat-spark" aria-hidden="true" />

    </article>

  );

}



function PredictionStep({ number, title, text }) {

  return (

    <div className="prediction-step">

      <b>{number}</b>

      <div>

        <strong>{title}</strong>

        <small>{text}</small>

      </div>

    </div>

  );

}



function PerformanceMetric({ label, value, note, accent }) {
  return (
    <article className={`performance-metric performance-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}


function StatusItem({ title, value }) {

  return (

    <div className="status-item">

      <span>{title}</span>

      <strong>{value}</strong>

    </div>

  );

}



export default App;
