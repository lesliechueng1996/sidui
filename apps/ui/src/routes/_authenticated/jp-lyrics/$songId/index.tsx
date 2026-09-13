import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import ErrorAlert from '#/components/ErrorAlert';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  getLyricSong,
  lyricSongDetailQueryKey,
  updateLyricLineTimings,
} from '@/lib/api/lyric-songs-api';
import { handleApiError } from '@/lib/api-client';
import {
  type LyricBrowseLine,
  LyricBrowseViewComponent,
} from '../-components/LyricBrowseViewComponent';
import {
  findCurrentLyricLineIndex,
  isLyricColorToken,
  type LyricSegment,
  parseLyricTimestamp,
  snapToNearestTimedLineMs,
} from '../-lib/lyric';
import { isLyricDurationValid } from '../-lib/lyric-duration';
import { applyManualTimestamp, markNextUntimedLine } from '../-lib/lyric-mark';

export const Route = createFileRoute('/_authenticated/jp-lyrics/$songId/')({
  component: LyricSongBrowseComponent,
});

function toBrowseLines(
  lines: Array<{
    id: string;
    segments: LyricSegment[];
    meaning: string | null;
    startMs: number | null;
  }>,
): LyricBrowseLine[] {
  return lines.map((line) => ({
    id: line.id,
    segments: line.segments.map((segment) => ({
      text: segment.text,
      kana: segment.kana,
      color:
        segment.color && isLyricColorToken(segment.color)
          ? segment.color
          : null,
    })),
    meaning: line.meaning,
    startMs: line.startMs,
  }));
}

function LyricSongBrowseComponent() {
  const { songId } = Route.useParams();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<LyricBrowseLine[]>([]);
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [marking, setMarking] = useState(false);
  const [playMode, setPlayMode] = useState(false);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const detailQuery = useQuery({
    queryKey: lyricSongDetailQueryKey(songId),
    queryFn: () => getLyricSong(songId),
  });

  useEffect(() => {
    if (detailQuery.data) {
      setLines(toBrowseLines(detailQuery.data.lines));
    }
  }, [detailQuery.data]);

  const clockEnabled = isLyricDurationValid(
    detailQuery.data?.durationSeconds ?? null,
  );
  const durationMs = clockEnabled
    ? (detailQuery.data?.durationSeconds ?? 0) * 1000
    : 0;
  const currentIndex = useMemo(
    () => findCurrentLyricLineIndex(lines, currentMs),
    [lines, currentMs],
  );

  const timingsMutation = useMutation({
    mutationFn: (timings: Array<{ lineId: string; startMs: number | null }>) =>
      updateLyricLineTimings(songId, timings),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: lyricSongDetailQueryKey(songId),
      });
    },
    onError: (error) => handleApiError(error, '更新时间戳失败'),
  });

  useEffect(() => {
    if (!playing) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTickRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const last = lastTickRef.current ?? now;
      const elapsed = now - last;
      lastTickRef.current = now;
      setCurrentMs((value) => {
        const next = value + elapsed;
        if (durationMs > 0 && next >= durationMs) {
          setPlaying(false);
          return durationMs;
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [playing, durationMs]);

  const persistLine = (line: LyricBrowseLine) => {
    timingsMutation.mutate([{ lineId: line.id, startMs: line.startMs }]);
  };

  const persistMarkedLine = (next: LyricBrowseLine[], index: number) => {
    setLines(next);
    const marked = next[index];
    if (marked) {
      persistLine(marked);
    }
  };

  const handleMark = () => {
    const result = markNextUntimedLine(lines, Math.round(currentMs));
    if (result.markedIndex === null) {
      toast.add({ type: 'info', title: '已全部标记' });
      return;
    }

    persistMarkedLine(result.lines, result.markedIndex);
  };

  const handleMarkLine = (lineId: string) => {
    const index = lines.findIndex((line) => line.id === lineId);
    if (index === -1) {
      return;
    }

    persistMarkedLine(
      applyManualTimestamp(lines, index, Math.round(currentMs)),
      index,
    );
  };

  const handleJumpToLine = (lineId: string) => {
    if (!playMode || !clockEnabled) {
      return;
    }
    const line = lines.find((item) => item.id === lineId);
    if (!line) {
      return;
    }
    if (line.startMs === null) {
      toast.add({ type: 'info', title: '这一行还没有时间戳' });
      return;
    }
    setCurrentMs(Math.min(line.startMs, durationMs));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !marking) {
        return;
      }
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      event.preventDefault();
      handleMark();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    if (!playMode || currentIndex === null) {
      return;
    }
    const list = document.querySelector('[aria-label="歌词列表"]');
    const node = list?.querySelector('[data-current="true"]');
    if (!(list instanceof HTMLElement) || !(node instanceof HTMLElement)) {
      return;
    }
    const listRect = list.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    list.scrollTop +=
      nodeRect.top - listRect.top - listRect.height / 2 + nodeRect.height / 2;
  }, [currentIndex, playMode]);

  if (detailQuery.isError) {
    return (
      <ErrorAlert title="无法打开歌曲" description="这首歌不存在或无法访问。" />
    );
  }

  return (
    <div className="flex h-[calc(100svh-6.5rem)] min-h-0 flex-col gap-4 overflow-hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 self-start"
        render={<Link to="/jp-lyrics/$songId/edit" params={{ songId }} />}
        nativeButton={false}
      >
        编辑
      </Button>
      {detailQuery.data && !clockEnabled ? (
        <div className="shrink-0">
          <ErrorAlert
            title="还没有填写歌曲时长"
            description="请先到编辑页补充歌曲信息，再播放或标记。"
          />
        </div>
      ) : null}
      <LyricBrowseViewComponent
        title={detailQuery.data?.title ?? ''}
        meaning={detailQuery.data?.meaning ?? ''}
        artist={detailQuery.data?.artist ?? null}
        lines={lines}
        currentMs={currentMs}
        durationMs={durationMs}
        currentIndex={currentIndex}
        playing={playing}
        playMode={playMode}
        clockEnabled={clockEnabled}
        onPlayModeChange={setPlayMode}
        onPlayPause={() => {
          if (!clockEnabled) {
            return;
          }
          setPlaying((value) => !value);
        }}
        onStartMarking={() => {
          if (!clockEnabled) {
            return;
          }
          setCurrentMs(0);
          setPlaying(true);
          setMarking(true);
        }}
        onMarkLine={handleMarkLine}
        onJumpToLine={handleJumpToLine}
        onSeek={(ms) => {
          setPlaying(false);
          setCurrentMs(ms);
        }}
        onSeekEnd={(ms) => {
          setPlaying(false);
          setCurrentMs(snapToNearestTimedLineMs(lines, ms));
        }}
        onEditTimestamp={(lineId, text) => {
          const trimmed = text.trim();
          if (trimmed.length > 0 && parseLyricTimestamp(trimmed) === null) {
            return;
          }
          const startMs = parseLyricTimestamp(text);
          const index = lines.findIndex((line) => line.id === lineId);
          if (index === -1) {
            return;
          }
          const next = applyManualTimestamp(lines, index, startMs);
          setLines(next);
          const line = next[index];
          if (line) {
            persistLine(line);
          }
        }}
      />
    </div>
  );
}
