export class LyricSong {
  title: string;
  meaning: string = '';
  artist: string = '';
  durationSeconds: number = 0;

  constructor(title: string) {
    this.title = title.trim();
  }
}
