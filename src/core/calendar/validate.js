import { t } from "@utils/i18n";

// calendarValidation.js
export function validateCalendar(def) {
  const errors = [];
  const warnings = [];

  if (!def.months?.length)
    errors.push(t("SHARDSCalendar.Error.NeedAtLeastOneMonth"));

  if (def.months?.some(m => !m.name?.trim()))
    errors.push(t("SHARDSCalendar.Error.MonthsNeedName"));

  if (def.weekdays?.length === 0)
    errors.push(t("SHARDSCalendar.Error.NeedWeekdays"));

  if ((def.seasons ?? []).some(s => !s.name?.trim()))
    warnings.push(t("SHARDSCalendar.Error.SeasonsNeedName"));

  return { errors, warnings };
}
