import type { CookSpaceType } from '@/lib/api/admin/admin-cook-spaces-api';

export const cookSpaceTypeLabel = (type: CookSpaceType): string =>
  type === 'family' ? '家庭' : '个人';

export const cookSpaceTypeBadgeClassName = (type: CookSpaceType): string =>
  type === 'family'
    ? 'border-transparent bg-orange-500 text-white'
    : 'border-transparent bg-sky-600 text-white';

export const cookSpaceStatusLabel = (archived: boolean): string =>
  archived ? '已归档' : '使用中';

export const cookSpaceStatusBadgeClassName = (archived: boolean): string =>
  archived
    ? 'border-transparent bg-zinc-500 text-white'
    : 'border-transparent bg-emerald-600 text-white';
