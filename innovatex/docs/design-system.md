# InnovateX Design System

## Aesthetic Principles
- **Style**: Linear / GitHub / Vercel grade dark minimalism.
- **Goal**: Telemetry product and precision developer intelligence console.
- **Constraints**: No sci-fi glows, no neon gradients, no decorative orbs, no uppercase tracking-wide jargon.

## Color Tokens
- Root Background: `#09090b` (`--bg-root`)
- Secondary Surface: `#0f0f12` (`--bg-secondary`)
- Tertiary Surface: `#141418` (`--bg-tertiary`)
- Elevated / Cards: `#18181b` (`--bg-elevated`)
- Primary Borders: `#27272a` (`--border-primary`)
- Secondary Borders: `#1e1e22` (`--border-secondary`)
- Primary Text: `#fafafa` (`--text-primary`)
- Secondary Text: `#a1a1aa` (`--text-secondary`)
- Tertiary Text: `#71717a` (`--text-tertiary`)
- Accent: `#3b82f6` (`--accent`)
- Success: `#22c55e` (`--success`)
- Warning: `#eab308` (`--warning`)
- Error: `#ef4444` (`--error`)

## Typography
- Base Font: `Inter`, sans-serif.
- Monospace: `JetBrains Mono`, monospace (tabular figures, code, metrics).
- Hierarchy: h1 (1.5rem / 600), h2 (1.25rem / 600), h3 (1.1rem / 500), body (14px / 1.6).

## Component Styling
- **Buttons**:
  - `.btn-primary`: Solid white background, near-black text, 5px radius.
  - `.btn-secondary`: `#141418` background, 1px `#27272a` border, `#fafafa` text.
  - `.btn-ghost`: Transparent background, hover to `#18181b`.
  - `.btn-danger`: Muted red background, red text, 1px red border.
- **Cards & Panels**:
  - Flat surfaces, 1px hairline border (`#1e1e22`), hover border (`#27272a`).
  - 8px border radius (`--radius-md`).
- **Icons**: Lucide React only, 14–18px strokeWidth 1.5–2.
