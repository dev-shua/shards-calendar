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

  function addMonth() {
    if (!draft) return;
    draft.months = [...draft.months, { name: "New Month", length: 30 }];
    touch();
  }

  function removeMonth(index) {
    if (!draft) return;
    draft.months = draft.months.filter((_, i) => i !== index);
    touch();
  }

  function addWeekday() {
    if (!draft) return;
    draft.weekdays = [...draft.weekdays, "New Day"];
    touch();
  }

  function removeWeekday(index) {
    if (!draft) return;
    draft.weekdays = draft.weekdays.filter((_, i) => i !== index);
    touch();
  }

  function applyReorderMonths(from, to) {
    if (!draft) return;
    draft.months = dnd.reorderArray(draft.months, from, to);
    touch();
  }

  function applyReorderWeekdays(from, to) {
    if (!draft) return;
    draft.weekdays = dnd.reorderArray(draft.weekdays, from, to);
    touch();
  }

  onDestroy(() => {
    dnd.onDragEnd();
  });
</script>

{#if draft}
  <section class="sc-main sc-structure" on:input={touch} on:change={touch}>
    <header class="sc-titlebar">
      <h2>Structure</h2>
      <p class="sc-subtle">Define months and weekdays for this calendar.</p>
    </header>

    <div class="sc-field">
      <label for="sc-cal-name">Calendar name</label>
      <input id="sc-cal-name" type="text" bind:value={draft.name} />
    </div>

    <div class="sc-grid">
      <ListCard title="Months">
        <div slot="actions">
          <AddButton onClick={addMonth} what="month" />
        </div>

        {#if draft.months.length === 0}
          <div class="sc-empty">No months yet.</div>
        {:else}
          <div class="sc-list">
            {#each draft.months as month, i (i)}
              <DraggableRow
                label={`Month ${i + 1}`}
                isDragging={$dragging.list === "months" && $dragging.index === i}
                onPreview={() => dnd.previewReorder("months", i, applyReorderMonths)}
                onDrop={() => dnd.onDrop("months")}
                type="months"
              >
                <DragHandle
                  label={`Reorder month ${i + 1}`}
                  onStart={(ev) => dnd.onDragStart("months", i, ev)}
                  onEnd={dnd.onDragEnd}
                />

                <input type="text" placeholder="Name" bind:value={month.name} />

                <div class="sc-len">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Days"
                    bind:value={month.length}
                  />
                </div>

                <RemoveButton onClick={() => removeMonth(i)} />
              </DraggableRow>
            {/each}
          </div>
        {/if}
      </ListCard>

      <ListCard title="Weekdays">
        <div slot="actions">
          <AddButton onClick={addWeekday} what="weekday" />
        </div>

        {#if draft.weekdays.length === 0}
          <div class="sc-empty">No weekdays yet.</div>
        {:else}
          <div class="sc-list">
            {#each draft.weekdays as day, i (i)}
              <DraggableRow
                label={`Weekday ${i + 1}`}
                isDragging={$dragging.list === "weekdays" && $dragging.index === i}
                onPreview={() => dnd.previewReorder("weekdays", i, applyReorderWeekdays)}
                onDrop={() => dnd.onDrop("weekdays")}
                type="weekdays"
              >
                <DragHandle
                  label={`Reorder weekday ${i + 1}`}
                  onStart={(ev) => dnd.onDragStart("weekdays", i, ev)}
                  onEnd={dnd.onDragEnd}
                />

                <input type="text" placeholder="Name" bind:value={draft.weekdays[i]} />
                <RemoveButton onClick={() => removeWeekday(i)} />
              </DraggableRow>
            {/each}
          </div>
        {/if}
      </ListCard>
    </div>
  </section>
{:else}
  <div class="sc-empty">Select a calendar to edit.</div>
{/if}

<style>

  .sc-structure {
    padding: 16px;
    padding-bottom: 32px;
    display: grid;
    gap: 16px;
  }

  .sc-titlebar h2 {
    margin: 0;
  }

  .sc-subtle {
    margin: 4px 0 0;
    opacity: 0.7;
    font-size: 0.9em;
  }

  .sc-field label {
    display: block;
    margin-bottom: 6px;
    opacity: 0.85;
  }
  .sc-field input {
    width: 100%;
  }

  .sc-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .sc-grid {
      grid-template-columns: 1fr;
    }
  }

  .sc-list {
    display: grid;
    gap: 8px;
  }

  .sc-empty {
    opacity: 0.7;
    padding: 8px 2px;
  }

  .sc-len {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
    align-items: center;
  }

  .sc-len input {
    width: 100%;
  }

</style>
