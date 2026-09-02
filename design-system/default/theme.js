// design-system/default/theme.js
//
// 生成ファイル(design-system/generate-theme.js の出力)。手編集禁止 — 変更は
// color-definition.json を編集して `node design-system/generate-theme.js default` を再実行。

"use strict";

module.exports = {
  colors: {
    primary: "15803D",
    secondary: "A16207",
    textPrimary: "434343",
    textSecondary: "595959",
    bgDefault: "FFFFFF",
    bgAccent: "F3F3F3",
    border: "D9D9D9",
  },

  fonts: {
    heading: "Noto Sans JP",
    body: "Noto Sans JP",
  },

  text: {
    title: 36,
    heading: 28,
    subheading: 24,
    body: 16,
    small: 14,
    caption: 12,
  },

  slide: {
    width: 10,
    height: 5.625,
  },

  spacing: {
    marginX: 0.6,
    marginY: 0.5,
    gap: 0.3,
  },

  // PptxGenJS の shadow prop に合わせた形。
  shadow(opts = {}) {
    return {
      type: "outer",
      color: "000000",
      blur: opts.blur ?? 4,
      offset: opts.offset ?? 2,
      angle: 135,
      opacity: opts.opacity ?? 0.1,
    };
  },
};
