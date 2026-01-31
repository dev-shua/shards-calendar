import { writable, get } from "svelte/store";

export const calendarSnapshot = writable(null);

/**
 * Snapshot UI for feeding Svelte components
 * 
 * - activeId: used Calendar (service and current date)
 * - selectedId: edited Calendar in settings screen
 * - calendars: list of calendars (id + name)
 * - defsById: complete definition indexed by id (weekday, months, moons, etc.)
 * - current: current date of active calendar
*/
export const calendarUi = writable({
  activeId: null,
  selectedId: null,
  calendars: [],
  defsById: {},
  statesById: {},
  current: null,
});

/**
 * Switch selected calendar in the UI for settings editor
 * Doesn't affect active calendar
 * 
 * @param {*} id 
 * @returns 
 */
export const setSelectedId = (id) => calendarUi.update((s) => ({...s, selectedId: id ?? null}));

/**
 * Re-sync calendarUI from Foundry API
 * Called :
 * - On Hook "shards-calendar:changed"
 * 
 * @returns 
 */
export const refreshCalendarUi = () => {
  const api = game?.shardsCalendar;

  if (!api) {
    return calendarUi.set({
      activeId: null, 
      selectedId: null, 
      calendars: [], 
      defsById: {}, 
      statesById: {},
      current: null
    });
  }

  // if an activeId exists but no service, we try to recreate it
  if (api.getActiveId?.() && !api.getService?.()) {
    api.instantiateActiveService?.()
  }

  const store = api.store ?? {};
  const defsById = store.calendars ?? {};
  const statesById = store.states ?? {};
  const calendars = Object.values(defsById).map((c) => ({id: c.id, name: c.name}));
  const activeId = api.getActiveId?.() ?? store.activeId ?? null;
  const current = api.getActiveState?.()?.current ?? null;

  const prev = get(calendarUi);
  let selectedId = prev.selectedId;

  if(!selectedId || !defsById[selectedId]) {
    selectedId = (activeId && defsById[activeId] ? activeId : null) ?? calendars[0]?.id ?? null;
  }

  calendarUi.set({activeId, selectedId, calendars, defsById, statesById, current});
}