export function getSeasonStartMarkersForDay(def, date) {
  if (!def?.seasons?.length || !date) return [];

  const mi = Number(date.monthIndex ?? 0);
  const d = Number(date.day ?? 1);

  const out = [];
  for (const s of def.seasons) {
    const sm = Number(s?.start?.monthIndex ?? -1);
    const sd = Number(s?.start?.day ?? -1);
    if (sm === mi && sd === d) {
      out.push({
        id: `season-start:${s.id ?? s.name ?? `${sm}-${sd}`}`,
        kind: "system",
        systemType: "seasonStart",
        title: `${s.name ?? "Season"}`,
        color: s.color ?? "#6aa6ff",
        season: s,
        start: { year: date.year ?? 0, monthIndex: mi, day: d },
        end: { year: date.year ?? 0, monthIndex: mi, day: d },
        isPublic: true,
        editable: false,
      });
    }
  }

  return out;
}