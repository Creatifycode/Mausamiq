import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { PersonaId } from '../types';

interface AppShellProps {
  personaId: PersonaId;
  accentColor: string;
  children: ReactNode;
}

/**
 * Presentational page shell only.
 *
 * Owns no state and performs no calculation. It receives the active persona
 * id and its accent colour (both already derived in App.tsx from the existing
 * PersonaProfile data) and exposes them to CSS as a data attribute plus a
 * custom property, so the whole page re-themes when the persona changes.
 */
export const AppShell: React.FC<AppShellProps> = ({
  personaId,
  accentColor,
  children
}) => {
  const accentVars = { '--persona-accent': accentColor } as CSSProperties;

  return (
    <div className="app-shell" data-persona={personaId} style={accentVars}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {children}

      <footer className="app-footer">
        <span>
          <strong>MausamIQ</strong> — persona-aware weather intelligence layer
        </span>
        <span>
          Card order is produced by a deterministic prioritisation engine.
          Use <strong>Ranking Engine</strong> in the header to inspect the
          reasoning behind every position.
        </span>
        <span>Forecast data shown is representative sample data for demonstration.</span>
      </footer>
    </div>
  );
};
