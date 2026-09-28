import type { GameEventType } from '../game/types.ts';
import { createMusic } from './music.ts';
import type { Music } from './music.ts';
import { playClick, playCountdown, playEventSound, playFanfare } from './sfx.ts';
import type { Voice } from './synth.ts';

const MASTER_VOLUME = 0.8;
const NORMAL_PACE = 6;
const RUSH_PACE = 7.5;

export interface Audio {
  /** Must be called from a tap, click or key press so the browser allows sound. */
  unlock(): void;
  setMuted(isMuted: boolean): void;
  playEvent(type: GameEventType): void;
  playClick(): void;
  playCountdown(isGo: boolean): void;
  playFanfare(stars: number): void;
  startMusic(): void;
  stopMusic(): void;
  setRush(isRush: boolean): void;
}

interface Rig {
  voice: Voice;
  master: GainNode;
  music: Music;
}

function createRig(isMuted: boolean): Rig | null {
  if (typeof AudioContext === 'undefined') return null;
  try {
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = isMuted ? 0 : MASTER_VOLUME;
    master.connect(context.destination);
    const voice = { context, output: master };
    return { voice, master, music: createMusic(voice) };
  } catch (error) {
    console.error('Sound is unavailable', error);
    return null;
  }
}

/** Creates the sound system. Nothing plays until `unlock` runs inside a user gesture. */
export function createAudio(startMuted: boolean): Audio {
  let rig: Rig | null = null;
  let isMuted = startMuted;
  let wantsMusic = false;

  const play = (sound: (voice: Voice) => void): void => {
    if (rig === null || isMuted || rig.voice.context.state !== 'running') return;
    sound(rig.voice);
  };

  return {
    unlock() {
      if (rig === null) rig = createRig(isMuted);
      if (rig === null) return;
      if (rig.voice.context.state === 'suspended') {
        rig.voice.context.resume().catch((error: unknown) => console.error('Could not start sound', error));
      }
      if (wantsMusic) rig.music.start();
    },
    setMuted(next) {
      isMuted = next;
      if (rig !== null) rig.master.gain.value = next ? 0 : MASTER_VOLUME;
    },
    playEvent: (type) => play((voice) => playEventSound(voice, type)),
    playClick: () => play(playClick),
    playCountdown: (isGo) => play((voice) => playCountdown(voice, isGo)),
    playFanfare: (stars) => play((voice) => playFanfare(voice, stars)),
    startMusic() {
      wantsMusic = true;
      rig?.music.start();
    },
    stopMusic() {
      wantsMusic = false;
      rig?.music.stop();
    },
    setRush: (isRush) => rig?.music.setPace(isRush ? RUSH_PACE : NORMAL_PACE),
  };
}
