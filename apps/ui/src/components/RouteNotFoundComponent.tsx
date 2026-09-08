import { Link } from '@tanstack/react-router';
import { HouseIcon, SearchXIcon } from 'lucide-react';
import {
  BrandedBlurTextComponent,
  BrandedCountUpComponent,
  BrandedGlassCardComponent,
  BrandedMarkComponent,
  BrandedStageComponent,
} from '@/components/BrandedStageComponent';
import { Button } from '@/components/ui/button';

export function RouteNotFoundComponent() {
  return (
    <BrandedStageComponent mood="not-found" contentClassName="max-w-md gap-10">
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
            <SearchXIcon className="size-5" strokeWidth={1.5} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <p
              aria-hidden
              className="font-heading text-[4.5rem] leading-none font-light tracking-[-0.04em] text-white/90"
            >
              <BrandedCountUpComponent to={404} />
            </p>
            <h1 className="text-lg font-medium tracking-wide text-white/90">
              <BrandedBlurTextComponent
                text="页面不存在"
                className="justify-center text-lg font-medium tracking-wide text-white/90"
              />
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/45">
              这个地址没有对应的页面。检查链接是否正确，或返回首页继续。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link to="/" />}
            className="h-11 w-full rounded-xl border-0 bg-[oklch(0.58_0.17_28)] text-[15px] font-medium tracking-wide text-white shadow-[0_8px_32px_-8px_oklch(0.58_0.17_28/0.7)] hover:bg-[oklch(0.54_0.17_28)] active:scale-[0.99]"
          >
            <HouseIcon data-icon="inline-start" />
            返回首页
          </Button>
        </div>
      </BrandedGlassCardComponent>
    </BrandedStageComponent>
  );
}
