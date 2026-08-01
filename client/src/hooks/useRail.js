import { useCallback, useEffect, useRef } from 'react';

const EDGE_TOLERANCE = 2;

export function useRail(itemCount) {
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      const ratio = max > EDGE_TOLERANCE ? track.scrollLeft / max : 0;

      progressRef.current?.style.setProperty('--fr-rail-progress', String(ratio));
      progressRef.current?.toggleAttribute('data-rail-static', max <= EDGE_TOLERANCE);

      if (prevRef.current) prevRef.current.disabled = track.scrollLeft <= EDGE_TOLERANCE;
      if (nextRef.current) nextRef.current.disabled = track.scrollLeft >= max - EDGE_TOLERANCE;
    };

    sync();
    track.addEventListener('scroll', sync, { passive: true });

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    observer?.observe(track);

    return () => {
      track.removeEventListener('scroll', sync);
      observer?.disconnect();
    };
  }, [itemCount]);

  const scrollByPage = useCallback((direction) => {
    const track = trackRef.current;
    if (!track) return;

    const firstItem = track.firstElementChild;
    const step = firstItem ? firstItem.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    track.scrollBy({ left: direction * step * 2, behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  return { trackRef, progressRef, prevRef, nextRef, scrollByPage };
}
