<script>
  export let openCalendar = () => {};
  export let openSettings = () => {};

  $: isGM = !!game.user?.isGM;
</script>

<div class="lb-root">
  <button type="button" class="lb-btn" on:click={openCalendar} title="Open Calendar">
    <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
  </button>

  {#if isGM}
    <button type="button" class="lb-gear" on:click={openSettings} title="Settings" data-no-drag>
      <i class="fa-solid fa-gear" aria-hidden="true"></i>
    </button>
  {/if}
</div>

<style>
  .lb-root {
    display: inline-flex;
    gap: 6px;
    padding: 6px;
    align-items: center;
  }

  .lb-btn, .lb-gear {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.20);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
</style>
