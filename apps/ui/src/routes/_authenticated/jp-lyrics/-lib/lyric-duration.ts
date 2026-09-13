export const MIN_LYRIC_DURATION_SECONDS = 10;

export const lyricDurationSecondsFromParts = (
  minutesText: string,
  secondsText: string,
): number | null => {
  const minutes = minutesText.trim() === '' ? 0 : Number(minutesText);
  const seconds = secondsText.trim() === '' ? 0 : Number(secondsText);
  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    minutes < 0 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return minutes * 60 + seconds;
};

export const lyricDurationPartsFromSeconds = (
  total: number | null,
): { minutes: string; seconds: string } => {
  if (total === null || total < 0) {
    return { minutes: '', seconds: '' };
  }

  return {
    minutes: String(Math.floor(total / 60)),
    seconds: String(total % 60),
  };
};

export const isLyricDurationValid = (total: number | null): total is number =>
  total !== null &&
  Number.isInteger(total) &&
  total >= MIN_LYRIC_DURATION_SECONDS;

export const formatLyricDurationLabel = (total: number | null): string => {
  if (total === null) {
    return '未填写时长';
  }

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
};
