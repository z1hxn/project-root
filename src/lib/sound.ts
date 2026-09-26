import type { OSSettings } from './os-settings';

/** A short local notification tone, controlled by the workstation sound settings. */
export function playNotification(settings: OSSettings) {
  if (!settings.systemSounds || settings.muted || settings.volume === 0) return;
  try {
    const context = new AudioContext();
    if (context.state === 'suspended') {
      void context.close();
      return;
    }
    const gain = context.createGain();
    const tone = context.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(740, context.currentTime);
    tone.frequency.setValueAtTime(988, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime((settings.volume / 100) * 0.055, context.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
    tone.connect(gain).connect(context.destination);
    tone.start();
    tone.stop(context.currentTime + 0.26);
    tone.onended = () => {
      void context.close();
    };
  } catch {
    /* Audio may be unavailable until a browser user gesture. */
  }
}
