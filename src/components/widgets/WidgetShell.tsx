import { useId } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { PrioritizedWidget } from '../../types';
import { RankBadge } from '../ui/RankBadge';
import type { WidgetTier } from '../ui/RankBadge';

/**
 * Display prominence derived from the rank the personalization engine already
 * produced. This maps rank to visual weight only - it never reorders, filters
 * or recomputes anything.
 */
function tierForRank(rankNumber: number): WidgetTier {
  if (rankNumber <= 1) return 'featured';
  if (rankNumber <= 3) return 'prominent';
  if (rankNumber <= 6) return 'standard';
  return 'compact';
}

const ICON_SIZE: Record<WidgetTier, number> = {
  featured: 19,
  prominent: 17,
  standard: 16,
  compact: 14,
};

interface WidgetShellProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  rankNumber: number;
  widgetMeta: PrioritizedWidget;
  isSafetyOverride?: boolean;
  /** Primary value block shown directly under the header. */
  lead?: ReactNode;
  /** Right-aligned header slot, e.g. a gauge or status pill. */
  aside?: ReactNode;
  /** Advisory / footer region. */
  advisory?: ReactNode;
  children: ReactNode;
}

/**
 * Shared visual structure for every widget: glass surface, header with icon,
 * title, optional subtitle, rank badge, content area and advisory slot.
 * Keeps all widget chrome in one place so the 12 widgets only own their content.
 */
export function WidgetShell({
  icon: Icon,
  title,
  subtitle,
  rankNumber,
  widgetMeta,
  isSafetyOverride,
  lead,
  aside,
  advisory,
  children,
}: WidgetShellProps) {
  const headingId = useId();
  const tier = tierForRank(rankNumber);

  return (
    <section
      className={`widget-card widget-card--${tier}`}
      data-tier={tier}
      data-rank={rankNumber}
      aria-labelledby={headingId}
    >
      <header className="widget-card__header">
        <span className="widget-card__icon" aria-hidden="true">
          <Icon size={ICON_SIZE[tier]} strokeWidth={2} />
        </span>
        <div className="widget-card__heading">
          <h3 className="widget-card__title" id={headingId}>
            {title}
          </h3>
          {subtitle ? <p className="widget-card__subtitle">{subtitle}</p> : null}
        </div>
        {aside ? <div className="widget-card__aside">{aside}</div> : null}
        <RankBadge rankNumber={rankNumber} tier={tier} isSafetyOverride={isSafetyOverride} />
      </header>

      {lead ? <div className="widget-card__lead">{lead}</div> : null}

      <div className="widget-card__body">{children}</div>

      {advisory ? <div className="widget-card__advisory">{advisory}</div> : null}

      <p className="widget-card__why">
        <span className="widget-card__why-label">Why this</span>
        {widgetMeta.reason}
      </p>
    </section>
  );
}
