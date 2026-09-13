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

type LyricSongCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateLyricSongValues) => void;
};

export function LyricSongCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: LyricSongCreateDialogComponentProps) {
  const [title, setTitle] = useState('');
  const [meaning, setMeaning] = useState('');
  const [artist, setArtist] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setMeaning('');
      setArtist('');
    }
  }, [open]);

  const canSubmit = title.trim().length > 0 && meaning.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建歌曲</DialogTitle>
          <DialogDescription>
            填写日文歌名和中文歌名，歌手可以稍后补充。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lyric-song-title">歌曲名</Label>
            <Input
              id="lyric-song-title"
              value={title}
              placeholder="日文歌名"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lyric-song-meaning">中文歌名</Label>
            <Input
              id="lyric-song-meaning"
              value={meaning}
              placeholder="中文歌名"
              onChange={(event) => setMeaning(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lyric-song-artist">歌手</Label>
            <Input
              id="lyric-song-artist"
              value={artist}
              placeholder="可选"
              onChange={(event) => setArtist(event.target.value)}
            />
          </div>
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
            onClick={() =>
              onSubmit({
                title: title.trim(),
                meaning: meaning.trim(),
                artist: artist.trim() ? artist.trim() : null,
              })
            }
          >
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
