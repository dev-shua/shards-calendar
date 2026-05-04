import { getSetting } from "@lib/settings";
import { setSetting, SETTINGS_KEYS } from "@lib/settings";

const DEFAULT_STORE = { version: 1, activeId: null, calendars: {}, states: {} };

export const loadCalendarStore = () => {
  const raw = getSetting(SETTINGS_KEYS.STORE);
  return { ...DEFAULT_STORE, ...(raw ? raw : {}) }
};

export const saveCalendarStore = (store) => {
  return setSetting(SETTINGS_KEYS.STORE, store);
}