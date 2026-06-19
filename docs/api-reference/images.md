# Images and Masks

Image functions draw materials, icons, rounded avatars, chamfered images, and
texture-masked content.

Facade aliases: `MGFX.Image`, `MGFX.ImageEx`, `MGFX.Icon`, `MGFX.IconEx`,
`MGFX.Mask`.

## Scope

- Use `image` for straightforward texture drawing.
- Use `imageEx` when you need layout, masks, fill/background, stroke, glow, or
  backdrop.
- Circular avatars, chamfered avatars, and texture masks are expressed through
  `style.mask = mgfx.api.mask(...)`.

## This Page

- [image](#image) - Simple image helper with optional radius and tint.
- [imageEx](#imageex) - Advanced image drawing path with layout, mask, and effects.
- [icon](#icon) - Simple icon helper with contain-style behavior.
- [iconEx](#iconex) - Advanced icon path using image-style fields.
- [mask](#mask) - Create an explicit image mask record.

## Function Reference

## image

```lux
mgfx.api.image(x, y, w, h, source, radius = nil, tint = nil)
```

Simple image helper.

| Parameter | Description |
| --- | --- |
| `source` | Material path string, IMaterial-like object, or texture-like object. |
| `radius` | Optional rounded radius. |
| `tint` | Optional `Color` tint. |

Use `imageEx` for fit, crop, UVs, masks, backgrounds, strokes, glow, or
backdrop.

## imageEx

```lux
mgfx.api.imageEx(x, y, w, h, source, style)
```

Advanced image path.

#### Layout Fields

| Field | Description |
| --- | --- |
| `fit / objectFit` | `"fill"`, `"stretch"`, `"cover"`, or `"contain"`. |
| `position` | `{x, y}`, `{number, number}`, or alignment fields. |
| `crop` | `{x, y, w, h}`, optionally with `pixels = true`. |
| `uv` | `{u0, v0, u1, v1}` or equivalent coordinate fields. |
| `radius` | Number, `true`, `"circle"`, percentage string, or px string. |
| `mask` | Mask record, string alias, `false`, or `"none"`. |

#### Visual Fields

| Field | Description |
| --- | --- |
| `tint / color` | Multiplies source image color. |
| `alpha` | Extra opacity multiplier, either `0..1` or `0..255`. |
| `fill / background` | Optional background behind transparent or masked pixels. |
| `stroke / strokeWidth` | Optional mask-aware stroke when supported. |
| `shadow` | Drop shadow spec. |
| `outerGlow` | Image or mask-aware outer glow. |
| `backdrop` | Framebuffer blur/tint clipped by the image or mask. |

#### Example

```lux
mgfx.api.imageEx(x, y, 72, 72, avatarMat, {
  fit = "cover",
  mask = mgfx.api.mask("circle"),
  outerGlow = { color = Color(80, 170, 255, 70), width = 14 },
})
```

## icon

```lux
mgfx.api.icon(x, y, w, h, source, tint = nil)
```

Simple icon helper. It is intended for small glyph-like images and defaults to
aspect-preserving layout through the icon path.

## iconEx

```lux
mgfx.api.iconEx(x, y, w, h, source, style)
```

Advanced icon path. It uses image-style fields but defaults to icon-friendly
layout.

## mask

```lux
mgfx.api.mask(kind, spec = nil)
```

Creates an explicit mask record for `imageEx` and `iconEx`.

#### Kinds

| Kind | Main Fields | Result |
| --- | --- | --- |
| `"rounded"` | `radius` | Rounded image coverage. Aliases: `round`, `roundedbox`, `roundrect`. |
| `"chamfer"` | `cuts` | Chamfered image coverage. Alias: `bevel`. |
| `"circle"` | none | Circle coverage based on the shorter side. |
| `"capsule"` | none | Capsule coverage along the longer axis. Alias: `pill`. |
| `"texture"` | `source`, `channel`, `invert`, `uv`, `crop` | Use a second texture as coverage. Aliases: `alpha`, `image`. |
| `false / "none"` | none | Disable mask when used as `style.mask`. |

#### Texture Mask Fields

| Field | Description |
| --- | --- |
| `source / material / texture / image` | Mask texture source. |
| `channel` | `"a"`, `"r"`, `"g"`, `"b"`, or `"luma"`. Defaults to `"a"`. |
| `invert / inverse` | Invert mask coverage. |
| `uv` | Mask texture UV rectangle. |
| `crop` | Alternate source rectangle form. |

#### Example

```lux
local textureMask = mgfx.api.mask("texture", {
  source = maskMaterial,
  channel = "a",
  invert = false,
})

mgfx.api.imageEx(x, y, w, h, source, {
  mask = textureMask,
  fit = "cover",
})
```

[Back to detailed API index](./index)
