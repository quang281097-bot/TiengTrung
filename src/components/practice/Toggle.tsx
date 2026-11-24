'use client';

import type { ReactNode } from 'react';

export default function Toggle({
  pressed,
  onChange,
  children,
}: {
  pressed: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="lx-toggle" aria-pressed={pressed} onClick={() => onChange(!pressed)}>
      <span className="lx-toggle-dot" aria-hidden="true" />
      {children}
    </button>
  );
}
