<script>
  import { onMount, afterUpdate } from "svelte";
  import { phaseBucket, labelForBucket, createMoonSvg } from "./moonSvg";

  export let moon = null;        // { name, color, ... }
  export let phase = 0;          // 0..1
  export let size = 20;          // px
  export let showLabel = true;   // show phase label
  export let onlyIcon = false;

  let host;

  function render() {
    if (!host || !moon) return;

    const bucket = phaseBucket(phase);
    const title = `${moon.name ?? "Moon"}: ${labelForBucket(bucket)}`;
    const svg = createMoonSvg({
      bucket,
      color: moon.color || "#ffffff",
      title,
      size,
    });

    host.replaceChildren(svg);
  }

  onMount(render);
  afterUpdate(render);

  $: bucket = phaseBucket(phase);
  $: phaseLabel = labelForBucket(bucket);
  $: showLabel = onlyIcon ? false : showLabel;
</script>

<div class="dm">
  <span class="dm-icon" bind:this={host} aria-hidden="true"></span>

  {#if !onlyIcon}
    <div class="dm-meta">
      <div class="dm-name">{moon?.name ?? "Moon"}</div>
      {#if showLabel}
        <div class="dm-phase">{phaseLabel}</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dm {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: center;
  }

  .dm-icon {
    width: fit-content;
    height: fit-content;
    line-height: 0;
  }

  .dm-name {
    font-weight: 600;
    line-height: 1.1;
  }

  .dm-phase {
    opacity: 0.7;
    font-size: 0.9em;
    line-height: 1.1;
  }
</style>
