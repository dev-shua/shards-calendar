<script>
  import { onDestroy } from "svelte";
  import RemoveButton from "@ui/formElements/RemoveButton.svelte";
  import AddButton from "@ui/formElements/AddButton.svelte";
  import DragHandle from "@ui/formElements/DragHandle.svelte";
  import DraggableRow from "@ui/formElements/DraggableRow.svelte";
  import ListCard from "@ui/formElements/ListCard.svelte";
  import { createReorderDnd } from "@ui/dnd/reorderDnd";

  export let draft = null;
  export let touch = () => {};

  const dnd = createReorderDnd();
  const { dragging } = dnd;

  const months = () => draft?.months ?? [];

  function addSeason() {
    if (!draft) return;

    draft.seasons = [
      ...(draft.seasons ?? []),
      {
        id: crypto?.randomUUID?.() ?? `season-${Date.now()}`,
        name: "New Season",
        start: { monthIndex: 0, day: 1 },
      },
    ];

    touch();
  }

  function removeSeason(index) {
    if (!draft) return;
    draft.seasons = (draft.seasons ?? []).filter((_, i) => i !== index);
    touch();
  }

  function clampSeasonDay(season) {
    if (!draft || !season?.start) return;

    const mIndex = Number(season.start.monthIndex ?? 0);
    const m = months()[mIndex];
    const maxDay = Number(m?.length ?? 30);

    const raw = Number(season.start.day ?? 1);
    const d = Number.isFinite(raw) ? raw : 1;

    season.start.day = Math.min(Math.max(1, Math.floor(d)), maxDay);
    touch();
  }

  function applyReorderSeasons(from, to) {
    if (!draft) return;
    draft.seasons = dnd.reorderArray(draft.seasons ?? [], from, to);
    touch();
  }

  onDestroy(() => {
    dnd.onDragEnd();
  });
</script>

{#if draft}
  <section class="sc-main sc-seasons" on:input={touch} on:change={touch}>
    <header class="sc-block-header">
      <h2>Seasons</h2>
      <p class="sc-subtle">Define seasons of the year, with their starting day and month.</p>
    </header>

    <div class="sc-grid">
      <ListCard title="Seasons">
        <div slot="actions">
          <AddButton onClick={addSeason} what="season" />
        </div>

        {#if (draft.seasons?.length ?? 0) === 0}
          <div class="sc-empty">No seasons defined.</div>
        {:else}
          <div class="sc-list" role="list" aria-label="Season List">
            {#each draft.seasons as season, i (season.id ?? i)}
              <DraggableRow
                label={`Season ${i + 1}`}
                isDragging={$dragging.list === "seasons" && $dragging.index === i}
                onPreview={() => dnd.previewReorder("seasons", i, applyReorderSeasons)}
                onDrop={() => dnd.onDrop("seasons")}
                type="seasons"
              >
                <DragHandle
                  label={`Reorder season ${i + 1}`}
                  onStart={(ev) => dnd.onDragStart("seasons", i, ev)}
                  onEnd={dnd.onDragEnd}
                />

                <div class="sc-col sc-name">
                  <label class="sr-only" for={`sc-season-name-${i}`}>Season name</label>
                  <input
                    id={`sc-season-name-${i}`}
                    type="text"
                    placeholder="Season name"
                    bind:value={season.name}
                  />
                </div>

                <div class="sc-col sc-start" data-no-drag>
                  <label class="sr-only" for={`sc-season-day-${i}`}>Start day</label>
                  <input
                    id={`sc-season-day-${i}`}
                    type="number"
                    min="1"
                    step="1"
                    bind:value={season.start.day}
                    on:blur={() => clampSeasonDay(season)}
                    on:pointerdown|stopPropagation
                    on:mousedown|stopPropagation
                    on:click|stopPropagation
                  />

                  <label class="sr-only" for={`sc-season-month-${i}`}>Start month</label>
                  <select
                    id={`sc-season-month-${i}`}
                    value={season.start.monthIndex}
                    on:change={(e) => {
                      season.start.monthIndex = Number(e.currentTarget.value);
                      clampSeasonDay(season);
                      touch();
                    }}
                    title={months()[season.start.monthIndex]?.name ?? ""}
                  >
                    {#each months() as m, mi (mi)}
                      <option value={mi}>{m.name}</option>
                    {/each}
                  </select>
                </div>


                <RemoveButton onClick={() => removeSeason(i)} />
              </DraggableRow>
            {/each}
          </div>
        {/if}
      </ListCard>
    </div>
  </section>
{:else}
  <div class="sc-empty-state">Select a calendar to edit.</div>
{/if}

<style>
  .sc-seasons {
    padding: 16px;
    padding-bottom: 32px;
    display: grid;
    gap: 12px;
  }

  .sc-subtle {
    margin: 4px 0 0;
    opacity: 0.7;
    font-size: 0.9em;
  }

  .sc-block-header {
    display: flex;
    flex-direction: column;
  }

  .sc-block-header h2 {
    margin: 0;
  }

  .sc-empty {
    opacity: 0.7;
  }

  .sc-list {
    display: grid;
    gap: 8px;
  }

  .sc-start {
    display: grid;
    grid-template-columns: 6ch minmax(0, 1fr);
    gap: 8px;
    align-items: center;
  }

  .sc-start > input,
  .sc-start > select {
    min-width: 0;
    width: 100% !important;
  }

  .sc-start > select {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sc-empty-state {
    padding: 16px;
    opacity: 0.7;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
