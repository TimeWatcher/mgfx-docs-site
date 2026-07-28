# API Reference

This section is the task-oriented reference for public MGFX functions. It is intentionally about signatures, fields, return values, and caveats. Start with [Core Concepts](../guide/concepts) if you want the mental model first.

These pages are documentation groups only. Plain GLua code calls the PascalCase
methods on the table returned by `include("mgfx/init.lua")`; Lux code calls
`mgfx.api.*` from `@lux/mgfx`. Do not choose imports based on page names.

Function blocks on detailed pages use `MGFX` as a conventional local owner name:

```lua
local MGFX = include("mgfx/init.lua")
```

That notation does not require or install `_G.MGFX`.

## Runtime Names

| Plain GLua | Lux |
| --- | --- |
| `mgfx.StartPanel(...)` | `mgfx.api.startPanel(...)` |
| `mgfx.RoundedBoxEx(...)` | `mgfx.api.roundedBoxEx(...)` |
| `mgfx.ImageEx(...)` | `mgfx.api.imageEx(...)` |
| `mgfx.Mask(...)` | `mgfx.api.mask(...)` |
| `mgfx.Clip(...)` | `mgfx.api.clip(...)` |
| `mgfx.ProgressBarEx(...)` | `mgfx.api.progressBarEx(...)` |
| `mgfx.LinearGradient(...)` | `mgfx.api.linearGradient(...)` |
| `mgfx.TextEx(...)` | `mgfx.api.textEx(...)` |

API names, Lua parameter names, and shader terms are kept in English.

## Task Pages

| Area | Page | Main APIs |
| --- | --- | --- |
| Frame scope and diagnostics | [Frame and Debug](./frame) | `StartPanel`, `EndPanel`, `StartScreen`, `EndScreen`, `PushClip`, `PopClip`, `ShaderStatus` |
| Reusable antialiased clipping | [Coverage Masks, Clip, and Self-Clipping](./masks-and-clip) | `Mask`, `Clip`, `Masks`, `Invalidate`, shape `children` callbacks |
| Shapes and lines | [Shapes and Lines](./primitives) | `RoundedBoxEx`, `ChamferBoxEx`, `PolyEx`, `LineEx`, `CircleEx`, `CapsuleEx` |
| Images | [Images and Per-Image Masks](./images) | `ImageEx`, `IconEx`, image `style.mask`, `MaterialSource`, `TextureSource` |
| HUD meters and sectors | [HUD Meters and Sectors](./widgets) | `ProgressBarEx`, `SegmentBarEx`, `RingEx`, `ArcEx`, `SectorEx` |
| Text | [Text API](./text-api) | `Text`, `TextEx`, `TextBoxEx`, `MeasureText`, `PrewarmText` |
| Paint records and transforms | [Paint, Patterns, Transforms](./paint) | `LinearGradient`, `SmokePattern`, `WornPattern`, `Transform`, `PointerTilt`, `GetCapabilities` |

## Reading Order

1. [Plain GLua Quick Start](../guide/glua) or [Lux Quick Start](../guide/lux)
2. [Core Concepts](../guide/concepts)
3. The task page for the API you are calling
4. [Performance Model](../PERFORMANCE) when changing hot paths
5. [Shaders and Packaging](../SHADERS) when changing shader parameters or shaderpack contents

## Notes

- Subpackages are public enough for maintainers and narrow tooling, but the facade is the normal user-facing API.
- Capabilities describe implemented render slots, not future plans.
