/**
 * 
 */

export class CalendarService {

  constructor(definition, state) {
    this.definition = definition;
    this.state = state;
    this.listeners = new Set();
  }

  get minutesPerDay() {
    return this.definition.hoursPerDay * this.definition.minutesPerHour;
  }

  get minutesPerYear() {
    const daysPerYear = this.definition.months.reduce((sum, m) => sum + m.length, 0);
    return daysPerYear * this.minutesPerDay;
  }

  get daysPerYear() {
    return this.definition.months.reduce((sum, m) => sum + (m.length ?? 0), 0);
  }

  absoluteDayFromEpoch(date) {
    // date: { year, monthIndex, day }
    const d = { year: date.year ?? 0, monthIndex: date.monthIndex ?? 0, day: date.day ?? 1, hour: 0, minute: 0 };
    return Math.floor(this.absoluteDayFromEpoch(d) / this.minutesPerDay);
  }

  normalizeDayDate(d) {
    // simple clamp
    const y = Number.isFinite(+d?.year) ? Math.floor(+d.year) : 0;
    const mi = Number.isFinite(+d?.monthIndex) ? Math.floor(+d.monthIndex) : 0;
    const monthLen = this.definition.months?.[mi]?.length ?? 30;
    const day = Number.isFinite(+d?.day) ? Math.floor(+d.day) : 1;
    return {
      year: y,
      monthIndex: Math.max(0, Math.min(mi, (this.definition.months?.length ?? 1) -1)),
      day: Math.max(1, Math.min(day, monthLen))
    };
  }

  ensureEventsArray() {
    if (!this.state) this.state = { current: { ...this.definition.startDate }};
    if (!Array.isArray(this.state.events)) this.state.events = [];
  }

  // --- EVENTS API ---
  getEvents() {
    this.ensureEventsArray();
    return this.state.events;
  }

  getEvent(id) {
    this.ensureEventsArray();
    return this.state.events.find(e => e.id === id) ?? null;
  }

  upsertEvent(evt) {
    this.ensureEventsArray();

    const id = evt?.id ?? (crypto?.randomUUID?.() ?? `evt-${Date.now()}`);
    const start = this.normalizeDayDate(evt?.start ?? {});
    const end = this.normalizeDayDate(evt?.end ?? start);

    const sAbs = this.absoluteDayFromEpoch(start);
    const eAbs = this.absoluteDayFromEpoch(end);
    const fixed = eAbs < sAbs ? { start: end, end: start } : { start, end };

    const next = {
      id,
      title: String(evt?.title ?? "Untitled").trim(),
      description: String(evt?.description ?? ""),
      color: String(evt?.color ?? "#c9593f"),
      isPublic: !!evt?.isPublic,
      ...fixed
    };

    const idx = this.state.events.findIndex(e => e.id === id);
    if(idx >= 0) this.state.events[idx] = next;
    else this.state.events.push(next);

    this.emit();
    return next;
  }

  deleteEvent(id) {
    this.ensureEventsArray();

    const before = this.state.events.length;
    this.state.events = this.state.events.filter(e => e.id !== id);
    if (this.state.events.length !== before) this.emit();
  }

  /**
   * Return "active" events on a given day
   * @param {object} day {year, monthIndex, day}
   * @param {object} opts {includePrivate?: boolean}
   */
  getEventsForDay(day, opts = {}) {
    this.ensureEventsArray();
    const includePrivate = !!opts.includePrivate;

    const abs = this.absoluteDayFromEpoch(this.normalizeDayDate(day));
    return this.state.events.filter(e => includePrivate || e.isPublic).filter(e => {
      const s = this.absoluteDayFromEpoch(e.start);
      const en = this.absoluteDayFromEpoch(e.end ?? e.start);
      return s <= abs && abs <= en;
    }).sort((a, b) => this.absoluteDayFromEpoch(a.start) - this.absoluteDayFromEpoch(b.start));
  }

  absoluteMinutesFromEpoch(date) {
    const minutesFromYears = date.year * this.minutesPerYear;
    const minutesFromMonthsBefore = this.definition.months.slice(0, date.monthIndex).reduce((sum, m) => sum + m.length, 0) * this.minutesPerDay;
    const minutesFromDays = (date.day - 1) * this.minutesPerDay;
    const minutesFromHours = date.hour * this.definition.minutesPerHour;
    return (
      minutesFromYears + minutesFromMonthsBefore + minutesFromDays + minutesFromHours + date.minute
    )
  }

  daysSinceStart() {
    const currentAbs = this.absoluteMinutesFromEpoch(this.state.current);
    const startAbs = this.absoluteMinutesFromEpoch(this.definition.startDate);
    return (currentAbs - startAbs) / this.minutesPerDay;
  }

  phaseForMoon(moon) {
    const phase = this.daysSinceStart() / moon.synodicDays + (moon.phaseOffset ?? 0);
    return phase - Math.floor(phase);
  }

  getMoons() {
    return this.definition.moons.map((moon) => ({
      name: moon.name,
      phase: this.phaseForMoon(moon)
    }));
  }

  getState() {
    return this.state;
  }

  getCurrentSeason() {
    const def = this.definition;
    const state = this.state?.current;
    if (!def || !state || !def.months?.length || !def.seasons?.length) return null;

    const dayOfYear = (m, d) => {
      let sum = 0;
      for (let i = 0; i < m; i++) sum += def.months[i]?.length ?? 0;
      return sum + Math.max(1, Math.floor(d || 1));
    }

    const seasons = [...def.seasons].sort((a, b) => dayOfYear(a.start.monthIndex, a.start.day) - dayOfYear(b.start.monthIndex, b.start.day))

    if (seasons.length === 1) return seasons[0];

    const cur = dayOfYear(state.monthIndex ?? 0, state.day ?? 1);
    let current = seasons[0];
    for (const s of seasons) {
      const sDay = dayOfYear(s.start.monthIndex, s.start.day);
      if (sDay <= cur) current = s;
      else break;
    }
    return current ?? null;
  }

  setDate(next) {
    this.state = { current: { ...next } };
    this.emit();
  }

  advanceTime(delta) {
    const next = { ...this.state.current };
    next.minute += delta.minute ?? 0;
    next.hour += delta.hour ?? 0;
    next.day += delta.day ?? 0;

    if (next.minute >= this.definition.minutesPerHour || next.minute < 0) {
      next.hour += Math.floor(next.minute / this.definition.minutesPerHour);
      next.minute = ((next.minute % this.definition.minutesPerHour) + this.definition.minutesPerHour) % this.definition.minutesPerHour;
    }

    if (next.hour >= this.definition.hoursPerDay || next.hour < 0) {
      next.day += Math.floor(next.hour / this.definition.hoursPerDay);
      next.hour = ((next.hour % this.definition.hoursPerDay) + this.definition.hoursPerDay) % this.definition.hoursPerDay;
    }

    const monthLengths = this.definition.months.map((m) => m.length);

    while (next.day > monthLengths[next.monthIndex]) {
      next.day -= monthLengths[next.monthIndex];
      next.monthIndex++;
      if(next.monthIndex >= monthLengths.length) {
        next.monthIndex = 0;
        next.year++;
      }
    }

    while (next.day <= 0) {
      next.monthIndex--;
      if (next.monthIndex < 0) {
        next.monthIndex = monthLengths.length - 1;
        next.year--;
      }
      next.day += monthLengths[next.monthIndex];
    }

    this.setDate(next)
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit() {
    for (const callback of this.listeners) callback(this.state);
  }
}