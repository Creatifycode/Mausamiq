import { ShieldCheck, Smile, Sun, Users } from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { MetricPill } from '../ui/MetricPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';

interface FamilyParentCardProps {
  currentWeather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

/** Play rating values are unchanged from the original widget. */
const PLAY_OPTIMAL = { score: 88, label: 'Optimal' };
const PLAY_HEAT_RISK = { score: 35, label: 'Heat risk' };

export function FamilyParentCard({ currentWeather, widgetMeta, rankNumber }: FamilyParentCardProps) {
  const isTooHot = currentWeather.temp > 35;
  const play = isTooHot ? PLAY_HEAT_RISK : PLAY_OPTIMAL;

  return (
    <WidgetShell
      icon={Users}
      title="Family comfort index"
      subtitle="Playground safety and child sun mitigation"
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
      lead={
        <div className={`score-lead${isTooHot ? ' score-lead--danger' : ' score-lead--good'}`}>
          <span className="score-lead__icon" aria-hidden="true">
            <Smile size={18} strokeWidth={2} />
          </span>
          <div>
            <p className="score-lead__label">Kids play rating</p>
            <p className="score-lead__value">
              {play.score}
              <span className="score-lead__unit">/100</span>
              <span className="score-lead__note">{play.label}</span>
            </p>
          </div>
        </div>
      }
    >
      <div className="metric-grid">
        <MetricPill icon={Sun} label="Stroller comfort" value="Shaded park recommended" />
        <MetricPill
          icon={Users}
          label="Current temp"
          value={`${currentWeather.temp}°C`}
          tone={isTooHot ? 'warning' : 'neutral'}
        />
      </div>

      <AdvisoryBox
        tone={isTooHot ? 'danger' : 'success'}
        icon={ShieldCheck}
        title="Parent action tip"
      >
        {isTooHot ? (
          <>
            Midday temperature is too high for young children. Plan park visits before 09:30&nbsp;AM
            or after 05:30&nbsp;PM with water bottles.
          </>
        ) : (
          <>
            Excellent park weather. Apply broad spectrum SPF 30+ sunscreen on kids before outdoor
            playground activities.
          </>
        )}
      </AdvisoryBox>
    </WidgetShell>
  );
}
