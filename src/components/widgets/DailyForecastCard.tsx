import { CloudRain } from 'lucide-react';
import type { DailyForecast, PrioritizedWidget } from '../../types';
import { MOCK_DAILY_FORECAST } from '../../data/mockData';
import { WidgetShell } from './WidgetShell';
import { getWeatherIcon } from './weatherIcon';

interface DailyForecastCardProps {
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
  /**
   * Live daily rows, already normalized by the adapter. Falls back to the
   * curated sample when the live fetch has not landed or produced nothing.
   */
  days?: DailyForecast[] | null;
}

export function DailyForecastCard({
  widgetMeta,
  rankNumber,
  days: liveDays,
}: DailyForecastCardProps) {
  const days = liveDays && liveDays.length > 0 ? liveDays : MOCK_DAILY_FORECAST;

  // Range bar geometry is a view of the existing tempMin/tempMax values.
  const weekMin = Math.min(...days.map((day) => day.tempMin));
  const weekMax = Math.max(...days.map((day) => day.tempMax));
  const span = Math.max(1, weekMax - weekMin);

  return (
    <WidgetShell
      icon={CloudRain}
      title="7-day forecast"
      subtitle={`${weekMin}° to ${weekMax}°C across the week`}
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
    >
      <div className="day-list" role="list">
        {days.map((day) => {
          const Icon = getWeatherIcon(day.condition);
          const offset = ((day.tempMin - weekMin) / span) * 100;
          const width = ((day.tempMax - day.tempMin) / span) * 100;

          return (
            <div key={day.day} className="day-row" role="listitem" title={day.summary}>
              <div className="day-row__label">
                <span className="day-row__day">{day.day}</span>
                <span className="day-row__date">{day.date}</span>
              </div>
              <Icon className="day-row__icon" size={16} strokeWidth={1.9} aria-hidden="true" />
              <span className="day-row__rain">{day.rainProbability}%</span>
              <span className="day-row__min">{day.tempMin}&deg;</span>
              <div className="day-row__track">
                <span
                  className="day-row__range"
                  style={{ marginLeft: `${offset}%`, width: `${Math.max(width, 6)}%` }}
                />
              </div>
              <span className="day-row__max">{day.tempMax}&deg;</span>
            </div>
          );
        })}
      </div>
      <p className="day-list__legend">Min and max against the weekly range</p>
    </WidgetShell>
  );
}
