import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LyricColorToken } from '../-lib/lyric';
import {
  inspectDraftLine,
  type LyricDraftLine,
  parseDraftLineSegments,
} from '../-lib/lyric-editor';
import { LyricColorPaletteComponent } from './LyricColorPaletteComponent';
import { LyricSegmentChipsComponent } from './LyricSegmentChipsComponent';

type LyricLineFormComponentProps = {
  line: LyricDraftLine;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selectedStart: number | null;
  selectedEnd: number | null;
  onChange: (line: LyricDraftLine) => void;
  onSelectSegment: (index: number) => void;
  onPaint: (color: LyricColorToken | null) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
};

export function LyricLineFormComponent({
  line,
  index,
  canMoveUp,
  canMoveDown,
  selectedStart,
  selectedEnd,
  onChange,
  onSelectSegment,
  onPaint,
  onMove,
  onRemove,
}: LyricLineFormComponentProps) {
  const issue = inspectDraftLine(line);
  const { segments } = parseDraftLineSegments(line);

  return (
    <article className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">第 {index + 1} 行</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
          >
            上移
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
          >
            下移
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            删除行
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`lyric-jp-${line.key}`}>日语歌词</Label>
          <Textarea
            id={`lyric-jp-${line.key}`}
            value={line.japanese}
            placeholder="用 / 分段，例如：君の / 名は"
            onChange={(event) =>
              onChange({ ...line, japanese: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lyric-kana-${line.key}`}>假名</Label>
          <Textarea
            id={`lyric-kana-${line.key}`}
            value={line.kana}
            placeholder="用 / 分段，例如：きみの / なは"
            onChange={(event) =>
              onChange({ ...line, kana: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lyric-meaning-${line.key}`}>中文意思</Label>
          <Textarea
            id={`lyric-meaning-${line.key}`}
            value={line.meaning}
            placeholder="整句中文"
            onChange={(event) =>
              onChange({ ...line, meaning: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lyric-time-${line.key}`}>时间戳</Label>
          <Input
            id={`lyric-time-${line.key}`}
            value={line.startMsText}
            placeholder="m:ss.cc，可空"
            onChange={(event) =>
              onChange({ ...line, startMsText: event.target.value })
            }
          />
        </div>
      </div>
      {issue.error ? (
        <p className="text-sm text-destructive">{issue.error}</p>
      ) : null}
      {issue.timestampError ? (
        <p className="text-sm text-destructive">{issue.timestampError}</p>
      ) : null}
      {segments.length > 0 ? (
        <div className="space-y-3">
          <LyricSegmentChipsComponent
            label="日语分段"
            field="text"
            segments={segments}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            onSelect={onSelectSegment}
          />
          <LyricSegmentChipsComponent
            label="假名分段"
            field="kana"
            segments={segments}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            onSelect={onSelectSegment}
          />
          <LyricColorPaletteComponent
            disabled={selectedStart === null}
            onPaint={onPaint}
          />
        </div>
      ) : null}
    </article>
  );
}
