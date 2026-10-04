import { CloudRain, Droplet, ShieldAlert, Sprout, Wind } from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { MetricPill } from '../ui/MetricPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';

interface AgricultureCardProps {
  currentWeather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

export function AgricultureCard({ currentWeather, widgetMeta, rankNumber }: AgricultureCardProps) {
  const humidityHigh = currentWeather.humidity > 75;
  const windSafe = currentWeather.windSpeed < 18;

  return (
    <WidgetShell
      icon={Sprout}
      title="Agronomic insights"
      subtitle="Irrigation, spraying window and disease pressure"
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
    >
      <div className="metric-grid">
        <MetricPill icon={Droplet} label="Soil moisture" value="68%" tone="good" emphasis />
        <MetricPill
          icon={Wind}
          label="Spraying wind"
          value={`${currentWeather.windSpeed} km/h`}
          tone={windSafe ? 'good' : 'caution'}
        />
        <MetricPill icon={CloudRain} label="Evapotranspiration" value="4.2 mm/day" />
      </div>

      <AdvisoryBox
        tone={humidityHigh ? 'danger' : 'success'}
        icon={ShieldAlert}
        title="Fungal blight risk"
      >
        {humidityHigh ? (
          <>
            High atmospheric humidity ({currentWeather.humidity}%) elevates crop fungal spore
            activity. Apply bio-fungicide preventative measures before evening dew.
          </>
        ) : (
          <>
            Favourable agricultural conditions. Soil moisture level supports healthy root uptake. No
            immediate irrigation required.
          </>
        )}
      </AdvisoryBox>
    </WidgetShell>
  );
}
