import { registerSettings } from "@lib/settings";
import { showWelcome } from "@lib/welcome";
import { getCalendarApi } from "@core/calendar/api";
import log from "@utils/logger";
import { CalendarSettingsApp } from "@ui/calendar/apps/CalendarSettingsApp";
import { mountCalendarButton } from "@ui/calendar/widgets/calendarButton";
import { mountCalendarLauncher } from "@ui/calendar/widgets/calendarLauncher";

Hooks.once("init", () => {
  registerSettings();
  log.i`init`;
});

Hooks.once("ready", () => {
  showWelcome();
  game.shardsCalendar = getCalendarApi();
  mountCalendarButton();
  if(true) {
    if(game.user?.isGM) {
      new CalendarSettingsApp().render(true);
    }
  }
})

Hooks.on("closeSettingsConfig", () => {
  mountCalendarLauncher();
});