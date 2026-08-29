'use client';

import { useEffect } from 'react';

export default function MobileLongPressProtection() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Prevent default context menu (long press callout / link preview) on interactive elements
    const handleContextMenu = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Allow context menu only on text inputs / textareas so user can paste or select text
      const isInput = target.closest('input, textarea, [contenteditable="true"]');
      if (!isInput) {
        e.preventDefault();
      }
    };

    // 2. Prevent drag gestures on links and images that iOS can interpret as drag-to-Safari
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInput = target.closest('input, textarea, [contenteditable="true"]');
      if (!isInput) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, []);

  return null;
}
