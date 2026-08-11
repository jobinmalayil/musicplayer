import { useRef, useState, type ReactNode, type TouchEvent } from 'react';

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;

interface PullToRefreshProps {
  children: ReactNode;
}

/**
 * Standalone/installed PWAs get no browser chrome, so there's no native
 * "pull down to reload" gesture — this reimplements it by hand and falls
 * back to a full reload, which is the simplest way to guarantee every view
 * (library, playlists, admin, auth state) comes back fresh.
 */
export function PullToRefresh({ children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: TouchEvent<HTMLElement>) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent<HTMLElement>) => {
    if (startY.current == null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    // Resistance past the threshold so the indicator doesn't grow forever.
    setPull(delta > MAX_PULL ? MAX_PULL + (delta - MAX_PULL) * 0.2 : delta);
  };

  const onTouchEnd = () => {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPull(PULL_THRESHOLD);
      window.location.reload();
      return;
    }
    setPull(0);
  };

  return (
    <main
      ref={containerRef}
      className="app-main"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="pull-refresh-indicator" style={{ height: pull }}>
        <span
          className={`pull-refresh-spinner ${refreshing ? 'spinning' : ''}`}
          style={{ opacity: Math.min(1, pull / PULL_THRESHOLD) }}
        />
      </div>
      {children}
    </main>
  );
}
