import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Triggers a light haptic impact (e.g. for reactions, likes, toggles).
 * Uses native iOS/Android Taptic Engine / Vibrator via Capacitor when in-app,
 * falls back to navigator.vibrate() where supported (Android/Web), and safely no-ops on desktop/unsupported browsers.
 */
export async function hapticLight(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (Capacitor.isPluginAvailable('Haptics')) {
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    // Ignore any haptic errors silently
  }
}

/**
 * Triggers a medium haptic impact.
 */
export async function hapticMedium(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (Capacitor.isPluginAvailable('Haptics')) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(25);
    }
  } catch {
    // Ignore any haptic errors silently
  }
}

/**
 * Triggers a success notification haptic pattern (e.g. for sent messages, completed bookings/forms).
 */
export async function hapticSuccess(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (Capacitor.isPluginAvailable('Haptics')) {
      await Haptics.notification({ type: NotificationType.Success });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate([15, 60, 20]);
    }
  } catch {
    // Ignore any haptic errors silently
  }
}

/**
 * Triggers an error / warning haptic pattern.
 */
export async function hapticError(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (Capacitor.isPluginAvailable('Haptics')) {
      await Haptics.notification({ type: NotificationType.Error });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  } catch {
    // Ignore any haptic errors silently
  }
}
