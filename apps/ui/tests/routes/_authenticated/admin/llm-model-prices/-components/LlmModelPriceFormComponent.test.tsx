import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LlmModelPriceFormComponent } from '@/routes/_authenticated/admin/llm-model-prices/-components/LlmModelPriceFormComponent';

const emptyValues = {
  provider: '',
  modelId: '',
  dimension: 'prompt' as const,
  unit: 'per_million_tokens' as const,
  amount: '',
  currency: 'CNY',
  effectiveFrom: '',
};

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
};

describe('LlmModelPriceFormComponent', () => {
  it('does not submit invalid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <LlmModelPriceFormComponent
          formId="price-form"
          mode="create"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="price-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入供应商')).toBeInTheDocument();
  });

  it('submits values and can change closed-set fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <LlmModelPriceFormComponent
          formId="price-form"
          mode="create"
          initialValues={emptyValues}
          onSubmit={onSubmit}
        />
        <button type="submit" form="price-form">
          提交
        </button>
      </>,
    );

    await user.type(screen.getByLabelText('供应商'), 'kimi');
    await user.type(screen.getByLabelText('模型 ID'), 'kimi-k2.6');
    await chooseSelectOption(user, '维度', '输出');
    await user.click(screen.getByRole('button', { name: '每次调用' }));
    await user.type(screen.getByLabelText('金额'), '8');
    await user.clear(screen.getByLabelText('币种'));
    await user.type(screen.getByLabelText('币种'), 'CNY');
    fireEvent.change(screen.getByLabelText('生效时间'), {
      target: { value: '2026-01-02T03:04' },
    });
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      provider: 'kimi',
      modelId: 'kimi-k2.6',
      dimension: 'completion',
      unit: 'per_call',
      amount: '8',
      currency: 'CNY',
      effectiveFrom: '2026-01-02T03:04',
    });
  });

  it('ignores empty unit toggle changes', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <LlmModelPriceFormComponent
          formId="price-form"
          mode="create"
          initialValues={{
            ...emptyValues,
            provider: 'kimi',
            modelId: 'kimi-k2.6',
            amount: '4',
          }}
          onSubmit={onSubmit}
        />
        <button type="submit" form="price-form">
          提交
        </button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '每百万 token' }));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        unit: 'per_million_tokens',
      }),
    );
  });

  it('disables identity fields in edit mode', () => {
    render(
      <LlmModelPriceFormComponent
        formId="price-form"
        mode="edit"
        initialValues={{
          ...emptyValues,
          provider: 'kimi',
          modelId: 'kimi-k2.6',
          amount: '4',
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('供应商')).toBeDisabled();
    expect(screen.getByLabelText('模型 ID')).toBeDisabled();
    expect(screen.getByLabelText('金额')).not.toBeDisabled();
  });

  it('disables identity fields in supersede mode and shows pending state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <>
        <LlmModelPriceFormComponent
          formId="price-form"
          mode="supersede"
          initialValues={{
            ...emptyValues,
            provider: 'kimi',
            modelId: 'kimi-k2.6',
            amount: 'abc',
            currency: '',
          }}
          pending
          onSubmit={onSubmit}
        />
        <button type="submit" form="price-form">
          提交
        </button>
      </>,
    );

    expect(screen.getByLabelText('供应商')).toBeDisabled();
    expect(screen.getByLabelText('模型 ID')).toBeDisabled();
    expect(screen.getByLabelText('金额')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('请输入币种')).toBeInTheDocument();
  });
});
