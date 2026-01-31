import { mount, unmount } from "svelte";
import ViewCalendar from "@ui/calendar/views/ViewCalendar.svelte";
import { refreshCalendarUi } from "@ui/calendarUiStore";

export class CalendarApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "shards-calendar-view",
    window: {
      title: "Calendar",
      resizable: true,
    },
    position: {
      width: 1100,
      height: 720,
    },
  };

  _svelte = null;
  _hooked = false;
  _onChanged = () => refreshCalendarUi();

  async _renderHTML() {
    const root = document.createElement("div");
    root.classList.add("calendar-view-root");
    return root;
  }

  async _replaceHTML(_result, content) {
    const target = content instanceof HTMLElement ? content : content?.[0] ?? content;

    if (this._svelte) unmount(this._svelte);
    this._svelte = mount(ViewCalendar, { target });

    if (!this._hooked) {
      this._hooked = true;
      Hooks.on("shards-calendar:changed", this._onChanged);
    }

    refreshCalendarUi();
  }

  async close(options) {
    if (this._hooked) Hooks.off("shards-calendar:changed", this._onChanged);
    this._hooked = false;

    if (this._svelte) unmount(this._svelte);
    this._svelte = null;

    return super.close(options);
  }
}
