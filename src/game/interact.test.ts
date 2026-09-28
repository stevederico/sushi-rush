import { describe, expect, it } from 'vitest';
import { getTargetStation, interact, isWorkable, useStation } from './interact.ts';
import { makeIngredient, makePlate, makeRoll } from './items.ts';
import { RECIPES } from './recipes.ts';
import { getChef, getStation, indexOf, makeWorld } from './testKit.ts';
import type { StationKind, World } from './types.ts';

const MAP = ['CBMSNRPVX', '1........', '}}.......'];

function use(world: World, kind: StationKind, nth = 0): void {
  useStation(world, getChef(world), indexOf(world, getStation(world, kind, nth)));
}

describe('getTargetStation', () => {
  it('finds the station the chef faces', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    chef.facing = { x: 0, y: -1 };
    expect(world.stations[getTargetStation(world, chef)]?.kind).toBe('counter');
  });

  it('finds nothing when facing open floor', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    chef.facing = { x: 1, y: 0 };
    expect(getTargetStation(world, chef)).toBe(-1);
  });

  it('prefers the station straight ahead when standing off-centre', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    chef.x = 1.4;
    chef.facing = { x: 0, y: -1 };
    expect(world.stations[getTargetStation(world, chef)]?.kind).toBe('board');
  });
});

describe('counter', () => {
  it('takes what the chef holds', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('salmon');
    use(world, 'counter');
    expect(getStation(world, 'counter').item).toEqual(makeIngredient('salmon'));
  });

  it('empties the chef hands on a drop', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('salmon');
    use(world, 'counter');
    expect(getChef(world).holding).toBeNull();
  });

  it('gives its item to empty hands', () => {
    const world = makeWorld(MAP);
    getStation(world, 'counter').item = makeIngredient('nori');
    use(world, 'counter');
    expect(getChef(world).holding).toEqual(makeIngredient('nori'));
  });

  it('lets a held plate scoop up food', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makePlate(['rice']);
    getStation(world, 'counter').item = makeIngredient('tuna', true);
    use(world, 'counter');
    expect(getChef(world).holding).toEqual(makePlate(['rice', 'tuna']));
  });

  it('lets held food land on a waiting plate', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeRoll('salmon');
    getStation(world, 'counter').item = makePlate();
    use(world, 'counter');
    expect(getStation(world, 'counter').item).toEqual(makePlate(['roll:salmon']));
  });

  it('refuses to stack two loose items', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('rice');
    getStation(world, 'counter').item = makeIngredient('tuna', true);
    use(world, 'counter');
    expect(world.events.map((event) => event.type)).toEqual(['nope']);
  });
});

describe('cutting board', () => {
  it('starts work on raw fish', () => {
    const world = makeWorld(MAP);
    const board = getStation(world, 'board');
    board.item = makeIngredient('salmon');
    use(world, 'board');
    expect(getChef(world).working).toBe(indexOf(world, board));
  });

  it('hands over fish once it is sliced', () => {
    const world = makeWorld(MAP);
    getStation(world, 'board').item = makeIngredient('salmon', true);
    use(world, 'board');
    expect(getChef(world).holding).toEqual(makeIngredient('salmon', true));
  });

  it('is workable only with raw filling on it', () => {
    const world = makeWorld(MAP);
    const board = getStation(world, 'board');
    board.item = makeIngredient('rice');
    expect(isWorkable(board)).toBe(false);
  });
});

describe('rolling mat', () => {
  it('collects parts one at a time', () => {
    const world = makeWorld(MAP);
    for (const part of [makeIngredient('nori'), makeIngredient('rice')]) {
      getChef(world).holding = part;
      use(world, 'mat');
    }
    expect(getStation(world, 'mat').parts).toHaveLength(2);
  });

  it('refuses raw fish', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('tuna');
    use(world, 'mat');
    expect(getStation(world, 'mat').parts).toHaveLength(0);
  });

  it('starts work when all parts are down', () => {
    const world = makeWorld(MAP);
    const mat = getStation(world, 'mat');
    mat.parts = [makeIngredient('nori'), makeIngredient('rice'), makeIngredient('tuna', true)];
    use(world, 'mat');
    expect(getChef(world).working).toBe(indexOf(world, mat));
  });

  it('gives back the last part when the mat is not ready', () => {
    const world = makeWorld(MAP);
    getStation(world, 'mat').parts = [makeIngredient('nori'), makeIngredient('rice')];
    use(world, 'mat');
    expect(getChef(world).holding).toEqual(makeIngredient('rice'));
  });

  it('plates a finished roll straight from the mat', () => {
    const world = makeWorld(MAP);
    getStation(world, 'mat').roll = makeRoll('cucumber');
    getChef(world).holding = makePlate();
    use(world, 'mat');
    expect(getChef(world).holding).toEqual(makePlate(['roll:cucumber']));
  });
});

describe('crate', () => {
  it('hands out its ingredient', () => {
    const world = makeWorld(MAP);
    use(world, 'crate');
    expect(getChef(world).holding).toEqual(makeIngredient('salmon'));
  });

  it('takes back the same raw ingredient', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('salmon');
    use(world, 'crate');
    expect(getChef(world).holding).toBeNull();
  });

  it('refuses other items', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('tuna');
    use(world, 'crate');
    expect(getChef(world).holding).toEqual(makeIngredient('tuna'));
  });
});

describe('rice cooker', () => {
  it('scoops rice into empty hands', () => {
    const world = makeWorld(MAP);
    use(world, 'cooker');
    expect(getChef(world).holding).toEqual(makeIngredient('rice'));
  });

  it('scoops rice onto a held plate', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makePlate(['salmon']);
    use(world, 'cooker');
    expect(getChef(world).holding).toEqual(makePlate(['salmon', 'rice']));
  });

  it('runs empty after four scoops', () => {
    const world = makeWorld(MAP);
    for (let scoop = 0; scoop < 4; scoop += 1) {
      getChef(world).holding = null;
      use(world, 'cooker');
    }
    expect(getStation(world, 'cooker').state).toBe('empty');
  });

  it('starts cooking when used while empty', () => {
    const world = makeWorld(MAP);
    getStation(world, 'cooker').state = 'empty';
    use(world, 'cooker');
    expect(getStation(world, 'cooker').state).toBe('cooking');
  });

  it('keeps its rice when the chef cannot carry it', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('nori');
    use(world, 'cooker');
    expect(getStation(world, 'cooker').portions).toBe(4);
  });
});

describe('plates', () => {
  it('hands out an empty plate', () => {
    const world = makeWorld(MAP);
    use(world, 'plates');
    expect(getChef(world).holding).toEqual(makePlate());
  });

  it('plates held food in one step', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('salmon', true);
    use(world, 'plates');
    expect(getChef(world).holding).toEqual(makePlate(['salmon']));
  });

  it('refuses food that belongs on no plate', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('nori');
    use(world, 'plates');
    expect(getChef(world).holding).toEqual(makeIngredient('nori'));
  });
});

describe('trash', () => {
  it('throws away loose food', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('tuna');
    use(world, 'trash');
    expect(getChef(world).holding).toBeNull();
  });

  it('scrapes a plate but keeps it', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makePlate(['rice']);
    use(world, 'trash');
    expect(getChef(world).holding).toEqual(makePlate());
  });
});

describe('serving window', () => {
  function serve(world: World): void {
    world.orders = [{ id: 1, recipe: RECIPES.salmonNigiri, timeLeft: 30 }];
    use(world, 'serve');
  }

  it('takes a dish that matches a ticket', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makePlate(['salmon', 'rice']);
    serve(world);
    expect(getChef(world).holding).toBeNull();
  });

  it('closes the ticket', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makePlate(['salmon', 'rice']);
    serve(world);
    expect(world.orders).toHaveLength(0);
  });

  it('sends back a dish nobody ordered', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makePlate(['tuna']);
    serve(world);
    expect(world.events.map((event) => event.type)).toEqual(['rejected']);
  });

  it('sends back loose food', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('salmon', true);
    serve(world);
    expect(getChef(world).holding).not.toBeNull();
  });
});

describe('interact', () => {
  it('uses the station in front of the chef', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    chef.x = 3.5;
    chef.facing = { x: 0, y: -1 };
    interact(world, chef);
    expect(chef.holding).toEqual(makeIngredient('salmon'));
  });

  it('does nothing with no station in reach', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    chef.facing = { x: 1, y: 0 };
    interact(world, chef);
    expect(world.events).toHaveLength(0);
  });

  it('parks a dropped item in the middle of an item belt', () => {
    const world = makeWorld(MAP);
    getChef(world).holding = makeIngredient('tuna');
    use(world, 'belt');
    expect(getStation(world, 'belt').offset).toBe(0.5);
  });
});
