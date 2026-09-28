import type { GameEventType } from '../game/types.ts';
import { playNoise, playNotes, playTone } from './synth.ts';
import type { Voice } from './synth.ts';

type Sound = (voice: Voice) => void;

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880;
const C6 = 1046.5;
const D6 = 1174.66;
const E6 = 1318.51;

const SOUNDS: Record<GameEventType, Sound> = {
  pickup: (voice) => playTone(voice, { frequency: 520, glideTo: 760, duration: 0.08, volume: 0.22, type: 'triangle' }),
  drop: (voice) => playTone(voice, { frequency: 430, glideTo: 290, duration: 0.09, volume: 0.22, type: 'triangle' }),
  plated: (voice) => playNotes(voice, [E5, A5], 0.06, { duration: 0.1, volume: 0.2, type: 'triangle' }),
  nope: (voice) => playTone(voice, { frequency: 150, glideTo: 110, duration: 0.14, volume: 0.16, type: 'square' }),
  chop: (voice) => {
    playNoise(voice, { duration: 0.05, volume: 0.3, filter: 'highpass', frequency: 1800 });
    playTone(voice, { frequency: 210, glideTo: 120, duration: 0.05, volume: 0.2, type: 'triangle' });
  },
  sliced: (voice) => playNotes(voice, [G5, C6, E6], 0.055, { duration: 0.12, volume: 0.18, type: 'triangle' }),
  rolled: (voice) => playNotes(voice, [C5, G5, C6, E6], 0.05, { duration: 0.12, volume: 0.18, type: 'triangle' }),
  cookStart: (voice) => playTone(voice, { frequency: 300, glideTo: 420, duration: 0.18, volume: 0.18, type: 'sine' }),
  cookDone: (voice) => playNotes(voice, [A5, D6, A5, D6], 0.11, { duration: 0.16, volume: 0.2, type: 'sine' }),
  trash: (voice) => playNoise(voice, { duration: 0.16, volume: 0.3, filter: 'lowpass', frequency: 700, glideTo: 180 }),
  dash: (voice) => playNoise(voice, { duration: 0.16, volume: 0.16, filter: 'bandpass', frequency: 500, glideTo: 2400 }),
  newOrder: (voice) => {
    playTone(voice, { frequency: E6, duration: 0.5, volume: 0.16, type: 'sine' });
    playTone(voice, { frequency: E6 * 2.01, duration: 0.3, volume: 0.05, type: 'sine' });
  },
  served: (voice) => playNotes(voice, [C5, E5, G5, C6, E6], 0.06, { duration: 0.2, volume: 0.22, type: 'triangle' }),
  rejected: (voice) => playNotes(voice, [220, 165], 0.1, { duration: 0.16, volume: 0.18, type: 'square' }),
  expired: (voice) => {
    playTone(voice, { frequency: 330, glideTo: 90, duration: 0.5, volume: 0.22, type: 'sawtooth' });
    playNoise(voice, { duration: 0.3, volume: 0.12, filter: 'lowpass', frequency: 500 });
  },
  beltWarn: (voice) => playNotes(voice, [A5, A5, A5], 0.22, { duration: 0.1, volume: 0.14, type: 'square' }),
  beltFlip: (voice) => {
    playNoise(voice, { duration: 0.2, volume: 0.3, filter: 'lowpass', frequency: 400 });
    playTone(voice, { frequency: 120, glideTo: 60, duration: 0.25, volume: 0.3, type: 'sine' });
  },
  catIn: (voice) => {
    playTone(voice, { frequency: 620, glideTo: 940, duration: 0.16, volume: 0.14, type: 'sawtooth' });
    playTone(voice, { frequency: 940, glideTo: 520, duration: 0.3, volume: 0.14, type: 'sawtooth', delay: 0.16 });
  },
  catSteal: (voice) => playNotes(voice, [392, 370, 349, 262], 0.13, { duration: 0.2, volume: 0.18, type: 'sawtooth' }),
  catShoo: (voice) => playNoise(voice, { duration: 0.3, volume: 0.22, filter: 'highpass', frequency: 3000 }),
  tick: (voice) => playTone(voice, { frequency: 1000, duration: 0.05, volume: 0.14, type: 'square' }),
  timeUp: (voice) => {
    playTone(voice, { frequency: 196, duration: 1.6, volume: 0.3, type: 'sine' });
    playTone(voice, { frequency: 294, duration: 1.2, volume: 0.14, type: 'sine' });
    playTone(voice, { frequency: 466, duration: 0.8, volume: 0.06, type: 'triangle' });
  },
};

/** Plays the sound for a game event. */
export function playEventSound(voice: Voice, type: GameEventType): void {
  SOUNDS[type](voice);
}

/** A soft click for menu buttons. */
export function playClick(voice: Voice): void {
  playTone(voice, { frequency: 700, glideTo: 900, duration: 0.06, volume: 0.16, type: 'triangle' });
}

/** Countdown beeps before a shift: low for the numbers, high for go. */
export function playCountdown(voice: Voice, isGo: boolean): void {
  playTone(voice, { frequency: isGo ? C6 : C5, duration: isGo ? 0.4 : 0.15, volume: 0.2, type: 'square' });
}

/** A short fanfare for the results screen, one note per star. */
export function playFanfare(voice: Voice, stars: number): void {
  const notes = [C5, E5, G5, C6].slice(0, stars + 1);
  playNotes(voice, notes, 0.16, { duration: 0.4, volume: 0.2, type: 'triangle', delay: 0.3 });
}
