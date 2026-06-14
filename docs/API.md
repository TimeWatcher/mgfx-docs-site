# MGFX API Overview

MGFX is a Lux package and a low-level immediate renderer for Garry's Mod. It
draws explicit parameters passed by the caller every frame. It does not own
layout, input, focus, component lifecycle, animation state, or hit testing.

For complete function signatures, parameter tables, notes, return values, and
examples, use the grouped [Detailed API Reference](./api-reference/).

For installation and project setup, start with [Use MGFX from Lux](./USAGE).

## Two API Surfaces

MGFX has two public surfaces:

```text
@lux/mgfx module API   lower-case Lux exports used by Lux source
installed MGFX facade  PascalCase helpers for GLua-facing code
```

New Lux code should import the package and call lower-case exports:

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

```lua [Installed MGFX Facade]
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

The facade exists for old GLua panels, third-party code, and gradual migration.
It is installed by calling `mgfx.installGlobal("MGFX")` from client Lux code.

## Basic Model

The public API is split into two call shapes:

```text
name(...)    short hot-path signature for common cases
nameEx(...)  table-style signature for advanced effects and readable arguments
```

On the installed `MGFX.*` facade these names become PascalCase:
`RoundedBox(...)`, `RoundedBoxEx(...)`, `LinearGradient(...)`, and similar.

Non-`Ex` functions keep stable short arguments. Shadows, glow, patterns,
backdrop blur, masks, fit/crop, transforms, per-corner radius, and other
advanced options live in the matching `Ex` style table.

All drawing state is explicit. MGFX has no global fill or stroke state.

Stroke order is always:

```lua
fill, stroke, strokeWidth
```

`stroke == nil`, `strokeWidth == nil`, or `strokeWidth <= 0` means no stroke is
drawn.

## Frame Scope

```lux
mgfx.frame.startPanel(panel, w, h)
mgfx.frame.endPanel()

mgfx.frame.startScreen(w, h)
mgfx.frame.endScreen()

mgfx.frame.pushClip(x, y, w, h)
mgfx.frame.popClip()
```

All coordinates are relative to the active frame. `StartPanel` reads the
panel's screen position and creates a panel-local coordinate system. Callers
should not convert panel-local coordinates to screen coordinates manually.

Shapes, images, and widgets usually draw immediately. Text and clip commands
are recorded inside the frame and flushed by `EndPanel` or `EndScreen` so that
text routing and the composer can work consistently. When painter order
matters, draw lower shapes and images first, then issue text calls that should
appear above them.

`PushClip` and `PopClip` are rectangular scissor operations, not an arbitrary
shape mask stack. Shape masks are shader coverage owned by each primitive.

## Primitives

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

`RoundedBoxEx` uses `style.radius`, `ChamferBoxEx` uses `style.cuts`, and
`LineEx` uses `style.width`. The public contract for `Poly` and `PolyEx` is a
convex polygon. Complex paths should be split into convex pieces before they
reach MGFX.

## Shape Backdrop

Backdrop is not a separate primitive. It is a shape or image style field:

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

Supported shorthand forms:

```lua
backdrop = true         -- blur = 4
backdrop = 6            -- blur = 6
backdrop = Color(...)   -- tint only
backdrop = {blur = 6, tint = Color(...), opacity = 0.8}
```

`style.backdrop` is clipped by the current shape coverage. Rounded boxes,
circles, capsules, chamfers, polygons, lines, rings, arcs, sectors, and image
masks all clip blur and tint to their own shape. Do not bring back the old
`BackdropEx` model.

For a vignette or extra light, layer a transparent gradient fill:

```lux
mgfx.paint.roundedBoxEx(x, y, w, h, {
    radius = 12,
    fill = mgfx.style.radialGradient(0.5, 0.5, 0.85, {
        {0, Color(0, 0, 0, 0)},
        {1, Color(0, 0, 0, 96)},
    }),
})
```

Transparent gradient stops must explicitly set `alpha = 0`. The default alpha
is `255`, so omitting it can turn a fade-out into an opaque black layer.

## Images and Masks

```lux
mgfx.paint.image(x, y, w, h, source, radius, tint)
mgfx.paint.imageEx(x, y, w, h, source, style)

mgfx.paint.icon(x, y, w, h, source, tint)
mgfx.paint.iconEx(x, y, w, h, source, style)
```

`Image` is the simple image path. Use `ImageEx` when you need `fit`, `crop`,
`uv`, `mask`, `outerGlow`, background fill, advanced stroke, or backdrop.

Explicit masks:

```lua
mask = mgfx.style.mask("rounded", {radius = 8})
mask = mgfx.style.mask("chamfer", {cuts = {tl = 10, tr = 0, br = 10, bl = 0}})
mask = mgfx.style.mask("circle")
mask = mgfx.style.mask("capsule")
mask = mgfx.style.mask("texture", {
    source = maskMaterial,
    channel = "a", -- a, r, g, b, luma
})
```

A circular avatar is a normal image with a circle mask:

```lua
mgfx.paint.imageEx(x, y, size, size, avatarMaterial, {
    mask = mgfx.style.mask("circle"),
    fit = "cover",
})
```

## Widgets

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

Ring and arc thickness is the explicit `width` argument, not `style.width`.
Sector geometry is declared with `innerRadius` and `outerRadius`;
`innerRadius = 0` means a solid sector.

`ArcEx` is a round-capped arc segment for gauges, progress arcs, and circular
ticks. `SectorEx` is a straight-edged radial wedge for wheel menus and radial
selection. They are separate shapes because endpoint geometry and SDF
boundaries differ.

Wheel sector example:

```lua
mgfx.widgets.sectorEx(cx, cy, innerR, outerR, startDeg, endDeg, {
    fill = mgfx.style.sectorAngularGradient(
        Color(36, 40, 48, 150),
        Color(150, 150, 160, 130)
    ),
    stroke = Color(255, 255, 255, 36),
    strokeWidth = 1,
})
```

## Text

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

Plain text uses native GMod text. Scoreboard rows, player names, chat, logs,
tables, and fast-changing counters should remain native unless they actually
need shader effects.

Only text that needs gradient fill, shadow, stroke/outline, glow, surface
polish, or shader-side weight adjustment should use the MGFX whole-run
composer. `PrewarmText` only affects composer text; it returns `false` for
plain native text.

## Paint Records, Gradients, and Patterns

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
mgfx.style.ringAngularGradient(stops, rotationDeg)
mgfx.style.arcAngularGradient(stops, rotationDeg)
mgfx.style.sectorAngularGradient(stops, rotationDeg)
mgfx.style.stripePattern(spec)
mgfx.style.smokePattern(spec)
```

All gradient helpers support stops and sample through the same LUT pipeline.
The only difference is the geometric meaning of `t`:

| Helper | `t` space |
| --- | --- |
| `LinearGradient` | primitive-local linear axis |
| `RadialGradient` | primitive-local radial distance, aspect-corrected by the shorter side |
| `ConicGradient` | full 360-degree angular field around the normalized center |
| `RingRadialGradient` / `SectorRadialGradient` | ring/sector-local inner radius to outer radius |
| `ShapeAngularGradient` / `RingAngularGradient` / `ArcAngularGradient` / `SectorAngularGradient` | current shape `startDeg` to `endDeg` |

Stop table forms:

```lua
local stops = {
    Color(80, 170, 255),                         -- distributed by index
    {0.35, Color(90, 220, 180)},                 -- compact {pos, color}
    {pos = 0.70, color = Color(255, 210, 110)},  -- named form
    {offset = 1, color = Color(255, 96, 78, 0)}, -- pos/t/offset all work
}
```

Patterns are shader paint slots, not geometry recipes. Do not expand diagonal
stripes or smoke into many `LineEx` calls in UI code. If a large area needs a
stripe or smoke pattern, add the matching shader pattern path for that shape.

## Visual Transform

`style.transform` is a draw-phase visual transform. It does not change layout,
input hit testing, frame coordinates, or rectangular clipping.

```lux
mgfx.paint.roundedBoxEx(x, y, w, h, {
    radius = 10,
    fill = Color(28, 34, 46, 230),
    transform = {
        origin = "50% 50%",
        perspective = 900,
        rotateX = -4,
        rotateY = 6,
        scale = 1.02,
        steps = 12,
    },
})
```

Pointer-driven 2.5D UI uses a helper:

```lux
local tilt = mgfx.geometry.pointerTilt(mx, my, {
    origin = "50% 50%",
    perspective = 900,
    maxRotateX = 4,
    maxRotateY = 6,
    strength = hoverAmount,
    scaleLift = 0.01,
    steps = 12,
})
```

Use the transform stack for grouped immediate drawing:

```lux
if mgfx.geometry.pushTransform(tilt, x, y, w, h) {
  mgfx.paint.roundedBoxEx(x, y, w, h, { radius = 12, fill = panelFill })
  mgfx.widgets.ringEx(cx, cy, 42, 6, { fill = ringFill })
  mgfx.geometry.popTransform()
}
```

## Common Style Fields

Shape:

```lua
{
    fill = Color(...) or mgfx.style.linearGradient(...),
    stroke = Color(...),
    strokeWidth = 1,
    radius = 8,
    cuts = 8,
    backdrop = {blur = 6, tint = Color(...)},
    innerGlow = {color = Color(...), width = 10, opacity = 0.6},
    outerGlow = {color = Color(...), width = 18, opacity = 0.6},
    pattern = mgfx.style.smokePattern(...),
    transform = mgfx.geometry.pointerTilt(mx, my, {perspective = 900}),
}
```

Image:

```lua
{
    tint = Color(...),
    alpha = 0.9,
    fit = "cover", -- fill, contain, cover
    position = {x = 0.5, y = 0.5},
    crop = {x = 0, y = 0, w = 1, h = 1},
    uv = {u0 = 0, v0 = 0, u1 = 1, v1 = 1},
    mask = mgfx.style.mask("chamfer", {cuts = 8}),
}
```

Ring / Arc / Sector:

```lua
{
    fill = Color(...) or mgfx.style.sectorAngularGradient(...),
    stroke = Color(...),
    strokeWidth = 1,
    backdrop = {blur = 6, tint = Color(...)},
    pattern = mgfx.style.stripePattern(...),
    innerGlow = {...},
    outerGlow = {...},
}
```

## Capability Queries

```lux
mgfx.capabilities.get(mgfx.capabilities.TARGET.ROUNDED_BOX)
mgfx.capabilities.supports(mgfx.capabilities.TARGET.RING, "outerGlow")
```

The capability table describes implemented render slots, not planned features.
Current shape rendering is based on immediate shader/fallback paths. The older
shape/data-texture batch prototype was removed; see [Removed Shape Batching Design](./BATCHING).
