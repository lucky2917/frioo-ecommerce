const loaded = new Set();

export function prefetchRoute(loader) {
  if (!loader || loaded.has(loader)) return;
  loaded.add(loader);
  loader().catch(() => loaded.delete(loader));
}

export function prefetchHandlers(loader) {
  const run = () => prefetchRoute(loader);
  return { onPointerEnter: run, onFocus: run, onTouchStart: run };
}
