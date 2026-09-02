# design-system/presets/ 配色プリセット一覧

`color-definition.json` を用意していないユーザーのための、選択式の配色プリセット集。各ファイルは `design-system/color-definition.example.json` と同一スキーマ(`brand`/`text`/`background`/`border`/`font`)を満たす。選んだプリセットをそのまま`design-system/<brand>/color-definition.json`(`<brand>` は任意のブランド名)としてコピーすれば `pptx-design-system-init` Skill の残りの手順(`generate-theme.js <brand>` によるtheme.js生成、続けてこのブランド専用のレイアウト設計)にそのまま接続できる。

| ファイル | primary / secondary | 想定用途 |
|---|---|---|
| `neutral.json` | `#15803D` / `#A16207` (緑/黄) | 迷ったときの既定値。`color-definition.default.json` と同一内容。汎用的なビジネス資料向け |
| `green.json` | `#059669` / `#F59E0B` (緑/琥珀) | 成長・サステナビリティ・金融系など、信頼感と前向きさを出したい資料向け |
| `purple.json` | `#7C3AED` / `#DB2777` (紫/ピンク) | スタートアップ・クリエイティブ・プロダクト紹介など、個性を出したい資料向け |
| `warm-neutral.json` | `#C2410C` / `#92400E` (テラコッタ/ブラウン) | ホスピタリティ・ライフスタイル・コミュニティ系など、温かみを出したい資料向け |
| `monochrome.json` | `#111827` / `#4B5563` (黒/グレー) | 彩度を抑えたミニマル・フォーマルなコーポレート資料向け |

いずれも `text`/`background`/`border` は各配色に合わせて薄く色味を寄せてあるが、本文の可読性を優先しコントラスト比を大きく崩さない範囲に留めている。
