---
name: pptx-theme-from-tokens
description: Reads a DTCG-format (W3C Design Tokens Community Group, $value/$type structure) design tokens JSON file the user already has — e.g. exported from Figma Tokens Studio, Style Dictionary, or a design system repo — and writes design-system/<brand>/color-definition.json for this repo's PPTX design system by extracting the color ($type color) and font ($type fontFamily) tokens. <brand> is an arbitrary directory name (company/product name) the user picks. Use this skill when the user gives a path to an existing tokens.json/design-tokens.json file and wants to reuse their real brand colors/fonts for slide generation, or mentions "DTCG", "design tokens", "Figma tokens", "Style Dictionary", "$value/$type". Do NOT use this for hand-editing color-definition.json directly, and do NOT use it to actually build theme.js/preview.pptx — after writing color-definition.json this skill hands off to pptx-design-system-init, which owns that regeneration step.
---

# pptx-theme-from-tokens

## この Skill の役割

DTCG 形式 (`$value`/`$type` を持つ W3C Design Tokens Community Group 準拠) のデザイン
トークン JSON から、色 (`$type: "color"`) とフォント (`$type: "fontFamily"`) に該当する
トークンを読み取り、`design-system/<brand>/color-definition.json` を生成する Skill。`<brand>` はユーザーが決める任意の名称(会社名・製品名など)の
ディレクトリで、`pptx-design-system-init` が扱うブランド単位のディレクトリと同じもの。

## なぜ決定論的スクリプトではなく AI が読む設計なのか

DTCG は `$value`/`$type` という値の**表現形式**は標準化しているが、トークンを
どうグルーピング・命名するか (`color.brand.primary` か `colors.primary.500` か
`semantic.color.action.default` か等) はツール・チームごとにまちまちで、標準化
されていない。そのため「決まったパスを読みに行くだけの固定パーサー」はトークンの
構造が少し変わるだけで簡単に壊れる。

この Skill はあえてスクリプト化せず、**AI 自身がトークンツリーを読んで文脈から
意味を判断する**設計にしている。ネスト構造・トークン名・`$description` フィールドを
手がかりに、どのトークンが「プライマリブランドカラー」「本文テキスト色」「見出し
フォント」に該当するかを推論すること。判断に迷う場合は、黙って決め打ちせず必ず
ユーザーに確認する。これは過去に自前実装のパイプライン処理で失敗した経験から、
曖昧な判断をコード側で固定化しないという設計原則に基づく。

## 手順

1. **入力ファイルのパスと、書き込み先のブランド名 `<brand>` を確認する。**
   入力ファイルのパスはユーザーが指定していなければ尋ねる。動作確認だけしたい場合は
   `design-system/design-tokens.example.json` (Figma Tokens Studio 風のサンプル、
   プリミティブパレット + セマンティックエイリアスの2層構造) を使ってよい。
   `<brand>` はユーザーが指定していなければ会社名・製品名などから kebab-case で
   決めるか、既存の `design-system/<brand>/` ディレクトリを上書きするか尋ねる
   (`default` は予約名なので新規ブランド名には使わせない)。

2. **JSON を読み、`$value`/`$type` を持つノードを再帰的に洗い出す。**
   - `$type` が `color` のトークンと `fontFamily` のトークンだけを対象にする。
     それ以外の `$type` (spacing, dimension 等) は無視してよい。
   - `$value` が `{color.palette.blue.500}` のようなエイリアス参照 (中括弧記法) の
     場合は、参照先のトークンまで辿って実際の値 (16進カラーコード等) を解決する。
   - 各トークンの `$description` があれば、意味推定の重要な手がかりとして使う。

3. **`color-definition.json` の 9 フィールドに、意味の近いトークンをマッピングする。**
   目標スキーマ (`design-system/color-definition.example.json` と同一):
   ```json
   {
     "brand": { "primary": "RRGGBB", "secondary": "RRGGBB" },
     "text": { "primary": "RRGGBB", "secondary": "RRGGBB" },
     "background": { "default": "RRGGBB", "accent": "RRGGBB" },
     "border": "RRGGBB",
     "font": { "heading": "Font Name", "body": "Font Name" }
   }
   ```
   - 16進カラーコードは `#` を除いた6桁 (`generate-theme.js` / `color-definition.example.json`
     と同じ表記) で書く。
   - マッピングの手がかりの例: 名前に `primary`/`brand`/`accent`/`main` を含む色 →
     `brand.primary`。`secondary`/`danger`/`warning`/`highlight` → `brand.secondary`。
     `text`/`foreground`/`ink` 系で最も濃い/デフォルトのもの → `text.primary`、
     ミュート/セカンダリなもの → `text.secondary`。`background`/`surface`/`bg` の
     デフォルト → `background.default`、サブトルな方 → `background.accent`。
     `border`/`divider`/`outline`/`stroke` → `border`。`fontFamily` の中で見出し用
     (`heading`/`display`/`title`) → `font.heading`、本文用 (`body`/`text`/`base`) →
     `font.body`。ただし命名は組織ごとに揺れるため、これらはあくまで初期仮説として
     扱い、`$description` や周辺トークンの文脈で裏付けを取ること。
   - 該当しそうなトークンが複数ある、あるいは1つも見当たらない場合は、推測で
     埋めずにユーザーに「この値で合っていますか」「該当するトークンが見つかりません
     でした、どれを使いますか」と確認する。

4. **確認が取れたら `design-system/<brand>/color-definition.json` に書き出す。**
   ディレクトリが無ければ `mkdir -p design-system/<brand>` してから書き出す。既存ファイルが
   ある場合は上書きしてよいか確認する。

5. **`pptx-design-system-init` Skill に接続する。**
   `color-definition.json → theme.js` の変換ロジックは `design-system/generate-theme.js`
   に一本化されており、本 Skill 内で theme.js の生成やフィールドの再マッピングを
   複製してはならない。書き出しが終わったら、そのまま続けて良いかユーザーに確認し、
   よければ `pptx-design-system-init` Skill の残りの手順(`theme.js` 生成 → 公式pptxスキルに
   よるこのブランド専用のレイアウト設計・実装・ビジュアルQA)に進む。

## 注意事項

- 本 Skill は `design-system/<brand>/color-definition.json` を書くところまでが責務。`theme.js`
  や `preview.pptx` の生成コマンドを直接実行するのは `pptx-design-system-init` の役目。
- DTCG のフォント関連トークン (`mono` 等、pptx デザインシステムで使わないもの) は
  無視してよい。無理に全トークンをマッピングしようとしない。
