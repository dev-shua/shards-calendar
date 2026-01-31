<script>
  import { calendarUi, refreshCalendarUi } from "@ui/calendarUiStore";
  import { formatCalendarDate } from "@utils/formatDate";
  import DisplayMoon from "@ui/moons/DisplayMoon.svelte";
  import { calcPhase } from "@ui/moons/moonSvg";
  import { dayOfYear } from "@ui/calendar/calendarMath";

  export let openCalendar = () => {};
  export let openSettings = () => {};

  $: isGM = !!game.user?.isGM;

  $: activeId = $calendarUi.activeId;
  $: def = activeId ? $calendarUi.defsById?.[activeId] : null;
  $: current = $calendarUi.current ?? null;

  $: options = def?.options ?? {};
  $: formattedDate = (def && current) ? formatCalendarDate(def, current, options) : "No active calendar";

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
</script>

<div class="chip" aria-label="Calendar chip">
  <div class="chip-main" aria-label="Calendar status">
    <div class="chip-title">
      <!-- TODO: need to check permissions to view calendar -->
      <button type="button" class="chip-link" on:click={openCalendar} title="Open Calendar" data-no-drag>
        {formattedDate}
      </button>
    </div>

    <div class="chip-sub">
      {#if season?.name}
        <span class="chip-pill" title={`Season: ${season.name}`}>{season.name}</span>
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
  
  {#if isGM}
    <div class="chip-actions">
      <button type="button" class="chip-icon" on:click={() => stepDays(-1)} title="-1 day" data-no-drag>
        <i class="fa-solid fa-minus" aria-hidden="true"></i>
      </button>
      <button type="button" class="chip-icon" on:click={() => stepDays(+1)} title="+1 day" data-no-drag>
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
      </button>
      <button type="button" class="chip-icon" on:click={openSettings} title="Settings" data-nodrag>
        <i class="fa-solid fa-gear" aria-hidden="true"></i>
      </button>
    </div>
  {/if}
</div>

<style>
  .chip {
    display: inline-flex;
    align-items: stretch;
    gap: 8px;
    padding: 6px;
    max-width: min(860px, calc(100vw - 24px));
  }

  .chip-main {
    min-width: 320px;
    max-width: 680px;
    display: grid;
    grid-template-rows: auto auto;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.18);
    text-align: left;
    min-height: 52px; /* <- donne de la hauteur au chip */
  }

  .chip-title {
    font-weight: 800;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-sub {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    overflow: hidden;
  }

  .chip-pill {
    display: inline-flex;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.85em;
    background: rgba(201, 89, 63, 0.20);
    border: 1px solid rgba(201, 89, 63, 0.25);
    white-space: nowrap;
    flex: 0 0 auto;
  }

  /* Moons line */
  .chip-moons {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    overflow: hidden;
    flex: 1 1 auto;
  }

  /* wrapper around DisplayMoon: keeps it compact and vertically aligned */
  .chip-moon {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    max-width: 180px;
    overflow: hidden;
  }

  /* ✅ The trick: scale down anything inside DisplayMoon without changing its code */
  .chip-moon :global(.moon-wrap),
  .chip-moon :global(.display-moon),
  .chip-moon :global(svg) {
    transform: scale(0.9);
    transform-origin: left center;
  }

  /* If DisplayMoon has text lines, we keep them but make them smaller + single line */
  .chip-moon :global(.moon-name),
  .chip-moon :global(.moon-phase) {
    font-size: 0.85em;
    line-height: 1.05;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .chip-icon {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    display: grid;
    place-items: center;
  }
</style>
