import { z } from 'zod';

export const gameItemFormDungeonSchema = z.object({
  id: z.string(),
  name: z.string(),
  playerLimit: z.number(),
  bossCount: z.number(),
  difficulty: z.enum(['normal', 'heroic', 'challenge']),
});

export const gameItemFormTypeSchema = z.enum([
  'equipment',
  'special',
  'small_iron',
  'enchantment',
]);

export const gameItemFormQualitySchema = z.enum([
  'white',
  'green',
  'blue',
  'purple',
  'orange',
]);

export const gameItemFormSchema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
  gameItemId: z.string().trim().max(64, '游戏内物品ID最多 64 个字符'),
  type: gameItemFormTypeSchema,
  quality: gameItemFormQualitySchema,
  description: z.string().trim().max(512, '描述最多 512 个字符'),
  icon: z.string().trim().max(512, '图标地址最多 512 个字符'),
  aliasText: z.string().max(200, '别名最多 200 个字符'),
  dungeons: z.array(gameItemFormDungeonSchema),
});

export type GameItemFormValues = z.infer<typeof gameItemFormSchema>;
