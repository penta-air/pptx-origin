// design-system/<brand>/components.js のひな形。他ブランドのcomponents.jsは参照・流用禁止 —
// 固定プリミティブの名称・用途・content契約は.agents/docs/fixed-primitives-contract.mdが正
// (ここは要約)。非プリミティブ内容はここに実装せず、pptx-buildが都度自由設計する。
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

// content: { logoLabel, title, subtitle }。デッキ冒頭の表紙で、内容が変わっても毎回同じ構造に
// すること(ブランドの識別モーメント)。
function addTitleSlide(pres, theme, content) {
  throw new Error("addTitleSlide: not implemented");
}

// content: { number, title, description }。表紙・クロージングと対になる識別モーメント(章の導入)。
function addSectionSlide(pres, theme, content) {
  throw new Error("addSectionSlide: not implemented");
}

// content: { message, contactName?, contactOrg?, contactEmail? }(すべて任意)。表紙と対になる
// 識別モーメント(デッキ末尾の挨拶・連絡先)。
function addClosingSlide(pres, theme, content) {
  throw new Error("addClosingSlide: not implemented");
}

// content: { title?, items: [{ heading, body? }] (2〜6件), pageNumber }。件数に応じた配置と
// ブロックサイズを決定論的に算出し、同じ件数なら常に同じジオメトリになるようにする。
// items[].bodyは省略され得る(アジェンダ的な単純列挙の場合)。
function addPeerGridSlide(pres, theme, content) {
  throw new Error("addPeerGridSlide: not implemented");
}

// content: { title?, metrics: [{ value, label, trend?: "up"|"down"|"flat" }] (2〜4件), pageNumber }。
// 先頭の要素(metrics[0])を主指標として強調する。
function addMetricRowSlide(pres, theme, content) {
  throw new Error("addMetricRowSlide: not implemented");
}

// opts: { pageNumber }。スライドを追加する関数ではなく、生成済みslideにページ番号等を付与する。
// 固定プリミティブだけでなくpptx-buildが自由設計するスライドからも呼ばれる(一貫性のため)。
function applyChrome(slide, theme, opts) {
  throw new Error("applyChrome: not implemented");
}

// 固定プリミティブを代表サンプルで呼び出すビジュアルQA用デッキ。addPeerGridSlideは件数を変えて
// 2回呼び、ブロックサイズの一貫性を確認する。文言は自由に書き換えてよい。自由設計スライドの
// 実例も1〜2枚、関数化せず直接pres.addSlide()で書き足すこと(pptx-buildが都度ゼロから書く
// 対象のため、ここでは一回性のサンプル)。
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

  addPeerGridSlide(pres, theme, {
    title: "対等な要素の列挙(3件)",
    items: [
      { heading: "特徴A", body: "説明文A" },
      { heading: "特徴B", body: "説明文B" },
      { heading: "特徴C", body: "説明文C" },
    ],
    pageNumber: 3,
  });

  addPeerGridSlide(pres, theme, {
    title: "対等な要素の列挙(5件)",
    items: [
      { heading: "項目1", body: "説明1" },
      { heading: "項目2", body: "説明2" },
      { heading: "項目3", body: "説明3" },
      { heading: "項目4", body: "説明4" },
      { heading: "項目5", body: "説明5" },
    ],
    pageNumber: 4,
  });

  addMetricRowSlide(pres, theme, {
    title: "指標の強調",
    metrics: [
      { value: "120%", label: "主要指標", trend: "up" },
      { value: "45件", label: "指標2" },
      { value: "8.2", label: "指標3", trend: "flat" },
    ],
    pageNumber: 5,
  });

  // TODO(実装者): 自由設計スライドの実例を1〜2枚、pres.addSlide()で直接書き足す
  // (標準コンテンツ・画像+テキスト等)。DESIGN_SYSTEM.mdの色・モチーフ・装飾ルールが
  // 実際に良く見えるかを確認すること。

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
  addPeerGridSlide,
  addMetricRowSlide,
  applyChrome,
  buildSamplePresentation,
};
