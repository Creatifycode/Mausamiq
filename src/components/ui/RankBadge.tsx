import { ShieldCheck } from 'lucide-react';

export type WidgetTier = 'featured' | 'prominent' | 'standard' | 'compact';

interface RankBadgeProps {
  rankNumber: number;
  tier: WidgetTier;
  /** Set when the engine promoted this widget to rank 1 for a safety override. */
  isSafetyOverride?: boolean;
}

/**
 * Renders the rank the personalization engine already computed. Purely
 * presentational - the number is never recalculated or reordered here.
 */
export function RankBadge({ rankNumber, tier, isSafetyOverride }: RankBadgeProps) {
  const className = `rank-badge rank-badge--${tier}`;

  if (isSafetyOverride) {
    return (
      <span className={`${className} rank-badge--safety`} title="Promoted by a safety alert">
        <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" />
        Safety
      </span>
    );
  }

  return (
    <span className={className} aria-label={`Priority rank ${rankNumber}`}>
      <span className="rank-badge__hash" aria-hidden="true">
        #
      </span>
      {rankNumber}
    </span>
  );
}
