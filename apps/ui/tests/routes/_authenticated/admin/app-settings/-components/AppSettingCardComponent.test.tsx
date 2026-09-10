import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppSettingCardComponent } from '@/routes/_authenticated/admin/app-settings/-components/AppSettingCardComponent';
import { renderWithQueryClient } from '../../../../../helpers/render';

describe('AppSettingCardComponent', () => {
  it('submits parsed json', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <AppSettingCardComponent
        settingKey="currentSeason"
        description='{ "seasonId": "<uuid>" }'
        value={{ seasonId: 'abc' }}
        onSubmit={onSubmit}
      />,
    );

    const textarea = screen.getByLabelText('JSON');
    await user.clear(textarea);
    await user.type(textarea, '{{"seasonId":"xyz"}');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith({ seasonId: 'xyz' });
  });

  it('shows an error for invalid json and does not submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <AppSettingCardComponent
        settingKey="currentSeason"
        description='{ "seasonId": "<uuid>" }'
        value={null}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('JSON'), '{{');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('JSON 格式不正确')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the editor while pending', () => {
    renderWithQueryClient(
      <AppSettingCardComponent
        settingKey="currentSeason"
        description="shape"
        value={{ seasonId: 'abc' }}
        pending
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('JSON')).toBeDisabled();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });

  it('shows an error for empty json', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithQueryClient(
      <AppSettingCardComponent
        settingKey="raidIncomeChart"
        description="shape"
        value={{ dungeonIds: ['a'] }}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('JSON'));
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('JSON 不能为空')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
