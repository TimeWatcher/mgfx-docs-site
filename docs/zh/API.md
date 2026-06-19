# MGFX API 总览

MGFX 是 Lux package，也是 Garry's Mod 的底层 immediate renderer。它只负责把调用方
每帧传入的显式绘制参数画出来，不拥有 layout、input、focus、组件生命周期、动画状态
或命中测试。

安装、项目结构和导入方式请先看 [使用 MGFX](./USAGE)。逐函数参数表见
[详细 API 参考](./api-reference/)。

## 两层 API

MGFX 有两层公开表面：

```text
mgfx.api.*             Lux 源码中使用的 lower-case API
installed MGFX facade  面向 GLua/旧 panel 的 PascalCase helper
```

新 Lux 代码建议导入 package 并调用 `mgfx.api.*`：

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"

client fn drawCard(panel, w, h) {
  mgfx.api.startPanel(panel, w, h)
  mgfx.api.roundedBoxEx(0, 0, w, h, {
    radius = 8,
    fill = mgfx.api.solid(Color(20, 28, 36, 220)),
  })
  mgfx.api.endPanel()
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

## 先按需求选 API

多数 UI 不需要先想“primitive、widget、paint 该去哪一页”。先按要画的东西选入口：

| 需求 | Lux API | 安装后的 MGFX facade |
| --- | --- | --- |
| 普通面板、按钮、列表行 | `mgfx.api.roundedBoxEx` | `MGFX.RoundedBoxEx` |
| 切角科幻面板 | `mgfx.api.chamferBoxEx` | `MGFX.ChamferBoxEx` |
| 正三角形、五边形、六边形徽章 | `mgfx.api.regularPolyEx` | `MGFX.RegularPolyEx` |
| 方向箭头 | `mgfx.api.caretEx` | `MGFX.CaretEx` |
| 任意凸多边形 | `mgfx.api.polyEx` | `MGFX.PolyEx` |
| 头像、图标、装备图 | `mgfx.api.imageEx` / `mgfx.api.iconEx` | `MGFX.ImageEx` / `MGFX.IconEx` |
| 血条、装填条 | `mgfx.api.progressBarEx` | `MGFX.ProgressBarEx` |
| 弹药格、离散充能 | `mgfx.api.segmentBarEx` | `MGFX.SegmentBarEx` |
| 圆形读条、仪表 | `mgfx.api.ringEx` / `mgfx.api.arcEx` | `MGFX.RingEx` / `MGFX.ArcEx` |
| 轮盘菜单 wedge | `mgfx.api.sectorEx` | `MGFX.SectorEx` |
| 普通文本、表格、玩家名 | `mgfx.api.text` 或原生 GMod text | `MGFX.Text` |
| 描边、glow、渐变字面文本 | `mgfx.api.textEx` | `MGFX.TextEx` |
| 渐变、条纹、烟雾填充 | `mgfx.api.linearGradient` / `stripePattern` / `smokePattern` | `MGFX.LinearGradient` / `MGFX.StripePattern` / `MGFX.SmokePattern` |

常见写法是：简单热路径用短签名；一旦参数开始需要解释，就切到 `Ex(..., style)`。
GLua 用户可以继续像 `draw.RoundedBox` 那样直接调用 facade，不需要额外封装一层复杂 helper。

## 帧作用域

```lux
mgfx.api.startPanel(panel, w, h)
mgfx.api.endPanel()

mgfx.api.startScreen(w, h)
mgfx.api.endScreen()

mgfx.api.pushClip(x, y, w, h)
mgfx.api.popClip()
```

所有坐标都相对于当前 active frame。`startPanel` 会读取 panel 的屏幕位置并建立
panel-local 坐标系；调用方不要再手动把本地坐标转换成屏幕坐标。

形状、图像和 widget 通常立即绘制。文本和 clip command 会在 frame 内记录，并在
`endPanel` / `endScreen` 统一 flush，以便文本路由和 composer 能稳定工作。

## 基础图元

```lux
mgfx.api.roundedBox(x, y, w, h, radius, fill, stroke, strokeWidth)
mgfx.api.roundedBoxEx(x, y, w, h, style)

mgfx.api.chamferBox(x, y, w, h, cuts, fill, stroke, strokeWidth)
mgfx.api.chamferBoxEx(x, y, w, h, style)

mgfx.api.regularPoly(cx, cy, radius, sides, rotation, fill, stroke, strokeWidth)
mgfx.api.regularPolyEx(cx, cy, radius, sides, style)

mgfx.api.diamond(x, y, w, h, fill, stroke, strokeWidth)
mgfx.api.diamondEx(x, y, w, h, style)

mgfx.api.caret(x, y, w, h, direction, fill, stroke, strokeWidth)
mgfx.api.caretEx(x, y, w, h, style)

mgfx.api.poly(points, fill, stroke, strokeWidth)
mgfx.api.polyEx(points, style)

mgfx.api.line(x1, y1, x2, y2, width, fill)
mgfx.api.lineEx(x1, y1, x2, y2, style)

mgfx.api.circle(cx, cy, radius, fill, stroke, strokeWidth)
mgfx.api.circleEx(cx, cy, radius, style)

mgfx.api.capsule(x, y, w, h, fill, stroke, strokeWidth)
mgfx.api.capsuleEx(x, y, w, h, style)
```

`roundedBoxEx` 使用 `style.radius`，`chamferBoxEx` 使用 `style.cuts`，
`lineEx` 使用 `style.width`。`poly` / `polyEx` 的 public contract 是凸多边形；
复杂路径应先拆成凸片段。

常用凸多边形不用手写点表：

- `regularPoly` 是正 3..8 边形；等边三角形写 `sides = 3`。
- `diamond` 是盒子内的上/右/下/左四点菱形。
- `caret` 是方向明确的三角箭头，`direction` 支持 `"right"`、`"left"`、`"up"`、`"down"`。

## 阴影、Glow 与 Backdrop

`shadow`、`outerGlow` 和 `backdrop` 是三个不同的 style 字段：

- `shadow` 是外部软阴影 pass，默认 `x = 0, y = 4`，适合表达投影。Rounded、Circle、Capsule、Chamfer、Ring、Arc、Sector、Convex Poly 和 texture/image mask 都使用 shape-aware shader pass。
- `outerGlow` 是外部光晕 pass，默认无偏移，适合表达发光边缘。
- `backdrop` 是 shape/image 覆盖范围内的背景 blur/tint，不是阴影。

实际选择可以按目的判断：

| 目的 | 字段 | 典型值 |
| --- | --- | --- |
| 控件从背景上“浮起来” | `shadow` | `{x = 0, y = 4, blur = 10, spread = 1, color = Color(0,0,0,120), softness = 0.68}` |
| 大面板有真实下坠阴影 | `shadow` | `{x = 0, y = 8, blur = 18, spread = 2, color = Color(0,0,0,120), softness = 0.62}` |
| 边缘发光或选中态 | `outerGlow` | `{x = 0, y = 0, width = 12, color = Color(80,190,255,72), softness = 0.58}` |
| 毛玻璃/背景染色 | `backdrop` | `{blur = 5, tint = Color(8,14,24,110), opacity = 1}` |
| 内部边缘高光 | `innerGlow` | `{width = 6, color = Color(255,255,255,34), softness = 0.70}` |

`shadow` 和 `outerGlow` 都支持偏移：

```lux
mgfx.api.roundedBoxEx(x, y, w, h, {
  radius = 12,
  shadow = {
    x = 0,
    y = 8,
    blur = 18,
    spread = 2,
    color = Color(0, 0, 0, 120),
    softness = 0.62,
  },
  outerGlow = {
    x = 0,
    y = 0,
    width = 16,
    color = Color(70, 205, 255, 76),
    softness = 0.55,
  },
})
```

Backdrop 不是独立 primitive，而是 shape/image 的内部背景效果：

```lux
mgfx.api.roundedBoxEx(x, y, w, h, {
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
blur/tint。不要再使用旧的 `BackdropEx` 思路，也不要用 backdrop 去模拟 drop shadow。

## 图像与遮罩

```lux
mgfx.api.image(x, y, w, h, source, radius, tint)
mgfx.api.imageEx(x, y, w, h, source, style)

mgfx.api.icon(x, y, w, h, source, tint)
mgfx.api.iconEx(x, y, w, h, source, style)

mgfx.api.mask(kind, spec)
```

`image` 是普通图像路径。需要 `fit`、`crop`、`uv`、`mask`、`outerGlow`、背景
fill 或高级 stroke 时使用 `imageEx`。

显式 mask 写法：

```lux
mask = mgfx.api.mask("rounded", { radius = 8 })
mask = mgfx.api.mask("chamfer", { cuts = { tl = 10, br = 10 } })
mask = mgfx.api.mask("circle")
mask = mgfx.api.mask("capsule")
mask = mgfx.api.mask("texture", {
  source = maskMaterial,
  channel = "a",
})
```

## 组件图元

```lux
mgfx.api.progressBar(x, y, w, h, value, radius, track, fill, stroke, strokeWidth)
mgfx.api.progressBarEx(x, y, w, h, value, style)

mgfx.api.segmentBar(x, y, w, h, value, segments, fill, track)
mgfx.api.segmentBarEx(x, y, w, h, value, style)

mgfx.api.ring(cx, cy, radius, width, fill)
mgfx.api.ringEx(cx, cy, radius, width, style)

mgfx.api.arc(cx, cy, radius, startDeg, endDeg, width, fill)
mgfx.api.arcEx(cx, cy, radius, width, startDeg, endDeg, style)

mgfx.api.sector(cx, cy, innerRadius, outerRadius, startDeg, endDeg, fill)
mgfx.api.sectorEx(cx, cy, innerRadius, outerRadius, startDeg, endDeg, style)
```

Ring 和 Arc 的厚度是显式 `width` 参数，不放进 `style.width`。Sector 的环形几何由
`innerRadius, outerRadius` 显式声明；`innerRadius = 0` 表示实心扇形。

## 文本

```lux
mgfx.api.registerTextFont(name, spec)
mgfx.api.defineTextStyle(name, style)
mgfx.api.getTextStyle(name)
mgfx.api.resolveTextStyle(style)
mgfx.api.measureText(text, font)
mgfx.api.measureTextBox(text, font, w, style)
mgfx.api.prewarmText(text, font, style)

mgfx.api.text(text, font, x, y, color, ax, ay)
mgfx.api.textEx(text, font, x, y, color, ax, ay, style)

mgfx.api.textBox(text, font, x, y, w, h, color, alignX, alignY)
mgfx.api.textBoxEx(text, font, x, y, w, h, style)
```

普通文本走原生 GMod text。Scoreboard 行、玩家名、聊天、日志、表格和快速变化数字，
不需要 shader 特效时应直接走原生文本。

只有需要 gradient fill、shadow、stroke/outline、glow、surface polish 或 shader-side
weight adjust 时，才进入 MGFX whole-run composer。`prewarm` 只对 composer 路径有效。

## 绘制记录、渐变与图案

```lux
mgfx.api.solid(color)
mgfx.api.linearGradient(x1, y1, x2, y2, colorA, colorB)
mgfx.api.linearGradient(x1, y1, x2, y2, stops)
mgfx.api.linearGradientStops(x1, y1, x2, y2, stops)
mgfx.api.radialGradient(cx, cy, radius, colorA, colorB)
mgfx.api.radialGradient(cx, cy, radius, stops)
mgfx.api.conicGradient(cx, cy, rotationDeg, colorA, colorB)
mgfx.api.conicGradient(cx, cy, rotationDeg, stops)
mgfx.api.ringRadialGradient(stops)
mgfx.api.sectorRadialGradient(stops)
mgfx.api.shapeAngularGradient(stops, rotationDeg)
mgfx.api.ringAngularGradient(stops)
mgfx.api.arcAngularGradient(stops)
mgfx.api.sectorAngularGradient(stops)
mgfx.api.stripePattern(spec)
mgfx.api.smokePattern(spec)
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
local tilt = mgfx.api.pointerTilt(mx, my, {
  origin = "50% 50%",
  perspective = 900,
  maxRotateX = 4,
  maxRotateY = 6,
  strength = hoverAmount,
})

if mgfx.api.pushTransform(tilt, x, y, w, h) {
  mgfx.api.roundedBoxEx(x, y, w, h, { radius = 12, fill = panelFill })
  mgfx.api.ringEx(cx, cy, 42, 6, { fill = ringFill })
  mgfx.api.popTransform()
}
```

## 常见 style 字段

Shape:

```lua
{
  fill = Color(...) or mgfx.api.linearGradient(...),
  stroke = Color(...),
  strokeWidth = 1,
  radius = 8,
  cuts = 8,
  backdrop = { blur = 6, tint = Color(...) },
  innerGlow = { color = Color(...), width = 10, opacity = 0.6 },
  outerGlow = { color = Color(...), width = 18, opacity = 0.6 },
  pattern = mgfx.api.smokePattern(...),
  transform = mgfx.api.pointerTilt(mx, my, { perspective = 900 }),
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
  mask = mgfx.api.mask("chamfer", { cuts = 8 }),
}
```

Ring / Arc / Sector:

```lua
{
  fill = Color(...) or mgfx.api.sectorAngularGradient(...),
  stroke = Color(...),
  strokeWidth = 1,
  backdrop = { blur = 6, tint = Color(...) },
  pattern = mgfx.api.stripePattern(...),
  innerGlow = {...},
  outerGlow = {...},
}
```

## 能力查询

```lux
mgfx.api.getCapabilities(mgfx.capabilities.TARGET.ROUNDED_BOX)
mgfx.api.supports(mgfx.capabilities.TARGET.RING, "outerGlow")
```

能力 target 常量在 Lux 里仍位于 `mgfx.capabilities.TARGET`，安装到 facade 后位于
`MGFX.TARGET`。查询函数本身属于统一的 `mgfx.api.*` 表面。

能力表描述的是已经实现的 render slots，不是计划表。当前 shape rendering 以 immediate
shader path 为主；旧的 shape/data-texture batch prototype 已移除，原因见
[已移除的 Shape 批处理设计](./BATCHING)。
