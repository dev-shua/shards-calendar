// src/core/weather/api.js
import { generateWeather } from "./generator.js";
import { getWeatherForDay, saveWeatherForDay, overrideWeatherForDay, clearWeatherOverride } from "./store.js";
import { FALLBACK_SEASON_WEATHER } from "./constants.js";
import { dayOfYear } from "@ui/calendar/calendarMath.js";
import { getSetting, SETTINGS_KEYS } from "@lib/settings.js";

/**
 * Récupère la config météo de la saison courante depuis la définition du calendrier
 * @param {object} calendarDef
 * @param {object} calendarState
 * @returns {object|null}
 */
function getCurrentSeasonWeather(calendarDef, currentSeason) {
  const weatherSeasons = calendarDef?.weatherSeasons ?? {};
  
  if (currentSeason?.id && weatherSeasons[currentSeason.id]) {
    return weatherSeasons[currentSeason.id];
  }

  return FALLBACK_SEASON_WEATHER;
}

/**
 * Calcule le dayIndex absolu depuis le calendrier
 * @param {object} calendarDef
 * @param {object} calendarState
 * @returns {number}
 */
function getDayIndex(calendarDef, calendarState) {
  const current = calendarState?.current;
  if (!current) return 0;
  const doy = dayOfYear(calendarDef, current.monthIndex ?? 0, current.day ?? 1);
  return (current.year ?? 0) * 365 + doy;
}

/**
 * Génère et sauvegarde la météo du jour courant si pas encore générée
 * Appelé automatiquement par stepDays
 */
export async function generateWeatherForCurrentDay(calendarApi) {
  if (!getSetting(SETTINGS_KEYS.WEATHER_ENABLED)) return null;
  const def = calendarApi.getActiveDefinition();
  const state = calendarApi.getActiveState();
  if (!def || !state) return null;

  const dayIndex = getDayIndex(def, state);
  const existing = getWeatherForDay(dayIndex);
  if (existing?.override) return existing;

  const currentSeason = calendarApi.getCurrentSeason();
  const prevWeather = getWeatherForDay(dayIndex - 1);
  const prevTemp = prevWeather?.temp ?? null;

  const seasonWeather = getCurrentSeasonWeather(def, currentSeason);
  if (!seasonWeather) return null;

  const entry = generateWeather(seasonWeather, prevTemp, dayIndex);
  await saveWeatherForDay(dayIndex, entry);
  return entry;
}

/**
 * Récupère la météo d'un jour — génère si absent
 */
export async function getOrGenerateWeather(calendarApi, dayIndex) {
  const existing = getWeatherForDay(dayIndex);
  if (existing) return existing;

  const def = calendarApi.getActiveDefinition();
  const state = calendarApi.getActiveState();
  if (!def || !state) return null;

  const currentSeason = calendarApi.getCurrentSeason();
  const prevWeather = getWeatherForDay(dayIndex - 1);
  const prevTemp = prevWeather?.temp ?? null;

  const seasonWeather = getCurrentSeasonWeather(def, currentSeason);
  if (!seasonWeather) return null;

  const entry = generateWeather(seasonWeather, prevTemp, dayIndex);
  await saveWeatherForDay(dayIndex, entry);
  return entry;
}

/**
 * Override manuel GM
 */
export async function overrideWeather(dayIndex, patch) {
  await overrideWeatherForDay(dayIndex, patch);
}

/**
 * Supprime l'override
 */
export async function clearOverride(dayIndex) {
  await clearWeatherOverride(dayIndex);
}