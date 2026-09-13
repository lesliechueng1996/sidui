import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameItemFormComponent } from '@/routes/_authenticated/admin/game-items/-components/GameItemFormComponent';

vi.mock('@/components/GameDungeonSearchSelectComponent', () => ({
  GameDungeonSearchSelectComponent: () => <div>副本选择</div>,
}));

const emptyValues = {
  name: '',
  gameItemId: '',
  type: 'equipment' as const,
  quality: 'white' as const,
  description: '',
  icon: '',
  aliasText: '',
  dungeons: [],
};

describe('GameItemFormComponent', () => {
  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameItemFormComponent
          formId="game-item-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="game-item-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
  });

  it('submits values and can change type and quality', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameItemFormComponent
          formId="game-item-form"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="game-item-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('名称'), '上品玄晶');
    await user.type(screen.getByLabelText('游戏内物品 ID'), '12345');
    await user.type(screen.getByLabelText('描述'), '用于装备精炼');
    await user.type(screen.getByLabelText('图标'), '/icon.png');
    await user.type(screen.getByLabelText('别名'), '大铁');
    await user.click(screen.getByRole('button', { name: '特殊' }));
    await user.click(screen.getByRole('button', { name: '橙' }));
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: '上品玄晶',
      gameItemId: '12345',
      type: 'special',
      quality: 'orange',
      description: '用于装备精炼',
      icon: '/icon.png',
      aliasText: '大铁',
      dungeons: [],
    });
  });

  it('ignores an empty type or quality toggle change', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameItemFormComponent
          formId="game-item-form"
          initialValues={{
            name: '上品玄晶',
            gameItemId: '',
            type: 'equipment',
            quality: 'white',
            description: '',
            icon: '',
            aliasText: '',
            dungeons: [],
          }}
          onSubmit={onSubmit}
        />
        <button type="submit" form="game-item-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '装备' }));
    await user.click(screen.getByRole('button', { name: '白' }));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'equipment', quality: 'white' }),
    );
  });

  it('shows length errors and disables fields when pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <GameItemFormComponent
          formId="game-item-form"
          initialValues={{
            name: '上品玄晶',
            gameItemId: 'x'.repeat(65),
            type: 'special',
            quality: 'orange',
            description: 'x'.repeat(513),
            icon: 'x'.repeat(513),
            aliasText: 'x'.repeat(201),
            dungeons: [],
          }}
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="game-item-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('名称')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('游戏内物品ID最多 64 个字符')).toBeInTheDocument();
    expect(screen.getByText('描述最多 512 个字符')).toBeInTheDocument();
    expect(screen.getByText('图标地址最多 512 个字符')).toBeInTheDocument();
    expect(screen.getByText('别名最多 200 个字符')).toBeInTheDocument();
  });

  it('shows a hint to copy the middle-dot character', () => {
    render(
      <GameItemFormComponent
        formId="game-item-form"
        initialValues={emptyValues}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: '点击 · 即可复制到剪切板' }),
    ).toBeInTheDocument();
  });
});
