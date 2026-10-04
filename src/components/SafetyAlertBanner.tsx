import React from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, TriangleAlert } from 'lucide-react';
import type { PrioritizedWidget, WeatherAlert } from '../types';
import { RankBadge } from './ui/RankBadge';
import { StatusPill } from './ui/StatusPill';
import { AdvisoryBox } from './ui/AdvisoryBox';

interface SafetyAlertBannerProps {
  alert: WeatherAlert;
  widgetMeta: PrioritizedWidget;
  isSimulated: boolean;
  onToggleSimulation: () => void;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({
  alert,
  widgetMeta,
  isSimulated,
  onToggleSimulation
}) => {
  if (!isSimulated && alert.severity !== 'severe' && alert.severity !== 'extreme') {
    return (
      <div className="widget-card widget-card--featured safety-alert safety-alert--clear">
        <div className="safety-alert__row">
          <span className="safety-alert__glyph" aria-hidden="true">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </span>
          <div className="safety-alert__text">
            <p className="safety-alert__head">IMD Regional Sector Status: Operational &amp; Normal</p>
            <p className="safety-alert__sub">
              No active severe weather emergency warnings. Persona preferences dictating widget rank
              order.
            </p>
          </div>
          <StatusPill tone="good" size="sm">
            All clear
          </StatusPill>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={onToggleSimulation}
            title="Simulate a severe thunderstorm and flash flood warning to test the rank 1 safety override"
          >
            <TriangleAlert size={14} className="btn__icon" aria-hidden="true" />
            Simulate severe weather
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card widget-card--featured safety-alert safety-alert--severe">
      <header className="widget-card__header">
        <span className="widget-card__icon" aria-hidden="true">
          <ShieldAlert size={20} strokeWidth={2.2} />
        </span>
        <div className="widget-card__heading">
          <h3 className="widget-card__title">{alert.title}</h3>
          <p className="widget-card__subtitle">
            Issued by IMD Regional Meteorological Centre &middot; Effective until{' '}
            {alert.effectiveUntil}
          </p>
        </div>
        <div className="widget-card__aside">
          <RankBadge rankNumber={1} tier="featured" isSafetyOverride />
          <button type="button" className="btn btn--ghost btn--sm" onClick={onToggleSimulation}>
            Clear warning
          </button>
        </div>
      </header>

      <div className="widget-card__body">
        <div className="safety-alert__headline">
          <p className="safety-alert__headline-text">{alert.headline}</p>
          <p className="safety-alert__desc">{alert.description}</p>
        </div>

        <AdvisoryBox tone="danger" icon={CheckCircle2} title="IMD safety &amp; action protocol">
          {alert.instruction}
        </AdvisoryBox>
      </div>

      <p className="widget-card__why">
        <span className="widget-card__why-label">Why this card is #1</span>
        {widgetMeta.reason}
      </p>
    </div>
  );
};
