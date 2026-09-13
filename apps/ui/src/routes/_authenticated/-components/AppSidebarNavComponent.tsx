import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronRightIcon } from 'lucide-react';
import { type ComponentProps, useEffect, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {
  isNavItemActive,
  isNavPathActive,
  type NavItem,
  visibleNavItems,
} from '../-lib/nav-items';

const activeLeafClassName =
  'bg-[oklch(0.58_0.17_28)] text-white hover:bg-[oklch(0.58_0.17_28)] hover:text-white data-active:bg-[oklch(0.58_0.17_28)] data-active:text-white';

function NavLeafItem({
  title,
  to,
  icon: Icon,
}: {
  title: string;
  to: string;
  icon: NavItem['icon'];
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const active = isNavPathActive(pathname, to);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={title}
        render={<Link to={to} />}
        className={cn(active && activeLeafClassName)}
      >
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavBranchItem({ item }: { item: NavItem }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const childActive = isNavItemActive(pathname, item);
  const siblingTos = item.children?.map((leaf) => leaf.to) ?? [];
  const [open, setOpen] = useState(childActive);
  const Icon = item.icon;

  useEffect(() => {
    if (childActive) {
      setOpen(true);
    }
  }, [childActive]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          render={<CollapsibleTrigger />}
          className={cn(childActive && 'font-medium text-foreground')}
        >
          <Icon />
          <span>{item.title}</span>
          <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
        </SidebarMenuButton>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => {
              const active = isNavPathActive(pathname, child.to, siblingTos);

              return (
                <SidebarMenuSubItem key={child.to}>
                  <SidebarMenuSubButton
                    isActive={active}
                    render={<Link to={child.to} />}
                    className={cn(active && activeLeafClassName)}
                  >
                    <span>{child.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebarNavComponent({
  userRole,
  ...props
}: ComponentProps<typeof Sidebar> & { userRole?: string | null }) {
  const items = visibleNavItems(userRole);

  return (
    <Sidebar
      collapsible="icon"
      className="top-14! bottom-0! h-auto!"
      {...props}
    >
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) =>
              item.children?.length ? (
                <NavBranchItem key={item.title} item={item} />
              ) : (
                <NavLeafItem
                  key={item.title}
                  title={item.title}
                  to={item.to ?? '/'}
                  icon={item.icon}
                />
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
