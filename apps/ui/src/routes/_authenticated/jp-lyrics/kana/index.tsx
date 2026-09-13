import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { KanaChartComponent } from '../-components/KanaChartComponent';
import {
  DAKUTEN_ROWS,
  GOJUON_ROWS,
  HANDAKUTEN_ROWS,
  type KanaCell,
  kanaCellKey,
  YOON_ROWS,
} from '../-lib/kana-chart';

export const Route = createFileRoute('/_authenticated/jp-lyrics/kana/')({
  component: KanaChartPageComponent,
});

function KanaChartPageComponent() {
  const [showRomaji, setShowRomaji] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handleSelect = (cell: KanaCell) => {
    setSelectedKey(kanaCellKey(cell));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">五十音图</h1>
        <p className="text-sm text-muted-foreground">
          平假名和片假名对照。点击格子可同时高亮这一对假名。
        </p>
      </div>
      <KanaChartComponent
        title="清音"
        rows={GOJUON_ROWS}
        showRomaji={showRomaji}
        selectedKey={selectedKey}
        onToggleRomaji={setShowRomaji}
        onSelect={handleSelect}
      />
      <KanaChartComponent
        title="浊音"
        rows={DAKUTEN_ROWS}
        showRomaji={showRomaji}
        selectedKey={selectedKey}
        onToggleRomaji={setShowRomaji}
        onSelect={handleSelect}
      />
      <KanaChartComponent
        title="半浊音"
        rows={HANDAKUTEN_ROWS}
        showRomaji={showRomaji}
        selectedKey={selectedKey}
        onToggleRomaji={setShowRomaji}
        onSelect={handleSelect}
      />
      <KanaChartComponent
        title="拗音"
        rows={YOON_ROWS}
        showRomaji={showRomaji}
        selectedKey={selectedKey}
        onToggleRomaji={setShowRomaji}
        onSelect={handleSelect}
      />
    </div>
  );
}
