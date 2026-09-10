import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const { adminListAppSettings, adminUpdateAppSetting } = vi.hoisted(() => ({
  adminListAppSettings: vi.fn(),
  adminUpdateAppSetting: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-app-settings-api', () => ({
  adminListAppSettings,
  adminUpdateAppSetting,
}));

const listPayload = {
  items: [
    {
      key: 'currentSeason' as const,
      value: { seasonId: '11111111-1111-4111-8111-111111111111' },
      updatedAt: '2026-01-02 00:00:00',
    },
    {
      key: 'raidIncomeChart' as const,
      value: null,
      updatedAt: null,
    },
  ],
};

describe('admin app-settings route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListAppSettings.mockReset();
    adminUpdateAppSetting.mockReset();
    adminListAppSettings.mockResolvedValue(listPayload);
    adminUpdateAppSetting.mockResolvedValue(listPayload.items[0]);
  });

  it('lists registered settings', async () => {
    await renderApp('/admin/app-settings');
    expect(await screen.findByText('currentSeason')).toBeInTheDocument();
    expect(screen.getByText('raidIncomeChart')).toBeInTheDocument();
  });

  it('shows a load error', async () => {
    adminListAppSettings.mockRejectedValue(new Error('boom'));
    await renderApp('/admin/app-settings');
    expect(
      await screen.findByText('加载应用配置失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('does not save invalid json', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/app-settings');
    await screen.findByText('currentSeason');

    const [textarea] = screen.getAllByLabelText('JSON');
    await user.clear(textarea);
    await user.type(textarea, '{{');
    await user.click(screen.getAllByRole('button', { name: '保存' })[0]);

    expect(screen.getByText('JSON 格式不正确')).toBeInTheDocument();
    expect(adminUpdateAppSetting).not.toHaveBeenCalled();
  });

  it('saves a setting', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/app-settings');
    await screen.findByText('currentSeason');

    await user.click(screen.getAllByRole('button', { name: '保存' })[0]);

    await waitFor(() => {
      expect(adminUpdateAppSetting).toHaveBeenCalledWith('currentSeason', {
        seasonId: '11111111-1111-4111-8111-111111111111',
      });
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: 'currentSeason 已保存',
    });
  });

  it('only disables the card being saved', async () => {
    const user = userEvent.setup();
    adminUpdateAppSetting.mockImplementation(() => new Promise(() => {}));
    await renderApp('/admin/app-settings');
    await screen.findByText('currentSeason');

    await user.click(screen.getAllByRole('button', { name: '保存' })[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '保存' })[0]).toBeDisabled();
    });
    expect(screen.getAllByRole('button', { name: '保存' })[1]).toBeEnabled();
  });

  it('toasts when save fails', async () => {
    const user = userEvent.setup();
    adminUpdateAppSetting.mockRejectedValue(new Error('赛季不存在'));
    await renderApp('/admin/app-settings');
    await screen.findByText('currentSeason');

    await user.click(screen.getAllByRole('button', { name: '保存' })[0]);

    await waitFor(() => {
      expect(adminUpdateAppSetting).toHaveBeenCalled();
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: 'error',
      description: '赛季不存在',
    });
  });
});
