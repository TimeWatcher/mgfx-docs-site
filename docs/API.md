# MGFX API Overview

MGFX is a Lux package and a low-level immediate renderer for Garry's Mod. It
draws explicit parameters passed by the caller every frame. It does not own
layout, input, focus, component lifecycle, animation state, or hit testing.

For complete function signatures, parameter tables, notes, return values, and
examples, use the grouped [Detailed API Reference](./api-reference/).

For installation and project setup, start with [Use MGFX](./USAGE).

## Two API Surfaces

MGFX has two public surfaces:

```text
mgfx.api.*             lower-case API used by Lux source
installed MGFX facade  PascalCase helpers for GLua-facing code
```

New Lux code should import the package and call `mgfx.api.*`:

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

## Choose by Task

Most UI code should start from the thing it needs to draw, not from an internal
module boundary.

| Need | Lux API | Installed MGFX facade |
| --- | --- | --- |
| Panels, buttons, rows | `mgfx.api.roundedBoxEx` | `MGFX.RoundedBoxEx` |
| Chamfered HUD panels | `mgfx.api.chamferBoxEx` | `MGFX.ChamferBoxEx` |
| Equilateral triangles, pentagons, hex badges | `mgfx.api.regularPolyEx` | `MGFX.RegularPolyEx` |
| Direction arrows | `mgfx.api.caretEx` | `MGFX.CaretEx` |
| Caller-defined convex polygons | `mgfx.api.polyEx` | `MGFX.PolyEx` |
| Avatars, icons, inventory art | `mgfx.api.imageEx` / `mgfx.api.iconEx` | `MGFX.ImageEx` / `MGFX.IconEx` |
| Health and reload bars | `mgfx.api.progressBarEx` | `MGFX.ProgressBarEx` |
| Ammo pips and discrete charge | `mgfx.api.segmentBarEx` | `MGFX.SegmentBarEx` |
| Rings, gauges, radial progress | `mgfx.api.ringEx` / `mgfx.api.arcEx` | `MGFX.RingEx` / `MGFX.ArcEx` |
| Wheel menu wedges | `mgfx.api.sectorEx` | `MGFX.SectorEx` |
| Plain labels, tables, player names | `mgfx.api.text` or native GMod text | `MGFX.Text` |
| Outlined, glowing, gradient text | `mgfx.api.textEx` | `MGFX.TextEx` |
| Gradients, stripes, smoke fills | `mgfx.api.linearGradient` / `stripePattern` / `smokePattern` | `MGFX.LinearGradient` / `MGFX.StripePattern` / `MGFX.SmokePattern` |

Use the short signature for hot simple cases. Switch to `Ex(..., style)` as
soon as the arguments need names. GLua-facing code can keep using the facade
directly; do not add another heavy rect/helper layer just to wrap it.

## Frame Scope

```lux
mgfx.api.startPanel(panel, w, h)
mgfx.api.endPanel()

mgfx.api.startScreen(w, h)
mgfx.api.endScreen()

mgfx.api.pushClip(x, y, w, h)
mgfx.api.popClip()
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

`RoundedBoxEx` uses `style.radius`, `ChamferBoxEx` uses `style.cuts`, and
`LineEx` uses `style.width`. The public contract for `Poly` and `PolyEx` is a
convex polygon. Complex paths should be split into convex pieces before they
reach MGFX.

Common convex polygons do not need hand-built point lists:

- `regularPoly` draws a regular 3..8-sided polygon. Use `sides = 3` for an
  equilateral triangle.
- `diamond` draws the top/right/bottom/left diamond inside a rectangle.
- `caret` draws an explicit directional triangle; `direction` accepts
  `"right"`, `"left"`, `"up"`, or `"down"`.

## Shadow, Glow, and Backdrop

`shadow`, `outerGlow`, and `backdrop` are separate style fields:

- `shadow` is an external soft shadow pass. It defaults toward `x = 0, y = 4`
  and is the right field for drop shadows. Rounded boxes, circles, capsules,
  chamfers, rings, arcs, sectors, convex polygons, and texture/image masks use
  shape-aware shader passes.
- `outerGlow` is an external halo pass. It defaults to no offset and is best for
  selected or emissive edges.
- `backdrop` is framebuffer blur/tint inside the shape or image coverage. It is
  not a shadow.

| Goal | Field | Typical value |
| --- | --- | --- |
| Lift a small control from the background | `shadow` | `{x = 0, y = 4, blur = 10, spread = 1, color = Color(0,0,0,120), softness = 0.68}` |
| Give a panel a real falling shadow | `shadow` | `{x = 0, y = 8, blur = 18, spread = 2, color = Color(0,0,0,120), softness = 0.62}` |
| Selected or emissive edge | `outerGlow` | `{x = 0, y = 0, width = 12, color = Color(80,190,255,72), softness = 0.58}` |
| Glass blur / background tint | `backdrop` | `{blur = 5, tint = Color(8,14,24,110), opacity = 1}` |
| Inner edge highlight | `innerGlow` | `{width = 6, color = Color(255,255,255,34), softness = 0.70}` |

`shadow` and `outerGlow` both support offset:

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

Backdrop is not a separate primitive. It is an internal background effect on a
shape or image:

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
`BackdropEx` model, and do not use backdrop to fake a drop shadow.

For a vignette or extra light, layer a transparent gradient fill:

```lux
mgfx.api.roundedBoxEx(x, y, w, h, {
    radius = 12,
    fill = mgfx.api.radialGradient(0.5, 0.5, 0.85, {
        {0, Color(0, 0, 0, 0)},
        {1, Color(0, 0, 0, 96)},
    }),
})
```

Transparent gradient stops must explicitly set `alpha = 0`. The default alpha
is `255`, so omitting it can turn a fade-out into an opaque black layer.

## Images and Masks

```lux
mgfx.api.image(x, y, w, h, source, radius, tint)
mgfx.api.imageEx(x, y, w, h, source, style)

mgfx.api.icon(x, y, w, h, source, tint)
mgfx.api.iconEx(x, y, w, h, source, style)
```

`Image` is the simple image path. Use `ImageEx` when you need `fit`, `crop`,
`uv`, `mask`, `outerGlow`, background fill, advanced stroke, or backdrop.

Explicit masks:

```lua
mask = mgfx.api.mask("rounded", {radius = 8})
mask = mgfx.api.mask("chamfer", {cuts = {tl = 10, tr = 0, br = 10, bl = 0}})
mask = mgfx.api.mask("circle")
mask = mgfx.api.mask("capsule")
mask = mgfx.api.mask("texture", {
    source = maskMaterial,
    channel = "a", -- a, r, g, b, luma
})
```

A circular avatar is a normal image with a circle mask:

```lua
mgfx.api.imageEx(x, y, size, size, avatarMaterial, {
    mask = mgfx.api.mask("circle"),
    fit = "cover",
})
```

## Widgets

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

Ring and arc thickness is the explicit `width` argument, not `style.width`.
Sector geometry is declared with `innerRadius` and `outerRadius`;
`innerRadius = 0` means a solid sector.

`ArcEx` is a round-capped arc segment for gauges, progress arcs, and circular
ticks. `SectorEx` is a straight-edged radial wedge for wheel menus and radial
selection. They are separate shapes because endpoint geometry and SDF
boundaries differ.

Wheel sector example:

```lua
mgfx.api.sectorEx(cx, cy, innerR, outerR, startDeg, endDeg, {
    fill = mgfx.api.sectorAngularGradient(
        Color(36, 40, 48, 150),
        Color(150, 150, 160, 130)
    ),
    stroke = Color(255, 255, 255, 36),
    strokeWidth = 1,
})
```

## Text

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

Plain text uses native GMod text. Scoreboard rows, player names, chat, logs,
tables, and fast-changing counters should remain native unless they actually
need shader effects.

Only text that needs gradient fill, shadow, stroke/outline, glow, surface
polish, or shader-side weight adjustment should use the MGFX whole-run
composer. `PrewarmText` only affects composer text; it returns `false` for
plain native text.

## Paint Records, Gradients, and Patterns

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
mgfx.api.ringAngularGradient(stops, rotationDeg)
mgfx.api.arcAngularGradient(stops, rotationDeg)
mgfx.api.sectorAngularGradient(stops, rotationDeg)
mgfx.api.stripePattern(spec)
mgfx.api.smokePattern(spec)
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
mgfx.api.roundedBoxEx(x, y, w, h, {
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
local tilt = mgfx.api.pointerTilt(mx, my, {
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
if mgfx.api.pushTransform(tilt, x, y, w, h) {
  mgfx.api.roundedBoxEx(x, y, w, h, { radius = 12, fill = panelFill })
  mgfx.api.ringEx(cx, cy, 42, 6, { fill = ringFill })
  mgfx.api.popTransform()
}
```

## Common Style Fields

Shape:

```lua
{
    fill = Color(...) or mgfx.api.linearGradient(...),
    stroke = Color(...),
    strokeWidth = 1,
    radius = 8,
    cuts = 8,
    backdrop = {blur = 6, tint = Color(...)},
    innerGlow = {color = Color(...), width = 10, opacity = 0.6},
    outerGlow = {color = Color(...), width = 18, opacity = 0.6},
    pattern = mgfx.api.smokePattern(...),
    transform = mgfx.api.pointerTilt(mx, my, {perspective = 900}),
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
    mask = mgfx.api.mask("chamfer", {cuts = 8}),
}
```

Ring / Arc / Sector:

```lua
{
    fill = Color(...) or mgfx.api.sectorAngularGradient(...),
    stroke = Color(...),
    strokeWidth = 1,
    backdrop = {blur = 6, tint = Color(...)},
    pattern = mgfx.api.stripePattern(...),
    innerGlow = {...},
    outerGlow = {...},
}
```

## Capability Queries

```lux
mgfx.api.getCapabilities(mgfx.capabilities.TARGET.ROUNDED_BOX)
mgfx.api.supports(mgfx.capabilities.TARGET.RING, "outerGlow")
```

Capability target constants still live under `mgfx.capabilities.TARGET` in Lux
and under `MGFX.TARGET` on the installed facade. The query functions themselves
are part of the unified API surface.

The capability table describes implemented render slots, not planned features.
Current shape rendering is based on immediate shader paths. The older
shape/data-texture batch prototype was removed; see [Removed Shape Batching Design](./BATCHING).
