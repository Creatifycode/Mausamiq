import { Droplets } from 'lucide-react';
import type { HourlyForecast, PrioritizedWidget } from '../../types';
import { MOCK_HOURLY_FORECAST } from '../../data/mockData';
import { WidgetShell } from './WidgetShell';
import { getWeatherIcon } from './weatherIcon';

interface HourlyForecastCardProps {
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
  /**
   * Live hourly rows, already normalized by the adapter. Falls back to the
   * curated sample when the live fetch has not landed or produced nothing, so
   * the widget always has rows to render.
   */
  hours?: HourlyForecast[] | null;
}

export function HourlyForecastCard({
  widgetMeta,
  rankNumber,
  hours: liveHours,
}: HourlyForecastCardProps) {
  const hours = liveHours && liveHours.length > 0 ? liveHours : MOCK_HOURLY_FORECAST;
  const temps = hours.map((hour) => hour.temp);
  const peakTemp = Math.max(...temps);

  return (
    <WidgetShell
      icon={Droplets}
      title="Hourly outlook"
      subtitle={`Next ${hours.length} hours`}
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
    >
      <div className="hourly-strip" role="list">
        {hours.map((hour) => {
          const Icon = getWeatherIcon(hour.condition);
          return (
            <div key={hour.time} className="hour-cell" role="listitem">
              <p className="hour-cell__time">{hour.time}</p>
              <Icon className="hour-cell__icon" size={17} strokeWidth={1.9} aria-hidden="true" />
              <p className="hour-cell__temp">
                {hour.temp}&deg;
                {hour.temp === peakTemp ? <span className="hour-cell__peak">peak</span> : null}
              </p>
              <p className="hour-cell__rain">{hour.rainProbability}%</p>
              <div
                className="hour-cell__rainbar"
                style={{ height: `${Math.max(4, hour.rainProbability * 0.32)}px` }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
      <p className="hourly-strip__legend">
        <span className="hourly-strip__legend-swatch" aria-hidden="true" />
        Precipitation chance
      </p>
    </WidgetShell>
  );
}
