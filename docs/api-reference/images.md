# Images and Per-Image Masks

Image APIs draw materials, render targets, texture sources, and icons with optional fit, crop, mask, stroke, shadow, backdrop, and glow.

Plain GLua calls the PascalCase methods on its local API owner (named `MGFX` in
the signatures below). Lux calls the same APIs as lowerCamelCase methods on
`mgfx.api`.

## Functions

```lua
MGFX.Image(x, y, w, h, source, radius, tint)
MGFX.ImageUV(x, y, w, h, source, u0, v0, u1, v1, tint)
MGFX.ImageEx(x, y, w, h, source, style)

MGFX.Icon(x, y, w, h, source, tint)
MGFX.IconEx(x, y, w, h, source, style)

```

`ImageUV` is the allocation-free positional path for an already-known UV
rectangle. It intentionally skips fit, crop, masks, and effect-style parsing.

## Material Sources

An `IMaterial` is treated as an executable draw source, not as a shortcut to
its current `$basetexture`. Material proxies such as `AnimatedTexture` are
therefore evaluated for every draw.

| Input and draw | Runtime path |
| --- | --- |
| `IMaterial` through `ImageUV`, radius-free `Image`, or `ImageEx` without shader effects | Binds and draws the original material directly. |
| `IMaterial` through `Image` with a positive radius, or `ImageEx` with a mask, positive radius, visible stroke, shadow, outer glow, or backdrop | Executes the material into the source capture target, then composites that result with the MGFX image shader. |
| `ITexture` or render-target texture | Binds the texture directly to the MGFX image shader; no material capture is performed. |
| Texture-mask `source` supplied as an `IMaterial` | Executes the mask material into the separate mask capture target. |

When an `ImageEx` style needs shader composition—masking, radius, stroke,
shadow, outer glow, or backdrop—MGFX first draws the original material into a
reusable scratch render target and then feeds that rendered result to the
image shader. A material-backed texture mask uses a second scratch target;
source-alpha effects reuse the source capture. These captures are refreshed
per call and are never cached as a `$basetexture` snapshot.

Each captured material adds one offscreen material draw per call. The capture
region follows the requested draw size and is capped by the current
framebuffer dimensions. Because styled material composition is offscreen,
destination-dependent blend modes or framebuffer-sampling materials cannot
observe the final destination during that capture.

### Animated material example

```lua
local animated = Material("path/to/animated_material")

-- The proxy runs during the source capture; the rounded result stays animated.
MGFX.ImageEx(x, y, 160, 160, animated, {
    fit = "contain",
    radius = 24,
    stroke = Color(118, 204, 255),
    strokeWidth = 2,
})

-- Material-backed masks execute too. This draw uses both capture slots.
MGFX.ImageEx(x + 176, y, 160, 160, animated, {
    mask = {
        kind = "texture",
        source = animated,
        channel = "luma",
    },
})
```

## Image Style Fields

| Field | Meaning |
| --- | --- |
| `fit` / `objectFit` | `"cover"`, `"contain"`, `"fill"`, or `"stretch"`. |
| `position` | Alignment for fitted content. |
| `crop` | Crop rectangle or crop table. |
| `uv` | Explicit UV rectangle. |
| `mask` | Image-mask record such as `{kind = "circle"}`, string alias, `false`, or `"none"`. |
| `radius` | Rounded mask radius for rounded image paths. |
| `tint` / `color` / `alpha` | Image tint and opacity. |
| `fill` / `background` | Background paint behind the image. |
| `stroke` / `strokeWidth` | Optional image border. |
| `shadow` | Mask-aware external soft shadow. |
| `outerGlow` | Mask-aware external glow. |
| `backdrop` | Mask-aware framebuffer blur/tint. |
| `transform` | Visual-only transform. |

## Fit Examples

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

Use `cover` for avatars and `contain` for icons or item art that must remain fully visible.

## Masks

```lua
{kind = "rounded", radius = 8}
{kind = "chamfer", cuts = {12, 4, 12, 4}}
{kind = "circle"}
{kind = "capsule"}
```

Texture masks can use alpha or color channels depending on the source. Prefer procedural masks for common rounded/chamfer/circle/capsule cases.

These records belong to one `ImageEx` draw. They are intentionally different from reusable `MGFX.Mask(painter)` coverage objects used by [`MGFX.Clip`](./masks-and-clip).

Mask-aware `shadow` and `outerGlow` can share one fused shader pass. `backdrop` still samples and tints only the content behind the image or mask coverage.

## Icons

`IconEx` is the image path tuned for icon usage. It usually uses `contain`-style behavior and tinting.

```lua
MGFX.IconEx(x, y, 32, 32, material, {
    tint = Color(220, 245, 255),
    outerGlow = {color = Color(80, 190, 255, 70), width = 8},
})
```

[Back to API Reference](./index)
