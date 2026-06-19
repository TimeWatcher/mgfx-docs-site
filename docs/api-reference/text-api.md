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

- [registerTextFont](#registertextfont) - Register an MGFX text font alias.
- [defineTextStyle](#definetextstyle) - Store a reusable text style record.
- [getTextStyle](#gettextstyle) - Retrieve a previously defined style.
- [resolveTextStyle](#resolvetextstyle) - Normalize a style table for reuse.
- [measureText](#measuretext) - Measure one text run.
- [measureTextBox](#measuretextbox) - Measure wrapped or ellipsized fixed-width text.
- [prewarmText](#prewarmtext) - Bake stable composed text before first draw.
- [text](#text) - Simple text helper.
- [textEx](#textex) - Advanced text with composed effects.
- [textBox](#textbox) - Simple text box helper.
- [textBoxEx](#textboxex) - Advanced text box with wrapping, alignment, and effects.

## Function Reference

## registerTextFont

```lux
mgfx.api.registerTextFont(name, spec)
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
mgfx.api.registerTextFont("ScoreTitle", {
  face = "Noto Sans SC",
  size = 28,
  weight = 700,
  lineHeight = 32,
})
```

## defineTextStyle

```lux
mgfx.api.defineTextStyle(name, style)
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
mgfx.api.defineTextStyle("ScoreGlow", {
  fill = mgfx.api.linearGradient(0, 0, 1, 0, Color(255, 255, 255), Color(130, 210, 255)),
  glow = { size = 5, color = Color(80, 170, 255, 110) },
})
```

## getTextStyle

```lux
mgfx.api.getTextStyle(name)
```

Returns a previously defined text style table, or `nil`.

## resolveTextStyle

```lux
mgfx.api.resolveTextStyle(style)
```

Normalizes a text style table for reuse. This is useful when constructing a
style once and passing it to many draw calls.

## measureText

```lux
mgfx.api.measureText(value, font = "DermaDefault")
```

Measures one text run and returns `width, height`. Use `measureTextBox` for
wrapping or ellipsis.

## measureTextBox

```lux
mgfx.api.measureTextBox(value, font, w, textStyle = nil)
```

Measures text inside a fixed-width box. It accounts for wrapping, ellipsis,
line height, and style fields relevant to layout.

## prewarmText

```lux
mgfx.api.prewarmText(value, font, textStyle = nil)
```

Prewarms stable text that will use the composer. Plain native text returns
`false` because it does not live in the atlas.

```lux
mgfx.api.prewarmText("ROUND START", "HUDTitleFX", {
  glow = { size = 6, color = Color(80, 190, 255, 90) },
})
```

## text

```lux
mgfx.api.text(value, font, x, y, color, ax = 0, ay = 0)
```

Simple text helper. Without shader work it routes to native GMod text.

## textEx

```lux
mgfx.api.textEx(value, font, x, y, color, ax = 0, ay = 0, textStyle = nil)
```

Advanced text draw. If the style requests shader work, the record uses the
whole-run composer when available and falls back to native approximations when
needed.

```lux
mgfx.api.textEx("TEXT FX", "HUDTitleFX", x, y, Color(235, 246, 255),
  TEXT_ALIGN_CENTER, TEXT_ALIGN_CENTER, {
    fill = mgfx.api.linearGradient(0, 0, 1, 0, Color(130, 220, 255), Color(255, 170, 110)),
    stroke = { width = 0.55, softness = 0.60, color = Color(0, 0, 0, 130) },
    glow = { size = 5, softness = 0.65, color = Color(80, 190, 255, 70) },
  })
```

## textBox

```lux
mgfx.api.textBox(value, font, x, y, w, h, color, alignX = TEXT_ALIGN_LEFT, alignY = TEXT_ALIGN_TOP)
```

Simple text box helper for fixed-width labels.

## textBoxEx

```lux
mgfx.api.textBoxEx(value, font, x, y, w, h, textStyle = nil)
```

Advanced text box with wrapping, ellipsis, alignment, and composed effects.

Useful style fields include `wrap`, `ellipsis`, `alignX`, `alignY`, `lineHeight`,
`tracking`, `fill`, `shadow`, `stroke`, and `glow`.

[Back to detailed API index](./index)
