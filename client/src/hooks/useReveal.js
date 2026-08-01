import { useEffect, useRef } from 'react';

const REVEALED_CLASS = 'fr-revealed';

export function useReveal(externalRef) {
  const localRef = useRef(null);
  const ref = externalRef ?? localRef;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add(REVEALED_CLASS);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(REVEALED_CLASS);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return ref;
}
