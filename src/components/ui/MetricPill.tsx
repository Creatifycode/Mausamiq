import type { LucideIcon } from 'lucide-react';
import type { StatusTone } from './StatusPill';

interface MetricPillProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: StatusTone | 'neutral';
  /** Slightly heavier treatment for the metrics a widget wants read first. */
  emphasis?: boolean;
}

/** Compact label/value pair. All widgets share this so metric hierarchy stays uniform. */
export function MetricPill({ icon: Icon, label, value, tone = 'neutral', emphasis }: MetricPillProps) {
  return (
    <div className={`metric-pill metric-pill--${tone}${emphasis ? ' metric-pill--emphasis' : ''}`}>
      <Icon className="metric-pill__icon" size={14} strokeWidth={2} aria-hidden="true" />
      <span className="metric-pill__text">
        <span className="metric-pill__value">{value}</span>
        <span className="metric-pill__label">{label}</span>
      </span>
    </div>
  );
}
