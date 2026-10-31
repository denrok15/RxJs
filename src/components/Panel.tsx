import type { ReactNode } from 'react';
import './Panel.css';

export function Panel({
  title,
  label,
  children,
  className = '',
}: {
  title: string;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {label && <span className="eyebrow">{label}</span>}
      </div>
      {children}
    </section>
  );
}
