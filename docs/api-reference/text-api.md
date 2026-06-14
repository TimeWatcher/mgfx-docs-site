# Text API

Text functions register font aliases, define reusable styles, measure text,
prewarm composed text, and draw native or shader-effect text.

Facade aliases: `MGFX.RegisterTextFont`, `MGFX.DefineTextStyle`,
`MGFX.GetTextStyle`, `MGFX.ResolveTextStyle`, `MGFX.MeasureText`,
`MGFX.MeasureTextBox`, `MGFX.PrewarmText`, `MGFX.Text`, `MGFX.TextEx`,
`MGFX.TextBox`, `MGFX.TextBoxEx`.

## Scope

- Plain labels, scoreboards, tables, logs, and chat should prefer native GMod
  text.
- Use MGFX composed text only when you need gradient face, outline, glow,
  shadow, surface polish, tracking, or shader-side weight adjustment.
- Stable FX text can be prewarmed before first paint.

## This Page

- [registerFont](#registerfont) - Register an MGFX text font alias.
- [defineStyle](#definestyle) - Store a reusable text style record.
- [getStyle](#getstyle) - Retrieve a previously defined style.
- [resolveStyle](#resolvestyle) - Normalize a style table for reuse.
- [measure](#measure) - Measure one text run.
- [measureBox](#measurebox) - Measure wrapped or ellipsized fixed-width text.
- [prewarm](#prewarm) - Bake stable composed text before first draw.
- [draw](#draw) - Simple text helper.
- [drawEx](#drawex) - Advanced text with composed effects.
- [box](#box) - Simple text box helper.
- [boxEx](#boxex) - Advanced text box with wrapping, alignment, and effects.

## Function Reference

## registerFont

```lux
mgfx.text.registerFont(name, spec)
```

Registers an MGFX text font alias.

| Field | Description |
| --- | --- |
| `face / font` | System font face to create. |
| `sourceFont / nativeFont` | Existing GMod font when no face is provided. |
| `size` | Font size before oversampling. |
| `weight` | Native font weight. |
| `italic` | Native italic variant hint. |
| `lineHeight` | Default line height for this alias. |
| `tracking / letterSpacing` | Default extra spacing. |
| `syntheticWeight / allowSyntheticWeight` | Allow shader-side weight adjustment. |

Returns `true`/`false` depending on registration success.

```lux
mgfx.text.registerFont("ScoreTitle", {
  face = "Noto Sans SC",
  size = 28,
  weight = 700,
  lineHeight = 32,
})
```

## defineStyle

```lux
mgfx.text.defineStyle(name, style)
```

Stores a reusable text style record.

| Field | Description |
| --- | --- |
| `extends / base` | Style name, style table, or array of styles to inherit. |
| `fill / color` | `Color` or MGFX gradient record. |
| `alignX / align / alignY / valign` | Text anchor or text-box alignment. |
| `lineHeight` | Multiline spacing. |
| `tracking / letterSpacing` | Extra spacing between characters. |
| `shadow` | Shadow spec. |
| `stroke / outline` | Outline spec with optional softness. |
| `glow` | Glow spec. |
| `bold / thin / weightAdjust` | Shader-side edge weight adjustment. |
| `italic` | Request italic font variant where possible. |

```lux
mgfx.text.defineStyle("ScoreGlow", {
  fill = mgfx.style.linearGradient(0, 0, 1, 0, Color(255, 255, 255), Color(130, 210, 255)),
  glow = { size = 5, color = Color(80, 170, 255, 110) },
})
```

## getStyle

```lux
mgfx.text.getStyle(name)
```

Returns a previously defined text style table, or `nil`.

## resolveStyle

```lux
mgfx.text.resolveStyle(style)
```

Normalizes a text style table for reuse. This is useful when constructing a
style once and passing it to many draw calls.

## measure

```lux
mgfx.text.measure(value, font = "DermaDefault")
```

Measures one text run and returns `width, height`. Use `measureBox` for wrapping
or ellipsis.

## measureBox

```lux
mgfx.text.measureBox(value, font, w, textStyle = nil)
```

Measures text inside a fixed-width box. It accounts for wrapping, ellipsis,
line height, and style fields relevant to layout.

## prewarm

```lux
mgfx.text.prewarm(value, font, textStyle = nil)
```

Prewarms stable text that will use the composer. Plain native text returns
`false` because it does not live in the atlas.

```lux
mgfx.text.prewarm("ROUND START", "HUDTitleFX", {
  glow = { size = 6, color = Color(80, 190, 255, 90) },
})
```

## draw

```lux
mgfx.text.draw(value, font, x, y, color, ax = 0, ay = 0)
```

Simple text helper. Without shader work it routes to native GMod text.

## drawEx

```lux
mgfx.text.drawEx(value, font, x, y, color, ax = 0, ay = 0, textStyle = nil)
```

Advanced text draw. If the style requests shader work, the record uses the
whole-run composer when available and falls back to native approximations when
needed.

```lux
mgfx.text.drawEx("TEXT FX", "HUDTitleFX", x, y, Color(235, 246, 255),
  TEXT_ALIGN_CENTER, TEXT_ALIGN_CENTER, {
    fill = mgfx.style.linearGradient(0, 0, 1, 0, Color(130, 220, 255), Color(255, 170, 110)),
    stroke = { width = 0.55, softness = 0.60, color = Color(0, 0, 0, 130) },
    glow = { size = 5, softness = 0.65, color = Color(80, 190, 255, 70) },
  })
```

## box

```lux
mgfx.text.box(value, font, x, y, w, h, color, alignX = TEXT_ALIGN_LEFT, alignY = TEXT_ALIGN_TOP)
```

Simple text box helper for fixed-width labels.

## boxEx

```lux
mgfx.text.boxEx(value, font, x, y, w, h, textStyle = nil)
```

Advanced text box with wrapping, ellipsis, alignment, and composed effects.

Useful style fields include `wrap`, `ellipsis`, `alignX`, `alignY`, `lineHeight`,
`tracking`, `fill`, `shadow`, `stroke`, and `glow`.

[Back to detailed API index](./index)
