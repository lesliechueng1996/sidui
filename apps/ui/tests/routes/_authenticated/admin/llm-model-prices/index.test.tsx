import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { renderApp } from '../../../../helpers/render';
import { adminSession } from '../../../../helpers/session';

const {
  adminListLlmModelPrices,
  adminCreateLlmModelPrice,
  adminSupersedeLlmModelPrice,
  adminUpdateLlmModelPrice,
  adminDeleteLlmModelPrice,
} = vi.hoisted(() => ({
  adminListLlmModelPrices: vi.fn(),
  adminCreateLlmModelPrice: vi.fn(),
  adminSupersedeLlmModelPrice: vi.fn(),
  adminUpdateLlmModelPrice: vi.fn(),
  adminDeleteLlmModelPrice: vi.fn(),
}));

vi.mock('@/lib/api/admin/admin-llm-model-prices-api', () => ({
  adminListLlmModelPrices,
  adminCreateLlmModelPrice,
  adminSupersedeLlmModelPrice,
  adminUpdateLlmModelPrice,
  adminDeleteLlmModelPrice,
}));

const priceItem = {
  id: 'price-1',
  provider: 'kimi',
  modelId: 'kimi-k2.6',
  dimension: 'prompt',
  unit: 'per_million_tokens',
  amount: '4',
  currency: 'CNY',
  source: 'manual',
  status: 'current',
  effectiveFrom: '2026-01-01 00:00:00',
  effectiveTo: null,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-02 00:00:00',
};

const scheduledItem = {
  ...priceItem,
  id: 'price-2',
  status: 'scheduled',
  modelId: 'future',
};

describe('admin llm model prices route', () => {
  beforeEach(() => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: adminSession,
    } as never);
    vi.mocked(toast.add).mockClear();
    adminListLlmModelPrices.mockReset();
    adminCreateLlmModelPrice.mockReset();
    adminSupersedeLlmModelPrice.mockReset();
    adminUpdateLlmModelPrice.mockReset();
    adminDeleteLlmModelPrice.mockReset();
    adminListLlmModelPrices.mockResolvedValue({
      items: [priceItem, scheduledItem],
      total: 2,
    });
  });

  it('lists prices', async () => {
    await renderApp('/admin/llm-model-prices');
    expect(await screen.findByText('kimi-k2.6')).toBeInTheDocument();
  });

  it('searches and resets filters', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/llm-model-prices');
    await screen.findByText('kimi-k2.6');

    await user.type(screen.getByLabelText('供应商'), 'kimi');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await waitFor(() => {
      expect(adminListLlmModelPrices).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'kimi', page: 1 }),
      );
    });

    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => {
      expect(adminListLlmModelPrices).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: undefined,
          currentOnly: true,
          page: 1,
        }),
      );
    });
  });

  it('shows a load error', async () => {
    adminListLlmModelPrices.mockRejectedValue(new Error('fail'));
    await renderApp('/admin/llm-model-prices');
    expect(
      await screen.findByText('加载模型价格列表失败，请稍后重试。'),
    ).toBeInTheDocument();
  });

  it('creates a price', async () => {
    const user = userEvent.setup();
    adminCreateLlmModelPrice.mockResolvedValue({ id: 'n' });
    await renderApp('/admin/llm-model-prices');
    await screen.findByText('kimi-k2.6');

    await user.click(screen.getByRole('button', { name: '新增价格' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('供应商'), 'kimi');
    await user.type(within(dialog).getByLabelText('模型 ID'), 'kimi-k2.6');
    await user.type(within(dialog).getByLabelText('金额'), '4');
    await user.click(within(dialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminCreateLlmModelPrice).toHaveBeenCalled();
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '模型价格已创建' }),
      );
    });
  });

  it('edits, supersedes, and deletes prices', async () => {
    const user = userEvent.setup();
    adminUpdateLlmModelPrice.mockResolvedValue({ id: 'price-1' });
    adminSupersedeLlmModelPrice.mockResolvedValue({ id: 'price-1' });
    adminDeleteLlmModelPrice.mockResolvedValue(undefined);

    await renderApp('/admin/llm-model-prices');
    await screen.findByText('kimi-k2.6');

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    const editDialog = await screen.findByRole('dialog');
    expect(within(editDialog).getByText('编辑模型价格')).toBeInTheDocument();
    await user.clear(within(editDialog).getByLabelText('金额'));
    await user.type(within(editDialog).getByLabelText('金额'), '8');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(adminUpdateLlmModelPrice).toHaveBeenCalledWith(
        'price-1',
        expect.objectContaining({ amount: '8' }),
      );
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ title: '模型价格已更新' }),
      );
    });

    await user.click(screen.getAllByRole('button', { name: '调价' })[0]);
    const supersedeDialog = await screen.findByRole('dialog');
    await user.click(
      within(supersedeDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(adminSupersedeLlmModelPrice).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(adminDeleteLlmModelPrice).toHaveBeenCalledWith('price-2');
    });
  });

  it('toasts mutation failures', async () => {
    const user = userEvent.setup();
    adminCreateLlmModelPrice.mockRejectedValue(new Error('创建失败'));
    adminUpdateLlmModelPrice.mockRejectedValue(new Error('更新失败'));
    adminSupersedeLlmModelPrice.mockRejectedValue(new Error('调价失败'));
    adminDeleteLlmModelPrice.mockRejectedValue(new Error('删除失败'));

    await renderApp('/admin/llm-model-prices');
    await screen.findByText('kimi-k2.6');

    await user.click(screen.getByRole('button', { name: '新增价格' }));
    const createDialog = await screen.findByRole('dialog');
    await user.type(within(createDialog).getByLabelText('供应商'), 'kimi');
    await user.type(
      within(createDialog).getByLabelText('模型 ID'),
      'kimi-k2.6',
    );
    await user.type(within(createDialog).getByLabelText('金额'), '4');
    await user.click(
      within(createDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '创建失败' }),
      );
    });
    await user.click(
      within(createDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0]);
    const editDialog = await screen.findByRole('dialog');
    await user.click(within(editDialog).getByRole('button', { name: '保存' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '更新失败' }),
      );
    });
    await user.click(within(editDialog).getByRole('button', { name: '取消' }));

    await user.click(screen.getAllByRole('button', { name: '调价' })[0]);
    const supersedeDialog = await screen.findByRole('dialog');
    await user.click(
      within(supersedeDialog).getByRole('button', { name: '保存' }),
    );
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '调价失败' }),
      );
    });
    await user.click(
      within(supersedeDialog).getByRole('button', { name: '取消' }),
    );

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '删除' }));
    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ description: '删除失败' }),
      );
    });
  });

  it('cancels a delete confirmation', async () => {
    const user = userEvent.setup();
    await renderApp('/admin/llm-model-prices');
    await screen.findByText('future');

    await user.click(screen.getByRole('button', { name: '删除' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: '取消' }));
    expect(adminDeleteLlmModelPrice).not.toHaveBeenCalled();
  });
});
