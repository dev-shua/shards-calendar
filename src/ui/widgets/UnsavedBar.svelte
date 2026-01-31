<script>
  import { slide } from "svelte/transition";
  
  export let onSave = () => {}
  export let onDiscard = () => {}
</script>

<div class="sc-savebar" role="status" aria-live="polite" transition:slide>
  <div class="sc-savebar__left">
    Unsaved changes
  </div>

  <div class="sc-savebar__right">
    <button type="button" on:click={onDiscard}>Discard</button>
    <button type="button" class="primary" on:click={onSave}>Save</button>
  </div>
</div>

<style>

  .sc-savebar {
    position: sticky;
    bottom: 0;
    padding: 10px 12px;
    margin: 0 16px 16px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .sc-savebar__left {
    opacity: 0.85;
  }

  .sc-savebar__right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .primary {
    font-weight: 600;
  }

</style>