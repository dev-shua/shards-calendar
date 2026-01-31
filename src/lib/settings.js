import { MODULE_ID } from "@core/constants";
import { CalendarSettingsApp } from "@ui/calendar/apps/CalendarSettingsApp";

const SETTING_CACHE = {};
const DEFAULT_CACHE = false;

export const SETTINGS_KEYS = {
  CHATLOG: "debug.show-logs-in-chat",
  STORE: "calendar.store",
  HIDE_DATE_TO_PLAYERS: "calendar.hide-date-to-players",
  WELCOME_SHOWN: "chat-welcome-message-shown",
  LAUNCHER_ACCESS: "chip-launcher-access",
};

export function registerSettings() {
  const settings = {
    [SETTINGS_KEYS.CHATLOG]: {
      name: "SHARDS.Calendar.Settings.ChatLog.Name",
      hint: "SHARDS.Calendar.Settings.ChatLog.Hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      useCache: true,
    },
    [SETTINGS_KEYS.STORE]: {
      scope: "world",
      config: false,
      type: Object,
      default: {"version": 1, "activeId": null, "calendars": {}, "states": {}},
      useCache: false,
    },
    [SETTINGS_KEYS.WELCOME_SHOWN]: {
      scope: "world",
      config: false,
      type: Boolean,
      default: false,
      useCache: true,
    },
    [SETTINGS_KEYS.HIDE_DATE_TO_PLAYERS]: {
      scope: "world",
      config: false,
      type: Boolean,
      default: true,
      useCache: true,
    },
    [SETTINGS_KEYS.LAUNCHER_ACCESS]: {
      name: "Calendar launcher access",
      hint: "Who can see the calendar launcher",
      scope: "world",
      config: true,
      type: String,
      choices: {
        none: "Nobody",
        gm: "GM only",
        player: "All players"
      },
      default: "player",
    }
  };

  game.settings.registerMenu(MODULE_ID, "calendarApp", {
    name: "Open Calendar",
    label: "Open Calendar",
    icon: "fas fa-calendar",
    type: CalendarSettingsApp,
    restricted: true,
  });

  registerSettingsArray(settings);
};

export function getSetting(key) {
  return SETTING_CACHE[key] ?? game.settings.get(MODULE_ID, key);
};

export async function setSetting(key, value) {
  return await game.settings.set(MODULE_ID, key, value);
};

function registerSettingsArray(settings) {
  for (const [key, value] of Object.entries(settings)) {
    if (!value.name) value.name = `${MODULE_ID}.settings.${key}.name`;
    if (!value.hint) value.hint = `${MODULE_ID}.settings.${key}.hint`;
    if (value.useCache === undefined) value.useCache = DEFAULT_CACHE;
    if (value.useCache) {
      const unwrappedOnChange = value.onChange;
      if (value.onChange) value.onChange = (value) => {
        SETTING_CACHE[key] = value;
        if (unwrappedOnChange) unwrappedOnChange(value);
      }
    }
    game.settings.register(MODULE_ID, key, value);
    if(value.useCache) SETTING_CACHE[key] = getSetting(key);
  }
};