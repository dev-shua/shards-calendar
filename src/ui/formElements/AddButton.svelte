<script>
  export let onClick = () => {}
  export let what = "";
</script>

<button 
  type="button" 
  on:click={onClick}
  title={`Add ${what}`}
  aria-label={`Add ${what}`}
  class="icon-btn"
>
  <i class="fas fa-plus" aria-hidden="true"></i> Add {what}
</button>

<style>

  .icon-btn {
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

</style>