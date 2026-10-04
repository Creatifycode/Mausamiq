import { Flag, Waves, Wind } from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { MetricPill } from '../ui/MetricPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';

interface BeachSurfCardProps {
  currentWeather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

export function BeachSurfCard({ currentWeather, widgetMeta, rankNumber }: BeachSurfCardProps) {
  return (
    <WidgetShell
      icon={Waves}
      title="Coastal marine index"
      subtitle="Swell height, coastal wind and water safety"
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
      lead={
        <div className="flag-lead">
          <span className="flag-lead__icon" aria-hidden="true">
            <Flag size={17} strokeWidth={2.2} />
          </span>
          <div>
            <p className="flag-lead__label">Lifeguard flag</p>
            <p className="flag-lead__value">Yellow</p>
          </div>
        </div>
      }
    >
      <div className="metric-grid">
        <MetricPill icon={Waves} label="Estimated swell" value="1.2 m" emphasis />
        <MetricPill icon={Wind} label="Coastal wind" value={`${currentWeather.windSpeed} km/h`} />
      </div>

      <AdvisoryBox tone="warning" icon={Waves} title="Coastal activity advisory">
        Moderate swell height allows recreational swimming within marked lifeguard zones. Avoid rip
        current channels. Water temperature is 28&nbsp;&deg;C.
      </AdvisoryBox>
    </WidgetShell>
  );
}
