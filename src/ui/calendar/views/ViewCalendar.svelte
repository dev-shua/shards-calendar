<script>
  import { calendarUi, refreshCalendarUi } from "@ui/calendarUiStore";
  import { buildMonthGrid, clampInt, daysInMonth } from "@ui/calendar/calendarMath";
  import { CalendarSettingsApp } from "../apps/CalendarSettingsApp";

  // Active calendar definition + current date
  $: def = $calendarUi.defsById?.[$calendarUi.activeId] ?? null;
  $: current = $calendarUi.current ?? null;

  // View cursor (what user is browsing)
  let viewYear = null;
  let viewMonthIndex = null;
  let viewDay = null;

  // Init cursor from current once
  $: if (def && current && (viewYear === null || viewMonthIndex === null)) {
    viewYear = current.year ?? 0;
    viewMonthIndex = current.monthIndex ?? 0;
  }
  $: if (def && current && viewDay === null) {
    viewDay = clampInt(current.day ?? 1, 1, daysInMonth(def, current.monthIndex ?? 0));
  }

  function clampView() {
    if (!def) return;
    const mCount = def.months?.length ?? 0;
    if (!mCount) return;

    viewMonthIndex = clampInt(viewMonthIndex ?? 0, 0, mCount - 1);
    const maxD = daysInMonth(def, viewMonthIndex);
    viewDay = clampInt(viewDay ?? 1, 1, maxD);
  }

  // Month label + weekdays (rotated by firstWeekdayIndex)
  $: monthName = def?.months?.[viewMonthIndex]?.name ?? `Month ${Number(viewMonthIndex ?? 0) + 1}`;
  $: weekdays = (() => {
    const list = def?.weekdays ?? [];
    if (!list.length) return [];
    const first = clampInt(def?.options?.firstWeekdayIndex ?? 0, 0, list.length - 1);
    return [...list.slice(first), ...list.slice(0, first)];
  })();

  // Grid (still 42 cells) but we'll hide empty trailing rows via CSS
  $: grid = def ? buildMonthGrid(def, viewYear ?? 0, viewMonthIndex ?? 0) : [];

  // Navigation
  function prevMonth() {
    if (!def) return;
    const mCount = def.months?.length ?? 0;
    if (!mCount) return;

    let m = viewMonthIndex ?? 0;
    let y = viewYear ?? 0;

    m -= 1;
    if (m < 0) {
      m = mCount - 1;
      y -= 1;
    }
    viewMonthIndex = m;
    viewYear = y;
    clampView();
  }

  function nextMonth() {
    if (!def) return;
    const mCount = def.months?.length ?? 0;
    if (!mCount) return;

    let m = viewMonthIndex ?? 0;
    let y = viewYear ?? 0;

    m += 1;
    if (m >= mCount) {
      m = 0;
      y += 1;
    }
    viewMonthIndex = m;
    viewYear = y;
    clampView();
  }

  function prevYear() {
    viewYear = (viewYear ?? 0) - 1;
  }
  function nextYear() {
    viewYear = (viewYear ?? 0) + 1;
  }

  function prevDay() {
    if (!def) return;
    const mCount = def.months?.length ?? 0;
    if (!mCount) return;

    if (viewYear === null) viewYear = current?.year ?? 0;
    if (viewMonthIndex === null) viewMonthIndex = current?.monthIndex ?? 0;
    if (viewDay === null) viewDay = current?.day ?? 1;

    viewDay -= 1;
    if (viewDay < 1) {
      viewMonthIndex -= 1;
      if (viewMonthIndex < 0) {
        viewMonthIndex = mCount - 1;
        viewYear -= 1;
      }
      viewDay = daysInMonth(def, viewMonthIndex);
    }
    clampView();
  }

  function nextDay() {
    if (!def) return;
    const mCount = def.months?.length ?? 0;
    if (!mCount) return;

    if (viewYear === null) viewYear = current?.year ?? 0;
    if (viewMonthIndex === null) viewMonthIndex = current?.monthIndex ?? 0;
    if (viewDay === null) viewDay = current?.day ?? 1;

    const maxD = daysInMonth(def, viewMonthIndex);
    viewDay += 1;

    if (viewDay > maxD) {
      viewDay = 1;
      viewMonthIndex += 1;
      if (viewMonthIndex >= mCount) {
        viewMonthIndex = 0;
        viewYear += 1;
      }
    }
    clampView();
  }

  function goToday() {
    if (!current) return;
    viewYear = current.year ?? 0;
    viewMonthIndex = current.monthIndex ?? 0;
    viewDay = clampInt(current.day ?? 1, 1, def ? daysInMonth(def, current.monthIndex ?? 0) : 30);
  }

  function selectDay(day) {
    if (!day) return;
    viewDay = day;
  }

  // --- GM actions (true current date) ---
  let editYear = 0;
  let editMonthIndex = 0;
  let editDay = 1;

  $: if (current && def) {
    editYear = current.year ?? 0;
    editMonthIndex = clampInt(current.monthIndex ?? 0, 0, (def.months?.length ?? 1) - 1);
    editDay = clampInt(current.day ?? 1, 1, daysInMonth(def, editMonthIndex));
  }

  function clampEditDay() {
    if (!def) return;
    editMonthIndex = clampInt(editMonthIndex, 0, (def.months?.length ?? 1) - 1);
    editDay = clampInt(editDay, 1, daysInMonth(def, editMonthIndex));
  }

  async function setCurrentDate(next) {
    const api = game?.shardsCalendar;
    if (!api?.setActiveDate) {
      ui.notifications?.error("Calendar API missing: setActiveDate()");
      return;
    }
    await api.setActiveDate(next);
    refreshCalendarUi();
  }

  async function advanceCurrentDays(delta) {
    const api = game?.shardsCalendar;
    if (!api?.stepDays) {
      ui.notifications?.error("Calendar API missing: stepDays()");
      return;
    }
    api.stepDays(delta);
    refreshCalendarUi();
  }

  async function applySelectedToCurrent() {
    if (!def || viewYear === null || viewMonthIndex === null || viewDay === null) return;
    await setCurrentDate({ year: viewYear, monthIndex: viewMonthIndex, day: viewDay });
  }

  async function applyManualCurrent() {
    clampEditDay();
    await setCurrentDate({ year: editYear, monthIndex: editMonthIndex, day: editDay });
  }

  function isToday(day) {
    return !!current
      && (current.year ?? 0) === (viewYear ?? 0)
      && (current.monthIndex ?? 0) === (viewMonthIndex ?? 0)
      && (current.day ?? -1) === day;
  }

  function isSelected(day) {
    return day && day === viewDay;
  }

  
  let app = null;
  function ensureApp() {
    if (!app) app = new CalendarSettingsApp();
    return app;
  }

  function openCalendarApp() {
    const a = ensureApp();

    // If already rendered, just bring to top (Foundry usually handles focus)
    // render(true) is enough to show/focus
    a.render(true);
  }


  // Compute which cell indexes belong to the "real month area" so we can hide extra trailing rows
  $: lastFilledIndex = (() => {
    if (!def) return -1;
    const total = daysInMonth(def, viewMonthIndex ?? 0);
    let last = -1;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== null) last = i;
    }
    // last day should be present; ensure at least up to it
    return last;
  })();

  // how many rows do we actually need (1..6)
  $: usedRows = lastFilledIndex >= 0 ? Math.ceil((lastFilledIndex + 1) / 7) : 0;
  $: hideFromIndex = usedRows > 0 ? usedRows * 7 : 0;
</script>

{#if !def}
  <div class="sc-empty">No active calendar.</div>
{:else}
  <section class="cal-shell">
    <!-- LEFT (70%) -->
    <div class="cal-main">
      <header class="cal-header">
        <div class="cal-header-left">
          <div class="cal-title">
            <div class="cal-month">{monthName}</div>
            <div class="cal-year">Year {viewYear}</div>
          </div>
        </div>

        <div class="cal-header-center">
          <div class="cal-nav">
            <button type="button" on:click={prevYear} title="Previous year">
              <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
            </button>
            <button type="button" on:click={prevMonth} title="Previous month">
              <i class="fa-solid fa-angle-left" aria-hidden="true"></i>
            </button>
            <button type="button" on:click={prevDay} title="Previous day">
              <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>

            <button type="button" class="cal-today" on:click={goToday} title="Go to current date">
              Today
            </button>

            <button type="button" on:click={nextDay} title="Next day">
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
            <button type="button" on:click={nextMonth} title="Next month">
              <i class="fa-solid fa-angle-right" aria-hidden="true"></i>
            </button>
            <button type="button" on:click={nextYear} title="Next year">
              <i class="fa-solid fa-angles-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </header>

      <div class="cal-weekdays">
        {#each weekdays as wd}
          <div class="cal-wd">{wd}</div>
        {/each}
      </div>

      <div class="cal-grid-wrap">
        <div class="cal-grid" role="grid" aria-label="Calendar month grid">
          {#each grid as day, idx (idx)}
            <button
              type="button"
              class="cal-cell"
              class:is-today={day && isToday(day)}
              class:is-selected={day && isSelected(day)}
              class:is-out={idx >= hideFromIndex}
              disabled={!day || idx >= hideFromIndex}
              on:click={(e) => {
                if (!day) return;
                selectDay(day);

                if (game.user?.isGM && e.shiftKey) {
                  setCurrentDate({ year: viewYear ?? 0, monthIndex: viewMonthIndex ?? 0, day });
                }
              }}
            >
              {#if day}
                <div class="cal-day">{day}</div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- RIGHT (30%) -->
    <aside class="cal-side">
      <div class="cal-card">
        {#if game.user?.isGM}
          <div class="cal-top-actions">
            <button type="button" class="btn-primary" on:click={() => openCalendarApp()}>
              Settings
            </button>
          </div>
        {/if}

        <div class="cal-card-title">Info</div>

        <div class="cal-kv">
          <div class="k">Viewing</div>
          <div class="v">
            {monthName} {viewDay ?? "—"}, Year {viewYear ?? "—"}
          </div>

          <div class="k">Current</div>
          <div class="v">
            {#if current}
              {def.months?.[current.monthIndex]?.name ?? `Month ${Number(current.monthIndex ?? 0) + 1}`}
              {current.day}, Year {current.year}
            {:else}
              —
            {/if}
          </div>
        </div>

        <div class="cal-hint">
          Tip: <b>Shift+Click</b> a day (GM) to set current instantly.
        </div>

        {#if game.user?.isGM}
          <div class="cal-sep"></div>

          <div class="cal-actions">
            <button
              type="button"
              class="btn-primary"
              on:click={applySelectedToCurrent}
              disabled={viewDay === null}
              title="Set current date to the selected day"
            >
              Set current to selected
            </button>

            <div class="btn-row">
              <button type="button" on:click={() => advanceCurrentDays(-1)} title="Advance current date by -1 day">
                -1 day
              </button>
              <button type="button" on:click={() => advanceCurrentDays(+1)} title="Advance current date by +1 day">
                +1 day
              </button>
            </div>
          </div>

          <div class="cal-sep"></div>

          <div class="cal-card-title">GM: Set current date</div>
          <div class="cal-form">
            <label>
              <span>Year</span>
              <input type="number" bind:value={editYear} />
            </label>

            <label>
              <span>Month</span>
              <select bind:value={editMonthIndex} on:change={clampEditDay}>
                {#each def.months as m, i}
                  <option value={i}>{m.name}</option>
                {/each}
              </select>
            </label>

            <label>
              <span>Day</span>
              <input type="number" min="1" bind:value={editDay} on:blur={clampEditDay} />
            </label>

            <button type="button" class="btn-primary" on:click={applyManualCurrent}>
              Apply
            </button>
          </div>
        {:else}
          <div class="cal-sep"></div>
          <div class="cal-muted">
            Only the GM can change the current date.
          </div>
        {/if}
      </div>
    </aside>
  </section>
{/if}

<style>
  /* Layout: 70/30 */
  .cal-shell {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(260px, 3fr);
    gap: 12px;
    padding: 12px;
  }

  @media (max-width: 980px) {
    .cal-shell {
      grid-template-columns: 1fr;
    }
    .cal-side {
      order: 2;
    }
  }

  .cal-main {
    min-height: 0;
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 10px;
  }

  .cal-header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
  }

  .cal-title {
    display: grid;
    gap: 2px;
  }

  .cal-month {
    font-weight: 800;
    font-size: 1.2em;
    line-height: 1.1;
  }

  .cal-year {
    opacity: 0.7;
    font-size: 0.9em;
  }

  .cal-nav {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .cal-nav button {
    width: 36px;
    height: 36px;
  }

  .cal-today {
    width: auto !important;
    padding: 0 10px;
    height: 36px;
  }

  .cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    opacity: 0.85;
    font-size: 0.9em;
    padding: 0 12px 0 0;
    margin: 0 6px;
  }

  .cal-wd {
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cal-grid-wrap {
    min-height: 0;
    overflow: auto;
    padding-right: 2px;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-auto-rows: 90px;
    gap: 6px;
    padding: 6px;
  }

  .cal-cell {
    appearance: none;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;

    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px;
    background: rgba(0,0,0,0.10);
    padding: 10px;
    text-align: left;
    cursor: pointer;
  }

  .cal-cell:disabled {
    cursor: default;
    opacity: 0.35;
  }

  /* Hide trailing rows (instead of showing extra empty boxes) */
  .cal-cell.is-out {
    display: none;
  }

  .cal-day {
    font-weight: 800;
  }

  .cal-cell.is-today {
    outline: 2px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.04);
  }

  .cal-cell.is-selected {
    outline: 2px solid rgba(201, 89, 63, 0.65);
  }

  /* Side panel */
  .cal-side {
    min-height: 0;
  }

  .cal-card {
    height: 100%;
    min-height: 0;
    overflow: auto;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px;
    padding: 12px;
    background: rgba(0,0,0,0.12);
    display: grid;
    gap: 10px;
  }

  .cal-card-title {
    font-weight: 800;
    opacity: 0.95;
  }

  .cal-kv {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 6px 10px;
    align-items: start;
  }

  .cal-kv .k {
    opacity: 0.7;
  }

  .cal-kv .v {
    font-weight: 600;
  }

  .cal-hint {
    opacity: 0.75;
    font-size: 0.9em;
    line-height: 1.25;
  }

  .cal-sep {
    height: 1px;
    background: rgba(255,255,255,0.10);
    margin: 4px 0;
  }

  .cal-actions {
    display: grid;
    gap: 8px;
  }

  .btn-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .btn-primary {
    height: 36px;
  }

  .cal-form {
    display: grid;
    gap: 8px;
  }

  .cal-form label {
    display: grid;
    gap: 4px;
  }

  .cal-form label span {
    opacity: 0.8;
    font-size: 0.9em;
  }

  .cal-form input,
  .cal-form select {
    width: 100%;
  }

  .cal-muted {
    opacity: 0.7;
  }

  .sc-empty {
    padding: 16px;
    opacity: 0.7;
  }
  
  .cal-top-actions {
    display: flex;
    justify-content: flex-end;
  }

</style>
