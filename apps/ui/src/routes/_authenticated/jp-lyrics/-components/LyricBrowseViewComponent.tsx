import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatLyricTimestamp, type LyricSegment } from '../-lib/lyric';
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
  marking: boolean;
  canUndo: boolean;
  onPlayPause: () => void;
  onStartMarking: () => void;
  onMark: () => void;
  onUndo: () => void;
  onSeek: (ms: number) => void;
  onSeekEnd: (ms: number) => void;
  onEditTimestamp: (lineId: string, text: string) => void;
};

export function LyricBrowseViewComponent({
  title,
  meaning,
  artist,
  lines,
  currentMs,
  durationMs,
  currentIndex,
  playing,
  marking,
  canUndo,
  onPlayPause,
  onStartMarking,
  onMark,
  onUndo,
  onSeek,
  onSeekEnd,
  onEditTimestamp,
}: LyricBrowseViewComponentProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{meaning}</p>
        {artist ? (
          <p className="text-sm text-muted-foreground">{artist}</p>
        ) : null}
      </header>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onPlayPause}>
          {playing ? '暂停' : '播放'}
        </Button>
        <Button type="button" variant="outline" onClick={onStartMarking}>
          开始
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!marking}
          onClick={onMark}
        >
          标记
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!canUndo}
          onClick={onUndo}
        >
          撤销
        </Button>
        <p className="self-center text-sm text-muted-foreground">
          {formatLyricTimestamp(currentMs)}
          {currentIndex === null
            ? ' · 当前没有对应行'
            : ` · 第 ${currentIndex + 1} 行`}
        </p>
      </div>
      <label className="block space-y-2 text-sm">
        进度
        <input
          aria-label="歌词进度"
          type="range"
          min={0}
          max={Math.max(durationMs, 1)}
          value={Math.min(currentMs, Math.max(durationMs, 1))}
          className="w-full"
          onChange={(event) => onSeek(Number(event.target.value))}
          onPointerUp={(event) =>
            onSeekEnd(Number((event.target as HTMLInputElement).value))
          }
        />
      </label>
      <ol className="space-y-4">
        {lines.map((line, index) => (
          <li
            key={line.id}
            data-current={currentIndex === index ? 'true' : 'false'}
            className={cn(
              'rounded-xl border p-4',
              currentIndex === index
                ? 'border-primary bg-primary/5'
                : 'border-border',
            )}
          >
            <p className="text-lg tracking-wide">
              {line.segments.map((segment) => (
                <span
                  key={`${line.id}-jp-${segment.text}-${segment.kana}`}
                  className={lyricColorClassName(segment.color)}
                >
                  {segment.text}
                </span>
              ))}
            </p>
            <p className="text-muted-foreground">
              {line.segments.map((segment) => (
                <span
                  key={`${line.id}-kana-${segment.text}-${segment.kana}`}
                  className={lyricColorClassName(segment.color)}
                >
                  {segment.kana}
                </span>
              ))}
            </p>
            <p className="text-sm">{line.meaning ?? '（无中文意思）'}</p>
            <div className="mt-2 max-w-40">
              <Input
                aria-label={`第 ${index + 1} 行时间戳`}
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
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
