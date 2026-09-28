/** Raw things a chef can pull out of a crate or the rice cooker. */
export type IngredientId = 'rice' | 'nori' | 'salmon' | 'tuna' | 'cucumber';

/** Ingredients that go on the cutting board and inside a roll. */
export type FillingId = 'salmon' | 'tuna' | 'cucumber';

/** A finished piece of food that can sit on a plate. */
export type FoodToken =
  | 'rice'
  | 'salmon'
  | 'tuna'
  | 'roll:salmon'
  | 'roll:tuna'
  | 'roll:cucumber';

export interface IngredientItem {
  kind: 'ingredient';
  id: IngredientId;
  sliced: boolean;
}

export interface RollItem {
  kind: 'roll';
  filling: FillingId;
}

export interface PlateItem {
  kind: 'plate';
  contents: FoodToken[];
}

export type Item = IngredientItem | RollItem | PlateItem;

export type RecipeId =
  | 'salmonSashimi'
  | 'tunaSashimi'
  | 'salmonNigiri'
  | 'tunaNigiri'
  | 'cucumberMaki'
  | 'salmonMaki'
  | 'tunaMaki'
  | 'omakase';

export interface Recipe {
  id: RecipeId;
  name: string;
  tokens: FoodToken[];
  points: number;
  /** Seconds a customer waits before the ticket expires. */
  patience: number;
}

export interface Vec {
  x: number;
  y: number;
}

export type Direction = 'right' | 'left' | 'up' | 'down';

export type TileKind = 'floor' | 'wall' | 'station';

export interface Tile {
  kind: TileKind;
  /** Direction of a floor conveyor, if this floor tile is one. */
  belt: Direction | null;
  /** Index into `World.stations` when kind is `station`. */
  station: number;
}

interface StationBase {
  x: number;
  y: number;
}

export interface CounterStation extends StationBase {
  kind: 'counter';
  item: Item | null;
}

export interface BoardStation extends StationBase {
  kind: 'board';
  item: Item | null;
  progress: number;
}

export interface MatStation extends StationBase {
  kind: 'mat';
  parts: IngredientItem[];
  roll: RollItem | null;
  progress: number;
}

export interface CrateStation extends StationBase {
  kind: 'crate';
  ingredient: Exclude<IngredientId, 'rice'>;
}

export type CookerState = 'empty' | 'cooking' | 'ready';

export interface CookerStation extends StationBase {
  kind: 'cooker';
  state: CookerState;
  timer: number;
  portions: number;
}

export interface PlatesStation extends StationBase {
  kind: 'plates';
}

export interface ServeStation extends StationBase {
  kind: 'serve';
}

export interface TrashStation extends StationBase {
  kind: 'trash';
}

/** A counter-height conveyor that carries items from tile to tile. */
export interface BeltStation extends StationBase {
  kind: 'belt';
  direction: Direction;
  item: Item | null;
  /** 0 when the item enters the tile, 1 when it reaches the far edge. */
  offset: number;
}

export type Station =
  | CounterStation
  | BoardStation
  | MatStation
  | CrateStation
  | CookerStation
  | PlatesStation
  | ServeStation
  | TrashStation
  | BeltStation;

export type StationKind = Station['kind'];

export interface NavGoal {
  /** Floor tile the chef walks to. */
  tile: Vec;
  /** Station tile to use on arrival, or null for a plain walk. */
  station: Vec | null;
}

export interface Chef {
  id: number;
  x: number;
  y: number;
  facing: Vec;
  holding: Item | null;
  /** Station index the chef is slicing or rolling at, or -1. */
  working: number;
  dashTime: number;
  dashCooldown: number;
  walkPhase: number;
  isMoving: boolean;
  goal: NavGoal | null;
}

export interface ChefInput {
  moveX: number;
  moveY: number;
  interact: boolean;
  dash: boolean;
}

export interface Order {
  id: number;
  recipe: Recipe;
  timeLeft: number;
}

export type CatState = 'away' | 'entering' | 'sneaking' | 'snatching' | 'fleeing' | 'leaving';

export interface Cat {
  state: CatState;
  x: number;
  y: number;
  facing: Vec;
  door: Vec;
  /** Station index the cat is after, or -1. */
  target: number;
  timer: number;
  carrying: Item | null;
  path: Vec[];
  walkPhase: number;
}

export type GameEventType =
  | 'pickup'
  | 'drop'
  | 'plated'
  | 'nope'
  | 'chop'
  | 'sliced'
  | 'rolled'
  | 'cookStart'
  | 'cookDone'
  | 'trash'
  | 'dash'
  | 'newOrder'
  | 'served'
  | 'rejected'
  | 'expired'
  | 'beltFlip'
  | 'beltWarn'
  | 'catIn'
  | 'catSteal'
  | 'catShoo'
  | 'tick'
  | 'timeUp';

export interface GameEvent {
  type: GameEventType;
  x: number;
  y: number;
  /** Points for score events; otherwise unused. */
  value: number;
}

export interface LevelDef {
  id: number;
  name: string;
  tagline: string;
  map: string[];
  recipes: RecipeId[];
  duration: number;
  /** Seconds between new tickets at the start of the shift. */
  orderInterval: number;
  maxOrders: number;
  /** Score needed for one, two and three stars in solo play. */
  stars: [number, number, number];
  /** Seconds between floor belt reversals, or 0 for steady belts. */
  beltFlipEvery: number;
  hasCat: boolean;
}

export interface World {
  level: LevelDef;
  width: number;
  height: number;
  tiles: Tile[][];
  stations: Station[];
  chefs: Chef[];
  orders: Order[];
  cat: Cat | null;
  events: GameEvent[];
  score: number;
  streak: number;
  served: number;
  expired: number;
  timeLeft: number;
  elapsed: number;
  orderTimer: number;
  nextOrderId: number;
  beltTimer: number;
  isBeltReversed: boolean;
  isOver: boolean;
  /** Internal state of the seeded random generator. */
  seed: number;
}
