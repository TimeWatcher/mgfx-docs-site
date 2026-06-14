# Paint, Patterns, Transforms, and Capabilities

Paint helpers create explicit records for colors, gradients, procedural
patterns, visual transforms, and capability queries.

Facade aliases include `MGFX.Solid`, `MGFX.LinearGradient`,
`MGFX.LinearGradientStops`, `MGFX.RadialGradient`, `MGFX.ConicGradient`,
`MGFX.RingRadialGradient`, `MGFX.SectorRadialGradient`,
`MGFX.ShapeAngularGradient`, `MGFX.RingAngularGradient`,
`MGFX.ArcAngularGradient`, `MGFX.SectorAngularGradient`,
`MGFX.StripePattern`, `MGFX.SmokePattern`, `MGFX.Transform`,
`MGFX.PointerTilt`, `MGFX.ProjectedQuad`, `MGFX.PushTransform`,
`MGFX.PopTransform`, `MGFX.TransformPoint`, `MGFX.UntransformPoint`,
`MGFX.GetCapabilities`, and `MGFX.Supports`.

## Scope

- Linear, radial, conic, ring/sector radial, and shape/ring/arc/sector angular
  gradients all support stop tables through the same LUT pipeline.
- Patterns are shader paint slots; do not expand them into many line draws.
- 2.5D visual tilt uses `style.transform`, `pushTransform`, or `pointerTilt`.
  Do not add primitive-specific `ProjectedXXX` APIs.

## This Page

- [solid](#solid)
- [linearGradient](#lineargradient)
- [linearGradientStops](#lineargradientstops)
- [radialGradient](#radialgradient)
- [ringRadialGradient](#ringradialgradient)
- [sectorRadialGradient](#sectorradialgradient)
- [conicGradient](#conicgradient)
- [shapeAngularGradient](#shapeangulargradient)
- [ringAngularGradient](#ringangulargradient)
- [arcAngularGradient](#arcangulargradient)
- [sectorAngularGradient](#sectorangulargradient)
- [stripePattern](#stripepattern)
- [smokePattern](#smokepattern)
- [transform](#transform)
- [pointerTilt](#pointertilt)
- [projectedQuad](#projectedquad)
- [pushTransform](#pushtransform)
- [popTransform](#poptransform)
- [transformPoint](#transformpoint)
- [untransformPoint](#untransformpoint)
- [get](#get)
- [supports](#supports)

## Function Reference

## solid

```lux
mgfx.style.solid(color)
```

Creates a solid paint record. Most APIs also accept `Color` directly; `solid`
is useful when you want an explicit paint record.

## linearGradient

```lux
mgfx.style.linearGradient(x1, y1, x2, y2, colorA, colorB)
mgfx.style.linearGradient(x1, y1, x2, y2, stops)
```

Creates a linear gradient in primitive-local normalized space. Passing a stop
table is equivalent to `linearGradientStops`.

## linearGradientStops

```lux
mgfx.style.linearGradientStops(x1, y1, x2, y2, stops)
```

Creates a multi-stop linear gradient. Stops are sorted and completed at `0` and
`1` when needed.

Stop forms:

```lux
local stops = {
  Color(80, 170, 255),
  {0.35, Color(90, 220, 180)},
  {pos = 0.70, color = Color(255, 210, 110)},
  {offset = 1, color = Color(255, 96, 78, 0)},
}
```

## radialGradient

```lux
mgfx.style.radialGradient(cx, cy, radius, colorA, colorB)
mgfx.style.radialGradient(cx, cy, radius, stops)
```

Creates a radial gradient record. The shader path samples the shared gradient
LUT after computing radial `t`.

## ringRadialGradient

```lux
mgfx.style.ringRadialGradient(stopsOrColorA, colorB = nil)
```

Creates a ring-local radial gradient. In ring/arc/sector shaders:

```text
t = (r - innerRadius) / (outerRadius - innerRadius)
```

## sectorRadialGradient

```lux
mgfx.style.sectorRadialGradient(stopsOrColorA, colorB = nil)
```

Creates a sector-local radial gradient using the same local radial space as
`ringRadialGradient`.

## conicGradient

```lux
mgfx.style.conicGradient(cx, cy, rotationDeg, colorA, colorB)
mgfx.style.conicGradient(cx, cy, rotationDeg, stops)
```

Creates a full 360-degree angular gradient around the normalized center. This
is not the same as shape-local angular gradients used by arc/sector spans.

## shapeAngularGradient

```lux
mgfx.style.shapeAngularGradient(stopsOrColorA, colorB = nil, rotation = nil)
```

Creates a local angular gradient over the current ring/arc/sector angular
range.

## ringAngularGradient

```lux
mgfx.style.ringAngularGradient(stopsOrColorA, colorB = nil, rotation = 0)
```

Alias for ring-local angular paint.

## arcAngularGradient

```lux
mgfx.style.arcAngularGradient(stopsOrColorA, colorB = nil, rotation = 0)
```

Creates an angular gradient over `startDeg..endDeg` for arc drawing.

## sectorAngularGradient

```lux
mgfx.style.sectorAngularGradient(stopsOrColorA, colorB = nil, rotation = 0)
```

Creates an angular gradient over `startDeg..endDeg` for sector drawing.

## stripePattern

```lux
mgfx.style.stripePattern(color, spacing = 12, width = 2, angle = 135, offset = 0)
```

Creates a procedural stripe pattern record. Use it as `style.pattern`,
`trackPattern`, or `fillPattern` rather than drawing many individual lines.

## smokePattern

```lux
mgfx.style.smokePattern(color, scale = 140, density = 0.48, softness = 0.3, angle = 135, offset = 0, seed = 0)
```

Creates a procedural smoke/noise pattern record.

## transform

```lux
mgfx.geometry.transform(spec = nil)
```

Copies a CSS-like draw transform record for use as `style.transform`.

Common fields:

| Field | Description |
| --- | --- |
| `origin` | `"50% 50%"`, `{x, y}`, or equivalent. |
| `perspective` | Perspective distance. |
| `rotateX / rotateY / rotate` | Rotation in degrees. |
| `scale` | Uniform scale or scale record. |
| `translate` | Visual translation. |
| `skewX / skewY` | Skew in degrees. |
| `steps` | Quad subdivision steps for projected drawing. |

## pointerTilt

```lux
mgfx.geometry.pointerTilt(x, y, spec = nil)
```

Creates a pointer-driven 2.5D transform record. It is useful for panels, wheel
items, and cards that visually tilt toward the mouse.

## projectedQuad

```lux
mgfx.geometry.projectedQuad(spec = nil)
```

Creates an expert projected-quad transform. Prefer `pointerTilt` or
`transform` for normal UI work.

## pushTransform

```lux
mgfx.geometry.pushTransform(spec, x = nil, y = nil, w = nil, h = nil)
```

Pushes a draw-phase transform for multiple immediate draws. Returns a truthy
value when the transform was pushed.

## popTransform

```lux
mgfx.geometry.popTransform()
```

Pops the active draw transform.

## transformPoint

```lux
mgfx.geometry.transformPoint(x, y)
```

Maps a point through the current transform.

## untransformPoint

```lux
mgfx.geometry.untransformPoint(sx, sy)
```

Approximately maps a transformed point back to local space. Use for visual
alignment helpers only; layout and hit testing remain caller-owned.

## get

```lux
mgfx.capabilities.get(target)
```

Returns implemented render slots and metadata for a target. The installed
facade name is `MGFX.GetCapabilities`.

Common targets include:

```lux
mgfx.capabilities.TARGET.ROUNDED_BOX
mgfx.capabilities.TARGET.CHAMFER_BOX
mgfx.capabilities.TARGET.POLY
mgfx.capabilities.TARGET.LINE
mgfx.capabilities.TARGET.RING
mgfx.capabilities.TARGET.ARC
mgfx.capabilities.TARGET.SECTOR
mgfx.capabilities.TARGET.IMAGE
mgfx.capabilities.TARGET.PROGRESS_BAR
mgfx.capabilities.TARGET.SEGMENT_BAR
mgfx.capabilities.TARGET.TEXT
```

## supports

```lux
mgfx.capabilities.supports(target, key)
```

Checks whether a target supports a public render slot.

```lux
if mgfx.capabilities.supports(mgfx.capabilities.TARGET.RING, "outerGlow") {
  mgfx.widgets.ringEx(cx, cy, 36, 6, {
    fill = Color(80, 170, 255),
    outerGlow = { width = 14 },
  })
}
```

[Back to detailed API index](./index)
