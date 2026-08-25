'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MobileFloatingActionProps {
  children: React.ReactNode;
  bottomOffset?: string;
}

export default function MobileFloatingAction({ children, bottomOffset = '88px' }: MobileFloatingActionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="md:hidden select-none"
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        right: '16px',
        zIndex: 9990,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
