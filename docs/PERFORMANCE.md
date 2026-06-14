# MGFX Performance Model

MGFX does not try to "eliminate immediate drawing". Its goal is to keep the
immediate mental model while reducing wasteful Lua work, Source material
parameter uploads, temporary tables, and temporary `Color` objects. In common
GMod UI, draw call count alone is rarely the only problem. The expensive part
is often per-frame scheduling, classification, conversion, and parameter upload
work.

## Current Direction

- Shapes and widgets stay on immediate shader/fallback paths.
- Only measured special-purpose fused shaders remain. The general
  data-texture batch scheduler is not coming back.
- Common shape parameters are uploaded through `$viewprojmat` / pixel shader
  register `c11`.
- `$c0..$c3` are reserved as auxiliary parameter pages for fused shaders.
- Patterns are generated mathematically in shaders, not expanded into many
  `LineEx` calls or geometry segments.
- Scoreboards, tables, chat, and plain labels should prefer native GMod text.

## Parameter Upload

Local GMod benchmark result:

```text
SetFloat x16             ~3.6-3.9 us/iter
SetUnpacked + SetMatrix  ~0.5-0.6 us/iter
```

The hot shape path therefore packs 16 common float parameters into
`Matrix():SetUnpacked(...)` and uploads them with:

```lua
mat:SetMatrix("$viewprojmat", matrix)
```

HLSL reads the page as:

```hlsl
const float4x4 MGFXExtraParams : register(c11);
```

Source/GMod matrix indices arrive in HLSL by column. Lua call sites must use
the shared MGFX packing helper and should not guess row/column order locally.

`SetFloat("$cN_x", ...)` still exists, but it is a fallback. Use `$c0..$c3`
only when a shader has filled the 16-float main page and still needs extra data
in the same pass for visual consistency.

## Mathematical Patterns

Patterns should not be expanded by the caller into many lines, boxes, or
polygons. `StripePattern` and `SmokePattern` are paint slots sampled directly
by the shape shader in local space.

Good direction:

```lua
MGFX.RoundedBoxEx(x, y, w, h, {
    radius = 8,
    fill = Color(8, 18, 24, 220),
    pattern = MGFX.StripePattern({
        color = Color(255, 255, 255, 22),
        spacing = 12,
        width = 2,
        angle = 135,
    }),
})
```

Wrong direction:

```lua
for i = 1, 40 do
    MGFX.LineEx(...)
end
```

If a UI needs a large striped, smoke, scanline, or noise background, add shader
pattern support for the shape rather than stacking primitives in UI code.

## Fused Shader Strategy

Special-purpose shaders are allowed, but they must reproduce the original
layered result.

Requirements:

- Input layout is clear and the main parameter page is `MGFXExtraParams`.
- Extra parameters use only `$c0..$c3`.
- Antialiasing, stroke, transparent gradients, patterns, glow, backdrop, and
  blend order match the original path.
- A pass reduction must not change source-over visual results.

Current fused paths:

```text
roundrect_fx   fill/stroke + innerGlow
chamfer        fill/stroke + optional innerGlow
ring_fx        fill/stroke + optional innerGlow
```

`outerGlow`, `backdrop`, `shadow`, and some `pattern` paths may remain separate
passes because draw bounds, framebuffer reads, blur sources, or blend order are
visible behavior.

## Allocation Rules

Avoid this on hot paint paths:

```lua
MGFX.RoundedBoxEx(x, y, w, h, {
    fill = Color(20, 24, 32, 220),
})

local c = colorAlpha(baseColor, alpha)
```

The first form allocates a style table and a `Color` every frame. The second
form also allocates if it returns a new `Color`. MGFX reuses internal scratch
records where possible, but callers should still cache stable style tables,
patterns, gradients, and colors.

Better:

```lua
local panelFill = Color(20, 24, 32, 220)
local panelStyle = {
    radius = 8,
    fill = panelFill,
}

function PANEL:Paint(w, h)
    MGFX.RoundedBoxEx(0, 0, w, h, panelStyle)
end
```

If a color changes every frame, prefer mutating a reused `Color` object or
caching a small number of UI states. Do not allocate temporary objects for
every scoreboard cell, list row, or HUD table item every frame.

## Text Cost Model

Plain text uses native GMod text. The MGFX text composer is only for text that
needs shader effects such as gradient face, soft outline, glow, surface polish,
or weight bias.

High-frequency text should be native when it does not need effects:

- scoreboard rows
- player names
- dense tables
- chat/log
- rapidly changing counters

For FX text, keep the string set stable and use `MGFX.PrewarmText` where
possible.

## Profiling

During development:

```text
mgfx_profile 1
mgfx_draw_counts 1
mgfx_status
```

For real FPS checks, turn diagnostics off:

```text
mgfx_profile 0
mgfx_draw_counts 0
```

Diagnostics themselves add counters and text output. Final judgment should use
the game with diagnostics disabled.
