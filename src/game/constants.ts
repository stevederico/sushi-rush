/** Chef walking speed in tiles per second. */
export const CHEF_SPEED = 4.2;
/** Half the width of a chef's collision box, in tiles. */
export const CHEF_RADIUS = 0.3;
export const DASH_MULTIPLIER = 2.6;
export const DASH_TIME = 0.18;
export const DASH_COOLDOWN = 0.7;
/** How far in front of the chef the hands reach, in tiles. */
export const REACH = 0.62;
/** Largest gap between the reach point and a station centre that still counts. */
export const REACH_TOLERANCE = 0.78;

export const FLOOR_BELT_SPEED = 2.6;
export const ITEM_BELT_SPEED = 1.1;
/** Seconds of warning before flipping belts change direction. */
export const BELT_WARNING = 2.5;

export const SLICE_TIME = 1.5;
export const ROLL_TIME = 1.9;
export const COOK_TIME = 5;
export const COOKER_PORTIONS = 4;
/** Seconds between chop sounds while a chef works. */
export const CHOP_INTERVAL = 0.22;

export const EXPIRE_PENALTY = 15;
export const TIP_MAX = 8;
export const STREAK_MAX = 4;
/** Ticket flow speeds up to this share of the starting interval by the end of a shift. */
export const ORDER_RAMP = 0.6;
export const FIRST_ORDER_DELAY = 1.2;
/** Two chefs get more tickets and need more points for each star. */
export const CO_OP_ORDER_FACTOR = 0.7;
export const CO_OP_STAR_FACTOR = 1.5;

export const CAT_SPEED = 3.1;
export const CAT_FLEE_SPEED = 5.4;
export const CAT_SNATCH_TIME = 1.6;
export const CAT_SCARE_DISTANCE = 1.15;
export const CAT_FIRST_VISIT = 18;
export const CAT_VISIT_EVERY = 16;

/** Longest simulation step, so a stalled tab cannot tunnel chefs through walls. */
export const MAX_STEP = 1 / 30;
