# Working rules

## Deliver in one pass — no verification loops

The quality bar stays high: sections must match the design closely and the responsive
breakpoints must be written properly. Reach that quality in one careful pass, not through
repeated measure/render/compare cycles.

- Take the measurements needed (design JPG/PSD, asset sizes, colors, spacing) **once**,
  up front, before writing code — not as a build-then-adjust loop.
- Write all breakpoints (`$xxl / $xl / $lg / $md / $xs`) correctly the first time from
  those numbers, instead of rendering at four widths to discover what breaks.
- At most **one** render/screenshot to confirm the result. Then stop.
- If something genuinely needs a second look, ask — don't start another loop.

## Stop when the task is done

Once the work works, stop. No bonus screenshots, no extra checks, no re-auditing what
already passed.

## Reporting

Report in 2–4 lines: what changed and in which files (as clickable paths). No long recaps,
no restating what the user already saw.

## Markup / style conventions

- Follow the existing naming and nesting conventions of the file being edited.
- Write styles in the SCSS partials only — never hand-edit the compiled CSS.
- **Don't run the sass compiler.** A watcher already compiles
  `assets/scss/main.scss` → `assets/css/main.css` automatically on save; running
  `sass` manually is unnecessary work.
- Match the surrounding comment density and indentation (tabs where the file uses tabs).

## Images: never reference them from CSS / SCSS / JS

- No image file may be called from SCSS, CSS or JS — no `url(...)` for `background`,
  `background-image`, `mask`, `mask-image`, `border-image`, `content`, etc.
- Every image goes in the **HTML**: an `<img>` tag, or — when it has to act as a
  background / mask — a data attribute on the element, which `assets/js/main-common.js`
  already applies:
  - `data-background="assets/img/..."` → `background-image`
  - `data-mask-image="assets/img/..."` → `mask-image`
- SCSS only controls the *presentation* of that image (`background-size`, `-position`,
  `-repeat`, `mask-size`, `mask-repeat`, …), never the file itself.
- Gradients and inline `data:` SVGs are not image files; those can stay in SCSS.
- Existing `url()` calls in older partials are not to be copied; leave them unless asked
  to migrate them.

## Images: every `<img>` sits in a `<div>` wrapper

- An `<img>` tag never gets a class and is never styled — no `img { … }` or `.x img { … }`
  rules in SCSS.
- Every `<img>` goes inside its own `<div>` wrapper; the wrapper carries the class and all the
  sizing, positioning, radius, filter, etc.
- When the image has to cover its box, the wrapper also takes `wa-img-cover wa-fix`
  (`_utility.scss`: the `img` inside fills the wrapper with `object-fit: cover`, and
  `wa-fix` hides the overflow). The wrapper's own width / height / aspect-ratio come from SCSS.
- Existing `<img class="…">` and `img` rules in older sections are not to be copied; leave them
  unless asked to migrate them.
