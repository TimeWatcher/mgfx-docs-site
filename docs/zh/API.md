# MGFX API 总览

MGFX 是 Lux package，也是 Garry's Mod 的底层 immediate renderer。它只负责把调用方
每帧传入的显式绘制参数画出来，不拥有 layout、input、focus、组件生命周期、动画状态
或命中测试。

安装、项目结构和导入方式请先看 [在 Lux 中使用 MGFX](./USAGE)。逐函数参数表见
[详细 API 参考](./api-reference/)。

## 两层 API

MGFX 有两层公开表面：

```text
@lux/mgfx module API   Lux 源码中使用的 lower-case export
installed MGFX facade  面向 GLua/旧 panel 的 PascalCase helper
```

新 Lux 代码建议导入 package 并调用 lower-case export：

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"

client fn drawCard(panel, w, h) {
  mgfx.frame.startPanel(panel, w, h)
  mgfx.paint.roundedBoxEx(0, 0, w, h, {
    radius = 8,
    fill = mgfx.style.solid(Color(20, 28, 36, 220)),
  })
  mgfx.frame.endPanel()
}
```

```lua [安装后的 MGFX facade]
function PANEL:Paint(w, h)
    MGFX.StartPanel(self, w, h)
    MGFX.RoundedBoxEx(0, 0, w, h, {
        radius = 8,
        fill = MGFX.Solid(Color(20, 28, 36, 220)),
    })
    MGFX.EndPanel()
end
```

:::

facade 用于旧 GLua panel、第三方调用和渐进迁移。它由客户端 Lux 代码调用
`mgfx.installGlobal("MGFX")` 安装。

## 基本模型

MGFX 的 public API 分两层：

```text
name(...)    高频短签名，适合简单热路径
nameEx(...)  table style 签名，适合高级效果和可读参数
```

安装到 `MGFX.*` facade 后会变成 PascalCase：`RoundedBox(...)`、
`RoundedBoxEx(...)`、`LinearGradient(...)` 等。

所有绘制参数都显式传入。MGFX 没有全局 fill/stroke 状态。描边顺序固定为：

```lua
fill, stroke, strokeWidth
```

`stroke == nil`、`strokeWidth == nil` 或 `strokeWidth <= 0` 表示不绘制描边。

## 帧作用域

```lux
mgfx.frame.startPanel(panel, w, h)
mgfx.frame.endPanel()

mgfx.frame.startScreen(w, h)
mgfx.frame.endScreen()

mgfx.frame.pushClip(x, y, w, h)
mgfx.frame.popClip()
```

所有坐标都相对于当前 active frame。`startPanel` 会读取 panel 的屏幕位置并建立
panel-local 坐标系；调用方不要再手动把本地坐标转换成屏幕坐标。

形状、图像和 widget 通常立即绘制。文本和 clip command 会在 frame 内记录，并在
`endPanel` / `endScreen` 统一 flush，以便文本路由和 composer 能稳定工作。

## 基础图元

```lux
mgfx.paint.roundedBox(x, y, w, h, radius, fill, stroke, strokeWidth)
mgfx.paint.roundedBoxEx(x, y, w, h, style)

mgfx.paint.chamferBox(x, y, w, h, cuts, fill, stroke, strokeWidth)
mgfx.paint.chamferBoxEx(x, y, w, h, style)

mgfx.paint.poly(points, fill, stroke, strokeWidth)
mgfx.paint.polyEx(points, style)

mgfx.paint.line(x1, y1, x2, y2, width, fill)
mgfx.paint.lineEx(x1, y1, x2, y2, style)

mgfx.paint.circle(cx, cy, radius, fill, stroke, strokeWidth)
mgfx.paint.circleEx(cx, cy, radius, style)

mgfx.paint.capsule(x, y, w, h, fill, stroke, strokeWidth)
mgfx.paint.capsuleEx(x, y, w, h, style)
```

`roundedBoxEx` 使用 `style.radius`，`chamferBoxEx` 使用 `style.cuts`，
`lineEx` 使用 `style.width`。`poly` / `polyEx` 的 public contract 是凸多边形；
复杂路径应先拆成凸片段。

## 形状 Backdrop

Backdrop 不是独立 primitive，而是 shape/image 的 style 字段：

```lux
mgfx.paint.roundedBoxEx(x, y, w, h, {
  radius = 12,
  fill = Color(0, 0, 0, 0),
  backdrop = {
    blur = 6,
    tint = Color(8, 14, 24, 110),
    opacity = 1,
  },
})
```

支持的简写：

```lua
backdrop = true
backdrop = 6
backdrop = Color(...)
backdrop = { blur = 6, tint = Color(...), opacity = 0.8 }
```

`style.backdrop` 会按当前 shape coverage 裁剪。Rounded、Circle、Capsule、
Chamfer、Poly、Line、Ring、Arc、Sector 和 Image mask 都使用自己的形状范围来裁剪
blur/tint。不要再使用旧的 `BackdropEx` 思路。

## 图像与遮罩

```lux
mgfx.paint.image(x, y, w, h, source, radius, tint)
mgfx.paint.imageEx(x, y, w, h, source, style)

mgfx.paint.icon(x, y, w, h, source, tint)
mgfx.paint.iconEx(x, y, w, h, source, style)

mgfx.style.mask(kind, spec)
```

`image` 是普通图像路径。需要 `fit`、`crop`、`uv`、`mask`、`outerGlow`、背景
fill 或高级 stroke 时使用 `imageEx`。

显式 mask 写法：

```lux
mask = mgfx.style.mask("rounded", { radius = 8 })
mask = mgfx.style.mask("chamfer", { cuts = { tl = 10, br = 10 } })
mask = mgfx.style.mask("circle")
mask = mgfx.style.mask("capsule")
mask = mgfx.style.mask("texture", {
  source = maskMaterial,
  channel = "a",
})
```

## 组件图元

```lux
mgfx.widgets.progressBar(x, y, w, h, value, radius, track, fill, stroke, strokeWidth)
mgfx.widgets.progressBarEx(x, y, w, h, value, style)

mgfx.widgets.segmentBar(x, y, w, h, value, segments, fill, track)
mgfx.widgets.segmentBarEx(x, y, w, h, value, style)

mgfx.widgets.ring(cx, cy, radius, width, fill)
mgfx.widgets.ringEx(cx, cy, radius, width, style)

mgfx.widgets.arc(cx, cy, radius, startDeg, endDeg, width, fill)
mgfx.widgets.arcEx(cx, cy, radius, width, startDeg, endDeg, style)

mgfx.widgets.sector(cx, cy, innerRadius, outerRadius, startDeg, endDeg, fill)
mgfx.widgets.sectorEx(cx, cy, innerRadius, outerRadius, startDeg, endDeg, style)
```

Ring 和 Arc 的厚度是显式 `width` 参数，不放进 `style.width`。Sector 的环形几何由
`innerRadius, outerRadius` 显式声明；`innerRadius = 0` 表示实心扇形。

## 文本

```lux
mgfx.text.registerFont(name, spec)
mgfx.text.defineStyle(name, style)
mgfx.text.getStyle(name)
mgfx.text.resolveStyle(style)
mgfx.text.measure(text, font)
mgfx.text.measureBox(text, font, w, style)
mgfx.text.prewarm(text, font, style)

mgfx.text.draw(text, font, x, y, color, ax, ay)
mgfx.text.drawEx(text, font, x, y, color, ax, ay, style)

mgfx.text.box(text, font, x, y, w, h, color, alignX, alignY)
mgfx.text.boxEx(text, font, x, y, w, h, style)
```

普通文本走原生 GMod text。Scoreboard 行、玩家名、聊天、日志、表格和快速变化数字，
不需要 shader 特效时应直接走原生文本。

只有需要 gradient fill、shadow、stroke/outline、glow、surface polish 或 shader-side
weight adjust 时，才进入 MGFX whole-run composer。`prewarm` 只对 composer 路径有效。

## 绘制记录、渐变与图案

```lux
mgfx.style.solid(color)
mgfx.style.linearGradient(x1, y1, x2, y2, colorA, colorB)
mgfx.style.linearGradient(x1, y1, x2, y2, stops)
mgfx.style.linearGradientStops(x1, y1, x2, y2, stops)
mgfx.style.radialGradient(cx, cy, radius, colorA, colorB)
mgfx.style.radialGradient(cx, cy, radius, stops)
mgfx.style.conicGradient(cx, cy, rotationDeg, colorA, colorB)
mgfx.style.conicGradient(cx, cy, rotationDeg, stops)
mgfx.style.ringRadialGradient(stops)
mgfx.style.sectorRadialGradient(stops)
mgfx.style.shapeAngularGradient(stops, rotationDeg)
mgfx.style.ringAngularGradient(stops)
mgfx.style.arcAngularGradient(stops)
mgfx.style.sectorAngularGradient(stops)
mgfx.style.stripePattern(spec)
mgfx.style.smokePattern(spec)
```

所有 gradient helper 都支持 stops，并通过统一 LUT 采样。差异只在 `t` 的几何含义：

| Helper | `t` 空间 |
| --- | --- |
| `linearGradient` | primitive-local linear axis |
| `radialGradient` | primitive-local radial distance，并按短边修正避免矩形拉伸 |
| `conicGradient` | 以 normalized center 为中心的完整 360 度角场 |
| `ringRadialGradient` / `sectorRadialGradient` | ring/sector local innerRadius 到 outerRadius |
| `shapeAngularGradient` / `ringAngularGradient` / `arcAngularGradient` / `sectorAngularGradient` | 当前 shape 的 startDeg 到 endDeg |

Pattern 是 shader paint slot，不是几何 recipe。不要在 UI 层把斜线或烟雾拆成大量
`lineEx`。需要大面积 stripe/smoke 时，应补对应 shape 的 pattern shader path。

## 视觉变换

`style.transform` 是绘制阶段的视觉 transform，不改变 layout、input hit test、frame
坐标或矩形 clip。

```lux
local tilt = mgfx.geometry.pointerTilt(mx, my, {
  origin = "50% 50%",
  perspective = 900,
  maxRotateX = 4,
  maxRotateY = 6,
  strength = hoverAmount,
})

if mgfx.geometry.pushTransform(tilt, x, y, w, h) {
  mgfx.paint.roundedBoxEx(x, y, w, h, { radius = 12, fill = panelFill })
  mgfx.widgets.ringEx(cx, cy, 42, 6, { fill = ringFill })
  mgfx.geometry.popTransform()
}
```

## 常见 style 字段

Shape:

```lua
{
  fill = Color(...) or mgfx.style.linearGradient(...),
  stroke = Color(...),
  strokeWidth = 1,
  radius = 8,
  cuts = 8,
  backdrop = { blur = 6, tint = Color(...) },
  innerGlow = { color = Color(...), width = 10, opacity = 0.6 },
  outerGlow = { color = Color(...), width = 18, opacity = 0.6 },
  pattern = mgfx.style.smokePattern(...),
  transform = mgfx.geometry.pointerTilt(mx, my, { perspective = 900 }),
}
```

Image:

```lua
{
  tint = Color(...),
  alpha = 0.9,
  fit = "cover",
  position = { x = 0.5, y = 0.5 },
  crop = { x = 0, y = 0, w = 1, h = 1 },
  uv = { u0 = 0, v0 = 0, u1 = 1, v1 = 1 },
  mask = mgfx.style.mask("chamfer", { cuts = 8 }),
}
```

Ring / Arc / Sector:

```lua
{
  fill = Color(...) or mgfx.style.sectorAngularGradient(...),
  stroke = Color(...),
  strokeWidth = 1,
  backdrop = { blur = 6, tint = Color(...) },
  pattern = mgfx.style.stripePattern(...),
  innerGlow = {...},
  outerGlow = {...},
}
```

## 能力查询

```lux
mgfx.capabilities.get(mgfx.capabilities.TARGET.ROUNDED_BOX)
mgfx.capabilities.supports(mgfx.capabilities.TARGET.RING, "outerGlow")
```

能力表描述的是已经实现的 render slots，不是计划表。当前 shape rendering 以 immediate
shader/fallback path 为主；旧的 shape/data-texture batch prototype 已移除，原因见
[已移除的 Shape 批处理设计](./BATCHING)。
