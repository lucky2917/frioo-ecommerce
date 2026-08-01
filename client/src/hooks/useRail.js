import { useCallback, useEffect, useRef } from 'react';

const EDGE_TOLERANCE = 2;
const RAIL_GAP = 16;

export function useAutoAdvance(trackRef, intervalMs) {
  useEffect(() => {
    if (!intervalMs) return;

    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let surrendered = false;
    const surrender = () => { surrendered = true; };

    const advance = () => {
      if (surrendered || document.hidden) return;
      if (track.matches(':hover') || track.contains(document.activeElement)) return;

      const max = track.scrollWidth - track.clientWidth;
      if (max <= EDGE_TOLERANCE) return;

      const step = (track.firstElementChild?.getBoundingClientRect().width ?? 0) + RAIL_GAP;
      const atEnd = track.scrollLeft >= max - EDGE_TOLERANCE;

      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: 'smooth' });
    };

    const timer = setInterval(advance, intervalMs);
    track.addEventListener('pointerdown', surrender);
    track.addEventListener('touchstart', surrender, { passive: true });
    track.addEventListener('wheel', surrender, { passive: true });

    return () => {
      clearInterval(timer);
      track.removeEventListener('pointerdown', surrender);
      track.removeEventListener('touchstart', surrender);
      track.removeEventListener('wheel', surrender);
    };
  }, [trackRef, intervalMs]);
}

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
