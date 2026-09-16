// design-system/<brand>/components.js のひな形。他ブランドのcomponents.jsは参照・流用禁止 —
// 定型スライドの名称・用途・content契約は.agents/docs/fixed-primitives-contract.mdが正
// (ここは要約)。非定型スライド内容はここに実装せず、pptx-buildが都度自由設計する。
// 実行: node design-system/<brand>/components.js

"use strict";

const path = require("path");
const fs = require("fs");
const PptxGenJS = require("pptxgenjs");

const BRAND_DIR = __dirname;
const BRAND_NAME = path.basename(BRAND_DIR);
const THEME_PATH = path.join(BRAND_DIR, "theme.js");

if (!fs.existsSync(THEME_PATH)) {
  throw new Error(
    `[components] ${path.relative(
      process.cwd(),
      THEME_PATH
    )} が見つかりません。先に \`node design-system/generate-theme.js ${BRAND_NAME}\` を実行してください。`
  );
}

const theme = require(THEME_PATH);

// 色はtheme.colors.*、フォントはtheme.fonts.*、文字サイズはtheme.text.*、余白はtheme.spacing.*
// から取得し、関数内に固定値を直接埋め込まないこと。

// content: { logoLabel, title, subtitle }。資料冒頭の表紙で、内容が変わっても毎回同じ構造に
// すること(ブランドの識別モーメント)。
function addTitleSlide(pres, theme, content) {
  throw new Error("addTitleSlide: not implemented");
}

// content: { number, title, description }。表紙・クロージングと対になる識別モーメント(章の導入)。
function addSectionSlide(pres, theme, content) {
  throw new Error("addSectionSlide: not implemented");
}

// content: { message, contactName?, contactOrg?, contactEmail? }(すべて任意)。表紙と対になる
// 識別モーメント(資料末尾の挨拶・連絡先)。
function addClosingSlide(pres, theme, content) {
  throw new Error("addClosingSlide: not implemented");
}

// opts: { pageNumber }。スライドを追加する関数ではなく、生成済みslideにページ番号等を付与する。
// 定型スライドだけでなくpptx-buildが自由設計するスライドからも呼ばれる(一貫性のため)。
function applyChrome(slide, theme, opts) {
  throw new Error("applyChrome: not implemented");
}

// 定型スライドを代表サンプルで呼び出すビジュアルQA用資料。文言は自由に書き換えてよい。自由設計
// スライドの実例も1〜2枚、関数化せず直接pres.addSlide()で書き足すこと(pptx-buildが都度ゼロ
// から書く対象のため、ここでは一回性のサンプル)。
function buildSamplePresentation() {
  const pres = new PptxGenJS();
  pres.defineLayout({ name: "CUSTOM", width: theme.slide.width, height: theme.slide.height });
  pres.layout = "CUSTOM";

  addTitleSlide(pres, theme, {
    logoLabel: "Brand",
    title: "サンプルタイトル",
    subtitle: "サブタイトルのサンプルテキスト",
  });

  addSectionSlide(pres, theme, {
    number: "01",
    title: "セクションタイトル",
    description: "このセクションの概要説明。",
  });

  // TODO(実装者): 自由設計スライドの実例を1〜2枚、pres.addSlide()で直接書き足す
  // (標準コンテンツ・画像+テキスト・対等な要素の列挙・指標の強調等)。DESIGN_SYSTEM.mdの
  // 色・モチーフ・装飾ルールが実際に良く見えるかを確認すること。pageNumberは3から振る。

  addClosingSlide(pres, theme, {
    message: "ご確認いただきありがとうございました",
    contactName: "サンプル太郎",
    contactEmail: "sample@example.com",
  });

  return pres;
}

async function main() {
  const pres = buildSamplePresentation();
  const outputPath = path.join(BRAND_DIR, "preview.pptx");
  await pres.writeFile({ fileName: outputPath });
  console.log(`Generated: ${outputPath}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = {
  addTitleSlide,
  addSectionSlide,
  addClosingSlide,
  applyChrome,
  buildSamplePresentation,
};
