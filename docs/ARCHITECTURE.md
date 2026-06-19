# MGFX Lux Package Architecture

MGFX is now maintained as the Lux package `@lux/mgfx`. The old direct-Lua addon
architecture matters only as history: the public rendering model is preserved,
but loader ownership, module boundaries, internal visibility, and build output
are now defined by Lux.

Read this page after [Use MGFX](./USAGE). Public rendering behavior is documented
in [API Overview](./API) and [Detailed API Reference](./api-reference/).

## Build-Time Shape

MGFX source lives in the standalone `lux-mgfx` package set:

```text
lux-mgfx/
  lux.package.toml
  lux/
    mgfx/
      src/
      capabilities/src/
      commands/src/
      frame/src/
      geometry/src/
      materials/src/
      paint/src/
      primitives/src/
      roundrect/src/
      shaderpack/src/
      style/src/
      text/src/
      widgets/src/
      console/src/
      demo/src/
      wheel_demo/src/
  precompiled/
  tools/
```

Each directory is a Lux module. A module may contain multiple part files. The
module entry file is `module.lux`, and it can declare deterministic part order:

```lux
part order { "module", "cl_base", "cl_gradients", "cl_patterns", "cl_masks", "cl_fill", "cl_lut", "cl_install" }
```

All parts inside one module share one logical module scope. Top-level helper
bindings are module-private by default and visible to other parts in the same
module, subject to realm checks. Only explicit `export client` declarations
become part of the package API.

This replaces the old approach of:

- hand-written `include(...)` order
- numeric filename prefixes
- ad-hoc global helper tables
- a standalone `lua/autorun/server/mgfx_loader.lua`

The GMod backend now owns generated loaders and `AddCSLuaFile` batching.

Shader maintenance source is the one exception to the module list:
`lux/mgfx/shadersrc` contains HLSL, committed `.vcs` output, and the shaderpack
generator. It is build input, not a Lux module. The binary shader compiler lives
outside the package tree under `tools/mgfx`.

## Runtime Shape

`@lux/mgfx` is client-only. The root module imports the feature modules and
exposes a unified `api` table. The installed facade is built from that API:

```lux
import * as api_mod from "@lux/mgfx/api"

export client fn install(owner = nil) {
  return api_mod.install(owner)
}
```

The actual package also installs capabilities, commands, geometry, materials,
profiler, roundrect, primitives, text, and shaderpack support. `installGlobal`
is a small facade helper:

```lux
export client fn installGlobal(name = "MGFX") {
  local api = _G[name] ?? {}
  _G[name] = install(api)
  return _G[name]
}
```

New Lux code should call `mgfx.api.*`. GLua-facing code can use the installed
`MGFX.*` facade when needed. Plain GLua users get that facade from the generated
loader distribution in `dist/lua`, which is built from the `precompiled/`
project.

## Public Surface Policy

MGFX intentionally has two public naming surfaces:

| Surface | Used by | Naming |
| --- | --- | --- |
| Unified Lux API | Lux source | `mgfx.api.roundedBoxEx`, `mgfx.api.linearGradient` |
| Installed facade | old GLua panels, third-party code, demos | `MGFX.RoundedBoxEx`, `MGFX.LinearGradient` |

`mgfx.api.*` is the primary Lux-facing surface. The PascalCase facade is
installed from the same API for GMod ergonomics and migration, not because MGFX
relies on global state internally.

## Module Boundaries

`@lux/mgfx/src` is the composition root. It wires the unified API, installs the
public facade, and may still export internal submodules for advanced package
maintenance. Normal UI code should not choose calls by submodule.

The module names below are internal maintenance boundaries, not recommended
user entry points.

`@lux/mgfx/style` owns style normalization:

- colors and alpha helpers
- solid and gradient fill records
- multi-stop gradient normalization and LUT binding
- patterns
- masks
- stroke, radius, backdrop, and glow helpers

`@lux/mgfx/capabilities` owns target capability data and style slot
normalization. Capability entries describe implemented render behavior, not a
wishlist.

`@lux/mgfx/frame` owns active frame state, panel/screen scopes, rectangular
clip stack, command queueing, and frame flush.

`@lux/mgfx/commands` owns normalized command records and replay helpers. If a
command format is positional internally, that layout must stay behind this
module.

`@lux/mgfx/geometry` owns low-level drawing helpers, transform stack, image fit
and UV helpers, texture size helpers, and draw statistics.

`@lux/mgfx/materials` owns shaderpack mounting, render target/material creation,
texture helpers, and shader status.

`@lux/mgfx/roundrect` owns rounded-box, circle, and capsule rendering.

`@lux/mgfx/primitives` owns chamfer boxes, lines, and convex polygons.

`@lux/mgfx/widgets` owns progress bars, segment bars, rings, arcs, sectors,
images, icons, image masks, and text draw-call bridge helpers. Its `module.lux`
declares part order so the source can be split by feature without numeric
filename noise.

`@lux/mgfx/text` owns text style resolution, measurement, native text routing,
whole-run composed text, atlas management, text profiling, and installation.

`@lux/mgfx/paint` is an internal drawing layer over roundrect, primitives,
widgets, images, and styles. Public Lux code should use `mgfx.api.*` instead of
importing this module directly.

`@lux/mgfx/console`, `@lux/mgfx/demo`, and `@lux/mgfx/wheel_demo` are optional
developer tools. They are package modules, not external addon dependencies.

## Realm Boundary

All MGFX runtime exports are `client`. This is explicit in source:

```lux
export client fn roundedBoxEx(...)
export client fn install(owner)
```

A shared Lux module may mention MGFX only in code that is explicitly marked
client. The realm checker should reject accidental server/shared use of MGFX
APIs. Unknown external GMod symbols are handled by Lux's external-symbol policy,
but MGFX's own Lux symbols are strict.

## Loader Boundary

MGFX does not ship a hand-written project loader in Lux projects. The generated
GMod loader is owned by `luxc gmod build`.

Build output is responsible for:

- compiling imported package modules
- emitting client Lua artifacts
- emitting server loader code that sends client files
- preserving generated source maps
- avoiding generic filenames that collide in GMod's shared `lua/` namespace

MGFX source should not call `AddCSLuaFile` directly. If a runtime resource such
as a font must be sent to clients, keep that behavior in the relevant client or
server-facing package helper and document it in [Shader Build and Packaging](./SHADERS).

## Renderer Boundary

MGFX remains an immediate renderer. It does not own layout, focus, input,
component lifecycle, animation state, or hit testing. A future Lux UI layer may
build on MGFX, but MGFX must not depend on that UI layer.

The renderer owns:

- frame scopes
- primitives and widgets
- canonical style records
- target capability metadata
- shader/material setup
- text command replay
- clip and fallback behavior

The caller owns:

- panel lifecycle
- layout
- interaction state
- animation state
- hit testing
- data binding

## Maintenance Rules

- Keep new code in Lux style: use module-private helpers, explicit exports,
  realm markers, expression functions where they improve readability, and
  module part order instead of filename prefixes.
- Do not introduce new GLua-style loader files for package internals.
- Do not widen exports just to share helpers. Top-level declarations are already
  visible to parts in the same module; exports are the external API.
- Keep `install(owner)` functions thin and deterministic. Installation maps
  module exports onto the PascalCase facade, but renderer logic should stay in
  feature modules.
- Do not recreate the removed generic batch scheduler without representative
  GMod profiling and a narrow design.
- When public API changes, update both Lux module examples and installed
  `MGFX.*` facade examples.
