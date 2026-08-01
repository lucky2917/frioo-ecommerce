import { useRail, useAutoAdvance } from '../../hooks/useRail';
import { useReveal } from '../../hooks/useReveal';

export default function SwipeRow({ children, className = '', count, column, onDark = false, autoAdvanceMs, style, as = 'div', ...rest }) {
  const Track = as;
  const { trackRef, progressRef } = useRail(count);
  const setTrack = useReveal(trackRef);
  useAutoAdvance(trackRef, autoAdvanceMs);

  const trackStyle = column ? { ...style, '--fr-swipe-col': column } : style;

  return (
    <>
      <Track className={`fr-swipe fr-reveal ${className}`.trim()} ref={setTrack} style={trackStyle} {...rest}>
        {children}
      </Track>
      <div className={`fr-swipe-bar${onDark ? ' fr-swipe-bar--onDark' : ''}`} ref={progressRef} aria-hidden="true">
        <span />
      </div>
    </>
  );
}
