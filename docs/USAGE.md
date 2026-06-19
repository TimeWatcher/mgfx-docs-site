# Use MGFX

MGFX is authored as the Lux package `@lux/mgfx`, but it has two supported
consumption paths:

- **Use with Plain GLua**: mount the generated loader distribution and call the
  installed `MGFX.*` facade from existing Lua files.
- **Use from Lux**: import `@lux/mgfx` from Lux source and let `luxc gmod build`
  compile the package into the addon output.

New Lux code should import `@lux/mgfx` once and call the unified
`mgfx.api.*` surface. Existing GLua panels can keep the familiar PascalCase
facade such as `MGFX.StartPanel`, `MGFX.RoundedBoxEx`,
`MGFX.LinearGradient`, and `MGFX.TextEx`.

<span id="use-with-plain-glua"></span>

## Use with Plain GLua

Use the generated loader distribution when an addon is still written in GLua or
when you want to adopt MGFX without adopting Lux source in that project. Copy or
mount the generated `lua/` tree from the MGFX release into the addon. The client
loader initializes MGFX and installs `_G.MGFX` by default.

```text
my_addon/
  lua/
    autorun/
      mgfx.lua
    mgfx/
      loader_shared.lua
      loader_client.lua
      loader_server.lua
      ...
```

After the loader has run, draw through `MGFX.*`:

```lua
function PANEL:Paint(w, h)
  MGFX.StartPanel(self, w, h)

  MGFX.RoundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = MGFX.LinearGradient(
      0,
      0,
      1,
      1,
      Color(30, 130, 255, 230),
      Color(255, 210, 110, 230)
    ),
    backdrop = { blur = 8, tint = Color(0, 8, 12, 120) },
  })

  MGFX.EndPanel()
end
```

The plain GLua distribution is not a hand-written legacy loader and it is not an
inline copy of the package. It is generated from the same Lux MGFX source, with
the GMod loader already emitted and the global facade installed for non-Lux
callers.

<span id="use-from-lux"></span>

## Use from Lux

Create a Lux project and install the required packages:

```powershell
luxc init my_addon --std
Push-Location my_addon
luxc install @lux/mgfx --from github:TimeWatcher/lux-mgfx
Pop-Location
```

Recommended `lux.toml`:

```toml
package_id = "my_addon"
bundle_id = "my_addon"

[target.gmod]
source_root = "src"
out = "generated/lua"
runtime_base = "lux/my_addon"
autorun = true
source_comments = "readable"

[target.gmod.realm]
unknown_external = "warn"

[dependencies]
"@lux/std" = { github = "TimeWatcher/lux-packages" }
"@lux/mgfx" = { github = "TimeWatcher/lux-mgfx" }
```

Lux has no registry. The manifest names concrete package sources with
`github`, `url`, or `path`, and `lux.lock` records the resolved package graph.
Use `--tag`, `--branch`, or `--commit` when a project needs a pinned package set.

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

Lux code should draw through `mgfx.api.*`:

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"

client fn paintPanel(panel, w, h) {
  mgfx.api.startPanel(panel, w, h)

  mgfx.api.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = mgfx.api.linearGradient(
      0, 0, 1, 1,
      Color(20, 36, 48, 220),
      Color(38, 112, 138, 220)
    ),
    backdrop = { blur = 7, tint = Color(0, 8, 12, 120) },
  })

  mgfx.api.endPanel()
}
```

```lua [Generated Lua Shape]
local mgfx = __lux_import("@lux/mgfx")

local function paintPanel(panel, w, h)
  mgfx.api.startPanel(panel, w, h)
  mgfx.api.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = mgfx.api.linearGradient(
      0, 0, 1, 1,
      Color(20, 36, 48, 220),
      Color(38, 112, 138, 220)
    ),
    backdrop = {
      blur = 7,
      tint = Color(0, 8, 12, 120),
    },
  })
  mgfx.api.endPanel()
end
```

:::

This is the preferred style for new Lux code. It keeps imports explicit, gives
the compiler realm information, and avoids relying on a global.

## Expose the GLua Facade from Lux

If old GLua code or VGUI panels in the same addon need to call `MGFX.*`, install
the global API once on the client:

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

The installed owner uses PascalCase method names for GMod ergonomics. Lux code
uses the same operations through lower-case `mgfx.api.*` names such as
`mgfx.api.roundedBoxEx`.

## Build the Addon

Run the GMod backend from the project root:

```powershell
luxc gmod build --manifest lux.toml
```

The build step:

- resolves `@lux/mgfx` from `lux.lock`
- compiles the imported MGFX module parts
- keeps MGFX exports client-only
- writes generated Lua under `target.gmod.out`
- emits source maps for generated Lua
- generates the GMod loader and optional `autorun` forwarder

Copy or mount the generated `lua/` tree as part of your addon, or point the
manifest `out` path at the Lua root used by your local development workflow.

## What Happened to the Old Lua Addon?

The original MGFX was a direct Lua addon under `garrysmod/addons/mgfx`. That
history matters for API continuity, but the current source of truth is the Lux
package. Do not copy the old hand-written autorun loaders into new projects.

Plain GLua users should use the generated loader distribution. Lux users should
import `@lux/mgfx` and let `luxc gmod build` generate the loader for that
project.

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
