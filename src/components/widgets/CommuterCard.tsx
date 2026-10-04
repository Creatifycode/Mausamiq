import { Car, CloudFog, ShieldCheck } from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { StatusPill } from '../ui/StatusPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';

interface CommuterCardProps {
  currentWeather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

export function CommuterCard({ currentWeather, widgetMeta, rankNumber }: CommuterCardProps) {
  const isFog = currentWeather.visibility < 3.0 || currentWeather.condition === 'Dense Fog';
  const fill = Math.min(100, (currentWeather.visibility / 10) * 100);

  return (
    <WidgetShell
      icon={Car}
      title="Road hazard index"
      subtitle="Visibility meter and transit advisory"
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
      aside={
        <StatusPill tone={isFog ? 'danger' : 'good'} size="sm">
          {isFog ? 'Poor visibility' : 'Normal'}
        </StatusPill>
      }
      lead={
        <div className="meter">
          <div className="meter__head">
            <span className="meter__label">Highway visibility</span>
            <span className="meter__value">{currentWeather.visibility} km</span>
          </div>
          <div
            className="meter__track"
            role="meter"
            aria-valuenow={currentWeather.visibility}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label={`Highway visibility ${currentWeather.visibility} kilometres of 10`}
          >
            <span className={`meter__fill meter__fill--${isFog ? 'danger' : 'good'}`} style={{ width: `${fill}%` }} />
          </div>
        </div>
      }
      advisory={
        <AdvisoryBox
          tone={isFog ? 'danger' : 'info'}
          icon={isFog ? CloudFog : ShieldCheck}
          title="Commute advisory"
        >
          {isFog ? (
            <>
              Dense fog reduces driver reaction time. Maintain low beam headlights and keep a minimum
              50&nbsp;m spacing on major expressways.
            </>
          ) : (
            <>Road visibility is normal. Evening commute rain risk starts around 05:30&nbsp;PM.</>
          )}
        </AdvisoryBox>
      }
    >
      <p className="commuter-note">
        {isFog
          ? 'Reaction time degrades sharply below 3 km. Allow extra following distance on signalised junctions.'
          : 'Clear road network with no active hazard advisories for this corridor.'}
      </p>
    </WidgetShell>
  );
}
