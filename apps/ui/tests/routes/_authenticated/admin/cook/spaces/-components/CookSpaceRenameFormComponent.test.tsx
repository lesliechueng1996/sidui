import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CookSpaceRenameFormComponent } from '@/routes/_authenticated/admin/cook/spaces/-components/CookSpaceRenameFormComponent';

describe('CookSpaceRenameFormComponent', () => {
  it('does not submit a blank name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <CookSpaceRenameFormComponent
          formId="rename-form"
          initialValues={{ name: '每日厨房' }}
          onSubmit={onSubmit}
        />
        <button type="submit" form="rename-form">
          提交
        </button>
      </>,
    );

    await user.clear(screen.getByLabelText('名称'));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入名称')).toBeInTheDocument();
  });

  it('submits a trimmed name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <CookSpaceRenameFormComponent
          formId="rename-form"
          initialValues={{ name: '' }}
          onSubmit={onSubmit}
        />
        <button type="submit" form="rename-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('名称'), '  新厨房  ');
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: '新厨房' });
  });

  it('disables the name field while pending', () => {
    render(
      <CookSpaceRenameFormComponent
        formId="rename-form"
        initialValues={{ name: '每日厨房' }}
        pending
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('名称')).toBeDisabled();
  });
});
