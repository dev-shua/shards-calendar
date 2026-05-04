import { mount, unmount } from "svelte";
import CalendarSettings from "@ui/calendar/settings/CalendarSettings.svelte";
import { refreshCalendarUi } from "@ui/calendarUiStore";
import { dialogConfirm } from "@ui/widgets/DialogConfirm";
import { t } from "@utils/i18n";

export class CalendarSettingsApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "shards-calendar-fullsettings",

    window: {
      title: "Calendar Settings",
      resizable: true,
    },

    position: {
      width: 1100,
      height: 720,
    },
  };

  _svelte = null;
  _isDirty = false;
  _onChanged = () => refreshCalendarUi();

  async _renderHTML() {
    const root = document.createElement("div");
    root.classList.add("calendar-root");

    return root;
  }

  async _replaceHTML(_result, content) {
    const target = content instanceof HTMLElement ? content: content?.[0] ?? content;

    if (this._svelte) unmount(this._svelte);
    this._svelte = mount(CalendarSettings, { target, props: {
      setDirty: (v) => (this._isDirty = !!v)
    } });

    if (!this._hooked) {
      this._hooked = true;
      Hooks.on("shards-calendar:changed", this._onChanged);
    }
    refreshCalendarUi();
  }

  async close(options) {
    if (this._isDirty) {
      const ok = await dialogConfirm.confirm({
        content: `<p>${t("SHARDSCalendar.Alerts.UnsavedChanges")}</p>`,
        yes: { label: "Close", icon: "fa-solid fa-check" },
      })
      if (!ok) return this;
    }
    if (this._hooked) Hooks.off("shards-calendar:changed", this._onChanged);
    this._hooked = false;
    if (this._svelte) unmount(this._svelte);
    this._svelte = null;
    return super.close(options);
  }
}