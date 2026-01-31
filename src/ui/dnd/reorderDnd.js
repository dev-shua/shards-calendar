import { writable, get } from "svelte/store";

export function createReorderDnd() {
  const dragging = writable({ list: null, index: -1 });

  function onDragStart(listName, index, ev) {
    dragging.set({ list: listName, index });

    try {
      ev?.dataTransfer?.setData("text/plain", `${listName}:${index}`);
      if (ev?.dataTransfer) ev.dataTransfer.effectAllowed = "move";
    } catch (_) {}
  }

  function onDragEnd() {
    dragging.set({ list: null, index: -1 });
  }

  function reorderArray(arr, from, to) {
    const next = [...(arr ?? [])];
    if (from < 0 || to < 0) return next;
    if (from >= next.length || to >= next.length) return next;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  function setDraggingIndex(nextIndex) {
    const cur = get(dragging);
    dragging.set({ ...cur, index: nextIndex });
  }

  function previewReorder(listName, overIndex, applyReorder) {
    const cur = get(dragging);
    if (cur.list !== listName) return;
    if (cur.index < 0) return;
    if (cur.index === overIndex) return;

    const from = cur.index;
    const to = overIndex;

    applyReorder(from, to);
    setDraggingIndex(to);
  }

  function onDrop(listName) {
    const cur = get(dragging);
    if (cur.list !== listName) return;
    onDragEnd();
  }

  return {
    dragging,
    onDragStart,
    onDragEnd,
    previewReorder,
    onDrop,
    reorderArray,
    setDraggingIndex,
  };
}
