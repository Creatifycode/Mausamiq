import React from 'react';
import { Clock, HelpCircle, Target, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import type { PersonaProfile, SuitabilityMetric, CurrentWeather } from '../types';
import type { WeatherRecommendation } from '../intelligence/recommendationEngine';
import type { RiskAnalysis } from '../intelligence/riskEngine';
import { ScoreGauge } from './ui/ScoreGauge';
import { StatusPill } from './ui/StatusPill';
import { AdvisoryBox, type AdvisoryTone } from './ui/AdvisoryBox';

interface HeroBandProps {
  persona: PersonaProfile;
  suitability: SuitabilityMetric;
  weather: CurrentWeather;
  onOpenExplainability: () => void;
  /**
   * Optional output of src/intelligence. Both are additive: when they are
   * absent (or null, if the intelligence pipeline failed) the hero renders
   * exactly as it did before.
   *
   * Deliberately kept distinct from `suitability`:
   *   suitability  = "how good is the weather for this persona?"
   *   intelligence = "given the active weather risks, what should I do?"
   */
  recommendation?: WeatherRecommendation | null;
  riskAnalysis?: RiskAnalysis | null;
}

/** Icon per factor impact, so the "why" reads at a glance without colour. */
const IMPACT_ICON: Record<SuitabilityMetric['keyFactors'][number]['impact'], React.FC<{ size?: number }>> = {
  positive: CheckCircle2,
  negative: AlertCircle,
  neutral: Info
};

/**
 * Recommendation status -> existing advisory tone. Presentation only; the
 * severity itself is decided by recommendationEngine, never here.
 */
const RECOMMENDATION_TONE: Record<WeatherRecommendation['status'], AdvisoryTone> = {
  recommended: 'success',
  conditional: 'warning',
  not_recommended: 'danger'
};

/**
 * Persona-intelligence hero.
 *
 * Answers one question: why does today's weather matter to *this* persona?
 * Every value shown already exists on the props — nothing here is derived,
 * simulated or invented.
 *
 * Deliberately does NOT restate the full current-weather readout. That is
 * the job of CurrentWeatherCard, which remains in the widget grid. The
 * supporting "metrics" are the suitability key factors, which are already
 * computed by src/smart/suitabilityCalculators.ts and explain the reasoning
 * rather than duplicating raw sensor values.
 */
export const HeroBand: React.FC<HeroBandProps> = ({
  persona,
  suitability,
  weather,
  onOpenExplainability,
  recommendation,
  riskAnalysis
}) => {
  const visibleFactors = suitability.keyFactors.slice(0, 4);

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__grid">
        <div className="hero__identity">
          <div className="hero__eyebrow">
            <span className="eyebrow">Why this matters to you</span>
          </div>

          <h2 className="hero__persona" id="hero-heading">
            <em>{persona.name}</em> in {weather.city}
          </h2>

          <p className="hero__context">
            {persona.shortDesc}
          </p>

          <p className="hero__headline">{suitability.summary}</p>

          {suitability.bestWindow && (
            <p className="hero__window">
              <Clock size={16} aria-hidden="true" />
              <span>
                Best window <strong>{suitability.bestWindow.start}</strong> to{' '}
                <strong>{suitability.bestWindow.end}</strong> — {suitability.bestWindow.note}
              </span>
            </p>
          )}

          {/*
            Weather intelligence. Complements the suitability score above it
            rather than restating it: the gauge answers "how good is this for
            me", this answers "what should I actually do". Both `overallLevel`
            and `summary` are the risk engine's own output — no extra threshold
            is applied here. Reuses the existing AdvisoryBox primitive, so no
            new styles were introduced.
          */}
          {recommendation && (
            <AdvisoryBox
              tone={RECOMMENDATION_TONE[recommendation.status]}
              icon={Sparkles}
              title={recommendation.title}
            >
              <p>{recommendation.recommendation}</p>
              {riskAnalysis && (
                <p>
                  Risk level <strong>{riskAnalysis.overallLevel}</strong> &mdash;{' '}
                  {riskAnalysis.summary}
                </p>
              )}
            </AdvisoryBox>
          )}

          {visibleFactors.length > 0 && (
            <div className="hero__metrics">
              {visibleFactors.map((factor) => {
                const Icon = IMPACT_ICON[factor.impact] ?? Info;
                return (
                  <div className="hero-metric" key={factor.name} data-impact={factor.impact}>
                    <span className="hero-metric__label">
                      <Icon size={13} aria-hidden="true" />
                      {factor.name}
                    </span>
                    <span className="hero-metric__value" title={factor.detail}>
                      {factor.detail}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hero__gauge">
          <ScoreGauge
            score={suitability.score}
            tone={suitability.status}
            size="lg"
            label={`Suitability score ${suitability.score} out of 100, rated ${suitability.label}`}
            caption="out of 100"
          />

          <span className="hero__gauge-label">{suitability.label}</span>

          <StatusPill tone={suitability.status}>
            <Target size={12} strokeWidth={2.2} aria-hidden="true" />
            {suitability.status}
          </StatusPill>

          <button
            type="button"
            className="btn btn--accent"
            onClick={onOpenExplainability}
            title="Inspect how this card was prioritised"
          >
            <HelpCircle size={15} className="btn__icon" aria-hidden="true" />
            <span className="btn__label--optional">Why this card?</span>
          </button>
        </div>
      </div>
    </section>
  );
};
