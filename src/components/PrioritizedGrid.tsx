import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PrioritizedWidget, CurrentWeather, SuitabilityMetric, PersonaProfile, WeatherAlert, HourlyForecast, DailyForecast } from '../types';
import { SafetyAlertBanner } from './SafetyAlertBanner';
import { CurrentWeatherCard } from './widgets/CurrentWeatherCard';
import { SuitabilityCard } from './widgets/SuitabilityCard';
import { BestTimeCard } from './widgets/BestTimeCard';
import { HourlyForecastCard } from './widgets/HourlyForecastCard';
import { DailyForecastCard } from './widgets/DailyForecastCard';
import { TravelerCard } from './widgets/TravelerCard';
import { AgricultureCard } from './widgets/AgricultureCard';
import { CommuterCard } from './widgets/CommuterCard';
import { HealthCard } from './widgets/HealthCard';
import { BeachSurfCard } from './widgets/BeachSurfCard';
import { EventPlannerCard } from './widgets/EventPlannerCard';
import { FamilyParentCard } from './widgets/FamilyParentCard';

interface PrioritizedGridProps {
  prioritizedWidgets: PrioritizedWidget[];
  currentWeather: CurrentWeather;
  suitability: SuitabilityMetric;
  activePersona: PersonaProfile;
  alert: WeatherAlert;
  isSafetyOverrideActive: boolean;
  onToggleSimulation: () => void;
  /** Live forecast rows for the selected city; null until loaded or on failure. */
  hourlyForecast?: HourlyForecast[] | null;
  dailyForecast?: DailyForecast[] | null;
}

/**
 * Widgets shown before the "more insights" disclosure is expanded.
 * The engine always returns every widget with a positive score, so without
 * this the page is a flat 12-card column with no visual hierarchy.
 */
const PRIMARY_VISIBLE_COUNT = 6;

/**
 * Bento rhythm for the primary row. Driven by cell position rather than rank
 * number so the layout stays balanced whether or not a safety alert occupies
 * the full-width slot above it.
 */
const SPAN_PATTERN = ['grid-span-2', 'grid-cell', 'grid-cell', 'grid-span-2', 'grid-cell', 'grid-span-2'];

export const PrioritizedGrid: React.FC<PrioritizedGridProps> = ({
  prioritizedWidgets,
  currentWeather,
  suitability,
  activePersona,
  alert,
  isSafetyOverrideActive,
  onToggleSimulation,
  hourlyForecast,
  dailyForecast,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isCollapsible = prioritizedWidgets.length > PRIMARY_VISIBLE_COUNT;
  const primaryWidgets = isCollapsible
    ? prioritizedWidgets.slice(0, PRIMARY_VISIBLE_COUNT)
    : prioritizedWidgets;
  const extraWidgets = isCollapsible
    ? prioritizedWidgets.slice(PRIMARY_VISIBLE_COUNT)
    : [];

  /**
   * Copy for the secondary-insights disclosure. Count and persona are read
   * from the existing data rather than hardcoded, so the control stays correct
   * for whichever persona and ranking the engine produced.
   */
  const extraNoun = extraWidgets.length === 1 ? 'insight' : 'insights';
  const extraSummary = `${extraWidgets.length} additional ${extraNoun}`;
  const showLabel = `View all insights — ${extraSummary} for your ${activePersona.name} profile`;
  const hideLabel = `Hide additional insights — ${extraSummary} for your ${activePersona.name} profile`;
  const toggleLabel = isExpanded ? 'Hide additional insights' : 'View all insights';

  const renderWidget = (widget: PrioritizedWidget, rankNumber: number) => {
    switch (widget.id) {
      case 'safety_alert':
        return (
          <SafetyAlertBanner
            alert={alert}
            widgetMeta={widget}
            isSimulated={isSafetyOverrideActive}
            onToggleSimulation={onToggleSimulation}
          />
        );
      case 'persona_suitability':
        return (
          <SuitabilityCard
            suitability={suitability}
            persona={activePersona}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'best_time_window':
        return (
          <BestTimeCard
            activePersonaId={activePersona.id}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'current_weather':
        return (
          <CurrentWeatherCard
            weather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'hourly_forecast':
        return (
          <HourlyForecastCard
            widgetMeta={widget}
            rankNumber={rankNumber}
            hours={hourlyForecast}
          />
        );
      case 'daily_forecast':
        return (
          <DailyForecastCard
            widgetMeta={widget}
            rankNumber={rankNumber}
            days={dailyForecast}
          />
        );
      case 'traveler_comparison':
        return (
          <TravelerCard
            currentWeather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'agriculture_insights':
        return (
          <AgricultureCard
            currentWeather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'commuter_advisory':
        return (
          <CommuterCard
            currentWeather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'health_environment':
        return (
          <HealthCard
            currentWeather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'beach_coastal':
        return (
          <BeachSurfCard
            currentWeather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'event_planner':
        return (
          <EventPlannerCard
            currentWeather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      case 'family_outdoor':
        return (
          <FamilyParentCard
            currentWeather={currentWeather}
            widgetMeta={widget}
            rankNumber={rankNumber}
          />
        );
      default:
        return null;
    }
  };

  /** Renders one grid row of widgets. Safety always takes the full width. */
  const renderCells = (widgets: PrioritizedWidget[], rankOffset: number, compact: boolean) => {
    let cell = 0;
    return widgets.map((widget, index) => {
      const rankNumber = rankOffset + index + 1;

      if (widget.id === 'safety_alert') {
        return (
          <div className="grid-full" key={widget.id}>
            {renderWidget(widget, rankNumber)}
          </div>
        );
      }

      const spanClass = compact ? 'grid-cell' : SPAN_PATTERN[cell] ?? 'grid-cell';
      cell += 1;

      return (
        <div className={spanClass} data-rank={rankNumber} key={widget.id}>
          {renderWidget(widget, rankNumber)}
        </div>
      );
    });
  };

  return (
    <div className="widget-stack">
      <div className="homepage-grid">{renderCells(primaryWidgets, 0, false)}</div>

      {extraWidgets.length > 0 && (
        <>
          <div className="insights-disclosure">
            <p className="eyebrow insights-disclosure__eyebrow">More weather insights</p>
            <p className="insights-disclosure__meta">
              {extraSummary} for your {activePersona.name} profile
            </p>
            <button
              type="button"
              className="disclosure"
              aria-expanded={isExpanded}
              aria-controls="more-insights"
              /*
               * The button's visible label ("View all insights") is a subset of
               * this name, so the accessible name still satisfies WCAG 2.5.3
               * Label in Name while carrying the count and persona context that
               * now lives in the surrounding prose.
               */
              aria-label={isExpanded ? hideLabel : showLabel}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>{toggleLabel}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>

          <div
            id="more-insights"
            className="homepage-grid homepage-grid--secondary"
            aria-label="Additional insights"
            hidden={!isExpanded}
          >
            {renderCells(extraWidgets, PRIMARY_VISIBLE_COUNT, true)}
          </div>
        </>
      )}
    </div>
  );
};
