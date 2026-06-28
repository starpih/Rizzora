# Rizzora Figma Optimization Plan: Step 1 + Step 2

## Scope

This plan covers the first two implementation steps for the Rizzora Figma design system:

1. Figma page structure cleanup
2. Color/token architecture definition

Do not redesign product screens in this phase. Preserve the current romantic dark luxury visual direction.

## Step 1: Figma Page Structure

### Target Pages

Create or normalize the file into these top-level pages:

1. `00 Cover`
2. `01 Foundations`
3. `02 Components`
4. `03 Product Screens`
5. `99 Archive`

### Current To Target Mapping

| Current location | Target location | Action |
| --- | --- | --- |
| `Component > Luma DS / Foundations and Components > 00 / Cover` | `00 Cover` | Rename and move into dedicated page |
| `Component > 01 / Colors` | `01 Foundations` | Move under Foundations |
| `Component > 02 / Typography` | `01 Foundations` | Move under Foundations |
| `Component > 03 / Spacing, Radius, Border, Shadow, Sizes` | `01 Foundations` | Move under Foundations |
| `Component > 04 / Components` | `02 Components` | Move under Components |
| `Design > home` | `03 Product Screens` | Preserve as screen |
| `Design > Chat` | `03 Product Screens` | Preserve as screen |
| Loose imported social icon library | `99 Archive` or `02 Components / Icons` | Keep only if needed by product |
| Loose frames/components with generic names | `99 Archive` if unused; otherwise move to relevant page | Do not delete |

### Naming Cleanup

Rename the design-system frame and visible labels:

- `Luma DS / Foundations and Components` -> `Rizzora DS / Foundations and Components`
- `设计规范 Design System V1` -> `Rizzora Design System V1`

Check brand spelling:

- `RIZZOARA` should be reviewed against product name `Rizzora`.

### Page Rules

- Deprecated or duplicate content must move to `99 Archive`, not be deleted.
- Product screens must not be visually redesigned during this step.
- Component instances on product screens should remain intact until components are formalized.
- Keep loose experiments out of `01 Foundations` and `02 Components`.

## Step 2: Token Architecture

### Token Model

Use a two-layer token model:

1. Primitive tokens define raw values.
2. Semantic tokens define product usage and alias primitives.

Figma designers should use semantic tokens in components and product screens. Primitive tokens should be referenced by semantic tokens and rarely used directly.

## Color Primitives

### Purple / Background

| Token | Purpose |
| --- | --- |
| `primitive/color/purple/950` | App deepest background |
| `primitive/color/purple/900` | Page background |
| `primitive/color/purple/850` | Sidebar / app shell |
| `primitive/color/purple/800` | Surface base |
| `primitive/color/purple/700` | Elevated surface |
| `primitive/color/purple/600` | Border / active surface |

### Rose / Romance Accent

| Token | Purpose |
| --- | --- |
| `primitive/color/rose/500` | Primary emotional accent |
| `primitive/color/rose/400` | Hover / glow highlight |
| `primitive/color/rose/300` | Soft accent text |
| `primitive/color/rose/200` | Subtle selected outline |

### Gold / Premium Accent

| Token | Purpose |
| --- | --- |
| `primitive/color/gold/500` | Premium highlight |
| `primitive/color/gold/400` | Premium active / badge |
| `primitive/color/gold/300` | Soft premium text |

### Neutral / Text

| Token | Purpose |
| --- | --- |
| `primitive/color/neutral/0` | Pure white |
| `primitive/color/neutral/100` | Primary text |
| `primitive/color/neutral/300` | Secondary text |
| `primitive/color/neutral/500` | Tertiary text |
| `primitive/color/neutral/700` | Disabled text |

### Functional

| Token | Purpose |
| --- | --- |
| `primitive/color/status/success` | Online, success |
| `primitive/color/status/warning` | Warning |
| `primitive/color/status/danger` | Error / danger |
| `primitive/color/status/info` | Informational |

## Semantic Color Tokens

### Background

| Token | Usage |
| --- | --- |
| `color/bg/page` | Main page background |
| `color/bg/app-shell` | Sidebar, persistent navigation |
| `color/bg/surface` | Cards, panels, list rows |
| `color/bg/elevated` | Modals, elevated cards |
| `color/bg/overlay` | Image overlays and modal scrims |
| `color/bg/glass` | Transparent glass surfaces |

### Text

| Token | Usage |
| --- | --- |
| `color/text/primary` | Main readable text |
| `color/text/secondary` | Supporting copy |
| `color/text/tertiary` | Metadata and timestamps |
| `color/text/disabled` | Disabled controls |
| `color/text/inverse` | Text on bright rose or gold backgrounds |
| `color/text/accent` | Rose accent text |
| `color/text/premium` | Gold premium text |

### Action

| Token | Usage |
| --- | --- |
| `color/action/primary/default` | Primary CTA |
| `color/action/primary/hover` | Primary CTA hover |
| `color/action/primary/pressed` | Primary CTA pressed |
| `color/action/primary/disabled` | Primary CTA disabled |
| `color/action/secondary/default` | Secondary CTA |
| `color/action/ghost/default` | Ghost CTA |

### Border

| Token | Usage |
| --- | --- |
| `color/border/default` | Standard card/control border |
| `color/border/strong` | Active containers |
| `color/border/focus` | Input focus |
| `color/border/accent` | Rose selected state |
| `color/border/premium` | Gold premium state |
| `color/border/error` | Error state |

### Product Accent

| Token | Usage |
| --- | --- |
| `color/accent/romance` | Emotional rose accent |
| `color/accent/voice` | Voice message and voice aura |
| `color/accent/premium` | Membership and crown moments |
| `color/accent/online` | Online indicators |
| `color/accent/affinity` | Relationship progress |

### Chat

| Token | Usage |
| --- | --- |
| `color/chat/user/bg` | User message bubble |
| `color/chat/user/text` | User message text |
| `color/chat/companion/bg` | Companion message bubble |
| `color/chat/companion/text` | Companion message text |
| `color/chat/timestamp` | Message time |
| `color/chat/composer/bg` | Message input bar |

### Character Card

| Token | Usage |
| --- | --- |
| `color/card/character/overlay` | Bottom image readability overlay |
| `color/card/character/title` | Character name |
| `color/card/character/meta` | Age, nationality, description |
| `color/card/character/tag/bg` | Tag background |
| `color/card/character/tag/text` | Tag text |
| `color/card/character/tag/border` | Tag outline |

## Spacing Tokens

Use the existing scale and expose it as variables:

| Token | Value |
| --- | --- |
| `spacing/2xs` | 4 |
| `spacing/xs` | 8 |
| `spacing/sm` | 12 |
| `spacing/md` | 16 |
| `spacing/lg` | 20 |
| `spacing/xl` | 24 |
| `spacing/2xl` | 32 |
| `spacing/3xl` | 48 |

## Radius Tokens

| Token | Usage |
| --- | --- |
| `radius/sm` | Small controls and tags |
| `radius/md` | Inputs and buttons |
| `radius/lg` | Cards |
| `radius/xl` | Modals and large panels |
| `radius/full` | Avatars, pills, badges |

## Effect Tokens

### Shadow

| Token | Usage |
| --- | --- |
| `effect/shadow/card` | Character cards and story cards |
| `effect/shadow/elevated` | Raised panels |
| `effect/shadow/modal` | Membership modal |

### Glow

| Token | Usage |
| --- | --- |
| `effect/glow/romance` | Rose emotional emphasis |
| `effect/glow/voice` | Voice aura, active voice message |
| `effect/glow/premium` | Premium CTA and banner |
| `effect/glow/affinity` | Relationship progress highlight |

### Blur / Glass

| Token | Usage |
| --- | --- |
| `effect/blur/glass` | Glass cards and overlays |
| `effect/blur/modal-overlay` | Modal backdrop |

### Gradients

| Token | Usage |
| --- | --- |
| `gradient/action/primary` | Main CTA button |
| `gradient/premium/banner` | Premium banner and plan card |
| `gradient/chat/user-bubble` | User chat bubble |
| `gradient/card/overlay` | Character card image overlay |

## Frontend Token Mapping

Use predictable CSS custom property names:

| Figma token | CSS variable |
| --- | --- |
| `color/bg/page` | `--color-bg-page` |
| `color/bg/surface` | `--color-bg-surface` |
| `color/text/primary` | `--color-text-primary` |
| `color/action/primary/default` | `--color-action-primary-default` |
| `color/accent/voice` | `--color-accent-voice` |
| `color/chat/user/bg` | `--color-chat-user-bg` |
| `spacing/md` | `--spacing-md` |
| `radius/lg` | `--radius-lg` |
| `effect/glow/voice` | `--shadow-glow-voice` |
| `gradient/action/primary` | `--gradient-action-primary` |

## Acceptance Criteria

Step 1 is complete when:

- The Figma file has the five target pages.
- Existing product screens are preserved.
- Deprecated and loose assets are moved to `99 Archive`.
- Foundation and component boards are no longer mixed on one working page.
- The design system is renamed from Luma to Rizzora.

Step 2 is complete when:

- Primitive and semantic token groups are created or documented.
- Product-specific tokens exist for chat, voice, premium, affinity, and character cards.
- Components are ready to use semantic tokens instead of raw color values.
- Frontend naming can map directly to CSS variables.

