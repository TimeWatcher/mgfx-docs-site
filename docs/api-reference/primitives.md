# Primitives

Primitive functions draw basic shapes: rounded boxes, chamfer boxes, convex
polygons, lines, circles, and capsules. Advanced visual slots live in `Ex`
style tables.

Facade aliases: `MGFX.RoundedBox`, `MGFX.RoundedBoxEx`, `MGFX.ChamferBox`,
`MGFX.ChamferBoxEx`, `MGFX.Poly`, `MGFX.PolyEx`, `MGFX.Line`, `MGFX.LineEx`,
`MGFX.Circle`, `MGFX.CircleEx`, `MGFX.Capsule`, `MGFX.CapsuleEx`.

## Scope

- Use short signatures for simple hot paths.
- Use `nameEx(..., style)` when a call needs named fields, glow, backdrop,
  patterns, transforms, or per-corner values.
- `poly` / `polyEx` accept convex polygons. Split complex paths before passing
  them to MGFX.

## This Page

- [roundedBox](#roundedbox) - Simple rounded rectangle helper.
- [roundedBoxEx](#roundedboxex) - Advanced table-style rounded rectangle.
- [chamferBox](#chamferbox) - Simple chamfered rectangle helper.
- [chamferBoxEx](#chamferboxex) - Advanced chamfered rectangle with `style.cuts`.
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

## Function Reference

## roundedBox

```lux
mgfx.paint.roundedBox(x, y, w, h, radius, fill, stroke = nil, strokeWidth = nil)
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
mgfx.paint.roundedBox(16, 16, 220, 48, 8, Color(28, 34, 46, 230), Color(255, 255, 255, 28), 1)
```

## roundedBoxEx

```lux
mgfx.paint.roundedBoxEx(x, y, w, h, style)
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
mgfx.paint.roundedBoxEx(x, y, w, h, {
  radius = { tl = 10, tr = 10, br = 4, bl = 4 },
  fill = mgfx.style.linearGradient(0, 0, 0, 1, Color(28, 34, 46), Color(16, 20, 28)),
  stroke = Color(255, 255, 255, 28),
  strokeWidth = 1,
  outerGlow = { color = Color(80, 170, 255, 46), width = 14 },
})
```

## chamferBox

```lux
mgfx.paint.chamferBox(x, y, w, h, cuts, fill, stroke = nil, strokeWidth = nil)
```

Simple chamfered rectangle helper.

`cuts` can be a number applied to every corner, or a `{tl, tr, br, bl}` table.
Values are clamped to half the shorter side.

## chamferBoxEx

```lux
mgfx.paint.chamferBoxEx(x, y, w, h, style)
```

Advanced chamfered rectangle. Use `style.cuts` for corner cuts. It supports the
same high-level visual fields as `roundedBoxEx`: fill, stroke, shadow,
inner/outer glow, backdrop, pattern, and transform.

#### Example

```lux
mgfx.paint.chamferBoxEx(x, y, w, h, {
  cuts = { tl = 12, tr = 3, br = 12, bl = 3 },
  fill = Color(20, 26, 34, 235),
  pattern = mgfx.style.stripePattern(Color(255, 255, 255, 24), 9, 1),
})
```

## poly

```lux
mgfx.paint.poly(points, fill, stroke = nil, strokeWidth = nil)
```

Draws a convex polygon from caller-provided points. Points may be `{x = ..., y
= ...}` records or array-like `{x, y}` pairs.

## polyEx

```lux
mgfx.paint.polyEx(points, style)
```

Draws a convex polygon with named style fields. Useful for custom UI shards,
arrows, badges, and faceted HUD panels.

## line

```lux
mgfx.paint.line(x1, y1, x2, y2, width = 1, fill = nil)
```

Draws a simple line segment.

## lineEx

```lux
mgfx.paint.lineEx(x1, y1, x2, y2, style)
```

Advanced line segment. Use `style.width`, `style.fill`, optional radius/cap
fields, backdrop, transform, and supported effects.

## circle

```lux
mgfx.paint.circle(cx, cy, radius, fill, stroke = nil, strokeWidth = nil)
```

Simple circle helper built on rounded-box coverage.

## circleEx

```lux
mgfx.paint.circleEx(cx, cy, radius, style)
```

Advanced circle. It uses the rounded shape style model, so fill, stroke, glow,
backdrop, pattern, and transform behave like `roundedBoxEx`.

## capsule

```lux
mgfx.paint.capsule(x, y, w, h, fill, stroke = nil, strokeWidth = nil)
```

Simple capsule rectangle. Radius is derived from the shorter side.

## capsuleEx

```lux
mgfx.paint.capsuleEx(x, y, w, h, style)
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
local tilt = mgfx.geometry.pointerTilt(mx, my, {
  perspective = 900,
  maxRotateX = 4,
  maxRotateY = 6,
})

mgfx.paint.roundedBoxEx(x, y, w, h, {
  radius = 10,
  fill = Color(28, 34, 46, 230),
  transform = tilt,
})
```

## Radial vignette fill

Use an ordinary transparent radial gradient for a vignette:

```lux
mgfx.paint.roundedBoxEx(x, y, w, h, {
  radius = 12,
  fill = mgfx.style.radialGradient(0.5, 0.5, 0.85, {
    {0, Color(0, 0, 0, 0)},
    {1, Color(0, 0, 0, 96)},
  }),
})
```

Transparent gradient stops must explicitly use alpha `0`.

[Back to detailed API index](./index)
