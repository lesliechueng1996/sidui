export const findNextUntimedLineIndex = (
  lines: Array<{ startMs: number | null }>,
): number | null => {
  const index = lines.findIndex((line) => line.startMs === null);
  return index === -1 ? null : index;
};

export const markNextUntimedLine = <T extends { startMs: number | null }>(
  lines: T[],
  currentMs: number,
): { lines: T[]; markedIndex: number | null } => {
  const markedIndex = findNextUntimedLineIndex(lines);
  if (markedIndex === null) {
    return { lines, markedIndex: null };
  }

  return {
    lines: lines.map((line, index) =>
      index === markedIndex ? { ...line, startMs: currentMs } : line,
    ),
    markedIndex,
  };
};

export const applyManualTimestamp = <T extends { startMs: number | null }>(
  lines: T[],
  lineIndex: number,
  startMs: number | null,
): T[] =>
  lines.map((line, index) =>
    index === lineIndex ? { ...line, startMs } : line,
  );
