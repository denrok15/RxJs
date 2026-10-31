import type { ReactNode } from 'react';
import './Metric.css';

export function Metric({
  title,
  value,
  accent = false,
}: {
  title: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? 'accent' : ''}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
