import React from 'react';
import type { CSSProperties } from 'react';
import {
  Activity,
  Compass,
  Car,
  Sprout,
  Calendar,
  HeartPulse,
  Waves,
  Users,
  Zap
} from 'lucide-react';
import { PERSONAS } from '../data/mockData';
import type { PersonaId } from '../types';

interface PersonaSelectorProps {
  activePersonaId: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
}

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Activity,
  Compass,
  Car,
  Sprout,
  Calendar,
  HeartPulse,
  Waves,
  Users
};

/**
 * Persona rail.
 *
 * Identical data, ids, labels, icons and selection behaviour as before. The
 * options are now real <button> elements with aria-pressed, so the rail is
 * keyboard operable and exposes its selected state to assistive technology.
 * Each chip carries its own PersonaProfile.accentColor via --chip-accent.
 */
export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  activePersonaId,
  onSelectPersona
}) => {
  const activePersona = PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];
  const ActiveIcon = ICON_MAP[activePersona.iconName] || Activity;

  return (
    <section className="persona-section" aria-labelledby="persona-heading">
      <div className="section-head">
        <h2 className="section-title" id="persona-heading">
          <Zap size={17} className="section-title__icon" aria-hidden="true" />
          <span>Select your context</span>
        </h2>
        <span className="section-head__hint">Card order adapts to your persona</span>
      </div>

      <div className="persona-rail" role="group" aria-label="Weather persona">
        {PERSONAS.map((persona) => {
          const IconComponent = ICON_MAP[persona.iconName] || Activity;
          const isActive = persona.id === activePersonaId;
          const chipVars = { '--chip-accent': persona.accentColor } as CSSProperties;

          return (
            <button
              key={persona.id}
              type="button"
              className="persona-chip"
              style={chipVars}
              aria-pressed={isActive}
              onClick={() => onSelectPersona(persona.id)}
            >
              <span className="persona-chip__icon" aria-hidden="true">
                <IconComponent size={15} />
              </span>
              <span>{persona.name}</span>
            </button>
          );
        })}
      </div>

      <div className="persona-summary">
        <div className="persona-summary__icon" aria-hidden="true">
          <ActiveIcon size={17} />
        </div>

        <div className="persona-summary__body">
          <div className="persona-summary__title">Active persona: {activePersona.name}</div>
          <div className="persona-summary__tagline">{activePersona.tagline}</div>
        </div>

        <div className="persona-summary__metrics">
          {activePersona.primaryMetrics.map((metric) => (
            <span className="metric-chip" key={metric}>
              {metric}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
