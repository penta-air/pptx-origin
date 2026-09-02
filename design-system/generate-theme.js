#!/usr/bin/env node
/**
 * design-system/<brand>/color-definition.json から theme.js を生成する(brand省略時はdefault)。
 * 'default'以外のブランドでcolor-definition.jsonが無い場合はエラーにする(AIがブランド色を
 * 推測しないため)。theme.jsの構造(colors/fonts/text/slide/spacing/shadow)はこのスクリプトでのみ
 * 定義し、他所で再定義しない。
 * 使い方: node design-system/generate-theme.js [brand]
 */

"use strict";

const fs = require("fs");
const path = require("path");

const DESIGN_SYSTEM_DIR = __dirname;
const DEFAULT_BRAND = "default";
const BRAND = process.argv[2] || DEFAULT_BRAND;
const BRAND_DIR = path.join(DESIGN_SYSTEM_DIR, BRAND);
const COLOR_DEFINITION_PATH = path.join(BRAND_DIR, "color-definition.json");
const COLOR_DEFINITION_DEFAULT_PATH = path.join(
  DESIGN_SYSTEM_DIR,
  "color-definition.default.json"
);
const THEME_OUTPUT_PATH = path.join(BRAND_DIR, "theme.js");

/**
 * brand='default'でcolor-definition.jsonが無ければcolor-definition.default.jsonからブートストラップする。
 * それ以外のブランドではエラーにする(色の推測をAIにさせないため)。
 */
function loadColorDefinition() {
  if (!fs.existsSync(COLOR_DEFINITION_PATH)) {
    if (BRAND !== DEFAULT_BRAND) {
      throw new Error(
        `[generate-theme] ${path.relative(
          process.cwd(),
          COLOR_DEFINITION_PATH
        )} が見つかりません。先に design-system/${BRAND}/color-definition.json を` +
          ` 用意してください (pptx-design-system-init Skill 経由で作成できます)。`
      );
    }

    console.warn(
      `[generate-theme] 警告: ${path.relative(
        process.cwd(),
        COLOR_DEFINITION_PATH
      )} が見つかりません。` +
        `デフォルト設定 (${path.relative(
          process.cwd(),
          COLOR_DEFINITION_DEFAULT_PATH
        )}) から作成します。`
    );
    fs.mkdirSync(BRAND_DIR, { recursive: true });
    fs.copyFileSync(COLOR_DEFINITION_DEFAULT_PATH, COLOR_DEFINITION_PATH);
  }

  const raw = fs.readFileSync(COLOR_DEFINITION_PATH, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `[generate-theme] ${COLOR_DEFINITION_PATH} の JSON パースに失敗しました: ${err.message}`
    );
  }

  validateColorDefinition(parsed, COLOR_DEFINITION_PATH);
  return parsed;
}

function validateColorDefinition(def, sourcePath) {
  const requiredPaths = [
    ["brand", "primary"],
    ["brand", "secondary"],
    ["text", "primary"],
    ["text", "secondary"],
    ["background", "default"],
    ["background", "accent"],
    ["font", "heading"],
    ["font", "body"],
  ];

  for (const keys of requiredPaths) {
    let cursor = def;
    for (const key of keys) {
      if (cursor == null || typeof cursor !== "object" || !(key in cursor)) {
        throw new Error(
          `[generate-theme] ${sourcePath} に必須フィールド "${keys.join(
            "."
          )}" がありません。design-system/color-definition.example.json のスキーマを参照してください。`
        );
      }
      cursor = cursor[key];
    }
  }

  if (typeof def.border !== "string") {
    throw new Error(
      `[generate-theme] ${sourcePath} に必須フィールド "border" (文字列) がありません。`
    );
  }
}

function buildThemeSource(colorDefinition) {
  const { brand, text, background, border, font } = colorDefinition;

  const themeObject = {
    colors: {
      primary: brand.primary,
      secondary: brand.secondary,
      textPrimary: text.primary,
      textSecondary: text.secondary,
      bgDefault: background.default,
      bgAccent: background.accent,
      border: border,
    },
    fonts: {
      heading: font.heading,
      body: font.body,
    },
    // pt単位。色に依存しないため固定値。
    text: {
      title: 36,
      heading: 28,
      subheading: 24,
      body: 16,
      small: 14,
      caption: 12,
    },
    // 16:9、固定値
    slide: { width: 10, height: 5.625 },
    spacing: {
      marginX: 0.6,
      marginY: 0.5,
      gap: 0.3,
    },
  };

  const lines = [];
  lines.push(`// design-system/${BRAND}/theme.js`);
  lines.push("//");
  lines.push("// 生成ファイル(design-system/generate-theme.js の出力)。手編集禁止 — 変更は");
  lines.push(
    `// color-definition.json を編集して \`node design-system/generate-theme.js ${BRAND}\` を再実行。`
  );
  lines.push("");
  lines.push('"use strict";');
  lines.push("");
  lines.push("module.exports = {");
  lines.push(`  colors: ${indentObjectLiteral(themeObject.colors, 2)},`);
  lines.push("");
  lines.push(`  fonts: ${indentObjectLiteral(themeObject.fonts, 2)},`);
  lines.push("");
  lines.push(`  text: ${indentObjectLiteral(themeObject.text, 2)},`);
  lines.push("");
  lines.push(`  slide: ${indentObjectLiteral(themeObject.slide, 2)},`);
  lines.push("");
  lines.push(`  spacing: ${indentObjectLiteral(themeObject.spacing, 2)},`);
  lines.push("");
  lines.push("  // PptxGenJS の shadow prop に合わせた形。");
  lines.push("  shadow(opts = {}) {");
  lines.push("    return {");
  lines.push('      type: "outer",');
  lines.push('      color: "000000",');
  lines.push("      blur: opts.blur ?? 4,");
  lines.push("      offset: opts.offset ?? 2,");
  lines.push("      angle: 135,");
  lines.push("      opacity: opts.opacity ?? 0.1,");
  lines.push("    };");
  lines.push("  },");
  lines.push("};");
  lines.push("");

  return lines.join("\n");
}

function indentObjectLiteral(obj, indentLevel) {
  const indent = "  ".repeat(indentLevel);
  const closingIndent = "  ".repeat(indentLevel - 1);
  const entries = Object.entries(obj).map(([key, value]) => {
    const formattedValue =
      typeof value === "string" ? JSON.stringify(value) : String(value);
    return `${indent}${key}: ${formattedValue},`;
  });
  return ["{", ...entries, `${closingIndent}}`].join("\n");
}

function main() {
  const colorDefinition = loadColorDefinition();
  const themeSource = buildThemeSource(colorDefinition);

  fs.mkdirSync(BRAND_DIR, { recursive: true });
  fs.writeFileSync(THEME_OUTPUT_PATH, themeSource, "utf8");

  console.log(
    `[generate-theme] ${path.relative(
      process.cwd(),
      THEME_OUTPUT_PATH
    )} を生成しました。`
  );
}

main();
