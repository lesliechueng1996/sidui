import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ROLE_ADMIN } from '@/lib/auth-client';
import { fetchCachedSession } from '@/lib/auth-session';
import { AppHeaderComponent } from './-components/AppHeaderComponent';
import { AppSidebarNavComponent } from './-components/AppSidebarNavComponent';
import { APP_DOCUMENT_TITLE, getDocumentTitle } from './-lib/nav-items';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const session = await fetchCachedSession();

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }

    return { user: session.user, isAdmin: session.user.role === ROLE_ADMIN };
  },
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    document.title = getDocumentTitle(pathname);
    return () => {
      document.title = APP_DOCUMENT_TITLE;
    };
  }, [pathname]);

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden flex-col!">
        <AppHeaderComponent user={user} />
        <div className="flex min-h-0 w-full flex-1">
          <AppSidebarNavComponent userRole={user.role} />
          <SidebarInset className="min-h-0 overflow-auto">
            <div className="relative isolate flex min-h-full flex-col">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,oklch(0.58_0.17_28/0.06),transparent_55%)]"
              />
              <div className="relative flex min-h-full flex-1 flex-col p-6">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
