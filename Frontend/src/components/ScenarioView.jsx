import { useState, useEffect } from "react";

export default function ScenarioView({ apiBase = "http://127.0.0.1:8000" }) {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(10001);
  const [renewableShare, setRenewableShare] = useState(20);
  const [displacedFuel, setDisplacedFuel] = useState("grid_electricity");
  const [simulation, setSimulation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredTrajPoint, setHoveredTrajPoint] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/api/facilities`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFacilities(data);
        if (data.length > 0) setSelectedFacility(data[0].facility_id);
      })
      .catch(() => {});
  }, [apiBase]);

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const selectedFac = facilities.find((f) => f.facility_id === parseInt(selectedFacility, 10));
      const capacity = selectedFac ? selectedFac.capacity_tpa : 2500000;
      const baseEmissions = capacity * 0.45;
      const energyMwh = capacity * 2.8;

      const res = await fetch(`${apiBase}/api/scenarios/1/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseline_co2e: baseEmissions,
          total_energy_mwh: energyMwh,
          renewable_share_pct: parseFloat(renewableShare),
          displaced_fuel: displacedFuel,
          carbon_tax_rate: 50.0,
          horizon_years: 5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulation(data);
      }
    } catch {
      // Fallback calculation if offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [selectedFacility, renewableShare, displacedFuel]);

  // Visual SVG Pathway Curve
  const renderTrajectoryChart = () => {
    if (!simulation || !simulation.trajectory) return null;
    const traj = simulation.trajectory;
    const width = 760;
    const height = 260;
    const padding = { top: 25, right: 30, bottom: 35, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...traj.map((t) => t.baseline_co2e)) * 1.1;
    const minVal = Math.min(...traj.map((t) => t.scenario_co2e)) * 0.85;
    const range = maxVal - minVal || 1;

    const getX = (idx) => padding.left + (idx / Math.max(1, traj.length - 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

    let basePath = "";
    let scenPath = "";
    traj.forEach((pt, i) => {
      const x = getX(i);
      const yBase = getY(pt.baseline_co2e);
      const yScen = getY(pt.scenario_co2e);
      basePath += i === 0 ? `M ${x} ${yBase}` : ` L ${x} ${yBase}`;
      scenPath += i === 0 ? `M ${x} ${yScen}` : ` L ${x} ${yScen}`;
    });

    // Decarbonization Wedge Polygon (Area between Baseline and Scenario)
    let wedgePath = basePath;
    for (let i = traj.length - 1; i >= 0; i--) {
      const x = getX(i);
      const yScen = getY(traj[i].scenario_co2e);
      wedgePath += ` L ${x} ${yScen}`;
    }
    wedgePath += " Z";

    return (
      <div className="forecast-chart-container" style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="forecast-svg">
          <defs>
            <linearGradient id="avoidedWedgeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.28)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
            </linearGradient>
          </defs>

          {/* Decarbonization Avoided Wedge */}
          <path d={wedgePath} fill="url(#avoidedWedgeGrad)" />

          {/* Tracking Guideline on Hover */}
          {hoveredTrajPoint && (
            <line
              x1={hoveredTrajPoint.x}
              y1={padding.top}
              x2={hoveredTrajPoint.x}
              y2={height - padding.bottom}
              stroke="rgba(52, 211, 153, 0.5)"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
          )}

          {/* Baseline Line (Reddish Orange) */}
          <path d={basePath} fill="none" stroke="#f87171" strokeWidth="2.5" strokeDasharray="5 4" />
          {/* Scenario Line (Emerald) */}
          <path d={scenPath} fill="none" stroke="#10b981" strokeWidth="3.2" />

          {traj.map((pt, i) => {
            const x = getX(i);
            const yBase = getY(pt.baseline_co2e);
            const yScen = getY(pt.scenario_co2e);
            const isHovered = hoveredTrajPoint && hoveredTrajPoint.year === pt.year;
            const avoided = pt.baseline_co2e - pt.scenario_co2e;
            const taxSaved = (avoided * 50);

            return (
              <g key={i}>
                {isHovered && (
                  <circle cx={x} cy={yScen} r="11" fill="none" stroke="#34d399" strokeWidth="2" opacity="0.7" />
                )}
                {/* Baseline marker */}
                <circle cx={x} cy={yBase} r="4" fill="#f87171" />
                {/* Scenario marker */}
                <circle
                  cx={x}
                  cy={yScen}
                  r={isHovered ? 7 : 5}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={() =>
                    setHoveredTrajPoint({
                      year: pt.year,
                      baseline: pt.baseline_co2e,
                      scenario: pt.scenario_co2e,
                      avoided,
                      taxSaved,
                      x,
                      y: yScen,
                    })
                  }
                  onMouseLeave={() => setHoveredTrajPoint(null)}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill={isHovered ? "#34d399" : "rgba(255,255,255,0.7)"}
                  fontSize="11"
                  fontWeight={isHovered ? "700" : "400"}
                  textAnchor="middle"
                >
                  {pt.year}
                </text>
                <text
                  x={x}
                  y={yScen - 10}
                  fill="#10b981"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {(pt.scenario_co2e / 1000).toFixed(0)}k t
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Inspector */}
        {hoveredTrajPoint && (
          <div
            className="chart-floating-inspector animate-fade-in"
            style={{
              position: "absolute",
              left: `${Math.min(width - 230, Math.max(15, hoveredTrajPoint.x - 90))}px`,
              top: `${Math.max(10, hoveredTrajPoint.y - 88)}px`,
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            <div className="inspector-pill-badge" style={{ color: "#34d399" }}>
              Decarbonization Pathway · Year {hoveredTrajPoint.year}
            </div>
            <div className="inspector-value-line">
              <strong>Scenario Output:</strong>{" "}
              <span className="font-mono text-emerald">
                {hoveredTrajPoint.scenario?.toLocaleString()} t CO₂e
              </span>
            </div>
            <div className="inspector-delta-line">
              <span>Avoided:</span>{" "}
              <strong className="text-emerald font-mono">
                -{hoveredTrajPoint.avoided?.toLocaleString()} t CO₂e
              </strong>
            </div>
            <div className="inspector-ci-line font-mono" style={{ color: "#38bdf8" }}>
              Tax Savings: +${(hoveredTrajPoint.taxSaved / 1000000).toFixed(2)}M / yr (@ $50/t)
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="scenario-view-container animate-fade-in">
      {/* Banner */}
      <div className="section-head-banner">
        <div className="banner-badge">SYSTEM SPECIFICATION: RENEWABLE IMPACT MODELING</div>
        <h2>Renewable Energy What-If Scenario Simulator</h2>
        <p>
          Simulate decarbonization pathways by replacing fossil fuels and grid electricity with
          onsite solar PV, wind PPAs, or clean energy carriers. Evaluate avoided emissions and carbon tax exposure.
        </p>
      </div>

      {/* Control Card */}
      <div className="glass-card controls-card">
        <div className="scenario-controls-grid">
          {/* Facility Selection */}
          <div className="control-group">
            <label className="control-label">Facility</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="select-input select-styled"
            >
              {facilities.map((fac) => (
                <option key={fac.facility_id} value={fac.facility_id}>
                  {fac.facility_name}
                </option>
              ))}
            </select>
          </div>

          {/* Displaced Fuel */}
          <div className="control-group">
            <label className="control-label">Displaced Energy Carrier</label>
            <select
              value={displacedFuel}
              onChange={(e) => setDisplacedFuel(e.target.value)}
              className="select-input select-styled"
            >
              <option value="grid_electricity">Fossil Grid Electricity (0.386 t CO₂e/MWh)</option>
              <option value="natural_gas">Furnace Natural Gas (0.202 t CO₂e/MWh)</option>
              <option value="heavy_fuel_oil">Process Heavy Fuel Oil (0.268 t CO₂e/MWh)</option>
            </select>
          </div>

          {/* Preset Buttons */}
          <div className="control-group">
            <label className="control-label">Quick Scenario Presets</label>
            <div className="preset-buttons-row">
              {[10, 20, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`preset-btn ${renewableShare === pct ? "active" : ""}`}
                  onClick={() => setRenewableShare(pct)}
                >
                  {pct}% Adoption
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Share Slider */}
        <div className="slider-control-block">
          <div className="slider-header">
            <span className="slider-label-strong">Renewable Share Adoption Target</span>
            <span className="slider-badge-val">{renewableShare}% Clean Energy Mix</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={renewableShare}
            onChange={(e) => setRenewableShare(Number(e.target.value))}
            className="range-slider range-slider-emerald"
          />
          <div className="slider-ticks">
            <span>0% (Fossil Only)</span>
            <span>20% (Clean Power)</span>
            <span>40% (Transition)</span>
            <span>60% (Deep Abatement)</span>
            <span>80% (Near Net-Zero)</span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {simulation && (
        <div className="scenario-kpi-grid">
          <div className="glass-card kpi-card-metric">
            <span className="kpi-label">Avoided Emissions (Annual)</span>
            <strong className="kpi-val text-emerald">
              -{simulation.avoided_co2e?.toLocaleString()} t CO₂e
            </strong>
            <span className="kpi-subtext">Displaced fossil energy: {simulation.displaced_energy_mwh?.toLocaleString()} MWh</span>
          </div>

          <div className="glass-card kpi-card-metric">
            <span className="kpi-label">Emission Abatement %</span>
            <strong className="kpi-val text-emerald">
              -{simulation.reduction_pct}%
            </strong>
            <span className="kpi-subtext">Rating: {simulation.sustainability_rating}</span>
          </div>

          <div className="glass-card kpi-card-metric">
            <span className="kpi-label">Annual Carbon Tax Savings</span>
            <strong className="kpi-val text-cyan">
              ${(simulation.annual_tax_savings_usd / 1000000).toFixed(2)}M USD
            </strong>
            <span className="kpi-subtext">Based on $50/tonne CO₂e tax rate</span>
          </div>

          <div className="glass-card kpi-card-metric">
            <span className="kpi-label">5-Year Cumulative Avoidance</span>
            <strong className="kpi-val text-purple">
              {simulation.cumulative_co2e_saved?.toLocaleString()} t
            </strong>
            <span className="kpi-subtext">Cumulative savings: ${(simulation.cumulative_tax_savings_usd / 1000000).toFixed(2)}M</span>
          </div>
        </div>
      )}

      {/* Trajectory Comparison Chart */}
      <div className="glass-card chart-card">
        <div className="card-header-line">
          <div className="card-title-group">
            <span className="card-icon">⚡</span>
            <div>
              <h3>Decarbonization Trajectory (Baseline vs {renewableShare}% Renewable Scenario)</h3>
              <span className="subhead-meta">
                Formula: Emissions_scenario = Baseline - (Renewable_Share × Energy_Displaced × Emission_Factor)
              </span>
            </div>
          </div>
          <div className="chart-legend-row inline-legend">
            <div className="legend-item">
              <span className="legend-dot bg-red-dashed"></span>
              <span>Baseline (Business as Usual)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot bg-emerald"></span>
              <span>Scenario ({renewableShare}% Clean Share)</span>
            </div>
          </div>
        </div>

        {renderTrajectoryChart()}

        {/* Environmental Equivalents */}
        {simulation && simulation.avoided_co2e > 0 && (
          <div className="environmental-impact-strip">
            <div className="impact-box">
              <span className="impact-icon">🚗</span>
              <div className="impact-info">
                <strong>{Math.round(simulation.avoided_co2e / 4.6).toLocaleString()}</strong>
                <span>Gasoline passenger vehicles removed from the road for 1 year</span>
              </div>
            </div>
            <div className="impact-box">
              <span className="impact-icon">🌲</span>
              <div className="impact-info">
                <strong>{Math.round(simulation.avoided_co2e / 0.06).toLocaleString()}</strong>
                <span>Tree seedlings grown for 10 years to sequester equivalent carbon</span>
              </div>
            </div>
            <div className="impact-box">
              <span className="impact-icon">🏡</span>
              <div className="impact-info">
                <strong>{Math.round(simulation.avoided_co2e / 7.2).toLocaleString()}</strong>
                <span>Average homes' electricity powered with zero net emissions</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

