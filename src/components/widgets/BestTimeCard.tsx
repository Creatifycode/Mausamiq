import { AlertTriangle, CheckCircle2, Clock, Sparkles, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PersonaId, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { StatusPill } from '../ui/StatusPill';
import type { StatusTone } from '../ui/StatusPill';

interface BestTimeCardProps {
  activePersonaId: PersonaId;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

interface Slot {
  time: string;
  rating: string;
  label: string;
  reason: string;
}

const RATING: Record<string, { tone: StatusTone; icon: LucideIcon }> = {
  ideal: { tone: 'optimal', icon: CheckCircle2 },
  moderate: { tone: 'moderate', icon: AlertTriangle },
};

function ratingMeta(rating: string): { tone: StatusTone; icon: LucideIcon } {
  return RATING[rating] ?? { tone: 'danger', icon: XCircle };
}

export function BestTimeCard({ activePersonaId, widgetMeta, rankNumber }: BestTimeCardProps) {
  // Schedule data is unchanged from the original widget.
  const scheduleSlots: Slot[] = [
    {
      time: '06:00 AM - 08:00 AM',
      rating: 'ideal',
      label: 'Optimal Window',
      reason: 'Cool temperature, low UV index (1), fresh morning air.',
    },
    {
      time: '08:00 AM - 11:00 AM',
      rating: 'moderate',
      label: 'Good Conditions',
      reason: 'Rising UV (5). Hydration & sun protection advised.',
    },
    {
      time: '11:00 AM - 03:00 PM',
      rating: 'unfavorable',
      label: 'High Heat & UV',
      reason: 'Peak heat (31°C) and UV index (9). Limit direct outdoor exposure.',
    },
    {
      time: '03:00 PM - 06:00 PM',
      rating: 'moderate',
      label: 'Rain Chance (60%)',
      reason: 'Isolated afternoon showers possible. Carry umbrella.',
    },
    {
      time: '06:00 PM - 09:00 PM',
      rating: 'ideal',
      label: 'Evening Refresh',
      reason: 'Pleasant evening breeze (14 km/h), zero UV rays.',
    },
  ];

  // Derived from the slots above, not a new calculation.
  const idealSlots = scheduleSlots.filter((slot) => slot.rating === 'ideal');
  const primaryWindow = idealSlots[0];

  return (
    <WidgetShell
      icon={Clock}
      title="Best time windows"
      subtitle={`Hourly suitability for the ${activePersonaId} profile`}
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
      lead={
        primaryWindow ? (
          <div className="window-lead">
            <Sparkles className="window-lead__icon" size={15} strokeWidth={2.2} aria-hidden="true" />
            <div>
              <p className="window-lead__label">Recommended start</p>
              <p className="window-lead__value">{primaryWindow.time}</p>
              <p className="window-lead__note">
                {idealSlots.length} of {scheduleSlots.length} blocks rated ideal today
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
      <ol className="slot-timeline">
        {scheduleSlots.map((slot) => {
          const { tone, icon: Icon } = ratingMeta(slot.rating);
          return (
            <li key={slot.time} className={`slot slot--${tone}`}>
              <span className="slot__marker" aria-hidden="true">
                <Icon size={15} strokeWidth={2.4} />
              </span>
              <div className="slot__body">
                <div className="slot__head">
                  <p className="slot__time">{slot.time}</p>
                  <StatusPill tone={tone} size="sm">
                    {slot.label}
                  </StatusPill>
                </div>
                <p className="slot__reason">{slot.reason}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </WidgetShell>
  );
}
