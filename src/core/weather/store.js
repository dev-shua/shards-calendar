// src/core/weather/store.js
import { MODULE_ID } from "@core/constants";

const WEATHER_STORE_KEY = "weather.store";

/**
 * @typedef {{ temp: number, precipitation: string, visibility: string, override?: boolean }} WeatherEntry
 * @typedef {{ version: 1, days: Record<string, WeatherEntry> }} WeatherStore
 */

function loadWeatherStore() {
  try {
    return game.settings.get(MODULE_ID, WEATHER_STORE_KEY) ?? { version: 1, days: {} };
  } catch {
    return { version: 1, days: {} };
  }
}

async function saveWeatherStore(store) {
  await game.settings.set(MODULE_ID, WEATHER_STORE_KEY, store);
}

/**
 * Récupère la météo d'un jour — null si pas encore générée
 * @param {number} dayIndex
 * @returns {WeatherEntry|null}
 */
export function getWeatherForDay(dayIndex) {
  const store = loadWeatherStore();
  return store.days[`day_${dayIndex}`] ?? null;
}

/**
 * Sauvegarde la météo d'un jour (générée ou override)
 * @param {number} dayIndex
 * @param {WeatherEntry} entry
 */
export async function saveWeatherForDay(dayIndex, entry) {
  const store = loadWeatherStore();
  store.days[`day_${dayIndex}`] = entry;
  await saveWeatherStore(store);
}

/**
 * Override manuel de la météo d'un jour par le GM
 * @param {number} dayIndex
 * @param {Partial<WeatherEntry>} patch
 */
export async function overrideWeatherForDay(dayIndex, patch) {
  const existing = getWeatherForDay(dayIndex) ?? {};
  await saveWeatherForDay(dayIndex, { ...existing, ...patch, override: true });
}

/**
 * Supprime l'override d'un jour — la météo sera régénérée
 * @param {number} dayIndex
 */
export async function clearWeatherOverride(dayIndex) {
  const store = loadWeatherStore();
  const key = `day_${dayIndex}`;
  if (store.days[key]) {
    delete store.days[key];
    await saveWeatherStore(store);
  }
}