'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SlackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'approve' | 'reject' | 'scale' | 'pause';
  children: ReactNode;
}

export default function SlackButton({ variant, children, ...props }: SlackButtonProps) {
  const variantClass: Record<string, string> = {
    approve: 'slack-btn slack-btn-approve',
    reject: 'slack-btn slack-btn-reject',
    scale: 'slack-btn slack-btn-scale',
    pause: 'slack-btn slack-btn-pause',
  };

  return (
    <button className={variantClass[variant]} {...props}>
      {children}
    </button>
  );
}
