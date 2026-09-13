import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateLyricSongValues } from '@/lib/api/lyric-songs-api';
import {
  isLyricDurationValid,
  lyricDurationPartsFromSeconds,
  lyricDurationSecondsFromParts,
} from '../-lib/lyric-duration';

type LyricSongInfoDialogComponentProps = {
  open: boolean;
  pending: boolean;
  mode: 'create' | 'edit';
  initial?: {
    title: string;
    meaning: string;
    artist: string | null;
    durationSeconds: number | null;
  } | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateLyricSongValues) => void;
};

export function LyricSongInfoDialogComponent({
  open,
  pending,
  mode,
  initial,
  onOpenChange,
  onSubmit,
}: LyricSongInfoDialogComponentProps) {
  const [title, setTitle] = useState('');
  const [meaning, setMeaning] = useState('');
  const [artist, setArtist] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(initial?.title ?? '');
    setMeaning(initial?.meaning ?? '');
    setArtist(initial?.artist ?? '');
    const parts = lyricDurationPartsFromSeconds(
      initial?.durationSeconds ?? null,
    );
    setMinutes(parts.minutes);
    setSeconds(parts.seconds);
  }, [
    open,
    initial?.title,
    initial?.meaning,
    initial?.artist,
    initial?.durationSeconds,
  ]);

  const durationSeconds = lyricDurationSecondsFromParts(minutes, seconds);
  const canSubmit =
    title.trim().length > 0 &&
    meaning.trim().length > 0 &&
    isLyricDurationValid(durationSeconds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建歌曲' : '编辑歌曲信息'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '填写歌名、中文歌名和时长。歌手可以稍后补充。'
              : '修改歌名、中文歌名、歌手和时长。'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lyric-song-title">歌曲名</Label>
            <Input
              id="lyric-song-title"
              value={title}
              placeholder="日文歌名"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lyric-song-meaning">中文歌名</Label>
            <Input
              id="lyric-song-meaning"
              value={meaning}
              placeholder="中文歌名"
              onChange={(event) => setMeaning(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lyric-song-artist">歌手</Label>
            <Input
              id="lyric-song-artist"
              value={artist}
              placeholder="可选"
              onChange={(event) => setArtist(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lyric-song-minutes">时长（分）</Label>
              <Input
                id="lyric-song-minutes"
                inputMode="numeric"
                value={minutes}
                placeholder="0"
                onChange={(event) => setMinutes(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lyric-song-seconds">时长（秒）</Label>
              <Input
                id="lyric-song-seconds"
                inputMode="numeric"
                value={seconds}
                placeholder="0"
                onChange={(event) => setSeconds(event.target.value)}
              />
            </div>
          </div>
          {durationSeconds !== null &&
          !isLyricDurationValid(durationSeconds) ? (
            <p className="text-sm text-destructive">歌曲时长须至少 10 秒</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={pending || !canSubmit}
            onClick={() => {
              if (!isLyricDurationValid(durationSeconds)) {
                return;
              }
              onSubmit({
                title: title.trim(),
                meaning: meaning.trim(),
                artist: artist.trim() ? artist.trim() : null,
                durationSeconds,
              });
            }}
          >
            {mode === 'create' ? '创建' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
