<script>
  import { calendarUi, refreshCalendarUi } from "@ui/calendarUiStore";
  import { buildMonthGrid, clampInt, daysInMonth, dayOfYear } from "@ui/calendar/calendarMath";
  import { CalendarSettingsApp } from "../apps/CalendarSettingsApp";
  import { getSeasonStartMarkersForDay } from "@ui/events/derivedEvents";
  import { formatCalendarDate } from "@utils/formatDate";

  // Active calendar definition + current date
  $: def = $calendarUi.defsById?.[$calendarUi.activeId] ?? null;
  $: current = $calendarUi.current ?? null;
  $: activeId = $calendarUi.activeId;
  $: activeState = $calendarUi.statesById?.[activeId] ?? null;
  $: eventsSnapshot = activeState?.events ?? [];

  // View cursor (what user is browsing)
  let viewYear = null;
  let viewMonthIndex = null;
  let viewDay = null;

  // Panel mode
  let sideMode = "info"; // "info" | "event"
  let selectedBar = null; // currently opened bar/event in panel
  let draftEvent = null;  // editable draft for user events

  $: isGM = !!game.user?.isGM;

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

  // Grid
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

  function prevYear() { viewYear = (viewYear ?? 0) - 1; }
  function nextYear() { viewYear = (viewYear ?? 0) + 1; }

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
    // si on est en mode event, on ne force pas un close, mais on pourrait.
  }

  // --- GM actions (true current date) ---
  let editYear = 0;
  let editMonthIndex = 0;
  let editDay = 1;

  let editInitialized = false;

  $: if (current && def && !editInitialized) {
    editYear = current.year ?? 0;
    editMonthIndex = clampInt(current.monthIndex ?? 0, 0, (def.months?.length ?? 1) - 1);
    editDay = clampInt(current.day ?? 1, 1, daysInMonth(def, editMonthIndex));
    editInitialized = true;
  }

  function clampEditDay() {
    if (!def) return;
    editMonthIndex = clampInt(Number(editMonthIndex), 0, (def.months?.length ?? 1) - 1);
    editDay = clampInt(Number(editDay), 1, daysInMonth(def, editMonthIndex));
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

  // Settings app
  let app = null;
  function ensureApp() {
    if (!app) app = new CalendarSettingsApp();
    return app;
  }
  function openCalendarApp() {
    ensureApp().render(true);
  }

  // ========= Events =========

  function dateForDay(day) {
    return { year: viewYear ?? 0, monthIndex: viewMonthIndex ?? 0, day };
  }

  function daysPerYear(def) {
    return (def?.months ?? []).reduce((sum, m) => sum + (Number(m?.length ?? 0) || 0), 0) || 0;
  }

  function absDay(def, date) {
    const dpy = daysPerYear(def);
    const y = Number(date?.year ?? 0);
    const mi = Number(date?.monthIndex ?? 0);
    const d = Number(date?.day ?? 1);
    return y * dpy + dayOfYear(def, mi, d);
  }

  function getUserEventsForDay(def, events, date) {
    const _ = events?.length;
    const api = game?.shardsCalendar;
    if (!api?.getEventsForDay || !def || !date) return [];
    return api.getEventsForDay(date) ?? [];
  }

  function withSpanFlags(def, date, ev) {
    const a = absDay(def, date);
    const s = absDay(def, ev.start);
    const e = ev.end ? absDay(def, ev.end) : s;

    const min = Math.min(s, e);
    const max = Math.max(s, e);

    return {
      ...ev,
      contPrev: a > min,
      contNext: a < max,
    };
  }

  function getDayBars(monthIndex, day, events) {
    const date = { year: viewYear ?? 0, monthIndex, day };
    const system = getSeasonStartMarkersForDay(def, date) ?? [];
    const user = getUserEventsForDay(def, events, date).map((ev) => withSpanFlags(def, date, ev));
    const todayAbs = absDay(def, date);

    return [...system, ...user].map((b) => {
      if (b.kind === "system") {
        return {
          ...b,
          kind: "system",
          isStart: true,
          isEnd: true,
          isMiddle: false,
        };
      }

      const startAbs = absDay(def, b.start);
      const endAbs = absDay(def, b.end ?? b.start);

      return {
        ...b,
        title: b.title ?? b.name ?? "Event",
        kind: b.kind ?? "user",
        isStart: todayAbs === startAbs,
        isEnd: todayAbs === endAbs,
        isMiddle: todayAbs > startAbs && todayAbs < endAbs,
      };
    });
  }

  function openBar(bar) {
    selectedBar = bar;
    sideMode = "event";

    if (bar?.kind === "system") {
      // read-only
      draftEvent = null;
      return;
    }

    // editable user event
    draftEvent = structuredClone({
      id: bar.id,
      title: bar.title ?? "",
      description: bar.description ?? "",
      color: bar.color ?? "#c9593f",
      isPublic: bar.isPublic ?? true,
      start: bar.start ?? null,
      end: bar.end ?? null,
      recurrence: bar.recurrence ?? null,
    });
  }

  function closeEventPanel() {
    sideMode = "info";
    selectedBar = null;
    draftEvent = null;
  }

  function newEvent() {
    if (!isGM) return;
    if (viewYear === null || viewMonthIndex === null || viewDay === null) return;

    const base = {
      id: null,
      title: "New event",
      description: "",
      color: "#c9593f",
      isPublic: true,
      start: { year: viewYear, monthIndex: viewMonthIndex, day: viewDay },
      end: null,
      recurrence: null,
      kind: "user",
    };

    selectedBar = base;
    draftEvent = structuredClone(base);
    sideMode = "event";
  }

  function toggleMultiDay(enabled) {
    if (!draftEvent) return;
    if (enabled) {
      draftEvent.end = structuredClone(draftEvent.start);
      clampEventDay("end");
    } else {
      draftEvent.end = null;
    }
  }

  async function saveEvent() {
    if (!isGM || !draftEvent) return;
    const api = game?.shardsCalendar;
    if (!api) return;

    const title = String(draftEvent.title ?? "").trim();
    if (!title) {
      ui.notifications?.warn("Event title is required.");
      return;
    }

    const payload = {
      title,
      description: draftEvent.description ?? "",
      color: draftEvent.color ?? "#c9593f",
      isPublic: !!draftEvent.isPublic,
      start: structuredClone(draftEvent.start),
      end: draftEvent.end ? structuredClone(draftEvent.end) : null,
      recurrence: draftEvent.recurrence ? structuredClone(draftEvent.recurrence) : null,
    };

    // Call your existing CRUD; try common names
    if (!draftEvent.id) {
      if(typeof api.createEvent !== "function") {
        ui.notifications?.error("Calendar API missing: createEvent()");
        return;
      }
      await api.createEvent(payload);
    } else {
      if(typeof api.updateEvent !== "function") {
        ui.notifications?.error("Calendar API missing: updateEvent()");
        return;
      }
      await api.updateEvent(draftEvent.id, payload);
    }

    refreshCalendarUi();
    closeEventPanel();
  }

  async function deleteEvent() {
    if (!isGM || !draftEvent?.id) return;
    const api = game?.shardsCalendar;
    if (!api) return;

    if (typeof api.deleteEvent !== "function") {
      ui.notifications?.error("Calendar API missing: deleteEvent()");
      return;
    }
    await api.deleteEvent(draftEvent.id);

    refreshCalendarUi();
    closeEventPanel();
  }

  // Trailing rows hide
  $: lastFilledIndex = (() => {
    if (!def) return -1;
    let last = -1;
    for (let i = 0; i < grid.length; i++) if (grid[i] !== null) last = i;
    return last;
  })();

  $: usedRows = lastFilledIndex >= 0 ? Math.ceil((lastFilledIndex + 1) / 7) : 0;
  $: hideFromIndex = usedRows > 0 ? usedRows * 7 : 0;

  function onCellKeydown(e, day) {
    if (!day) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectDay(day);
    }
  }

  function clampEventDay(which = "start") {
    if (!def || !draftEvent?.[which]) return;
    const mi = clampInt(draftEvent[which].monthIndex ?? 0, 0, (def.months?.length ?? 1) - 1);
    draftEvent[which].monthIndex = mi;

    const maxD = daysInMonth(def, mi);
    draftEvent[which].day = clampInt(draftEvent[which].day ?? 1, 1, maxD);
  }

</script>

{#if !def}
  <div class="sc-empty">No active calendar.</div>
{:else}
  <section class="cal-shell">
    <!-- LEFT -->
    <div class="cal-main">
      <header class="cal-header">
        <div class="cal-title">
          <div class="cal-month">{monthName}</div>
          <div class="cal-year">Year {viewYear}</div>
        </div>

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
      </header>

      <div class="cal-weekdays">
        {#each weekdays as wd}
          <div class="cal-wd">{wd}</div>
        {/each}
      </div>

      <div class="cal-grid-wrap">
        <div class="cal-grid" role="grid" aria-label="Calendar month grid">
          {#each grid as day, idx (idx)}
            <div
              class="cal-cell"
              class:is-today={day && isToday(day)}
              class:is-selected={day && isSelected(day)}
              class:is-out={idx >= hideFromIndex}
              role="gridcell"
              tabindex={day && idx < hideFromIndex ? 0 : -1}
              aria-disabled={!day || idx >= hideFromIndex}
              on:click={() => {
                if (!day || idx >= hideFromIndex) return;
                selectDay(day);
              }}
              on:keydown={(e) => onCellKeydown(e, day)}
            >
              {#if day}
                <div class="cal-day">{day}</div>

                {@const date = dateForDay(day)}
                {@const bars = getDayBars(viewMonthIndex, day, eventsSnapshot)}
                {@const maxBars = 2}
                {@const shown = bars.slice(0, maxBars)}
                {@const hiddenCount = Math.max(0, bars.length - shown.length)}

                {#if bars.length}
                  <div class="cal-bars" data-no-drag>
                    {#each shown as bar (bar.id)}
                      <button
                        type="button"
                        class="cal-bar"
                        class:is-system={bar.kind === "system"}
                        class:is-start={bar.isStart}
                        class:is-end={bar.isEnd}
                        class:is-middle={bar.isMiddle}
                        style={`--barColor:${bar.color ?? "#c9593f"}`}
                        title={bar.title}
                        on:click|stopPropagation={() => openBar(bar)}
                      >
                        {bar.title}
                      </button>
                    {/each}

                    {#if hiddenCount > 0}
                      <button
                        type="button"
                        class="cal-more"
                        on:click|stopPropagation={() => {
                          // comportement simple : ouvre la fiche du 1er event caché
                          // (on pourra faire une mini liste après)
                          openBar(bars[maxBars]);
                        }}
                        title={`${hiddenCount} more`}
                      >
                        +{hiddenCount} more
                      </button>
                    {/if}
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- RIGHT -->
    <aside class="cal-side">
      <div class="cal-card">
        <div class="cal-top-actions">
          {#if isGM}
            <button type="button" class="btn-primary" on:click={openCalendarApp}>Settings</button>
          {/if}
        </div>

        {#if sideMode === "event"}
          <div class="cal-card-title">
            Event
          </div>

          <div class="cal-hint">
            <button type="button" class="link" on:click={closeEventPanel}>← Back</button>
          </div>

          {#if selectedBar?.kind === "system"}
            <div class="cal-readonly">
              <div class="ro-title">{selectedBar.title}</div>
              {#if selectedBar.description}
                <div class="ro-desc">{selectedBar.description}</div>
              {/if}
              <div class="ro-note">System marker (read-only).</div>
            </div>
          {:else if !isGM}
            <div class="cal-readonly">
              <div class="ro-title">{selectedBar?.title}</div>
              {#if selectedBar?.description}
                <div class="ro-desc">{selectedBar.description}</div>
              {/if}
            </div>
          {:else if draftEvent}
            <div class="cal-form">
              <label>
                <span>Title</span>
                <input type="text" bind:value={draftEvent.title} />
              </label>

              <label>
                <span>Color</span>
                <input type="color" bind:value={draftEvent.color} />
              </label>

              <label class="check">
                <input type="checkbox" bind:checked={draftEvent.isPublic} />
                <span>Public (visible to players)</span>
              </label>
              
              <div class="row2">
                <label>
                  <span>Start day</span>
                  <input
                    type="number"
                    min="1"
                    bind:value={draftEvent.start.day}
                    on:blur={() => clampEventDay("start")}
                  />
                </label>

                <label>
                  <span>Start month</span>
                  <select
                    bind:value={draftEvent.start.monthIndex}
                    on:change={() => clampEventDay("start")}
                  >
                    {#each def.months as m, i}
                      <option value={i}>{m.name}</option>
                    {/each}
                  </select>
                </label>
              </div>

              <label class="check">
                <input
                  type="checkbox"
                  checked={!!draftEvent.end}
                  on:change={(e) => toggleMultiDay(e.currentTarget.checked)}
                />
                <span>Multi-day</span>
              </label>

              <label class="check">
                <input
                  type="checkbox"
                  checked={!!draftEvent.recurrence}
                  on:change={(e) => {
                    if (e.currentTarget.checked) {
                      draftEvent.recurrence = { freq: "month", interval: 1, count: null, until: null };
                    } else {
                      draftEvent.recurrence = null;
                    }
                  }}
                />
                <span>Recurring</span>
              </label>

              {#if draftEvent.recurrence}
                <div class="row2">
                  <label>
                    <span>Frequency</span>
                    <select bind:value={draftEvent.recurrence.freq}>
                      <option value="month">Every X months</option>
                      <option value="year">Every X years</option>
                    </select>
                  </label>

                  <label>
                    <span>Interval</span>
                    <input type="number" min="1" bind:value={draftEvent.recurrence.interval} />
                  </label>
                </div>
              {/if}

              {#if draftEvent.end}
                <div class="row2">
                  <label>
                    <span>End day</span>
                    <input
                      type="number"
                      min="1"
                      bind:value={draftEvent.end.day}
                      on:blur={() => clampEventDay("end")}
                    />
                  </label>

                  <label>
                    <span>End month</span>
                    <select
                      bind:value={draftEvent.end.monthIndex}
                      on:change={() => clampEventDay("end")}
                    >
                      {#each def.months as m, i}
                        <option value={i}>{m.name}</option>
                      {/each}
                    </select>
                  </label>
                </div>
              {/if}

              <label>
                <span>Description</span>
                <textarea rows="4" bind:value={draftEvent.description}></textarea>
              </label>

              <div class="btn-row">
                <button type="button" class="btn-primary" on:click={saveEvent}>Save</button>
                <button type="button" on:click={deleteEvent} disabled={!draftEvent.id}>Delete</button>
              </div>
            </div>
          {/if}

        {:else}
          <div class="cal-card-title">Info</div>

          <div class="cal-kv">
            <div class="k">Viewing</div>
            <div class="v">
              {#if viewYear !== null && viewMonthIndex !== null && viewDay !== null}
                {formatCalendarDate(def, { year: viewYear, monthIndex: viewMonthIndex, day: viewDay }, def.options)}
              {:else}
                —
              {/if}
            </div>

            <div class="k">Current</div>
            <div class="v">
              {#if current}
                {formatCalendarDate(def, current, def.options)}
              {:else}
                —
              {/if}
            </div>
          </div>

          <div class="cal-hint">
            Tip: <b>Shift+Click</b> a day (GM) to set current instantly.
          </div>

          {#if isGM}
            <div class="cal-sep"></div>

            <div class="cal-actions">
              <button type="button" class="btn-primary" on:click={newEvent} disabled={viewDay === null}>
                New event on selected day
              </button>

              <button
                type="button"
                class="btn-primary"
                on:click={applySelectedToCurrent}
                disabled={viewDay === null}
              >
                Set current to selected
              </button>

              <div class="btn-row">
                <button type="button" on:click={() => advanceCurrentDays(-1)}>-1 day</button>
                <button type="button" on:click={() => advanceCurrentDays(+1)}>+1 day</button>
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
                <select bind:value={editMonthIndex} on:change={() => { editMonthIndex = Number(editMonthIndex); clampEditDay(); }}>
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
        {/if}
      </div>
    </aside>
  </section>
{/if}

<style>
  .cal-shell {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(280px, 3fr);
    gap: 12px;
    padding: 12px;
  }

  @media (max-width: 980px) {
    .cal-shell { grid-template-columns: 1fr; }
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

  .cal-title { display: grid; gap: 2px; }
  .cal-month { font-weight: 800; font-size: 1.2em; line-height: 1.1; }
  .cal-year { opacity: 0.7; font-size: 0.9em; }

  .cal-nav {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .cal-nav button { width: 36px; height: 36px; }
  .cal-today { width: auto !important; padding: 0 10px; height: 36px; }

  .cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    opacity: 0.85;
    font-size: 0.9em;
    padding: 0 12px 0 0;
    margin: 0 6px;
  }

  .cal-wd { text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .cal-grid-wrap { min-height: 0; overflow: auto; padding-right: 2px; }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-auto-rows: 110px;
    gap: 6px;
    padding: 6px;
  }

  .cal-cell {
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px;
    background: rgba(0,0,0,0.10);
    padding: 0px;
    text-align: left;
    cursor: pointer;
    display: grid;
    grid-template-rows: auto 1fr;
    outline: none;
  }

  .cal-cell[aria-disabled="true"] {
    opacity: 0.35;
    cursor: default;
  }

  .cal-cell.is-out { display: none; }

  .cal-day { 
    font-weight: 800;
    padding: 10px 10px 0 10px; 
  }

  .cal-cell.is-today {
    outline: 2px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.04);
  }

  .cal-cell.is-selected {
    outline: 2px solid rgba(201, 89, 63, 0.65);
  }

  .cal-bars {
    min-height: 0;
    display: grid;
    gap: 5px;
    align-content: start;
    padding: 6px 6px 10px 6px; /* padding dédié aux bars */
  }

  .cal-bar {
    width: 100%;
    height: 20px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: color-mix(in srgb, var(--barColor) 30%, rgba(0,0,0,0.25));
    color: rgba(255,255,255,0.92);
    font-size: 11px;
    line-height: 1;
    padding: 0 9px;
    text-align: left;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    margin: 0;
  }

  .cal-bar.is-system {
    opacity: 0.9;
    border-style: dashed;
  }

  .cal-more {
    height: 18px;
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.85);
    font-size: 11px;
    padding: 0 8px;
    text-align: left;
    cursor: pointer;
  }

  .cal-side { min-height: 0; }

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

  .cal-top-actions {
    display: flex;
    justify-content: flex-end;
  }

  .cal-card-title { font-weight: 800; opacity: 0.95; }

  .cal-kv {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 6px 10px;
    align-items: start;
  }

  .cal-kv .k { opacity: 0.7; }
  .cal-kv .v { font-weight: 600; }

  .cal-hint { opacity: 0.75; font-size: 0.9em; line-height: 1.25; }

  .cal-sep { height: 1px; background: rgba(255,255,255,0.10); margin: 4px 0; }

  .cal-actions { display: grid; gap: 8px; }

  .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .btn-primary { height: 36px; }

  .cal-form { display: grid; gap: 10px; }

  .cal-form label { display: grid; gap: 4px; }
  .cal-form label span { opacity: 0.8; font-size: 0.9em; }

  .cal-form input, .cal-form select, .cal-form textarea { width: 100%; }

  .check {
    display: inline-flex !important;
    align-items: center;
    gap: 10px;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .cal-muted { opacity: 0.7; }

  .link {
    appearance: none;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.9);
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .cal-readonly {
    display: grid;
    gap: 8px;
    padding: 10px;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px;
    background: rgba(0,0,0,0.08);
  }

  .ro-title { font-weight: 800; }
  .ro-desc { opacity: 0.85; }
  .ro-note { opacity: 0.65; font-size: 0.9em; }

  .cal-bar {
    border-radius: 999px;
  }

  /* event qui CONTINUE depuis hier */
  .cal-bar.is-middle {
    border-radius: 4px;
  }

  /* début d'un multi-day */
  .cal-bar.is-start:not(.is-end) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  /* fin d'un multi-day */
  .cal-bar.is-end:not(.is-start) {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

</style>
