import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDialog } from '#/components/ConfirmDialog';
import ErrorAlert from '#/components/ErrorAlert';
import Pagination from '#/components/Pagination';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import {
  type AdminLlmModelPriceCreateValues,
  type AdminLlmModelPriceListItem,
  type AdminLlmModelPriceSupersedeValues,
  type AdminLlmModelPriceUpdateValues,
  adminCreateLlmModelPrice,
  adminDeleteLlmModelPrice,
  adminListLlmModelPrices,
  adminSupersedeLlmModelPrice,
  adminUpdateLlmModelPrice,
} from '@/lib/api/admin/admin-llm-model-prices-api';
import { handleApiError } from '@/lib/api-client';
import { LlmModelPriceCreateDialogComponent } from './-components/LlmModelPriceCreateDialogComponent';
import { LlmModelPriceEditDialogComponent } from './-components/LlmModelPriceEditDialogComponent';
import { LlmModelPriceFiltersComponent } from './-components/LlmModelPriceFiltersComponent';
import { LlmModelPriceSupersedeDialogComponent } from './-components/LlmModelPriceSupersedeDialogComponent';
import { LlmModelPriceTableComponent } from './-components/LlmModelPriceTableComponent';
import {
  defaultLlmModelPricesSearch,
  llmModelPricesSearchSchema,
  toListLlmModelPricesFilters,
} from './-lib/llm-model-prices-schema';

export const Route = createFileRoute('/_authenticated/admin/llm-model-prices/')(
  {
    component: LlmModelPricesComponent,
    validateSearch: llmModelPricesSearchSchema,
  },
);

const llmModelPricesAdminQueryKey = ['admin-llm-model-prices'];

function LlmModelPricesComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [creating, setCreating] = useState(false);
  const [editingPrice, setEditingPrice] =
    useState<AdminLlmModelPriceListItem | null>(null);
  const [supersedingPrice, setSupersedingPrice] =
    useState<AdminLlmModelPriceListItem | null>(null);
  const [deletingPrice, setDeletingPrice] =
    useState<AdminLlmModelPriceListItem | null>(null);
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: llmModelPricesAdminQueryKey,
    search,
    defaults: defaultLlmModelPricesSearch,
    navigate,
    queryFn: (nextSearch) =>
      adminListLlmModelPrices(toListLlmModelPricesFilters(nextSearch)),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateLlmModelPrice,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '模型价格已创建',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '创建模型价格失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      priceId,
      price,
    }: {
      priceId: string;
      price: AdminLlmModelPriceUpdateValues;
    }) => adminUpdateLlmModelPrice(priceId, price),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '模型价格已更新',
      });
      setEditingPrice(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新模型价格失败'),
  });

  const supersedeMutation = useMutation({
    mutationFn: ({
      priceId,
      price,
    }: {
      priceId: string;
      price: AdminLlmModelPriceSupersedeValues;
    }) => adminSupersedeLlmModelPrice(priceId, price),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '已完成调价',
      });
      setSupersedingPrice(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '调价失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (priceId: string) => adminDeleteLlmModelPrice(priceId),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '模型价格已删除',
      });
      await invalidate();
    },
    onError: (error) => handleApiError(error, '删除模型价格失败'),
    onSettled: () => setPendingPriceId(null),
  });

  return (
    <section className="flex flex-col gap-6">
      <LlmModelPriceFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          新增价格
        </Button>
      </div>

      {isError ? (
        <ErrorAlert
          title="错误"
          description="加载模型价格列表失败，请稍后重试。"
        />
      ) : null}

      <LlmModelPriceTableComponent
        items={items}
        isLoading={isFetching}
        pendingPriceId={pendingPriceId}
        onEdit={setEditingPrice}
        onSupersede={setSupersedingPrice}
        onDelete={setDeletingPrice}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={deletingPrice !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPrice(null);
          }
        }}
        title="删除模型价格"
        description={
          deletingPrice
            ? `确定删除 ${deletingPrice.provider}/${deletingPrice.modelId} 的未生效价格吗？此操作无法撤销。`
            : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingPrice) {
            return;
          }
          setPendingPriceId(deletingPrice.id);
          deleteMutation.mutate(deletingPrice.id);
        }}
      />

      <LlmModelPriceCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminLlmModelPriceCreateValues) =>
          createMutation.mutate(values)
        }
      />

      <LlmModelPriceEditDialogComponent
        price={editingPrice}
        open={editingPrice !== null}
        pending={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPrice(null);
          }
        }}
        onSubmit={(values) => {
          if (!editingPrice) {
            return;
          }
          updateMutation.mutate({
            priceId: editingPrice.id,
            price: values,
          });
        }}
      />

      <LlmModelPriceSupersedeDialogComponent
        price={supersedingPrice}
        open={supersedingPrice !== null}
        pending={supersedeMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setSupersedingPrice(null);
          }
        }}
        onSubmit={(values) => {
          if (!supersedingPrice) {
            return;
          }
          supersedeMutation.mutate({
            priceId: supersedingPrice.id,
            price: values,
          });
        }}
      />
    </section>
  );
}
