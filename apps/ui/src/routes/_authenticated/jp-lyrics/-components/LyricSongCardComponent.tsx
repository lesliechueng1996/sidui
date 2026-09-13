import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { LyricSongListItem } from '@/lib/api/lyric-songs-api';

type LyricSongCardComponentProps = {
  song: LyricSongListItem;
  onOpen: (song: LyricSongListItem) => void;
  onEdit: (song: LyricSongListItem) => void;
  onDelete: (song: LyricSongListItem) => void;
};

export function LyricSongCardComponent({
  song,
  onOpen,
  onEdit,
  onDelete,
}: LyricSongCardComponentProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={() => onOpen(song)}
    >
      <CardHeader>
        <CardTitle>{song.title}</CardTitle>
        <CardDescription>{song.meaning}</CardDescription>
        <CardAction>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(song);
              }}
            >
              编辑
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(song);
              }}
            >
              删除
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>{song.artist ?? '未填写歌手'}</p>
        <p>{song.lineCount} 行</p>
      </CardContent>
    </Card>
  );
}
