# tiny-tools
毎日1つ、ちょっと便利なツールを公開中 🛠️

## 概要

**tiny-tools** は、毎日1つずつ小さなWebツールを作って公開するプロジェクトです。
すべてのツールはブラウザだけで動く静的サイトとして実装されています。

## ツール一覧

| Day | ツール名 | 説明 |
| --- | --- | --- |
| [001](https://tiny-tools-sanasuke.netlify.app/day001_char-counter/) | 文字数カウンター | リアルタイムでテキストの文字数（スペース込み/除外）・行数・単語数・バイト数をカウント |
| [002](https://tiny-tools-sanasuke.netlify.app/day002_multi-persona-review/) | マルチペルソナレビュー | AIが複数の視点からテキストをレビュー（Gemini API使用） |

## 使い方

公開サイトからすぐに使えます: **https://tiny-tools-sanasuke.netlify.app/**

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
├── shared/
│   └── header.js                     # 共通ヘッダー
├── LICENSE
└── README.md
```

## ライセンス

[MIT](LICENSE)
