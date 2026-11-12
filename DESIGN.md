# DESIGN.md: Aprova+ IA Visual System

## Aesthetic Direction
**Civic Editorial & Precision Study Workspace.**
Inspired by official gazettes, financial terminals, and high-craft reference libraries. The visual system avoids generic AI clichés (no purple/violet gradients, no neon cyan-on-dark, no gradient text, no thick left borders, no nested cards, no emoji clutter) in favor of crisp typographic hierarchy, warm paper surfaces, deep navy ink, and semantic status indicators.

## Typography
- **Font Family:** `'Public Sans'`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `sans-serif` for UI and prose; tabular numerals (`font-variant-numeric: tabular-nums`) on all salaries, vacancies, probabilities, and question counts.
- **Scale & Measure:**
  - Base body: `1rem` (`16px`), line-height `1.55`, measure capped at `68ch` (`text-wrap: pretty`).
  - Secondary UI / Metadata: `0.875rem` (`14px`) minimum; compact labels `0.8125rem` (`13px`) minimum — never below `12px`.
  - Headings: `text-wrap: balance`, letter-spacing `-0.025em`, clear weight contrast (`700`–`800`), without decorative kickers or eyebrows above headings.

## Color Tokens
- **Surfaces:**
  - `--bg-canvas`: `#f6f5f1` (Warm editorial stone paper)
  - `--bg-surface`: `#ffffff` (Primary workspace sheet)
  - `--bg-subtle`: `#eeece6` (Toolbar & secondary panel surface)
  - `--bg-header`: `#102338` (Deep civic slate navy)
- **Ink & Contrast (WCAG AA+ Verified):**
  - `--ink-primary`: `#111c24` (16.4:1 on white)
  - `--ink-secondary`: `#334454` (9.8:1 on white)
  - `--ink-muted`: `#4a5d70` (6.7:1 on white, used for placeholders and metadata)
- **Semantic Status Palette:**
  - **Ativo (Edital Aberto):** Forest Emerald (`--status-open-fg: #0f5132`, `--status-open-bg: #d1e7dd`)
  - **Previsto (Radar IA):** Warm Ochre Amber (`--status-radar-fg: #664d03`, `--status-radar-bg: #fff3cd`)
  - **Histórico (Encerrado):** Archive Slate Blue (`--status-past-fg: #084298`, `--status-past-bg: #cfe2ff`)
  - **Primary Action:** Civic Cobalt (`--accent-primary: #0b4f6c`, hover `#083b52`)

## Structural Rules
- **Flat Container Hierarchy:** Never nest cards inside cards. Separate internal sections of an exam sheet using `1px solid var(--border)` hairlines and whitespace.
- **Consistent SVG Iconography:** Use clean inline 16x16 SVG strokes (`stroke-width="1.75"`) rather than Unicode emojis.
- **Browser Surfaces Themed:** Custom `::selection`, `caret-color`, `:focus-visible` outline with offset, and tabular numerals across all data tables and counters.
