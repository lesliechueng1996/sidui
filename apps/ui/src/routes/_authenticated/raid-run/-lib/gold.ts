export const GOLD_PER_BRICK = 10_000;

export const parseGoldCount = (value: string): number | undefined => {
  if (value.length === 0) {
    return 0;
  }

  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  return Number.parseInt(value, 10);
};

const toNonNegativeInteger = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.trunc(Math.max(0, value));
};

export const toGold = (brick: number, gold: number): number =>
  toNonNegativeInteger(brick) * GOLD_PER_BRICK + toNonNegativeInteger(gold);

export const fromGold = (
  totalGold: number,
): {
  brick: number;
  gold: number;
} => {
  const amount = toNonNegativeInteger(totalGold);

  return {
    brick: Math.floor(amount / GOLD_PER_BRICK),
    gold: amount % GOLD_PER_BRICK,
  };
};

export const formatGold = (totalGold: number): string => {
  const { brick, gold } = fromGold(totalGold);

  if (brick === 0 && gold === 0) {
    return '0金';
  }

  if (brick === 0) {
    return `${gold}金`;
  }

  if (gold === 0) {
    return `${brick}砖`;
  }

  return `${brick}砖 ${gold}金`;
};

export type BrickGoldInputValues = {
  brick: string;
  gold: string;
};

export const goldToInputValues = (totalGold: number): BrickGoldInputValues => {
  const { brick, gold } = fromGold(totalGold);

  return {
    brick: brick === 0 ? '' : String(brick),
    gold: gold === 0 ? '' : String(gold),
  };
};

export const inputValuesToGold = (
  values: BrickGoldInputValues,
): number | undefined => {
  const brick = parseGoldCount(values.brick);
  const gold = parseGoldCount(values.gold);
  if (brick === undefined || gold === undefined) {
    return undefined;
  }

  return toGold(brick, gold);
};
