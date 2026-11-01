import { useState, useEffect } from "react";

export default function ForecastingView({ apiBase = "http://127.0.0.1:8000" }) {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(10001);
  const [selectedModel, setSelectedModel] = useState("random_forest");
  const [horizonYears, setHorizonYears] = useState(3);
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Derived KPI trajectory metrics
  const historical = forecastData?.historical || [];
  const forecast = forecastData?.forecast || [];
  const lastHistorical = historical.length > 0 ? historical[historical.length - 1] : null;
  const targetForecast = forecast.length > 0 ? forecast[forecast.length - 1] : null;

  const trajectoryDiff =
    lastHistorical && targetForecast
      ? targetForecast.predicted_co2e - lastHistorical.co2e
      : 0;
  const trajectoryPct =
    lastHistorical && lastHistorical.co2e > 0
      ? (trajectoryDiff / lastHistorical.co2e) * 100
      : 0;

  const ciSpread =
    targetForecast && targetForecast.upper_ci && targetForecast.lower_ci
      ? (targetForecast.upper_ci - targetForecast.lower_ci) / 2
      : null;

  const downloadForecastCSV = () => {
    if (!forecastData || !forecastData.forecast) return;
    const header = [
      "Year",
      "Type",
      "CO2e_Tonnes",
      "Lower_CI_95",
      "Upper_CI_95",
      "Facility_ID",
      "Facility_Name",
      "Model",
    ];
    const histRows = (forecastData.historical || []).map((h) =>
      [
        h.year,
        "Historical_Measured",
        h.co2e,
        "",
        "",
        selectedFacility,
        `"${forecastData.facility_name || ""}"`,
        forecastData.model,
      ].join(",")
    );
    const foreRows = forecastData.forecast.map((f) =>
      [
        f.year,
        "Forward_Projection",
        f.predicted_co2e,
        f.lower_ci || "",
        f.upper_ci || "",
        selectedFacility,
        `"${forecastData.facility_name || ""}"`,
        forecastData.model,
      ].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [header.join(","), ...histRows, ...foreRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `emission_forecast_${selectedFacility}_${selectedModel}_${horizonYears}yr.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetch(`${apiBase}/api/facilities`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFacilities(data);
        if (data.length > 0) {
          setSelectedFacility(data[0].facility_id);
        }
      })
      .catch(() => {});
  }, [apiBase]);

  const runForecast = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility_id: parseInt(selectedFacility, 10),
          model: selectedModel,
          horizon_years: parseInt(horizonYears, 10),
        }),
      });
      if (!res.ok) {
        throw new Error("Forecast computation failed. Please verify API status.");
      }
      const data = await res.json();
      setForecastData(data);
    } catch (err) {
      setError(err.message || "Failed to generate forecast.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFacility) {
      runForecast();
    }
  }, [selectedFacility, selectedModel, horizonYears]);

  // SVG Chart rendering helpers
  const renderChart = () => {
    if (!forecastData) return null;

    const historical = forecastData.historical || [];
    const forecast = forecastData.forecast || [];
    if (historical.length === 0 && forecast.length === 0) return null;

    const allValues = [
      ...historical.map((h) => h.co2e),
      ...forecast.map((f) => f.predicted_co2e),
      ...forecast.map((f) => f.upper_ci || f.predicted_co2e),
      ...forecast.map((f) => f.lower_ci || f.predicted_co2e),
    ];
    const minVal = Math.min(...allValues) * 0.85;
    const maxVal = Math.max(...allValues) * 1.15;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 320;
    const padding = { top: 30, right: 40, bottom: 40, left: 70 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const totalPoints = historical.length + forecast.length;
    const getX = (idx) => padding.left + (idx / Math.max(1, totalPoints - 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

    // Historical line path
    let histPath = "";
    historical.forEach((h, i) => {
      const x = getX(i);
      const y = getY(h.co2e);
      histPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    // Forecast line path
    let forecastPath = "";
    if (historical.length > 0) {
      const lastHist = historical[historical.length - 1];
      const startX = getX(historical.length - 1);
      const startY = getY(lastHist.co2e);
      forecastPath = `M ${startX} ${startY}`;
      forecast.forEach((f, i) => {
        const x = getX(historical.length + i);
        const y = getY(f.predicted_co2e);
        forecastPath += ` L ${x} ${y}`;
      });
    }

    // Confidence Interval Area
    let ciArea = "";
    if (forecast.length > 0 && forecast[0].upper_ci) {
      const startIdx = historical.length;
      let topCurve = "";
      let bottomCurve = "";
      forecast.forEach((f, i) => {
        const x = getX(startIdx + i);
        const yTop = getY(f.upper_ci);
        const yBot = getY(f.lower_ci);
        topCurve += i === 0 ? `M ${x} ${yTop}` : ` L ${x} ${yTop}`;
        bottomCurve = ` L ${x} ${yBot}` + bottomCurve;
      });
      ciArea = topCurve + bottomCurve + " Z";
    }

    return (
      <div className="forecast-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="forecast-svg">
          <defs>
            <linearGradient id="forecastLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="ciAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(129, 140, 248, 0.3)" />
              <stop offset="100%" stopColor="rgba(129, 140, 248, 0.05)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + chartH * (1 - pct);
            const val = minVal + range * pct;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {(val / 1000).toFixed(0)}k t
                </text>
              </g>
            );
          })}

          {/* Vertical Tracking Guideline on Hover */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={height - padding.bottom}
              stroke="rgba(56, 189, 248, 0.45)"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
          )}

          {/* Confidence interval shaded area */}
          {ciArea && <path d={ciArea} fill="url(#ciAreaGrad)" />}

          {/* Historical line */}
          {histPath && (
            <path
              d={histPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Forecast dashed line */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="url(#forecastLineGrad)"
              strokeWidth="2.8"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}

          {/* Historical point markers */}
          {historical.map((h, i) => {
            const x = getX(i);
            const y = getY(h.co2e);
            const isHovered = hoveredPoint && hoveredPoint.year === h.year;
            return (
              <g key={`hist-${i}`}>
                {isHovered && (
                  <circle cx={x} cy={y} r="10" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.6" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6.5 : 4.5}
                  fill="#10b981"
                  stroke="#0f172a"
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={() =>
                    setHoveredPoint({
                      type: "Historical Record (EPA Measured)",
                      year: h.year,
                      val: h.co2e,
                      prevVal: i > 0 ? historical[i - 1].co2e : null,
                      x,
                      y,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill={isHovered ? "#34d399" : "rgba(255, 255, 255, 0.6)"}
                  fontSize="11"
                  fontWeight={isHovered ? "700" : "400"}
                  textAnchor="middle"
                >
                  {h.year}
                </text>
              </g>
            );
          })}

          {/* Forecast point markers */}
          {forecast.map((f, i) => {
            const x = getX(historical.length + i);
            const y = getY(f.predicted_co2e);
            const isHovered = hoveredPoint && hoveredPoint.year === f.year;
            const prevVal =
              i === 0
                ? (historical.length > 0 ? historical[historical.length - 1].co2e : null)
                : forecast[i - 1].predicted_co2e;
            return (
              <g key={`fore-${i}`}>
                {isHovered && (
                  <circle cx={x} cy={y} r="12" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7.5 : 5.5}
                  fill="#818cf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={() =>
                    setHoveredPoint({
                      type: `Forecast Projection (${forecastData.model})`,
                      year: f.year,
                      val: f.predicted_co2e,
                      lower: f.lower_ci,
                      upper: f.upper_ci,
                      prevVal,
                      x,
                      y,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill={isHovered ? "#38bdf8" : "#818cf8"}
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {f.year}*
                </text>
                <text
                  x={x}
                  y={y - 12}
                  fill="#c7d2fe"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {(f.predicted_co2e / 1000).toFixed(0)}k t
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Interactive Data Point Inspector */}
        {hoveredPoint && (
          <div
            className="chart-floating-inspector animate-fade-in"
            style={{
              position: "absolute",
              left: `${Math.min(width - 230, Math.max(15, hoveredPoint.x - 100))}px`,
              top: `${Math.max(10, hoveredPoint.y - 88)}px`,
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            <div className="inspector-pill-badge">{hoveredPoint.type}</div>
            <div className="inspector-value-line">
              <strong>Year {hoveredPoint.year}:</strong>{" "}
              <span className="font-mono text-cyan">{hoveredPoint.val?.toLocaleString()} t CO₂e</span>
            </div>
            {hoveredPoint.prevVal && (
              <div className="inspector-delta-line">
                <span>YoY Shift:</span>{" "}
                <strong className={hoveredPoint.val <= hoveredPoint.prevVal ? "text-emerald" : "text-amber"}>
                  {hoveredPoint.val > hoveredPoint.prevVal ? "+" : ""}
                  {(((hoveredPoint.val - hoveredPoint.prevVal) / hoveredPoint.prevVal) * 100).toFixed(1)}%
                </strong>
              </div>
            )}
            {hoveredPoint.upper && (
              <div className="inspector-ci-line text-muted">
                95% CI: [{(hoveredPoint.lower / 1000).toFixed(0)}k – {(hoveredPoint.upper / 1000).toFixed(0)}k t]
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="chart-legend-row">
          <div className="legend-item">
            <span className="legend-dot bg-emerald"></span>
            <span>Historical Reported Emissions (EPA Measured)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot bg-indigo-dashed"></span>
            <span>Model Projection ({forecastData.model})</span>
          </div>
          {forecast.length > 0 && forecast[0].upper_ci && (
            <div className="legend-item">
              <span className="legend-dot bg-indigo-shade"></span>
              <span>95% Confidence Interval (Bayesian/ARIMA Bounds)</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="forecasting-view-container animate-fade-in">
      {/* Banner */}
      <div className="section-head-banner">
        <div className="banner-badge">SYSTEM SPECIFICATION: FORECASTING ENGINE</div>
        <h2>Multi-Model Time-Series & Regression Forecasting</h2>
        <p>
          Generate forward-looking emission trajectories using Statistical Time-Series (ARIMA/SARIMA),
          Decomposition Models (Meta Prophet), or Machine Learning Ensembles (Random Forest).
        </p>
      </div>

      {/* Control Panel Card */}
      <div className="glass-card controls-card">
        <div className="controls-grid">
          {/* Facility Picker */}
          <div className="control-group">
            <label className="control-label">Target Petrochemical Facility</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="select-input select-styled"
            >
              {facilities.map((fac) => (
                <option key={fac.facility_id} value={fac.facility_id}>
                  {fac.facility_name} ({fac.location})
                </option>
              ))}
            </select>
          </div>

          {/* Model Selector */}
          <div className="control-group">
            <label className="control-label">Forecasting Algorithm</label>
            <div className="model-pill-group">
              {[
                { id: "random_forest", label: "Random Forest", badge: "R²=0.955" },
                { id: "prophet", label: "Meta Prophet", badge: "Bayesian CI" },
                { id: "arima", label: "ARIMA(1,1,0)", badge: "ADF Tested" },
                { id: "ridge", label: "Ridge (L2)", badge: "Regularized" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`model-pill-btn ${selectedModel === m.id ? "active" : ""}`}
                  onClick={() => setSelectedModel(m.id)}
                >
                  <span className="model-name">{m.label}</span>
                  <span className="model-badge">{m.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Horizon Slider */}
          <div className="control-group">
            <div className="slider-header">
              <label className="control-label">Forecast Horizon & Target Year</label>
              <span className="slider-value-pill">{horizonYears} Yrs Forward → Target Year {2023 + Number(horizonYears)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="range-slider"
            />
            <div className="slider-ticks">
              <span>2024</span>
              <span>2026</span>
              <span>2027</span>
              <span>2028</span>
              <span>2030 (Net-Zero)</span>
              <span>2033</span>
            </div>

            {/* Quick Future Year Buttons */}
            <div className="quick-year-buttons" style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem" }}>
              {[
                { yr: 2026, h: 3 },
                { yr: 2027, h: 4 },
                { yr: 2028, h: 5 },
                { yr: 2030, h: 7 },
              ].map((item) => (
                <button
                  key={item.yr}
                  type="button"
                  className={`preset-btn ${Number(horizonYears) === item.h ? "active" : ""}`}
                  style={{ padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
                  onClick={() => setHorizonYears(item.h)}
                >
                  Year {item.yr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Forecast Result Card */}
      <div className="glass-card chart-card">
        <div className="card-header-line">
          <div className="card-title-group">
            <span className="card-icon">📈</span>
            <div>
              <h3>
                {forecastData?.facility_name || "Facility"} — Emission Projection
              </h3>
              <span className="subhead-meta">
                Methodology: {forecastData?.model || "Model"} | Horizon: {horizonYears} Years ahead
              </span>
            </div>
          </div>
          <div className="chart-header-actions" style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            {forecastData?.forecast && (
              <button
                type="button"
                className="btn-toolbar"
                onClick={downloadForecastCSV}
                title="Download complete projection series as CSV"
              >
                💾 Export Forecast CSV
              </button>
            )}
            {isLoading && <span className="loading-spinner-pill">Computing Projections...</span>}
          </div>
        </div>

        {error && <div className="prediction-error">{error}</div>}

        {/* Executive KPI Summary Strip */}
        {forecastData && (
          <div className="forecast-kpi-grid">
            <div className="forecast-kpi-item">
              <span className="forecast-kpi-label">Reported Baseline (2023)</span>
              <strong className="forecast-kpi-val text-emerald font-mono">
                {lastHistorical ? `${(lastHistorical.co2e / 1000).toFixed(1)}k t` : "—"}
              </strong>
              <span className="forecast-kpi-sub">EPA Verified Benchmark</span>
            </div>

            <div className="forecast-kpi-item">
              <span className="forecast-kpi-label">Projected Target ({targetForecast?.year})</span>
              <strong className="forecast-kpi-val text-cyan font-mono">
                {targetForecast ? `${(targetForecast.predicted_co2e / 1000).toFixed(1)}k t` : "—"}
              </strong>
              <span className="forecast-kpi-sub">{horizonYears}-Year Forward Window</span>
            </div>

            <div className="forecast-kpi-item">
              <span className="forecast-kpi-label">Projected Trajectory</span>
              <strong className={`forecast-kpi-val font-mono ${trajectoryPct <= 0 ? "text-emerald" : "text-amber"}`}>
                {trajectoryPct > 0 ? "+" : ""}{trajectoryPct.toFixed(1)}%
              </strong>
              <span className="forecast-kpi-sub">
                {trajectoryPct <= 0 ? "Decarbonizing Pathway" : "Operational Ramp"}
              </span>
            </div>

            <div className="forecast-kpi-item">
              <span className="forecast-kpi-label">95% Uncertainty Window</span>
              <strong className="forecast-kpi-val text-indigo font-mono">
                {ciSpread ? `± ${(ciSpread / 1000).toFixed(1)}k t` : "Deterministic"}
              </strong>
              <span className="forecast-kpi-sub">Confidence Margin</span>
            </div>
          </div>
        )}

        {renderChart()}

        {/* Projection Data Table */}
        {forecastData?.forecast && (
          <div className="forecast-points-table-wrap">
            <table className="enterprise-table mini-table">
              <thead>
                <tr>
                  <th>Target Year</th>
                  <th>Predicted CO₂e (Tonnes)</th>
                  <th>95% Lower Bound</th>
                  <th>95% Upper Bound</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.forecast.map((pt, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-indigo">{pt.year}</td>
                    <td className="font-mono font-bold">{pt.predicted_co2e?.toLocaleString()} t</td>
                    <td className="text-muted font-mono">{pt.lower_ci ? `${pt.lower_ci?.toLocaleString()} t` : "—"}</td>
                    <td className="text-muted font-mono">{pt.upper_ci ? `${pt.upper_ci?.toLocaleString()} t` : "—"}</td>
                    <td>
                      <span className="badge-pill bg-indigo-subtle">Forward Projection</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Academic Methodology Card */}
      <div className="glass-card methodology-card">
        <h4>Academic Methodology & Statistical Rigor</h4>
        <div className="methodology-grid">
          <div className="method-col">
            <strong>Stationarity & Differencing</strong>
            <p>
              Augmented Dickey-Fuller (ADF) hypothesis test applied to historical emission series.
              Series differenced at d=1 to eliminate trend variance prior to ARIMA parameter fitting.
            </p>
          </div>
          <div className="method-col">
            <strong>Ensemble Lag Memory</strong>
            <p>
              Random Forest regressor employs multi-lag state vectors (Lag 1, Lag 2, Lag 3, Rolling Avg 3/5)
              updated autoregressively across each projection step.
            </p>
          </div>
          <div className="method-col">
            <strong>Uncertainty Quantification</strong>
            <p>
              Prophet and ARIMA models provide 95% Bayesian and standard error confidence bands,
              capturing macro market volatility and operational uncertainty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

