<script>
  import { onDestroy } from "svelte";
  import RemoveButton from "@ui/formElements/RemoveButton.svelte";
  import AddButton from "@ui/formElements/AddButton.svelte";
  import DragHandle from "@ui/formElements/DragHandle.svelte";
  import DraggableRow from "@ui/formElements/DraggableRow.svelte";
  import ListCard from "@ui/formElements/ListCard.svelte";
  import { createReorderDnd } from "@ui/dnd/reorderDnd";
  import { WEATHER_ICON_OPTIONS, FALLBACK_SEASON_WEATHER } from "@core/weather/constants";
  import { dayOfYear } from "@ui/calendar/calendarMath";
  import { MODULE_ID } from "@core/constants";
  import WeatherIconPicker from "@ui/calendar/widgets/WeatherIconPicker.svelte";

  export let draft = null;
  export let touch = () => {};

  const dnd = createReorderDnd();
  const { dragging } = dnd;

  // ── Seasons ──────────────────────────────────────────────────
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

  onDestroy(() => dnd.onDragEnd());

  // ── Weather ───────────────────────────────────────────────────
  let expandedWeather = {};
  let openPickerId = null;

  function toggleWeather(seasonId) {
    expandedWeather[seasonId] = !expandedWeather[seasonId];
    expandedWeather = { ...expandedWeather };
  }

  function getSeasonWeather(season) {
      const raw = draft?.weatherSeasons?.[season.id] ?? structuredClone(FALLBACK_SEASON_WEATHER);
  
      // Migration : ajoute un id aux précipitations qui n'en ont pas
      if (raw.precipitations) {
        raw.precipitations = raw.precipitations.map(p =>
          p.id ? p : { ...p, id: crypto.randomUUID(), icon: "fa-cloud", visibility: "good", coldDerivation: null }
        );
      }
      if (raw.coldPrecipitations) {
        raw.coldPrecipitations = raw.coldPrecipitations.map(p =>
          p.id ? p : { ...p, id: crypto.randomUUID(), icon: "fa-snowflake", visibility: "reduced" }
        );
      }
      
      return raw;
  }

  function setSeasonWeather(season, weather) {
    if (!draft) return;
    draft.weatherSeasons = { ...(draft.weatherSeasons ?? {}), [season.id]: weather };
    touch();
  }

  function updateWeatherField(season, field, value) {
    setSeasonWeather(season, { ...getSeasonWeather(season), [field]: value });
  }

  // Précipitations principales
  function addPrecipitation(season) {
    const sw = getSeasonWeather(season);
    setSeasonWeather(season, {
      ...sw,
      precipitations: [...(sw.precipitations ?? []), {
        id: crypto.randomUUID(),
        name: "",
        icon: "fa-cloud",
        color: "#ffffff",
        weight: 10,
        visibility: "good",
        coldDerivation: null,
      }],
    });
  }

  function removePrecipitation(season, id) {
    const sw = getSeasonWeather(season);
    setSeasonWeather(season, {
      ...sw,
      precipitations: sw.precipitations.filter(p => p.id !== id),
    });
  }

  function updatePrecipField(season, id, field, value) {
    const sw = getSeasonWeather(season);
    setSeasonWeather(season, {
      ...sw,
      precipitations: sw.precipitations.map(p => p.id === id ? { ...p, [field]: value } : p),
    });
  }

  // Précipitations froides
  function addColdPrecipitation(season) {
    const sw = getSeasonWeather(season);
    setSeasonWeather(season, {
      ...sw,
      coldPrecipitations: [...(sw.coldPrecipitations ?? []), {
        id: crypto.randomUUID(),
        name: "",
        icon: "fa-snowflake",
        color: "#ffffff",
        visibility: "reduced",
        coldDerivation: null,
      }],
    });
  }

  function removeColdPrecipitation(season, id) {
    const sw = getSeasonWeather(season);
    setSeasonWeather(season, {
      ...sw,
      precipitations: sw.precipitations.map(p =>
        p.coldDerivation === id ? { ...p, coldDerivation: null } : p
      ),
      coldPrecipitations: sw.coldPrecipitations.filter(p => p.id !== id),
    });
  }

  function updateColdPrecipField(season, id, field, value) {
    const sw = getSeasonWeather(season);
    setSeasonWeather(season, {
      ...sw,
      coldPrecipitations: sw.coldPrecipitations.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  }

  // Icon picker — un seul ouvert à la fois
  function toggleIconPicker(key) {
    openPickerId = openPickerId === key ? null : key;
  }

  function selectIcon(season, id, icon, isCold = false) {
    if (isCold) updateColdPrecipField(season, id, "icon", icon);
    else updatePrecipField(season, id, "icon", icon);
    openPickerId = null;
  }

  // Régénérer
  async function regenerateSeasonWeather() {
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("SHARDSCalendar.Weather.Config.Regenerate.Title"),
      content: `<p>${game.i18n.localize("SHARDSCalendar.Weather.Config.Regenerate.Content")}</p>`,
    });
    if (!confirmed) return;

    await game.settings.set(MODULE_ID, "weather.store", { version: 1, days: {} });

    const api = game.shardsCalendar;
    if (api) {
      const state = api.getActiveState();
      const def = api.getActiveDefinition();
      if (state && def) {
        const current = state.current;
        const doy = dayOfYear(def, current.monthIndex ?? 0, current.day ?? 1);
        await api.getOrGenerateWeather((current.year ?? 0) * 365 + doy);
      }
    }
    Hooks.callAll("shards-calendar:weather:changed");
  }
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

                <button
                  type="button"
                  class="sc-weather-toggle"
                  class:is-active={expandedWeather[season.id]}
                  on:click|stopPropagation={() => toggleWeather(season.id)}
                  aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.Toggle")}
                  data-no-drag
                >
                  <i class="fa-solid fa-cloud-sun"></i>
                </button>
              </DraggableRow>

              {#if expandedWeather[season.id]}
                {@const sw = getSeasonWeather(season)}
                <div class="sc-weather-panel">

                  <!-- Température -->
                  <div class="sc-weather-section-title">
                    {game.i18n.localize("SHARDSCalendar.Weather.Config.Temperature")}
                  </div>

                  <div class="sc-weather-row">
                    <label class="sc-weather-label" for={`temp-min-${season.id}`}>
                      {game.i18n.localize("SHARDSCalendar.Weather.Config.TempMin")}
                    </label>
                    <input id={`temp-min-${season.id}`} type="number" class="sc-weather-input"
                      value={sw.tempMin}
                      on:change={e => updateWeatherField(season, "tempMin", Number(e.currentTarget.value))}
                      on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                    />
                  </div>

                  <div class="sc-weather-row">
                    <label class="sc-weather-label" for={`temp-max-${season.id}`}>
                      {game.i18n.localize("SHARDSCalendar.Weather.Config.TempMax")}
                    </label>
                    <input id={`temp-max-${season.id}`} type="number" class="sc-weather-input"
                      value={sw.tempMax}
                      on:change={e => updateWeatherField(season, "tempMax", Number(e.currentTarget.value))}
                      on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                    />
                  </div>

                  <div class="sc-weather-row">
                    <label class="sc-weather-label" for={`delta-${season.id}`}>
                      {game.i18n.localize("SHARDSCalendar.Weather.Config.DeltaMax")}
                    </label>
                    <input id={`delta-${season.id}`} type="number" class="sc-weather-input"
                      value={sw.deltaMax} min="1" max="20"
                      on:change={e => updateWeatherField(season, "deltaMax", Number(e.currentTarget.value))}
                      on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                    />
                  </div>

                  <div class="sc-weather-row">
                    <label class="sc-weather-label" for={`cold-threshold-${season.id}`}>
                      {game.i18n.localize("SHARDSCalendar.Weather.Config.ColdThreshold")}
                    </label>
                    <input id={`cold-threshold-${season.id}`} type="number" class="sc-weather-input"
                      value={sw.coldThreshold ?? 2}
                      on:change={e => updateWeatherField(season, "coldThreshold", Number(e.currentTarget.value))}
                      on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                    />
                  </div>

                  <!-- Précipitations principales -->
                  <div class="sc-weather-section-title">
                    {game.i18n.localize("SHARDSCalendar.Weather.Config.Precipitations")}
                    <button type="button" class="sc-weather-add-btn"
                      on:click|stopPropagation={() => addPrecipitation(season)}
                      aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.AddPrecipitation")}
                      data-no-drag>
                      <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>

                  {#each (sw.precipitations ?? []) as precip (precip.id)}
                    {@const pickerKey = `${season.id}-${precip.id}`}
                    {@const total = (sw.precipitations ?? []).reduce((s, p) => s + p.weight, 0)}
                    <div class="sc-precip-row">
                      <div class="sc-icon-picker-wrap">
                        <button type="button" class="sc-icon-btn"
                          on:click|stopPropagation={() => toggleIconPicker(pickerKey)}
                          aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.PickIcon")}
                          data-no-drag style="color: {precip.color ?? 'inherit'}">
                          <i class="fa-solid {precip.icon}"></i>
                        </button>
                        {#if openPickerId === pickerKey}
                          <div class="sc-icon-picker-wrap">
                            <button type="button" class="sc-icon-btn"
                              on:click|stopPropagation={() => toggleIconPicker(pickerKey)}
                              aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.PickIcon")}
                              style="color: {precip.color ?? '#ffffff'}"
                              data-no-drag>
                              <i class="fa-solid {precip.icon}"></i>
                            </button>
                            {#if openPickerId === pickerKey}
                              <div class="sc-picker-popup" data-no-drag>
                                <WeatherIconPicker
                                  selectedIcon={precip.icon}
                                  selectedColor={precip.color ?? "#ffffff"}
                                  onSelect={(icon, color) => {
                                    const sw = getSeasonWeather(season);
                                    setSeasonWeather(season, {
                                      ...sw,
                                      precipitations: sw.precipitations.map(p =>
                                        p.id === precip.id ? { ...p, icon, color } : p
                                      ),
                                    });
                                    openPickerId = null;
                                  }}
                                />
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>

                      <input type="text" class="sc-weather-input sc-precip-name"
                        value={precip.name}
                        placeholder={game.i18n.localize("SHARDSCalendar.Weather.Config.PrecipName")}
                        on:change={e => updatePrecipField(season, precip.id, "name", e.currentTarget.value)}
                        on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                      />

                      <input type="number" class="sc-weather-input sc-precip-weight"
                        value={precip.weight} min="1"
                        on:change={e => updatePrecipField(season, precip.id, "weight", Number(e.currentTarget.value))}
                        on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                      />

                      <span class="sc-weather-pct">
                        {total > 0 ? Math.round(precip.weight / total * 100) : 0}%
                      </span>

                      <select class="sc-weather-input sc-precip-vis"
                        value={precip.visibility}
                        on:change={e => updatePrecipField(season, precip.id, "visibility", e.currentTarget.value)}
                        on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                      >
                        <option value="good">{game.i18n.localize("SHARDSCalendar.Weather.Visibility.Good")}</option>
                        <option value="reduced">{game.i18n.localize("SHARDSCalendar.Weather.Visibility.Reduced")}</option>
                        <option value="poor">{game.i18n.localize("SHARDSCalendar.Weather.Visibility.Poor")}</option>
                      </select>

                      {#if (sw.coldPrecipitations ?? []).length > 0}
                        <select class="sc-weather-input sc-precip-cold"
                          value={precip.coldDerivation ?? ""}
                          on:change={e => updatePrecipField(season, precip.id, "coldDerivation", e.currentTarget.value || null)}
                          on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                        >
                          <option value="">{game.i18n.localize("SHARDSCalendar.Weather.Config.NoColdDerivation")}</option>
                          {#each (sw.coldPrecipitations ?? []) as cp}
                            <option value={cp.id}>{cp.name || cp.id}</option>
                          {/each}
                        </select>
                      {:else}
                        <span></span>
                      {/if}

                      <button type="button" class="sc-weather-del"
                        on:click|stopPropagation={() => removePrecipitation(season, precip.id)}
                        aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.RemovePrecipitation")}
                        data-no-drag>
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  {/each}

                  <!-- Précipitations froides -->
                  <div class="sc-weather-section-title">
                    {game.i18n.localize("SHARDSCalendar.Weather.Config.ColdPrecipitations")}
                    <button type="button" class="sc-weather-add-btn"
                      on:click|stopPropagation={() => addColdPrecipitation(season)}
                      aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.AddColdPrecipitation")}
                      data-no-drag>
                      <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>

                  {#each (sw.coldPrecipitations ?? []) as cp (cp.id)}
                    {@const pickerKey = `${season.id}-${cp.id}`}
                    <div class="sc-cold-precip-row">
                      <div class="sc-icon-picker-wrap">
                        <button type="button" class="sc-icon-btn"
                          on:click|stopPropagation={() => toggleIconPicker(pickerKey)}
                          aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.PickIcon")}
                          data-no-drag>
                          <i class="fa-solid {cp.icon}"></i>
                        </button>
                        {#if openPickerId === pickerKey}
                          <div class="sc-icon-picker-wrap">
                            <button type="button" class="sc-icon-btn"
                              on:click|stopPropagation={() => toggleIconPicker(pickerKey)}
                              aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.PickIcon")}
                              style="color: {precip.color ?? '#ffffff'}"
                              data-no-drag>
                              <i class="fa-solid {precip.icon}"></i>
                            </button>
                            {#if openPickerId === pickerKey}
                              <div class="sc-picker-popup" data-no-drag>
                                <WeatherIconPicker
                                  selectedIcon={precip.icon}
                                  selectedColor={precip.color ?? "#ffffff"}
                                  onSelect={(icon, color) => {
                                    const sw = getSeasonWeather(season);
                                    setSeasonWeather(season, {
                                      ...sw,
                                      coldPrecipitations: sw.coldPrecipitations.map(p =>
                                        p.id === cp.id ? { ...p, icon, color } : p
                                      ),
                                    });
                                    openPickerId = null;
                                  }}
                                />
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>

                      <input type="text" class="sc-weather-input sc-precip-name"
                        value={cp.name}
                        placeholder={game.i18n.localize("SHARDSCalendar.Weather.Config.ColdPrecipName")}
                        on:change={e => updateColdPrecipField(season, cp.id, "name", e.currentTarget.value)}
                        on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                      />

                      <select class="sc-weather-input sc-precip-vis"
                        value={cp.visibility}
                        on:change={e => updateColdPrecipField(season, cp.id, "visibility", e.currentTarget.value)}
                        on:pointerdown|stopPropagation on:mousedown|stopPropagation on:click|stopPropagation
                      >
                        <option value="good">{game.i18n.localize("SHARDSCalendar.Weather.Visibility.Good")}</option>
                        <option value="reduced">{game.i18n.localize("SHARDSCalendar.Weather.Visibility.Reduced")}</option>
                        <option value="poor">{game.i18n.localize("SHARDSCalendar.Weather.Visibility.Poor")}</option>
                      </select>

                      <button type="button" class="sc-weather-del"
                        on:click|stopPropagation={() => removeColdPrecipitation(season, cp.id)}
                        aria-label={game.i18n.localize("SHARDSCalendar.Weather.Config.RemovePrecipitation")}
                        data-no-drag>
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  {/each}

                  <button type="button" class="sc-weather-regen"
                    on:click|stopPropagation={regenerateSeasonWeather}
                    data-no-drag>
                    <i class="fa-solid fa-rotate-left"></i>
                    {game.i18n.localize("SHARDSCalendar.Weather.Config.Regenerate.Label")}
                  </button>

                </div>
              {/if}
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

  .sc-block-header h2 { margin: 0; }

  .sc-empty { opacity: 0.7; }

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

  /* Weather toggle */
  .sc-weather-toggle {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.8em;
    color: inherit;
    opacity: 0.7;
    transition: opacity 120ms, background 120ms;
    flex-shrink: 0;
  }

  .sc-weather-toggle:hover { opacity: 1; }
  .sc-weather-toggle.is-active {
    opacity: 1;
    background: rgba(201,89,63,0.15);
    border-color: rgba(201,89,63,0.4);
  }

  /* Weather panel */
  .sc-weather-panel {
    width: 100%;
    box-sizing: border-box;
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.15);
    margin-top: 4px;
    margin-bottom: 8px;
  }

  .sc-weather-section-title {
    font-size: 0.8em;
    font-weight: 600;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }

  .sc-weather-section-title:first-child {
    border-top: none;
    padding-top: 0;
  }

  .sc-weather-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
  }

  .sc-weather-label {
    font-size: 0.82em;
    opacity: 0.7;
  }

  .sc-weather-input {
    padding: 3px 6px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.2);
    color: inherit;
    font-size: 0.82em;
    box-sizing: border-box;
  }

  .sc-weather-input[type="number"] {
    width: 70px;
    text-align: right;
  }

  /* Précipitations */
  .sc-precip-row {
    display: grid;
    grid-template-columns: 28px 1fr 55px 40px auto auto auto;
    align-items: center;
    gap: 6px;
  }

  .sc-cold-precip-row {
    display: grid;
    grid-template-columns: 28px 1fr auto auto;
    align-items: center;
    gap: 6px;
  }

  .sc-precip-name { min-width: 0; }

  .sc-precip-weight {
    width: 55px !important;
    text-align: right;
  }

  .sc-precip-vis,
  .sc-precip-cold {
    min-width: 0;
    width: 100%;
  }

  .sc-weather-pct {
    font-size: 0.75em;
    opacity: 0.5;
    text-align: right;
    white-space: nowrap;
  }

  .sc-weather-add-btn {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.7em;
    color: inherit;
    opacity: 0.7;
    transition: opacity 120ms;
  }

  .sc-weather-add-btn:hover { opacity: 1; }

  .sc-weather-del {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: none;
    background: rgba(220,50,50,0.15);
    color: rgba(220,50,50,0.8);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.7em;
    flex-shrink: 0;
    transition: background 120ms;
  }

  .sc-weather-del:hover { background: rgba(220,50,50,0.3); }

  /* Icon picker */
  .sc-icon-picker-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .sc-icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.85em;
    color: inherit;
    transition: background 120ms;
  }

  .sc-icon-btn:hover { background: rgba(255,255,255,0.12); }

  .sc-icon-grid {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    display: grid;
    grid-template-columns: repeat(6, 28px);
    gap: 3px;
    padding: 6px;
    background: rgba(15,15,20,0.97);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    margin-top: 3px;
  }

  .sc-icon-opt {
    width: 28px;
    height: 28px;
    border-radius: 5px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 0.82em;
    color: inherit;
    transition: background 120ms;
  }

  .sc-icon-opt:hover { background: rgba(255,255,255,0.1); }
  .sc-icon-opt.is-selected {
    border-color: rgba(201,89,63,0.5);
    background: rgba(201,89,63,0.15);
  }

  /* Régénérer */
  .sc-weather-regen {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    font-size: 0.82em;
    color: inherit;
    opacity: 0.7;
    transition: opacity 120ms;
    justify-self: end;
  }

  .sc-weather-regen:hover { opacity: 1; }

  select.sc-weather-input option {
    background: rgba(20, 20, 25, 0.97) !important;
    color: #fff !important;
  }

  select.sc-weather-input {
    background: rgba(20, 20, 25, 0.97) !important;
    color: #fff !important;
  }

  .sc-picker-popup {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    margin-top: 3px;
  }
</style>