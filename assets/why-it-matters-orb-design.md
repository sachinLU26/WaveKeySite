---
name: Obsidian Telemetry
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393e'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b20'
  surface-container: '#1e1f24'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e2e8'
  on-surface-variant: '#bbcac0'
  inverse-surface: '#e3e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#85948b'
  outline-variant: '#3c4a42'
  surface-tint: '#45dfa4'
  primary: '#5af0b3'
  on-primary: '#003825'
  primary-container: '#34d399'
  on-primary-container: '#00563b'
  inverse-primary: '#006c4b'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#61efb2'
  on-tertiary: '#003824'
  tertiary-container: '#3fd298'
  on-tertiary-container: '#005639'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#68fcbf'
  primary-fixed-dim: '#45dfa4'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#121318'
  on-background: '#e3e2e8'
  surface-variant: '#34343a'
  surface-obsidian: '#06070B'
  surface-charcoal: '#0B0F17'
  surface-elevated: '#161D2A'
  border-glass: rgba(255, 255, 255, 0.08)
  border-glow: rgba(52, 211, 153, 0.25)
  text-primary: '#F2F3F6'
  text-muted: '#64748B'
  signal-active: '#34D399'
  signal-cyan: '#22D3EE'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 3.5rem
    fontWeight: '600'
    lineHeight: 4rem
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '500'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.75rem
    fontWeight: '500'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-code:
    fontFamily: Space Grotesk
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.12em
  label-ui:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

The design system embodies a mission-critical cybersecurity and technical infrastructure aesthetic. Built for enterprise security architects, cryptographers, and system engineers, the interface evokes calm precision, sovereign control, and acoustic signal clarity. 

The visual style blends **Technical Minimalism** with **Glassmorphism and Low-Contrast Linear Schematics**. The canvas sits in deep void obsidian, broken only by micro-telemetry data lines, faint dot matrices, precise hairline borders, and luminous mint/cyan signal glows. The experience avoids flashy consumer trends, favoring dense legibility, disciplined proportions, and high-performance tactile micro-interactions.

## Colors

The palette is engineered for high-contrast legibility against deep void backgrounds. 

- **Primary (`#34D399`)**: Luminous mint used for core validation states, active telemetry signals, interactive states, and key cryptographic nodes.
- **Secondary (`#22D3EE`)**: Cyan accent used to indicate streaming data, packet flow, connection vectors, and secondary status markers.
- **Tertiary (`#10B981`)**: Grounded emerald supporting deep positive validation states and subtle gradient transitions.
- **Neutral (`#06070B`)**: Deepest void black serving as the foundational floor for all viewport canvases.
- **Layering & Borders**: Structural containment relies on translucent white outlines (`rgba(255, 255, 255, 0.08)`) and tinted obsidian containers (`#0B0F17`, `#161D2A`) rather than opaque gray fills.

## Typography

The typography pairings maintain strict separation between technical telemetry cues and comfortable long-form data reading:

- **Headings & Technical Micro-Copy (`Space Grotesk`)**: Provides architectural weight and geometric precision. All structural metadata, column categories, sub-headers, and architecture tags leverage Space Grotesk in uppercase tracking (`label-code`) to mirror hardware terminals.
- **Interface & Explanatory Prose (`Inter`)**: Carries dense technical instructions, feature specs, and body copy with clear vertical metrics and high contrast.

## Layout & Spacing

Layouts follow a structured **12-column fluid grid** centered within a maximum container width of `1280px`. 

- **Desktop (>= 1024px)**: 12 columns with 24px (`1.5rem`) gutters and generous 48px (`3rem`) page margins. Horizontal flow diagrams and identity stack matrices span balanced 3- or 4-column partitions.
- **Tablet (768px - 1023px)**: 8 columns with 16px (`1rem`) gutters, wrapping architecture cards into dual 4-column clusters.
- **Mobile (< 768px)**: 4 columns with 16px gutters and 20px (`1.25rem`) safe margin bounds. Horizontal telemetry pathways fold into a vertical linear sequence.
- **Background Rhythms**: Content layers sit above a subtle repeating `24px x 24px` dot grid pattern styled at `rgba(255, 255, 255, 0.04)`.

## Elevation & Depth

Visual hierarchy uses tonal surface stacking and hairline glass borders rather than deep dropshadows:

1. **Base Layer (Ground Zero)**: Pure `#06070B` void with optional radial mint ambient spotlight glows (`radial-gradient(circle at 50% 0%, rgba(52, 211, 153, 0.06), transparent 70%)`).
2. **Interactive Cards / Containers**: Surface `#0B0F17` framed by a 1px `border-white/10` stroke. On hover or focus, borders transition to a subtle mint glow (`rgba(52, 211, 153, 0.35)`) with an inner 0 0 20px glow bloom.
3. **Floating Overlays & Tooltips**: Surface `#161D2A` with `backdrop-filter: blur(16px)` and an ambient shadow `0 20px 40px -15px rgba(0, 0, 0, 0.8)`.
4. **Signal Pathways**: Connecting telemetry lines use 1px solid vectors tinted with a linear gradient passing from `rgba(255, 255, 255, 0.1)` to `rgba(52, 211, 153, 0.7)` back to transparent.

## Shapes

The design system uses **Soft** geometry (`0.25rem` / `4px` base radius) to reflect technical hardware units, server blades, and micro-controllers.

- **Badges & Micro-Pills**: `9999px` full roundedness is reserved strictly for status pills and category indicators.
- **Containers, Modules & Cards**: Standard `rounded-lg` (`0.5rem` / `8px`) with precise 1px outlines.
- **Buttons & Input Fields**: `0.375rem` (6px) radius, providing a crisp, engineering-first profile.

## Components

### Buttons
- **Primary Signal**: Background in `#34D399` with text in `#06070B` (bold weight). Hover introduces a cyan glow filter (`box-shadow: 0 0 16px rgba(52, 211, 153, 0.4)`).
- **Secondary Ghost**: Background `rgba(255, 255, 255, 0.03)` with 1px `rgba(255, 255, 255, 0.12)` border. Text in `#F2F3F6`. Hover shifts border to `#34D399`.
- **Destructive**: Hairline crimson border `rgba(239, 68, 68, 0.4)` with transparent background.

### Input Fields & Controls
- **Text Inputs**: Flat `#0B0F17` background with 1px border `rgba(255, 255, 255, 0.1)`. Focus states illuminate the border in `#34D399` alongside an emerald ambient halo. Monospaced or technical placeholder text in `#64748B`.
- **Checkboxes & Radios**: 16px square or circular boxes with 1px borders. Checked state fills with `#34D399` displaying an obsidian SVG checkmark.

### Cards & Architecture Nodes
- Surface panels built on `#0B0F17` featuring top-left micro-icons (phone, code bracket, network globe, CPU chip) in `#34D399`.
- Headings followed by concise descriptive body copy, capped with upper-case `DEPLOYED BY` metadata labels in `#64748B` and entity values in `#F2F3F6`.

### Telemetry Waves & Micro-Badges
- **Signal Nodes**: Subtle audio-frequency waves or concentric broadcast arcs rendered in `#34D399` to communicate out-of-band acoustic or cryptographic handshakes.
- **Status Badges**: Small uppercase text wrapped in 1px borders with a blinking 6px green LED dot (`#34D399`).