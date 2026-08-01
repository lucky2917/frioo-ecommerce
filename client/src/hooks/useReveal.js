import { useCallback, useEffect, useRef } from 'react';

const REVEALED_CLASS = 'fr-revealed';

const REVEAL_SAFETY_MS = 2000;

const shouldRevealImmediately = () =>
  typeof IntersectionObserver === 'undefined' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useReveal(externalRef) {
  const observerRef = useRef(null);
  const safetyRef = useRef(null);

  useEffect(() => () => {
    observerRef.current?.disconnect();
    clearTimeout(safetyRef.current);
  }, []);

  return useCallback((node) => {
    if (externalRef) externalRef.current = node;

    observerRef.current?.disconnect();
    observerRef.current = null;
    clearTimeout(safetyRef.current);

    if (!node) return;

    if (shouldRevealImmediately()) {
      node.classList.add(REVEALED_CLASS);
      return;
    }

    node.setAttribute('data-armed', '');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(REVEALED_CLASS);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    observer.observe(node);
    observerRef.current = observer;

    safetyRef.current = setTimeout(() => node.classList.add(REVEALED_CLASS), REVEAL_SAFETY_MS);
  }, [externalRef]);
}
