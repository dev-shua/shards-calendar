<script>
  import { refreshCalendarUi, calendarUi, setSelectedId } from "@ui/calendarUiStore";
  import CalendarSelector from "./CalendarSelector.svelte";
  import CalendarStructure from "./CalendarStructure.svelte";
  import CalendarSeasons from "./CalendarSeasons.svelte";
  import CalendarMoons from "./CalendarMoons.svelte";
  import CalendarOptions from "./CalendarOptions.svelte";
  import UnsavedBar from "@ui/widgets/UnsavedBar.svelte";
  import { dialogConfirm } from "@ui/widgets/DialogConfirm";
  import CalendarPreviewPanel from "./CalendarPreviewPanel.svelte";
  import { validateCalendar } from "@core/calendar/validate";

  const tabs = [
    {id: "structure", label: "Structure", comp: CalendarStructure},
    {id: "seasons", label: "Seasons", comp: CalendarSeasons},
    {id: "moons", label: "Moons", comp: CalendarMoons},
    {id: "options", label: "Options", comp: CalendarOptions},
  ]
  let selectedTab = "structure";

  let editedId = null;
  let draft = null;
  let baselineJson = "";

  function touch() { if (draft) draft = {...draft}; }

  $: draftJson = draft ? JSON.stringify(draft) : "";
  $: dirty = !!draft && baselineJson !== "" && draftJson !== baselineJson;

  $: activeTab = tabs.find(t => t.id === selectedTab);
  $: isActiveSelected = !!$calendarUi.selectedId && $calendarUi.selectedId === $calendarUi.activeId;

  export let setDirty = () => {};
  $: setDirty(dirty);

  function normalizeDraft(draft) {
    if (!draft) return draft;

    if (!Array.isArray(draft.weekdays)) draft.weekdays = [];
    if (!Array.isArray(draft.months)) draft.months = [];
    if (!Array.isArray(draft.seasons)) draft.seasons = [];
    if (!Array.isArray(draft.moons)) draft.moons = [];

    if (!draft.options || typeof draft.options !== "object") draft.options = {};
    if (typeof draft.options.dateFormat !== "string") draft.options.dateFormat = "{wd} {d} {m}, {y}";
    if (!Number.isInteger(draft.options.firstWeekdayIndex)) draft.options.firstWeekdayIndex = 0;
    if (typeof draft.options.showSeasons !== "boolean") draft.options.showSeasons = true;
    if (typeof draft.options.showMoons !== "boolean") draft.options.showMoons = true;

    return draft;
  }

  $: {
    const nextId = $calendarUi.selectedId;
    if (!nextId) {
      draft = null;
      editedId = null;
      baselineJson = "";
    } else if (nextId !== editedId) {
      const def = $calendarUi.defsById?.[nextId] ?? null;
      draft = def ? normalizeDraft(structuredClone(def)) : null;
      editedId = nextId;
      
      if (draft) draft = normalizeDraft(draft);
      baselineJson = draft ? JSON.stringify(draft) : "";
    }
  }
  $: previewCurrent =
    $calendarUi.selectedId === $calendarUi.activeId
      ? $calendarUi.statesById?.[$calendarUi.activeId]?.current ?? null
      : $calendarUi.statesById?.[$calendarUi.activeId]?.current ?? null;

  const requestTab = async (id) => {
    if (id === selectedTab) return;
    selectedTab = id;
  }

  const requestSelectCalendar = async (nextId) => {
    if (!nextId || nextId === editedId) return;

    if (dirty) {
      const ok = await dialogConfirm({
        content: `
          <p>You have unsaved changes.</p>
          <p>Switch calendar and lose them?</p>
        `,
        yes: { label: "Switch", icon: "fa-solid fa-right-left" },
      });

      if (!ok) return;
    }

    setSelectedId(nextId);
  }

  const discardAll = async () => {
    const def = $calendarUi.defsById?.[editedId] ?? null;
    draft = def ? normalizeDraft(structuredClone(def)) : null;
    if (draft) draft = normalizeDraft(draft);
    baselineJson = draft ? JSON.stringify(draft) : "";
  }

  const saveAll = async () => {
    if (!draft || !editedId) return;
    const api = game?.shardsCalendar;

    const { errors } = validateCalendar(draft);
    if (errors.length) {
      ui.notifications?.error("Fix calendar errors before saving.");
      return;
    }

    if (!api?.replaceCalendarDefinition) {
      ui.notifications?.error("Calendar API: replaceCalendarDefinition() missing");
      return;
    }
    await api.replaceCalendarDefinition(editedId, structuredClone(draft));
    refreshCalendarUi();
    baselineJson = JSON.stringify(draft);
  }
  
  const onCreate = async () => {
    const api = game?.shardsCalendar;
    if (!api?.createCalendar) return ui.notifications?.error("API missing: createCalendar()");
    const newId = await api.createCalendar({ name: "New Calendar" });
    refreshCalendarUi();
    setSelectedId(newId);
  }

  const onDuplicate = async () => {
    const api = game?.shardsCalendar;
    const id = $calendarUi.selectedId;
    if (!id) return ui.notifications?.warn("Select a calendar first.");
    if (!api?.duplicateCalendar) return ui.notifications?.error("API missing: duplicateCalendar()");
    const newId = await api.duplicateCalendar(id);
    refreshCalendarUi();
    if (newId) setSelectedId(newId);
  }

  const onActivateSelected = async () => {
    const api = game?.shardsCalendar;
    const id = $calendarUi.selectedId;
    if (!id) return ui.notifications?.warn("Select a calendar first.");
    if (!api?.selectActive) return ui.notifications?.error("API missing: selectActive()");

    await api.selectActive(id);
    refreshCalendarUi();

    const name = $calendarUi.defsById?.[id]?.name ?? id;
    ui.notifications?.info(`Active calendar: ${name}`);
  }

  const deleteCalendar = async (id) => {
    const api = game?.shardsCalendar;
    if (!api?.deleteCalendar) return ui.notifications?.error("API missing: deleteCalendar()");
    await api.deleteCalendar(id);
    refreshCalendarUi();
  };
  
</script>

<div class="shards-calendar-settings">
  <div class="head">
    <div class="sc-header">
      <h1>Calendar - Settings</h1>

      <div class="sc-actions">
        <div class="sc-selector">
          <CalendarSelector onSelect={requestSelectCalendar} />
          <button type="button" on:click={onActivateSelected} disabled={isActiveSelected}>
            {#if isActiveSelected}Active ✓{:else}Activate{/if}
          </button>
        </div>
        <div class="actions">
          <button type="button" on:click={onCreate}>Create</button>
          <button type="button" on:click={onDuplicate}>Duplicate</button>
        </div>
      </div>
    </div>
  </div>
  <div class="sc-navigation">
    {#each tabs as tab (tab.id)}
      <button type="button" class="tab" class:active={selectedTab === tab.id} on:click={() => requestTab(tab.id)}>
        {tab.label}
      </button>
    {/each}
  </div>
  <div class="sc-body sc-split">
    <div class="sc-content">
      {#if activeTab}
        <svelte:component this={activeTab.comp} {draft} {touch} onDelete={deleteCalendar} />
      {:else}
        <div>Unknown tab</div>
      {/if}
      {#if dirty}
        <UnsavedBar onDiscard={discardAll} onSave={saveAll} />
      {/if}
    </div>

    <aside class="sc-preview-col">
      <CalendarPreviewPanel {draft} current={previewCurrent} />
    </aside>
  </div>
</div>

<style lang="scss">
  
  :global(.sc-test-global) {
    color: red !important;
    font-size: 32px !important;
    border: 3px solid #c9593f !important;
    padding: 12px !important;
  }

  .shards-calendar-settings {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .shards-calendar-settings .head {
    flex: 0 0 auto;
    padding: 12px 16px;
  }

  .shards-calendar-settings .sc-header {
    display: grid !important;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 12px;
  }

  .shards-calendar-settings .sc-body {
    padding: 16px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .shards-calendar-settings .sc-actions {
    display: flex;
    gap: 8px;
    flex-direction: column;
  }

  .shards-calendar-settings .sc-actions .actions {
    display: flex;
  }

  .shards-calendar-settings .sc-navigation {
    display: inline-flex;
    gap: 8px;
    padding: 8px 16px;
  }

  .shards-calendar-settings h1 {
    margin: 0;
    line-height: 1;
  }

  .shards-calendar-settings .tab {
    display: inline-flex;
    padding: 6px 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85em;
    opacity: 0.6;
    transition: opacity 120ms, border-color 120ms;
    background: none;
    color: inherit;
  }

  .shards-calendar-settings .tab:hover {
    opacity: 1;
  }

  .shards-calendar-settings .tab.active {
    border-color: var(--sc-primary);
    opacity: 1;
    color: inherit;
  }

  .sc-selector {
    display: grid;
    grid-template-columns: 1fr 80px;
    gap: 8px;
  }
  .sc-split {
    display: grid;
    grid-template-columns: 1fr minmax(280px, 360px);
    gap: 12px;
    align-items: start;
  }

  @media (max-width: 980px) {
    .sc-split {
      grid-template-columns: 1fr;
    }
  }

  .sc-preview-col {
    position: sticky;
    top: 0;
    align-self: start;
  }

  .shards-calendar-settings h1 {
    margin: 0;
    line-height: 1;
    font-size: 2em;
    text-transform: none;
    border: none;
    padding: 0;
  }

</style>