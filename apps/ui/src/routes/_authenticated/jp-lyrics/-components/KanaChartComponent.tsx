import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { type KanaCell, type KanaRow, kanaCellKey } from '../-lib/kana-chart';

type KanaChartComponentProps = {
  title: string;
  rows: KanaRow[];
  showRomaji: boolean;
  selectedKey: string | null;
  onToggleRomaji: (show: boolean) => void;
  onSelect: (cell: KanaCell) => void;
};

export function KanaChartComponent({
  title,
  rows,
  showRomaji,
  selectedKey,
  onToggleRomaji,
  onSelect,
}: KanaChartComponentProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">{title}</h2>
        <div className="flex items-center gap-2 text-sm">
          <Switch
            checked={showRomaji}
            onCheckedChange={(checked) => onToggleRomaji(checked)}
            aria-label={`显示${title}罗马音`}
          />
          罗马音
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-xl border-collapse text-center">
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th className="px-2 py-2 text-left text-sm text-muted-foreground">
                  {row.label}
                </th>
                {Object.entries(row.cells).map(([slot, item]) => (
                  <td key={`${row.id}-${slot}`} className="p-1">
                    {item ? (
                      <button
                        type="button"
                        className={cn(
                          'flex w-full min-w-16 flex-col items-center rounded-md border px-2 py-2 text-sm',
                          selectedKey === kanaCellKey(item)
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card',
                        )}
                        onClick={() => onSelect(item)}
                      >
                        <span className="text-lg">{item.hiragana}</span>
                        <span className="text-lg">{item.katakana}</span>
                        {showRomaji ? (
                          <span className="text-xs text-muted-foreground">
                            {item.romaji}
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      <span className="block min-h-16" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
