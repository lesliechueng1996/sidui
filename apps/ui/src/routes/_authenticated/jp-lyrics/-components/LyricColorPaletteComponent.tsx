import { Button } from '@/components/ui/button';
import { LYRIC_COLOR_TOKENS, type LyricColorToken } from '../-lib/lyric';
import { LYRIC_COLOR_LABELS, lyricColorClassName } from '../-lib/lyric-colors';

type LyricColorPaletteComponentProps = {
  disabled?: boolean;
  onPaint: (color: LyricColorToken | null) => void;
};

export function LyricColorPaletteComponent({
  disabled = false,
  onPaint,
}: LyricColorPaletteComponentProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {LYRIC_COLOR_TOKENS.map((token) => (
        <Button
          key={token}
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          className={lyricColorClassName(token)}
          onClick={() => onPaint(token)}
        >
          {LYRIC_COLOR_LABELS[token]}
        </Button>
      ))}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => onPaint(null)}
      >
        清除颜色
      </Button>
    </div>
  );
}
