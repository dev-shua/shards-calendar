// src/core/weather/constants.js

export const VISIBILITY_TYPES = ["good", "reduced", "poor"];

export const VISIBILITY_MODIFIER = {
  good:    0,
  reduced: 1,
  poor:    2,
};

// Visibilité par défaut selon l'icône — le GM peut override
export const FALLBACK_VISIBILITY = "good";

// Icônes météo disponibles dans le picker
export const WEATHER_ICON_OPTIONS = [
  { id: "fa-sun",              label: "SHARDSCalendar.Weather.Icon.Sun" },
  { id: "fa-cloud-sun",        label: "SHARDSCalendar.Weather.Icon.CloudSun" },
  { id: "fa-cloud",            label: "SHARDSCalendar.Weather.Icon.Cloud" },
  { id: "fa-cloud-rain",       label: "SHARDSCalendar.Weather.Icon.Rain" },
  { id: "fa-cloud-showers-heavy", label: "SHARDSCalendar.Weather.Icon.HeavyRain" },
  { id: "fa-cloud-bolt",       label: "SHARDSCalendar.Weather.Icon.Storm" },
  { id: "fa-snowflake",        label: "SHARDSCalendar.Weather.Icon.Snow" },
  { id: "fa-wind",             label: "SHARDSCalendar.Weather.Icon.Wind" },
  { id: "fa-smog",             label: "SHARDSCalendar.Weather.Icon.Fog" },
  { id: "fa-tornado",          label: "SHARDSCalendar.Weather.Icon.Tornado" },
  { id: "fa-rainbow",          label: "SHARDSCalendar.Weather.Icon.Rainbow" },
  { id: "fa-moon",             label: "SHARDSCalendar.Weather.Icon.Moon" },
  { id: "fa-fire",             label: "SHARDSCalendar.Weather.Icon.Fire" },
  { id: "fa-umbrella",         label: "SHARDSCalendar.Weather.Icon.Umbrella" },
  { id: "fa-temperature-high", label: "SHARDSCalendar.Weather.Icon.Hot" },
  { id: "fa-temperature-low",  label: "SHARDSCalendar.Weather.Icon.Cold" },
  { id: "fa-cloud-meatball",   label: "SHARDSCalendar.Weather.Icon.Hail" },
  { id: "fa-water",            label: "SHARDSCalendar.Weather.Icon.Flood" },
];

// Visibilité par défaut selon l'icône choisie
export const ICON_DEFAULT_VISIBILITY = {
  "fa-sun":                 "good",
  "fa-cloud-sun":           "good",
  "fa-cloud":               "good",
  "fa-cloud-rain":          "reduced",
  "fa-cloud-showers-heavy": "reduced",
  "fa-cloud-bolt":          "poor",
  "fa-snowflake":           "reduced",
  "fa-wind":                "reduced",
  "fa-smog":                "poor",
  "fa-tornado":             "poor",
  "fa-rainbow":             "good",
  "fa-moon":                "good",
  "fa-fire":                "reduced",
  "fa-umbrella":            "reduced",
  "fa-temperature-high":    "good",
  "fa-temperature-low":     "good",
  "fa-cloud-meatball":      "reduced",
  "fa-water":               "poor",
};

// Fallback saison si aucune config météo définie
export const FALLBACK_SEASON_WEATHER = {
  tempMin: 10,
  tempMax: 20,
  deltaMax: 5,
  precipitations: [
    { id: "fallback-clear", name: "Clear", icon: "fa-sun",        weight: 60, visibility: "good",    coldDerivation: null },
    { id: "fallback-rain",  name: "Rain",  icon: "fa-cloud-rain", weight: 25, visibility: "reduced", coldDerivation: "fallback-snow" },
    { id: "fallback-fog",   name: "Fog",   icon: "fa-smog",       weight: 10, visibility: "poor",    coldDerivation: null },
    { id: "fallback-storm", name: "Storm", icon: "fa-cloud-bolt", weight: 5,  visibility: "poor",    coldDerivation: null },
  ],
  coldPrecipitations: [
    { id: "fallback-snow", name: "Snow", icon: "fa-snowflake", weight: 0, visibility: "reduced", coldDerivation: null },
  ],
};