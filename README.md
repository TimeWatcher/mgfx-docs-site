# MGFX Documentation Site

This repository contains the standalone documentation site for MGFX, the
Lux-based rendering package for Garry's Mod.

- Live site: <https://timewatcher.github.io/mgfx-docs-site/>
- Chinese documentation: <https://timewatcher.github.io/mgfx-docs-site/zh/>
- Main Lux repository: <https://github.com/TimeWatcher/lux>
- Lux packages repository: <https://github.com/TimeWatcher/lux-packages>

MGFX used to be a direct Lua addon. The current version documented here is the
Lux package `@lux/mgfx`: developers import it from Lux source, compile with
`luxc gmod build`, and let Lux generate the GMod loader and client file
delivery.

## Local Development

Install dependencies:

```powershell
npm install
```

Start the VitePress dev server:

```powershell
npm run dev
```

Build the static site:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview
```

Production files are written to `site_build/`.

## Repository Layout

```text
docs/
  index.md                 English home
  zh/index.md              Simplified Chinese home
  API.md                   English API overview
  zh/API.md                Chinese API overview
  api-reference/           English detailed API pages
  zh/api-reference/        Chinese detailed API pages
  USAGE.md                 Using @lux/mgfx from Lux
  ARCHITECTURE.md          Lux package architecture
  SHADERS.md               Shaderpack and material notes
  .vitepress/              VitePress config and theme
site_build/                Generated static site output
```

## Writing Rules

The site is bilingual. When changing a conceptual page, update the English and
Simplified Chinese versions together.

Documentation should describe the current Lux package architecture:

- Use `@lux/mgfx` imports for new Lux projects.
- Treat `MGFX.*` as an optional installed facade for GLua-facing code.
- Do not document the old hand-written MGFX autorun loader as the primary path.
- Explain generated Lua shape only when it helps Lux developers understand what
  `luxc` emits.

## GitHub Pages

The site is deployed by `.github/workflows/pages.yml`.

For local builds, VitePress uses `/` as the base path. In GitHub Actions, the
workflow sets `GITHUB_PAGES=true`, which switches the base path to
`/mgfx-docs-site/`.

Manual deployment is not needed. Push to `main` and GitHub Actions publishes the
site to:

<https://timewatcher.github.io/mgfx-docs-site/>

## License

The documentation site uses a split license model:

- Site source code, theme code, build scripts, command examples, configuration
  examples, and generated-code snippets are licensed under `MIT OR Apache-2.0`.
- Documentation prose is licensed under `CC-BY-4.0`.
- The documented MGFX runtime package is licensed separately under the Lux MGFX
  Non-Commercial License. Non-commercial use is allowed. Commercial use requires
  a separate written license from the copyright holder.
- The Lux and MGFX names, logos, icons, and other branding assets are not
  licensed for reuse by these open source licenses.

See [LICENSE](LICENSE), [LICENSE-MIT](LICENSE-MIT),
[LICENSE-APACHE](LICENSE-APACHE), [LICENSE-DOCS](LICENSE-DOCS),
[LICENSE-MGFX-NC](LICENSE-MGFX-NC), and [NOTICE](NOTICE).

## 中文说明

这个仓库是 MGFX 的独立文档站。这里记录的是当前 Lux 版本的 MGFX，也就是
`@lux/mgfx` package，而不是旧的纯 Lua addon 加载方式。

常用命令：

```powershell
npm install
npm run dev
npm run build
npm run preview
```

中文文档位于 `docs/zh/`。修改英文概念页时，应同步更新中文页面；修改公开 API 时，
应同步更新 API 总览和对应的详细 API 分组页。
