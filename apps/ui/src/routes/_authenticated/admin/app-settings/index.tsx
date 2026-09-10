import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import ErrorAlert from '#/components/ErrorAlert';
import { toast } from '@/components/ui/toast';
import {
  type AppSettingKey,
  adminListAppSettings,
  adminUpdateAppSetting,
} from '@/lib/api/admin/admin-app-settings-api';
import { handleApiError } from '@/lib/api-client';
import { AppSettingCardComponent } from './-components/AppSettingCardComponent';
import { APP_SETTING_DESCRIPTIONS } from './-lib/app-settings';

export const Route = createFileRoute('/_authenticated/admin/app-settings/')({
  component: AppSettingsComponent,
});

const appSettingsAdminQueryKey = ['admin-app-settings'];

function AppSettingsComponent() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: appSettingsAdminQueryKey,
    queryFn: adminListAppSettings,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: AppSettingKey; value: unknown }) =>
      adminUpdateAppSetting(key, value),
    onSuccess: async (_data, variables) => {
      toast.add({
        type: 'success',
        title: `${variables.key} 已保存`,
      });
      await queryClient.invalidateQueries({
        queryKey: appSettingsAdminQueryKey,
      });
    },
    onError: (error) => handleApiError(error, '保存配置失败'),
  });

  const items = listQuery.data?.items ?? [];

  return (
    <section className="flex flex-col gap-6">
      {listQuery.isError ? (
        <ErrorAlert title="错误" description="加载应用配置失败，请稍后重试。" />
      ) : null}

      {items.map((item) => (
        <AppSettingCardComponent
          key={item.key}
          settingKey={item.key}
          description={APP_SETTING_DESCRIPTIONS[item.key]}
          value={item.value}
          pending={
            updateMutation.isPending &&
            updateMutation.variables?.key === item.key
          }
          onSubmit={(value) => updateMutation.mutate({ key: item.key, value })}
        />
      ))}
    </section>
  );
}
