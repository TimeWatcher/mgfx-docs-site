# MGFX Documentation Site

This repository contains the standalone documentation site for MGFX, the
Lux-based rendering package for Garry's Mod.

- Live site: <https://timewatcher.github.io/mgfx-docs-site/>
- Chinese documentation: <https://timewatcher.github.io/mgfx-docs-site/zh/>
- Main MGFX repository: <https://github.com/TimeWatcher/lux-mgfx>
- Main Lux repository: <https://github.com/TimeWatcher/lux>
- Lux packages repository: <https://github.com/TimeWatcher/lux-packages>

MGFX has two first-class implementations. Lux projects import `@lux/mgfx` and
let `luxc gmod build` generate the GMod loader and client delivery. Plain GLua
projects use `lua-mgfx` and include `mgfx/init.lua`; the returned API table is
the primary entry point in both cases. Globals, developer commands, and examples
are optional adapters.

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
  USAGE.md                 Using MGFX from Lux or Plain GLua
  LICENSE.md               Published runtime-license summary
  ARCHITECTURE.md          Lux package architecture
  SHADERS.md               Shaderpack and material notes
  .vitepress/              VitePress config and theme
site_build/                Generated static site output
```

## Writing Rules

The site is bilingual. When changing a conceptual page, update the English and
Simplified Chinese versions together.

Documentation should describe the current library-first architecture:

- Use `@lux/mgfx` imports for new Lux projects.
- Use the table returned by `include("mgfx/init.lua")` for new Plain GLua code.
- Treat the global `MGFX.*` table as a compatibility adapter, not the core API.
- Keep global bridges, devtools, and examples explicitly opt-in in both runtime
  guides.
- Document the thin autorun files only as compatibility loaders.
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
  Community License 1.1. It permits qualifying community-server cost recovery,
  community support, and free plugin development. Commercial server
  monetization, paid plugins, and client work require separate written
  authorization.
- The Lux and MGFX names, logos, icons, and other branding assets are not
  licensed for reuse by these open source licenses.

See [LICENSE](LICENSE), [LICENSE-MIT](LICENSE-MIT),
[LICENSE-APACHE](LICENSE-APACHE), [LICENSE-DOCS](LICENSE-DOCS),
[LICENSE-MGFX-COMMUNITY](LICENSE-MGFX-COMMUNITY), and [NOTICE](NOTICE).

## 中文说明

这个仓库是 MGFX 的独立文档站。Lux 用户导入 `@lux/mgfx`；普通 GLua 用户通过
`include("mgfx/init.lua")` 获取局部 API 表。全局 `MGFX.*`、开发命令和示例都是可选
适配层，不属于默认核心入口。

常用命令：

```powershell
npm install
npm run dev
npm run build
npm run preview
```

中文文档位于 `docs/zh/`。修改英文概念页时，应同步更新中文页面；修改公开 API 时，
应同步更新 API 总览和对应的详细 API 分组页。
