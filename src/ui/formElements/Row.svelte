<script>

export let display = true;

</script>

{#if display}
<div class="sc-row">
  <slot />
</div>
{/if}

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

</style>