'use client';

import React from 'react';
import { useSwipeBack, SwipeBackOptions } from '@/lib/useSwipeBack';

interface SwipeBackWrapperProps extends SwipeBackOptions {
  children: React.ReactNode;
  className?: string;
}

export default function SwipeBackWrapper({
  children,
  className = '',
  onBack,
  fallbackUrl,
  edgeThreshold = 50,
  minDistance = 70,
  maxVertical = 50,
  enabled = true
}: SwipeBackWrapperProps) {
  useSwipeBack({
    onBack,
    fallbackUrl,
    edgeThreshold,
    minDistance,
    maxVertical,
    enabled
  });

  return <div className={className}>{children}</div>;
}
