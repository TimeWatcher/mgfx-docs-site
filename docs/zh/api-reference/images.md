# 图像与单图遮罩

图像 API 用于绘制材质、render target、纹理来源和图标，并支持 fit、crop、单图遮罩、描边、阴影、backdrop 与 glow。

普通 GLua 调用局部 API owner 上的 PascalCase 方法（下方签名把这个局部变量写作
`MGFX`）；Lux 通过 `mgfx.api` 上对应的 lowerCamelCase 方法调用同一组 API。

## 函数

```lua
MGFX.Image(x, y, w, h, source, radius, tint)
MGFX.ImageUV(x, y, w, h, source, u0, v0, u1, v1, tint)
MGFX.ImageEx(x, y, w, h, source, style)

MGFX.Icon(x, y, w, h, source, tint)
MGFX.IconEx(x, y, w, h, source, style)
```

`ImageUV` 是已知 UV 矩形的低分配 positional 路径，刻意跳过 fit、crop、mask 和 effect style 解析。

## Material source

`IMaterial` 是会被实际执行的绘制来源，不再只是“读取一次当前
`$basetexture`”的快捷方式，因此 `AnimatedTexture` 等 material proxy 会在每次
绘制时重新求值。

| 输入与调用方式 | 运行路径 |
| --- | --- |
| `IMaterial` 传给 `ImageUV`、无正半径的 `Image`，或不需要 shader effect 的 `ImageEx` | 直接绑定并绘制原始材质。 |
| `IMaterial` 传给带正半径的 `Image`，或带 mask、正半径、可见 stroke、shadow、outer glow、backdrop 的 `ImageEx` | 先执行到 source capture target，再由 MGFX image shader 合成。 |
| `ITexture` 或 render-target texture | 直接绑定到 MGFX image shader，不执行 material capture。 |
| Texture mask 的 `source` 是 `IMaterial` | 把 mask material 执行到独立的 mask capture target。 |

当 `ImageEx` 需要 mask、radius、stroke、shadow、outer glow 或 backdrop
时，MGFX 会先把原始材质绘制进可复用的临时 render target，再把这次绘制的
结果交给 image shader。材质型 texture mask 使用第二张临时 RT；基于源 alpha
的效果直接复用 source capture。捕获每次调用都会刷新，不会缓存成过期的
`$basetexture` 快照。

每捕获一个材质，每次调用都会多一次离屏 material draw。捕获区域跟随请求的
绘制尺寸，并以当前 framebuffer 尺寸为上限。需要 style 合成的材质会在离屏
目标中执行，因此依赖最终目标内容的 blend mode 或 framebuffer-sampling 材质
无法在这一步看到最终 destination。

### 动画材质示例

```lua
local animated = Material("path/to/animated_material")

-- Proxy 在 source capture 中运行；圆角合成后的结果仍会播放动画。
MGFX.ImageEx(x, y, 160, 160, animated, {
    fit = "contain",
    radius = 24,
    stroke = Color(118, 204, 255),
    strokeWidth = 2,
})

-- Material mask 也会真正执行；这次绘制会同时使用两个 capture slot。
MGFX.ImageEx(x + 176, y, 160, 160, animated, {
    mask = {
        kind = "texture",
        source = animated,
        channel = "luma",
    },
})
```

## Image style 字段

| 字段 | 说明 |
| --- | --- |
| `fit` / `objectFit` | `"cover"`、`"contain"`、`"fill"` 或 `"stretch"`。 |
| `position` | fit 后内容的对齐位置。 |
| `crop` | 裁切矩形或 crop table。 |
| `uv` | 显式 UV 矩形。 |
| `mask` | `{kind = "circle"}` 这样的单图 mask record、字符串别名、`false` 或 `"none"`。 |
| `radius` | rounded image path 的圆角半径。 |
| `tint` / `color` / `alpha` | 图像 tint 与透明度。 |
| `fill` / `background` | 图像后方的背景 paint。 |
| `stroke` / `strokeWidth` | 可选图像边框。 |
| `shadow` | 感知 mask 的外部柔和阴影。 |
| `outerGlow` | 感知 mask 的外部 glow。 |
| `backdrop` | 感知 mask 的 framebuffer blur/tint。 |
| `transform` | 仅影响视觉的 transform。 |

## Fit 示例

::: code-group

```lua [GLua]
MGFX.ImageEx(x, y, 96, 96, avatarMaterial, {
    fit = "cover",
    mask = {kind = "chamfer", cuts = 12},
    stroke = Color(80, 190, 255, 120),
    strokeWidth = 1,
})
```

```lux [Lux]
import * as mgfx from "@lux/mgfx"

local draw = mgfx.api

draw.imageEx(x, y, 96, 96, avatarMaterial, {
  fit = "cover",
  mask = {kind = "chamfer", cuts = 12},
  stroke = Color(80, 190, 255, 120),
  strokeWidth = 1,
});
```

:::

头像通常使用 `cover`；必须完整显示的图标或物品图使用 `contain`。

## 单图遮罩

```lua
{kind = "rounded", radius = 8}
{kind = "chamfer", cuts = {12, 4, 12, 4}}
{kind = "circle"}
{kind = "capsule"}
```

纹理遮罩使用普通 style record：

```lua
MGFX.ImageEx(x, y, w, h, sourceMaterial, {
    fit = "cover",
    mask = {
        kind = "texture",
        source = maskMaterial,
        channel = "a", -- a, r, g, b, luma
        invert = false,
        uv = {u0 = 0, v0 = 0, u1 = 1, v1 = 1},
    },
})
```

常见 rounded/chamfer/circle/capsule 情况应优先使用 procedural mask。上述 record 只属于当前一次 `ImageEx` 绘制，与 [`MGFX.Mask(painter)` + `MGFX.Clip`](./masks-and-clip) 使用的可复用 coverage Mask 是两个刻意分开的概念。

感知 mask 的 `shadow` 与 `outerGlow` 可以共享 fused shader pass；`backdrop` 仍然只采样并 tint 图像或 mask coverage 后方的内容。

## 图标

`IconEx` 是针对图标使用方式调整的图像路径，通常采用 `contain` 与 tint：

```lua
MGFX.IconEx(x, y, 32, 32, material, {
    tint = Color(220, 245, 255),
    outerGlow = {color = Color(80, 190, 255, 70), width = 8},
})
```

[返回详细 API 入口](./index)
