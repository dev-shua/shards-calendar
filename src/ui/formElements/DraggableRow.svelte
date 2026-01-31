<script>
  export let label = "";
  export let isDragging = false;

  export let type = "default";

  export let onPreview = () => {};
  export let onDrop = () => {};
</script>

<div
  class={`sc-row sc-row--${type}`}
  class:sc-dragging={isDragging}
  role="listitem"
  aria-label={label}
  on:dragover|preventDefault
  on:dragenter|preventDefault={onPreview}
  on:drop={onDrop}
>
  <slot />
</div>

<style>

  .sc-row {
    display: grid;
    gap: 8px;
    align-items: center;
    padding: 6px;
    border-radius: 8px;
  }

  .sc-row:hover {
    background: rgba(255, 255, 255, 0.03) !important;
  }

  .sc-row--months {
    grid-template-columns: 28px 1fr 50px 34px;
  }

  .sc-row--weekdays {
    grid-template-columns: 28px 1fr 34px;
  }

  .sc-row--seasons {
    grid-template-columns: 28px minmax(160px, 1fr) minmax(300px, 400px) 34px;
  }

  .sc-dragging {
    outline: 2px dashed rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.05);
  }

</style>