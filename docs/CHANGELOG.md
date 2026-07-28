# Changelog

All notable MGFX changes are recorded here. MGFX has not published version
tags yet, so work that has not been assigned to a release remains under
**Unreleased**.

## Unreleased

_Current working set reviewed on 2026-07-28._

### Added

- Added explicit Plain GLua entry modules for core initialization, server
  distribution, the legacy global bridge, developer tools, and examples:
  `mgfx/init.lua`, `mgfx/distribute.lua`, `mgfx/global.lua`,
  `mgfx/devtools.lua`, and `mgfx/examples.lua`.
- Added matching opt-in Lux packages for global installation and developer
  tools: `@lux/mgfx/global` and `@lux/mgfx/devtools`.
- Added an isolated animated-material test addon covering native material
  drawing, styled source capture, and a second captured material used as an
  image mask.

### Changed

- Plain GLua integrations can now keep MGFX local with
  `local mgfx = include("mgfx/init.lua")`. The core entry does not install a
  public global, commands, hooks, or examples. The shipped autorun loader
  remains a compatibility adapter that installs `MGFX` and developer tools.
- Importing `@lux/mgfx` no longer installs globals or developer tools, and the
  default `mgfx.api` runtime is created lazily on first use. Code that needs a
  GLua-facing global must import `installGlobal` from `@lux/mgfx/global`.
- Examples are no longer loaded by the default addon or developer-tools path.
  They must be distributed and installed explicitly. The unsafe
  `mgfx_reload` and `mgfx_hot_reload` commands were removed.
- Shader-pack loaders now return their data as modules instead of mutating a
  process-wide `MGFXShaderPack` global.
- MGFX source licensing changed from the former non-commercial license to the
  **Lux MGFX Community License 1.1**. It permits qualifying non-profit
  community servers to recover reasonable operating costs and permits free
  plugin development and distribution; commercial use still requires written
  authorization.

### Fixed

- `IMaterial` is now treated as an executable image source. `ImageUV`,
  radius-free `Image`, and effect-free `ImageEx` bind the original material
  directly, preserving material proxies such as `AnimatedTexture`.
- Styled image paths that require MGFX composition now execute the source
  material into a render target before applying radius, mask, stroke, shadow,
  outer glow, or backdrop effects. Material-backed texture masks use a separate
  capture target so source and mask animation remain independent.
- Image texture shaders now sample `$texture1` consistently, while material
  slots that may be rebound through `SetTexture` start with real texture values.
  This removes the `$texture2` type warning and avoids bypassing material
  behavior through `$basetexture` extraction.
- Material capture now preserves render blend, color modulation, alpha,
  scissor, and coverage state, and applies corrected UVs at capture boundaries.
- The internal white image texture now uses an owned material wrapper instead
  of assuming that `color/white` is a mounted VMT.
- Text composition can discover its ConVars after optional developer tools are
  installed. Text renderer and profiler state no longer depend on a global
  `MGFX` table, and profiler wrappers can be uninstalled cleanly.

### Documentation

- Updated the Plain GLua and Lux setup guides for the explicit entry points and
  optional adapters.
- Documented direct and captured `IMaterial` behavior, animated materials,
  material-backed masks, sampler assignments, and render-target capture costs.
- Updated architecture, shader, licensing, repository, generated-output, and
  bilingual documentation to match the runtime changes.
