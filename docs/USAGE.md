# Use MGFX from Lux

MGFX used to be a standalone GLua addon written directly in Lua. The current
version is a Lux package named `@lux/mgfx`. That means you do not hand-maintain
the old MGFX loader or include order. You import MGFX from Lux source, and
`luxc gmod build` compiles the package, splits realms, emits Lua artifacts, and
generates the GMod loader that sends client files.

The generated runtime still exposes familiar GMod-side APIs such as `MGFX.*`
when you install the package globally. Lux source should prefer the typed module
surface (`mgfx.paint`, `mgfx.style`, `mgfx.frame`, and similar), while legacy
GLua panels can keep calling `MGFX.RoundedBoxEx`, `MGFX.StartPanel`, and other
PascalCase helpers after installation.

## Install the Toolchain

Download a Lux release from the main Lux repository:

```text
tools/
  luxc/
    luxc.exe
    packages/
```

Keep `packages/` next to `luxc.exe`. The release packages contain `@lux/mgfx`,
`@lux/gmod`, `@lux/std`, and the other built-in packages. If you are using a
source checkout instead of a release archive, clone the main repository with
submodules so the package repository is present.

## Project Layout

Create your normal GMod addon directory and put Lux source under `src/`:

```text
my_addon/
  addon.json
  lux.toml
  src/
    hud/
      module.lux
```

Recommended `lux.toml`:

```toml
[gmod]
package_id = "my_addon"
bundle_id = "my_addon"
source_root = "src"
addon_root = "."
generated_root = "generated"
source_comments = "readable"

[target.gmod.realm]
unknown_external = "warn"
```

If you vendor packages manually, add package roots:

```toml
package_roots = "vendor/lux-packages"
```

Normal release users do not need this, because compiler-shipped packages are
found automatically.

## Import MGFX

Use the Lux package id:

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"
import * as console from "@lux/mgfx/console"

client fn installMgfx() {
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
}
```

```lua [Generated Lua Shape]
local mgfx = __lux_import("@lux/mgfx")
local console = __lux_import("@lux/mgfx/console")

local function installMgfx()
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
end
```

:::

`@lux/mgfx` is client-only. Lux's realm checker knows that its public exports
are available to client code. Import it from a `cl_` file or from a declaration
marked `client`.

## Draw from Lux

Lux code can use the lower-case module surface directly:

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"

client fn paintPanel(panel, w, h) {
  mgfx.frame.startPanel(panel, w, h)

  mgfx.paint.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = mgfx.style.linearGradient(
      0, 0, 1, 1,
      Color(20, 36, 48, 220),
      Color(38, 112, 138, 220)
    ),
    backdrop = { blur = 7, tint = Color(0, 8, 12, 120) },
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
    fill = mgfx.style.linearGradient(
      0, 0, 1, 1,
      Color(20, 36, 48, 220),
      Color(38, 112, 138, 220)
    ),
    backdrop = {
      blur = 7,
      tint = Color(0, 8, 12, 120),
    },
  })
  mgfx.frame.endPanel()
end
```

:::

This is the preferred style for new Lux code. It keeps imports explicit, gives
the compiler realm information, and avoids relying on a global.

## Expose the Legacy-Style Global API

If you need old GLua code or VGUI panels to call `MGFX.*`, install the global
API once on the client:

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"
import * as console from "@lux/mgfx/console"
import * as demo from "@lux/mgfx/demo"
import * as wheelDemo from "@lux/mgfx/wheel_demo"

client fn installClientTools() {
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
  demo.install(api)
  wheelDemo.install(api)
}

hook.Add("Initialize", "MyAddonInstallMGFX", installClientTools)
```

```lua [Generated Lua Shape]
local mgfx = __lux_import("@lux/mgfx")
local console = __lux_import("@lux/mgfx/console")
local demo = __lux_import("@lux/mgfx/demo")
local wheelDemo = __lux_import("@lux/mgfx/wheel_demo")

local function installClientTools()
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
  demo.install(api)
  wheelDemo.install(api)
end

hook.Add("Initialize", "MyAddonInstallMGFX", installClientTools)
```

:::

The installed owner uses PascalCase method names for GMod ergonomics:
`StartPanel`, `RoundedBoxEx`, `LinearGradient`, `TextEx`, `Status`, and similar.
The Lux modules keep lower-case names such as `mgfx.paint.roundedBoxEx`.

## Build the Addon

Run the GMod backend:

```powershell
luxc gmod build --manifest lux.toml
```

The build does these MGFX-specific jobs for you:

- resolves `@lux/mgfx` from the package roots
- compiles every imported MGFX module part
- keeps all MGFX exports client-only
- batches generated `AddCSLuaFile` calls through the generated loader
- emits source maps for generated Lua
- writes generated Lua under `generated_root`

You then copy or mount the generated `lua/` tree as part of your addon, or use
your existing development workflow to point Garry's Mod at the generated addon
layout.

## What Happened to the Old Lua Addon?

The original MGFX was a direct Lua addon under `garrysmod/addons/mgfx`. That
history matters for API continuity, but it is no longer the primary
distribution model in Lux projects.

Do not copy the old `lua/autorun/server/mgfx_loader.lua` and
`lua/autorun/client/mgfx_loader.lua` into new Lux projects. The Lux GMod backend
owns loader generation. New MGFX source lives in the package tree:

```text
packages/lux/mgfx/
  src/
  frame/src/
  paint/src/
  style/src/
  text/src/
  widgets/src/
  ...
```

The package is split into Lux modules and module parts. For example,
`widgets/src/module.lux` declares a stable part order:

```lux
part order {
  "module",
  "cl_base",
  "cl_progress",
  "cl_rings",
  "cl_image_source",
  "cl_image_mask",
  "cl_image_draw",
  "cl_images",
  "cl_text",
  "cl_install",
}
```

This replaces numeric file prefixes and hand-maintained include order. It also
lets Lux's module scope rules keep internal helpers private while exporting only
the public API.

## Runtime Commands

The console package can install development commands:

```text
mgfx_status
mgfx_selftest
mgfx_reload
mgfx_demo
mgfx_text_status
mgfx_text_cache_clear
```

Useful client cvars:

```text
mgfx_force_fallback 0/1
mgfx_profile 0/1
mgfx_draw_counts 0/1
mgfx_text_composed 0/1
mgfx_text_composed_budget 6
```

Use diagnostics during development, then disable them for real FPS checks.
