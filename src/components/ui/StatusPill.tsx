import type { ReactNode } from 'react';

export type StatusTone =
  | 'optimal'
  | 'good'
  | 'moderate'
  | 'poor'
  | 'caution'
  | 'warning'
  | 'danger';

interface StatusPillProps {
  tone: StatusTone;
  children: ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Maps a suitability status to a semantic tone. Shared by the hero band, the
 * suitability widget and the schedule widget so a status always reads the same.
 */
export function StatusPill({ tone, children, size = 'md' }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${tone} status-pill--${size}`}>
      <span className="status-pill__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
