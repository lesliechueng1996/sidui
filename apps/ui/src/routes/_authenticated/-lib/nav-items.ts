import type { LucideIcon } from 'lucide-react';
import {
  BookOpenTextIcon,
  CalendarClockIcon,
  CastleIcon,
  ClipboardListIcon,
  FlameIcon,
  Gamepad2Icon,
  LayersIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ServerIcon,
  Settings2Icon,
  SwordIcon,
  SwordsIcon,
  UsersIcon,
} from 'lucide-react';
import { ROLE_ADMIN } from '@/lib/auth-client';

export type NavLeaf = {
  title: string;
  to: string;
};

export type NavItem = {
  title: string;
  icon: LucideIcon;
  to?: string;
  children?: NavLeaf[];
  requiredRole?: string | readonly string[];
};

export const navItems: NavItem[] = [
  {
    title: '概览',
    icon: LayoutDashboardIcon,
    to: '/',
  },
  {
    title: '开团',
    icon: SwordIcon,
    to: '/raid-run',
  },
  {
    title: '用户管理',
    icon: UsersIcon,
    to: '/admin/users',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '区服管理',
    icon: ServerIcon,
    to: '/admin/game-servers',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '资料片管理',
    icon: LayersIcon,
    to: '/admin/game-expansions',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '副本管理',
    icon: CastleIcon,
    to: '/admin/game-dungeons',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '开团管理',
    icon: CalendarClockIcon,
    to: '/admin/raid-runs',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '报名管理',
    icon: ClipboardListIcon,
    to: '/admin/raid-signups',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '物品管理',
    icon: PackageIcon,
    to: '/admin/game-items',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '门派管理',
    icon: SwordsIcon,
    to: '/admin/schools',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '心法管理',
    icon: FlameIcon,
    to: '/admin/kungfus',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '成语管理',
    icon: BookOpenTextIcon,
    to: '/admin/idioms',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '应用配置',
    icon: Settings2Icon,
    to: '/admin/app-settings',
    requiredRole: ROLE_ADMIN,
  },
  {
    title: '游戏辅助',
    icon: Gamepad2Icon,
    children: [
      { title: '猜成语', to: '/game-assist/guess-idiom' },
      { title: '扫雷', to: '/game-assist/minesweeper' },
    ],
  },
];

export function isNavItemVisible(
  item: NavItem,
  role: string | null | undefined,
): boolean {
  if (item.requiredRole == null) {
    return true;
  }

  const required =
    typeof item.requiredRole === 'string'
      ? [item.requiredRole]
      : item.requiredRole;

  return role != null && required.includes(role);
}

export function visibleNavItems(role: string | null | undefined): NavItem[] {
  return navItems.filter((item) => isNavItemVisible(item, role));
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
}

export function isNavPathActive(pathname: string, to: string): boolean {
  const current = normalizePath(pathname);
  const target = normalizePath(to);

  if (target === '/') {
    return current === '/';
  }

  return current === target || current.startsWith(`${target}/`);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.children?.length) {
    return item.children.some((child) => isNavPathActive(pathname, child.to));
  }

  if (!item.to) {
    return false;
  }

  return isNavPathActive(pathname, item.to);
}

export const APP_DOCUMENT_TITLE = '四堆专用';

export function getActiveNavTitle(pathname: string): string | undefined {
  for (const item of navItems) {
    if (item.children?.length) {
      const child = item.children.find((leaf) =>
        isNavPathActive(pathname, leaf.to),
      );
      if (child) {
        return child.title;
      }
      continue;
    }

    if (item.to && isNavPathActive(pathname, item.to)) {
      return item.title;
    }
  }

  return undefined;
}

export function getDocumentTitle(pathname: string): string {
  const navTitle = getActiveNavTitle(pathname);
  return navTitle ? `${navTitle} · ${APP_DOCUMENT_TITLE}` : APP_DOCUMENT_TITLE;
}
