# DESIGN.md: Aprova+ IA Visual System

## Aesthetic Direction
**Civic Editorial & Precision Study Workspace.**
Inspired by official gazettes (*Diário Oficial*), financial intelligence terminals, and high-craft reference libraries. The visual system rejects generic AI template clichés (no purple/violet gradients, no neon cyan-on-dark, no gradient text, no thick colored side-borders, no nested cards, no 4-card KPI hero templates, no emoji clutter) in favor of crisp typographic hierarchy, warm stone-paper surfaces, deep civic navy ink, hairlines, and semantic status indicators.

## Typography
- **Font Family:** `'Public Sans'`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `sans-serif` for UI, tables, and prose; tabular numerals (`font-variant-numeric: tabular-nums`) enforced globally on all salaries, vacancies, probabilities, question counts, and study hours.
- **Scale & Measure:**
  - Display / Hero Heading: `2rem` (`32px`), weight `800`, line-height `1.16`, letter-spacing `-0.03em`, `text-wrap: balance`.
  - Section Heading (`h2`): `1.375rem`–`1.5rem` (`22px`–`24px`), weight `800`, letter-spacing `-0.025em`.
  - Dossier / Panel Heading (`h3`): `1.0625rem`–`1.1875rem` (`17px`–`19px`), weight `800`.
  - Base Body: `1rem` (`16px`), line-height `1.55`, prose measure capped at `65ch` (`text-wrap: pretty`).
  - Secondary UI / Data Rows: `0.875rem` (`14px`); compact metadata and badges `0.8125rem` (`13px`) minimum — never below `12px`.
  - Headings carry their own weight without decorative kickers or uppercase eyebrows above them.

## Color Tokens
- **Surfaces:**
  - `--bg`: `#f6f5f1` (Warm editorial stone paper)
  - `--bg-subtle`: `#eceae3` (Toolbar, table header & secondary panel surface)
  - `--bg-dark`: `#102338` (Deep civic slate navy for top telemetry bar, hero workspace, and footer)
  - `--card`: `#ffffff` (Primary workspace sheet)
- **Ink & Contrast (WCAG AA+ Verified):**
  - `--text`: `#111c24` (16.4:1 on white)
  - `--text-secondary`: `#2d3e4e` (10.8:1 on white)
  - `--muted`: `#4a5d70` (6.7:1 on white, used for placeholders and secondary metadata)
- **Semantic Status Palette:**
  - **Ativo (Edital Aberto):** Forest Emerald (`--green: #0f5132`, `--green-soft: #d1e7dd`, `--green-border: #a3cfbb`)
  - **Previsto (Radar IA):** Warm Ochre Amber (`--amber: #664d03`, `--amber-soft: #fff3cd`, `--amber-border: #ffecb5`)
  - **Histórico (Encerrado):** Archive Slate Blue (`--blue: #084298`, `--blue-soft: #cfe2ff`, `--blue-border: #9ec5fe`)
  - **Primary Action:** Civic Cobalt (`--primary: #0b4f6c`, `--primary-hover: #083b52`, `--primary-soft: #e3f0f5`, `--primary-border: #b5d5e2`)
  - **Secondary Editorial Accent:** Terracotta Ochre (`--accent: #8c3d19`, `--accent-hover: #6e2e11`, `--accent-soft: #faeae3`, `--accent-border: #e5b8a4`)

## Architectural Surface Rules
- **Purpose-Built Surface Archetypes (No Repetitive Card Grids):**
  1. **Concursos (`view-explorar`):** Dossier sheets (`.concurso-card`) with internal `1px solid var(--border)` hairlines separating metadata, AI synthesis, and material checklists — zero nested cards.
  2. **Radar IA (`view-radar`):** Asymmetric 2-column intelligence feed (`.radar-workspace`) pairing structured signal dispatches on the left with a sticky collaborative classification panel on the right.
  3. **Acervo de Materiais (`view-materiais`):** Integrated library filter bar (`.acervo-toolbar`) above a continuous hairline document ledger (`.acervo-ledger`).
  4. **Copiloto & Match IA (`view-ia`):** Split analytical workspace (`.ia-workspace`) combining profile calibration and weekly discipline allocation with a structured consultation terminal.
  5. **Plano PRO (`view-premium`):** Comparative feature matrix (`.pro-matrix-panel`) paired with the VIP reservation dossier.
  6. **Minha Conta (`view-conta`):** Flat typographic telemetry ledger (`.account-ledger-bar`) above a 2-column profile & study notebook workspace.
- **Consistent SVG Iconography:** Clean inline `15x15` / `16x16` SVG strokes (`stroke-width="1.85"`) across all controls and status indicators; zero Unicode emojis in UI or AI output.
- **Browser Surfaces Themed:** Custom `::selection`, `caret-color`, `:focus-visible` outline with offset, custom scrollbars, and `tabular-nums` across all data tables and counters.
