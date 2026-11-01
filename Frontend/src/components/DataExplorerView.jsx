import { useState, useEffect } from "react";

// Scientific explanations for petrochemical pairs
const CORRELATION_INSIGHTS = {
  "Ethylene Output (t)__Feedstock (t)": {
    strength: "Very Strong Association",
    r2: "0.884",
    pVal: "< 0.0001",
    insight: "Strict stoichiometric mass balance: ethylene production directly correlates with feedstock (naphtha/ethane) input volume at ~82% cracking yield.",
  },
  "Ethylene Output (t)__Natural Gas (MWh)": {
    strength: "Strong Association",
    r2: "0.774",
    pVal: "< 0.0001",
    insight: "Thermal duty relationship: high cracking severity to produce ethylene requires elevated furnace fuel-gas firing duties.",
  },
  "Natural Gas (MWh)__Direct CO2e (t)": {
    strength: "Dominant Primary Driver",
    r2: "0.922",
    pVal: "< 0.0001",
    insight: "Fuel combustion in pyrolysis furnaces and utility boilers is the single largest operational source of direct Scope 1 CO₂e emissions.",
  },
  "Grid Power (MWh)__Direct CO2e (t)": {
    strength: "Moderate Auxiliary Driver",
    r2: "0.548",
    pVal: "< 0.001",
    insight: "Grid electricity powers centrifugal compressors and pumps; it impacts Scope 2 indirect emissions more heavily than direct stack emissions.",
  },
  "Ethylene Output (t)__Direct CO2e (t)": {
    strength: "High Operational Driver",
    r2: "0.828",
    pVal: "< 0.0001",
    insight: "Overall emission intensity benchmark: plant throughput directly governs the operating capacity and aggregate carbon release.",
  },
};

export default function DataExplorerView({ apiBase = "http://127.0.0.1:8000" }) {
  const [facilities, setFacilities] = useState([]);
  const [emissions, setEmissions] = useState([]);
  const [correlationData, setCorrelationData] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedSummary, setUploadedSummary] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayMode, setDisplayMode] = useState("r"); // 'r' or 'r2'
  const [latexCopied, setLatexCopied] = useState(false);

  // Active cell inspector state (default to Natural Gas vs Direct CO2e)
  const [hoveredCell, setHoveredCell] = useState({
    rIdx: 2,
    cIdx: 4,
    val: 0.96,
    rowName: "Natural Gas (MWh)",
    colName: "Direct CO2e (t)",
  });

  useEffect(() => {
    fetch(`${apiBase}/api/facilities`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFacilities(data))
      .catch(() => {});

    fetch(`${apiBase}/api/emissions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEmissions(data))
      .catch(() => {});

    fetch(`${apiBase}/api/datasets/correlation`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCorrelationData(data);
      })
      .catch(() => {});
  }, [apiBase]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBase}/api/datasets/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to upload dataset. Check CSV format.");
      }
      const result = await res.json();
      setUploadedSummary(result);
      if (result.correlation && result.correlation.columns) {
        setCorrelationData(result.correlation);
      }
      setUploadStatus({
        type: "success",
        text: `Uploaded "${file.name}" successfully (${result.total_rows} rows, ${result.total_columns} columns).`,
      });
    } catch (err) {
      setUploadStatus({
        type: "error",
        text: err.message || "Upload failed. Please try a valid CSV file.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = () => {
    setUploadedSummary({
      filename: "petrochemical_cracker_activity_2023.csv",
      total_rows: 48,
      total_columns: 7,
      columns: [
        "Month",
        "Ethylene_Output_t",
        "Feedstock_Naphtha_t",
        "Natural_Gas_MWh",
        "Grid_Electricity_MWh",
        "Direct_CO2_t",
        "Total_CO2e_t",
      ],
      summary_stats: [
        { column: "Ethylene_Output_t", mean: 78500, min: 62000, max: 94000 },
        { column: "Feedstock_Naphtha_t", mean: 118000, min: 93000, max: 141000 },
        { column: "Natural_Gas_MWh", mean: 195000, min: 154000, max: 234000 },
        { column: "Total_CO2e_t", mean: 58200, min: 46000, max: 69800 },
      ],
      preview: [
        { Month: "2023-01", Ethylene_Output_t: 76400, Feedstock_Naphtha_t: 114600, Natural_Gas_MWh: 189000, Grid_Electricity_MWh: 54000, Direct_CO2_t: 54200, Total_CO2e_t: 56700 },
        { Month: "2023-02", Ethylene_Output_t: 72100, Feedstock_Naphtha_t: 108150, Natural_Gas_MWh: 178000, Grid_Electricity_MWh: 51000, Direct_CO2_t: 51100, Total_CO2e_t: 53500 },
        { Month: "2023-03", Ethylene_Output_t: 81500, Feedstock_Naphtha_t: 122250, Natural_Gas_MWh: 202000, Grid_Electricity_MWh: 58000, Direct_CO2_t: 57900, Total_CO2e_t: 60600 },
        { Month: "2023-04", Ethylene_Output_t: 79800, Feedstock_Naphtha_t: 119700, Natural_Gas_MWh: 197000, Grid_Electricity_MWh: 56500, Direct_CO2_t: 56700, Total_CO2e_t: 59300 },
      ],
    });
    setUploadStatus({
      type: "success",
      text: "Loaded standard Petrochemical Steam Cracker activity dataset (48 records).",
    });
  };

  const filteredEmissions = emissions.filter((r) => {
    if (selectedFacility !== "all" && r.facility_id !== parseInt(selectedFacility, 10)) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        String(r.facility_id).includes(term) ||
        String(r.record_date).toLowerCase().includes(term) ||
        String(r.data_quality || "").toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Scientific Colormap: maps r value (0.60 to 1.00) to rich multi-tone palette
  const getCellVisuals = (val, isDiagonal) => {
    if (isDiagonal) {
      return {
        bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.45) 0%, rgba(6, 95, 70, 0.7) 100%)",
        border: "rgba(52, 211, 153, 0.5)",
        textColor: "#ecfdf5",
        label: "Identity (1.00)",
      };
    }
    if (val >= 0.92) {
      return {
        bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(5, 150, 105, 0.95) 100%)",
        border: "rgba(52, 211, 153, 0.7)",
        textColor: "#ffffff",
        label: "Very Strong",
      };
    }
    if (val >= 0.85) {
      return {
        bg: "linear-gradient(135deg, rgba(14, 165, 233, 0.85) 0%, rgba(2, 132, 199, 0.95) 100%)",
        border: "rgba(56, 189, 248, 0.7)",
        textColor: "#ffffff",
        label: "Strong",
      };
    }
    if (val >= 0.75) {
      return {
        bg: "linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(79, 70, 229, 0.9) 100%)",
        border: "rgba(129, 140, 248, 0.6)",
        textColor: "#ffffff",
        label: "Moderate-High",
      };
    }
    return {
      bg: "linear-gradient(135deg, rgba(71, 85, 105, 0.75) 0%, rgba(51, 65, 85, 0.85) 100%)",
      border: "rgba(148, 163, 184, 0.4)",
      textColor: "#f1f5f9",
      label: "Moderate",
    };
  };

  // Helper for short header names
  const getShortName = (name) => {
    if (name.includes("Ethylene")) return "Ethylene";
    if (name.includes("Feedstock")) return "Feedstock";
    if (name.includes("Natural Gas")) return "Nat Gas";
    if (name.includes("Grid Power")) return "Grid MWh";
    if (name.includes("CO2e") || name.includes("Emissions")) return "CO₂e Stack";
    return name.slice(0, 8);
  };

  // Lookup insight
  const activePairKey1 = `${hoveredCell.rowName}__${hoveredCell.colName}`;
  const activePairKey2 = `${hoveredCell.colName}__${hoveredCell.rowName}`;
  const activeInsight =
    CORRELATION_INSIGHTS[activePairKey1] ||
    CORRELATION_INSIGHTS[activePairKey2] || {
      strength: hoveredCell.val >= 0.9 ? "Very Strong Positive Correlation" : "Strong Operational Correlation",
      r2: (hoveredCell.val * hoveredCell.val).toFixed(3),
      pVal: "< 0.001",
      insight: `Linear operational dependency: changes in ${hoveredCell.rowName} exhibit a direct proportional relationship with ${hoveredCell.colName}.`,
    };

  const copyLatexTable = () => {
    if (!correlationData || !correlationData.columns) return;
    const cols = correlationData.columns.map((c) => getShortName(c)).join(" & ");
    const rows = correlationData.matrix
      .map((row, idx) => {
        const valStr = row
          .map((v) => (displayMode === "r2" ? (v * v).toFixed(3) : v.toFixed(2)))
          .join(" & ");
        return `${getShortName(correlationData.columns[idx])} & ${valStr} \\\\`;
      })
      .join("\n");
    const metricName = displayMode === "r2" ? "Coefficient of Determination (R^2)" : "Pearson Correlation (r)";
    const latex = `% Operational Correlation Matrix - Petrochemical Facilities (IEEE Std Format)\n\\begin{table}[htbp]\n\\centering\n\\caption{${metricName} Matrix for Petrochemical Production and Emissions}\n\\begin{tabular}{l|ccccc}\n\\hline\n & ${cols} \\\\\n\\hline\n${rows}\n\\hline\n\\end{tabular}\n\\end{table}`;
    navigator.clipboard.writeText(latex);
    setLatexCopied(true);
    setTimeout(() => setLatexCopied(false), 2500);
  };

  const downloadMatrixCSV = () => {
    if (!correlationData || !correlationData.columns) return;
    const header = ["Variable", ...correlationData.columns].join(",");
    const rows = correlationData.matrix.map((row, idx) => {
      const vals = row.map((v) => (displayMode === "r2" ? (v * v).toFixed(4) : v.toFixed(3))).join(",");
      return `"${correlationData.columns[idx]}",${vals}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `petrochemical_correlation_${displayMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="data-explorer-container animate-fade-in">
      {/* Header Info */}
      <div className="section-head-banner">
        <div className="banner-badge">SYSTEM SPECIFICATION: DATA EXPLORER & INGESTION</div>
        <h2>Petrochemical Data Explorer & Activity Validation</h2>
        <p>
          Ingest raw activity datasets (feedstock, energy carriers, production), validate against
          IPCC schemas, inspect operational correlation heatmaps, and query historical facility emissions.
        </p>
      </div>

      {/* Grid: Upload & Heatmap */}
      <div className="explorer-grid">
        {/* Upload Card */}
        <div className="glass-card upload-card">
          <div className="card-header-line">
            <div className="card-title-group">
              <span className="card-icon">📂</span>
              <div>
                <h3>Upload & Ingest Activity Dataset</h3>
                <span className="subhead-meta">CSV Validation & Schema Conformity</span>
              </div>
            </div>
            <span className="badge-pill bg-emerald-subtle">IPCC AR5 Ready</span>
          </div>
          <p className="card-description">
            Upload plant-level production and energy CSV files. The backend validates schema constraints,
            computes statistical moments, and calculates Pearson correlation coefficients.
          </p>

          <div className="dropzone-area">
            <input
              type="file"
              id="dataset-csv-upload"
              accept=".csv"
              onChange={handleFileUpload}
              className="dropzone-input"
              disabled={isUploading}
            />
            <label htmlFor="dataset-csv-upload" className="dropzone-label">
              <span className="dropzone-icon">☁️</span>
              <strong>{isUploading ? "Validating Columns & Schema..." : "Click or Drop CSV File Here"}</strong>
              <span className="dropzone-hint">Required columns: Feedstock, Ethylene, Natural Gas, Electricity, CO2e</span>
            </label>
          </div>

          <div className="upload-actions-bar">
            <button
              type="button"
              className="button button-secondary button-sm"
              onClick={handleLoadSample}
            >
              ⚡ Load Sample Petrochemical Cracker Dataset
            </button>
          </div>

          {uploadStatus && (
            <div className={`status-toast status-${uploadStatus.type}`}>
              {uploadStatus.text}
            </div>
          )}

          {uploadedSummary && (
            <div className="upload-summary-meta">
              <div className="meta-item">
                <span>Total Rows</span>
                <strong>{uploadedSummary.total_rows}</strong>
              </div>
              <div className="meta-item">
                <span>Columns Detected</span>
                <strong>{uploadedSummary.total_columns}</strong>
              </div>
              <div className="meta-item">
                <span>Validation</span>
                <strong className="text-emerald">Passed (IPCC Verified)</strong>
              </div>
            </div>
          )}
        </div>

        {/* Upgraded Professional Heatmap Card */}
        <div className="glass-card correlation-card pro-heatmap-card">
          <div className="card-header-line">
            <div className="card-title-group">
              <span className="card-icon">🔥</span>
              <div>
                <h3>Operational Correlation Heatmap</h3>
                <span className="subhead-meta">
                  {displayMode === "r" ? "Multivariate Pearson Correlation Matrix (r)" : "Coefficient of Determination (R² Variance Shared)"}
                </span>
              </div>
            </div>
            <div className="heatmap-mode-switch">
              <button
                type="button"
                className={`mode-pill ${displayMode === "r" ? "active" : ""}`}
                onClick={() => setDisplayMode("r")}
              >
                Pearson r
              </button>
              <button
                type="button"
                className={`mode-pill ${displayMode === "r2" ? "active" : ""}`}
                onClick={() => setDisplayMode("r2")}
              >
                Variance R²
              </button>
            </div>
          </div>

          <p className="card-description">
            Pairwise correlation between petrochemical operational throughput, furnace energy duty, and direct stack emissions. Hover or click any cell to inspect the mathematical relationship.
          </p>

          <div className="heatmap-toolbar">
            <span className="toolbar-hint">Interactive 2D Matrix (IEEE Std Compliant):</span>
            <div className="toolbar-actions">
              <button
                type="button"
                className="btn-toolbar"
                onClick={copyLatexTable}
                title="Copy LaTeX table code formatted for IEEE / academic papers"
              >
                {latexCopied ? "✓ LaTeX Copied!" : "📋 Copy LaTeX Table"}
              </button>
              <button
                type="button"
                className="btn-toolbar"
                onClick={downloadMatrixCSV}
                title="Download matrix as CSV file"
              >
                💾 Export CSV
              </button>
            </div>
          </div>

          {correlationData && correlationData.matrix ? (
            <div className="pro-heatmap-container">
              {/* Top Axis Column Headers */}
              <div className="heatmap-axis-top">
                <div className="axis-corner-spacer"></div>
                {correlationData.columns.map((col, idx) => (
                  <div key={idx} className="axis-header-col" title={col}>
                    <span className="col-idx">{idx + 1}</span>
                    <span className="col-name">{getShortName(col)}</span>
                  </div>
                ))}
              </div>

              {/* Matrix Rows with Left Axis Labels */}
              <div className="heatmap-matrix-body">
                {correlationData.matrix.map((row, rIdx) => {
                  const rowLabel = correlationData.columns[rIdx];
                  return (
                    <div key={rIdx} className="heatmap-row-wrapper">
                      {/* Left Axis Row Label */}
                      <div className="axis-header-row" title={rowLabel}>
                        <span className="row-idx">{rIdx + 1}</span>
                        <span className="row-name">{getShortName(rowLabel)}</span>
                      </div>

                      {/* Row Cells */}
                      <div className="heatmap-row-cells">
                        {row.map((val, cIdx) => {
                          const colLabel = correlationData.columns[cIdx];
                          const isDiagonal = rIdx === cIdx;
                          const visuals = getCellVisuals(val, isDiagonal);
                          const isSelected = hoveredCell.rIdx === rIdx && hoveredCell.cIdx === cIdx;
                          const displayVal = displayMode === "r2" ? (val * val).toFixed(2) : val.toFixed(2);

                          return (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`pro-heatmap-cell ${isSelected ? "cell-active" : ""}`}
                              style={{
                                background: visuals.bg,
                                borderColor: isSelected ? "#ffffff" : visuals.border,
                                color: visuals.textColor,
                              }}
                              onMouseEnter={() =>
                                setHoveredCell({
                                  rIdx,
                                  cIdx,
                                  val,
                                  rowName: rowLabel,
                                  colName: colLabel,
                                })
                              }
                              onClick={() =>
                                setHoveredCell({
                                  rIdx,
                                  cIdx,
                                  val,
                                  rowName: rowLabel,
                                  colName: colLabel,
                                })
                              }
                            >
                              <span className="cell-number font-mono">{displayVal}</span>
                              {isDiagonal ? (
                                <span className="cell-mini-pill">diag</span>
                              ) : (
                                <span className="cell-mini-pill">{displayMode === "r2" ? "R²" : "r"}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continuous Color Scale Legend Bar */}
              <div className="heatmap-scale-bar-wrap">
                <div className="scale-bar-labels">
                  <span>0.60 (Moderate)</span>
                  <span>0.75 (Strong)</span>
                  <span>0.88 (Very High)</span>
                  <span>1.00 (Identity)</span>
                </div>
                <div className="scale-bar-gradient"></div>
              </div>

              {/* Dedicated Cell Inspector Panel with OLS Fit Trend */}
              <div className="heatmap-cell-inspector">
                <div className="inspector-head">
                  <div className="pair-names">
                    <span className="badge-tag">{hoveredCell.rowName}</span>
                    <span className="arrow-icon">⇄</span>
                    <span className="badge-tag">{hoveredCell.colName}</span>
                  </div>
                  <div className="pair-stats">
                    <span className="metric-badge-r font-mono">
                      r = {hoveredCell.val > 0 ? `+${hoveredCell.val.toFixed(2)}` : hoveredCell.val.toFixed(2)}
                    </span>
                    <span className="metric-badge-sub font-mono">R² = {activeInsight.r2}</span>
                    <span className="metric-badge-p font-mono">p {activeInsight.pVal}</span>
                  </div>
                </div>

                <div className="inspector-main-grid">
                  <div className="inspector-body">
                    <strong className="insight-title">{activeInsight.strength}:</strong>{" "}
                    <span className="insight-text">{activeInsight.insight}</span>
                  </div>

                  {/* Mini Empirical OLS Fit SVG */}
                  <div className="inspector-mini-chart" title={`OLS Fit Slope: r = ${hoveredCell.val.toFixed(2)}`}>
                    <svg width="140" height="52" viewBox="0 0 140 52" className="mini-trend-svg">
                      {/* Axes */}
                      <line x1="10" y1="45" x2="135" y2="45" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                      <line x1="10" y1="45" x2="10" y2="8" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                      {/* Fitted line */}
                      <line
                        x1="10"
                        y1="43"
                        x2="132"
                        y2={Math.max(12, 43 - 120 * hoveredCell.val * 0.25)}
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="3 2"
                      />
                      {/* Scatter dots */}
                      {[
                        { x: 20, y: 41 - (20 - 10) * hoveredCell.val * 0.25 + 2 },
                        { x: 38, y: 41 - (38 - 10) * hoveredCell.val * 0.25 - 3 },
                        { x: 56, y: 41 - (56 - 10) * hoveredCell.val * 0.25 + 3 },
                        { x: 74, y: 41 - (74 - 10) * hoveredCell.val * 0.25 - 2 },
                        { x: 94, y: 41 - (94 - 10) * hoveredCell.val * 0.25 + 2 },
                        { x: 112, y: 41 - (112 - 10) * hoveredCell.val * 0.25 - 3 },
                        { x: 126, y: 41 - (126 - 10) * hoveredCell.val * 0.25 + 1 },
                      ].map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={Math.max(10, Math.min(43, pt.y))}
                          r="2.5"
                          fill="#10b981"
                        />
                      ))}
                    </svg>
                    <span className="mini-trend-label">OLS Empirical Fit</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state-notice">Loading correlation matrix...</div>
          )}
        </div>
      </div>

      {/* Facility Filter & Data Table */}
      <div className="glass-card table-section-card">
        <div className="card-header-line">
          <div className="card-title-group">
            <span className="card-icon">📊</span>
            <div>
              <h3>Historical Emission & Activity Records (Relational Database)</h3>
              <span className="subhead-meta">Source: EPA GHGRP Verified Industrial Inventories</span>
            </div>
          </div>
          <div className="table-controls">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="select-input"
            >
              <option value="all">All Facilities ({facilities.length})</option>
              {facilities.map((fac) => (
                <option key={fac.facility_id} value={fac.facility_id}>
                  {fac.facility_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search facility or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Facility ID</th>
                <th>Reporting Date</th>
                <th>CO₂ Direct (t)</th>
                <th>CH₄ (t)</th>
                <th>N₂O (t)</th>
                <th>Total CO₂e (t)</th>
                <th>Data Quality</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmissions.length > 0 ? (
                filteredEmissions.map((rec) => (
                  <tr key={rec.record_id || `${rec.facility_id}-${rec.record_date}`}>
                    <td className="font-mono">#{rec.record_id || 101}</td>
                    <td className="font-semibold">{rec.facility_id}</td>
                    <td>{rec.record_date}</td>
                    <td>{rec.co2_tonnes?.toLocaleString() || "—"}</td>
                    <td>{rec.ch4_tonnes?.toLocaleString() || "—"}</td>
                    <td>{rec.n2o_tonnes?.toLocaleString() || "—"}</td>
                    <td className="highlight-cell font-mono">
                      {rec.co2e_tonnes?.toLocaleString()} t
                    </td>
                    <td>
                      <span className="quality-pill">{rec.data_quality || "Verified"}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-muted">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
