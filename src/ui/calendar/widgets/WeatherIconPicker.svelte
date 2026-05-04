<script>
  import { WEATHER_ICON_OPTIONS } from "@core/weather/constants";

  export let selectedIcon = "fa-cloud";
  export let selectedColor = "#ffffff";
  export let onSelect = (icon, color) => {};

  let tempColor = selectedColor;

  function pickIcon(iconId) {
    onSelect(iconId, tempColor);
  }

  function onColorChange(e) {
    tempColor = e.currentTarget.value;
  }
</script>

<div class="wip-wrap">
  <div class="wip-header">
    <input
      type="color"
      class="wip-color"
      value={tempColor}
      on:input={onColorChange}
      on:pointerdown|stopPropagation
      on:mousedown|stopPropagation
      on:click|stopPropagation
      aria-label="Icon color"
    />
  </div>
  <div class="wip-grid">
    {#each WEATHER_ICON_OPTIONS as opt}
      <button
        type="button"
        class="wip-opt"
        class:is-selected={selectedIcon === opt.id}
        title={game.i18n.localize(opt.label)}
        style="color: {tempColor}"
        on:click|stopPropagation={() => pickIcon(opt.id)}
        data-no-drag
      >
        <i class="fa-solid {opt.id}"></i>
      </button>
    {/each}
  </div>
</div>

<style>
  .wip-wrap {
    display: grid;
    gap: 6px;
    padding: 6px;
    background: rgba(15,15,20,0.97);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }

  .wip-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .wip-color {
    width: 28px;
    height: 28px;
    padding: 2px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.2);
    cursor: pointer;
  }

  .wip-grid {
    display: grid;
    grid-template-columns: repeat(6, 28px);
    gap: 3px;
  }

  .wip-opt {
    width: 28px;
    height: 28px;
    border-radius: 5px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.85em;
    transition: background 120ms;
  }

  .wip-opt:hover { background: rgba(255,255,255,0.1); }
  .wip-opt.is-selected {
    border-color: rgba(201,89,63,0.5);
    background: rgba(201,89,63,0.15);
  }
</style>