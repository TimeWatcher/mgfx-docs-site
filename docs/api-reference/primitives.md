# Primitives

Primitive functions draw basic shapes: rounded boxes, chamfer boxes, convex
polygons, lines, circles, and capsules. Advanced visual slots live in `Ex`
style tables.

Facade aliases: `MGFX.RoundedBox`, `MGFX.RoundedBoxEx`, `MGFX.ChamferBox`,
`MGFX.ChamferBoxEx`, `MGFX.RegularPoly`, `MGFX.RegularPolyEx`,
`MGFX.Diamond`, `MGFX.DiamondEx`, `MGFX.Caret`, `MGFX.CaretEx`,
`MGFX.Poly`, `MGFX.PolyEx`, `MGFX.Line`, `MGFX.LineEx`, `MGFX.Circle`,
`MGFX.CircleEx`, `MGFX.Capsule`, `MGFX.CapsuleEx`.

## Scope

- Use short signatures for simple hot paths.
- Use `nameEx(..., style)` when a call needs named fields, glow, backdrop,
  patterns, transforms, or per-corner values.
- `regularPoly`, `diamond`, and `caret` cover common convex polygon shapes so
  callers do not have to hand-build point tables.
- `poly` / `polyEx` accept convex polygons. Split complex paths before passing
  them to MGFX.

## This Page

- [roundedBox](#roundedbox) - Simple rounded rectangle helper.
- [roundedBoxEx](#roundedboxex) - Advanced table-style rounded rectangle.
- [chamferBox](#chamferbox) - Simple chamfered rectangle helper.
- [chamferBoxEx](#chamferboxex) - Advanced chamfered rectangle with `style.cuts`.
- [regularPoly](#regularpoly) - Regular 3..8-sided polygon helper.
- [regularPolyEx](#regularpolyex) - Table-style regular polygon.
- [diamond](#diamond) - Rectangle-bounded diamond helper.
- [diamondEx](#diamondex) - Table-style diamond.
- [caret](#caret) - Directional triangle arrow helper.
- [caretEx](#caretex) - Table-style directional triangle arrow.
- [poly](#poly) - Draw a caller-provided convex polygon.
- [polyEx](#polyex) - Convex polygon with named style fields.
- [line](#line) - Draw a line segment with a positional signature.
- [lineEx](#lineex) - Line segment with named width and paint fields.
- [circle](#circle) - Simple circle helper.
- [circleEx](#circleex) - Advanced circle using rounded shape style.
- [capsule](#capsule) - Simple capsule rectangle helper.
- [capsuleEx](#capsuleex) - Advanced capsule using rounded shape style.
- [style.backdrop](#style-backdrop) - Framebuffer blur/tint clipped by shape coverage.
- [style.transform](#style-transform) - Draw-phase visual transform.
- [Radial vignette fill](#radial-vignette-fill) - Vignettes are transparent radial fills.

## Common Shape Recipes

#### Card With a Real Drop Shadow

```lux
mgfx.api.roundedBoxEx(x, y, w, h, {
  radius = 10,
  fill = Color(20, 24, 32, 232),
  stroke = Color(255, 255, 255, 26),
  strokeWidth = "hairline",
  shadow = { x = 0, y = 6, blur = 14, spread = 1, color = Color(0, 0, 0, 118), softness = 0.66 },
})
```

Small controls usually want `shadow.y = 1..3` and `blur = 4..8`. Large panels
can use `y = 8..12` and `blur = 18..28`.

#### Glass Blur Without Shadow

```lux
mgfx.api.roundedBoxEx(x, y, w, h, {
  radius = 12,
  fill = Color(0, 0, 0, 0),
  backdrop = { blur = 5, tint = Color(8, 14, 24, 112), opacity = 1 },
  stroke = Color(255, 255, 255, 22),
  strokeWidth = 1,
})
```

`backdrop` affects only the covered interior. Add `shadow` when you need a
falling shadow; do not use backdrop as a shadow substitute.

#### Common Convex Polygons

```lux
mgfx.api.regularPolyEx(cx, cy, 18, 6, {
  rotation = 30,
  fill = Color(80, 170, 255, 220),
  shadow = { x = 0, y = 3, blur = 8, color = Color(0, 0, 0, 110), softness = 0.68 },
})

mgfx.api.diamondEx(x, y, 24, 24, {
  fill = Color(255, 190, 66, 220),
  stroke = Color(255, 255, 255, 48),
  strokeWidth = 1,
})

mgfx.api.caretEx(x, y, 18, 18, {
  direction = "right",
  fill = Color(255, 112, 92, 220),
})
```

`regularPoly` is a regular polygon. Use `sides = 3` for an equilateral triangle.
Use `caret` for a directional triangle arrow instead of inventing an ambiguous
`Triangle` helper.

## Effect Ranges

| Field | Recommended range | Notes |
| --- | --- | --- |
| `radius` | Buttons `4..8`, panels `8..16`, capsules `h * 0.5` | Radius is normalized so opposing corners do not overlap. |
| `cuts` | Small blocks `4..8`, cards `8..14` | Keep chamfers below about `h * 0.45`. |
| `shadow.x/y` | Small controls `y = 1..3`, cards `4..8`, panels `8..12` | Positive x moves right; positive y moves down. |
| `shadow.blur` | Small controls `4..8`, cards `10..18`, panels `18..28` | Soft edge width, not offset. |
| `shadow.spread` | `0..3` | Shape growth before the soft edge. |
| `outerGlow.width/size` | `6..18` | Add `x/y` only for intentionally offset glow. |
| `innerGlow.width/size` | `4..14` | Clipped inside the shape; no offset. |
| `softness` | `0..1`, commonly `0.55..0.75` | Lower values are sharper; higher values are softer. |
| `backdrop.blur` | `3..10` | Interior framebuffer blur/tint, not a shadow. |

## Function Reference

## roundedBox

```lux
mgfx.api.roundedBox(x, y, w, h, radius, fill, stroke = nil, strokeWidth = nil)
```

Simple rounded rectangle helper.

#### Parameters

| Parameter | Description |
| --- | --- |
| `x, y, w, h` | Rectangle in active frame-local pixels. |
| `radius` | Corner radius in pixels. Use `roundedBoxEx` for per-corner radius. |
| `fill` | `Color` or MGFX paint record. |
| `stroke, strokeWidth` | Optional stroke color and width. |

#### Example

```lux
mgfx.api.roundedBox(16, 16, 220, 48, 8, Color(28, 34, 46, 230), Color(255, 255, 255, 28), 1)
```

## roundedBoxEx

```lux
mgfx.api.roundedBoxEx(x, y, w, h, style)
```

Advanced rounded rectangle with table-style fields.

#### Common Style Fields

| Field | Description |
| --- | --- |
| `radius` | Number or `{tl, tr, br, bl}` table. |
| `fill` | `Color` or MGFX paint record. |
| `stroke / strokeWidth` | Optional stroke. |
| `shadow` | Drop shadow spec. |
| `innerGlow / outerGlow` | Edge glow specs. |
| `backdrop` | Shape-clipped framebuffer blur/tint. |
| `pattern` | `stripePattern`, `smokePattern`, or pattern spec. |
| `transform` | Draw-phase transform record. |

#### Example

```lux
mgfx.api.roundedBoxEx(x, y, w, h, {
  radius = { tl = 10, tr = 10, br = 4, bl = 4 },
  fill = mgfx.api.linearGradient(0, 0, 0, 1, Color(28, 34, 46), Color(16, 20, 28)),
  stroke = Color(255, 255, 255, 28),
  strokeWidth = 1,
  outerGlow = { color = Color(80, 170, 255, 46), width = 14 },
})
```

## chamferBox

```lux
mgfx.api.chamferBox(x, y, w, h, cuts, fill, stroke = nil, strokeWidth = nil)
```

Simple chamfered rectangle helper.

`cuts` can be a number applied to every corner, or a `{tl, tr, br, bl}` table.
Values are clamped to half the shorter side.

## chamferBoxEx

```lux
mgfx.api.chamferBoxEx(x, y, w, h, style)
```

Advanced chamfered rectangle. Use `style.cuts` for corner cuts. It supports the
same high-level visual fields as `roundedBoxEx`: fill, stroke, shadow,
inner/outer glow, backdrop, pattern, and transform.

#### Example

```lux
mgfx.api.chamferBoxEx(x, y, w, h, {
  cuts = { tl = 12, tr = 3, br = 12, bl = 3 },
  fill = Color(20, 26, 34, 235),
  pattern = mgfx.api.stripePattern(Color(255, 255, 255, 24), 9, 1),
})
```

## poly

```lux
mgfx.api.poly(points, fill, stroke = nil, strokeWidth = nil)
```

Draws a convex polygon from caller-provided points. Points may be `{x = ..., y
= ...}` records or array-like `{x, y}` pairs.

## polyEx

```lux
mgfx.api.polyEx(points, style)
```

Draws a convex polygon with named style fields. Useful for custom UI shards,
arrows, badges, and faceted HUD panels.

## line

```lux
mgfx.api.line(x1, y1, x2, y2, width = 1, fill = nil)
```

Draws a simple line segment.

## lineEx

```lux
mgfx.api.lineEx(x1, y1, x2, y2, style)
```

Advanced line segment. Use `style.width`, `style.fill`, optional radius/cap
fields, backdrop, transform, and supported effects.

## circle

```lux
mgfx.api.circle(cx, cy, radius, fill, stroke = nil, strokeWidth = nil)
```

Simple circle helper built on rounded-box coverage.

## circleEx

```lux
mgfx.api.circleEx(cx, cy, radius, style)
```

Advanced circle. It uses the rounded shape style model, so fill, stroke, glow,
backdrop, pattern, and transform behave like `roundedBoxEx`.

## capsule

```lux
mgfx.api.capsule(x, y, w, h, fill, stroke = nil, strokeWidth = nil)
```

Simple capsule rectangle. Radius is derived from the shorter side.

## capsuleEx

```lux
mgfx.api.capsuleEx(x, y, w, h, style)
```

Advanced capsule. Use it for pill buttons, tags, compact meters, and highlighted
rows that need named style fields.

## style.backdrop

`style.backdrop` applies framebuffer blur/tint clipped by the current shape or
image mask.

Supported shorthand:

```lux
backdrop = true
backdrop = 6
backdrop = Color(8, 14, 24, 110)
backdrop = { blur = 6, tint = Color(8, 14, 24, 110), opacity = 0.8 }
```

Backdrop is an effect field, not a standalone primitive.

## style.transform

`style.transform` is a draw-phase visual transform. It does not change layout,
input hit testing, text flow, or rectangular clipping.

```lux
local tilt = mgfx.api.pointerTilt(mx, my, {
  perspective = 900,
  maxRotateX = 4,
  maxRotateY = 6,
})

mgfx.api.roundedBoxEx(x, y, w, h, {
  radius = 10,
  fill = Color(28, 34, 46, 230),
  transform = tilt,
})
```

## Radial vignette fill

Use an ordinary transparent radial gradient for a vignette:

```lux
mgfx.api.roundedBoxEx(x, y, w, h, {
  radius = 12,
  fill = mgfx.api.radialGradient(0.5, 0.5, 0.85, {
    {0, Color(0, 0, 0, 0)},
    {1, Color(0, 0, 0, 96)},
  }),
})
```

Transparent gradient stops must explicitly use alpha `0`.

[Back to detailed API index](./index)
