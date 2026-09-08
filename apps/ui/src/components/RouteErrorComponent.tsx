import {
  type ErrorComponentProps,
  Link,
  useRouter,
} from '@tanstack/react-router';
import { HouseIcon, RotateCcwIcon, ServerOffIcon } from 'lucide-react';
import { useState } from 'react';
import {
  BrandedBlurTextComponent,
  BrandedCountUpComponent,
  BrandedGlassCardComponent,
  BrandedMarkComponent,
  BrandedStageComponent,
} from '@/components/BrandedStageComponent';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { sessionQueryKey } from '@/lib/auth-session';
import { queryClient } from '@/lib/query-client';

const NETWORK_ERROR_MESSAGES = new Set([
  'Failed to fetch',
  'Load failed',
  'NetworkError when attempting to fetch resource.',
  'Network request failed',
]);

function isNetworkError(error: unknown) {
  return (
    error instanceof TypeError && NETWORK_ERROR_MESSAGES.has(error.message)
  );
}

function getErrorCopy(error: unknown) {
  if (isNetworkError(error)) {
    return {
      code: 503,
      title: '无法连接服务器',
      description: '暂时连不上后台服务。确认服务已启动后再试。',
    };
  }

  const message = error instanceof Error ? error.message.trim() : '';

  return {
    code: 500,
    title: '页面出了点问题',
    description:
      message && !NETWORK_ERROR_MESSAGES.has(message)
        ? message
        : '发生了意外错误。请重试，若仍无法恢复可刷新页面。',
  };
}

export function RouteErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const copy = getErrorCopy(error);

  const handleRetry = async () => {
    // CatchBoundary.reset() only clears React state; MatchInner then rethrows the
    // same match.error without re-running beforeLoad. Invalidate rematches.
    setIsRetrying(true);
    queryClient.removeQueries({ queryKey: sessionQueryKey });

    try {
      await router.invalidate();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <BrandedStageComponent mood="error" contentClassName="max-w-md gap-10">
      <div className="flex flex-col items-center gap-4">
        <BrandedMarkComponent />
        <p className="font-heading text-sm font-light tracking-[0.32em] text-white/55">
          四堆
        </p>
      </div>

      <BrandedGlassCardComponent className="px-8 pt-10 pb-8">
        <div className="mb-8 flex flex-col items-center gap-5 text-center">
          <div
            aria-hidden
            className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-[oklch(0.72_0.12_28)]"
          >
            <ServerOffIcon className="size-5" strokeWidth={1.5} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <p
              aria-hidden
              className="font-heading text-[4.5rem] leading-none font-light tracking-[-0.04em] text-white/90"
            >
              <BrandedCountUpComponent to={copy.code} />
            </p>
            <h1 className="text-lg font-medium tracking-wide text-white/90">
              <BrandedBlurTextComponent
                text={copy.title}
                className="justify-center text-lg font-medium tracking-wide text-white/90"
              />
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/45">
              {copy.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            disabled={isRetrying}
            className="h-11 w-full rounded-xl border-0 bg-[oklch(0.58_0.17_28)] text-[15px] font-medium tracking-wide text-white shadow-[0_8px_32px_-8px_oklch(0.58_0.17_28/0.7)] hover:bg-[oklch(0.54_0.17_28)] active:scale-[0.99] disabled:opacity-70"
            onClick={() => {
              void handleRetry();
            }}
          >
            {isRetrying ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RotateCcwIcon data-icon="inline-start" />
            )}
            {isRetrying ? '重试中…' : '重试'}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={isRetrying}
            nativeButton={false}
            render={<Link to="/" />}
            className="h-11 w-full rounded-xl text-[15px] font-medium tracking-wide text-white/55 hover:bg-white/5 hover:text-white/85"
          >
            <HouseIcon data-icon="inline-start" />
            返回首页
          </Button>
        </div>
      </BrandedGlassCardComponent>
    </BrandedStageComponent>
  );
}
