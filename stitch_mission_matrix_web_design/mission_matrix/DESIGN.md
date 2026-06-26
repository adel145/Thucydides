---
name: Mission Matrix
colors:
  surface: '#041329'
  surface-dim: '#041329'
  surface-bright: '#2c3951'
  surface-container-lowest: '#010e24'
  surface-container-low: '#0d1c32'
  surface-container: '#112036'
  surface-container-high: '#1c2a41'
  surface-container-highest: '#27354c'
  on-surface: '#d6e3ff'
  on-surface-variant: '#bacac3'
  inverse-surface: '#d6e3ff'
  inverse-on-surface: '#233148'
  outline: '#85948e'
  outline-variant: '#3c4a45'
  surface-tint: '#38debb'
  primary: '#ffffff'
  on-primary: '#00382d'
  primary-container: '#5ffbd6'
  on-primary-container: '#00725e'
  inverse-primary: '#006b58'
  secondary: '#bcc6e6'
  on-secondary: '#263049'
  secondary-container: '#3c4661'
  on-secondary-container: '#aab4d4'
  tertiary: '#ffffff'
  on-tertiary: '#68000f'
  tertiary-container: '#ffdad8'
  on-tertiary-container: '#b6353a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#5ffbd6'
  primary-fixed-dim: '#38debb'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#005142'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#bcc6e6'
  on-secondary-fixed: '#101b33'
  on-secondary-fixed-variant: '#3c4661'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#8c1520'
  background: '#041329'
  on-background: '#d6e3ff'
  surface-variant: '#27354c'
typography:
  h1:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  h2-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system embodies a "High-Tech Professional" aesthetic, specifically tailored for a next-generation career platform. It targets elite technical talent and forward-thinking recruiters. The brand personality is precise, ambitious, and futuristic, evoking a sense of digital intelligence and high-stakes opportunity.

The visual style is a refined **Glassmorphism** set against a deep, immersive background. It utilizes translucent layers with background blurs to create depth without clutter. The interface feels like a sophisticated heads-up display (HUD), featuring glowing neon accents and high-contrast typography to ensure a professional yet cutting-edge experience.

## Colors
The palette is strictly dark-mode, rooted in a deep navy foundation that provides a low-strain environment for high-focus tasks. 

- **Primary (Neon Aqua):** Used for critical actions, progress indicators, and active states. It should appear as a "light source" within the UI.
- **Secondary (Slate Gray):** Used for supporting text, borders, and inactive icons to maintain hierarchy.
- **Accent/Danger (Soft Red):** Reserved for destructive actions, error states, or high-priority alerts.
- **Surfaces:** Utilize semi-transparent variants of the neutral color to achieve the glass effect.

## Typography
The system uses **Inter** for English text to convey a systematic, utilitarian, and clean professional look. For RTL support (Hebrew/Arabic), **Rubik** is the designated companion font due to its modern, geometric structure that aligns with the "Inter" aesthetic.

Hierarchy is strictly enforced through scale and weight. Large headings use tighter letter spacing to maintain a "lock-up" feel, while labels utilize uppercase tracking to evoke a technical, data-driven atmosphere.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum container width of 1280px for desktop. A 12-column system is used for large screens, transitioning to 8 columns for tablets and 4 columns for mobile.

Spacing is based on an 8px rhythm. Content should feel airy and expansive, using the `lg` (48px) and `xl` (80px) units to separate major sections, reinforcing the "Matrix" theme of organized, vast data. 
- **Mobile:** Margins reduce to 16px; gutters reduce to 16px.
- **Desktop:** Margins are flexible but maintain a minimum of 40px to ensure the glass panels have room to "breathe" against the deep navy background.

## Elevation & Depth
Depth is created through **Glassmorphism** rather than traditional shadows.
- **Layers:** Every interactive panel uses a background blur of `20px` and a semi-transparent fill (`rgba(16, 30, 54, 0.6)`).
- **Borders:** Panels are defined by a thin `1px` border with `0.2` opacity, using the Primary color for high-importance items and White for standard containers.
- **Glow:** Elevation is communicated via "Glow States." Instead of a black shadow, higher-elevation elements emit a soft, diffused outer glow using the Primary color (`#64FFDA`) at low opacity (10-15%).

## Shapes
The shape language is "Rounded" to soften the high-tech edge, making the professional platform feel accessible and sophisticated.
- **Standard Radius:** 0.5rem (8px) for cards, inputs, and primary containers.
- **Large Radius:** 1rem (16px) for major modal overlays or section-level glass panels.
- **Buttons:** Follow the standard 8px radius for a sturdy, professional feel, rather than a pill shape.

## Components
- **Buttons:** 
  - *Primary:* Solid Primary color text on a transparent background with a 1px Primary border. On hover, apply a Primary color glow and a 0.1 opacity Primary fill.
  - *Ghost:* Secondary color text and border.
- **Cards:** Use the standard Glassmorphism style (20px blur). On hover, the border opacity increases from 0.2 to 0.5, and a subtle Primary color top-border glow appears.
- **Input Fields:** Dark, semi-transparent backgrounds with a 1px border. Focus state triggers a Primary color border and a faint inner glow. Labels should use the `label-caps` typography style.
- **Chips/Badges:** Small, high-contrast pills with `0.1` Primary fill and `1.0` Primary text.
- **Lists:** Rows separated by a `1px` border (`rgba(255,255,255,0.05)`). Hovering a row should apply a subtle highlight and move the chevron or indicator 4px to the right.
- **Matrix Grid:** A background decorative element consisting of a subtle, low-opacity dot grid or thin lines to reinforce the "Mission Matrix" theme.