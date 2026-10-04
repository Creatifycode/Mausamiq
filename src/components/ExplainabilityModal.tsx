import React, { useEffect, useRef } from 'react';
import { X, Cpu, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import type { PrioritizedWidget, PersonaId } from '../types';
import { PERSONAS } from '../data/mockData';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  prioritizedWidgets: PrioritizedWidget[];
  activePersonaId: PersonaId;
  isSafetyOverrideActive: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  prioritizedWidgets,
  activePersonaId,
  isSafetyOverrideActive
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const activePersona = PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];

  // Move focus into the dialog on open, restore it on close, and lock the
  // page behind the overlay from scrolling.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // Escape to dismiss, Tab cycles within the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !cardRef.current) return;

      const nodes = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation">
      {/*
        Backdrop dismissal is a real button rather than a click handler on a
        div, so it is reachable by keyboard and exposed to assistive tech.
        It is a sibling of the dialog, never a parent, so no interactive
        content ends up nested inside a button.
      */}
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close ranking logic dialog"
        onClick={onClose}
      />
      <div
        className="modal-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explainability-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div className="modal-icon" aria-hidden="true">
              <Cpu size={19} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="modal-title" id="explainability-title">
                MausamIQ Ranking Logic
              </h2>
              <p className="modal-subtitle">
                Deterministic prioritisation matrix and safety rules
              </p>
            </div>
          </div>

          <button
            type="button"
            ref={closeRef}
            className="modal-close"
            onClick={onClose}
            aria-label="Close ranking explanation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Prioritisation pipeline */}
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <div className="section-title" style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}>
            <Sparkles size={15} className="section-title__icon" aria-hidden="true" />
            <span>Prioritisation pipeline</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '0.75rem'
            }}
          >
            <span style={{ color: activePersona.accentColor, fontWeight: 700 }}>
              Base persona weight
            </span>
            <span aria-hidden="true" style={{ color: 'var(--text-dim)' }}>+</span>
            <span style={{ color: 'var(--status-warning-text)', fontWeight: 700 }}>
              Weather context boost
            </span>
            <span aria-hidden="true" style={{ color: 'var(--text-dim)' }}>+</span>
            <span style={{ color: 'var(--status-danger-text)', fontWeight: 700 }}>
              Safety override
            </span>
            <ArrowRight size={14} className="section-title__icon" aria-hidden="true" />
            <span
              style={{
                background: 'var(--persona-accent-soft)',
                border: '1px solid var(--persona-accent-line)',
                color: 'var(--persona-accent-ink)',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                fontWeight: 700
              }}
            >
              Final card rank
            </span>
          </div>
        </div>

        {/* Safety rule status */}
        <div
          className="glass-panel"
          data-status={isSafetyOverrideActive ? 'danger' : 'optimal'}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.9rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: '14px',
            background: isSafetyOverrideActive
              ? 'var(--status-danger-soft)'
              : 'var(--status-optimal-soft)',
            borderColor: isSafetyOverrideActive
              ? 'var(--status-danger-line)'
              : 'var(--status-optimal-line)'
          }}
        >
          <ShieldCheck
            size={21}
            aria-hidden="true"
            style={{
              flexShrink: 0,
              color: isSafetyOverrideActive
                ? 'var(--status-danger-text)'
                : 'var(--status-optimal-text)'
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: isSafetyOverrideActive
                  ? 'var(--status-danger-text)'
                  : 'var(--status-optimal-text)'
              }}
            >
              Safety rule status:{' '}
              {isSafetyOverrideActive ? 'override active' : 'normal operational state'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isSafetyOverrideActive
                ? 'A severe thunderstorm alert forces the emergency warning card to rank first regardless of the selected persona.'
                : 'No severe atmospheric hazard detected. Persona weighting rules apply standard prioritisation.'}
            </p>
          </div>
        </div>

        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
          Current ranking for &ldquo;{activePersona.name}&rdquo;
        </h3>

        <div className="ranking-list">
          {prioritizedWidgets.map((widget, index) => (
            <div className="ranking-row" key={widget.id}>
              <div className="ranking-row__main">
                <span className="ranking-row__rank" data-top={index === 0} aria-hidden="true">
                  {index + 1}
                </span>
                <div className="ranking-row__body">
                  <div className="ranking-row__title">{widget.title}</div>
                  <div className="ranking-row__reason">{widget.reason}</div>
                </div>
              </div>

              <span
                className="ranking-row__score"
                data-override={widget.priorityScore >= 1000}
              >
                Score {widget.priorityScore}
              </span>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn--accent" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
