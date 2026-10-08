export const cookTagScope = {
  INGREDIENT: 'ingredient',
  UTENSIL: 'utensil',
  RECIPE: 'recipe',
} as const;

export type CookTagScope = (typeof cookTagScope)[keyof typeof cookTagScope];

export type DefaultCookTag = {
  scope: CookTagScope;
  name: string;
  color: string;
  sortOrder: number;
};

export const defaultCookTags: readonly DefaultCookTag[] = [
  {
    scope: cookTagScope.INGREDIENT,
    name: '蛋白质',
    color: '#E07A5F',
    sortOrder: 0,
  },
  {
    scope: cookTagScope.INGREDIENT,
    name: '碳水',
    color: '#E9C46A',
    sortOrder: 1,
  },
  {
    scope: cookTagScope.INGREDIENT,
    name: '蔬菜',
    color: '#2A9D8F',
    sortOrder: 2,
  },
  {
    scope: cookTagScope.INGREDIENT,
    name: '水果',
    color: '#F4A261',
    sortOrder: 3,
  },
  {
    scope: cookTagScope.INGREDIENT,
    name: '脂肪',
    color: '#C9A227',
    sortOrder: 4,
  },
  {
    scope: cookTagScope.UTENSIL,
    name: '电热盘',
    color: '#6D6875',
    sortOrder: 0,
  },
  {
    scope: cookTagScope.UTENSIL,
    name: '空气炸锅',
    color: '#457B9D',
    sortOrder: 1,
  },
  {
    scope: cookTagScope.RECIPE,
    name: '早餐',
    color: '#F2CC8F',
    sortOrder: 0,
  },
  {
    scope: cookTagScope.RECIPE,
    name: '甜品',
    color: '#E5989B',
    sortOrder: 1,
  },
  {
    scope: cookTagScope.RECIPE,
    name: '酸奶',
    color: '#81B29A',
    sortOrder: 2,
  },
];
