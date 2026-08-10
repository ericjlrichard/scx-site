import { useRef } from "react";

const SWIPE_THRESHOLD = 50; // px

// Generic left/right swipe detector. Spread the returned handlers onto any
// container: <div {...useSwipe(onSwipeLeft, onSwipeRight)}>. Ignores swipes
// that are more vertical than horizontal so it doesn't fight page scrolling.
export function useSwipe(onSwipeLeft, onSwipeRight) {
  const startX = useRef(null);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    startY.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  return { onTouchStart, onTouchEnd };
}
