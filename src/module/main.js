import { getSetting, registerSettings, SETTINGS_KEYS } from "@lib/settings";
import { getCalendarApi } from "@core/calendar/api";
import log from "@utils/logger";
import { mountCalendarButton } from "@ui/calendar/widgets/calendarButton";
import { mountCalendarLauncher } from "@ui/calendar/widgets/calendarLauncher";
import { refreshCalendarUi } from "@ui/calendarUiStore";
import { formatCalendarDate } from "@utils/formatDate";
import { dayOfYear } from "@ui/calendar/calendarMath";
import { calcPhase, labelForBucket, phaseBucket } from "@ui/moons/moonSvg";

Hooks.once("init", () => {
  registerSettings();
  log.i`init`;
});

Hooks.once("ready", async () => {
  game.shardsCalendar = getCalendarApi();
  game.shardsCalendar.formatDate = (def, current, options) => formatCalendarDate(def, current, options);
  game.shardsCalendar.refreshUi = refreshCalendarUi;
  game.shardsCalendar.getMoons = () => {
    const api = getCalendarApi();
    const def = api.getActiveDefinition();
    const state = api.getActiveState();
    if (!def || !state) return [];

    const doy = dayOfYear(def, state.current.monthIndex ?? 0, state.current.day ?? 1);

    return (def.moons ?? []).map((m) => {
      const phase = calcPhase({ dayNumber: doy, cycle: m.cycle, offset: m.offset });
      const bucket = phaseBucket(phase);
      return {
        name: m.name,
        color: m.color,
        phase,
        label: labelForBucket(bucket),
      };
    });
  };
  
  mountCalendarButton();
  mountCalendarLauncher();
  refreshCalendarUi();

  if (getSetting(SETTINGS_KEYS.WEATHER_ENABLED)) {
    const api = game.shardsCalendar;
    const state = api.getActiveState();
    const def = api.getActiveDefinition();
    if (state && def) {
      const current = state.current;
      const doy = dayOfYear(def, current.monthIndex ?? 0, current.day ?? 1);
      const dayIndex = (current.year ?? 0) * 365 + doy;
      api.getOrGenerateWeather(dayIndex)
        .then(() => Hooks.callAll("shards-calendar:weather:changed"))
        .catch(() => {});
    }
  }
})

Hooks.on("closeSettingsConfig", () => {
  mountCalendarLauncher();
});