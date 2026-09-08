import { useMutation } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import {
  BrandedBlurTextComponent,
  BrandedGlassCardComponent,
  BrandedMarkComponent,
  BrandedStageComponent,
} from '@/components/BrandedStageComponent';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { clearSessionQuery, fetchCachedSession } from '@/lib/auth-session';
import { AuthCredentialsFormComponent } from './-components/AuthCredentialsFormComponent';
import type { AuthCredentials } from './-lib/auth-credentials-schema';
import { authSearchSchema } from './-lib/auth-search-schema';

export const Route = createFileRoute('/login/')({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await fetchCachedSession();
    if (!session) {
      return;
    }

    throw redirect({
      to: search.redirect ?? '/',
      replace: true,
    });
  },
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const loginMutation = useMutation({
    mutationFn: async (credentials: AuthCredentials) => {
      const { data, error } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        const errorMessage =
          error.status === 401 ? '邮箱或密码错误' : error.message;
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: () => {
      clearSessionQuery();
      navigate({ to: redirect ?? '/' });
    },
    onError: (error: Error) => {
      toast.add({
        type: 'error',
        title: '登录失败',
        description: error.message,
        priority: 'high',
      });
    },
  });

  return (
    <BrandedStageComponent mood="login" contentClassName="max-w-100">
      <div className="mb-10 flex flex-col items-center gap-4">
        <BrandedMarkComponent />
        <h1>
          <BrandedBlurTextComponent
            text="四堆"
            className="font-heading justify-center text-[2.75rem] font-light tracking-[0.28em] text-white/95"
          />
        </h1>
      </div>

      <BrandedGlassCardComponent className="p-8">
        <AuthCredentialsFormComponent
          isPending={loginMutation.isPending}
          onSubmit={(credentials) => loginMutation.mutate(credentials)}
        />
      </BrandedGlassCardComponent>
    </BrandedStageComponent>
  );
}
