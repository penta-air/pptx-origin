// design-system/default/components.js
//
// defaultブランドの固定プリミティブ実装。視覚言語「Bold Bento」: 塗り面(セル)を
// 情報の単位として使い、角丸・影は使わない。アンカーセル(プライマリ全面塗り)は
// レイアウトが非対称な箇所(表紙・章区切り・クロージング・対等要素の主要セル等)限定。
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
 * 違いが失われるため、意図的に共通ヘッダー帯を持たない。タイトル省略時(指標強調など)
 * は呼ばない。
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

// content: { title?, items: [{ heading, body? }] (2〜6件), pageNumber }。全セルを同じ淡色セルに
// 統一し、特定の1件を固定でアンカー化しない——重要な項目はSSOT次第であり、位置で決め打ちすると
// 内容と無関係な強調が毎回同じ場所に出るため。件数ごとの行分割(GRID_ROWS)は固定し、同じ件数
// なら常に同じ配置になる。
const GRID_ROWS = {
  2: [2],
  3: [3],
  4: [2, 2],
  5: [3, 2],
  6: [3, 3],
};

function addPeerGridSlide(pres, theme, content) {
  const { colors, fonts, text, slide: slideSize, spacing } = theme;
  const { title, items = [], pageNumber } = content;

  const slide = pres.addSlide();
  slide.background = { color: colors.bgDefault };

  const hasKicker = Boolean(title);
  if (hasKicker) addKicker(slide, title);

  const count = Math.min(Math.max(items.length, 2), 6);
  const list = items.slice(0, count);
  const rows = GRID_ROWS[count];
  const maxCols = Math.max(...rows);

  const bodyTop = contentTopY(hasKicker);
  const bodyBottom = contentBottomY(Boolean(pageNumber));
  const bodyHeight = bodyBottom - bodyTop;
  const totalWidth = slideSize.width - spacing.marginX * 2;

  const cellWidth = (totalWidth - spacing.gap * (maxCols - 1)) / maxCols;
  const cellHeight = (bodyHeight - spacing.gap * (rows.length - 1)) / rows.length;

  let index = 0;
  rows.forEach((cols, rowIndex) => {
    const rowWidth = cols * cellWidth + spacing.gap * (cols - 1);
    const rowOffsetX = spacing.marginX + (totalWidth - rowWidth) / 2;
    const y = bodyTop + rowIndex * (cellHeight + spacing.gap);

    for (let c = 0; c < cols; c += 1) {
      const item = list[index];
      const x = rowOffsetX + c * (cellWidth + spacing.gap);

      slide.addShape("rect", {
        x,
        y,
        w: cellWidth,
        h: cellHeight,
        fill: { color: colors.bgAccent },
        line: { type: "none" },
      });

      // 半透明の連番は強調ではなく、対等要素であることの順序可視化のための目印。
      slide.addText(String(index + 1).padStart(2, "0"), {
        x: x + 0.2,
        y: y + 0.12,
        w: cellWidth - 0.4,
        h: 0.35,
        fontFace: fonts.heading,
        fontSize: text.subheading,
        bold: true,
        color: colors.primary,
        transparency: 55,
      });

      if (item.body) {
        slide.addText(item.heading, {
          x: x + 0.2,
          y: y + 0.5,
          w: cellWidth - 0.4,
          h: 0.4,
          fontFace: fonts.heading,
          fontSize: text.small,
          bold: true,
          color: colors.textPrimary,
        });

        slide.addText(item.body, {
          x: x + 0.2,
          y: y + 0.9,
          w: cellWidth - 0.4,
          h: cellHeight - 1.05,
          valign: "top",
          fontFace: fonts.body,
          fontSize: text.caption,
          color: colors.textSecondary,
        });
      } else {
        // body省略時(アジェンダ的な単純列挙): heading自体を大きく縦中央に置く。
        slide.addText(item.heading, {
          x: x + 0.2,
          y: y + 0.45,
          w: cellWidth - 0.4,
          h: cellHeight - 0.55,
          valign: "middle",
          fontFace: fonts.heading,
          fontSize: text.subheading,
          bold: true,
          color: colors.textPrimary,
        });
      }

      index += 1;
    }
  });

  applyChrome(slide, theme, { pageNumber });

  return slide;
}

// content: { title?, metrics: [{ value, label, trend? }] (2〜4件), pageNumber }。主指標
// (metrics[0])のみアンカーセルにする非対称は、このレイアウトの目的自体(先頭を主指標として
// 強調する)に由来し、内容依存の決め打ちではない。titleが省略された場合はキッカーを出さない
// (数値自体が内容を語るスライドが多いため)。
function addMetricRowSlide(pres, theme, content) {
  const { colors, fonts, text, slide: slideSize, spacing } = theme;
  const { title, metrics = [], pageNumber } = content;

  const slide = pres.addSlide();
  slide.background = { color: colors.bgDefault };

  const hasKicker = Boolean(title);
  if (hasKicker) addKicker(slide, title);

  const count = Math.min(Math.max(metrics.length, 2), 4);
  const list = metrics.slice(0, count);
  const [primary, ...rest] = list;
  const trendGlyph = { up: "▲", down: "▼", flat: "→" };

  const bodyTop = contentTopY(hasKicker);
  const bodyBottom = contentBottomY(Boolean(pageNumber));
  const bodyHeight = bodyBottom - bodyTop;

  const primaryWidth = (slideSize.width - spacing.marginX * 2 - spacing.gap) * 0.42;
  const restX = spacing.marginX + primaryWidth + spacing.gap;
  const restWidth = slideSize.width - spacing.marginX - restX;

  slide.addShape("rect", {
    x: spacing.marginX,
    y: bodyTop,
    w: primaryWidth,
    h: bodyHeight,
    fill: { color: colors.primary },
    line: { type: "none" },
  });
  slide.addText(primary.value, {
    x: spacing.marginX + 0.3,
    y: bodyTop + 0.3,
    w: primaryWidth - 0.6,
    h: bodyHeight * 0.55,
    valign: "bottom",
    fontFace: fonts.heading,
    fontSize: 40,
    bold: true,
    color: colors.bgDefault,
  });
  slide.addText(
    primary.trend ? `${primary.label} ${trendGlyph[primary.trend] ?? ""}` : primary.label,
    {
      x: spacing.marginX + 0.3,
      y: bodyTop + bodyHeight * 0.55 + 0.15,
      w: primaryWidth - 0.6,
      h: 0.4,
      fontFace: fonts.body,
      fontSize: text.small,
      color: colors.bgDefault,
    }
  );

  const restCellHeight =
    (bodyHeight - spacing.gap * (rest.length - 1)) / Math.max(rest.length, 1);
  rest.forEach((metric, index) => {
    const y = bodyTop + index * (restCellHeight + spacing.gap);

    slide.addShape("rect", {
      x: restX,
      y,
      w: restWidth,
      h: restCellHeight,
      fill: { color: colors.bgAccent },
      line: { type: "none" },
    });
    slide.addText(metric.value, {
      x: restX + 0.25,
      y: y + 0.1,
      w: restWidth - 0.5,
      h: restCellHeight * 0.55,
      valign: "bottom",
      fontFace: fonts.heading,
      fontSize: text.heading,
      bold: true,
      color: colors.primary,
    });
    slide.addText(
      metric.trend ? `${metric.label} ${trendGlyph[metric.trend] ?? ""}` : metric.label,
      {
        x: restX + 0.25,
        y: y + restCellHeight * 0.6,
        w: restWidth - 0.5,
        h: restCellHeight * 0.35,
        fontFace: fonts.body,
        fontSize: text.caption,
        color: colors.textSecondary,
      }
    );
  });

  applyChrome(slide, theme, { pageNumber });

  return slide;
}

// opts: { pageNumber }。固定プリミティブだけでなく、pptx-buildが自由設計するスライドからも
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

// 固定プリミティブを代表的なサンプルで呼び出すビジュアルQA用デッキ。addPeerGridSlideは件数を
// 変えて2回呼び、ブロックサイズのロジックの一貫性を確認する。文言は自由に書き換えてよい。自由
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
  // 角丸なし塗りセルという固定プリミティブと共通の視覚言語を踏襲する。
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
          "固定プリミティブに当てはまらない内容はpptx-buildが都度自由に設計する",
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

  addPeerGridSlide(pres, theme, {
    title: "対等な要素の列挙(3件)",
    items: [
      { heading: "特徴A", body: "説明文A" },
      { heading: "特徴B", body: "説明文B" },
      { heading: "特徴C", body: "説明文C" },
    ],
    pageNumber: 4,
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
    pageNumber: 5,
  });

  addMetricRowSlide(pres, theme, {
    title: "指標の強調",
    metrics: [
      { value: "120%", label: "主要指標", trend: "up" },
      { value: "45件", label: "指標2" },
      { value: "8.2", label: "指標3", trend: "flat" },
    ],
    pageNumber: 6,
  });

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

    applyChrome(slide, theme, { pageNumber: 7 });
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
  addPeerGridSlide,
  addMetricRowSlide,
  applyChrome,
  buildSamplePresentation,
};
