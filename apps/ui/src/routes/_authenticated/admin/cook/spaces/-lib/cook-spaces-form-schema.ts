import { z } from 'zod';

export const cookSpaceFormTypeSchema = z.enum(['personal', 'family']);

export const cookSpaceCreateFormSchema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
  type: cookSpaceFormTypeSchema,
  ownerUserId: z.string().min(1, '请选择所有者'),
});

export type CookSpaceCreateFormValues = z.infer<
  typeof cookSpaceCreateFormSchema
>;

export const cookSpaceRenameFormSchema = z.object({
  name: z.string().trim().min(1, '请输入名称').max(64, '名称最多 64 个字符'),
});

export type CookSpaceRenameFormValues = z.infer<
  typeof cookSpaceRenameFormSchema
>;
