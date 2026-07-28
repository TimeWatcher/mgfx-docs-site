# MGFX Documentation Site

The MGFX documentation site uses VitePress. Markdown source files live in
`docs/`, the site configuration lives in `docs/.vitepress/`, and the build
output is written to `site_build/`.

## Commands

Install dependencies:

```powershell
npm install
```

Start local development:

```powershell
npm run dev
```

Build the static site:

```powershell
npm run build
```

Preview the built site:

```powershell
npm run preview
```

## Source Layout

```text
docs/
  index.md                English home
  LICENSE.md              runtime-license summary
  API.md                  English API overview
  API_REFERENCE.md        compatibility entry
  api-reference/
    index.md
    frame.md
    primitives.md
    images.md
    widgets.md
    text-api.md
    paint.md
  zh/
    index.md              Simplified Chinese home
    LICENSE.md            Simplified Chinese license summary
    API.md
    API_REFERENCE.md
    api-reference/
      ...
  TEXT.md
  PERFORMANCE.md
  ARCHITECTURE.md
  SHADERS.md
  BATCHING.md
  BATCH_COVERAGE.md
  DOCS_SITE.md
  .vitepress/
    config.mjs
    theme/

site_build/
  generated static output
```

Do not edit generated output by hand. Change Markdown or VitePress config and
rebuild.

When changing public signatures, update both the English and Simplified Chinese
pages. The conceptual overview and the detailed API family page should be
updated together.

When changing runtime entry behavior or licensing, update the matching English
and Simplified Chinese guide/summary pages and the repository license notices in
the same change.

## Deployment

The standalone repository is intended to deploy to GitHub Pages:

```text
https://timewatcher.github.io/mgfx-docs-site/
```

Local builds use `/` as the base path. The GitHub Actions workflow sets
`GITHUB_PAGES=true`, switching the base path to `/mgfx-docs-site/`.

## Package Boundary

The MGFX addon GMA should not include documentation source, VitePress
dependencies, generated site output, Node package files, or `node_modules`.
Those are documentation repository assets, not runtime addon files.
