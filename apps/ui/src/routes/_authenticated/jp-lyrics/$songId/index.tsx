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
  lyricClockDurationMs,
  parseLyricTimestamp,
  snapToNearestTimedLineMs,
} from '../-lib/lyric';
import {
  applyManualTimestamp,
  markNextUntimedLine,
  undoMarkedLine,
} from '../-lib/lyric-mark';

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
  const [undoStack, setUndoStack] = useState<number[]>([]);
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

  const durationMs = useMemo(() => lyricClockDurationMs(lines), [lines]);
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

  const handleMark = () => {
    const result = markNextUntimedLine(lines, Math.round(currentMs));
    if (result.markedIndex === null) {
      toast.add({ type: 'info', title: '已全部标记' });
      return;
    }

    setLines(result.lines);
    setUndoStack((stack) => [...stack, result.markedIndex as number]);
    const marked = result.lines[result.markedIndex];
    if (marked) {
      persistLine(marked);
    }
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

  const handleUndo = () => {
    const result = undoMarkedLine(lines, undoStack);
    const undoneIndex = undoStack.at(-1);
    setLines(result.lines);
    setUndoStack(result.stack);
    if (undoneIndex !== undefined) {
      const line = result.lines[undoneIndex];
      if (line) {
        persistLine(line);
      }
    }
  };

  useEffect(() => {
    if (currentIndex === null) {
      return;
    }
    const node = document.querySelector('[data-current="true"]');
    if (
      node instanceof HTMLElement &&
      typeof node.scrollIntoView === 'function'
    ) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [currentIndex]);

  if (detailQuery.isError) {
    return (
      <ErrorAlert title="无法打开歌曲" description="这首歌不存在或无法访问。" />
    );
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        render={<Link to="/jp-lyrics/$songId/edit" params={{ songId }} />}
        nativeButton={false}
      >
        编辑
      </Button>
      <LyricBrowseViewComponent
        title={detailQuery.data?.title ?? ''}
        meaning={detailQuery.data?.meaning ?? ''}
        artist={detailQuery.data?.artist ?? null}
        lines={lines}
        currentMs={currentMs}
        durationMs={durationMs}
        currentIndex={currentIndex}
        playing={playing}
        marking={marking}
        canUndo={undoStack.length > 0}
        onPlayPause={() => setPlaying((value) => !value)}
        onStartMarking={() => {
          setCurrentMs(0);
          setPlaying(true);
          setMarking(true);
          setUndoStack([]);
        }}
        onMark={handleMark}
        onUndo={handleUndo}
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
