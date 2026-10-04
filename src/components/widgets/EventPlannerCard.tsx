import { Calendar, Sparkles } from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { ScoreGauge } from '../ui/ScoreGauge';
import { StatusPill } from '../ui/StatusPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';

interface EventPlannerCardProps {
  currentWeather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

/** Viability index values are unchanged from the original widget. */
const VIABLE = { score: 85, label: 'High viability' };
const UNFAVOURABLE = { score: 25, label: 'Unfavourable' };

export function EventPlannerCard({ currentWeather, widgetMeta, rankNumber }: EventPlannerCardProps) {
  const isRainRisk =
    currentWeather.condition === 'Heavy Rain' || currentWeather.condition === 'Thunderstorm';
  const viability = isRainRisk ? UNFAVOURABLE : VIABLE;

  return (
    <WidgetShell
      icon={Calendar}
      title="Event feasibility"
      subtitle="Outdoor viability, rain risk and setup safety"
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
      aside={
        <StatusPill tone={isRainRisk ? 'danger' : 'good'} size="sm">
          {viability.label}
        </StatusPill>
      }
      lead={
        <div className="gauge-lead">
          <ScoreGauge
            score={viability.score}
            tone={isRainRisk ? 'danger' : 'optimal'}
            label={`Outdoor event viability ${viability.score} out of 100, ${viability.label}`}
            caption="viability"
          />
          <p className="gauge-lead__text">
            Outdoor event viability index, driven by the current condition of{' '}
            <strong>{currentWeather.condition.toLowerCase()}</strong>.
          </p>
        </div>
      }
      advisory={
        <AdvisoryBox tone={isRainRisk ? 'danger' : 'success'} icon={Sparkles} title="Venue setup and risk">
          {isRainRisk ? (
            <>
              Active thunderstorm clouds detected. Waterproof marquee structures and indoor
              contingency halls are strongly required.
            </>
          ) : (
            <>
              Favourable conditions for outdoor gatherings. Wind gusts under 18&nbsp;km/h ensure
              stable tenting and sound stage setups.
            </>
          )}
        </AdvisoryBox>
      }
    >
      <p className="event-note">
        {isRainRisk
          ? 'Rain risk is the binding constraint on this date. Indoor fallback should be confirmed before ticketing.'
          : 'No weather constraint blocks outdoor programming for this date.'}
      </p>
    </WidgetShell>
  );
}
