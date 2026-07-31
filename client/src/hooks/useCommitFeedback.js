import { useCallback, useEffect, useRef, useState } from 'react';

export function useCommitFeedback({ duration = 1600 } = {}) {
  const [committed, setCommitted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const commit = useCallback(() => {
    setCommitted(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCommitted(false), duration);
  }, [duration]);

  return { committed, commit };
}
