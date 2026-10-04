import { Compass, Luggage, MapPin, Plane } from 'lucide-react';
import type { CurrentWeather, PrioritizedWidget } from '../../types';
import { WidgetShell } from './WidgetShell';
import { MetricPill } from '../ui/MetricPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';
import { getWeatherIcon } from './weatherIcon';

interface TravelerCardProps {
  currentWeather: CurrentWeather;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

/** Shimla remains the hardcoded comparison destination, as in the original widget. */
const DESTINATION = { city: 'Shimla, HP', temp: 16, condition: 'Partly Cloudy' };

/**
 * Returns the condition glyph as an element. Declared as a plain helper rather
 * than a component so the icon is never re-created as a component type during
 * render.
 */
function conditionGlyph(condition: string, size: number) {
  const Icon = getWeatherIcon(condition);
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}

export function TravelerCard({ currentWeather, widgetMeta, rankNumber }: TravelerCardProps) {
  const delta = currentWeather.temp - DESTINATION.temp;
  const cooler = delta > 0;

  return (
    <WidgetShell
      icon={Compass}
      title="Destination comparison"
      subtitle="Origin against a popular hill destination"
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
    >
      <div className="compare">
        <div className="compare__side">
          <p className="compare__label">
            <MapPin size={13} strokeWidth={2} aria-hidden="true" />
            Origin
          </p>
          <p className="compare__city">{currentWeather.city}</p>
          <p className="compare__temp">
            {currentWeather.temp}
            <span className="compare__unit">&deg;C</span>
          </p>
          <p className="compare__cond">
            {conditionGlyph(currentWeather.condition, 14)}
            {currentWeather.condition}
          </p>
          <MetricPill
            icon={Compass}
            label="Visibility"
            value={`${currentWeather.visibility} km`}
            tone={currentWeather.visibility < 3 ? 'caution' : 'neutral'}
          />
        </div>

        <div className="compare__side compare__side--destination">
          <p className="compare__label">
            <Plane size={13} strokeWidth={2} aria-hidden="true" />
            Destination
          </p>
          <p className="compare__city">{DESTINATION.city}</p>
          <p className="compare__temp">
            {DESTINATION.temp}
            <span className="compare__unit">&deg;C</span>
          </p>
          <p className="compare__cond">
            {conditionGlyph(DESTINATION.condition, 14)}
            {DESTINATION.condition}
          </p>
          <MetricPill icon={Luggage} label="Hill trip" value="Favourable" tone="good" />
        </div>
      </div>

      <AdvisoryBox tone="info" icon={Luggage} title="Packing guidance">
        {cooler ? (
          <>
            Shimla reads {delta}&deg;C cooler than {currentWeather.city}. Pack thermal layers,
            fleece jackets and comfortable hiking footwear.
          </>
        ) : (
          <>
            Shimla reads {Math.abs(delta)}&deg;C warmer than {currentWeather.city}. Carry light
            layers for the journey as hill temperatures swing at altitude.
          </>
        )}
      </AdvisoryBox>
    </WidgetShell>
  );
}
