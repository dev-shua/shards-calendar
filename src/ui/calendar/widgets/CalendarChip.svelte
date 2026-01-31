<script>
  import { calendarUi } from "@ui/calendarUiStore";

  // props: tu peux brancher ça sur tes settings module
  export let enabled = true;            // chip activé dans les options
  export let allowPlayers = true;       // les joueurs peuvent ouvrir le calendrier
  export let showWhenNoActive = false;  // si pas d’active calendar, est-ce qu’on affiche quand même ?

  // ---- Permissions ----
  $: isGM = !!game.user?.isGM;

  // règles simples (tu peux les ajuster)
  $: canOpenCalendar = isGM || allowPlayers;
  $: canOpenSettings = isGM;

  $: hasActive = !!$calendarUi.activeId;
  $: shouldShow = enabled && canOpenCalendar && (showWhenNoActive || hasActive);

  function openCalendar() {
    // remplace par ton opener réel
    // ex: new CalendarApp().render(true)
    game.shardsCalendar?.apps?.calendar?.render?.(true);
  }

  function openSettings() {
    if (!canOpenSettings) return;
    // remplace par ton opener réel
    game.shardsCalendar?.apps?.settings?.render?.(true);
  }

  // Optionnel: label/chip text
  $: label = "Calendar";
</script>

{#if shouldShow}
  <div class="sc-chip" role="group" aria-label="Calendar launcher">
    <button type="button" class="sc-chip__main" on:click={openCalendar} title="Open calendar">
      <span class="sc-chip__dot" aria-hidden="true"></span>
      <span class="sc-chip__label">{label}</span>
    </button>

    {#if canOpenSettings}
      <button type="button" class="sc-chip__icon" on:click={openSettings} title="Open settings">
        <i class="fa-solid fa-gear" aria-hidden="true"></i>
      </button>
    {/if}
  </div>
{/if}

<style>
  .sc-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.25);
    backdrop-filter: blur(6px);
  }

  .sc-chip__main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .sc-chip__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(201, 89, 63, 0.9);
  }

  .sc-chip__label {
    font-weight: 700;
    font-size: 0.95em;
    white-space: nowrap;
  }

  .sc-chip__icon {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 0;
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    display: grid;
    place-items: center;
  }
</style>
