# Plain GLua Quick Start

Use this path when your project is a normal Garry's Mod addon or gamemode and does not use Lux.

## Install

Copy `lua-mgfx/` as your addon root:

```text
garrysmod/addons/mgfx/
  lua/
  materials/
  resource/
  addon.json
```

From client code, include the public entry point and keep its return value local:

```lua
local mgfx = include("mgfx/init.lua")
```

Do not include `cl_mgfx*.lua` implementation files directly. The bundled
autorun files are a legacy adapter that installs a global table and devtools;
new addons and gamemodes should use `init.lua`.

## First Panel

::: code-group

```lua [GLua]
local mgfx = include("mgfx/init.lua")

function PANEL:Paint(w, h)
    mgfx.StartPanel(self, w, h)

    mgfx.RoundedBoxEx(0, 0, w, h, {
        radius = 10,
        fill = Color(18, 24, 32, 230),
        shadow = {x = 0, y = 6, blur = 14, color = Color(0, 0, 0, 110)},
    })

    mgfx.Text("READY", "DermaDefaultBold", 16, 18, color_white, TEXT_ALIGN_LEFT, TEXT_ALIGN_CENTER)

    mgfx.EndPanel()
end
```

```lux [Lux Equivalent]
import * as mgfx from "@lux/mgfx"

fn PANEL:Paint(w, h) {
  local draw = mgfx.api
  draw.startPanel(self, w, h)

  draw.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = Color(18, 24, 32, 230),
    shadow = {x = 0, y = 6, blur = 14, color = Color(0, 0, 0, 110)},
  })

  draw.text("READY", "DermaDefaultBold", 16, 18, color_white, TEXT_ALIGN_LEFT, TEXT_ALIGN_CENTER)

  draw.endPanel();
}
```

:::

`StartPanel` makes all following coordinates panel-local. Do not add `LocalToScreen` offsets yourself.

## HUDPaint

```lua
hook.Add("HUDPaint", "MyMGFXHud", function()
    mgfx.StartScreen()

    local x, y = 32, ScrH() - 72
    mgfx.ProgressBarEx(x, y, 220, 14, LocalPlayer():Health() / 100, {
        radius = 7,
        padding = 2,
        track = Color(255, 255, 255, 22),
        fill = mgfx.LinearGradient(0, 0, 1, 0, Color(255, 96, 78), Color(255, 190, 66)),
    })

    mgfx.EndScreen()
end)
```

Use `StartScreen` only for screen-space HUD and overlay drawing. VGUI panels should use `StartPanel`.

## Names

Plain GLua uses PascalCase names on the returned API table:

| Task | GLua |
| --- | --- |
| Frame start | `mgfx.StartPanel(...)` |
| Shape | `mgfx.RoundedBoxEx(...)` |
| Gradient | `mgfx.LinearGradient(...)` |
| Image mask | `style.mask = {kind = "circle"}` |
| Shared antialiased clip | `mgfx.Mask(...)` + `mgfx.Clip(...)` |
| Text | `mgfx.TextEx(...)` |

## Optional Adapters

Install only the layers your integration needs:

```lua
include("mgfx/global.lua")("MGFX", mgfx) -- legacy GLua consumers
include("mgfx/devtools.lua")(mgfx)       -- commands and diagnostic cvars
```

On the server, distribute the core library with
`include("mgfx/distribute.lua")()`. Pass `{examples = true}` only when the demo
files are required; examples are not distributed or loaded by default.

The Lux equivalents use lowerCamelCase under `mgfx.api`.

## Next

- Read [Core Concepts](./concepts) for frame scope, `Name` / `NameEx`, and style tables.
- Use [API Reference](../api-reference/) when you need exact parameters and fields.
- Use [Effects](./effects) for `shadow`, `outerGlow`, `backdrop`, and patterns.
- Use [Masks and Antialiased Clip](./masks-and-clip) when several draws share one non-rectangular boundary.
