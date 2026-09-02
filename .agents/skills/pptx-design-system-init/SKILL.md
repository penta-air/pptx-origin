---
name: pptx-design-system-init
description: ブランドのデザインシステム一式――design-system/<brand>/theme.js(color-definition.json から生成)、design-system/<brand>/components.js(固定の構造プリミティブ:タイトル/セクション/クロージングの識別スライド、要素を並べるグリッド、指標を強調するメトリック行)、DESIGN_SYSTEM.md(仕様書:支配的カラーの役割、モチーフ、装飾ルール、スペーシンググリッド、フォント組み合わせ)――を新規作成または再生成する。汎用スタイルの流用でなく、公式Anthropic pptxスキルのデザイン/QA機能で設計・視覚QAする。<brand> はユーザーが選ぶ任意のディレクトリ名(会社名・製品名)で、color-definition.json + theme.js + components.js + DESIGN_SYSTEM.md + preview.pptx を1ブランド分としてまとめる。「default」はゼロコンフィグ用にコミット済みの唯一のバンドルで、明示的な依頼がない限り再デザインしない。使用場面:color-definition.json 手動編集後の(再)構築時、pptx-theme-from-tokens が書き出した直後、新ブランドで color-definition.json 未作成のとき、ブランドカラー未確定で design-system/presets/ から選びたいとき、あるいは color-definition/design-tokens が無く、AIに業種・既存ロゴ/企業カラー・望む印象をヒアリングさせ色を導出してほしいとき。トリガー例:「テンプレートを作って/作り直して」「デザインシステムを作って/作り直して」「色を変えたのでtheme.jsを再生成して」「generate the design system」「rebuild the theme」「プリセットから選びたい」「色はおまかせで」「色をヒアリングして決めて」「ブランドカラーを一から決めたい」「テンプレートのレイアウトも独自にしたい」。DTCG/W3Cのdesign-tokens($value/$type構造)の読み込みには使用しない――それは pptx-theme-from-tokens の役割で、完了後にこのスキルへ引き継がれる。
---

# pptx-design-system-init

## この Skill の役割

`design-system/<brand>/color-definition.json` を入力に、以下の2つを行うオーケストレーション Skill。

1. **色/フォントの土台づくり**(決定論的): `node design-system/generate-theme.js <brand>` を実行して `design-system/<brand>/theme.js` を生成する。ここは純粋な Node/JS 処理で、公式 pptx スキルには依存しない。
2. **レイアウト方針のヒアリング**: 色とは別に、情報密度・トーン・モチーフの好みをユーザーに尋ね、デザインシステム設計のインプットにする。
3. **デザインシステムの設計・実装・ビジュアルQA**(このブランド専用、公式pptxスキルに委譲): `design-system/<brand>/components.js`(固定プリミティブのコード)・`design-system/<brand>/DESIGN_SYSTEM.md`(デザインシステムスペック)・`design-system/<brand>/preview.pptx`(視覚QA用のサンプルデッキ)を、`.agents/docs/fixed-primitives-contract.md`(固定プリミティブの名称・用途・content契約)と公式 pptx スキル(`.agents/skills/pptx/`)のデザイン/QAノウハウ、手順2のレイアウト方針だけを入力にブランドごとに新規に設計・実装する。**他ブランドの`components.js`・`DESIGN_SYSTEM.md`(`default` を含む)は一切参照しない** —— 具体的な視覚構成を見せてしまうとそれを模倣してしまうため。

本 Skill が作るのは、内容非依存の"型"を実装する**少数の固定プリミティブ**(表紙・章区切り・クロージングという識別モーメント、対等な要素の列挙、指標の強調)と、それ以外のスライドを`pptx-build`が都度自由に設計する際に従う**デザインシステムスペック**(ドミナントカラーの役割・モチーフ・装飾ルール・余白グリッド・フォントペアリング)の2つである。レイアウトのカテゴリすべてを固定関数として実装してしまうと、SSOTの一回性の内容が既存パターンに無理に押し込まれてしまうため、本当に固定すべき少数の構造(ブランドの「顔」となる識別モーメントと、対等要素のジオメトリ)だけを固定し、残りは公式pptxスキルの設計力に委ねる(固定/自由設計の判断基準は`.agents/docs/fixed-primitives-contract.md`参照)。

`<brand>` はユーザーが決める任意の名称(会社名・製品名など)のディレクトリで、1ブランド分の色定義・生成物を1セットにまとめる単位。`design-system/default/` だけは唯一リポジトリにコミットされる、ゼロコンフィグ用の固定バンドルで、それ以外の `design-system/<brand>/` はすべてユーザー固有の成果物として `.gitignore` される。

**このリポジトリの最重要制約**: `.pptx` を実際に組み立てる/編集するロジックを、Skillの指示から外れて自由裁量で書いてはならない。ただし本 Skill の3.が行う「ブランド単位で一度だけ作る決定論的な固定プリミティブ生成コード(`components.js`)」は例外であり、この制約の正しい適用対象である。**一度だけ設計・実装したコードをブランドの固定資産として以降使い回す**という構造そのものが「AIの自由裁量を都度発生させない」という核心原則を守っており、その一度きりの設計を担当するのが公式pptxスキルの表現力になっている。実際のコンテンツを持つデッキ生成(SSOTのテキスト・画像を流し込む工程。固定プリミティブに当てはまらない内容の都度の自由設計を含む)は本 Skill の範囲外であり、それは常に `pptx-build` Skill 経由で行われる。

## 前提

`.agents/skills/pptx/` に公式 pptx スキルが導入済みであること(README のセットアップ手順 `npx skills add https://github.com/anthropics/skills --skill pptx --agent universal -y` で導入される)。未導入なら、まずそちらを案内する。`npm install` が未実行なら先に実行するよう案内する(`pptxgenjs` に依存)。

## 手順

### 1. ブランド名 `<brand>` を決める

- ユーザーが既に会社名・製品名などを指定していれば、それを kebab-case にした値を使う(例:「Acme株式会社」→ `acme`)。`default` は予約名なのでユーザー用の新規ブランド名には使わせない。
- 指定がなければ、`design-system/` 配下の既存ブランドディレクトリ一覧(`default` 以外)を見せて「どのブランドを使うか、または新しいブランド名」を尋ねる。ディレクトリが `default` しか無く、ユーザーも特にブランドを分ける意図がなければ `default` をそのまま使ってよい(無理に新規ブランド名を作らせない)。
- **`<brand>` が `default` の場合の特別扱い**: `design-system/default/` はゼロコンフィグ用に既にコミット済みの固定資産(視覚言語「Bold Bento」)であり、通常のユーザーフローでは再設計しない。ユーザーが色だけ変えたい場合は手順2・3(色定義→theme.js)のみ行い、手順4・5(レイアウト方針ヒアリング・設計)は行わずスキップしてよい。ユーザーが明示的に「defaultのレイアウト自体を作り直したい」と言った場合のみ、手順4・5も `default` に対して実行する。

### 2. `design-system/<brand>/color-definition.json` の有無を確認する

- 存在すれば、そのまま次のステップへ。
- 存在しなければ、ユーザーに次のいずれかを尋ねる:
  - a) 独自ブランドカラーを使いたいが、色定義ファイル(DTCGトークン等)は持っていない → AI がヒアリングを行い、その回答から9フィールドの値を決めて代わりに書き込む(ユーザーに手編集させない)。手順:
    1. 業種・資料の用途、既存のロゴ/コーポレートカラー(hexが分かればそれを使う)、出したい印象(信頼感/親しみやすさ/先進性等)を尋ねる。既にヒアリング済み・brief 内に情報がある場合は再度聞き直さない。
    2. hex が明言されなかった項目は、`design-system/presets/PRESETS.md` や `color-definition.default.json` のような「白背景 + 淡色アクセント + 本文濃色グレー」の構成を土台に、ヒアリング内容に合う配色を AI が決定する。`brand.primary`/`secondary` はヒアリングで得た/推定したブランド色、`text.*`・`background.accent`・`border` は本文の可読性(WCAG AA相当のコントラスト比)を保てる薄いトーンに寄せる。
    3. `mkdir -p design-system/<brand>` の上で`cp design-system/color-definition.example.json design-system/<brand>/color-definition.json` を実行し、決定した9フィールドの値でそのまま上書きする。
    4. 決定した値(色のプレビューは説明文で可)を一覧でユーザーに提示し、確定してよいか最終確認を取ってから次のステップへ進む。修正依頼があれば反映して再確認する。
  - b) デザイントークン(Figma Tokens Studio 等の DTCG 形式ファイル)を既に持っている → このユーザー要望は `pptx-theme-from-tokens` Skill の範囲なので、そちらに委ねる。
  - c) 今すぐ試したいだけ / ブランド指定がない(`<brand>` が `default` の場合)→ 何もコピーせず進めてよい。`generate-theme.js` は `default` ブランドの`color-definition.json` が無ければ自動的に `design-system/color-definition.default.json`(ニュートラルな配色)からブートストラップし、その旨をコンソールに警告出力する。これは正常系であり、エラーではない。`default` 以外のブランド名でファイルが無い場合はこのフォールバックは効かず、スクリプトはエラーで止まる(どのブランドの色かを勝手に推測してはならないため)ので、必ず a/b/d のいずれかで先にファイルを用意する。
  - d) 独自ブランドカラーは決めていないが、いくつかの選択肢から雰囲気を選びたい → `design-system/presets/` 配下のプリセットから選ぶ。`design-system/presets/PRESETS.md` に一覧(ファイル名・primary/secondary の色・想定用途)があるので、これを読んでユーザーに提示する。ユーザーが選んだら `mkdir -p design-system/<brand>` の上で `cp design-system/presets/<name>.json design-system/<brand>/color-definition.json` を実行して続行する。ユーザーが「おまかせ」と答えた場合は、資料の用途・トーン(既知であれば)から `PRESETS.md` の「想定用途」列を見て最も近いものを AI が選び、選んだ理由を一言添えて伝える。

### 3. `node design-system/generate-theme.js <brand>` を実行する

`design-system/<brand>/color-definition.json`(`default` の場合のみ無指定フォールバックあり)の `brand`/`text`/`background`/`border`/`font` を読み、`design-system/<brand>/theme.js` を上書き生成する。`theme.js` は生成物であり手編集しないようユーザーに伝えること(再生成のたびに上書きされる)。

### 4. レイアウトの方向性をヒアリングする(`default` の通常フローではスキップ)

手順2で色の印象(信頼感/親しみやすさ/先進性等)を尋ねていても、それは色の決定にしか使っていない。レイアウトの方向性は別途、次を1つの質問としてまとめて尋ねる(会話内で既にこの情報が明らかな場合は聞き直さない):

- **情報密度**: 1枚に要素を絞ってゆったり見せたいか、多めに詰め込んで見せたいか。
- **トーンの対比軸**: きっちりした整然な印象(グリッド・均等配置)を狙うか、動きのある印象(非対称な配置・大胆な余白の使い方)を狙うか。
- **モチーフの好み**: 円形・直線・幾何学的パターン等、こだわりがあれば。特になければ「AI一任」でよいと伝える。

回答(または「AI一任」)と、手順2で得た業種・用途・印象語から、手順5のレイアウト設計に渡す短い「レイアウト方針」を言葉にする(例:「要素を絞って余白を大きく取り、几帳面な均等配置。モチーフは円形を中心に」)。これは独立したファイルに保存する必要はなく、手順5の設計インプットとしてそのまま使い、最終的に `design-system/<brand>/DESIGN_SYSTEM.md` の視覚言語節に反映する。

### 5. デザインシステムを設計・実装・ビジュアルQAする(`default` の通常フローではスキップ)

ここが本 Skill の中心的な工程。作るものは2つ: (a) 内容非依存の"型"を実装する**少数の固定プリミティブ**(表紙・章区切り・クロージングという識別モーメント、対等な要素の列挙、指標の強調 — `.agents/docs/fixed-primitives-contract.md`が定義する5関数+`applyChrome`)と、(b) それ以外のスライドを `pptx-build` が都度自由に設計する際に従う**デザインシステムスペック**(ドミナントカラーの役割・モチーフ・装飾ルール・余白グリッド・フォントペアリング)。固定プリミティブ以外のレイアウト構成(標準コンテンツ・画像+テキスト・比較・テーブル等)をこのSkillが決め打ちのコードとして書くことはしない — それをやると再び「SSOTの内容を既存パターンに無理に押し込む」問題に戻ってしまう。

**設計のために与える情報は、意図的に「固定プリミティブの名称・用途・content契約」と「一般的なデザイン原則」までに絞る。具体的な視覚構成(どこに何を置くか)は与えない** — 与えてしまうとその構成をそのまま模倣してしまい、結局「どのブランドでも同じ見た目」に戻ってしまうため。この理由により、**他のどのブランド(`default` を含む)の`components.js`・`DESIGN_SYSTEM.md` も、設計中は一切開かない・参照しない。** 実装パターンが知りたい場合も同様で、以下1〜3の入力だけから独立に設計すること。

1. **入力を揃えて読む(これ以外は参照しない)。**
   - `.agents/docs/fixed-primitives-contract.md` — 固定プリミティブの**内容契約**(関数名・用途・`content`パラメータのスキーマ)と、自由設計カテゴリの参考一覧。固定プリミティブの関数名・`content`フィールド構造はブランドに依らず**必ず一致させる**(`pptx-build`がSSOTの内容をこのスキーマに沿って流し込むため、フィールド名を変えるとビルド工程が壊れる)。自由設計カテゴリ側は着想集であり拘束力はない。
   - `.agents/skills/pptx/SKILL.md` — 特に「Creating with pptxgenjs — gotchas」(実装上の落とし穴)と「Design Ideas」(配色の強弱・ドミナントカラー60-70%・1つのモチーフを全レイアウトで貫く・タイポグラフィのセーフフォント・Avoidリスト ─ アクセントラインや帯状ストライプは「AI感」の典型なので使わない、等)。これはどのブランドにも共通する一般原則であり、特定ブランドの構成例ではない。
   - 手順4で言語化した「レイアウト方針」(情報密度・トーン・モチーフの好み)。

2. **`.agents/skills/pptx-design-system-init/assets/components.skeleton.js` を`design-system/<brand>/components.js` として、`assets/DESIGN_SYSTEM.skeleton.md` を`design-system/<brand>/DESIGN_SYSTEM.md` としてコピーする。** このスケルトンは技術的な配線(`theme.js` の読み込み・各関数のシグネチャ`(pres, theme, content)`・サンプルデッキ組み立て・書き出し処理)だけを持ち、視覚的な意思決定を一切含まない。5つの固定プリミティブ関数と `applyChrome`(`throw new Error("not implemented")` になっている部分)を、手順1で揃えた入力とこのブランドの `theme.js` の色・フォントだけから、ゼロから設計・実装する。**コピーした`components.js`冒頭のヘッダーコメント(「このファイルはブランド非依存の技術的スケルトンであり、視覚的な意思決定を一切含まない」という説明)もこのとき書き換えること** — 実装が終わればこのファイルはもうスケルトンではなく`<brand>`専用の確定した実装なので、その説明文をそのまま残すと自己矛盾する。「`<brand>`ブランド専用の固定プリミティブ実装。視覚言語は◯◯」のように、実際に採用した視覚言語の要点を1〜3行で簡潔に書く。

3. **`node design-system/<brand>/components.js` を実行し、`design-system/<brand>/preview.pptx` を生成する。** 実行前に、スケルトンの `buildSamplePresentation()` 内のコメントに従い、固定プリミティブのサンプルに加えて自由設計スライドの実例を1〜2枚 `pres.addSlide()` で直接書き足しておく(このブランドのデザインシステムスペックが実際にどう見えるかを、固定プリミティブだけでなく自由設計側でも確認するため)。

4. **ビジュアルQAを行う。**
   `.agents/skills/pptx/SKILL.md` の「Converting to Images」の手順で生成した`preview.pptx` を画像化し、すべてのスライドを目視で確認する。同スキルの「Avoid」リスト(テキストのはみ出し、要素の重なり、余白の不均一、低コントラスト、アクセントラインの使用等)に該当する問題や、`addPeerGridSlide`を件数違いで呼んだ際にブロックサイズのロジックが破綻していないかを確認し、問題があれば`components.js` を修正して再生成する。問題がなくなるまで繰り返す。

5. **`design-system/<brand>/DESIGN_SYSTEM.md` を書く。**
   コピーしたスケルトンの章立て(視覚言語・装飾ルール・余白グリッド・フォントペアリング・固定プリミティブ一覧・自由設計スライドの指針・共通実装ルール・再生成手順)の空欄を、このブランドで実際に実装した視覚的な意思決定で具体的に埋める。`.agents/docs/fixed-primitives-contract.md` の固定プリミティブ契約とフィールドが一致していることを確認する。

### 6. 結果を報告する

生成された `design-system/<brand>/theme.js`・`components.js`・`DESIGN_SYSTEM.md`・`preview.pptx` のパスを伝え、採用した視覚的な意思決定(ドミナントカラー・モチーフ等)を簡潔に説明する。実際のブランドカラー・デザインが意図通り反映されているか、生成された`.pptx` を開いて確認するようユーザーに促す。`design-system/<brand>/` は(`default` を除いて)`.gitignore` されているユーザー固有の成果物であることも伝えてよい。手順4・5は初回のみの比較的重い工程(レイアウト方針ヒアリングと、公式pptxスキルによる実際の設計・ビルド・ビジュアルQAのループ)である旨と、以降は再実行不要で `pptx-build` から固定資産として使い回されることも伝える。

## 注意事項

- スクリプトの実行に失敗した場合、スタックトレースをそのまま提示し、`design-system/<brand>/color-definition.json` のスキーマ(`brand.primary`, `brand.secondary`, `text.primary`, `text.secondary`, `background.default`, `background.accent`, `border`, `font.heading`, `font.body` の 9 フィールド)を満たしているか確認するよう促す。`generate-theme.js` はこのスキーマを検証し、欠けているフィールドがあれば明示的なエラーメッセージを出す。
- 本 Skill はカラー定義の「意味」を判断しない。DTCG トークンのような曖昧な入力を解釈する必要がある場合は `pptx-theme-from-tokens` Skill に任せる。
- 手順5で書く `design-system/<brand>/components.js` の固定プリミティブの関数名・`content`フィールド契約(`.agents/docs/fixed-primitives-contract.md`)を勝手に変更しない。変更すると`pptx-build` がそのブランドに対して動かなくなる。固定プリミティブに当てはまらない内容用の新しい関数を追加すること自体もしない(それは自由設計層の役割を奪ってしまう)。
- 既存ブランドの色だけ変えたい(デザインシステムはそのまま)場合は手順3までで完了してよい。デザインシステム自体を作り直したい場合のみ手順4・5を実行する。
- 手順5で設計する際、他のどのブランド(`default` を含む)の`components.js`・`DESIGN_SYSTEM.md` も開いたり参照したりしない。参照してよいのは`.agents/docs/fixed-primitives-contract.md`・`.agents/skills/pptx/SKILL.md`・手順4のレイアウト方針・`.agents/skills/pptx-design-system-init/assets/` のスケルトンのみ。
