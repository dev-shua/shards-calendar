<script>
  import { calendarUi, refreshCalendarUi } from "@ui/calendarUiStore";
  import { formatCalendarDate } from "@utils/formatDate";
  import DisplayMoon from "@ui/moons/DisplayMoon.svelte";
  import { calcPhase } from "@ui/moons/moonSvg";
  import { dayOfYear } from "@ui/calendar/calendarMath";
  import { getSetting, SETTINGS_KEYS } from "@lib/settings";
  import { getWeatherForDay } from "@core/weather/store";
  import { onMount, onDestroy, mount, unmount } from "svelte";
  import WeatherOverridePopup from "@ui/calendar/widgets/WeatherOverridePopup.svelte";

  export let openCalendar = () => {};
  export let openSettings = () => {};
  let weatherRefresh = 0;
  
  $: isGM = !!game.user?.isGM;

  $: activeId = $calendarUi.activeId;
  $: def = activeId ? $calendarUi.defsById?.[activeId] : null;
  $: current = $calendarUi.current ?? null;

  $: options = def?.options ?? {};
  $: formattedDate = (def && current) ? formatCalendarDate(def, current, options) : "No active calendar";
  $: canOpenCalendar = isGM || getSetting(SETTINGS_KEYS.LAUNCHER_ACCESS) === "player";
  
  $: dayIndex = (def && current) ? (current.year ?? 0) * 365 + doy0 : 0
  $: weather = (() => {
    const _ = weatherRefresh;
    return dayIndex ? getWeatherForDay(dayIndex) : null;
  })();

  $: resolvedPrecip = (() => {
    if (!weather?.precipitationId || !def) return null;
    const seasonWeather = def.weatherSeasons?.[season?.id];
    if (!seasonWeather) return null;
    const all = [
      ...(seasonWeather.precipitations ?? []),
      ...(seasonWeather.coldPrecipitations ?? []),
    ];
    return all.find(p => p.id === weather.precipitationId) ?? null;
  })();

  let hookId;
  let dateHookId;
  
  onMount(() => {
    hookId = Hooks.on("shards-calendar:weather:changed", () => {
      weatherRefresh++;
    });
    dateHookId = Hooks.on("shards-calendar:date:changed", () => {
      refreshCalendarUi();
    });
  });

  function computeSeason(def, current) {
    const seasons = def?.seasons ?? [];
    if (!def || !current || !seasons.length) return null;

    const totalMonths = def.months?.length ?? 0;
    if (!totalMonths) return null;

    const curDoy = dayOfYear(def, current.monthIndex ?? 0, current.day ?? 1);

    const items = seasons
      .map((s) => {
        const mi = Number(s?.start?.monthIndex ?? 0);
        const d = Number(s?.start?.day ?? 1);
        return { s, doy: dayOfYear(def, mi, d) };
      })
      .sort((a, b) => a.doy - b.doy);

    let chosen = items[items.length - 1]?.s ?? null;
    for (const it of items) {
      if (it.doy <= curDoy) chosen = it.s;
      else break;
    }
    return chosen;
  }

  $: season = computeSeason(def, current);

  // moons
  $: doy0 = (def && current) ? dayOfYear(def, current.monthIndex ?? 0, current.day ?? 1) : 0;
  $: moons = (def?.moons ?? []).map((m) => ({
    moon: m,
    phase: calcPhase({ dayNumber: doy0, cycle: m.cycle, offset: m.offset }),
  }));

  async function stepDays(delta) {
    const api = game?.shardsCalendar;
    if (!api?.stepDays) {
      ui.notifications?.error("Calendar API missing: stepDays()");
      return;
    }
    await api.stepDays(delta);
    refreshCalendarUi();
  }

  function openWeatherOverride() {
    if (!isGM) return;
    game.shardsCore?.openWindow({
      id: "shards-weather-override",
      title: game.i18n.localize("SHARDSCalendar.Weather.Override.Title"),
      icon: "fa-solid fa-cloud-sun",
      initialW: 320,
      initialH: 360,
      render: (container) => {
        const instance = mount(WeatherOverridePopup, {
          target: container,
          props: {
            weather,
            resolvedPrecip,
            dayIndex,
            seasonWeather: def?.weatherSeasons?.[season?.id],
            onClose: () => {
              game.shardsCore?.closeWindow("shards-weather-override");
              weatherRefresh++;
            },
          },
        });
        return () => unmount(instance);
      },
    });
  }

  onDestroy(() => {
    Hooks.off("shards-calendar:weather:changed", hookId);
    Hooks.off("shards-calendar:date:changed", dateHookId);
  });
</script>

<div class="chip-wrapper">
  <div class="chip" aria-label="Calendar chip">
    <div class="chip-main" aria-label="Calendar status">
      <div class="chip-title">
        <!-- TODO: need to check permissions to view calendar -->
        <!-- <button type="button" class="chip-link" on:click={openCalendar} title="Open Calendar" data-no-drag> -->
          {formattedDate}
        <!--</button>-->
      </div>

      <div class="chip-sub">
        {#if season?.name}
          <span class="chip-season" title={`Season: ${season.name}`}>{season.name}</span>
        {/if}

        {#if weather && resolvedPrecip}
          <span class="chip-weather-dot"></span>
          {#if isGM}
            <button
              type="button"
              class="chip-weather chip-weather-btn"
              title={resolvedPrecip.name}
              on:click={openWeatherOverride}
            >
              <i class="fa-solid {resolvedPrecip.icon}"
                style="color: {resolvedPrecip.color ?? 'inherit'}"
                aria-hidden="true"></i>
              {weather.temp}°C
            </button>
          {:else}
            <span class="chip-weather" title={resolvedPrecip.name}>
              <i class="fa-solid {resolvedPrecip.icon}"
                style="color: {resolvedPrecip.color ?? 'inherit'}"
                aria-hidden="true"></i>
              {weather.temp}°C
            </span>
          {/if}
        {/if}

        {#if options?.showMoons !== false && moons.length}
          <div class="chip-moons" aria-label="Moons">
            {#each moons as item (item.moon.id)}
              <div class="chip-moon" title={`${item.moon.name ?? "Moon"} — ${item.phase?.label ?? ""}`.trim()}>
                <DisplayMoon moon={item.moon} phase={item.phase} size={18} onlyIcon={true} />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  {#if isGM || canOpenCalendar}
    <div class="chip-popup">
      <button type="button" class="chip-link" on:click={openCalendar} title="Open Calendar" data-no-drag>
        <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
      </button>

      {#if isGM}
        <button type="button" class="chip-icon" on:click={() => stepDays(-1)} title="-1 day" data-no-drag>
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <button type="button" class="chip-icon" on:click={() => stepDays(+1)} title="+1 day" data-no-drag>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
        <button type="button" class="chip-icon" on:click={openSettings} title="Settings" data-nodrag>
          <i class="fa-solid fa-gear" aria-hidden="true"></i>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
 .chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.10);
  max-width: min(860px, calc(100vw - 24px));
  color: #fff;
}

:global(.is-snapped-top) .chip {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.chip-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0;
  border-radius: 0;
  border: none;
  background: none;
  min-height: unset;
}

.chip-title {
  font-weight: 700;
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}

.chip-sub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.chip-season {
  display: inline-flex;
  white-space: nowrap;
  font-size: 0.85em;
  flex: 0 0 auto;
}

.chip-season::before {
    content: "◆";
    display: flex;
    align-items: center;
    font-size: 0.85em;
    opacity: 0.6;
    margin: 0 6px 0 2px;
}

.chip-moons {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.chip-moons::before {
    content: "·";
    margin: 0 6px 0 4px;
    opacity: 0.6;
}

.chip-moon {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.chip-moon :global(.moon-wrap),
.chip-moon :global(.display-moon),
.chip-moon :global(svg) {
  transform: scale(1);
  transform-origin: left center;
}

/* séparateur visuel entre date et boutons */
.chip-wrapper {
  position: relative;
  display: inline-flex;
}

.chip-popup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease, transform 120ms ease;
  
  display: inline-flex;
  gap: 4px;
  padding: 5px 8px;
  background: rgba(0,0,0,0.65);
  border-radius: 0 0 10px 10px;
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(6px);
}

.chip-wrapper:hover .chip-popup {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

.chip-weather {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  white-space: nowrap;
  flex: 0 0 auto;
}

.chip-weather-dot::before {
  content: "·";
  margin: 0 6px 0 4px;
  opacity: 0.6;
}

.chip-weather.is-gm {
  cursor: pointer;
  border-radius: 6px;
  padding: 2px 4px;
  transition: background 120ms;
}

.chip-weather.is-gm:hover {
  background: rgba(255,255,255,0.1);
}

.chip-weather-btn {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  border-radius: 6px;
  transition: background 120ms;
  font-size: 0.85em;
}

.chip-weather-btn:hover {
  background: rgba(255,255,255,0.1);
}
</style>
