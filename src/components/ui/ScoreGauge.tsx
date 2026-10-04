import type { StatusTone } from './StatusPill';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ScoreGaugeProps {
  /** Existing 0-100 suitability score. Rendered as-is; never recalculated here. */
  score: number;
  tone: StatusTone;
  /** Accessible description, e.g. "Suitability score 84 out of 100". */
  label: string;
  caption?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Static SVG arc gauge. The offset is derived directly from the score so no
 * animation loop or chart dependency is needed.
 */
export function ScoreGauge({ score, tone, label, caption, size = 'md' }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className={`score-gauge score-gauge--${size} score-gauge--${tone}`}>
      <svg className="score-gauge__ring" viewBox="0 0 120 120" role="img" aria-label={label}>
        <circle className="score-gauge__track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="score-gauge__value"
          cx="60"
          cy="60"
          r={RADIUS}
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }}
        />
      </svg>
      <div className="score-gauge__center">
        <span className="score-gauge__number">{clamped}</span>
        {caption ? <span className="score-gauge__caption">{caption}</span> : null}
      </div>
    </div>
  );
}
