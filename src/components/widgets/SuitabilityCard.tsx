import { Clock, Lightbulb, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PersonaProfile, PrioritizedWidget, SuitabilityMetric } from '../../types';
import { WidgetShell } from './WidgetShell';
import { ScoreGauge } from '../ui/ScoreGauge';
import { StatusPill } from '../ui/StatusPill';
import { AdvisoryBox } from '../ui/AdvisoryBox';

interface SuitabilityCardProps {
  suitability: SuitabilityMetric;
  persona: PersonaProfile;
  widgetMeta: PrioritizedWidget;
  rankNumber: number;
}

const IMPACT_ICON: Record<SuitabilityMetric['keyFactors'][number]['impact'], LucideIcon> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

/**
 * Presents the score exactly as suitabilityCalculators produced it. This widget
 * only renders the value - it never recomputes it.
 */
export function SuitabilityCard({
  suitability,
  persona,
  widgetMeta,
  rankNumber,
}: SuitabilityCardProps) {
  const { score, label, status, summary, bestWindow, keyFactors, actionTips } = suitability;

  return (
    <WidgetShell
      icon={Lightbulb}
      title="Suitability score"
      subtitle={`Judged for ${persona.name.toLowerCase()}`}
      rankNumber={rankNumber}
      widgetMeta={widgetMeta}
      aside={<StatusPill tone={status} size="sm">{label}</StatusPill>}
      lead={
        <div className="suitability-lead">
          <ScoreGauge
            score={score}
            tone={status}
            size="lg"
            label={`Suitability score ${score} out of 100, rated ${label}`}
            caption="out of 100"
          />
          <div className="suitability-lead__text">
            <p className="suitability-lead__summary">{summary}</p>
            {bestWindow ? (
              <p className="suitability-lead__window">
                <Clock size={14} strokeWidth={2} aria-hidden="true" />
                <span className="suitability-lead__window-label">Best window</span>
                <span className="suitability-lead__window-value">
                  {bestWindow.start} &ndash; {bestWindow.end}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      }
      advisory={
        actionTips.length > 0 ? (
          <AdvisoryBox tone={status === 'danger' ? 'danger' : 'info'} icon={Lightbulb} title="Suggested actions">
            <ul className="advisory__list">
              {actionTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </AdvisoryBox>
        ) : undefined
      }
    >
      <div className="factor-list">
        {keyFactors.map((factor) => {
          const Icon = IMPACT_ICON[factor.impact];
          return (
            <div key={factor.name} className={`factor factor--${factor.impact}`}>
              <Icon className="factor__icon" size={15} strokeWidth={2.4} aria-hidden="true" />
              <div className="factor__text">
                <p className="factor__name">{factor.name}</p>
                <p className="factor__detail">{factor.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}
