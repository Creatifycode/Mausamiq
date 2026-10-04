import { Droplets, HeartPulse, ShieldAlert, Sun } from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { MetricPill } from '../ui/MetricPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';
import { getUvBand } from './weatherIcon';

interface HealthCardProps {
  currentWeather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

export function HealthCard({ currentWeather, widgetMeta, rankNumber }: HealthCardProps) {
  const aqiSevere = currentWeather.aqi > 150;
  const uvSevere = currentWeather.uvIndex > 8;

  return (
    <WidgetShell
      icon={HeartPulse}
      title="Health and exposure"
      subtitle="Air quality, UV threshold and hydration"
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
    >
      <div className="split-metrics">
        <div className={`split-metric${aqiSevere ? ' split-metric--danger' : ' split-metric--caution'}`}>
          <p className="split-metric__label">Air quality index</p>
          <p className="split-metric__value">
            {currentWeather.aqi}
            <span className="split-metric__note">{currentWeather.aqiCategory}</span>
          </p>
        </div>
        <div className={`split-metric${uvSevere ? ' split-metric--danger' : ' split-metric--info'}`}>
          <p className="split-metric__label">UV burn threshold</p>
          <p className="split-metric__value">
            {uvSevere ? '20' : '45'}
            <span className="split-metric__note">mins max exposure</span>
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <MetricPill icon={Sun} label="UV index" value={`${currentWeather.uvIndex} (${getUvBand(currentWeather.uvIndex)})`} tone={uvSevere ? 'warning' : 'neutral'} />
        <MetricPill icon={Droplets} label="Humidity" value={`${currentWeather.humidity}%`} />
      </div>

      <AdvisoryBox tone="warning" icon={ShieldAlert} title="Protection guidance">
        AQI levels ({currentWeather.aqi}) suggest sensitive groups limit heavy outdoor exertion
        during midday. Hydration requirement is estimated at 3.0&nbsp;litres/day under the current
        thermal load.
      </AdvisoryBox>
    </WidgetShell>
  );
}
