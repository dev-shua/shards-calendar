<script>
  export let onClick = () => {};
</script>

<button
  type="button"
  class="icon-btn danger"
  on:click={onClick}
  title="Remove"
  aria-label="Remove"
>
  <i class="fas fa-trash" aria-hidden="true"></i>
</button>

<style>

  .icon-btn {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.15);
  }

  .icon-btn:hover {
    border-color: rgba(255, 255, 255, 0.25);
  }

  .icon-btn.danger {
    opacity: 0.9;
    border-color: #c9593f30; 
  }

  .icon-btn.danger:hover {
    color: #c9593f;
    border-color: #c9593f;
  }

</style>