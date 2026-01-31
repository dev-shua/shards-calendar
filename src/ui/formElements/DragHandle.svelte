<script>
  export let label = "Reorder";
  export let onStart = () => {};
  export let onEnd = () => {};
  export let disabled = false;

  function handleDragStart(event) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    event.dataTransfer && (event.dataTransfer.effectAllowed = "move");
    onStart(event);
  }

  function handleDragEnd(event) {
    onEnd(event);
  }
</script>

<button
  type="button"
  class="drag-handle"
  aria-label={label}
  draggable={!disabled}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
>
  <i class="fas fa-grip-vertical" aria-hidden="true"></i>
</button>

<style>

  .drag-handle {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.12);
    cursor: grab;
    padding: 0;
    pointer-events: auto;
  }

  .drag-handle:active {
    cursor: grabbing;
    pointer-events: auto;
  }
  
</style>
