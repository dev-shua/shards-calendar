// src/core/weather/generator.js
import { ICON_DEFAULT_VISIBILITY, FALLBACK_VISIBILITY } from "./constants";


function rollPrecipitation(precipitations, rng) {
  const total = precipitations.reduce((sum, p) => sum + p.weight, 0);
  if (total === 0) return precipitations[0] ?? null;
  let roll = rng() * total;
  for (const p of precipitations) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return precipitations[precipitations.length - 1];
}

function rollTemperature(prevTemp, tempMin, tempMax, deltaMax, rng) {
  const range = tempMax - tempMin;
  if (range === 0) return tempMin;
  const position = (prevTemp - tempMin) / range;

  let tendencyBias;
  if (position < 0.33)      tendencyBias = 0.7;
  else if (position > 0.67) tendencyBias = 0.3;
  else                       tendencyBias = 0.5;

  const goUp = rng() < tendencyBias;
  const delta = Math.round(rng() * deltaMax);
  const next = prevTemp + (goUp ? delta : -delta);
  return Math.max(tempMin, Math.min(tempMax, next));
}

/**
 * Applique la dérivation par température
 * Si la précipitation a une coldDerivation et que temp <= coldThreshold,
 * on cherche la précipitation cible dans coldPrecipitations
 */
function applyDerivation(precipitation, temp, seasonWeather) {
  if (!precipitation?.coldDerivation) return precipitation;
  if (temp > (seasonWeather.coldThreshold ?? 2)) return precipitation;

  const allPrecip = [
    ...(seasonWeather.precipitations ?? []),
    ...(seasonWeather.coldPrecipitations ?? []),
  ];

  return allPrecip.find(p => p.id === precipitation.coldDerivation) ?? precipitation;
}

export function generateWeather(seasonWeather, prevTemp, dayIndex) {
  const seed = dayIndex * 9301 + 49297;
  let state = seed % 233280;
  const rng = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  const { tempMin, tempMax, deltaMax, precipitations } = seasonWeather;

  const startTemp = prevTemp ?? Math.round((tempMin + tempMax) / 2);
  const temp = rollTemperature(startTemp, tempMin, tempMax, deltaMax ?? 5, rng);

  const rawPrecipitation = rollPrecipitation(precipitations ?? [], rng);
  const precipitation = applyDerivation(rawPrecipitation, temp, seasonWeather);

  const visibility = precipitation?.visibility 
    ?? ICON_DEFAULT_VISIBILITY[precipitation?.icon] 
    ?? FALLBACK_VISIBILITY;

  return {
    temp,
    precipitationId: precipitation?.id ?? null,
    visibility,
  };
}