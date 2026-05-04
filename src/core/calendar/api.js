import { getSetting, SETTINGS_KEYS } from "@lib/settings";
import log from "@utils/logger";
import { CalendarService } from "./service";
import { loadCalendarStore, saveCalendarStore } from "./store";
import { makeDefaultCalendarDef, makeDefaultCalendarState, DEFAULT_CALENDAR_ID } from "./defaultCalendar";
import { t, tf } from "@utils/i18n";
import { clearOverride, generateWeatherForCurrentDay, getOrGenerateWeather as fetchOrGenerateWeather, overrideWeather } from "@core/weather/api";
import { getWeatherForDay } from "@core/weather/store";

let _api = null;
const notifyChanged = () => Hooks.callAll("shards-calendar:changed");

export const getCalendarApi = () => {
  if(!_api) _api = new CalendarAPI();
  return _api
}

export const initCalendarApi = () => {
  if (!_api) _api = new CalendarAPI();
}

export class CalendarAPI {
  store = loadCalendarStore();
  activeService = null;
  unsubscribeActive = undefined;
  
  constructor() {
    this.instantiateActiveService();
  }

  reloadStore() {
    this.store = loadCalendarStore();
    this.instantiateActiveService();
  }

  getActiveId() {
    return this.store.activeId;
  }

  getActiveDefinition() {
    const id = this.store.activeId;
    return id ? (this.store.calendars[id] ?? null) : null;
  }

  getActiveState() {
    const id = this.store.activeId;
    return id ? (this.store.states[id] ?? null) : null;
  }

  getService() {
    return this.activeService;
  }

  /**
   * Replace the definition for a calendar by id
   * - Does NOT change activeId unless the edited calendar is currently active want to reinstantiate.
   * - If the edited calendar is the active one, reinstantiate the service.
   */
  replaceCalendarDefinition(id, nextDefinition) {
    if (!id) return Promise.resolve();

    const existing = this.store.calendars?.[id];
    if(!existing) {
      ui.notifications?.warn(t("SHARDSCalendar.Error.UnknownId"));
      return Promise.resolve();
    }

    const safeNext = structuredClone(nextDefinition ?? {});
    safeNext.id = id;

    this.store.calendars[id] = safeNext;

    const recreate = this.store.activeId === id;

    const p = this.persistAndMaybeReinstantiate(recreate);
    p.then(() => notifyChanged()).catch(() => {});
    return p;
  }

  /**
   * Create or update a calendar definition + state.
   * Optionnally make it active.
   */
  upsertCalendar(definition, initialState, makeActive = false) {
    this.store.calendars[definition.id] = structuredClone(definition);
    this.store.states[definition.id] = structuredClone(initialState);
    if(makeActive) this.store.activeId = definition.id;

    const p = this.persistAndMaybeReinstantiate(makeActive);
    p.then(() => notifyChanged()).catch(() => {});
    return p;
  }

  selectActive(id) {
    if (!this.store.calendars[id] || !this.store.states[id]) {
      ui.notifications?.warn(t("SHARDSCalendar.Error.UnknownId"));
      return Promise.resolve();
    }

    this.store.activeId = id;
    const p = this.persistAndMaybeReinstantiate(true);
    p.then(() => notifyChanged()).catch(() => {});
    return p;
  }

  advanceActive(delta) {
    if(!this.activeService) return;
    this.activeService.advanceTime(delta);
    this.flushActiveStateToStore();
    notifyChanged();
  }

  stepDays(delta) {
    this.advanceActive({ day: delta });
    generateWeatherForCurrentDay(this)
      .then(() => {
        Hooks.callAll("shards-calendar:weather:changed");
        Hooks.callAll("shards-calendar:weather:ready");
        Hooks.callAll("shards-calendar:date:changed");
      })
      .catch(() => {});
  }

  setActiveDate(date) {
    if(!this.activeService) return;
    this.activeService.setDate(date);
    this.flushActiveStateToStore();
    notifyChanged();
  }

  getCurrentSeason() {
    return this.getService()?.getCurrentSeason() ?? null;
  }

  createDefaultIfMissing() {
    const exists = this.store.calendars?.[DEFAULT_CALENDAR_ID] && this.store.states?.[DEFAULT_CALENDAR_ID];

    if (exists) {
      if(!this.store.activeId) return this.selectActive(DEFAULT_CALENDAR_ID);
      return Promise.resolve();
    }

    const def = makeDefaultCalendarDef();
    const st = makeDefaultCalendarState();

    return this.upsertCalendar(def, st, true).then(() => {
      this.instantiateActiveService();
      notifyChanged();
    });
  }

  /* =============================================================
   * Calendar CRUD
   * ========================================================== */

  _generateUniqueId(baseId) {
    const safe = String(baseId || "calendar").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "calendar";
    const exists = (id) => !!this.store.calendars?.[id];

    if(!exists(safe)) return safe;

    let i = 2;
    while (exists(`${safe}-${i}`)) i++;
    return `${safe}-${i}`;
  }

  async createCalendar({name = "New Calendar", makeActive = false} = {}) {
    const def = makeDefaultCalendarDef();
    const state = makeDefaultCalendarState();

    def.id = this._generateUniqueId(name);
    def.name = name;

    await this.upsertCalendar(def, state, makeActive);
    return def.id;
  }

  async duplicateCalendar(sourceId, { makeActive = false } = {}) {
    const srcDef = this.store.calendars?.[sourceId];
    const srcState = this.store.states?.[sourceId];

    if (!srcDef || !srcState) {
      ui.notifications?.warn(t("SHARDSCalendar.Error.UnknownId"));
      return null;
    }

    const def = structuredClone(srcDef);
    const state = structuredClone(srcState);

    const baseName = `${def.name || "Calendar"} Copy`;
    def.id = this._generateUniqueId(baseName);
    def.name = baseName;

    await this.upsertCalendar(def, state, makeActive);
    return def.id;
  }

  async deleteCalendar(id) {
    if (!id) return;

    const existed = !!this.store.calendars?.[id] || !!this.store.states?.[id];
    if (!existed) return;

    delete this.store.calendars[id];
    delete this.store.states[id];

    const wasActive = this.store.activeId === id;

    if (wasActive) {
      const remainingIds = Object.keys(this.store.calendars ?? {});
      this.store.activeId = remainingIds[0] ?? null;
    }

    await saveCalendarStore(this.store);

    this.persistAndMaybeReinstantiate();
    
    notifyChanged();
  }

  /* =============================================================
   * Events API
   * ========================================================== */

  canEditEvents() {
    return !!game.user?.isGM;
  }

  canViewPrivateEvents() {
    return !!game.user?.isGM;
  }

  listEvents() {
    const svc = this.getService();
    if(!svc) return [];
    const includePrivate = this.canViewPrivateEvents();
    return (svc.getEvents?.() ?? []).filter(e => includePrivate || e.isPublic);
  }

  getEvent(id) {
    const svc = this.getService();
    if(!svc) return null;
    const e = svc.getEvent?.(id) ?? null;
    if(!e) return null;
    if(!this.canViewPrivateEvents() && !e.isPublic) return null;
    return e;
  }

  getEventsForDay(day) {
    const svc = this.getService();
    if(!svc) return [];
    return svc.getEventsForDay?.(day, { includePrivate: this.canViewPrivateEvents() }) ?? [];
  }

  createEvent(data) {
    if (!this.canEditEvents()) {
      ui.notifications?.warn(t("SHARDSCalendar.GM.Only.CreateEvents"));
      return null;
    }
    const svc = this.getService();
    if (!svc?.upsertEvent) return null;
    return svc.upsertEvent({ ...data, id: undefined });
  }

  updateEvent(id, patch) {
    if (!this.canEditEvents()) {
      ui.notifications?.warn(t("SHARDSCalendar.GM.Only.EditEvents"));
      return null;
    }
    const svc = this.getService();
    if (!svc?.getEvent || !svc?.upsertEvent) return null;

    const prev = svc.getEvent(id);
    if (!prev) return null;
    return svc.upsertEvent({ ...prev, ...patch, id });
  }

  deleteEvent(id) {
    if (!this.canEditEvents()) {
      ui.notifications?.warn(t("SHARDSCalendar.GM.Only.DeleteEvents"));
      return;
    }
    const svc = this.getService();
    svc?.deleteEvent?.(id);
  }

  /**
   * WEATHER
   */

  getWeather(dayIndex) {
    return getWeatherForDay(dayIndex);
  }

  async getOrGenerateWeather(dayIndex) {
    return fetchOrGenerateWeather(this, dayIndex);
  }

  async overrideWeather(dayIndex, patch) {
    await overrideWeather(dayIndex, patch);
  }

  async clearWeatherOverride(dayIndex) {
    await clearOverride(dayIndex);
  }

  /* --- Internals --- */

  instantiateActiveService() {
    this.unsubscribeActive?.();
    this.unsubscribeActive = undefined;
    this.activeService = null;

    const activeId = this.store.activeId;
    if (!activeId) return;

    const definition = this.store.calendars[activeId];
    const state = this.store.states[activeId];

    if(!definition || !state) {
      log.warn("Active calendar missing def/state; clearing activeId", activeId, {hasDef: !!definition, hasState: !!state});
      this.store.activeId = null;
      saveCalendarStore(this.store);
      return;
    }

    this.activeService = new CalendarService(definition, state);

    this.unsubscribeActive = this.activeService.onChange((newState) => {
      this.store.states[activeId] = structuredClone(newState);
      void saveCalendarStore(this.store);
      this.maybeLogToChat();
      notifyChanged();
    })
  }

  flushActiveStateToStore() {
    const activeId = this.store.activeId;
    if (!activeId || !this.activeService) return;
    this.store.states[activeId] = structuredClone(this.activeService.getState());
    void saveCalendarStore(this.store);
  }

  persistAndMaybeReinstantiate(recreate) {
    const p = saveCalendarStore(this.store);
    if (recreate) this.instantiateActiveService();
    return p;
  }

  maybeLogToChat() {
    const chatLogEnabled = getSetting(SETTINGS_KEYS.CHATLOG);
    if (!chatLogEnabled || !this.activeService) return;

    const def = this.getActiveDefinition();
    const state = this.activeService.getState().current;
    const label = def ? def.name : "Calendar";

    const text = tf("SHARDSCalendar.Chat.Changed", {
      label,
      y: state.year,
      m: state.monthIndex + 1,
      d: state.day,
      h: state.hour,
      min: state.minute
    })

    ChatMessage.create({ content: text}).catch(() => {});
  }
}

export const getCalendarService = () => getCalendarApi().getService();
export const getCalendarActiveId = () => getCalendarApi().getActiveId();