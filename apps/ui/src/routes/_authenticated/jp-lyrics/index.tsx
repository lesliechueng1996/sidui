import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ConfirmDialog } from '#/components/ConfirmDialog';
import ErrorAlert from '#/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  type CreateLyricSongValues,
  createLyricSong,
  deleteLyricSong,
  exportLyricSongs,
  importLyricSongsFromJsonFile,
  type LyricSongListItem,
  listLyricSongs,
  lyricSongsQueryKey,
} from '@/lib/api/lyric-songs-api';
import { handleApiError } from '@/lib/api-client';
import { LyricSongCardComponent } from './-components/LyricSongCardComponent';
import { LyricSongImportDialogComponent } from './-components/LyricSongImportDialogComponent';
import { LyricSongInfoDialogComponent } from './-components/LyricSongInfoDialogComponent';
import { downloadJsonFile } from './-lib/download-json';

export const Route = createFileRoute('/_authenticated/jp-lyrics/')({
  component: LyricSongsComponent,
});

function LyricSongsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<LyricSongListItem | null>(null);

  const listQuery = useQuery({
    queryKey: lyricSongsQueryKey,
    queryFn: listLyricSongs,
  });

  const createMutation = useMutation({
    mutationFn: createLyricSong,
    onSuccess: async (song) => {
      toast.add({ type: 'success', title: '歌曲已创建' });
      setCreating(false);
      await queryClient.invalidateQueries({ queryKey: lyricSongsQueryKey });
      await navigate({
        to: '/jp-lyrics/$songId/edit',
        params: { songId: song.id },
      });
    },
    onError: (error) => handleApiError(error, '创建歌曲失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLyricSong,
    onSuccess: async () => {
      toast.add({ type: 'success', title: '歌曲已删除' });
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: lyricSongsQueryKey });
    },
    onError: (error) => handleApiError(error, '删除歌曲失败'),
  });

  const exportMutation = useMutation({
    mutationFn: exportLyricSongs,
    onSuccess: (document) => {
      downloadJsonFile('lyric-songs.json', document);
      toast.add({ type: 'success', title: '已导出歌曲' });
    },
    onError: (error) => handleApiError(error, '导出歌曲失败'),
  });

  const importMutation = useMutation({
    mutationFn: importLyricSongsFromJsonFile,
    onSuccess: async (result) => {
      toast.add({
        type: 'success',
        title: '导入完成',
        description: `新建 ${result.created} 首，跳过 ${result.skipped} 首，失败 ${result.failed} 首`,
      });
      setImporting(false);
      await queryClient.invalidateQueries({ queryKey: lyricSongsQueryKey });
    },
    onError: (error) => handleApiError(error, '导入歌曲失败'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">歌曲</h1>
          <p className="text-sm text-muted-foreground">
            管理你的日语歌词卡片，导入导出使用 JSON 文件。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setCreating(true)}>
            新建
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setImporting(true)}
          >
            导入
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => exportMutation.mutate()}
          >
            导出
          </Button>
        </div>
      </div>
      {listQuery.isError ? (
        <ErrorAlert title="无法加载歌曲" description="请稍后重试。" />
      ) : null}
      {listQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {listQuery.data.map((song) => (
            <LyricSongCardComponent
              key={song.id}
              song={song}
              onOpen={(item) =>
                navigate({
                  to: '/jp-lyrics/$songId',
                  params: { songId: item.id },
                })
              }
              onEdit={(item) =>
                navigate({
                  to: '/jp-lyrics/$songId/edit',
                  params: { songId: item.id },
                })
              }
              onDelete={setDeleting}
            />
          ))}
        </div>
      ) : listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">正在加载歌曲…</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          还没有歌曲。可以新建一首，或导入之前导出的 JSON。
        </p>
      )}
      <LyricSongInfoDialogComponent
        open={creating}
        pending={createMutation.isPending}
        mode="create"
        onOpenChange={setCreating}
        onSubmit={(values: CreateLyricSongValues) =>
          createMutation.mutate(values)
        }
      />
      <LyricSongImportDialogComponent
        open={importing}
        pending={importMutation.isPending}
        onOpenChange={setImporting}
        onSubmit={(file) => importMutation.mutate(file)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title="删除这首歌？"
        description={
          deleting ? `将删除「${deleting.title}」及其全部歌词行。` : undefined
        }
        confirmLabel="删除"
        variant="destructive"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id);
          }
        }}
      />
    </div>
  );
}
