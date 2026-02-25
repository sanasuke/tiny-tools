# Project Conventions

## プロジェクト概要
- 毎日1つWebツールを追加する個人プロジェクト
- 技術スタック: 純粋 HTML / CSS / JS（フレームワーク・ビルドツールなし）
- デプロイ先: Cloudflare Pages (`https://tiny-tools-cjj.pages.dev/`)
- UIは日本語

## ディレクトリ構成・命名規則
- アプリディレクトリ名: `dayXXX_<英語slug>`（例: `day007_drum-machine`）
- 各アプリは基本的に単一 `index.html` ファイルで完結させる
- 共通リソース（ヘッダー等）は `shared/` に配置

## 新規アプリ追加チェックリスト
新しいツールを追加する際は、以下をすべて実施すること:

1. `dayXXX_<slug>/index.html` を作成
2. `shared/header.js` の `TOOLS` 配列にエントリを追加
   - 形式: `{ day: N, name: 'ツール名', desc: '説明文', path: 'dayXXX_<slug>', genres: ['genre1'] }`
   - `genres` は既存ジャンル (`text`, `design`, `music`, `utility`, `ai`) から選択
3. トップページ `index.html` にツールカードを追加
4. `README.md` のツール一覧テーブル・ディレクトリ構成を更新

## コードスタイル・制約
- 共通ヘッダー（`shared/header.js`）の読み込みは必須
- ダークモード対応は必須（`body.tt-dark` クラスでスタイル切り替え）
- 外部ライブラリの使用は最小限にする
- ページタイトル形式: `<ツール名> | tiny-tools Day X`

## Git
- コミットメッセージ、ブランチ名、PRタイトルのプレフィックスは `feat` ではなく `feature` を使う
  - 例: `feature: ヘッダーにツール検索機能を追加`
  - 例: `feature/header-search`

## planモードの動作
plan作成時は、必ずplanに作業手順も明示してください。

### 必須手順
1. mainにcheckoutしてgit pullする
2. 最新の状態のmainからブランチを適切な命名で切る
3. 作成したブランチで実装、commit、push、pr作成まで行う
