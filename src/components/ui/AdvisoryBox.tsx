import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type AdvisoryTone = 'info' | 'success' | 'warning' | 'danger';

interface AdvisoryBoxProps {
  tone: AdvisoryTone;
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}

/** Footer advisory region inside a widget. Tone drives the semantic colour only. */
export function AdvisoryBox({ tone, icon: Icon, title, children }: AdvisoryBoxProps) {
  return (
    <div className={`advisory advisory--${tone}`}>
      <Icon className="advisory__icon" size={15} strokeWidth={2.2} aria-hidden="true" />
      <div className="advisory__body">
        <p className="advisory__title">{title}</p>
        {children ? <div className="advisory__text">{children}</div> : null}
      </div>
    </div>
  );
}
