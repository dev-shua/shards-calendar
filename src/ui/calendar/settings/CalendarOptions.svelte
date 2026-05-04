<script>
  import Row from "@ui/formElements/Row.svelte";
  import { dialogConfirm } from "@ui/widgets/DialogConfirm";
  import { t } from "@utils/i18n";

  export let draft = null;
  export let touch = () => {};
  export let onDelete = async () => {};

  $: if (draft && (!draft.options || typeof draft.options !== "object")) {
    draft.options = {};
  }

  $: weekdays = draft?.weekdays ?? [];

  function onWeekdayStartChange() {
    if (!draft) return;
    const max = Math.max(0, weekdays.length - 1);
    const raw = Number(draft.options?.firstWeekdayIndex);
    const next = Number.isFinite(raw) ? Math.floor(raw) : 0;
    draft.options.firstWeekdayIndex = Math.min(Math.max(0, next), max);
    touch();
  }

  function toggleOption(key) {
    if (!draft) return;
    const cur = !!draft.options?.[key];
    draft.options[key] = !cur;
    touch();
  }

  async function confirmDelete() {
    if (!draft?.id) return;

    const ok = await dialogConfirm({
      title: t("SHARDSCalendar.Alerts.Delete.Title"),
      content: t("SHARDSCalendar.Alerts.Delete.Content"),
      yes: { label: t("SHARDSCalendar.Alerts.Delete.YesLabel"), icon: "fa-solid fa-trash" },
    });

    if (!ok) return;
    await onDelete(draft.id);
  }
</script>

{#if draft}
  <section class="sc-main sc-options" on:input={touch} on:change={touch}>
    <header class="sc-titlebar">
      <h2>{t("SHARDSCalendar.Options.Title")}</h2>
      <p class="sc-subtle">{t("SHARDSCalendar.Options.Subtitle")}</p>
    </header>

    <div class="sc-left">
      <Row>
        <div class="sc-fieldrow sc-fieldrow--stack">
          <label for="opt-dateformat" class="sc-fieldrow__label">{t("SHARDSCalendar.Options.DateFormat")}</label>

          <input
            id="opt-dateformat"
            class="sc-fieldrow__input"
            type="text"
            bind:value={draft.options.dateFormat}
            placeholder={"{wd} {d} {m}, {y}"}
            on:input={touch}
          />

          <div class="sc-fieldrow__hint">
            {t("SHARDSCalendar.Options.Tokens")}:
            <span class="sc-token">{`{wd}`}</span> {t("SHARDSCalendar.Options.weekday")}
            <span class="sc-token">{`{d}`}</span> {t("SHARDSCalendar.Options.day")}
            <span class="sc-token">{`{m}`}</span> {t("SHARDSCalendar.Options.month")}
            <span class="sc-token">{`{y}`}</span> {t("SHARDSCalendar.Options.year")}
          </div>
        </div>
      </Row>

      <Row display={false}>
        <div class="sc-fieldrow sc-fieldrow--stack">
          <label for="opt-firstWeekdayIndex" class="sc-fieldrow__label">
            {t("SHARDSCalendar.Options.WeekStartingDay")}
          </label>

          <select
            id="opt-firstWeekdayIndex"
            bind:value={draft.options.firstWeekdayIndex}
            on:change={onWeekdayStartChange}
          >
            {#each weekdays as wd, i (i)}
              <option value={i}>{wd}</option>
            {/each}
          </select>

          <div class="sc-fieldrow__hint">
            {t("SHARDSCalendar.Options.WeekStartingDayDescription")}
          </div>
        </div>
      </Row>

      <Row>
        <button type="button" class="sc-checkrowBtn" on:click={() => toggleOption("showMoons")} aria-pressed={!!draft.options.showMoons}>
          <input
            class="sc-checkrow__box"
            type="checkbox"
            checked={!!draft.options.showMoons}
            on:click|stopPropagation
            on:change={() => toggleOption("showMoons")}
            aria-label="Show moons"
          />
          <span class="sc-checkrow__text">
            <span class="sc-checkrow__label">{t("SHARDSCalendar.Options.ShowMoons")}</span>
            <span class="sc-checkrow__hint">{t("SHARDSCalendar.Options.ShowMoonsHint")}</span>
          </span>
        </button>
      </Row>

      <Row>
        <button type="button" class="sc-checkrowBtn" on:click={() => toggleOption("showSeasons")} aria-pressed={!!draft.options.showSeasons}>
          <input
            class="sc-checkrow__box"
            type="checkbox"
            checked={!!draft.options.showSeasons}
            on:click|stopPropagation
            on:change={() => toggleOption("showSeasons")}
            aria-label="Show seasons"
          />
          <span class="sc-checkrow__text">
            <span class="sc-checkrow__label">{t("SHARDSCalendar.Options.ShowSeaons")}</span>
            <span class="sc-checkrow__hint">{t("SHARDSCalendar.Options.ShowSeasonsHint")}</span>
          </span>
        </button>
      </Row>

      <div class="sc-danger">
        <div class="sc-danger__title">{t("SHARDSCalendar.Options.DangerZone")}</div>
        <button type="button" class="sc-danger__btn" on:click={confirmDelete}>
          {t("SHARDSCalendar.Options.DeleteCalendar")}
        </button>
      </div>
    </div>
  </section>
{:else}
  <div class="sc-empty-state">{t("SHARDSCalendar.EventForm.NoCalendarSelectedAction")}</div>
{/if}

<style>
  .sc-options {
    padding: 16px;
    padding-bottom: 32px;
    display: grid;
    gap: 12px;
  }

  .sc-titlebar h2 { margin: 0; }
  .sc-subtle { margin: 4px 0 0; opacity: 0.7; font-size: 0.9em; }

  .sc-left {
    display: grid;
    gap: 10px;
    align-items: start;
  }

  .sc-checkrowBtn {
    width: 100%;
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 10px;
    align-items: start;

    padding: 8px 10px;
    border-radius: 12px;

    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    cursor: pointer;
    text-align: left;

    height: inherit;
  }

  .sc-checkrowBtn:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.14);
  }

  .sc-checkrowBtn:focus-visible {
    outline: 2px solid rgba(201, 89, 63, 0.6);
    outline-offset: 2px;
  }

  .sc-checkrow__box {
    margin-top: 2px;
    width: 16px;
    height: 16px;
  }

  .sc-checkrow__box {
    margin-top: 2px;
    width: 16px;
    height: 16px;
  }

  .sc-checkrow__text { display: grid; gap: 2px; min-width: 0; }
  .sc-checkrow__label { font-weight: 600; line-height: 1.2; }
  .sc-checkrow__hint { opacity: 0.7; font-size: 0.9em; line-height: 1.2; }

  .sc-fieldrow--stack {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .sc-fieldrow__label { opacity: 0.85; }

  .sc-fieldrow__hint {
    font-size: 0.85em;
    opacity: 0.7;
    line-height: 1.3;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .sc-token {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.85em;
    background: rgba(255,255,255,0.08);
    opacity: 0.9;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .sc-danger {
    margin-top: 14px;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 100, 100, 0.25);
    background: rgba(255, 0, 0, 0.05);
    display: grid;
    gap: 10px;
  }

  .sc-danger__title { font-weight: 700; opacity: 0.9; }
  .sc-danger__btn { justify-self: start; }

  .sc-empty-state { padding: 16px; opacity: 0.7; }

</style>
