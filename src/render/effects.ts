import type { GameEvent } from '../game/types.ts';
import { PALETTE } from './palette.ts';
import { circle } from './shapes.ts';
import type { Ctx } from './shapes.ts';
import { drawText } from './text.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  span: number;
  size: number;
  color: string;
  gravity: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface Effects {
  particles: Particle[];
  texts: FloatingText[];
  /** Counts down after a missed ticket, for a short red flash. */
  flash: number;
}

const TEXT_SPAN = 1.3;
/** Floating words never rise above this line, so the top row stays readable. */
const TEXT_TOP = 0.24;
const MAX_PARTICLES = 220;
const SPARKLES = [PALETTE.warn, PALETTE.white, PALETTE.playerOne, PALETTE.good];

/** Creates an empty effects layer. */
export function createEffects(): Effects {
  return { particles: [], texts: [], flash: 0 };
}

function burst(effects: Effects, x: number, y: number, count: number, colors: readonly string[], speed: number): void {
  for (let index = 0; index < count && effects.particles.length < MAX_PARTICLES; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const pace = speed * (0.4 + Math.random() * 0.6);
    const span = 0.35 + Math.random() * 0.4;
    effects.particles.push({
      x,
      y,
      vx: Math.cos(angle) * pace,
      vy: Math.sin(angle) * pace - speed * 0.4,
      life: span,
      span,
      size: 0.03 + Math.random() * 0.04,
      color: colors[index % colors.length] ?? PALETTE.white,
      gravity: 3,
    });
  }
}

function puff(effects: Effects, x: number, y: number, color: string): void {
  if (effects.particles.length >= MAX_PARTICLES) return;
  effects.particles.push({
    x: x + (Math.random() - 0.5) * 0.3,
    y,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -0.5 - Math.random() * 0.3,
    life: 0.9,
    span: 0.9,
    size: 0.07 + Math.random() * 0.05,
    color,
    gravity: 0,
  });
}

function say(effects: Effects, x: number, y: number, text: string, color: string): void {
  effects.texts.push({ x, y, text, color, life: TEXT_SPAN });
}

/** Turns a game event into sparks, puffs and floating words. */
export function reactToEvent(effects: Effects, event: GameEvent, isCalm: boolean): void {
  const { x, y } = event;
  switch (event.type) {
    case 'served':
      if (!isCalm) burst(effects, x, y, 22, SPARKLES, 2.6);
      say(effects, x, y - 0.5, `+${event.value}`, PALETTE.warn);
      break;
    case 'rejected':
      say(effects, x, y - 0.5, 'No Ticket', PALETTE.bad);
      break;
    case 'expired':
      effects.flash = 0.5;
      break;
    case 'chop':
      if (!isCalm) burst(effects, x, y - 0.1, 3, [PALETTE.white, PALETTE.boardEdge], 1.2);
      break;
    case 'sliced':
    case 'rolled':
      if (!isCalm) burst(effects, x, y, 10, [PALETTE.white, PALETTE.good], 1.8);
      say(effects, x, y - 0.5, event.type === 'sliced' ? 'Sliced' : 'Rolled', PALETTE.white);
      break;
    case 'cookDone':
      say(effects, x, y - 0.5, 'Rice Ready', PALETTE.good);
      break;
    case 'trash':
      if (!isCalm) burst(effects, x, y, 6, [PALETTE.trash, PALETTE.steelDark], 1.2);
      break;
    case 'dash':
      if (!isCalm) burst(effects, x, y + 0.2, 5, ['rgba(255,255,255,0.8)'], 0.9);
      break;
    case 'catSteal':
      say(effects, x, y - 0.6, 'Fish Stolen', PALETTE.bad);
      break;
    case 'catShoo':
      say(effects, x, y - 0.6, 'Shoo', PALETTE.white);
      break;
    default:
      break;
  }
}

/** Floats a short word up from a spot, like the note after a tap that cannot be reached. */
export function addNote(effects: Effects, x: number, y: number, text: string, color: string): void {
  effects.texts = effects.texts.filter((note) => note.text !== text);
  say(effects, x, y, text, color);
}

/** Adds a wisp of steam, used over rice cookers that are busy. */
export function addSteam(effects: Effects, x: number, y: number): void {
  puff(effects, x, y, 'rgba(255, 255, 255, 0.55)');
}

/** Mirrors every live effect along the diagonal, to follow a kitchen that turned. */
export function turnEffects(effects: Effects): void {
  for (const particle of effects.particles) {
    [particle.x, particle.y] = [particle.y, particle.x];
    [particle.vx, particle.vy] = [particle.vy, particle.vx];
  }
  for (const text of effects.texts) [text.x, text.y] = [text.y, text.x];
}

/** Ages every effect and drops the ones that have faded. */
export function updateEffects(effects: Effects, dt: number): void {
  effects.flash = Math.max(0, effects.flash - dt);
  for (const particle of effects.particles) {
    particle.life -= dt;
    particle.vy += particle.gravity * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }
  for (const text of effects.texts) {
    text.life -= dt;
    text.y -= dt * 0.55;
  }
  effects.particles = effects.particles.filter((particle) => particle.life > 0);
  effects.texts = effects.texts.filter((text) => text.life > 0);
}

/** Draws all live effects in tile units. */
export function drawEffects(ctx: Ctx, effects: Effects): void {
  for (const particle of effects.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.span);
    circle(ctx, particle.x, particle.y, particle.size, particle.color);
  }
  for (const text of effects.texts) {
    ctx.globalAlpha = Math.min(1, text.life / 0.4);
    drawText(ctx, text.text, text.x, Math.max(TEXT_TOP, text.y), 0.3, text.color);
  }
  ctx.globalAlpha = 1;
}
