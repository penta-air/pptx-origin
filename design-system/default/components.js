// design-system/default/components.js
//
// defaultブランドの定型スライド実装。視覚言語「Bold Bento」: 塗り面(セル)を
// 情報の単位として使い、角丸・影は使わない。アンカーセル(プライマリ全面塗り)は
// レイアウトが非対称な箇所(表紙・章区切り・クロージング等)限定。
// 詳細はDESIGN_SYSTEM.md参照。実行: node design-system/default/components.js

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

// 共通ヘッダー帯を持たない方針のため、この2値だけでキッカーがある場合のコンテンツ
// 開始位置を決定論的に算出する。
const KICKER_HEIGHT = 0.36;
const KICKER_GAP = 0.16;
const FOOTER_HEIGHT = 0.3;
const FOOTER_GAP = 0.15;

/**
 * 文字列表示幅をインチで概算(全角≈1.15em、半角≈0.62em)。PptxGenJSでは正確な
 * グリフ幅計測ができないための近似値。
 */
function estimateTextWidthInches(str, fontSizePt) {
  let units = 0;
  for (const ch of String(str)) {
    units += /[　-ヿ㐀-鿿＀-￯]/.test(ch) ? 1.15 : 0.62;
  }
  // 太字・レンダラー差(PowerPoint/Keynote)による誤差を見込んだ安全係数。
  return (units * fontSizePt * 1.15) / 72;
}

/**
 * 左上の小さなキッカーバッジ。構成が異なるスライド群に一律の帯を被せるとレイアウトの
 * 違いが失われるため、意図的に共通ヘッダー帯を持たない。数値自体が内容を語るスライド等、
 * タイトルを省略したいスライドでは呼ばない。
 */
function addKicker(slide, title) {
  const { colors, fonts, text, spacing } = theme;
  if (!title) return;

  const fontSize = text.small;
  const paddingX = 0.18;
  const maxWidth = theme.slide.width - spacing.marginX * 2;
  const boxWidth = Math.min(
    estimateTextWidthInches(title, fontSize) + paddingX * 2,
    maxWidth
  );

  slide.addShape("rect", {
    x: spacing.marginX,
    y: spacing.marginY,
    w: boxWidth,
    h: KICKER_HEIGHT,
    fill: { color: colors.primary },
    line: { type: "none" },
  });

  slide.addText(title, {
    x: spacing.marginX + paddingX,
    y: spacing.marginY,
    w: boxWidth - paddingX * 2,
    h: KICKER_HEIGHT,
    margin: 0,
    valign: "middle",
    fontFace: fonts.heading,
    fontSize,
    bold: true,
    color: colors.bgDefault,
    wrap: false,
  });
}

function contentTopY(hasKicker) {
  const { spacing } = theme;
  return hasKicker ? spacing.marginY + KICKER_HEIGHT + KICKER_GAP : spacing.marginY;
}

function contentBottomY(hasPageNumber) {
  const { spacing, slide: slideSize } = theme;
  return hasPageNumber
    ? slideSize.height - spacing.marginY - FOOTER_HEIGHT - FOOTER_GAP
    : slideSize.height - spacing.marginY;
}

/**
 * 画像プレースホルダー(破線+ラベル)。実画像の差し込みは常に公式pptxスキルの責務
 * のため、ここでは枠のみ用意する。
 */
function addImagePlaceholder(slide, { x, y, w, h, label = "IMAGE" }) {
  const { colors, fonts, text } = theme;

  slide.addShape("rect", {
    x,
    y,
    w,
    h,
    fill: { color: colors.bgAccent },
    line: { color: colors.border, width: 1.25, dashType: "dash" },
  });

  slide.addText(label, {
    x,
    y,
    w,
    h,
    align: "center",
    valign: "middle",
    fontFace: fonts.body,
    fontSize: text.small,
    color: colors.textSecondary,
  });
}

function bulletRuns(items, overrides = {}) {
  const { fonts, text, colors } = theme;
  return items.map((item) => ({
    text: item,
    options: {
      bullet: { indent: 18 },
      breakLine: true,
      fontFace: fonts.body,
      fontSize: text.small,
      color: colors.textPrimary,
      paraSpaceAfter: 8,
      ...overrides,
    },
  }));
}

// content: { logoLabel, title, subtitle }。Bold Bento: 右側34%をアンカーセル(プライマリ全面塗り)、
// 左側にタイトル/サブタイトル。角丸・影・アクセントラインは使わない(意図的な様式制約)。
function addTitleSlide(pres, theme, content) {
  const { colors, fonts, text, slide: slideSize, spacing } = theme;
  const { logoLabel = "LOGO", title, subtitle } = content;

  const slide = pres.addSlide();
  slide.background = { color: colors.bgDefault };

  const panelWidth = slideSize.width * 0.34;
  const panelX = slideSize.width - panelWidth;

  slide.addShape("rect", {
    x: panelX,
    y: 0,
    w: panelWidth,
    h: slideSize.height,
    fill: { color: colors.primary },
    line: { type: "none" },
  });

  slide.addText(logoLabel, {
    x: panelX + 0.4,
    y: slideSize.height - 1.0,
    w: panelWidth - 0.8,
    h: 0.5,
    fontFace: fonts.heading,
    fontSize: text.small,
    bold: true,
    color: colors.bgDefault,
    valign: "bottom",
  });

  const leftWidth = panelX;

  slide.addText(title, {
    x: spacing.marginX + 0.1,
    y: slideSize.height * 0.38,
    w: leftWidth - spacing.marginX - 0.5,
    h: 1.3,
    fontFace: fonts.heading,
    fontSize: text.title,
    bold: true,
    color: colors.textPrimary,
    valign: "bottom",
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: spacing.marginX + 0.1,
      y: slideSize.height * 0.38 + 1.35,
      w: leftWidth - spacing.marginX - 0.5,
      h: 0.5,
      fontFace: fonts.body,
      fontSize: text.body,
      color: colors.textSecondary,
      valign: "top",
    });
  }

  return slide;
}

// content: { number, title, description }。Bold Bento: 左52%を淡色セルに章番号を重ね、右48%に
// タイトル/説明。表紙と逆に敢えて淡色セルに留めるのは、全レイアウトが濃色パネルだと単調になるため。
function addSectionSlide(pres, theme, content) {
  const { colors, fonts, text, slide: slideSize } = theme;
  const { number, title, description } = content;

  const slide = pres.addSlide();
  slide.background = { color: colors.bgDefault };

  const leftWidth = slideSize.width * 0.52;

  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: leftWidth,
    h: slideSize.height,
    fill: { color: colors.bgAccent },
    line: { type: "none" },
  });

  if (number) {
    slide.addText(number, {
      x: 0,
      y: 0,
      w: leftWidth,
      h: slideSize.height,
      align: "center",
      valign: "middle",
      fontFace: fonts.heading,
      fontSize: 130,
      bold: true,
      color: colors.primary,
      transparency: 45,
    });
  }

  const rightX = leftWidth + 0.6;
  const rightWidth = slideSize.width - rightX - 0.6;

  slide.addText(title, {
    x: rightX,
    y: slideSize.height * 0.4,
    w: rightWidth,
    h: 1.0,
    fontFace: fonts.heading,
    fontSize: text.title,
    bold: true,
    color: colors.textPrimary,
    valign: "bottom",
  });

  if (description) {
    slide.addText(description, {
      x: rightX,
      y: slideSize.height * 0.4 + 1.05,
      w: rightWidth,
      h: 0.8,
      fontFace: fonts.body,
      fontSize: text.body,
      color: colors.textSecondary,
      valign: "top",
    });
  }

  return slide;
}

// content: { message, contactName?, contactOrg?, contactEmail? }(すべて任意)。連絡先を任意項目
// のみ淡色セルにまとめるのは、組織所属を前提にしないため(個人・フリーランスでも不自然にならない
// 汎用的な連絡先欄)。
function addClosingSlide(pres, theme, content) {
  const { colors, fonts, text, slide: slideSize, spacing } = theme;
  const { message, contactName, contactOrg, contactEmail } = content;

  const slide = pres.addSlide();
  slide.background = { color: colors.bgDefault };

  slide.addText(message, {
    x: spacing.marginX,
    y: 1.85,
    w: slideSize.width - spacing.marginX * 2,
    h: 1.1,
    fontFace: fonts.heading,
    fontSize: text.title,
    bold: true,
    color: colors.textPrimary,
  });

  const contactLines = [contactOrg, contactName, contactEmail].filter(Boolean).join("\n");

  if (contactLines) {
    const boxWidth = 3.2;
    const boxHeight = 0.9;

    slide.addShape("rect", {
      x: spacing.marginX,
      y: 3.3,
      w: boxWidth,
      h: boxHeight,
      fill: { color: colors.bgAccent },
      line: { type: "none" },
    });

    slide.addText(contactLines, {
      x: spacing.marginX + 0.25,
      y: 3.3,
      w: boxWidth - 0.5,
      h: boxHeight,
      valign: "middle",
      fontFace: fonts.body,
      fontSize: text.small,
      color: colors.textSecondary,
      lineSpacingMultiple: 1.3,
    });
  }

  return slide;
}

// opts: { pageNumber }。定型スライドだけでなく、pptx-buildが自由設計するスライドからも
// 呼ばれる(一貫性のため)。共通ヘッダー/フッター帯を持たない方針のため、ページ番号以外の
// 装飾は加えない。
function applyChrome(slide, theme, opts) {
  const { pageNumber } = opts || {};
  if (!pageNumber) return slide;

  const { colors, fonts, text, slide: slideSize, spacing } = theme;

  slide.addText(String(pageNumber).padStart(2, "0"), {
    x: slideSize.width - spacing.marginX - 0.6,
    y: slideSize.height - spacing.marginY - FOOTER_HEIGHT,
    w: 0.6,
    h: FOOTER_HEIGHT,
    fontFace: fonts.body,
    fontSize: text.caption,
    color: colors.textSecondary,
    align: "right",
    valign: "middle",
  });

  return slide;
}

// 定型スライドを代表的なサンプルで呼び出すビジュアルQA用資料。文言は自由に書き換えてよい。自由
// 設計スライドの実例はpptx-buildが都度ゼロから書く対象のため、関数化せずここに直接書き足す
// 一回性のサンプル。
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

  // 自由設計例1: 標準コンテンツ(左タイトル・右淡色セルに箇条書き)。キッカーは使わず、
  // 角丸なし塗りセルという定型スライドと共通の視覚言語を踏襲する。
  {
    const { colors, fonts, text, slide: slideSize, spacing } = theme;
    const slide = pres.addSlide();
    slide.background = { color: colors.bgDefault };

    const bodyTop = contentTopY(false);
    const bodyBottom = contentBottomY(true);
    const bodyHeight = bodyBottom - bodyTop;
    const leftWidth = (slideSize.width - spacing.marginX * 2) * 0.4;
    const rightX = spacing.marginX + leftWidth + spacing.gap;
    const rightWidth = slideSize.width - spacing.marginX - rightX;

    slide.addText("標準コンテンツ", {
      x: spacing.marginX,
      y: bodyTop,
      w: leftWidth,
      h: bodyHeight,
      valign: "middle",
      fontFace: fonts.heading,
      fontSize: text.heading,
      bold: true,
      color: colors.textPrimary,
    });

    slide.addShape("rect", {
      x: rightX,
      y: bodyTop,
      w: rightWidth,
      h: bodyHeight,
      fill: { color: colors.bgAccent },
      line: { type: "none" },
    });

    slide.addText(
      bulletRuns(
        [
          "定型スライドに当てはまらない内容はpptx-buildが都度自由に設計する",
          "色・角丸なしの塗りセルはBold Bentoの視覚言語を踏襲する",
          "文字量が多い場合はスライド分割を検討する",
        ],
        { fontSize: text.small }
      ),
      {
        x: rightX + 0.3,
        y: bodyTop,
        w: rightWidth - 0.6,
        h: bodyHeight,
        valign: "middle",
      }
    );

    applyChrome(slide, theme, { pageNumber: 3 });
  }

  // 自由設計例2: テキスト+画像の非対称ペア(片側アンカーセル+反対側は画像プレースホルダー)。
  // 対等要素の列挙とは異なり、重みの非対称がこのレイアウトの前提。
  {
    const { colors, fonts, text, slide: slideSize } = theme;
    const slide = pres.addSlide();
    slide.background = { color: colors.bgDefault };

    const textWidth = slideSize.width * 0.36;
    const textX = 0;
    const imageX = textWidth;
    const imageWidth = slideSize.width - textWidth;

    slide.addShape("rect", {
      x: textX,
      y: 0,
      w: textWidth,
      h: slideSize.height,
      fill: { color: colors.primary },
      line: { type: "none" },
    });

    slide.addText("テキスト+画像", {
      x: textX + 0.5,
      y: slideSize.height * 0.3,
      w: textWidth - 1.0,
      h: 0.7,
      fontFace: fonts.heading,
      fontSize: text.subheading,
      bold: true,
      color: colors.bgDefault,
    });

    slide.addText(
      bulletRuns(["画像を大きく、テキストは短く要点だけ", "非対称ペアとして扱う"], {
        color: colors.bgDefault,
        fontSize: text.small,
      }),
      {
        x: textX + 0.5,
        y: slideSize.height * 0.3 + 0.75,
        w: textWidth - 1.0,
        h: slideSize.height * 0.45,
        valign: "top",
      }
    );

    addImagePlaceholder(slide, {
      x: imageX,
      y: 0,
      w: imageWidth,
      h: slideSize.height,
      label: "IMAGE PLACEHOLDER",
    });

    applyChrome(slide, theme, { pageNumber: 4 });
  }

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
