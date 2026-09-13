export type KanaCell = {
  hiragana: string;
  katakana: string;
  romaji: string;
};

export type KanaRow = {
  id: string;
  label: string;
  cells: Array<KanaCell | null>;
};

const cell = (
  hiragana: string,
  katakana: string,
  romaji: string,
): KanaCell => ({ hiragana, katakana, romaji });

export const GOJUON_ROWS: KanaRow[] = [
  {
    id: 'a',
    label: 'あ行',
    cells: [
      cell('あ', 'ア', 'a'),
      cell('い', 'イ', 'i'),
      cell('う', 'ウ', 'u'),
      cell('え', 'エ', 'e'),
      cell('お', 'オ', 'o'),
    ],
  },
  {
    id: 'ka',
    label: 'か行',
    cells: [
      cell('か', 'カ', 'ka'),
      cell('き', 'キ', 'ki'),
      cell('く', 'ク', 'ku'),
      cell('け', 'ケ', 'ke'),
      cell('こ', 'コ', 'ko'),
    ],
  },
  {
    id: 'sa',
    label: 'さ行',
    cells: [
      cell('さ', 'サ', 'sa'),
      cell('し', 'シ', 'shi'),
      cell('す', 'ス', 'su'),
      cell('せ', 'セ', 'se'),
      cell('そ', 'ソ', 'so'),
    ],
  },
  {
    id: 'ta',
    label: 'た行',
    cells: [
      cell('た', 'タ', 'ta'),
      cell('ち', 'チ', 'chi'),
      cell('つ', 'ツ', 'tsu'),
      cell('て', 'テ', 'te'),
      cell('と', 'ト', 'to'),
    ],
  },
  {
    id: 'na',
    label: 'な行',
    cells: [
      cell('な', 'ナ', 'na'),
      cell('に', 'ニ', 'ni'),
      cell('ぬ', 'ヌ', 'nu'),
      cell('ね', 'ネ', 'ne'),
      cell('の', 'ノ', 'no'),
    ],
  },
  {
    id: 'ha',
    label: 'は行',
    cells: [
      cell('は', 'ハ', 'ha'),
      cell('ひ', 'ヒ', 'hi'),
      cell('ふ', 'フ', 'fu'),
      cell('へ', 'ヘ', 'he'),
      cell('ほ', 'ホ', 'ho'),
    ],
  },
  {
    id: 'ma',
    label: 'ま行',
    cells: [
      cell('ま', 'マ', 'ma'),
      cell('み', 'ミ', 'mi'),
      cell('む', 'ム', 'mu'),
      cell('め', 'メ', 'me'),
      cell('も', 'モ', 'mo'),
    ],
  },
  {
    id: 'ya',
    label: 'や行',
    cells: [
      cell('や', 'ヤ', 'ya'),
      null,
      cell('ゆ', 'ユ', 'yu'),
      null,
      cell('よ', 'ヨ', 'yo'),
    ],
  },
  {
    id: 'ra',
    label: 'ら行',
    cells: [
      cell('ら', 'ラ', 'ra'),
      cell('り', 'リ', 'ri'),
      cell('る', 'ル', 'ru'),
      cell('れ', 'レ', 're'),
      cell('ろ', 'ロ', 'ro'),
    ],
  },
  {
    id: 'wa',
    label: 'わ行',
    cells: [cell('わ', 'ワ', 'wa'), null, null, null, cell('を', 'ヲ', 'wo')],
  },
  {
    id: 'n',
    label: 'ん',
    cells: [cell('ん', 'ン', 'n'), null, null, null, null],
  },
];

export const DAKUTEN_ROWS: KanaRow[] = [
  {
    id: 'ga',
    label: 'が行',
    cells: [
      cell('が', 'ガ', 'ga'),
      cell('ぎ', 'ギ', 'gi'),
      cell('ぐ', 'グ', 'gu'),
      cell('げ', 'ゲ', 'ge'),
      cell('ご', 'ゴ', 'go'),
    ],
  },
  {
    id: 'za',
    label: 'ざ行',
    cells: [
      cell('ざ', 'ザ', 'za'),
      cell('じ', 'ジ', 'ji'),
      cell('ず', 'ズ', 'zu'),
      cell('ぜ', 'ゼ', 'ze'),
      cell('ぞ', 'ゾ', 'zo'),
    ],
  },
  {
    id: 'da',
    label: 'だ行',
    cells: [
      cell('だ', 'ダ', 'da'),
      cell('ぢ', 'ヂ', 'ji'),
      cell('づ', 'ヅ', 'zu'),
      cell('で', 'デ', 'de'),
      cell('ど', 'ド', 'do'),
    ],
  },
  {
    id: 'ba',
    label: 'ば行',
    cells: [
      cell('ば', 'バ', 'ba'),
      cell('び', 'ビ', 'bi'),
      cell('ぶ', 'ブ', 'bu'),
      cell('べ', 'ベ', 'be'),
      cell('ぼ', 'ボ', 'bo'),
    ],
  },
];

export const HANDAKUTEN_ROWS: KanaRow[] = [
  {
    id: 'pa',
    label: 'ぱ行',
    cells: [
      cell('ぱ', 'パ', 'pa'),
      cell('ぴ', 'ピ', 'pi'),
      cell('ぷ', 'プ', 'pu'),
      cell('ぺ', 'ペ', 'pe'),
      cell('ぽ', 'ポ', 'po'),
    ],
  },
];

export const YOON_ROWS: KanaRow[] = [
  {
    id: 'kya',
    label: 'きゃ',
    cells: [
      cell('きゃ', 'キャ', 'kya'),
      cell('きゅ', 'キュ', 'kyu'),
      cell('きょ', 'キョ', 'kyo'),
    ],
  },
  {
    id: 'sha',
    label: 'しゃ',
    cells: [
      cell('しゃ', 'シャ', 'sha'),
      cell('しゅ', 'シュ', 'shu'),
      cell('しょ', 'ショ', 'sho'),
    ],
  },
  {
    id: 'cha',
    label: 'ちゃ',
    cells: [
      cell('ちゃ', 'チャ', 'cha'),
      cell('ちゅ', 'チュ', 'chu'),
      cell('ちょ', 'チョ', 'cho'),
    ],
  },
  {
    id: 'nya',
    label: 'にゃ',
    cells: [
      cell('にゃ', 'ニャ', 'nya'),
      cell('にゅ', 'ニュ', 'nyu'),
      cell('にょ', 'ニョ', 'nyo'),
    ],
  },
  {
    id: 'hya',
    label: 'ひゃ',
    cells: [
      cell('ひゃ', 'ヒャ', 'hya'),
      cell('ひゅ', 'ヒュ', 'hyu'),
      cell('ひょ', 'ヒョ', 'hyo'),
    ],
  },
  {
    id: 'mya',
    label: 'みゃ',
    cells: [
      cell('みゃ', 'ミャ', 'mya'),
      cell('みゅ', 'ミュ', 'myu'),
      cell('みょ', 'ミョ', 'myo'),
    ],
  },
  {
    id: 'rya',
    label: 'りゃ',
    cells: [
      cell('りゃ', 'リャ', 'rya'),
      cell('りゅ', 'リュ', 'ryu'),
      cell('りょ', 'リョ', 'ryo'),
    ],
  },
  {
    id: 'gya',
    label: 'ぎゃ',
    cells: [
      cell('ぎゃ', 'ギャ', 'gya'),
      cell('ぎゅ', 'ギュ', 'gyu'),
      cell('ぎょ', 'ギョ', 'gyo'),
    ],
  },
  {
    id: 'ja',
    label: 'じゃ',
    cells: [
      cell('じゃ', 'ジャ', 'ja'),
      cell('じゅ', 'ジュ', 'ju'),
      cell('じょ', 'ジョ', 'jo'),
    ],
  },
  {
    id: 'bya',
    label: 'びゃ',
    cells: [
      cell('びゃ', 'ビャ', 'bya'),
      cell('びゅ', 'ビュ', 'byu'),
      cell('びょ', 'ビョ', 'byo'),
    ],
  },
  {
    id: 'pya',
    label: 'ぴゃ',
    cells: [
      cell('ぴゃ', 'ピャ', 'pya'),
      cell('ぴゅ', 'ピュ', 'pyu'),
      cell('ぴょ', 'ピョ', 'pyo'),
    ],
  },
];

export const countKanaCells = (rows: KanaRow[]): number =>
  rows.reduce(
    (total, row) => total + row.cells.filter((item) => item !== null).length,
    0,
  );

export const kanaCellKey = (cell: KanaCell): string =>
  `${cell.hiragana}-${cell.katakana}`;
