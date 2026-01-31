<script>
  import { calendarUi } from "@ui/calendarUiStore";
  /**
   * When the select changes, only update the UI selected calendar
   * This does NOT change the active calendar in game
  */

  export let onSelect = (id) => {};

  let selected = "";

  $: {
    const next = $calendarUi.selectedId ?? "";
    if (next !== selected) selected = next;
  }

  const onChange = (event) => {
    const id = event.currentTarget?.value ?? event.target?.value;
    onSelect(id)
  }
</script>

{#if $calendarUi.calendars.length}
  <select class="shards-calendar-selector" on:change={onChange} value={selected}>
    {#each $calendarUi.calendars as c (c.id)}
      <option value={c.id}>{c.name}</option>
    {/each}
  </select>
{:else}
  <div class="sc-empty">No calendars</div>
{/if}

<style>

  .shards-calendar-selector {
    width: auto !important;
    flex: 0 0 auto;
    min-width: 180px;
  }

  .sc-empty {
    opacity: 0.6;
    font-style: italic;
  }

</style>