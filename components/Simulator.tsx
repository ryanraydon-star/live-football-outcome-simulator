"use client";

import { useEffect, useMemo, useState } from "react";
import {
  awayTeam,
  calculateOutcomeEstimate,
  defaultMatch,
  getWeatherSummary,
  homeTeam,
  runSimulation,
  type MatchSnapshot,
} from "@/lib/simulator";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const buildDefaultWeather = async () => {
  try {
    const response = await fetch("/api/weather?lat=53.438&lon=-2.966", { cache: "no-store" });
    if (!response.ok) return defaultMatch.weather;
    const data = await response.json();
    return {
      temperature: Number(data.temperature ?? defaultMatch.weather.temperature),
      humidity: Number(data.humidity ?? defaultMatch.weather.humidity),
      wind: Number(data.wind ?? defaultMatch.weather.wind),
      rain: Number(data.rain ?? defaultMatch.weather.rain),
      daylight: Number(data.daylight ?? defaultMatch.weather.daylight),
    };
  } catch {
    return defaultMatch.weather;
  }
};

export function Simulator() {
  const [match, setMatch] = useState<MatchSnapshot>(defaultMatch);
  const [simulated, setSimulated] = useState(() => runSimulation(defaultMatch, 1400));
  const [isLive, setIsLive] = useState(true);
  const [statusText, setStatusText] = useState("Live match feed running");

  useEffect(() => {
    let disposed = false;

    const syncWeather = async () => {
      const weather = await buildDefaultWeather();
      if (!disposed) {
        setMatch((current) => ({
          ...current,
          weather,
        }));
      }
    };

    syncWeather();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!isLive) return;

    const interval = window.setInterval(() => {
      setMatch((current) => {
        const minute = clamp(current.minute + 1, 0, 90);
        const momentum = clamp(current.momentum + (Math.random() > 0.5 ? 1 : -1), 30, 70);
        const possessionHome = clamp(
          current.possessionHome + (current.scoreHome >= current.scoreAway ? 1 : -1),
          35,
          65,
        );

        const xgHome = Number(clamp(current.xgHome + (Math.random() - 0.5) * 0.25, 0.4, 2.8).toFixed(2));
        const xgAway = Number(clamp(current.xgAway + (Math.random() - 0.5) * 0.22, 0.3, 2.5).toFixed(2));

        const next: MatchSnapshot = {
          ...current,
          minute,
          momentum,
          possessionHome,
          possessionAway: 100 - possessionHome,
          xgHome,
          xgAway,
          shotsHome: clamp(current.shotsHome + (Math.random() > 0.6 ? 1 : 0), 4, 18),
          shotsAway: clamp(current.shotsAway + (Math.random() > 0.65 ? 1 : 0), 3, 17),
          passesHome: clamp(current.passesHome + Math.round(Math.random() * 12), 220, 520),
          passesAway: clamp(current.passesAway + Math.round(Math.random() * 10), 190, 500),
        };

        return next;
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isLive]);

  const estimate = useMemo(() => calculateOutcomeEstimate(match), [match]);

  const updateMatch = (key: keyof MatchSnapshot, value: number) => {
    setMatch((current) => ({ ...current, [key]: value }));
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
    setStatusText("Simulation refreshed from current match state");
    setTimeout(() => setStatusText(isLive ? "Live match feed running" : "Live feed paused"), 1800);
  };

  const resetMatch = () => {
    setMatch(defaultMatch);
    setSimulated(runSimulation(defaultMatch, 1400));
    setStatusText("Match data reset to Everton vs Leicester default");
  };

  const expectedGoals = ((match.xgHome + match.xgAway) / 2).toFixed(2);
  const homeControl = clamp(match.possessionHome, 35, 65);
  const awayControl = 100 - homeControl;
  const weatherLabel = getWeatherSummary(match.weather);

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

          <div className="header-actions">
            <button className="toggle-button" onClick={() => setIsLive((current) => !current)}>
              {isLive ? "Pause live feed" : "Resume live feed"}
            </button>
            <button className="ghost-button" onClick={resetMatch}>Reset</button>
          </div>
        </header>

        <div className="live-banner">
          <div className="live-indicator" />
          <div>
            <strong>{statusText}</strong>
          </div>
        </div>

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
                <div className="meta-label">xG</div>
                <div className="meta-value">{expectedGoals}</div>
              </div>
              <div className="meta-card">
                <div className="meta-label">Weather</div>
                <div className="meta-value">{weatherLabel}</div>
              </div>
            </div>

            <div className="stat-strip">
              <div className="stat-pill">
                <span>Momentum</span>
                <strong>{match.momentum}</strong>
              </div>
              <div className="stat-pill">
                <span>Fatigue</span>
                <strong>{match.fatigueHome}/{match.fatigueAway}</strong>
              </div>
              <div className="stat-pill">
                <span>Rain</span>
                <strong>{match.weather.rain}%</strong>
              </div>
              <div className="stat-pill">
                <span>Sunlight</span>
                <strong>{match.weather.daylight}%</strong>
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
                  <span>Home score</span>
                  <strong>{match.scoreHome}</strong>
                </div>
                <input type="range" min="0" max="5" value={match.scoreHome} onChange={(event) => updateMatch("scoreHome", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Home possession</span>
                  <strong>{match.possessionHome}%</strong>
                </div>
                <input type="range" min="35" max="65" value={match.possessionHome} onChange={(event) => updateMatch("possessionHome", Number(event.target.value))} />
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
                  <span>Momentum</span>
                  <strong>{match.momentum}</strong>
                </div>
                <input type="range" min="30" max="70" value={match.momentum} onChange={(event) => updateMatch("momentum", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Home fatigue</span>
                  <strong>{match.fatigueHome}</strong>
                </div>
                <input type="range" min="0" max="100" value={match.fatigueHome} onChange={(event) => updateMatch("fatigueHome", Number(event.target.value))} />
              </label>

              <label className="slider-box">
                <div className="slider-top">
                  <span>Away fatigue</span>
                  <strong>{match.fatigueAway}</strong>
                </div>
                <input type="range" min="0" max="100" value={match.fatigueAway} onChange={(event) => updateMatch("fatigueAway", Number(event.target.value))} />
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
                  <span>{weatherLabel}</span>
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
