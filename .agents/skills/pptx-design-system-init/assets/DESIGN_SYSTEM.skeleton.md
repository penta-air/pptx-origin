# design-system/<brand>/DESIGN_SYSTEM.md のひな形(構成のみ)

このファイルは `design-system/<brand>/DESIGN_SYSTEM.md` を書く際の**章立てのひな形**であり、視覚的な意思決定の中身(色の役割分担・モチーフ・角丸の有無等)は一切含まない。
`<brand>` 固有の内容で埋めること。定型スライドの名称・関数名・用途・`content`フィールド契約自体は `.agents/docs/fixed-primitives-contract.md` が正であり、ここでの記述はその「このブランドではどう視覚化したか」および「このブランドの自由設計スライドはどういうルールに従うか」を書く場所に過ぎない。

---

# design-system/<brand>/DESIGN_SYSTEM.md

`<brand>` ブランドのデザインシステムスペック。`design-system/<brand>/components.js` が実装する定型スライドの視覚実現と、`pptx-build` が構成案ごとに自由設計するスライドの両方が、ここに書くルールに従う。定型スライドの名称・用途・`content`フィールド契約自体はブランドに依存せず `.agents/docs/fixed-primitives-contract.md` で定義されている。

色を変更した場合は `design-system/<brand>/color-definition.json` を編集し、`node design-system/generate-theme.js <brand>` → `node design-system/<brand>/components.js` の順に再実行し、`design-system/<brand>/preview.pptx` を再生成すること(デザインシステムのルール自体を作り直す場合は `pptx-design-system-init` Skill を再度実行する)。

## 視覚言語: <このブランドで採用した視覚言語の名前>(`<brand>` ブランドの選択)

<ここに、このブランド専用に設計した視覚言語を記述する。手順4で聞いたレイアウト方針(情報密度・トーン・モチーフの好み)と `theme.js` の色・フォント、公式pptxスキルのDesign Ideas(ドミナントカラー60-70%・1つのモチーフを全レイアウトで貫く・アクセントラインや帯状ストライプを使わない、等)を踏まえ、このブランドが実際に何を核とする視覚言語にしたかを具体的に書く。
他ブランドのDESIGN_SYSTEM.mdを参照して同じ構造を流用しないこと——このブランドの色・方針から独立に考えて書く。>

- **ドミナントカラーの役割**: <どの色がどのスライド種別で60-70%を占めるか>
- **モチーフ**: <全スライドで一貫して繰り返す1つの視覚要素>
- **ダーク/ライトの使い分け**: <表紙・クロージングはダーク、本文はライトのサンドイッチ構造にするか、終始ダークで通すか等>

## 装飾ルール

- **シャドウ**: <使う/使わない。使う場合は blur/offset/opacity の具体値>
- **角丸**: <使う/使わない。使う場合は半径の具体値>
- **アクセントライン・帯状ストライプ**: 使わない(公式pptxスキルのAvoidリストにより全ブランド共通で禁止)。

## 余白グリッド

- `theme.spacing.marginX` / `marginY`: <値と、スライド全体でどう使うか>
- `theme.spacing.gap`: <要素間の標準ギャップ>
- <このブランド固有の余白ルール(例: ブロック間は常にgapの倍数を使う、等)があれば追記>

## フォントペアリング

- 見出し: `theme.fonts.heading`、本文: `theme.fonts.body`。
- <この組み合わせを選んだ理由・使い分けの補足があれば追記>

## 定型スライド一覧

`.agents/docs/fixed-primitives-contract.md`の契約と一致させること。視覚実現の要点だけをこの表に書く(詳細な実装ルールは各関数のコード内コメントに書けばよい)。

| # | 関数名 | 用途 | このブランドでの構成 |
|---|---|---|---|
| 1 | `addTitleSlide` | 資料冒頭の表紙 | <> |
| 2 | `addSectionSlide` | 章の導入 | <> |
| 3 | `addClosingSlide` | 資料末尾の挨拶・連絡先 | <> |
| 4 | `applyChrome` | ページ番号等のランニング要素 | <配置位置・スタイル> |

## 自由設計スライドの指針

定型スライドに当てはまらない内容(標準コンテンツ・画像中心・テキスト+画像・対等な要素の列挙・指標の強調・比較・テーブル・引用・2×2マトリクス・プロセスタイムライン・強調メッセージ、`.agents/docs/fixed-primitives-contract.md`の自由設計カテゴリ参照)は、`pptx-build`が構成案の内容ごとに都度ゼロから設計する。
その際も本ドキュメントの「視覚言語」「装飾ルール」「余白グリッド」「フォントペアリング」には従うこと。<このブランド固有の追加ルール(例: 自由設計スライドでも必ず1つ視覚要素を入れる、写真プレースホルダーの扱い等)があればここに追記する>

## 共通の実装ルール

- 色は必ず `theme.colors.*`、フォントは必ず `theme.fonts.*`、文字サイズは必ず `theme.text.*`、余白は必ず `theme.spacing.*` から取得し、固定値を直接埋め込まない。
- 画像は実データを持たず、プレースホルダー(ラベル付きの図形)として表現する。実画像の差し込みは常に公式pptxスキル側の責務であり、本デザインシステム生成スクリプトの範囲外。
- 実アイコン・実写真のレンダリング(`react-icons`/`sharp`等)には依存しない。

## テーマ変更時の再生成手順

1. `design-system/<brand>/color-definition.json` を編集する。
2. `node design-system/generate-theme.js <brand>` を実行し、`design-system/<brand>/theme.js` を再生成する。
3. `node design-system/<brand>/components.js` を実行し、`design-system/<brand>/preview.pptx` を再生成する。
4. 生成された `.pptx` を開き、定型スライドすべてに変更後の配色が正しく反映されていることを目視確認する。
