# MGFX Lux Package 架构

MGFX 现在维护为 Lux package：`@lux/mgfx`。旧的直接 Lua addon 架构只作为历史背景
保留：公开渲染模型延续下来，但 loader 归属、模块边界、内部可见性和构建产物都由 Lux
定义。

建议先阅读 [使用 MGFX](./USAGE)。公开渲染行为见 [API 总览](./API) 和
[详细 API 参考](./api-reference/)。

## 构建期形状

MGFX 源码位于独立的 `lux-mgfx` package set：

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

每个目录都是一个 Lux module。一个 module 可以包含多个 part 文件。`module.lux` 是入口
part，并且可以声明确定性的 part order：

```lux
part order { "module", "cl_base", "cl_gradients", "cl_patterns", "cl_masks", "cl_fill", "cl_lut", "cl_install" }
```

同一个 module 内的所有 part 共享一个逻辑 module scope。顶层 helper 默认是
module-private，可被同 module 的其他 part 使用，但仍要通过运行域检查。只有明确的
`export client` 声明才会进入 package API。

这取代了旧做法：

- 手写 `include(...)` 顺序
- 数字文件名前缀
- 临时全局 helper table
- 独立的 `lua/autorun/server/mgfx_loader.lua`

GMod 后端现在负责生成 loader 和批量处理 `AddCSLuaFile`。

Shader 维护源码是这组 module 目录之外的特例：
`lux/mgfx/shadersrc` 保存 HLSL、已提交的 `.vcs` 产物和 shaderpack 生成器。
它是构建输入，不是 Lux module。二进制 shader compiler 位于 package 树之外的
`tools/mgfx`。

## 运行时形状

`@lux/mgfx` 是 client-only package。根模块暴露统一的 `api` 表，安装后的 facade 也从
这层 API 构建：

```lux
import * as api_mod from "@lux/mgfx/api"

export client fn install(owner = nil) {
  return api_mod.install(owner)
}
```

真实 package 还会安装 capabilities、commands、geometry、materials、profiler、
roundrect、primitives、text 和 shaderpack。`installGlobal` 只是一个 facade helper：

```lux
export client fn installGlobal(name = "MGFX") {
  local api = _G[name] ?? {}
  _G[name] = install(api)
  return _G[name]
}
```

新 Lux 代码应调用 `mgfx.api.*`。面向 GLua 的代码需要时可以使用安装后的 `MGFX.*`
facade。Plain GLua 用户会从 `dist/lua` 里的生成 loader 分发获得这个 facade；该分发由
`precompiled/` 项目构建。

## 公开表面策略

MGFX 有意保留两层公开命名：

| 表面 | 使用方 | 命名 |
| --- | --- | --- |
| 统一 Lux API | Lux 源码 | `mgfx.api.roundedBoxEx`、`mgfx.api.linearGradient` |
| installed facade | 旧 GLua panel、第三方代码、demo | `MGFX.RoundedBoxEx`、`MGFX.LinearGradient` |

`mgfx.api.*` 是主要面向 Lux 的表面。PascalCase facade 从同一层 API 安装出来，用于
贴合 GMod 习惯和迁移旧代码，并不代表 MGFX 内部依赖全局状态。

## 模块边界

`@lux/mgfx/src` 是 composition root。它连接统一 API、安装 public facade，也可以保留
内部 submodule 给高级维护使用。普通 UI 代码不应该按 submodule 选择调用入口。

下面的 module 名称是内部维护边界，不是推荐给用户的调用入口。

`@lux/mgfx/style` 负责 style normalization：

- 颜色和 alpha helper
- solid 和 gradient fill record
- 多 stop gradient 规范化和 LUT 绑定
- pattern
- mask
- stroke、radius、backdrop、glow helper

`@lux/mgfx/capabilities` 负责 target capability data 和 style slot normalization。
Capability entry 必须描述已经实现的渲染行为，而不是愿望清单。

`@lux/mgfx/frame` 负责 active frame state、panel/screen scope、矩形 clip stack、
command queue 和 frame flush。

`@lux/mgfx/commands` 负责 normalized command record 和 replay helper。如果 command
内部仍使用 positional 格式，该布局必须留在这个 module 后面。

`@lux/mgfx/geometry` 负责底层绘制 helper、transform stack、image fit/UV helper、
texture size helper 和 draw statistics。

`@lux/mgfx/materials` 负责 shaderpack mount、render target/material creation、
texture helper 和 shader status。

`@lux/mgfx/roundrect` 负责 rounded-box、circle 和 capsule 渲染。

`@lux/mgfx/primitives` 负责 chamfer box、line 和 convex poly。

`@lux/mgfx/widgets` 负责 progress bar、segment bar、ring、arc、sector、image、icon、
image mask 和 text draw-call bridge。它的 `module.lux` 声明 part order，使源码能按
功能拆分，而不需要数字文件名前缀。

`@lux/mgfx/text` 负责 text style resolution、measurement、native text routing、
whole-run composed text、atlas management、text profiling 和安装。

`@lux/mgfx/paint` 是内部绘制层，位于 roundrect、primitives、widgets、images 和
styles 之上。公开 Lux 代码应调用 `mgfx.api.*`，不要直接导入这个 module。

`@lux/mgfx/console`、`@lux/mgfx/demo` 和 `@lux/mgfx/wheel_demo` 是可选开发工具。它们
是 package module，不是外部 addon 依赖。

## 运行域边界

MGFX 的 runtime export 都是 `client`。源码里会显式写出：

```lux
export client fn roundedBoxEx(...)
export client fn install(owner)
```

shared Lux module 只有在明确标记为 client 的代码里才能使用 MGFX。运行域检查器应拒绝
意外的 server/shared MGFX API 使用。未知外部 GMod 符号由 Lux 的 external-symbol 策略
处理，但 MGFX 自己的 Lux symbol 是严格检查的。

## Loader 边界

Lux 项目里的 MGFX 不再携带手写项目 loader。生成的 GMod loader 归 `luxc gmod build`
所有。

构建产物负责：

- 编译被 import 到的 package module
- 输出 client Lua artifact
- 输出会发送客户端文件的 server loader
- 保留 source map
- 避免在 GMod 共享 `lua/` 命名空间里使用会冲突的通用文件名

MGFX 源码不应该直接调用 `AddCSLuaFile`。如果字体这类运行时资源必须下发给客户端，
把行为放在对应 package helper 中，并在 [Shader 与打包](./SHADERS) 里说明。

## Renderer 边界

MGFX 仍然是 immediate renderer。它不拥有 layout、focus、input、component lifecycle、
animation state 或 hit testing。未来 Lux UI 层可以建立在 MGFX 之上，但 MGFX 不能反向
依赖 UI 层。

renderer 负责：

- frame scope
- primitive 和 widget
- canonical style record
- target capability metadata
- shader/material setup
- text command replay
- clip 和 fallback 行为

调用方负责：

- panel lifecycle
- layout
- interaction state
- animation state
- hit testing
- data binding

## 维护规则

- 新代码保持 Lux style：使用 module-private helper、显式 export、realm marker、合适的
  expression function，以及 module part order，而不是文件名前缀。
- 不要为 package 内部重新引入 GLua 风格 loader 文件。
- 不要为了共享 helper 扩大 export。同 module 顶层声明本来就对 part 可见；export 是
  外部 API。
- `install(owner)` 函数保持薄而确定。安装函数把 module export 映射到 PascalCase
  facade，但渲染逻辑应留在功能 module 中。
- 没有代表性 GMod profiling 和更窄设计时，不要重建已移除的通用 batch scheduler。
- public API 改动时，同时更新 Lux module 示例和安装后的 `MGFX.*` facade 示例。
