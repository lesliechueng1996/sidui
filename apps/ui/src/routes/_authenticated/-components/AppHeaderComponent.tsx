import { useMutation } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { LogOutIcon, UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from '@/components/ui/toast';
import { changePassword, uploadAvatar } from '@/lib/api/profile-api';
import { handleApiError } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { clearSessionQuery, patchCachedSessionUser } from '@/lib/auth-session';
import type { ProfilePasswordFormValues } from '../-lib/profile-password-schema';
import { ProfileCenterDialogComponent } from './ProfileCenterDialogComponent';

type AppHeaderUser = {
  name: string;
  email: string;
  image?: string | null;
};

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) {
    return '用';
  }

  return source.slice(0, 1).toUpperCase();
}

export function AppHeaderComponent({ user }: { user: AppHeaderUser }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordFormKey, setPasswordFormKey] = useState(0);

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) {
        throw new Error(error.message ?? '退出登录失败');
      }
    },
    onSuccess: () => {
      clearSessionQuery();
      navigate({ to: '/login' });
    },
    onError: (error: Error) => {
      toast.add({
        type: 'error',
        title: '退出失败',
        description: error.message,
        priority: 'high',
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async (result) => {
      toast.add({
        type: 'success',
        title: '头像已更新',
      });
      patchCachedSessionUser({ image: result.imageUrl });
      await router.invalidate();
    },
    onError: (error) => handleApiError(error, '上传头像失败'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: ProfilePasswordFormValues) =>
      changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.add({
        type: 'success',
        title: '密码已修改',
      });
      setPasswordFormKey((current) => current + 1);
    },
    onError: (error) => handleApiError(error, '修改密码失败'),
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[oklch(0.58_0.17_28/0.45)] to-transparent"
      />

      <SidebarTrigger className="-ml-1" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          aria-hidden
          className="size-1.5 rotate-45 border border-[oklch(0.58_0.17_28)] bg-[oklch(0.58_0.17_28/0.2)]"
        />
        <div className="flex min-w-0 flex-col leading-none">
          <span className="font-heading text-sm font-medium tracking-[0.22em] text-foreground">
            四堆
          </span>
          <span className="mt-1 text-[0.65rem] tracking-wide text-muted-foreground">
            控制台
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="打开用户菜单"
            />
          }
        >
          <Avatar size="sm">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : null}
            <AvatarFallback>
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium">
                {user.name || user.email}
              </p>
            </div>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <UserIcon />
              个人中心
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={signOutMutation.isPending}
              onClick={() => signOutMutation.mutate()}
            >
              <LogOutIcon />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileCenterDialogComponent
        user={user}
        open={profileOpen}
        avatarPending={uploadAvatarMutation.isPending}
        passwordPending={changePasswordMutation.isPending}
        passwordFormKey={passwordFormKey}
        onOpenChange={setProfileOpen}
        onUploadAvatar={(file) => uploadAvatarMutation.mutate(file)}
        onChangePassword={(values) => changePasswordMutation.mutate(values)}
      />
    </header>
  );
}
