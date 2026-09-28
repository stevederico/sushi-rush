export interface Voice {
  context: AudioContext;
  output: AudioNode;
}

export interface Tone {
  frequency: number;
  /** Frequency to glide to by the end of the note. */
  glideTo?: number;
  duration: number;
  volume: number;
  type: OscillatorType;
  /** Seconds to wait before the note starts. */
  delay?: number;
}

export interface Noise {
  duration: number;
  volume: number;
  filter: BiquadFilterType;
  frequency: number;
  glideTo?: number;
  delay?: number;
}

const ATTACK = 0.005;
const SILENCE = 0.0001;

let noiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (noiseBuffer !== null && noiseBuffer.sampleRate === context.sampleRate) return noiseBuffer;
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

function makeEnvelope(voice: Voice, start: number, duration: number, volume: number): GainNode {
  const gain = voice.context.createGain();
  gain.gain.setValueAtTime(SILENCE, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, volume), start + ATTACK);
  gain.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
  gain.connect(voice.output);
  return gain;
}

/** Plays a single note with a quick attack and a smooth fade. */
export function playTone(voice: Voice, tone: Tone): void {
  const start = voice.context.currentTime + (tone.delay ?? 0);
  const oscillator = voice.context.createOscillator();
  oscillator.type = tone.type;
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.glideTo !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.glideTo, start + tone.duration);
  }
  oscillator.connect(makeEnvelope(voice, start, tone.duration, tone.volume));
  oscillator.start(start);
  oscillator.stop(start + tone.duration + 0.05);
}

/** Plays a burst of filtered noise, for chops, thumps and whooshes. */
export function playNoise(voice: Voice, noise: Noise): void {
  const start = voice.context.currentTime + (noise.delay ?? 0);
  const source = voice.context.createBufferSource();
  source.buffer = getNoiseBuffer(voice.context);
  const filter = voice.context.createBiquadFilter();
  filter.type = noise.filter;
  filter.frequency.setValueAtTime(noise.frequency, start);
  if (noise.glideTo !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(noise.glideTo, start + noise.duration);
  }
  source.connect(filter);
  filter.connect(makeEnvelope(voice, start, noise.duration, noise.volume));
  source.start(start);
  source.stop(start + noise.duration + 0.05);
}

/** Plays notes one after another, a fixed gap apart. */
export function playNotes(voice: Voice, frequencies: readonly number[], gap: number, tone: Omit<Tone, 'frequency'>): void {
  frequencies.forEach((frequency, index) => {
    playTone(voice, { ...tone, frequency, delay: (tone.delay ?? 0) + index * gap });
  });
}
