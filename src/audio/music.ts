import { playTone } from './synth.ts';
import type { Voice } from './synth.ts';

/** Steps of a pentatonic scale above the root, in semitones. */
const SCALE = [0, 2, 5, 7, 9, 12, 14, 17];
const ROOT = 293.66;
const REST = -1;
const MELODY = [
  0, REST, 2, 3, 4, REST, 3, REST, 2, REST, 0, 2, 3, REST, REST, REST,
  4, REST, 5, 4, 3, REST, 2, REST, 3, 4, 2, REST, 0, REST, REST, REST,
  5, REST, 6, 5, 4, REST, 5, REST, 3, REST, 4, 3, 2, REST, REST, REST,
  4, 3, 2, REST, 3, 2, 0, REST, 2, REST, 0, REST, 0, REST, REST, REST,
];
const BASS = [0, 0, 3, 3, 2, 2, 0, 0];
const STEPS_PER_BASS = 8;
const LOOKAHEAD = 0.2;
const TICK_MS = 60;

export interface Music {
  start(): void;
  stop(): void;
  /** Steps per second. The kitchen speeds the tune up near closing time. */
  setPace(pace: number): void;
}

function toFrequency(degree: number, octave: number): number {
  const semitones = SCALE[degree % SCALE.length] ?? 0;
  return ROOT * octave * 2 ** (semitones / 12);
}

function playStep(voice: Voice, step: number, delay: number): void {
  const note = MELODY[step % MELODY.length] ?? REST;
  if (note !== REST) {
    playTone(voice, { frequency: toFrequency(note, 2), duration: 0.32, volume: 0.085, type: 'triangle', delay });
    playTone(voice, { frequency: toFrequency(note, 4), duration: 0.12, volume: 0.02, type: 'sine', delay });
  }
  if (step % STEPS_PER_BASS === 0) {
    const bass = BASS[(step / STEPS_PER_BASS) % BASS.length] ?? 0;
    playTone(voice, { frequency: toFrequency(bass, 0.5), duration: 0.9, volume: 0.1, type: 'sine', delay });
  }
  if (step % 4 === 2) {
    playTone(voice, { frequency: 1800, duration: 0.03, volume: 0.02, type: 'square', delay });
  }
}

/** Creates the looping kitchen tune. It schedules a little ahead so the beat stays steady. */
export function createMusic(voice: Voice): Music {
  let timer = 0;
  let step = 0;
  let nextTime = 0;
  let pace = 6;

  const schedule = (): void => {
    const now = voice.context.currentTime;
    if (nextTime < now) nextTime = now + 0.05;
    while (nextTime < now + LOOKAHEAD) {
      playStep(voice, step, nextTime - now);
      step += 1;
      nextTime += 1 / pace;
    }
  };

  return {
    start() {
      if (timer !== 0) return;
      step = 0;
      nextTime = 0;
      timer = window.setInterval(schedule, TICK_MS);
    },
    stop() {
      window.clearInterval(timer);
      timer = 0;
    },
    setPace(next) {
      pace = next;
    },
  };
}
