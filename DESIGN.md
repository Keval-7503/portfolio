# Design System

Status: Proposed visual baseline; identity-specific art awaits owner content.  
Visual thesis: **The Engineer's Field Notebook** — a precise technical workspace interrupted by a curious original robot companion, combining editorial clarity with controlled neobrutalist energy.

## Principles

1. Professional information is always easier to read than the decoration around it.
2. Thick outlines, offset shadows, strong color blocks, and asymmetry create character; they do not reduce hierarchy or touch usability.
3. Motion explains state, relationships, or personality and stops under reduced-motion preferences.
4. Public pages are expressive and narrative; administration is dense, calm, and operational.
5. Unknown owner information remains absent or explicitly editable—never replaced by fictional copy.

## Color tokens

Candidate palette selected for testing, not yet claimed WCAG-compliant in every pairing:

| Token | Value | Intended use |
|---|---:|---|
| `ink` | `#14130F` | Primary text, borders |
| `paper` | `#FFF7E6` | Main background |
| `white` | `#FFFFFF` | Reading surfaces |
| `signal-yellow` | `#FFD43B` | Primary emphasis |
| `cobalt` | `#2F6BFF` | Links, selected states |
| `hot-pink` | `#FF5FA2` | Secondary playful accent |
| `violet` | `#7957FF` | Research/AI accent |
| `mint` | `#59E3B1` | Confirmed/success state only |
| `danger` | `#D92D20` | Errors/destructive actions |

All text/background pairs require measured contrast before implementation. Color never carries status alone.

## Typography

- Display: a bold variable grotesk with a lawful webfont license, self-hosted where practical.
- Body: highly legible sans serif with broad language support.
- Code/data: a compact monospace used only for technical metadata.
- Base body size: 1rem minimum, line height approximately 1.55–1.7.
- Regular control labels: 0.875rem minimum; metadata may use 0.75–0.8125rem when nonessential.
- Display sizes use `clamp()` and must survive 200% text enlargement without clipping.

Exact font selection is deferred until licensing, load performance, and rendering tests are complete.

## Geometry and spacing

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px equivalents.
- Primary border: 3 px `ink`; compact admin border: 2 px.
- Public card radius: 0–12 px depending on motif; do not make every surface a floating rounded rectangle.
- Signature shadow: 6 px 6 px 0 `ink`; pressed state translates to 3 px and reduces shadow.
- Content widths: reading measure 65–75 characters; wide collections use a responsive grid.

## Composition

The homepage uses a two-column editorial hero on wide screens: identity and direct actions on the left, original character art and a compact “currently exploring” panel on the right. On small screens, text and primary actions precede art. Section dividers resemble annotated notebook tabs rather than generic centered headings.

Project and research indexes prioritize search/filter results in the first useful viewport. Detail pages use a sticky evidence rail for repository/publication links and a readable narrative column.

## Components

- Buttons: primary filled yellow, secondary white, quiet text link; all have visible focus, disabled, loading, and pressed states.
- Cards: content-specific layouts rather than one universal card. Every card has a semantic heading and a single clear primary target.
- Navigation: skip link, responsive disclosure menu, current-page indication beyond color.
- Forms: persistent labels, descriptions where needed, inline errors tied with `aria-describedby`, error summary for multi-field forms.
- Dialogs: use an accessible primitive with focus trap, labelled title, escape handling, and return focus.
- Tables: admin-only where comparative density helps; responsive alternatives preserve headings.
- Toasts: supplementary only; important outcomes remain in the document and use live-region announcements.
- Empty states: state what is unavailable and, in admin, provide the authorized next action. Public empty states never expose draft counts.

## Original character system

Create one original non-human “workbench robot” with a square silhouette, antenna-like pencil, and expressive screen face. It may appear in the hero, loading/empty states, and section transitions. It must not resemble a recognizable existing character or be assembled as CSS decoration. Final raster/illustrated assets should be created through an approved original-art workflow after the owner approves the direction.

Animation states:

- Idle blink at a low frequency and paused offscreen.
- Short typing loop only when an AI/admin task is actively processing.
- Cursor reaction is decorative, coarse-pointer-safe, and never required.
- Reduced-motion mode shows static key poses.

## Motion system

- Micro-interactions: 100–180 ms.
- Page/section reveals: 200–350 ms, once, opacity plus modest transform.
- Use transforms and opacity; avoid layout-thrashing animation.
- No auto-moving content, parallax that impairs reading, or continuous high-CPU background loops.
- `prefers-reduced-motion: reduce` removes nonessential transforms, smooth scrolling, loops, and staggered reveals.

## Responsive behavior

- Content-first breakpoints based on layout failure, not device brands.
- Minimum target size approximately 44×44 CSS px for frequent touch actions.
- Filters collapse into an accessible sheet/disclosure on narrow screens while active filters remain visible.
- Timelines become a simple stacked sequence on mobile; chronology remains available to assistive technology.
- No information or action depends on hover.

## Accessibility verification

- WCAG 2.2 AA target; automated tooling is necessary but insufficient.
- Test keyboard order, focus visibility, zoom/reflow, landmarks, heading order, names/descriptions, errors, dialogs, contrast, touch targets, forced colors, reduced motion, and representative screen readers.
- Illustrations use meaningful alt text only when they add information; purely decorative art has empty alt text.

## Public vs admin

Public surfaces use larger type, asymmetry, illustration, and expressive transitions. Admin surfaces retain the same color identity but use smaller shadows, stable grids, restrained animation, persistent status labels, and high information density. Destructive actions are visually and spatially separated from routine publishing actions.
