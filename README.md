# tiny-tools
毎日1つ、ちょっと便利なツールを公開中 🛠️

## 概要

**tiny-tools** は、毎日1つずつ小さなWebツールを作って公開するプロジェクトです。
すべてのツールはブラウザだけで動く静的サイトとして実装されています。

## ツール一覧

| Day | ツール名 | 説明 |
| --- | --- | --- |
| [001](https://tiny-tools-cjj.pages.dev/day001_char-counter/) | 文字数カウンター | リアルタイムでテキストの文字数（スペース込み/除外）・行数・単語数・バイト数をカウント |
| [002](https://tiny-tools-cjj.pages.dev/day002_multi-persona-review/) | マルチペルソナレビュー | AIが複数の視点からテキストをレビュー（Gemini API使用） |
| [003](https://tiny-tools-cjj.pages.dev/day003_mercari-toolkit/) | メルカリツールキット | テンプレ生成・送料計算・サイズ判定・タイトルチェック・写真加工 |
| [004](https://tiny-tools-cjj.pages.dev/day004_color-palette/) | カラーパレット生成 | 補色・類似色・モノクロなど5種のパレットを生成・エクスポート |
| [005](https://tiny-tools-cjj.pages.dev/day005_music-stats/) | 音楽統計ダッシュボード | Spotifyデータから再生履歴を可視化・分析 |
| [006](https://tiny-tools-cjj.pages.dev/day006_pixel-art/) | ピクセルアートエディタ | Canvas ベースの本格ドット絵エディタ |
| [007](https://tiny-tools-cjj.pages.dev/day007_drum-machine/) | ドラムマシン | Web Audio APIで作るステップシーケンサー・ビートメーカー |
| [008](https://tiny-tools-cjj.pages.dev/day008_particle-editor/) | パーティクルエフェクトエディタ | リアルタイム2Dパーティクルシミュレーター |
| [009](https://tiny-tools-cjj.pages.dev/day009_packing-list/) | 持ち物チェックリストビルダー | シーン別テンプレートで旅行・出張の持ち物リストを作成・共有 |
| [010](https://tiny-tools-cjj.pages.dev/day010_split-bill/) | 割り勘計算機 | 飲み会・旅行の割り勘を簡単計算。傾斜割り・飲み放題割り対応 |
| [011](https://tiny-tools-cjj.pages.dev/day011_station-access/) | 駅アクセスチェッカー | 乗換回数・所要時間で到達可能な駅を検索。複数出発地の共通駅も探せる |
| [012](https://tiny-tools-cjj.pages.dev/day012_qr-tool/) | QRコードツール | QRコードの生成・読み取り。テキスト・URL・WiFi・メール・電話に対応 |
| [013](https://tiny-tools-cjj.pages.dev/day013_roulette/) | ルーレット | ルーレット・抽選ツール。項目を自由に設定して回そう。重み付き・除外モード対応 |
| [014](https://tiny-tools-cjj.pages.dev/day014_pomodoro/) | ポモドーロタイマー | トマト型タイマーで集中管理。作業/休憩サイクル・セッション記録対応 |
| [015](https://tiny-tools-cjj.pages.dev/day015_icon-resize/) | SNSアイコンリサイズ | SNS用アイコン画像を一括リサイズ。8プラットフォーム対応・円形プレビュー付き |
| [016](https://tiny-tools-cjj.pages.dev/day016_floor-plan/) | 間取り図エディタ | 間取り図の作成・家具配置シミュレーション。テンプレート・面積計算・SVG出力対応 |

## 使い方

公開サイトからすぐに使えます: **https://tiny-tools-cjj.pages.dev/**

ローカルで動かす場合は、リポジトリをクローンしてブラウザで開くだけです。

```bash
git clone https://github.com/naoki-wjm/tiny-tools.git
open tiny-tools/index.html
```

## ディレクトリ構成

```
tiny-tools/
├── index.html                        # トップページ
├── day001_char-counter/
│   └── index.html                    # 文字数カウンター
├── day002_multi-persona-review/
│   └── index.html                    # マルチペルソナレビュー
├── day003_mercari-toolkit/
│   ├── index.html                    # メルカリツールキット
│   ├── style.css
│   └── js/
├── day004_color-palette/
│   └── index.html                    # カラーパレット生成
├── day005_music-stats/
│   └── index.html                    # 音楽統計ダッシュボード
├── day006_pixel-art/
│   └── index.html                    # ピクセルアートエディタ
├── day007_drum-machine/
│   └── index.html                    # ドラムマシン
├── day008_particle-editor/
│   └── index.html                    # パーティクルエフェクトエディタ
├── day009_packing-list/
│   └── index.html                    # 持ち物チェックリストビルダー
├── day010_split-bill/
│   └── index.html                    # 割り勘計算機
├── day011_station-access/
│   ├── index.html                    # 駅アクセスチェッカー
│   └── data.js                       # 鉄道データ
├── day012_qr-tool/
│   └── index.html                    # QRコードツール
├── day013_roulette/
│   └── index.html                    # ルーレット
├── day014_pomodoro/
│   ├── index.html                    # ポモドーロタイマー
│   ├── style.css
│   └── js/
├── day015_icon-resize/
│   └── index.html                    # SNSアイコンリサイズ
├── day016_floor-plan/
│   └── index.html                    # 間取り図エディタ
├── shared/
│   └── header.js                     # 共通ヘッダー
├── .gitignore
├── LICENSE
└── README.md
```

## ライセンス

[MIT](LICENSE)
