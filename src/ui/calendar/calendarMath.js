export function clampInt(n, min, max) {
  const v = Number(n);
  const i = Number.isFinite(v) ? Math.floor(v) : min;
  return Math.max(min, Math.min(max, i));
}

export function daysInMonth(def, monthIndex) {
  const raw = Number(def?.months?.[monthIndex]?.length ?? 30);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 30;
}

export function daysInYear(def) {
  const months = def?.months ?? [];
  let sum = 0;
  for (const m of months) sum += Number(m?.length ?? 0);
  // fallback safe
  return sum > 0 ? Math.floor(sum) : 360;
}

/** dayOfYear: 0-based within year */
export function dayOfYear(def, monthIndex, day) {
  let doy = 0;
  for (let i = 0; i < (def?.months?.length ?? 0); i++) {
    if (i < monthIndex) doy += Number(def.months[i]?.length ?? 0);
  }
  doy += Math.max(0, Number(day ?? 1) - 1);
  return Math.floor(doy);
}

/** Proper modulo that works with negative years too */
function mod(n, m) {
  return ((n % m) + m) % m;
}

/** Absolute day number since year 0 (0-based) */
export function dayNumber(def, year, monthIndex, day) {
  const y = Number.isFinite(Number(year)) ? Math.floor(Number(year)) : 0;
  return y * daysInYear(def) + dayOfYear(def, monthIndex, day);
}

/**
 * weekday index 0..(weekdays-1) for a given year/month/day.
 * firstWeekdayIndex option means "which label is index 0 in the UI" (start of week).
 */
export function weekdayIndex(def, year, monthIndex, day) {
  const wdCount = Math.max(1, def?.weekdays?.length ?? 7);
  const first = clampInt(def?.options?.firstWeekdayIndex ?? 0, 0, wdCount - 1);

  const raw = mod(dayNumber(def, year, monthIndex, day), wdCount);
  // shift so the week starts on firstWeekdayIndex
  return mod(raw - first, wdCount);
}

/**
 * Build a grid of day numbers or null for blanks.
 * Size is dynamic: 4/5/6 rows (28/35/42 cells) depending on the month.
 *
 * Backward compatible:
 * - buildMonthGrid(def, monthIndex)
 * - buildMonthGrid(def, year, monthIndex)
 */
export function buildMonthGrid(def, a, b) {
  const wdCount = Math.max(1, def?.weekdays?.length ?? 7);

  // backward compat detection
  let year = 0;
  let monthIndex = 0;

  if (typeof b === "number") {
    year = a ?? 0;
    monthIndex = b ?? 0;
  } else {
    monthIndex = a ?? 0;
  }

  const total = daysInMonth(def, monthIndex);
  const startW = weekdayIndex(def, year, monthIndex, 1);

  const cells = [];

  // leading blanks
  for (let i = 0; i < startW; i++) cells.push(null);

  // days
  for (let d = 1; d <= total; d++) cells.push(d);

  // trailing blanks to complete last row
  const rows = Math.max(1, Math.ceil(cells.length / wdCount));
  const targetSize = rows * wdCount;
  while (cells.length < targetSize) cells.push(null);

  return cells;
}
