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
  type AdminCookSpaceCreateValues,
  type AdminCookSpaceListItem,
  adminArchiveCookSpace,
  adminCreateCookSpace,
  adminListCookSpaces,
  adminRenameCookSpace,
  adminRestoreCookSpace,
} from '@/lib/api/admin/admin-cook-spaces-api';
import { handleApiError } from '@/lib/api-client';
import { CookSpaceCreateDialogComponent } from './-components/CookSpaceCreateDialogComponent';
import { CookSpaceFiltersComponent } from './-components/CookSpaceFiltersComponent';
import { CookSpaceRenameDialogComponent } from './-components/CookSpaceRenameDialogComponent';
import { CookSpaceTableComponent } from './-components/CookSpaceTableComponent';
import {
  cookSpacesSearchSchema,
  defaultCookSpacesSearch,
  toListCookSpacesFilters,
} from './-lib/cook-spaces-schema';

export const Route = createFileRoute('/_authenticated/admin/cook/spaces/')({
  component: CookSpacesComponent,
  validateSearch: cookSpacesSearchSchema,
});

const cookSpacesAdminQueryKey = ['admin-cook-spaces'];

function CookSpacesComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [creating, setCreating] = useState(false);
  const [renamingSpace, setRenamingSpace] =
    useState<AdminCookSpaceListItem | null>(null);
  const [confirmingSpace, setConfirmingSpace] =
    useState<AdminCookSpaceListItem | null>(null);
  const [pendingSpaceId, setPendingSpaceId] = useState<string | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
    invalidate,
  } = usePaginatedQuery({
    queryKey: cookSpacesAdminQueryKey,
    search,
    defaults: defaultCookSpacesSearch,
    navigate,
    queryFn: (nextSearch) =>
      adminListCookSpaces(toListCookSpacesFilters(nextSearch)),
  });

  const createMutation = useMutation({
    mutationFn: adminCreateCookSpace,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '空间已开通',
      });
      setCreating(false);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '开通空间失败'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ spaceId, name }: { spaceId: string; name: string }) =>
      adminRenameCookSpace(spaceId, name),
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '空间名称已更新',
      });
      setRenamingSpace(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '更新空间失败'),
  });

  const archiveMutation = useMutation({
    mutationFn: adminArchiveCookSpace,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '空间已归档',
      });
      setConfirmingSpace(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '归档空间失败'),
    onSettled: () => setPendingSpaceId(null),
  });

  const restoreMutation = useMutation({
    mutationFn: adminRestoreCookSpace,
    onSuccess: async () => {
      toast.add({
        type: 'success',
        title: '空间已恢复',
      });
      setConfirmingSpace(null);
      await invalidate();
    },
    onError: (error) => handleApiError(error, '恢复空间失败'),
    onSettled: () => setPendingSpaceId(null),
  });

  const confirmingArchived = confirmingSpace?.archived === true;

  return (
    <section className="flex flex-col gap-6">
      <CookSpaceFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          开通空间
        </Button>
      </div>

      {isError ? (
        <ErrorAlert title="错误" description="加载空间列表失败，请稍后重试。" />
      ) : null}

      <CookSpaceTableComponent
        items={items}
        isLoading={isFetching}
        pendingSpaceId={pendingSpaceId}
        onRename={setRenamingSpace}
        onArchive={setConfirmingSpace}
        onRestore={setConfirmingSpace}
      />

      <Pagination {...paginationProps} />

      <ConfirmDialog
        open={confirmingSpace !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingSpace(null);
          }
        }}
        title={confirmingArchived ? '恢复空间' : '归档空间'}
        description={
          confirmingSpace
            ? confirmingArchived
              ? `确定恢复空间「${confirmingSpace.name}」吗？`
              : `确定归档空间「${confirmingSpace.name}」吗？归档后，成员将无法在烹饪 App 中看到该空间。`
            : undefined
        }
        confirmLabel={confirmingArchived ? '恢复' : '归档'}
        pending={archiveMutation.isPending || restoreMutation.isPending}
        onConfirm={() => {
          if (!confirmingSpace) {
            return;
          }
          setPendingSpaceId(confirmingSpace.id);
          if (confirmingSpace.archived) {
            restoreMutation.mutate(confirmingSpace.id);
            return;
          }
          archiveMutation.mutate(confirmingSpace.id);
        }}
      />

      <CookSpaceCreateDialogComponent
        open={creating}
        pending={createMutation.isPending}
        onOpenChange={setCreating}
        onSubmit={(values: AdminCookSpaceCreateValues) =>
          createMutation.mutate(values)
        }
      />

      <CookSpaceRenameDialogComponent
        space={renamingSpace}
        open={renamingSpace !== null}
        pending={renameMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setRenamingSpace(null);
          }
        }}
        onSubmit={(values) => {
          if (!renamingSpace) {
            return;
          }
          renameMutation.mutate({
            spaceId: renamingSpace.id,
            name: values.name,
          });
        }}
      />
    </section>
  );
}
