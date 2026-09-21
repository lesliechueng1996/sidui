import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import ErrorAlert from '#/components/ErrorAlert';
import Pagination from '#/components/Pagination';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import {
  type AdminLlmUsageEventListItem,
  adminListLlmUsageEvents,
} from '@/lib/api/admin/admin-llm-usage-events-api';
import { LlmUsageEventDetailDialogComponent } from './-components/LlmUsageEventDetailDialogComponent';
import { LlmUsageEventFiltersComponent } from './-components/LlmUsageEventFiltersComponent';
import { LlmUsageEventTableComponent } from './-components/LlmUsageEventTableComponent';
import {
  defaultLlmUsageEventsSearch,
  llmUsageEventsSearchSchema,
  toListLlmUsageEventsFilters,
} from './-lib/llm-usage-events-schema';

export const Route = createFileRoute('/_authenticated/admin/llm-usage-events/')(
  {
    component: LlmUsageEventsComponent,
    validateSearch: llmUsageEventsSearchSchema,
  },
);

const llmUsageEventsAdminQueryKey = ['admin-llm-usage-events'];

function LlmUsageEventsComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [detailEvent, setDetailEvent] =
    useState<AdminLlmUsageEventListItem | null>(null);

  const {
    items,
    isFetching,
    isError,
    setSearch,
    resetSearch,
    paginationProps,
  } = usePaginatedQuery({
    queryKey: llmUsageEventsAdminQueryKey,
    search,
    defaults: defaultLlmUsageEventsSearch,
    navigate,
    queryFn: (nextSearch) =>
      adminListLlmUsageEvents(toListLlmUsageEventsFilters(nextSearch)),
  });

  return (
    <section className="flex flex-col gap-6">
      <LlmUsageEventFiltersComponent
        committedFilters={search}
        onSearch={setSearch}
        onReset={resetSearch}
      />

      {isError ? (
        <ErrorAlert title="错误" description="加载用量事件失败，请稍后重试。" />
      ) : null}

      <LlmUsageEventTableComponent
        items={items}
        isLoading={isFetching}
        onView={setDetailEvent}
      />

      <Pagination {...paginationProps} />

      <LlmUsageEventDetailDialogComponent
        event={detailEvent}
        open={detailEvent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailEvent(null);
          }
        }}
      />
    </section>
  );
}
