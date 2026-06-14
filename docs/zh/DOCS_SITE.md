# MGFX 文档站

MGFX 文档站使用 VitePress。Markdown 源文件保存在 `docs/`，站点配置在
`docs/.vitepress/`，构建产物输出到 `site_build/`。

## 命令

安装依赖：

```powershell
npm install
```

启动本地开发服务：

```powershell
npm run dev
```

构建静态站点：

```powershell
npm run build
```

预览构建产物：

```powershell
npm run preview
```

旧脚本名仍保留为别名：

```powershell
npm run docs:dev
npm run docs:build
npm run docs:preview
```

## 源文件结构

```text
docs/
  index.md                英文首页
  API.md                  英文 API 总览
  API_REFERENCE.md        旧详细 API URL 的兼容入口
  api-reference/
    index.md
    frame.md
    primitives.md
    images.md
    widgets.md
    text-api.md
    paint.md
  zh/
    index.md              简体中文首页
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

不要手动编辑 `site_build/` 中的生成文件。修改 Markdown 或 VitePress 配置后重新构建。

## 双语维护

MGFX 文档面向 Lux 开发者，因此中英文内容应表达同一套当前 Lux package 架构：

- 英文页面位于 `docs/` 根目录。
- 中文页面位于 `docs/zh/`。
- 改 public API 时，同步更新 `API.md` 和对应的 `api-reference/*.md`。
- 改使用方式、package 入口或全局 facade 时，同步更新 `USAGE.md`。
- 改 module part、realm、loader 或 shaderpack 机制时，同步更新 `ARCHITECTURE.md`
  和 `SHADERS.md`。

`API_REFERENCE.md` 只保留为旧 URL 的兼容入口。详细 API 现在按功能族拆分维护，不依赖
旧 Cloudflare 部署，也不要求本地存在旧站点的生成数据。

## 部署

独立仓库计划部署到 GitHub Pages：

```text
https://timewatcher.github.io/mgfx-docs-site/
```

本地构建使用 `/` 作为 base path。GitHub Actions workflow 会设置
`GITHUB_PAGES=true`，使 VitePress base path 切换为 `/mgfx-docs-site/`。

## 打包边界

MGFX 文档站不是运行时 addon。运行时项目只应该打包 `luxc gmod build` 生成的 GMod
输出，不应该把文档源文件、VitePress 依赖、`site_build/`、Node package files 或
`node_modules/` 放进 GMA。
