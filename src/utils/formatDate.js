import log from "./logger";

function weekdayIndex(def, opts, current) {
  const wdCount = Math.max(1, def.weekdays?.length ?? 7);
  const first = Number.isInteger(opts?.firstWeekdayIndex) ? opts.firstWeekdayIndex : 0;

  let doy = 0;
  for (let i = 0; i < (def.months?.length ?? 0); i++) {
    if (i < (current.monthIndex ?? 0)) doy += Number(def.months[i]?.length ?? 0);
  }
  doy += Math.max(0, Number(current.day ?? 1) - 1);

  return (first + (doy % wdCount)) % wdCount;
}

export function formatCalendarDate(def, current, opts) {
  if (!def || !current) return "—";

  const fmt = (typeof opts?.dateFormat === "string" && opts.dateFormat.trim()) || "{wd} {d} {m}, {y}";

  const mIndex = Number(current.monthIndex ?? 0);
  const monthName = def.months?.[mIndex]?.name ?? `M${mIndex + 1}`;
  const wd = def.weekdays?.length ? def.weekdays[weekdayIndex(def, opts, current)] ?? "" : "";
  const y = current.year ?? 0;
  const d = current.day ?? 1;

  return String(fmt).replace(/\{wd\}/g, wd).replace(/\{d\}/g, String(d)).replace(/\{m\}/g, monthName).replace(/\{y\}/g, String(y));
}