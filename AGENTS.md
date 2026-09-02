# pptx-origin

AI駆動でPPTX資料を生成するためのリポジトリ。

## パイプライン概要

```
clone → setup(依存関係 + 公式pptxスキル導入)
      → デザインシステム作成
      → [任意] 発散/調査(スキップ可)
      → SSOT(md)作成
      → ビルド(SSOT + デザインシステムから.pptxを生成)
      → QA(品質チェック)
```

## 最重要原則

実際に `.pptx` ファイルを組み立てる/編集する処理は**絶対に自前実装しない**。必ず `.agents/skills/pptx/` に導入される公式Anthropic pptxスキルに委譲すること。
自前実装は「決定論的なデザインシステム生成コード」と「工程オーケストレーションの指示文(Skill)」のみに限定する。

## 各工程はSkillとして実装されている

パイプライン各工程の具体的な手順は、以下のSkillに委譲されている(progressive disclosure)。
このファイルには工程の詳細手順を書かない。各Skillの定義を参照すること。

実体は `.agents/skills/` 配下に置かれ、Claude Code用に `.claude/skills/` からシンボリックリンクされている(Claude Codeは `.agents/skills/` を直接は見に行かないため)。

- `.agents/skills/pptx-design-system-init/`
- `.agents/skills/pptx-theme-from-tokens/`
- `.agents/skills/pptx-research/`
- `.agents/skills/pptx-ssot/`
- `.agents/skills/pptx-build/`
- `.agents/skills/pptx-qa/`
