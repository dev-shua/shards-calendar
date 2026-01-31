<script>
  export let title = "";
</script>

<div class="sc-card">
  <div class="sc-card-header">
    <h3>{title}</h3>
    <slot name="actions" />
  </div>

  <slot />
</div>

<style>

  .sc-card {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.12);
  }

  .sc-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

</style>