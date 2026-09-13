import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  formatLyricTimestamp,
  type LyricSegment,
  nextLyricSegmentKey,
} from '../-lib/lyric';
import { lyricColorClassName } from '../-lib/lyric-colors';

export type LyricBrowseLine = {
  id: string;
  segments: LyricSegment[];
  meaning: string | null;
  startMs: number | null;
};

type LyricBrowseViewComponentProps = {
  title: string;
  meaning: string;
  artist: string | null;
  lines: LyricBrowseLine[];
  currentMs: number;
  durationMs: number;
  currentIndex: number | null;
  playing: boolean;
  playMode: boolean;
  clockEnabled: boolean;
  onPlayModeChange: (playMode: boolean) => void;
  onPlayPause: () => void;
  onStartMarking: () => void;
  onMarkLine: (lineId: string) => void;
  onJumpToLine: (lineId: string) => void;
  onSeek: (ms: number) => void;
  onSeekEnd: (ms: number) => void;
  onEditTimestamp: (lineId: string, text: string) => void;
};

const lyricBodyClassName =
  'flex min-w-0 flex-1 flex-col items-start gap-1 text-left';

const renderLineSegments = (
  lineId: string,
  kind: 'kana' | 'jp',
  segments: LyricSegment[],
) => {
  const seen = new Map<string, number>();
  const field = kind === 'kana' ? 'kana' : 'text';
  return segments.map((segment) => (
    <span
      key={nextLyricSegmentKey(seen, `${lineId}-${kind}`, segment)}
      className={lyricColorClassName(segment.color, 'first:pl-0')}
    >
      {segment[field]}
    </span>
  ));
};

const LyricBrowseLineBody = ({ line }: { line: LyricBrowseLine }) => (
  <>
    <p className="flex flex-wrap items-baseline gap-x-2 tracking-wide text-muted-foreground">
      {renderLineSegments(line.id, 'kana', line.segments)}
    </p>
    <p className="flex flex-wrap items-baseline gap-x-2 text-lg tracking-wide">
      {renderLineSegments(line.id, 'jp', line.segments)}
    </p>
    <p className="text-sm text-muted-foreground">
      {line.meaning ?? '（无中文意思）'}
    </p>
  </>
);

export function LyricBrowseViewComponent({
  title,
  meaning,
  artist,
  lines,
  currentMs,
  durationMs,
  currentIndex,
  playing,
  playMode,
  clockEnabled,
  onPlayModeChange,
  onPlayPause,
  onStartMarking,
  onMarkLine,
  onJumpToLine,
  onSeek,
  onSeekEnd,
  onEditTimestamp,
}: LyricBrowseViewComponentProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <header className="shrink-0 space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{meaning}</p>
        {artist ? (
          <p className="text-sm text-muted-foreground">{artist}</p>
        ) : null}
      </header>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Button type="button" disabled={!clockEnabled} onClick={onPlayPause}>
          {playing ? '暂停' : '播放'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!clockEnabled}
          onClick={onStartMarking}
        >
          开始
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn(!playMode && 'font-medium')}>标记</span>
          <Switch
            checked={playMode}
            disabled={!clockEnabled}
            onCheckedChange={(checked) => onPlayModeChange(checked === true)}
            aria-label="播放模式"
          />
          <span className={cn(playMode && 'font-medium')}>播放</span>
        </div>
        <p className="self-center text-sm text-muted-foreground">
          {formatLyricTimestamp(currentMs)}
          {currentIndex === null
            ? ' · 当前没有对应行'
            : ` · 第 ${currentIndex + 1} 行`}
        </p>
      </div>
      <label className="block shrink-0 space-y-2 text-sm">
        进度
        <input
          aria-label="歌词进度"
          type="range"
          min={0}
          max={Math.max(durationMs, 1)}
          value={Math.min(currentMs, Math.max(durationMs, 1))}
          disabled={!clockEnabled}
          className="w-full"
          onChange={(event) => onSeek(Number(event.target.value))}
          onPointerUp={(event) =>
            onSeekEnd(Number((event.target as HTMLInputElement).value))
          }
        />
      </label>
      <section
        aria-label="歌词列表"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <ol className="space-y-4">
          {lines.map((line, index) => (
            <li
              key={line.id}
              data-current={currentIndex === index ? 'true' : 'false'}
              className={cn(
                'flex items-stretch gap-3 rounded-xl border p-4',
                currentIndex === index
                  ? 'border-primary bg-primary/5'
                  : 'border-border',
              )}
            >
              {playMode && clockEnabled ? (
                <button
                  type="button"
                  className={cn(
                    lyricBodyClassName,
                    'cursor-pointer border-0 bg-transparent p-0 text-inherit',
                  )}
                  aria-label={`跳转到第 ${index + 1} 行`}
                  onClick={() => onJumpToLine(line.id)}
                >
                  <LyricBrowseLineBody line={line} />
                </button>
              ) : (
                <div className={lyricBodyClassName}>
                  <LyricBrowseLineBody line={line} />
                </div>
              )}
              <div className="flex w-28 shrink-0 flex-col items-end justify-between gap-2">
                <Input
                  aria-label={`第 ${index + 1} 行时间戳`}
                  className="text-right"
                  value={
                    line.startMs === null
                      ? ''
                      : formatLyricTimestamp(line.startMs)
                  }
                  placeholder="m:ss.cc"
                  onChange={(event) =>
                    onEditTimestamp(line.id, event.target.value)
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`第 ${index + 1} 行标记`}
                  onClick={() => onMarkLine(line.id)}
                >
                  标记
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
