import { ITEM_BELT_SPEED } from '../game/constants.ts';
import { DIRECTION_VECTORS, getTile } from '../game/grid.ts';
import type { BeltStation, Station, Vec, World } from '../game/types.ts';
import { drawBoard, drawCooker, drawCrate, drawMat, drawPlateStack, drawServe, drawTrash } from './equipmentArt.ts';
import { DIRECTION_ANGLES, drawChevrons } from './floorArt.ts';
import { drawItemAt } from './itemArt.ts';
import { PALETTE } from './palette.ts';
import { strokeRoundRect } from './shapes.ts';
import type { Ctx } from './shapes.ts';

const LIP = 0.16;

/** True when the front of a station is visible because floor lies below it. */
function hasLip(world: World, station: Station): boolean {
  return getTile(world, station.x, station.y + 1)?.kind === 'floor';
}

/** The middle of a station's work surface, where its item sits. */
export function getTopCenter(world: World, station: Station): Vec {
  return { x: station.x + 0.5, y: station.y + 0.5 - (hasLip(world, station) ? LIP / 2 : 0) };
}

function drawBase(ctx: Ctx, world: World, station: Station): void {
  const { x, y } = station;
  const lip = hasLip(world, station) ? LIP : 0;
  ctx.fillStyle = PALETTE.counterSide;
  ctx.fillRect(x, y, 1.002, 1.002);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(x, y, 1.002, 1 - lip);
  ctx.fillStyle = PALETTE.counterTopLight;
  ctx.fillRect(x, y, 1.002, 0.05);
  strokeRoundRect(ctx, x + 0.01, y + 0.01, 0.98, 0.98 - lip, 0.02, PALETTE.counterSeam, 0.02);
}

function drawItemBelt(ctx: Ctx, belt: BeltStation, time: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(belt.x, belt.y, 1, 1);
  ctx.clip();
  ctx.translate(belt.x + 0.5, belt.y + 0.5);
  ctx.rotate(DIRECTION_ANGLES[belt.direction]);
  ctx.fillStyle = PALETTE.belt;
  ctx.fillRect(-0.51, -0.4, 1.02, 0.8);
  drawChevrons(ctx, time * ITEM_BELT_SPEED, PALETTE.beltMark, 0.14);
  ctx.fillStyle = PALETTE.beltRail;
  ctx.fillRect(-0.51, -0.46, 1.02, 0.08);
  ctx.fillRect(-0.51, 0.38, 1.02, 0.08);
  ctx.restore();
}

/** Where an item riding an item belt is drawn. */
export function getBeltItemSpot(belt: BeltStation): Vec {
  const step = DIRECTION_VECTORS[belt.direction];
  const slide = belt.offset - 0.5;
  return { x: belt.x + 0.5 + step.x * slide, y: belt.y + 0.5 + step.y * slide };
}

/** Draws a station's counter and its fixed equipment, without loose items. */
export function drawStation(ctx: Ctx, world: World, station: Station, time: number): void {
  const center = getTopCenter(world, station);
  if (station.kind === 'belt') {
    drawItemBelt(ctx, station, time);
    return;
  }
  drawBase(ctx, world, station);
  switch (station.kind) {
    case 'board': drawBoard(ctx, center, station.item === null); break;
    case 'mat': drawMat(ctx, center, station); break;
    case 'crate': drawCrate(ctx, center, station); break;
    case 'cooker': drawCooker(ctx, center, station, time); break;
    case 'plates': drawPlateStack(ctx, center); break;
    case 'serve': drawServe(ctx, center, time); break;
    case 'trash': drawTrash(ctx, center); break;
    case 'counter': break;
  }
}

/** Draws the loose item resting on a counter, board or belt. */
export function drawStationItem(ctx: Ctx, world: World, station: Station): void {
  if (station.kind === 'belt') {
    if (station.item !== null) {
      const spot = getBeltItemSpot(station);
      drawItemAt(ctx, station.item, spot.x, spot.y);
    }
    return;
  }
  if (station.kind !== 'counter' && station.kind !== 'board') return;
  if (station.item === null) return;
  const center = getTopCenter(world, station);
  drawItemAt(ctx, station.item, center.x, center.y);
}
