<script>
  import WeatherIconPicker from "@ui/calendar/widgets/WeatherIconPicker.svelte";

  export let weather = null;
  export let resolvedPrecip = null;
  export let dayIndex = 0;
  export let seasonWeather = null;
  export let onClose = () => {};

  $: allPrecip = [
    ...(seasonWeather?.precipitations ?? []),
    ...(seasonWeather?.coldPrecipitations ?? []),
  ];

  let selectedPrecipId = weather?.precipitationId ?? null;
  let customTemp = weather?.temp ?? 20;

  $: selectedPrecip = allPrecip.find(p => p.id === selectedPrecipId) ?? resolvedPrecip;

  async function save() {
    await game.shardsCalendar?.overrideWeather(dayIndex, {
      temp: customTemp,
      precipitationId: selectedPrecipId,
      visibility: selectedPrecip?.visibility ?? "good",
    });
    Hooks.callAll("shards-calendar:weather:changed");
    onClose();
  }

  async function reset() {
    await game.shardsCalendar?.clearWeatherOverride(dayIndex);
    await game.shardsCalendar?.getOrGenerateWeather(dayIndex);
    Hooks.callAll("shards-calendar:weather:changed");
    onClose();
  }
</script>

<div class="wop-body">
  <div class="wop-preview">
    {#if selectedPrecip}
      <i class="fa-solid {selectedPrecip.icon} wop-preview-icon"
         style="color: {selectedPrecip.color ?? 'inherit'}"></i>
    {/if}
    <span class="wop-preview-temp">{customTemp}°C</span>
    {#if selectedPrecip?.name}
      <span class="wop-preview-name">{selectedPrecip.name}</span>
    {/if}
  </div>

  <label class="wop-row">
    <span class="wop-label">{game.i18n.localize("SHARDSCalendar.Weather.Override.Temp")}</span>
    <input type="number" class="wop-input" bind:value={customTemp} min="-50" max="60" />
  </label>

  <div class="wop-row">
    <span class="wop-label">{game.i18n.localize("SHARDSCalendar.Weather.Override.Precipitation")}</span>
    <div class="wop-precip-list">
      {#each allPrecip as p (p.id)}
        <button
          type="button"
          class="wop-precip-btn"
          class:is-selected={selectedPrecipId === p.id}
          on:click={() => selectedPrecipId = p.id}
          title={p.name}
        >
          <i class="fa-solid {p.icon}" style="color: {p.color ?? 'inherit'}"></i>
          <span>{p.name}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<div class="wop-footer">
  <button type="button" class="wop-reset" on:click={reset}>
    <i class="fa-solid fa-rotate-left"></i>
    {game.i18n.localize("SHARDSCalendar.Weather.Override.Reset")}
  </button>
  <button type="button" class="wop-save" on:click={save}>
    <i class="fa-solid fa-check"></i>
    {game.i18n.localize("SHARDSCalendar.Weather.Override.Save")}
  </button>
</div>

<style>
  .wop-body {
    display: grid;
    gap: 12px;
    padding: 12px;
    flex: 1;
  }

  .wop-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }

  .wop-preview-icon { font-size: 1.8em; }
  .wop-preview-temp { font-size: 1.4em; font-weight: 700; }
  .wop-preview-name { font-size: 0.85em; opacity: 0.7; }

  .wop-row { display: grid; gap: 6px; }

  .wop-label {
    font-size: 0.8em;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .wop-input {
    padding: 5px 8px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.2);
    color: inherit;
    font-size: 0.85em;
    width: 80px;
  }

  .wop-precip-list { display: flex; flex-wrap: wrap; gap: 5px; }

  .wop-precip-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    font-size: 0.82em;
    color: inherit;
    transition: background 120ms;
  }

  .wop-precip-btn:hover { background: rgba(255, 255, 255, 0.12); }
  .wop-precip-btn.is-selected {
    border-color: color-mix(in srgb, var(--sc-primary) 50%, transparent);
    background: color-mix(in srgb, var(--sc-primary) 15%, transparent);
  }

  .wop-footer {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    gap: 8px;
    flex-shrink: 0;
  }

  .wop-reset {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    height: 32px !important;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    cursor: pointer;
    font-size: 0.82em;
    opacity: 0.7;
    transition: opacity 120ms;
  }

  .wop-reset:hover { opacity: 1; }

  .wop-save {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    height: 32px !important;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--sc-success) 40%, transparent);
    background: color-mix(in srgb, var(--sc-success) 15%, transparent);
    color: inherit;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85em;
    transition: background 120ms;
  }

  .wop-save:hover { background: color-mix(in srgb, var(--sc-success) 28%, transparent); }
</style>