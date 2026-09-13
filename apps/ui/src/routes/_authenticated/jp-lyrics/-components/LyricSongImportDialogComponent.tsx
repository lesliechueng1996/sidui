import { useRef, useState } from 'react';
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

type LyricSongImportDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => void;
};

export function LyricSongImportDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: LyricSongImportDialogComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFileName('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导入歌曲</DialogTitle>
          <DialogDescription>
            上传此前导出的 JSON
            文件。已存在相同日文歌名的歌曲会被跳过，不会覆盖。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="lyric-song-import-file">JSON 文件</Label>
          <Input
            id="lyric-song-import-file"
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? '');
            }}
          />
          {fileName ? (
            <p className="text-sm text-muted-foreground">已选择：{fileName}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={pending || fileName.length === 0}
            onClick={() => {
              const file = inputRef.current?.files?.[0];
              if (file) {
                onSubmit(file);
              }
            }}
          >
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
