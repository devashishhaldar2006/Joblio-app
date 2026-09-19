---
name: Developer Intelligence
colors:
  surface: '#13131a'
  surface-dim: '#13131a'
  surface-bright: '#393840'
  surface-container-lowest: '#0e0e14'
  surface-container-low: '#1b1b22'
  surface-container: '#1f1f26'
  surface-container-high: '#2a2931'
  surface-container-highest: '#34343c'
  on-surface: '#e4e1eb'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e4e1eb'
  inverse-on-surface: '#303037'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#13131a'
  on-background: '#e4e1eb'
  surface-variant: '#34343c'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a futuristic, high-density command center tailored for engineering leaders, software architects, and platform teams. The aesthetic merges precision minimalism with subtle cybernetic cues—prioritizing signal over noise while retaining an unmistakably cutting-edge identity.

The visual style blends sleek dark-mode glassmorphism with high-contrast data visualization. Surfaces mimic polished optical glass hovering in deep space, illuminated by concentrated electric violet and indigo light emitters. Elements maintain clinical geometry, precise spacing, and refined micro-interactions that communicate system responsiveness, technical mastery, and low-latency intelligence.

## Colors

The system uses a calibrated spectral range optimized for low eye strain across extended darkroom sessions, pairing an ultra-deep void canvas (`#0a0a0f`) with illuminated status accents:

- **Canvas & Surface Tier:** Root canvas rests at `#0a0a0f`. Base containers anchor at `#111118`, while elevated cards and panels use translucent overlays of `rgba(255, 255, 255, 0.04)` enclosed by `rgba(255, 255, 255, 0.08)` borders.
- **Primary & Secondary Accelerators:** Primary Indigo (`#6366f1`) drives structural active states, focus highlights, and key brand anchors. Secondary Violet (`#8b5cf6`) drives progressive disclosures, gradients, and secondary visual momentum.
- **Diagnostic Accents:** 
  - Emerald (`#10b981`) denotes clean builds, deployment velocity, and healthy telemetry.
  - Amber (`#f59e0b`) flags pipeline degradation, queue bottlenecks, and memory overhead.
  - Red (`#ef4444`) signals critical regressions, security CVE breaches, and test failures.
- **Micro-Accents & Grids:** Radial dot grids employ `#ffffff` at 4% opacity over the base void. Glowing state indicators deploy soft box-shadows using indigo/violet at 25–40% alpha channels.

## Typography

The typographic hierarchy establishes distinct functional realms:

- **Display & Headlines (Space Grotesk):** Provides structured, geometric rhythm for dashboards, module headers, and metric rollups. Tight tracking creates an engineered, architectural presentation.
- **Body & Controls (Inter):** Highly legible, neutral workhorse engineered for complex analytical dashboards, table views, long-form commit descriptions, and contextual menus.
- **Technical Readouts & Code (JetBrains Mono):** Monospaced utility for branch names, commit SHAs, latency markers, memory allocations, and embedded code chips.

Uppercase technical headings (`label-caps`) should always use expanded tracking (`0.06em`) to establish visual separation against dense metrics.

## Layout & Spacing

The canvas is orchestrated on a strict 8-point spatial rhythm within a fluid 12-column analytical grid. 

- **Desktop (>= 1280px):** 12 columns, 24px gutters, 32px canvas margins. High-density cards and telemetry charts stack and span across 3, 4, 6, or 12 modules.
- **Tablet (768px - 1279px):** 8 columns, 20px gutters, 24px canvas margins. Multi-metric sidecars collapse beneath primary velocity charts.
- **Mobile (< 768px):** 4 columns, 16px gutters, 16px canvas margins. Code chips, status panels, and pipeline traces reflow into vertical full-width stacks.

Background canvas incorporates a persistent structural coordinate mesh: subtle 1px dots spaced at 24px intervals with `rgba(255, 255, 255, 0.04)`, providing alignment landmarks for modular dashboard widgets.

## Elevation & Depth

Visual hierarchy is maintained through translucency, backdrop diffusion, and chromatic edge luminescence rather than heavy opaque drop shadows:

- **Base Void (Level 0):** Hex `#0a0a0f` featuring the structural 24px dot array.
- **Persistent Shell (Level 1):** Hex `#111118` used for side navigation rails, persistent metric headers, and dock bars, separated by 1px stroke `rgba(255, 255, 255, 0.06)`.
- **Glass Panel / Card (Level 2):** Background `rgba(255, 255, 255, 0.04)` paired with `backdrop-filter: blur(16px)`, enclosed in a perimeter border of `1px solid rgba(255, 255, 255, 0.08)`.
- **Active Interactive Glow (Level 3):** Focused inputs, active pipeline runs, and selected nodes introduce dynamic luminescent outlines: `border-color: rgba(99, 102, 241, 0.6)` supported by `box-shadow: 0 0 20px -4px rgba(99, 102, 241, 0.25)`.
- **Overlays & Modals (Level 4):** Elevated glass surfaces using `rgba(17, 17, 24, 0.85)` with `backdrop-filter: blur(24px)` and high-contrast bounding borders `rgba(255, 255, 255, 0.14)`.

## Shapes

The interface embraces a precise, balanced geometry (`roundedness: 2`). Panels, analytical cards, and dialog containers default to an 8px (`0.5rem`) radius, preventing visual clutter in high-density data matrices.

Status badges, pill indicators, and code tokens deviate intentionally from base container shapes:
- **Data Cards & Modules:** 8px to 12px corner radii.
- **Code Chips & Terminal Insets:** 6px corner radii for structured, mechanical alignment.
- **Pill Badges & Live Status Tags:** Fully rounded pill radius (`9999px`) to create distinction between structural layouts and dynamic diagnostic metadata.

## Components

### Buttons
- **Primary Action:** Solid gradient fill from `#6366f1` to `#8b5cf6`, white text (`Inter` 14px, weight 500), 8px border radius, subtle outer glow `box-shadow: 0 0 16px rgba(99, 102, 241, 0.35)`. Hover elevates glow intensity and transitions background opacity to 90%.
- **Ghost / Secondary:** Translucent surface `rgba(255, 255, 255, 0.04)` with `1px solid rgba(255, 255, 255, 0.1)`. Hover state renders `1px solid rgba(99, 102, 241, 0.5)` with text color shifting to `#ffffff`.

### Glassmorphic Cards & Panels
Constructed with `background: rgba(255, 255, 255, 0.04)`, `backdrop-filter: blur(16px)`, and `border: 1px solid rgba(255, 255, 255, 0.08)`. Card headers feature `Space Grotesk` (18px) with actionable telemetry pinned to top-right anchors.

### Badges & Pill Tags
High-gloss indicators with a 9999px radius, 4px horizontal padding, and 2px vertical padding. 
- **Active / Operational:** Background `rgba(16, 185, 129, 0.12)`, border `rgba(16, 185, 129, 0.3)`, text `#10b981`.
- **Degraded / High Load:** Background `rgba(245, 158, 11, 0.12)`, border `rgba(245, 158, 11, 0.3)`, text `#f59e0b`.
- **Pipeline Failure:** Background `rgba(239, 68, 68, 0.12)`, border `rgba(239, 68, 68, 0.3)`, text `#ef4444`.

### Code Chips
Rendered in `JetBrains Mono` (12px), background `rgba(0, 0, 0, 0.4)`, border `1px solid rgba(255, 255, 255, 0.08)`, border radius 6px, and text color `#e2e8f0`. Interactive variants display a copy clipboard micro-affordance on hover.

### Inputs & Search Bars
Command-palette style inputs with deep background `#0a0a0f`, border `1px solid rgba(255, 255, 255, 0.12)`, placeholder text `rgba(255, 255, 255, 0.4)`. Focus state applies a glowing outline: `border-color: #6366f1` and `box-shadow: 0 0 12px rgba(99, 102, 241, 0.3)`. Monospaced hotkey badges (`⌘K`) dock at the right margin.

### Checkboxes & Radio Elements
Minimal square (checkbox) and circular (radio) controls with 2px solid `rgba(255, 255, 255, 0.2)`. Checked states shift to solid `#6366f1` paired with a focused luminescence.