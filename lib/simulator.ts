export type Weather = {
  temperature: number;
  humidity: number;
  wind: number;
  rain: number;
  daylight: number;
};

export type TeamStats = {
  name: string;
  short: string;
  attack: number;
  midfield: number;
  defense: number;
  form: number;
  homeAdvantage?: number;
};

export type MatchSnapshot = {
  minute: number;
  scoreHome: number;
  scoreAway: number;
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  xgHome: number;
  xgAway: number;
  cornersHome: number;
  cornersAway: number;
  foulsHome: number;
  foulsAway: number;
  passesHome: number;
  passesAway: number;
  momentum: number;
  fatigueHome: number;
  fatigueAway: number;
  weather: Weather;
};

export type OutcomeBreakdown = {
  home: number;
  draw: number;
  away: number;
};

export const homeTeam: TeamStats = {
  name: "Everton",
  short: "EVE",
  attack: 78,
  midfield: 74,
  defense: 72,
  form: 74,
  homeAdvantage: 1.12,
};

export const awayTeam: TeamStats = {
  name: "Leicester City",
  short: "LEI",
  attack: 70,
  midfield: 71,
  defense: 69,
  form: 68,
  homeAdvantage: 0.96,
};

export const defaultMatch: MatchSnapshot = {
  minute: 67,
  scoreHome: 1,
  scoreAway: 1,
  possessionHome: 54,
  possessionAway: 46,
  shotsHome: 11,
  shotsAway: 9,
  xgHome: 1.24,
  xgAway: 1.08,
  cornersHome: 5,
  cornersAway: 4,
  foulsHome: 9,
  foulsAway: 11,
  passesHome: 378,
  passesAway: 332,
  momentum: 52,
  fatigueHome: 32,
  fatigueAway: 38,
  weather: {
    temperature: 16,
    humidity: 62,
    wind: 11,
    rain: 12,
    daylight: 68,
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getWeatherSummary(weather: Weather) {
  if (weather.rain > 50) return "Rainy";
  if (weather.wind > 25) return "Windy";
  if (weather.daylight < 35) return "Low light";
  if (weather.temperature > 24) return "Warm";
  return "Clear";
}

export function calculateOutcomeEstimate(match: MatchSnapshot): OutcomeBreakdown {
  const scoreDiff = match.scoreHome - match.scoreAway;
  const shotAdv = (match.shotsHome - match.shotsAway) * 0.08;
  const xgDiff = (match.xgHome - match.xgAway) * 0.55;
  const possessionAdv = (match.possessionHome - match.possessionAway) * 0.012;
  const passingAdv = ((match.passesHome - match.passesAway) / 1000) * 0.25;
  const cornerAdv = (match.cornersHome - match.cornersAway) * 0.05;
  const foulDiff = (match.foulsAway - match.foulsHome) * 0.025;
  const momentumBoost = (match.momentum - 50) * 0.012;
  const fatigueImpact = (match.fatigueAway - match.fatigueHome) * 0.014;
  const weatherDrag = (match.weather.rain / 100) * 0.12 + (match.weather.wind / 100) * 0.08 - (match.weather.daylight / 100) * 0.05;
  const timeWeight = clamp(1 + (match.minute / 90) * 0.75, 1, 1.8);

  const homeEdge =
    0.35 +
    scoreDiff * 0.12 +
    shotAdv +
    xgDiff +
    possessionAdv +
    passingAdv +
    cornerAdv +
    foulDiff +
    momentumBoost +
    fatigueImpact +
    weatherDrag +
    0.16 * timeWeight;

  const drawChance = clamp(0.28 - Math.abs(scoreDiff) * 0.06 + (match.minute > 75 ? 0.06 : 0), 0.1, 0.42);
  const homeChance = clamp(0.5 + homeEdge * 0.18, 0.1, 0.74);
  const awayChance = clamp(0.5 - homeEdge * 0.18 + (match.scoreAway > match.scoreHome ? 0.08 : 0), 0.08, 0.66);

  const total = homeChance + drawChance + awayChance;

  return {
    home: Number(((homeChance / total) * 100).toFixed(1)),
    draw: Number(((drawChance / total) * 100).toFixed(1)),
    away: Number(((awayChance / total) * 100).toFixed(1)),
  };
}

export function runSimulation(match: MatchSnapshot, iterations = 1200): { home: number; draw: number; away: number } {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  for (let index = 0; index < iterations; index += 1) {
    const scoreDiff = match.scoreHome - match.scoreAway;
    const timeFactor = clamp(match.minute / 90, 0.2, 1);
    const weatherFactor = 1 - (match.weather.rain / 200 + match.weather.wind / 220);
    const pressure = ((match.shotsHome + match.xgHome * 2.2) - (match.shotsAway + match.xgAway * 2.2)) * 0.13;
    const formBias = (homeTeam.form - awayTeam.form) * 0.01;
    const momentumBias = (match.momentum - 50) * 0.013;
    const fatigueBias = (match.fatigueAway - match.fatigueHome) * 0.008;
    const chance = 0.36 + scoreDiff * 0.07 + pressure + formBias + weatherFactor * 0.08 + momentumBias + fatigueBias + (timeFactor - 0.5) * 0.14;

    const homeChance = clamp(chance, 0.08, 0.76);
    const awayChance = clamp(1 - homeChance + 0.12, 0.08, 0.68);
    const drawChance = clamp(0.22 + (timeFactor - 0.55) * 0.32 - Math.abs(scoreDiff) * 0.04, 0.08, 0.42);
    const total = homeChance + awayChance + drawChance;

    const outcomeRoll = Math.random() * total;

    if (outcomeRoll < homeChance) {
      homeWins += 1;
    } else if (outcomeRoll < homeChance + drawChance) {
      draws += 1;
    } else {
      awayWins += 1;
    }
  }

  return {
    home: Number(((homeWins / iterations) * 100).toFixed(1)),
    draw: Number(((draws / iterations) * 100).toFixed(1)),
    away: Number(((awayWins / iterations) * 100).toFixed(1)),
  };
}
