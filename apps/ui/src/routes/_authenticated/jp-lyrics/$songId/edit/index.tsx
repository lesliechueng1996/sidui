import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import ErrorAlert from '#/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import {
  type CreateLyricSongValues,
  getLyricSong,
  getLyricSongBaseInfoFromAi,
  lyricSongDetailQueryKey,
  lyricSongsQueryKey,
  replaceLyricLines,
  updateLyricSong,
} from '@/lib/api/lyric-songs-api';
import { handleApiError } from '@/lib/api-client';
import { LyricLineFormComponent } from '../../-components/LyricLineFormComponent';
import { LyricSongInfoDialogComponent } from '../../-components/LyricSongInfoDialogComponent';
import type { LyricColorToken } from '../../-lib/lyric';
import {
  areDraftLinesValid,
  bulkPasteJapanese,
  createEmptyDraftLine,
  draftLinesFromSong,
  duplicateDraftLine,
  type LyricDraftLine,
  moveDraftLine,
  paintDraftSegments,
  selectSegmentRange,
  toReplaceLyricLines,
  updateDraftSource,
} from '../../-lib/lyric-editor';

export const Route = createFileRoute('/_authenticated/jp-lyrics/$songId/edit/')(
  {
    component: LyricSongEditComponent,
  },
);

function LyricSongEditComponent() {
  const { songId } = Route.useParams();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<LyricDraftLine[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [editingInfo, setEditingInfo] = useState(false);
  const [selection, setSelection] = useState<{
    key: string;
    start: number;
    end: number;
  } | null>(null);

  const detailQuery = useQuery({
    queryKey: lyricSongDetailQueryKey(songId),
    queryFn: () => getLyricSong(songId),
  });

  useEffect(() => {
    if (detailQuery.data) {
      setLines(draftLinesFromSong(detailQuery.data));
      setSelection(null);
    }
  }, [detailQuery.data]);

  const canSave = useMemo(() => areDraftLinesValid(lines), [lines]);

  const lookupBaseInfoMutation = useMutation({
    mutationFn: getLyricSongBaseInfoFromAi,
    onError: (error) => handleApiError(error, '获取歌曲资料失败'),
  });

  const infoMutation = useMutation({
    mutationFn: (values: CreateLyricSongValues) =>
      updateLyricSong(songId, values),
    onSuccess: async () => {
      toast.add({ type: 'success', title: '歌曲信息已保存' });
      setEditingInfo(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: lyricSongDetailQueryKey(songId),
        }),
        queryClient.invalidateQueries({ queryKey: lyricSongsQueryKey }),
      ]);
    },
    onError: (error) => handleApiError(error, '更新歌曲失败'),
  });

  const saveMutation = useMutation({
    mutationFn: () => replaceLyricLines(songId, toReplaceLyricLines(lines)),
    onSuccess: async () => {
      toast.add({ type: 'success', title: '歌词已保存' });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: lyricSongDetailQueryKey(songId),
        }),
        queryClient.invalidateQueries({ queryKey: lyricSongsQueryKey }),
      ]);
    },
    onError: (error) => handleApiError(error, '保存歌词失败'),
  });

  const updateLine = (key: string, next: LyricDraftLine) => {
    setLines((current) =>
      current.map((line) => (line.key === key ? next : line)),
    );
  };

  const handleSourceChange = (
    line: LyricDraftLine,
    field: 'japanese' | 'kana',
    value: string,
  ) => {
    updateLine(line.key, updateDraftSource(line, field, value));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {detailQuery.data?.title ?? '编辑歌词'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {detailQuery.data?.meaning ??
              '用 / 对齐日语和假名，再填写中文和时间戳。'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditingInfo(true)}
          >
            编辑信息
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link to="/jp-lyrics/$songId" params={{ songId }} />}
            nativeButton={false}
          >
            返回浏览
          </Button>
          <Button
            type="button"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            保存
          </Button>
        </div>
      </div>
      {detailQuery.isError ? (
        <ErrorAlert
          title="无法加载歌曲"
          description="这首歌不存在或无法访问。"
        />
      ) : null}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="lyric-bulk-paste">
          批量粘贴日语
        </label>
        <Textarea
          id="lyric-bulk-paste"
          value={pasteText}
          placeholder="每行一句日语，假名和中文先留空"
          onChange={(event) => setPasteText(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={pasteText.trim().length === 0}
          onClick={() => {
            setLines((current) => [
              ...current,
              ...bulkPasteJapanese(pasteText),
            ]);
            setPasteText('');
          }}
        >
          插入这些行
        </Button>
      </div>
      <div className="space-y-4">
        {lines.map((line, index) => (
          <LyricLineFormComponent
            key={line.key}
            line={line}
            index={index}
            canMoveUp={index > 0}
            canMoveDown={index < lines.length - 1}
            selectedStart={selection?.key === line.key ? selection.start : null}
            selectedEnd={selection?.key === line.key ? selection.end : null}
            onChange={(next) => {
              if (next.japanese !== line.japanese) {
                handleSourceChange(line, 'japanese', next.japanese);
                return;
              }
              if (next.kana !== line.kana) {
                handleSourceChange(line, 'kana', next.kana);
                return;
              }
              updateLine(line.key, next);
            }}
            onSelectSegment={(segmentIndex) => {
              setSelection((current) => ({
                key: line.key,
                ...(current?.key === line.key
                  ? selectSegmentRange(current, segmentIndex)
                  : { start: segmentIndex, end: segmentIndex }),
              }));
            }}
            onPaint={(color: LyricColorToken | null) => {
              if (!selection || selection.key !== line.key) {
                return;
              }
              updateLine(
                line.key,
                paintDraftSegments(line, selection.start, selection.end, color),
              );
            }}
            onMove={(direction) => {
              setLines((current) =>
                moveDraftLine(current, index, index + direction),
              );
            }}
            onCopy={() => {
              setLines((current) => [...current, duplicateDraftLine(line)]);
            }}
            onRemove={() => {
              setLines((current) =>
                current.filter((item) => item.key !== line.key),
              );
              if (selection?.key === line.key) {
                setSelection(null);
              }
            }}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setLines((current) => [...current, createEmptyDraftLine()])
        }
      >
        添加一行
      </Button>
      <LyricSongInfoDialogComponent
        open={editingInfo}
        pending={infoMutation.isPending}
        mode="edit"
        lookupPending={lookupBaseInfoMutation.isPending}
        onLookup={(title) => lookupBaseInfoMutation.mutateAsync(title)}
        initial={
          detailQuery.data
            ? {
                title: detailQuery.data.title,
                meaning: detailQuery.data.meaning,
                artist: detailQuery.data.artist,
                durationSeconds: detailQuery.data.durationSeconds,
              }
            : null
        }
        onOpenChange={setEditingInfo}
        onSubmit={(values) => infoMutation.mutate(values)}
      />
    </div>
  );
}
