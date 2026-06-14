---
layout: home

hero:
  name: "MGFX"
  text: "Modern GMod FX"
  tagline: "面向 Garry's Mod 的 Lux 渲染 package。开发者在 Lux 中导入 @lux/mgfx，由 luxc 生成 GMod loader；只有需要兼容 GLua 调用时才安装 MGFX.* 全局 API。"
  actions:
    - theme: brand
      text: 在 Lux 中使用
      link: /zh/USAGE
    - theme: alt
      text: API 参考
      link: /zh/API
    - theme: alt
      text: English
      link: /

features:
  - title: 原生 Lux package
    details: MGFX 位于 @lux/mgfx，使用 module part、client realm export 和编译器生成的 GMod loader，不再手写 include 顺序。
  - title: 按形状裁剪的效果
    details: Rounded、Chamfer、Circle、Capsule、Ring、Arc、Sector、Image mask 都按自身覆盖范围处理 glow 和 backdrop。
  - title: 完整 stop 渐变
    details: Linear、Radial、Conic、Ring/Sector local radial、Shape angular 都走统一 LUT stop 路径。
  - title: 矩阵参数上传
    details: 热路径参数优先用 $viewprojmat / c11 一次上传，SetFloat 只作为辅助参数页。
---

## 从 Lux 快速开始

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"

client fn paintPanel(panel, w, h) {
  mgfx.frame.startPanel(panel, w, h)

  mgfx.paint.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = mgfx.style.linearGradient(0, 0, 1, 1, {
      {0.00, Color(30, 130, 255, 230)},
      {0.55, Color(60, 200, 255, 230)},
      {1.00, Color(255, 210, 110, 230)},
    }),
    backdrop = { blur = 8, tint = Color(0, 8, 12, 120) },
  })

  mgfx.widgets.progressBarEx(24, 84, w - 48, 10, 0.72, {
    radius = 5,
    track = Color(10, 18, 24, 190),
    fill = mgfx.style.linearGradient(
      0, 0, 1, 0,
      Color(30, 130, 255, 230),
      Color(60, 200, 255, 230)
    ),
  })

  mgfx.frame.endPanel()
}
```

```lua [生成 Lua 形状]
local mgfx = __lux_import("@lux/mgfx")

local function paintPanel(panel, w, h)
  mgfx.frame.startPanel(panel, w, h)
  mgfx.paint.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = mgfx.style.linearGradient(0, 0, 1, 1, {
      {0.00, Color(30, 130, 255, 230)},
      {0.55, Color(60, 200, 255, 230)},
      {1.00, Color(255, 210, 110, 230)},
    }),
    backdrop = {
      blur = 8,
      tint = Color(0, 8, 12, 120),
    },
  })
  mgfx.widgets.progressBarEx(24, 84, w - 48, 10, 0.72, {
    radius = 5,
    track = Color(10, 18, 24, 190),
    fill = mgfx.style.linearGradient(
      0, 0, 1, 0,
      Color(30, 130, 255, 230),
      Color(60, 200, 255, 230)
    ),
  })
  mgfx.frame.endPanel()
end
```

:::

## 文档入口

<div class="mgfx-capability-grid">
  <a href="./USAGE">
    <span>开始</span>
    <strong>在 Lux 中使用</strong>
    <small>安装 luxc、导入 @lux/mgfx、按需暴露 MGFX.*，并构建生成后的 GMod addon。</small>
  </a>
  <a href="./API">
    <span>API</span>
    <strong>总览</strong>
    <small>帧作用域、图元、图像、组件、文本、绘制记录、视觉变换和能力查询。</small>
  </a>
  <a href="./api-reference/">
    <span>参考</span>
    <strong>详细 API</strong>
    <small>按功能分组的逐函数参数表、注意事项、返回值和示例。</small>
  </a>
  <a href="./PERFORMANCE">
    <span>性能</span>
    <strong>性能模型</strong>
    <small>immediate 路径、matrix 参数上传、pattern 数学化和分配规则。</small>
  </a>
  <a href="./ARCHITECTURE">
    <span>架构</span>
    <strong>Lux package 内部结构</strong>
    <small>旧 Lua addon 如何被 module part、运行域导出、package import 和生成 loader 取代。</small>
  </a>
  <a href="./SHADERS">
    <span>Shader</span>
    <strong>Shader 与打包</strong>
    <small>shaderpack 构建、参数布局、gradient LUT、GMA 校验和踩坑记录。</small>
  </a>
</div>

## 核心边界

MGFX 是 Lux package，也是底层 renderer，不是 UI framework。它不拥有 layout、input、focus、component lifecycle 或 transition state。调用方每帧计算当前视觉状态，再把明确的 draw arguments 传给 Lux module API，或传给安装后的 `MGFX.*` facade。

文本也不是“全部进 MGFX composer”。普通文本优先走原生 GMod text；只有需要 shader text effects 的内容才进入 whole-run composer。

## 维护规则

- 改 public API 时，同步更新 [API 总览](./API) 和对应的 [详细 API 分组页](./api-reference/)。
- 改 shader 参数布局、gradient LUT、alpha 处理或 shaderpack 构建时，同步更新 [Shader 构建与打包](./SHADERS)。
- 改性能路径时，同步更新 [MGFX 性能模型](./PERFORMANCE)。
- 不要手改 `site_build/` 产物；修改 `docs/` 源文件后重新构建。

## 示例：轮盘扇区

::: code-group

```lux [Lux]
local fill = mgfx.style.sectorAngularGradient({
  {0.00, Color(35, 212, 232, 170)},
  {0.52, Color(80, 220, 160, 150)},
  {1.00, Color(245, 158, 11, 135)},
})

mgfx.widgets.sectorEx(cx, cy, innerR, outerR, startDeg, endDeg, {
  fill = fill,
  stroke = Color(255, 255, 255, 34),
  strokeWidth = 1,
  backdrop = { blur = 7, tint = Color(4, 10, 14, 120) },
  innerGlow = { color = Color(255, 96, 78, 90), width = 28 },
  transform = mgfx.geometry.pointerTilt(mx, my, {
    perspective = 900,
    maxRotateX = 4,
    maxRotateY = 6,
  }),
})
```

```lua [安装后的 MGFX facade]
local fill = MGFX.SectorAngularGradient({
    {0.00, Color(35, 212, 232, 170)},
    {0.52, Color(80, 220, 160, 150)},
    {1.00, Color(245, 158, 11, 135)},
})

MGFX.SectorEx(cx, cy, innerR, outerR, startDeg, endDeg, {
    fill = fill,
    stroke = Color(255, 255, 255, 34),
    strokeWidth = 1,
    backdrop = {blur = 7, tint = Color(4, 10, 14, 120)},
    innerGlow = {color = Color(255, 96, 78, 90), width = 28},
    transform = MGFX.PointerTilt(mx, my, {
        perspective = 900,
        maxRotateX = 4,
        maxRotateY = 6,
    }),
})
```

:::
