import React from 'react';
import {
  CloudSun,
  MapPin,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { LOCATIONS } from '../data/mockData';

interface AppBarProps {
  currentCityId: string;
  onCityChange: (cityId: string) => void;
  activeScenario: string;
  onScenarioChange: (scenario: string) => void;
  isSafetyOverrideActive: boolean;
  onToggleSafetyOverride: () => void;
  onOpenExplainability: () => void;
}

/**
 * Sticky application bar.
 *
 * Behaviour is identical to the previous Navbar: same LOCATIONS data, same
 * scenario values, same handlers. Only the markup and styling changed, and
 * the controls are now real buttons plus labelled native selects, so they are
 * keyboard and screen-reader accessible.
 */
export const AppBar: React.FC<AppBarProps> = ({
  currentCityId,
  onCityChange,
  activeScenario,
  onScenarioChange,
  isSafetyOverrideActive,
  onToggleSafetyOverride,
  onOpenExplainability
}) => {
  return (
    <div className="app-bar-shell">
      <header className="app-bar">
        <div className="app-bar__brand">
          <div className="brand-mark" aria-hidden="true">
            <CloudSun size={21} />
          </div>

          <div className="brand-text">
            <div className="brand-title">
              MausamIQ
            </div>
            <p className="brand-subtitle">
              <Sparkles size={12} aria-hidden="true" />
              <span>Persona weather intelligence for IMD Mausam</span>
            </p>
          </div>
        </div>

        <div className="app-bar__controls">
          {/* Location selector */}
          <div className="control control--select">
            <MapPin size={15} className="control__icon" aria-hidden="true" />
            <select
              className="select-control"
              aria-label="Select location"
              value={currentCityId}
              onChange={(e) => onCityChange(e.target.value)}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}, {loc.state}
                  {loc.isDestination ? ' (destination)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
          </div>

          {/* Weather condition simulator */}
          <div className="control control--select">
            <SlidersHorizontal size={15} className="control__icon" aria-hidden="true" />
            <select
              className="select-control"
              aria-label="Simulate weather condition scenario"
              title="Simulate weather condition scenario for testing"
              value={activeScenario}
              onChange={(e) => onScenarioChange(e.target.value)}
            >
              <option value="normal">Normal weather</option>
              <option value="heavy_rain">Heavy rain / downpour</option>
              <option value="severe_heatwave">Extreme heatwave</option>
              <option value="dense_fog">Dense fog hazard</option>
            </select>
            <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
          </div>

          {/* Safety override simulation */}
          <button
            type="button"
            className="btn btn--danger"
            data-active={isSafetyOverrideActive}
            aria-pressed={isSafetyOverrideActive}
            onClick={onToggleSafetyOverride}
            title="Toggle severe alert safety override to test priority elevation"
          >
            <AlertTriangle size={15} className="btn__icon" aria-hidden="true" />
            <span className="btn__label--optional">
              {isSafetyOverrideActive ? 'Severe alert override: on' : 'Simulate severe alert'}
            </span>
          </button>

          {/* Ranking engine / explainability */}
          <button
            type="button"
            className="btn btn--accent"
            onClick={onOpenExplainability}
            title="View how MausamIQ prioritises widgets based on persona and safety"
          >
            <HelpCircle size={15} className="btn__icon" aria-hidden="true" />
            <span className="btn__label--optional">Ranking engine</span>
          </button>
        </div>
      </header>
    </div>
  );
};
