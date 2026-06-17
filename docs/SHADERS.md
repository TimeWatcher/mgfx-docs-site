# Shader Build and Packaging

MGFX ships shader bytecode as a Lux client module, not as a hand-written Lua
file under an addon tree. The generated shaderpack lives in:

```text
lux-mgfx/lux/mgfx/shaderpack/src/cl_module.lux
```

That module exports the active `VERSION`, a base64 GMA payload, and helper
functions used by `@lux/mgfx/materials`. When a project imports `@lux/mgfx`,
`luxc gmod build` includes the shaderpack module in the generated client Lua and
the generated GMod loader sends it to clients with the rest of the client
artifacts.

## Runtime Flow

At startup, `@lux/mgfx` installs the shaderpack and creates materials:

```lux
import * as shaderpack from "@lux/mgfx/shaderpack"
import * as materials from "@lux/mgfx/materials"

client fn createMgfxState() {
  shaderpack.installGlobal()
  materials.create()
}
```

The generated Lua shape is equivalent to importing the two compiled modules and
calling the same runtime functions. There is no project-maintained
`include(...)` chain and no MGFX-specific autorun loader.

Internally, `materials.create()`:

1. Reads the current shaderpack with `shaderpack.current()`.
2. Base64-decodes the embedded GMA payload.
3. Writes it to `data/mgfx_shaders_<version>.gma`.
4. Mounts it through `game.MountGMA`.
5. Creates `screenspace_general` materials that point at versioned pixel and
   vertex shader names.

If a project deliberately provides a global `MGFXShaderPack` before MGFX
initializes, `shaderpack.current()` can use that external pack. Normal Lux
projects should rely on the package-shipped module.

## Source Layout

The runtime package source is:

```text
lux-mgfx/
  lux/
    mgfx/
      shadersrc/
        build.py
        build_shaders.bat
        compile_shader_list.txt
        src/
      shaderpack/src/cl_module.lux
      materials/src/
        module.lux
        cl_base.lux
        cl_create.lux
        cl_status.lux
        cl_texture.lux
        cl_install.lux
      roundrect/src/
      primitives/src/
      widgets/src/
      text/src/
      style/src/
  precompiled/
  dist/lua/
```

`shadersrc/src/` contains the MGFX HLSL source and the committed `.vcs` output
under `shaders/fxc/`. The committed `.vcs` files make pack-only regeneration
possible even when the shader compiler cannot run on the current machine.

The Windows shader compiler is carried as repository-level build
infrastructure, outside the Lux package tree:

```text
lux-mgfx/tools/mgfx/sdk_screenspace_shaders/shadersrc/bin/ShaderCompile.exe
```

That binary toolchain is not part of the `lux/mgfx` module layout and is not
copied into a generated addon. It exists only so MGFX maintainers can rebuild
shader bytecode from source. Garry's Mod itself does not ship a shader compiler,
so builds must use this bundled tool or an explicit `MGFX_SHADERCOMPILE` path.

## Rebuild Contract

When shader bytecode changes, the result must be regenerated into
`lux-mgfx/lux/mgfx/shaderpack/src/cl_module.lux`. The plain GLua loader build
under `dist/lua` consumes the same generated shaderpack through the
`precompiled/` project.

Common maintenance commands from `lux-mgfx/lux/mgfx/shadersrc`:

```powershell
# Repack committed .vcs files into the Lux shaderpack module.
python .\build.py --pack-only

# Reproduce the current checked-in version.
python .\build.py --pack-only --version 1781243087 --gma-timestamp 1781243088

# Recompile HLSL with the bundled compiler, then regenerate the Lux module.
python .\build.py

# Override the bundled compiler when testing another ShaderCompile.exe build.
$env:MGFX_SHADERCOMPILE = "C:\Path\To\ShaderCompile.exe"
python .\build.py
```

The generated module must provide this public shape:

```lux
export client const VERSION = "..."

export client fn gma()
export client fn pack()
export client fn current()
export client fn installGlobal(name = "MGFXShaderPack")
```

`pack()` returns:

```lua
{
  Version = VERSION,
  GMA = "<base64 gma payload>",
}
```

Keep `VERSION` aligned with the shader names embedded in the GMA. MGFX material
creation prefixes shader names with that version, for example:

```text
<version>_mgfx_roundrect_ps30
<version>_mgfx_vs30
```

If the version and compiled shader filenames drift apart, materials will be
created but will fail to bind real shaders, and MGFX will fall back.

## Diagnostics

Install the console package during development:

```lux
import * as mgfx from "@lux/mgfx"
import * as console from "@lux/mgfx/console"

client fn installTools() {
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
}
```

Then use:

```text
mgfx_status
mgfx_param_probe
mgfx_param_bench
mgfx_profile 1
mgfx_draw_counts 1
```

For formal FPS checks:

```text
mgfx_profile 0
mgfx_draw_counts 0
```

Draw counters are disabled by default. In complex immediate UIs, counting a few
hundred draws can itself become measurable overhead.

## GMod Shader Rules

These are hard rules learned from failures, not style preferences:

- Do not rely directly on `DrawTexturedRectUV` for generated materials unless
  UV correction is already handled. Prefer explicit four-point textured quads.
- Antialiasing needs final screen-space size or UV derivatives. Logical size is
  not enough for shader AA in physical pixels.
- Clamp radius and chamfer cuts before SDF calculation.
- Do not casually add data-texture parameter paths. The removed batch prototype
  showed that upload and scheduling costs can outweigh draw-call savings.
- `screenspace_general` constant registers must follow the documented MGFX
  layout. MGFX currently treats `$c0..$c3` as custom draw parameters and
  `$c4..$c7` as texture-size registers. Do not use temporary registers such as
  `$c8`; they may compile but read as 0 or undefined at runtime.

## Parameter Page Layout

The 16 common float parameters for hot shape shaders use `$viewprojmat`, read in
the pixel shader as:

```hlsl
const float4x4 MGFXExtraParams : register(c11);
```

Lux-generated Lua writes the matrix with:

```lua
mat:SetMatrix("$viewprojmat", matrix)
```

GMod/Source matrix indices arrive in HLSL by column: `matrix[0]` reads
`1,5,9,13`, `matrix[1]` reads `2,6,10,14`, and so on. Runtime code must use the
shared MGFX packing helper instead of guessing row/column order at call sites.

`MGFXExtraParams` is the main page. `$c0..$c3` are auxiliary pages for fused
shaders that need more than 16 floats, such as chamfer cuts plus inner glow or
ring stroke plus inner glow. Parameters that fit the main page should not use
auxiliary pages.

In local GMod benchmarks, 16 independent `SetFloat` calls were roughly 7 times
more expensive than `SetUnpacked + SetMatrix`, so hot shape paths should not
return to per-float upload.

## Fused Shape Fast Paths

MGFX allows small special-purpose fused shaders, but they must reproduce the
original layered result exactly.

Current paths:

- `mgfx_roundrect_fx_ps30`: roundrect fill/stroke plus inner glow. It is used
  only when inner glow would otherwise require an extra pass.
- `mgfx_chamfer_ps30`: chamfer fill/stroke plus optional inner glow. Fill and
  stroke use `MGFXExtraParams`; cuts and inner-glow data use `$c0..$c3`.
- `mgfx_ring_fx_ps30`: ring/arc/sector fill plus optional inner glow and stroke.
  Fill-only rings still use the lighter `mgfx_ring_ps30`.

These are not general "everything shaders". `pattern`, `shadow`, `outerGlow`,
and `backdrop` may stay as separate passes because their draw bounds, source
texture, or blend order are visible behavior. Any future fusion must prove
pixel-level source-over equivalence, including transparent gradients and AA
edges.

## Shape-Space Gradients

MGFX has two gradient spaces:

- Rectangular primitive space: `linearGradient`, `radialGradient`, and
  `conicGradient` sample normalized UV inside primitive bounds. Rectangular
  radial gradients must compensate by the shorter side to avoid stretching.
- Ring/sector space: `ringRadialGradient`, `sectorRadialGradient`, and angular
  fills are interpreted by the ring shader using the current geometry.

`arcEx` and `sectorEx` are not the same concept. `arcEx` is a round-capped arc
segment suitable for gauge marks. `sectorEx` is a straight-edged radial wedge
suitable for wheel menus. They may share a material family, but their
signed-distance boundaries differ.

Ring/sector local radial fill:

```text
t = (r - innerRadius) / (outerRadius - innerRadius)
```

Local angular fill:

```text
t = (angle - startDeg) / (endDeg - startDeg)
```

This is not equivalent to a global `conicGradient`, which always describes a
full 360-degree angular field around its center.

## Gradient LUT

Multi-stop gradients use a shared 1D LUT:

- Runtime code normalizes, sorts, and completes 0/1 endpoints, then bakes a
  256x4 render target.
- The shader computes `t` and samples `$texture1`.
- Linear, radial, conic, ring/sector radial, and shape/ring/arc/sector angular
  gradients all use the same LUT sampling path.
- LUTs are cached by stop table in a bounded LRU. Fast animation of stop colors
  or positions churns the cache; prefer animating geometry, opacity, or an
  explicit offset.
- Fill records returned by `mgfx.style.linearGradient`,
  `mgfx.style.radialGradient`, and `mgfx.style.conicGradient` are treated as
  immutable. Create a new fill record when stops or colors change.

## Alpha Pitfall

Do not write gradient stop alpha into render-target alpha and then read it with
`tex2D(...).a`. In GMod generated material / render-target paths, alpha write
and later sampling can make transparent stops behave like opaque black.

Visible symptom: a radial or linear highlight should fade to `alpha = 0`, but
instead becomes a black rectangle or sector over the layers below it.

The current `lut-alpha-rgb-v3` path deliberately stores alpha as ordinary color
data:

```text
rows 0..1  store visible RGB, force alpha to 255
rows 2..3  store stop alpha in grayscale RGB
```

`mgfx_gradient_lut()` samples both data groups and reconstructs
`float4(rgb, alpha)`. This is compatibility protection around Source
RT/blend/alpha-write behavior.

If this path changes, verify at least:

- `Color(r, g, b, 0)` stop outputs final alpha 0, not black.
- Radial gradients over colored backgrounds reveal the layers underneath.
- Text, lines, rounded boxes, ring radial gradients, and shape-local angular
  gradients all read the same reconstructed alpha.

## Generated Addon Contents

A Lux project does not package the MGFX source tree directly. It packages the
generated GMod output from `luxc gmod build`.

Expected runtime shape:

```text
generated/
  lua/
    autorun/
      <bundle-specific loader>.lua
    lux/
      client/
        ...
```

The exact generated filenames are owned by the Lux GMod backend and include the
project bundle/package identity to avoid addon-wide filename collisions. Do not
add an MGFX-specific autorun loader by hand.

Expected non-runtime documentation repository contents:

```text
docs/
site_build/
node_modules/
package.json
package-lock.json
```

Those files belong to this documentation repository and should not be copied
into a runtime GMA.

For why the batching prototype was removed, see
[Removed Shape Batching Design](./BATCHING).
