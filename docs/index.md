---
layout: home

hero:
  name: "MGFX"
  text: "Modern GMod FX"
  tagline: "Shader-backed immediate rendering for Garry's Mod UI. Start with your runtime, then use the same renderer concepts for shapes, images, meters, text effects, gradients, masks, glow, and backdrop blur."
  actions:
    - theme: brand
      text: Start With GLua
      link: /guide/glua
    - theme: alt
      text: Start With Lux
      link: /guide/lux
    - theme: alt
      text: API Reference
      link: /api-reference/
    - theme: alt
      text: License
      link: /LICENSE
    - theme: alt
      text: 中文文档
      link: /zh/

features:
  - title: Pick your runtime first
    details: Plain GLua projects include mgfx/init.lua and keep its returned API local. Lux projects import @lux/mgfx and use mgfx.api.*.
  - title: Immediate renderer, not framework
    details: MGFX draws the explicit visual state you pass every frame. Layout, input, focus, animation, and hit testing stay in caller code.
  - title: Shape-aware effects
    details: Rounded boxes, chamfers, polygons, rings, sectors, images, and masks clip shadow, glow, backdrop, and patterns to their own coverage.
  - title: Paired examples
    details: User-facing guides show GLua and Lux equivalents so readers do not need to translate API names by guesswork.
  - title: Community-friendly license
    details: Qualifying community servers may recover operating costs, and free plugin development is permitted under the Community License 1.1.
---

## Quick Start

::: code-group

```lua [GLua]
local mgfx = include("mgfx/init.lua")

function PANEL:Paint(w, h)
    mgfx.StartPanel(self, w, h)

    mgfx.RoundedBoxEx(0, 0, w, h, {
        radius = 10,
        fill = Color(8, 14, 20, 170),
        backdrop = {blur = 8, tint = Color(0, 8, 12, 120)},
        outerGlow = {color = Color(70, 205, 255, 64), width = 12},
    })

    mgfx.ProgressBarEx(24, 84, w - 48, 10, 0.72, {
        radius = 5,
        track = Color(10, 18, 24, 190),
        fill = mgfx.LinearGradient(0, 0, 1, 0, Color(30, 130, 255), Color(255, 210, 110)),
    })

    mgfx.EndPanel()
end
```

```lux [Lux]
import * as mgfx from "@lux/mgfx"

fn PANEL:Paint(w, h) {
  local draw = mgfx.api
  draw.startPanel(self, w, h)

  draw.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = Color(8, 14, 20, 170),
    backdrop = {blur = 8, tint = Color(0, 8, 12, 120)},
    outerGlow = {color = Color(70, 205, 255, 64), width = 12},
  })

  draw.progressBarEx(24, 84, w - 48, 10, 0.72, {
    radius = 5,
    track = Color(10, 18, 24, 190),
    fill = draw.linearGradient(0, 0, 1, 0, Color(30, 130, 255), Color(255, 210, 110)),
  })

  draw.endPanel();
}
```

:::

## Start Here

<div class="mgfx-capability-grid">
  <a href="./guide/glua">
    <span>GLua</span>
    <strong>Plain GLua Quick Start</strong>
    <small>Include mgfx/init.lua and keep the returned PascalCase API table local to your addon.</small>
  </a>
  <a href="./guide/lux">
    <span>Lux</span>
    <strong>Lux Quick Start</strong>
    <small>Install @lux/mgfx, import mgfx.api, and use the lowerCamelCase facade.</small>
  </a>
  <a href="./guide/concepts">
    <span>Guide</span>
    <strong>Core Concepts</strong>
    <small>Frame scope, Name/NameEx, style tables, text routing, and API naming.</small>
  </a>
  <a href="./api-reference/">
    <span>Reference</span>
    <strong>API Reference</strong>
    <small>Exact signatures, parameter tables, style fields, return values, and caveats.</small>
  </a>
</div>

## Reading Order

1. Pick [Plain GLua](./guide/glua) or [Lux](./guide/lux).
2. Read [Core Concepts](./guide/concepts) before copying advanced effects.
3. Use [Effects](./guide/effects) for shadow, glow, backdrop, and patterns.
4. Open the [API Reference](./api-reference/) only when you need exact fields.

## Scope

MGFX is a renderer, not a UI framework. It does not own layout, input, focus, component lifecycle, transition state, or hit testing. Callers compute the current visual state every frame and pass explicit draw arguments to the Plain GLua API table or `mgfx.api.*`.

Plain labels should usually use native GMod text or `Text`. Use `TextEx` only when you need shader text effects such as gradient faces, glow, stroke, or high-quality shadow.

## Maintenance Rules

- Public API changes must update [Core Concepts](./guide/concepts) and the matching [API Reference task page](./api-reference/).
- User-facing examples should show GLua and Lux equivalents unless the page is explicitly runtime-specific.
- Shader parameter layout, gradient LUT, alpha, or shaderpack changes must update [Shaders and Packaging](./SHADERS).
- Runtime performance changes must update [Performance Model](./PERFORMANCE).
- Do not edit `docs-site/` by hand. Update `docs/` and rebuild the site.
