# MGFX Text Rendering

MGFX text is not a universal replacement for native text. The renderer has two
explicit routes:

1. Plain text uses native GMod drawing. Single-line `TextEx` without effects
   falls back to `draw.SimpleText`; multiline text, tracking, and explicit line
   height use a lightweight native layout helper.
2. Text that needs shader-side effects uses the whole-run native-raster
   composer. A full run is baked to a persistent atlas page, then drawn through
   the text shader.

Scoreboards, logs, chat, dense tables, and normal labels should default to
native GMod text unless they truly need MGFX-only effects.

## Routing Rules

`MGFX.Text`, `MGFX.TextEx`, `MGFX.TextBox`, and `MGFX.TextBoxEx` create text
records. At flush time, each record is routed by its content:

```text
no shader work       -> native
style.native         -> native/native fallback
style.noComposed     -> native/native fallback
shader work present  -> whole-run composer
```

Shader work means at least one of:

- MGFX gradient fill
- shadow
- stroke/outline
- glow
- literal `surface` polish
- `bold`, `thin`, or `weightAdjust`

If the composer is disabled, unavailable, over the per-frame bake budget, or a
bake fails, the record uses native fallback for that frame. Native fallback can
approximate color, shadow, and stroke, but it cannot reproduce shader glow,
surface polish, or shape-correct gradient fill.

The older glyph-composer route has been removed. Text routing is no longer a
public style control.

## Font Aliases

`RegisterTextFont(name, spec)` registers a font alias shared by the native path
and composer path. If `spec.face` is provided, MGFX creates a native font
internally. If no face is provided, MGFX uses `spec.sourceFont`,
`spec.nativeFont`, or an existing GMod font with the same name.

```lua
MGFX.RegisterTextFont("HUDTitleFX", {
    face = "Bahnschrift",
    size = 28,
    weight = 700,
    lineHeight = 34,
})
```

For existing GMod fonts without a registered `face`, MGFX cannot safely create
true bold, thin, or italic variants because it does not know the original font
family. Register aliases with explicit `face`, `size`, and `weight` when
variants are needed.

The default CJK face is `Noto Sans SC`, provided by
`resource/fonts/notosanssc-vf.ttf`.

## Supported Effects

The composer supports:

- solid color and MGFX gradient fill
- line height and tracking
- soft shadow
- outer glow
- outline/stroke with `softness`
- literal `surface` polish
- shader-side bold/thin weight adjustment
- text box wrapping and ellipsis

Example:

```lua
MGFX.TextEx("TEXT FX", "HUDTitleFX", x, y, Color(235, 246, 255),
    TEXT_ALIGN_CENTER, TEXT_ALIGN_CENTER, {
        fill = MGFX.LinearGradient(0, 0, 1, 0,
            Color(130, 220, 255),
            Color(255, 170, 110)
        ),
        stroke = {width = 0.55, softness = 0.60, color = Color(0, 0, 0, 130)},
        glow = {size = 5, softness = 0.65, color = Color(80, 190, 255, 70)},
    })
```

UI outline quality mostly comes from `stroke.softness`. Hard black outlines are
useful for debug comparison, but they look rough on scoreboard and HUD labels.
Common values:

```lua
stroke = {
    width = 0.55,
    softness = 0.60,
    color = Color(0, 0, 0, 120),
}
```

`surface` is for subtle face polish only. A common range is `0.06` to `0.18`;
CJK and small labels should use low values.

```lua
surface = {strength = 0.10}
```

## Prewarming

`PrewarmText(text, font, style)` only affects records that will use the
composer. Plain text returns `false` because it does not live in the atlas.

Stable FX text can be prewarmed to avoid first-frame bake stalls:

```lua
MGFX.PrewarmText("ROUND START", "HUDTitleFX", {
    glow = {size = 6, color = Color(80, 190, 255, 90)},
})
```

Do not prewarm normal labels, player names, chat lines, or scoreboard rows
unless they actually use shader effects.

## Performance Model

Native text is the cheap path. It is the default fit for:

- scoreboard row text
- player names without shader effects
- tables and virtual lists
- chat/log
- high-frequency counters
- normal labels and headers

Composer text is the expensive path. Cache hits avoid rebake, but they still
pay for style routing, material setup, atlas bookkeeping, and textured blit.
Cache misses bake a native glyph run into a render target during the current
paint pass.

High-churn FX text consumes one whole-run atlas entry per distinct string. Use
native drawing for counters that do not need effects. If a counter truly needs
effects, stabilize or prewarm known values, or accept the bake cost.

Useful cvars:

```text
mgfx_text_composed 0/1
mgfx_text_composed_budget 6
```

`mgfx_text_composed_budget` limits cache-miss bakes per frame. When the budget
is exhausted, the text uses native fallback for the current frame and can try
the composer later.

`mgfx_text_status` is the first health check. In stable FX text frames, these
values should be low or near zero:

```text
fallbackBatches
fallbackRecords
prewarmFails
prewarmRestarts
evicts
```

Useful profiler labels:

```text
text.nativePlain      plain native path
text.nativeFallback   native fallback for composer records
text.prepareRoutes    route selection
text.prewarm          pre-bake queued composer records
text.entryFor         cache lookup / bake
text.composeBatch     atlas blit batching
text.dispatch         final route dispatch
```

## Bake Render State

Atlas bakes happen inside the host VGUI `Paint` / `HUDPaint` flow:

```text
MGFX.EndPanel / EndScreen -> flushFrame -> renderer.Flush -> bake
```

The surface library's ambient render state is still active at that time. The
dangerous state is the surface alpha multiplier: if a host panel is fading in
with `panel:SetAlpha(0)` and `panel:AlphaTo(255, t)`, the first bake can happen
while `surface.GetAlphaMultiplier()` is below 1. That would bake pale or blank
glyphs into the atlas and cache the bad slot.

Every render-target glyph bake must neutralize ambient state while drawing and
restore it afterward. `bake` wraps `drawLayout` in `beginAtlasDraw()` /
`endAtlasDraw()` and forces:

```text
surface alpha multiplier = 1
render color modulation  = 1,1,1
render blend             = 1
```

The atlas stores fully opaque glyphs. Panel fade should apply during the later
screen blit, where inheriting panel alpha is correct.

## Render Target and UV Rules

Composer atlas copy should not use `surface.DrawTexturedRectUV`. Runtime
materials can hit GMod's half-pixel UV correction behavior. The composer uses
an explicit four-point `surface.DrawPoly` quad with handwritten `u/v`.

Text atlas render targets must not use `TEXTUREFLAGS_POINTSAMPLE`. The atlas
needs linear filtering or native glyph antialiasing becomes hard stair-steps
during compose blit.

Composer atlas pages should not exceed a reliably drawable native 2D text bake
area. The current size is 2048x1024 per page, with more pages used for growth.

Push render targets with an explicit viewport:

```lua
render.PushRenderTarget(rt, 0, 0, atlasW, atlasH)
```

Restore the MGFX clip scissor after leaving the render target.

## Atlas Management

The text atlas uses at most 16 pages of 2048x1024. When allocation enters the
reserved tail page, MGFX marks the next flush boundary for reset. It cannot
reset mid-flush because queued draws may still reference existing entries.

Reset must fully clear the atlas page. Individual slots are still cleared
before each bake, but a full RT clear guarantees that a generation reset cannot
sample stale glyph pixels.

## Removed Routes

These paths have been explicitly removed:

- legacy font-atlas Lua module
- text SDF/MTSDF shader
- static score text atlas resource
- glyph composer
- SDF glyph atlas
- SDF data-texture batching

Future text work should extend either the native path or the whole-run composer
and prove the benefit with profiling. Do not reintroduce runtime SDF from alpha
glyphs.
