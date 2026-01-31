<script>
  import { validateCalendar } from "@core/calendar/validate";
  import { calendarUi } from "@ui/calendarUiStore";
  import DisplayMoon from "@ui/moons/DisplayMoon.svelte";
  import { calcPhase } from "@ui/moons/moonSvg";
  import { formatCalendarDate } from "@utils/formatDate";

  export let draft = null;
  export let current = null;

  const daysInYear = (d) => (d?.months ?? []).reduce((acc, m) => acc + Number(m?.length ?? 0), 0);

  const warnings = (d) => {
    const out = [];
    if (!d) return out;

    if (!(d.months?.length)) out.push("No months defined.");
    if ((d.months ?? []).some((m) => !m?.name?.trim())) out.push("A month has an empty name.");
    if ((d.months ?? []).some((m) => Number(m?.length ?? 0) < 1)) out.push("A month has an invalid length.");

    if (!(d.weekdays?.length)) out.push("No weekdays defined.");
    if ((d.weekdays ?? []).some((w) => !String(w).trim())) out.push("A weekday is empty.");

    // Seasons sanity (optional)
    for (const s of d.seasons ?? []) {
      const mi = Number(s?.start?.monthIndex);
      const day = Number(s?.start?.day);
      const m = d.months?.[mi];
      if (!Number.isInteger(mi) || mi < 0 || mi >= (d.months?.length ?? 0)) out.push(`Season "${s?.name ?? "?"}" has invalid start month.`);
      else if (!Number.isInteger(day) || day < 1 || day > Number(m?.length ?? 0)) out.push(`Season "${s?.name ?? "?"}" has invalid start day.`);
    }

    return out;
  };

  // tiny "today" summary
  $: activeId = $calendarUi.activeId;
  $: selectedId = $calendarUi.selectedId;

  $: formatted = draft && current
    ? formatCalendarDate(draft, current, draft.options ?? {})
    : "—";

  $: yearLen = draft ? daysInYear(draft) : 0;
  $: warn = warnings(draft);

  $: validation = draft ? validateCalendar(draft) : { errors: [], warnings: [] };
  
  // Convert current date -> dayNumber within year (0-based)
  function dayOfYear(def, cur) {
    if (!def || !cur || !Array.isArray(def.months)) return 0;
    let doy = 0;
    for (let i = 0; i < (cur.monthIndex ?? 0); i++) {
      doy += Number(def.months[i]?.length ?? 0);
    }
    doy += Math.max(0, (cur.day ?? 1) - 1);
    return doy;
  }

  // Build preview list
  $: moonPreviews = (draft?.moons ?? []).map((m) => ({
    moon: m,
    phase: calcPhase({
      dayNumber: dayOfYear(draft, current),
      cycle: m.cycle,
      offset: m.offset,
    }),
  }));
</script>

<div class="sc-preview">
  <h3 class="sc-preview-title">Calendar Preview</h3>

  <div class="sc-kv">
    <div>Active</div><div>{activeId ?? "—"}</div>
    <div>Editing</div><div>{selectedId ?? "—"}</div>
    <div>Now</div>
    <div>
      {formatted}
    </div>
  </div>

  <hr class="sc-sep" />

  {#if draft}
    <div class="sc-kv">
      <div>Months</div><div>{draft.months?.length ?? 0}</div>
      <div>Weekdays</div><div>{draft.weekdays?.length ?? 0}</div>
      <div>Days / year</div><div>{yearLen}</div>
      <div>Seasons</div><div>{draft.seasons?.length ?? 0}</div>
      <div>Moons</div><div>{draft.moons?.length ?? 0}</div>
    </div>

    {#if warn.length}
      <div class="sc-warn">
        <div class="sc-warn-title">Warnings</div>
        <ul>
          {#each warn as w (w)}
            <li>{w}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Placeholder "timelines" you can enrich later -->
    <div class="sc-mini">
      {#if moonPreviews.length === 0}
        <div class="cp-empty">No moons defined.</div>
      {:else}
        <div class="cp-moons">
          {#each moonPreviews as item (item.moon.id)}
            <DisplayMoon moon={item.moon} phase={item.phase} size={22} />
          {/each}
        </div>
      {/if}
    </div>

    {#if validation.errors.length}
      <div class="sc-errors">
        <strong>Errors</strong>
        <ul>
          {#each validation.errors as e}
            <li>{e}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if validation.warnings.length}
      <div class="sc-warn">
        <strong>Warnings</strong>
        <ul>
          {#each validation.warnings as w}
            <li>{w}</li>
          {/each}
        </ul>
      </div>
    {/if}

  {:else}
    <div class="sc-muted">Select a calendar to preview.</div>
  {/if}
</div>

<style>
  .sc-preview {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px;
    background: rgba(0,0,0,0.12);
  }
  .sc-preview-title { margin: 0 0 10px; }
  .sc-kv {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px 10px;
    align-items: center;
  }
  .sc-sep {
    border: 0;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin: 10px 0;
  }
  .sc-muted { opacity: 0.7; }
  .sc-warn {
    margin-top: 12px;
    padding: 10px;
    border-radius: 10px;
    background: rgba(201, 89, 63, 0.10);
    border: 1px solid rgba(201, 89, 63, 0.20);
  }
  .sc-warn-title { font-weight: 600; margin-bottom: 6px; }
  .sc-warn ul { margin: 0; padding-left: 18px; }
  .sc-mini { margin-top: 12px; }

  .cp-moons {
    display: grid;
    gap: 10px;
  }

  .cp-empty {
    opacity: 0.7;
  }
  
</style>
