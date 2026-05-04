// calendarLauncher.js
import { mount, unmount } from "svelte";

import ViewCalendar from "@ui/calendar/views/ViewCalendar.svelte";
import CalendarLauncherChip from "./CalendarLauncherChip.svelte";
import { refreshCalendarUi } from "@ui/calendarUiStore";
import CalendarSettings from "@ui/calendar/settings/CalendarSettings.svelte";
import { getSetting, SETTINGS_KEYS } from "@lib/settings";
import { dialogConfirm } from "@ui/widgets/DialogConfirm";
import { t } from "@utils/i18n";

// --------------------
// Settings (à brancher plus tard)
// --------------------
/**
 * access: "none" | "gm" | "player"
 * mode: "button" | "chip"
 *
 * Pour l’instant on met des defaults; tu peux remplacer par game.settings.get(...)
 */
function getLauncherConfig() {
  // Exemple futur:
  // const access = game.settings.get("shards-calendar", "launcherAccess");
  // const mode = game.settings.get("shards-calendar", "launcherMode");
  // const chipEnabled = game.settings.get("shards-calendar", "chipEnabled");

  return {
    enabled: true,
    access: getSetting(SETTINGS_KEYS.LAUNCHER_ACCESS), // "gm" / "player" / "none"
    mode: "chip",     // "button" / "chip"
  };
}

function canShowLauncher({ enabled, access }) {
  if (!enabled) return false;
  if (access === "none") return false;
  if (access === "gm") return !!game.user?.isGM;
  if (access === "player") return true;
  return false;
}

// --------------------
// Apps openers
// --------------------
let _calendarApp = null;
let _settingsApp = null;
let _isDirty = false;

function openCalendar() {
  game.shardsCore?.openWindow({
    id: "shards-calendar-view",
    title: t("SHARDSCalendar.Title"),
    icon: "fa-solid fa-calendar-days",
    initialW: 1100,
    initialH: 720,
    resizable: true,
    render: (container) => {
      const instance = mount(ViewCalendar, { target: container });
      Hooks.on("shards-calendar:changed", refreshCalendarUi);
      refreshCalendarUi();
      return () => {
        Hooks.off("shards-calendar:changed", refreshCalendarUi);
        unmount(instance);
      };
    },
  });
}

function openSettings() {
  if (!game.user?.isGM) return;
  _isDirty = false;

  game.shardsCore?.openWindow({
    id: "shards-calendar-settings",
    title: t("SHARDSCalendar.SettingsUI.Open"),
    icon: "fa-solid fa-gear",
    initialW: 1100,
    initialH: 720,
    resizable: true,
    render: (container) => {
      const instance = mount(CalendarSettings, {
        target: container,
        props: {
          setDirty: (v) => (_isDirty = !!v),
        },
      });
      Hooks.on("shards-calendar:changed", refreshCalendarUi);
      refreshCalendarUi();
      return () => {
        Hooks.off("shards-calendar:changed", refreshCalendarUi);
        unmount(instance);
      };
    },
    onBeforeClose: async () => {
      if (!_isDirty) return true;
      const ok = await dialogConfirm.confirm({
        content: `<p>${t("SHARDSCalendar.Alerts.UnsavedChanges")}</p>`,
        yes: { label: "Close", icon: "fa-solid fa-check" },
      });
      return ok;
    },
  });
}
// --------------------
// Drag / Snap engine
// --------------------
const POS_KEY = "SHARDSCalendar.launcher.pos";

let root = null;           // wrapper DOM fixed
let svelte = null;         // mounted component
let dragging = false;
let moved = false;
let pointerId = null;
let dragOff = { x: 0, y: 0 };

let rafId = null;
let pendingX = 0;
let pendingY = 0;

const SNAP_TOP_PX = 10;
const TOP_Y = 0;
const DETACH_PX = 150;
let snappedTop = false;

function loadPos() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePos(pos) {
  try {
    if (pos) localStorage.setItem(POS_KEY, JSON.stringify(pos));
    else localStorage.removeItem(POS_KEY);
  } catch {}
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function setSnappedTop(next) {
  snappedTop = !!next;
  root?.classList.toggle("is-snapped-top", snappedTop);

  if (!root) return;

  if (snappedTop) {
    root.style.borderTopLeftRadius = "0";
    root.style.borderTopRightRadius = "0";
    root.style.borderBottomLeftRadius = "12px";
    root.style.borderBottomRightRadius = "12px";
    // root.style.background = "rgba(0,0,0,0.55)";
    // root.style.borderBottomColor = "rgba(255,255,255,0.25)";
  } else {
    root.style.borderRadius = "12px";
    // root.style.background = "rgba(0,0,0,0.35)";
    // root.style.borderColor = "rgba(255,255,255,0.18)";
  }
}

function getBounds() {
  if (!root) return { maxX: 0, maxY: 0 };
  const rect = root.getBoundingClientRect();
  const w = rect.width || root.offsetWidth || 44;
  const h = rect.height || root.offsetHeight || 44;
  const maxX = window.innerWidth - w - 6;
  const maxY = window.innerHeight - h - 6;
  return { maxX, maxY };
}

function setPos(x, y) {
  if (!root) return;

  pendingX = x;
  pendingY = y;

  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    root.style.transform = `translate3d(${Math.round(pendingX)}px, ${Math.round(pendingY)}px, 0)`;
    rafId = null;
  });
}

function shouldIgnoreDrag(ev) {
  // si on clique une zone interactive interne, on laisse faire l’action (pas de drag)
  const t = ev.target;
  if (!(t instanceof Element)) return false;
  return !!t.closest("button, a, input, select, textarea, [data-no-drag]");
}

function onPointerDown(ev) {
  if (!root) return;
  if (shouldIgnoreDrag(ev)) return;

  dragging = true;
  moved = false;
  pointerId = ev.pointerId;

  root.classList.add("is-dragging");
  root.setPointerCapture(pointerId);

  const rect = root.getBoundingClientRect();
  dragOff = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  ev.preventDefault();
}

function onPointerMove(ev) {
  if (!dragging || !root || ev.pointerId !== pointerId) return;

  const { maxX, maxY } = getBounds();

  const x = clamp(ev.clientX - dragOff.x, 6, maxX);
  let yRaw = clamp(ev.clientY - dragOff.y, 0, maxY);
  let y = yRaw;

  if (Math.abs(x - pendingX) + Math.abs(y - pendingY) > 2) moved = true;

  if (snappedTop) {
    y = TOP_Y;
    if (yRaw > SNAP_TOP_PX + DETACH_PX) {
      setSnappedTop(false);
      y = yRaw;
    }
  } else {
    if (yRaw <= SNAP_TOP_PX) {
      setSnappedTop(true);
      y = TOP_Y;
    }
  }

  setPos(x, y);
}

function onPointerUp(ev) {
  if (!dragging || !root || ev.pointerId !== pointerId) return;

  dragging = false;
  root.classList.remove("is-dragging");

  try { root.releasePointerCapture(pointerId); } catch {}
  pointerId = null;

  const r = root.getBoundingClientRect();
  setSnappedTop(r.top <= SNAP_TOP_PX);
  savePos({ x: Math.round(r.left), y: Math.round(r.top) });

  // pas de click auto ici: c’est le composant interne qui gère ses boutons
}

// --------------------
// Mount / Unmount
// --------------------
function buildRoot() {
  const el = document.createElement("div");
  el.className = "shards-calendar-launcher";

  el.style.position = "fixed";
  el.style.left = "0";
  el.style.top = "0";
  el.style.zIndex = "100000";
  el.style.display = "inline-flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  // el.style.border = "1px solid rgba(255,255,255,0.18)";
  // el.style.background = "rgba(0,0,0,0.35)";
  // el.style.backdropFilter = "blur(4px)";
  el.style.cursor = "grab";
  el.style.borderRadius = "12px";

  el.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  return el;
}

function mountSvelte() {
  if (!root) return;

  if (svelte) unmount(svelte);

  svelte = mount(CalendarLauncherChip, {
    target: root,
    props: {
      openCalendar,
      openSettings,
    },
  });
}

export function mountCalendarLauncher() {
  const cfg = getLauncherConfig();
  if (!canShowLauncher(cfg)) {
    unmountCalendarLauncher();
    return;
  }

  if (root && !root.isConnected) {
    // nettoyage si hot reload / rerender
    try {
      root.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    } catch {}
    root = null;
  }

  if (root && root.isConnected) {
    // si on change mode via settings, on remount juste le contenu
    mountSvelte();
    return;
  }

  root = buildRoot();
  document.body.appendChild(root);

  mountSvelte();

  const saved = loadPos();
  if (saved) {
    setPos(saved.x, saved.y);
    setSnappedTop(saved.y <= SNAP_TOP_PX);
  } else {
    const { maxX } = getBounds();
    const x = Math.min(maxX, window.innerWidth - 60);
    const y = 12;
    setPos(x, y);
    setSnappedTop(y <= SNAP_TOP_PX);
  }
}

export function unmountCalendarLauncher() {
  if (!root) return;

  try {
    root.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  } catch {}

  if (svelte) {
    try { unmount(svelte); } catch {}
    svelte = null;
  }

  root.remove();
  root = null;
}
