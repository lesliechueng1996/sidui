import { moonshotPriceDimension } from './moonshot-price';

type DimensionGroup = Readonly<Record<string, string>>;

type DimensionValue<Group> =
  Group extends Record<string, infer Value> ? Value : never;

export const collectPriceDimensions = <
  const Groups extends readonly DimensionGroup[],
>(
  ...groups: Groups
): {
  [Value in DimensionValue<Groups[number]> & string]: Value;
} => {
  const collected = {} as {
    [Value in DimensionValue<Groups[number]> & string]: Value;
  };

  for (const group of groups) {
    for (const value of Object.values(group)) {
      const dimension = value as DimensionValue<Groups[number]> & string;
      collected[dimension] = dimension;
    }
  }

  return collected;
};

export const llmPriceDimensionEnum = collectPriceDimensions(
  moonshotPriceDimension,
);
