"use client";

import { useMemo, useState } from "react";
import {
  awayTeam,
  calculateOutcomeEstimate,
  defaultMatch,
  homeTeam,
  runSimulation,
  type MatchSnapshot,
} from "@/lib/simulator";

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function Simulator() {
  const [match, setMatch] = useState<MatchSnapshot>(defaultMatch);
  const [simulated, setSimulated] = useState(() => runSimulation(defaultMatch, 1200));

  const estimate = useMemo(() => calculateOutcomeEstimate(match), [match]);

  const updateMatch = (key: keyof MatchSnapshot, value: number) => {
    setMatch((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateWeather = (key: keyof MatchSnapshot["weather"], value: number) => {
    setMatch((current) => ({
      ...current,
      weather: {
        ...current.weather,
        [key]: value,
      },
    }));
  };

  const updateRun = () => {
    setSimulated(runSimulation(match, 1400));
  };

  const expectedGoals = ((match.xgHome + match.xgAway) / 2).toFixed(2);
  const homeControl = Math.min(100, Math.max(0, match.possessionHome));
  const awayControl = 100 - homeControl;

  const probabilities = [
    { label: "Home", key: "home", value: estimate.home, color: "home" },
    { label: "Draw", key: "draw", value: estimate.draw, color: "draw" },
    { label: "Away", key: "away", value: estimate.away, color: "away" },
  ];

  return (
    <main className="app-shell">
      <div className="container">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">⚽</div>
            <h1>Live Football Outcome Simulator</h1>
          </div>
          <div className="badge">Weather-aware + live stats</div>
        </header>

        <div className="grid">
          <section className="panel match-panel">
            <div className="fixture">
              <div className="team">
                <div className="team-badge home">EVE</div>
                <div className="team-name">{homeTeam.name}</div>
              </div>

              <div className="scorebox">
                <span>{match.scoreHome}</span>
                <small>VS</small>
                <span>{match.scoreAway}</span>
              </div>

              <div className="team">
                <div className="team-badge away">LEI</div>
                <div className="team-name">{awayTeam.name}</div>
              </div>
            </div>

            <div className="match-meta">
              <div className="meta-card">
                <div className="meta-label">Minute</div>
                <div className="meta-value">{match.minute}&apos;</div>
              </div>
              <div className="meta-card">
                <div className="meta-label">Possession</div>
                <div className="meta-value">{homeControl}%</div>
              </div>
              <div className="meta-card">
                <div className="meta-label">Expected goals</div>
                <div className="meta-value">{expectedGoals}</div>
              </div>
              <div className="meta-card">
                <div className="meta-label">Weather</div>
                <div className="meta-value">{match.weather.temperature}°C</div>
              </div>
            </div>

            <div className="section-title">Live match inputs</div>
            <div className="sliders">
              <label className="slider-box">
                <div className="slider-top">
                  <span>Minute</span>
                  <strong>{match.minute}&apos;</strong>
                </div>
                <input type="range" min="0" max="90" value={match.minute} onChange={(event) => updateMatch("minute", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Score</span>
                  <strong>{match.scoreHome} - {match.scoreAway}</strong>
                </div>
                <input type="range" min="0" max="5" value={match.scoreHome} onChange={(event) => updateMatch("scoreHome", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Home possession</span>
                  <strong>{match.possessionHome}%</strong>
                </div>
                <input type="range" min="25" max="75" value={match.possessionHome} onChange={(event) => updateMatch("possessionHome", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Away score</span>
                  <strong>{match.scoreAway}</strong>
                </div>
                <input type="range" min="0" max="5" value={match.scoreAway} onChange={(event) => updateMatch("scoreAway", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Home shots</span>
                  <strong>{match.shotsHome}</strong>
                </div>
                <input type="range" min="0" max="25" value={match.shotsHome} onChange={(event) => updateMatch("shotsHome", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Away shots</span>
                  <strong>{match.shotsAway}</strong>
                </div>
                <input type="range" min="0" max="25" value={match.shotsAway} onChange={(event) => updateMatch("shotsAway", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Home xG</span>
                  <strong>{match.xgHome.toFixed(2)}</strong>
                </div>
                <input type="range" min="0" max="3" step="0.1" value={match.xgHome} onChange={(event) => updateMatch("xgHome", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Away xG</span>
                  <strong>{match.xgAway.toFixed(2)}</strong>
                </div>
                <input type="range" min="0" max="3" step="0.1" value={match.xgAway} onChange={(event) => updateMatch("xgAway", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Temperature</span>
                  <strong>{match.weather.temperature}°C</strong>
                </div>
                <input type="range" min="-5" max="35" value={match.weather.temperature} onChange={(event) => updateWeather("temperature", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Humidity</span>
                  <strong>{match.weather.humidity}%</strong>
                </div>
                <input type="range" min="0" max="100" value={match.weather.humidity} onChange={(event) => updateWeather("humidity", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Wind</span>
                  <strong>{match.weather.wind} km/h</strong>
                </div>
                <input type="range" min="0" max="40" value={match.weather.wind} onChange={(event) => updateWeather("wind", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Rain</span>
                  <strong>{match.weather.rain}%</strong>
                </div>
                <input type="range" min="0" max="100" value={match.weather.rain} onChange={(event) => updateWeather("rain", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Sunlight</span>
                  <strong>{match.weather.daylight}%</strong>
                </div>
                <input type="range" min="0" max="100" value={match.weather.daylight} onChange={(event) => updateWeather("daylight", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Home corners</span>
                  <strong>{match.cornersHome}</strong>
                </div>
                <input type="range" min="0" max="12" value={match.cornersHome} onChange={(event) => updateMatch("cornersHome", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Away corners</span>
                  <strong>{match.cornersAway}</strong>
                </div>
                <input type="range" min="0" max="12" value={match.cornersAway} onChange={(event) => updateMatch("cornersAway", Number(event.target.value))} />
              </label>
            </div>
          </section>

          <aside className="side-panel">
            <section className="panel probability-card">
              <div className="probability-header">
                <h3>Outcome probabilities</h3>
                <button className="run-button" onClick={updateRun}>Run simulation</button>
              </div>

              <div className="probability-list">
                {probabilities.map((item) => (
                  <div className="prob-item" key={item.key}>
                    <div className="prob-label">{item.label}</div>
                    <div className="bar-shell">
                      <div className={`bar ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                    <div className="prob-value">{formatPercent(item.value)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel summary-card">
              <h3>Simulation summary</h3>
              <div className="summary-grid">
                <div className="summary-box">
                  <strong>Monte Carlo</strong>
                  <span>{formatPercent(simulated.home)} home</span>
                </div>
                <div className="summary-box">
                  <strong>Draw</strong>
                  <span>{formatPercent(simulated.draw)}</span>
                </div>
                <div className="summary-box">
                  <strong>Away</strong>
                  <span>{formatPercent(simulated.away)}</span>
                </div>
                <div className="summary-box">
                  <strong>Control</strong>
                  <span>{homeControl.toFixed(0)} / {awayControl.toFixed(0)}</span>
                </div>
                <div className="summary-box">
                  <strong>Weather</strong>
                  <span>{match.weather.rain}% rain</span>
                </div>
                <div className="summary-box">
                  <strong>Condition</strong>
                  <span>{match.weather.daylight > 60 ? "Bright" : "Low light"}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
