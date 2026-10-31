import type { ReactNode } from 'react';
import './Button.css';

export function Button({
  children,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) {
  return (
    <button type="button" className={`button ${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
