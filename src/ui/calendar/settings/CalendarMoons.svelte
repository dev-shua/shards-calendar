<script>
  import { onDestroy } from "svelte";
  import { createReorderDnd } from "@ui/dnd/reorderDnd";

  import ListCard from "@ui/formElements/ListCard.svelte";
  import AddButton from "@ui/formElements/AddButton.svelte";
  import RemoveButton from "@ui/formElements/RemoveButton.svelte";
  import DragHandle from "@ui/formElements/DragHandle.svelte";
  import DraggableRow from "@ui/formElements/DraggableRow.svelte";

  export let draft = null;
  export let touch = () => {};

  const dnd = createReorderDnd();
  const { dragging } = dnd;

  function addMoon() {
    if (!draft) return;
    if (!Array.isArray(draft.moons)) draft.moons = [];

    draft.moons = [
      ...draft.moons,
      {
        id: crypto?.randomUUID?.() ?? `moon-${Date.now()}`,
        name: "New Moon",
        cycle: 30,
        offset: 0,
        color: "#9aa7ff",
      },
    ];

    touch();
  }

  function removeMoon(index) {
    if (!draft) return;
    draft.moons = (draft.moons ?? []).filter((_, i) => i !== index);
    touch();
  }

  function applyReorderMoons(from, to) {
    if (!draft) return;
    draft.moons = dnd.reorderArray(draft.moons ?? [], from, to);
    touch();
  }

  onDestroy(() => {
    dnd.onDragEnd();
  });
</script>

{#if draft}
  <section class="sc-main sc-moons" on:input={touch} on:change={touch}>
    <header class="sc-titlebar">
      <h2>Moons</h2>
      <p class="sc-subtle">Define moons cycles and display.</p>
    </header>

    <ListCard title="Moons">
      <div slot="actions">
        <AddButton onClick={addMoon} what="moon" />
      </div>

      {#if (draft.moons?.length ?? 0) === 0}
        <div class="sc-empty">No moons defined.</div>
      {:else}
        <div class="sc-list" role="list" aria-label="Moons list">
          {#each draft.moons as moon, i (moon.id ?? i)}
            <DraggableRow
              label={`Moon ${i + 1}`}
              isDragging={$dragging.list === "moons" && $dragging.index === i}
              onPreview={() => dnd.previewReorder("moons", i, applyReorderMoons)}
              onDrop={() => dnd.onDrop("moons")}
              type="moons"
            >
              <DragHandle
                label={`Reorder moon ${i + 1}`}
                onStart={(ev) => dnd.onDragStart("moons", i, ev)}
                onEnd={dnd.onDragEnd}
              />

              <input type="text" placeholder="Name" bind:value={moon.name} />

              <div class="sc-num">
                <label class="sr-only" for={`sc-moon-cycle-${i}`}>Cycle</label>
                <input
                  id={`sc-moon-cycle-${i}`}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Cycle"
                  bind:value={moon.cycle}
                />
                <span class="sc-unit">days</span>
              </div>

              <label class="sr-only" for={`sc-moon-offset-${i}`}>Offset</label>
              <input
                id={`sc-moon-offset-${i}`}
                class="sc-offset"
                type="number"
                step="1"
                placeholder="Offset"
                bind:value={moon.offset}
              />

              <label class="sr-only" for={`sc-moon-color-${i}`}>Color</label>
              <input id={`sc-moon-color-${i}`} class="sc-color" type="color" bind:value={moon.color} />

              <RemoveButton onClick={() => removeMoon(i)} />
            </DraggableRow>
          {/each}
        </div>
      {/if}
    </ListCard>
  </section>
{:else}
  <div class="sc-empty-state">Select a calendar to edit.</div>
{/if}

<style>
  .sc-moons {
    padding: 16px;
    padding-bottom: 32px;
    display: grid;
    gap: 12px;
  }

  .sc-titlebar h2 {
    margin: 0;
  }

  .sc-subtle {
    margin: 4px 0 0;
    opacity: 0.7;
    font-size: 0.9em;
  }

  .sc-empty {
    opacity: 0.7;
    padding: 8px 2px;
  }

  .sc-list {
    display: grid;
    gap: 8px;
  }

  :global(.sc-row--moons) {
    grid-template-columns: 28px minmax(160px, 1fr) 150px 110px 44px 34px;
  }

  .sc-num {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
    align-items: center;
  }

  .sc-num input {
    width: 100%;
    min-width: 0;
  }

  .sc-unit {
    opacity: 0.65;
    font-size: 0.9em;
    white-space: nowrap;
  }

  .sc-offset {
    width: 100%;
    min-width: 0;
  }

  .sc-color {
    width: 44px;
    height: 34px;
    padding: 0;
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
