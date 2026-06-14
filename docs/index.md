---
layout: home

hero:
  name: "MGFX"
  text: "Modern GMod FX"
  tagline: "A Lux package for shader-backed immediate UI rendering in Garry's Mod. Import @lux/mgfx from Lux source, let luxc generate the GMod loader, and expose MGFX.* only when GLua-facing code needs it."
  actions:
    - theme: brand
      text: Use from Lux
      link: /USAGE
    - theme: alt
      text: API Reference
      link: /API
    - theme: alt
      text: 中文文档
      link: /zh/

features:
  - title: Native Lux package
    details: MGFX lives in @lux/mgfx, uses Lux module parts, client realm exports, and compiler-generated GMod loaders instead of hand-written include order.
  - title: Shape-correct effects
    details: Rounded boxes, chamfers, circles, capsules, rings, arcs, sectors, and image masks clip glow and backdrop effects to their own coverage.
  - title: Full stop gradients
    details: Linear, radial, conic, ring/sector-local radial, and shape-local angular gradients use one normalized stop pipeline.
  - title: Efficient parameter upload
    details: Hot shape parameters use the matrix-backed parameter page instead of many per-float Source material calls.
---

## Quick Start from Lux

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"

client fn paintPanel(panel, w, h) {
  mgfx.frame.startPanel(panel, w, h)

  mgfx.paint.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = mgfx.style.linearGradient(0, 0, 1, 1, {
      {0.00, Color(30, 130, 255, 230)},
      {0.55, Color(60, 200, 255, 230)},
      {1.00, Color(255, 210, 110, 230)},
    }),
    backdrop = { blur = 8, tint = Color(0, 8, 12, 120) },
  })

  mgfx.widgets.progressBarEx(24, 84, w - 48, 10, 0.72, {
    radius = 5,
    track = Color(10, 18, 24, 190),
    fill = mgfx.style.linearGradient(
      0, 0, 1, 0,
      Color(30, 130, 255, 230),
      Color(60, 200, 255, 230)
    ),
  })

  mgfx.frame.endPanel()
}
```

```lua [Generated Lua Shape]
local mgfx = __lux_import("@lux/mgfx")

local function paintPanel(panel, w, h)
  mgfx.frame.startPanel(panel, w, h)
  mgfx.paint.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = mgfx.style.linearGradient(0, 0, 1, 1, {
      {0.00, Color(30, 130, 255, 230)},
      {0.55, Color(60, 200, 255, 230)},
      {1.00, Color(255, 210, 110, 230)},
    }),
    backdrop = {
      blur = 8,
      tint = Color(0, 8, 12, 120),
    },
  })
  mgfx.widgets.progressBarEx(24, 84, w - 48, 10, 0.72, {
    radius = 5,
    track = Color(10, 18, 24, 190),
    fill = mgfx.style.linearGradient(
      0, 0, 1, 0,
      Color(30, 130, 255, 230),
      Color(60, 200, 255, 230)
    ),
  })
  mgfx.frame.endPanel()
end
```

:::

## Documentation Entry Points

<div class="mgfx-capability-grid">
  <a href="./USAGE">
    <span>Start</span>
    <strong>Use from Lux</strong>
    <small>Install luxc, import @lux/mgfx, expose MGFX.* when needed, and build the generated GMod addon.</small>
  </a>
  <a href="./API">
    <span>API</span>
    <strong>Overview</strong>
    <small>Frame scopes, primitives, images, widgets, text, paint records, transforms, and capability queries.</small>
  </a>
  <a href="./api-reference/">
    <span>Reference</span>
    <strong>Detailed API</strong>
    <small>Function signatures, parameter tables, notes, return values, and examples grouped by feature family.</small>
  </a>
  <a href="./PERFORMANCE">
    <span>Performance</span>
    <strong>Runtime Model</strong>
    <small>Immediate paths, matrix parameter upload, mathematical patterns, allocations, and text cost.</small>
  </a>
  <a href="./ARCHITECTURE">
    <span>Architecture</span>
    <strong>Lux Package Internals</strong>
    <small>How the old Lua addon was rebuilt with module parts, realm exports, package imports, and generated loaders.</small>
  </a>
  <a href="./SHADERS">
    <span>Shader</span>
    <strong>Build and Packaging</strong>
    <small>Shaderpack generation, register layout, gradient LUTs, alpha handling, and GMA validation.</small>
  </a>
</div>

## Boundary

MGFX is a Lux package and a renderer, not a UI framework. It does not own
layout, input, focus, component lifecycle, transition state, or hit testing.
Callers compute the current visual state each frame and pass explicit draw
arguments to the Lux module API or to the installed `MGFX.*` facade.

Text follows the same rule. Plain text should stay on native GMod text paths.
Only text that needs MGFX shader effects should use the whole-run composer.

## License

MGFX is distributed under the Lux MGFX Non-Commercial License. Non-commercial
use is allowed under that license. Commercial use requires a separate written
license from the copyright holder. See [the repository license files](https://github.com/TimeWatcher/mgfx-docs-site)
and the package license before shipping MGFX in a server, product, paid
service, sponsored work, or other commercial context.

## Maintenance Rules

- When public APIs change, update [API Overview](./API) and the relevant [detailed API family page](./api-reference/).
- When shader parameter layout, gradient LUTs, alpha handling, or shaderpack generation changes, update [Shader Build and Packaging](./SHADERS).
- When the runtime path changes, update [MGFX Performance Model](./PERFORMANCE).
- Do not edit generated site output by hand. Change the Markdown source and rebuild.

## Example: Wheel Sector

::: code-group

```lux [Lux]
local fill = mgfx.style.sectorAngularGradient({
  {0.00, Color(35, 212, 232, 170)},
  {0.52, Color(80, 220, 160, 150)},
  {1.00, Color(245, 158, 11, 135)},
})

mgfx.widgets.sectorEx(cx, cy, innerR, outerR, startDeg, endDeg, {
  fill = fill,
  stroke = Color(255, 255, 255, 34),
  strokeWidth = 1,
  backdrop = { blur = 7, tint = Color(4, 10, 14, 120) },
  innerGlow = { color = Color(255, 96, 78, 90), width = 28 },
  transform = mgfx.geometry.pointerTilt(mx, my, {
    perspective = 900,
    maxRotateX = 4,
    maxRotateY = 6,
  }),
})
```

```lua [Installed MGFX Facade]
local fill = MGFX.SectorAngularGradient({
    {0.00, Color(35, 212, 232, 170)},
    {0.52, Color(80, 220, 160, 150)},
    {1.00, Color(245, 158, 11, 135)},
})

MGFX.SectorEx(cx, cy, innerR, outerR, startDeg, endDeg, {
    fill = fill,
    stroke = Color(255, 255, 255, 34),
    strokeWidth = 1,
    backdrop = {blur = 7, tint = Color(4, 10, 14, 120)},
    innerGlow = {color = Color(255, 96, 78, 90), width = 28},
    transform = MGFX.PointerTilt(mx, my, {
        perspective = 900,
        maxRotateX = 4,
        maxRotateY = 6,
    }),
})
```

:::
