# Lux Quick Start

Use this path when your project is built with Lux and consumes `@lux/mgfx`.

## Install

Install from GitHub:

```powershell
luxc install @lux/mgfx --from github:TimeWatcher/lux-mgfx --tag v0.1.0
```

Install from a local checkout:

```powershell
luxc install @lux/mgfx --from C:\Development\gmod\lux-mgfx
```

Normal Lux code should import the public facade and call `mgfx.api.*`. Importing
`@lux/mgfx` does not install globals, console commands, hooks, or examples.

Put panel drawing code in a client-realm Lux source file.

## First Panel

::: code-group

```lux [Lux]
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

```lua [GLua Equivalent]
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

:::

## API Naming

The two runtimes expose the same behavior through different naming styles:

| GLua | Lux |
| --- | --- |
| `mgfx.StartPanel` | `mgfx.api.startPanel` |
| `mgfx.RoundedBoxEx` | `mgfx.api.roundedBoxEx` |
| `mgfx.ProgressBarEx` | `mgfx.api.progressBarEx` |
| `mgfx.LinearGradient` | `mgfx.api.linearGradient` |
| `mgfx.WornPattern` | `mgfx.api.wornPattern` |
| `mgfx.TextEx` | `mgfx.api.textEx` |

The old `@lux/mgfx/paint` package is not an application entry point. Paint records such as gradients and patterns are created through `mgfx.api` helpers and passed as `fill`, `track`, `pattern`, or related style fields.

## Global Bridge

Only install a global table when a GLua panel or legacy integration expects `MGFX.*`:

```lux
import * as mgfx from "@lux/mgfx"
import { installGlobal } from "@lux/mgfx/global"

client {
  installGlobal("MGFX", mgfx.create());
}
```

New Lux UI code should keep using `mgfx.api.*`. Development commands are a
separate opt-in through `@lux/mgfx/devtools`:

```lux
import * as mgfx from "@lux/mgfx"
import * as devtools from "@lux/mgfx/devtools"

client {
  devtools.install(mgfx.create());
}
```

## Next

- Read [Core Concepts](./concepts) for frame scope, `Name` / `NameEx`, and style tables.
- Use [API Reference](../api-reference/) when you need exact parameters and fields.
- Use [Effects](./effects) for `shadow`, `outerGlow`, `backdrop`, and patterns.
