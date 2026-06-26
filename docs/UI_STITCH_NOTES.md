# UI Stitch Notes

## Files Inspected

- `stitch_mission_matrix_web_design/mission_matrix/DESIGN.md`
- `stitch_mission_matrix_web_design/mission_matrix_home/code.html`
- `stitch_mission_matrix_web_design/mission_matrix_logo/code.html`
- `stitch_mission_matrix_web_design/mission_matrix_logo/screen.png`
- `stitch_mission_matrix_web_design/shader/code.html`
- `stitch_mission_matrix_web_design/three.js/code.html`

## Detected Design Language

The Stitch prototype presents a futuristic command-center interface named Mission Matrix. The visual style is high-tech, dark-mode, glassmorphic, and HUD-like. For Thucydides, this should become a professional job-search cockpit rather than a generic landing page.

## Colors

Important colors detected:

- Deep navy background: `#041329`, `#0A192F`, `#010e24`
- Glass surfaces: `#112036`, `rgba(16, 30, 54, 0.6)`
- Neon aqua accent: `#64FFDA`, `#38debb`, `#5ffbd6`
- Text: `#d6e3ff`
- Muted text: `#bacac3`, `#85948e`
- Soft red/error: `#ffb4ab`

## Fonts

- Inter for English.
- Rubik and Assistant appear in the prototype and are good candidates for future Hebrew support.
- Phase 0 uses the font-family stack without external font loading.

## Layout Patterns

- Full-screen dark background.
- Glass panels with subtle blur.
- Thin borders with low-opacity white or aqua.
- Glowing active states.
- Uppercase technical labels.
- Dashboard cards and matrix/grid motifs.
- Sidebar command-center navigation fits the product better than the prototype landing-page structure.

## Reusable Components To Build Later

- Job score card
- Dealbreaker warning block
- Role-fit radar
- Pipeline kanban lane
- Resume language toggle
- Agent run log
- Source document uploader
- Job import form
- Gmail thread summary row
- Application checklist

## Shader Background Notes

The shader prototype uses WebGL for moving particles and grid lines. It is visually aligned with Thucydides, but the raw snippet uses inline scripts and should not be pasted into the app. A future implementation should be a typed React component with resize cleanup, reduced-motion support, error handling, and performance caps.

Phase 0 uses a CSS grid and soft glow background instead.

## Three.js Notes

The Three.js prototype creates a glowing wireframe avatar/skill model, but the sample has prototype-quality issues, including duplicate `container` declarations and a selector mismatch. It is useful as direction for a later skills model, not production code.

Phase 0 includes `SkillMatrixPreview` as a lightweight placeholder for the future 3D model.

## Production Warnings

- Do not paste the large generated HTML into Next.js.
- Avoid CDN Tailwind scripts in the app.
- Avoid giant base64 assets in application components.
- Replace inline scripts with typed React components.
- Add reduced-motion and WebGL fallback behavior before production animation work.
- Rename all Mission Matrix branding to Thucydides.

## Renaming Mission Matrix To Thucydides

Mission Matrix should be treated only as the Stitch design reference. The product name, browser metadata, navigation, headings, and documentation should use Thucydides.

