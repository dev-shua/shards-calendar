// calendarValidation.js
export function validateCalendar(def) {
  const errors = [];
  const warnings = [];

  if (!def.months?.length)
    errors.push("Calendar must have at least one month.");

  if (def.months?.some(m => !m.name?.trim()))
    errors.push("All months must have a name.");

  if (def.weekdays?.length === 0)
    errors.push("Calendar must define weekdays.");

  if ((def.seasons ?? []).some(s => !s.name?.trim()))
    warnings.push("Some seasons have no name.");

  return { errors, warnings };
}
