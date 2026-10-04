import {
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { MetricPill } from '../ui/MetricPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';
import { getUvBand, getWeatherIcon } from './weatherIcon';

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

const UNHEALTHY_AIR = ['Unhealthy for Sensitive Groups', 'Unhealthy', 'Severe'];

export function CurrentWeatherCard({ weather, widgetMeta, rankNumber }: CurrentWeatherCardProps) {
  const ConditionIcon = getWeatherIcon(weather.condition);
  const uvBand = getUvBand(weather.uvIndex);
  const airIsPoor = UNHEALTHY_AIR.includes(weather.aqiCategory);

  const advisory = airIsPoor ? (
    <AdvisoryBox tone="danger" icon={Gauge} title="Air quality limits outdoor time">
      AQI {weather.aqi} reads {weather.aqiCategory.toLowerCase()} here. Shorten strenuous outdoor
      activity and consider an indoor alternative.
    </AdvisoryBox>
  ) : weather.uvIndex >= 8 ? (
    <AdvisoryBox tone="warning" icon={Thermometer} title="High ultraviolet load">
      UV index {weather.uvIndex} is {uvBand.toLowerCase()}. Shade, sunscreen and midday breaks
      matter today.
    </AdvisoryBox>
  ) : (
    <AdvisoryBox tone="info" icon={Thermometer} title="Comfortable baseline">
      AQI {weather.aqi} ({weather.aqiCategory}) and UV {weather.uvIndex} ({uvBand.toLowerCase()}) are
      within typical ranges.
    </AdvisoryBox>
  );

  return (
    <WidgetShell
      icon={ConditionIcon}
      title="Current conditions"
      subtitle={`${weather.city}, ${weather.state}`}
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
      lead={
        <div className="current-lead">
          <div className="current-lead__temp">
            <span className="current-lead__value">{weather.temp}</span>
            <span className="current-lead__unit">&deg;C</span>
          </div>
          <div className="current-lead__meta">
            <p className="current-lead__condition">{weather.condition}</p>
            <p className="current-lead__feels">Feels like {weather.feelsLike}&deg;C</p>
            <p className="current-lead__stamp">Updated {weather.lastUpdated}</p>
          </div>
        </div>
      }
      advisory={advisory}
    >
      <div className="metric-grid">
        <MetricPill icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
        <MetricPill
          icon={Wind}
          label={`Wind ${weather.windDirection}`}
          value={`${weather.windSpeed} km/h`}
          tone={weather.windSpeed >= 25 ? 'caution' : 'neutral'}
        />
        <MetricPill
          icon={Thermometer}
          label="UV index"
          value={String(weather.uvIndex)}
          tone={weather.uvIndex >= 8 ? 'warning' : 'neutral'}
        />
        <MetricPill
          icon={Gauge}
          label="Air quality"
          value={String(weather.aqi)}
          tone={airIsPoor ? 'poor' : 'good'}
        />
        <MetricPill
          icon={Eye}
          label="Visibility"
          value={`${weather.visibility} km`}
          tone={weather.visibility < 3 ? 'caution' : 'neutral'}
        />
        <MetricPill icon={CloudRain} label="Rain 24h" value={`${weather.rainfall24h} mm`} />
      </div>

      <div className="sun-strip">
        <div className="sun-strip__item">
          <Sunrise size={14} strokeWidth={2} aria-hidden="true" />
          <span className="sun-strip__label">Sunrise</span>
          <span className="sun-strip__value">{weather.sunrise}</span>
        </div>
        <div className="sun-strip__item">
          <Sunset size={14} strokeWidth={2} aria-hidden="true" />
          <span className="sun-strip__label">Sunset</span>
          <span className="sun-strip__value">{weather.sunset}</span>
        </div>
      </div>
    </WidgetShell>
  );
}
