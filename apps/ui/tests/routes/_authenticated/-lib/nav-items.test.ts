import { describe, expect, it } from 'vitest';
import { ROLE_ADMIN, ROLE_USER } from '@/lib/auth-client';
import {
  APP_DOCUMENT_TITLE,
  getActiveNavTitle,
  getDocumentTitle,
  isNavItemActive,
  isNavItemVisible,
  isNavPathActive,
  navItems,
  visibleNavItems,
} from '@/routes/_authenticated/-lib/nav-items';

describe('nav-items', () => {
  it('normalizes trailing slashes when matching paths', () => {
    expect(isNavPathActive('/admin/idioms/', '/admin/idioms')).toBe(true);
    expect(isNavPathActive('/', '/')).toBe(true);
    expect(isNavPathActive('/login', '/')).toBe(false);
    expect(isNavPathActive('/raid-run/run-1', '/raid-run')).toBe(true);
    expect(isNavPathActive('/admin/raid-runs', '/raid-run')).toBe(false);
  });

  it('prefers the more specific sibling when prefixes overlap', () => {
    const siblings = ['/jp-lyrics', '/jp-lyrics/kana'];

    expect(isNavPathActive('/jp-lyrics/kana', '/jp-lyrics', siblings)).toBe(
      false,
    );
    expect(
      isNavPathActive('/jp-lyrics/kana', '/jp-lyrics/kana', siblings),
    ).toBe(true);
    expect(isNavPathActive('/jp-lyrics', '/jp-lyrics', siblings)).toBe(true);
    expect(isNavPathActive('/jp-lyrics', '/jp-lyrics/kana', siblings)).toBe(
      false,
    );
    expect(isNavPathActive('/jp-lyrics/song-1', '/jp-lyrics', siblings)).toBe(
      true,
    );
    expect(
      isNavPathActive('/jp-lyrics/song-1', '/jp-lyrics/kana', siblings),
    ).toBe(false);
    expect(
      isNavPathActive('/jp-lyrics/song-1/edit', '/jp-lyrics', siblings),
    ).toBe(true);
  });

  it('treats a branch as active when a child matches', () => {
    const games = navItems.find((item) => item.title === '游戏辅助');
    if (!games) {
      throw new Error('missing 游戏辅助 nav item');
    }
    expect(isNavItemActive('/game-assist/guess-idiom', games)).toBe(true);
    expect(isNavItemActive('/admin/idioms', games)).toBe(false);
  });

  it('matches a leaf item by its own path', () => {
    const home = navItems.find((item) => item.to === '/');
    if (!home) {
      throw new Error('missing home nav item');
    }
    expect(isNavItemActive('/', home)).toBe(true);
    expect(isNavItemActive('/admin/idioms', home)).toBe(false);

    const raidRun = navItems.find((item) => item.to === '/raid-run');
    if (!raidRun) {
      throw new Error('missing 开团 nav item');
    }
    expect(isNavItemActive('/raid-run', raidRun)).toBe(true);
    expect(isNavItemActive('/raid-run/run-1', raidRun)).toBe(true);
    expect(isNavItemActive('/admin/raid-runs', raidRun)).toBe(false);
  });

  it('returns false when a leaf has no path', () => {
    expect(isNavItemActive('/', { title: '空', icon: navItems[0].icon })).toBe(
      false,
    );
  });

  it('resolves the active leaf title from the pathname', () => {
    expect(getActiveNavTitle('/')).toBe('概览');
    expect(getActiveNavTitle('/raid-run/')).toBe('开团');
    expect(getActiveNavTitle('/raid-run/run-1')).toBe('开团');
    expect(getActiveNavTitle('/game-assist/guess-idiom')).toBe('猜成语');
    expect(getActiveNavTitle('/game-assist/minesweeper')).toBe('扫雷');
    expect(getActiveNavTitle('/jp-lyrics')).toBe('歌曲');
    expect(getActiveNavTitle('/jp-lyrics/kana')).toBe('五十音图');
    expect(getActiveNavTitle('/jp-lyrics/song-1')).toBe('歌曲');
    expect(getActiveNavTitle('/jp-lyrics/song-1/edit')).toBe('歌曲');
    expect(getActiveNavTitle('/admin/idioms')).toBe('成语管理');
    expect(getActiveNavTitle('/admin/app-settings')).toBe('应用配置');
    expect(getActiveNavTitle('/admin/llm-model-prices')).toBe('LLM 价格');
    expect(getActiveNavTitle('/admin/llm-usage-events')).toBe('LLM 用量');
    expect(getActiveNavTitle('/admin/raid-runs')).toBe('开团管理');
    expect(getActiveNavTitle('/admin/raid-signups')).toBe('报名管理');
    expect(getActiveNavTitle('/login')).toBeUndefined();
  });

  it('filters items by requiredRole', () => {
    expect(visibleNavItems(ROLE_USER).map((item) => item.title)).toEqual([
      '概览',
      '开团',
      '日语歌词',
      '游戏辅助',
    ]);
    expect(visibleNavItems(ROLE_ADMIN).map((item) => item.title)).toEqual(
      navItems.map((item) => item.title),
    );
    expect(visibleNavItems(undefined).map((item) => item.title)).toEqual([
      '概览',
      '开团',
      '日语歌词',
      '游戏辅助',
    ]);
  });

  it('matches a single requiredRole or a list', () => {
    const icon = navItems[0].icon;
    expect(isNavItemVisible({ title: '公开', icon }, ROLE_USER)).toBe(true);
    expect(
      isNavItemVisible(
        { title: '管理', icon, requiredRole: ROLE_ADMIN },
        ROLE_USER,
      ),
    ).toBe(false);
    expect(
      isNavItemVisible(
        { title: '管理', icon, requiredRole: ROLE_ADMIN },
        ROLE_ADMIN,
      ),
    ).toBe(true);
    expect(
      isNavItemVisible(
        { title: '多人', icon, requiredRole: [ROLE_ADMIN, ROLE_USER] },
        ROLE_USER,
      ),
    ).toBe(true);
    expect(
      isNavItemVisible(
        { title: '多人', icon, requiredRole: [ROLE_ADMIN] },
        ROLE_USER,
      ),
    ).toBe(false);
    expect(
      isNavItemVisible({ title: '管理', icon, requiredRole: ROLE_ADMIN }, null),
    ).toBe(false);
  });

  it('builds the document title from the active nav item', () => {
    expect(getDocumentTitle('/raid-run')).toBe(`开团 · ${APP_DOCUMENT_TITLE}`);
    expect(getDocumentTitle('/raid-run/run-1')).toBe(
      `开团 · ${APP_DOCUMENT_TITLE}`,
    );
    expect(getDocumentTitle('/unknown')).toBe(APP_DOCUMENT_TITLE);
  });
});
