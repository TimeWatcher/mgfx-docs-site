# Use MGFX

MGFX is a library with two supported implementations. New integrations should
load the renderer core explicitly and keep optional integration behavior out of
the default path.

| Layer | Plain GLua | Lux |
| --- | --- | --- |
| Core library | `include("mgfx/init.lua")` | `@lux/mgfx` |
| Global compatibility | `mgfx/global.lua` | `@lux/mgfx/global` |
| Commands and diagnostics | `mgfx/devtools.lua` | `@lux/mgfx/devtools` |
| Examples | `mgfx/examples.lua` | explicit demo package imports |

The core entry does not install a public global, console commands, hooks,
diagnostic cvars, or examples.

<span id="use-with-plain-glua"></span>

## Use with Plain GLua

Use `lua-mgfx` for an ordinary Garry's Mod addon or gamemode. The library files
live under `lua/mgfx`; client code includes only the public entry point.

```text
my_addon/
  lua/
    mgfx/
      init.lua
      distribute.lua
      global.lua
      devtools.lua
      ...
  materials/
  resource/
```

### Distribute the library

From server code, call the distribution helper:

```lua
if SERVER then
    local distribute = include("mgfx/distribute.lua")
    distribute()
end
```

This sends the core Lua files and shaderpack chunks and registers the bundled
font. Use `distribute({font = false})` if another addon owns font delivery. Demo
files are excluded unless you explicitly pass `{examples = true}`.

### Load the client API

Keep the returned table local to your addon:

```lua
local mgfx = include("mgfx/init.lua")

function PANEL:Paint(w, h)
    mgfx.StartPanel(self, w, h)

    mgfx.RoundedBoxEx(0, 0, w, h, {
        radius = 10,
        fill = mgfx.LinearGradient(
            0, 0, 1, 1,
            Color(30, 130, 255, 230),
            Color(255, 210, 110, 230)
        ),
        backdrop = {blur = 8, tint = Color(0, 8, 12, 120)},
    })

    mgfx.EndPanel()
end
```

Do not include `cl_mgfx*.lua` files directly. `init.lua` owns module ordering,
shaderpack attachment, and cleanup of the private load context.

### Optional Plain GLua adapters

Install a global only when old GLua code requires `MGFX.*`:

```lua
include("mgfx/global.lua")("MGFX", mgfx)
```

Install commands and diagnostic cvars only in development environments that
need them:

```lua
include("mgfx/devtools.lua")(mgfx)
```

Examples require the global compatibility layer and must be distributed and
loaded explicitly:

```lua
-- Server
include("mgfx/distribute.lua")({examples = true})

-- Client
local mgfx = include("mgfx/init.lua")
include("mgfx/global.lua")("MGFX", mgfx)
include("mgfx/devtools.lua")(mgfx)
include("mgfx/examples.lua")
```

The bundled autorun files remain a compatibility adapter for standalone legacy
installs. They distribute the library, install `_G.MGFX`, and enable devtools,
but they do not load demos. Omit those autorun adapters when vendoring MGFX as a
side-effect-free library inside another addon.

<span id="use-from-lux"></span>

## Use from Lux

Install the package set:

```powershell
luxc install @lux/mgfx --from github:TimeWatcher/lux-mgfx --tag v0.1.0
```

Importing `@lux/mgfx` is side-effect free with respect to globals, commands,
hooks, diagnostic cvars, and examples. The default `mgfx.api` renderer is
created lazily on its first use:

```lux
import * as mgfx from "@lux/mgfx"

client fn paintPanel(panel, w, h) {
  local draw = mgfx.api
  draw.startPanel(panel, w, h)
  draw.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = draw.linearGradient(
      0, 0, 1, 1,
      Color(20, 36, 48, 220),
      Color(38, 112, 138, 220)
    ),
  })
  draw.endPanel();
}
```

Call `mgfx.create()` when your integration needs an explicit independent
PascalCase owner table:

```lux
import * as mgfx from "@lux/mgfx"

client fn createRenderer() = mgfx.create()
```

### Optional Lux adapters

The global bridge and devtools are separate packages:

```lux
import * as mgfx from "@lux/mgfx"
import * as devtools from "@lux/mgfx/devtools"
import { installGlobal } from "@lux/mgfx/global"

client fn installLegacyTools() {
  local api = mgfx.create()
  installGlobal("MGFX", api)
  devtools.install(api);
}
```

`@lux/mgfx/devtools` installs the diagnostic cvars, profiler API wrappers, and
console commands. It does not import demo packages. Import and install demos
only when they are needed:

```lux
import * as mgfx from "@lux/mgfx"
import * as demo from "@lux/mgfx/demo"
import * as devtools from "@lux/mgfx/devtools"
import * as wheelDemo from "@lux/mgfx/wheel_demo"

client fn installDemos() {
  local api = mgfx.create()
  devtools.install(api)
  demo.install(api)
  wheelDemo.install(api);
}
```

Run `luxc gmod build --manifest lux.toml` from the project root. Lux resolves
only the imported package graph, preserves client ownership, writes generated
Lua and source maps, and emits the configured loader/autorun forwarder for your
addon.

## Runtime Commands

After devtools is installed, useful client commands include:

```text
mgfx_status
mgfx_selftest
mgfx_profile_status
mgfx_profile_panels
mgfx_profile_hud
mgfx_text_status
mgfx_text_cache_clear
mgfx_text_atlas
```

The removed `mgfx_reload` and `mgfx_hot_reload` commands are not part of the new
entry model. Demo commands such as `mgfx_demo`, `mgfx_perf_demo`, and
`mgfx_wheel_demo` exist only after their corresponding examples are installed.

Useful diagnostic cvars include:

```text
mgfx_force_fallback 0/1
mgfx_profile 0/1
mgfx_draw_counts 0/1
mgfx_text_composed 0/1
mgfx_text_composed_budget 6
```

Disable diagnostics for representative FPS testing.

## License

MGFX uses the [Lux MGFX Community License 1.1](./LICENSE). It permits qualifying
community-server cost recovery and free plugin development; commercial server
monetization, paid plugins, client work, and other commercial use require
separate written authorization.
