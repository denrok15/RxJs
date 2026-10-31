import type { ReactNode } from 'react';
import './Note.css';

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="note">
      <span>i</span>
      <div>{children}</div>
    </div>
  );
}
