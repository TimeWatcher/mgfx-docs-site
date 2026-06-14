# 在 Lux 中使用 MGFX

MGFX 最早是一个直接用 Lua 写的独立 GLua addon。现在的 MGFX 是 Lux package：
`@lux/mgfx`。这意味着新项目不再手写旧的 MGFX loader，也不再维护 include 顺序。
开发者在 Lux 源码里导入 MGFX，`luxc gmod build` 会编译 package、拆分运行域、
生成 Lua 产物，并生成 GMod loader 来发送客户端文件。

生成后的运行时仍然可以暴露熟悉的 `MGFX.*` API。新 Lux 代码建议直接使用模块
表面，例如 `mgfx.paint`、`mgfx.style`、`mgfx.frame`；旧 GLua panel 或临时迁移
代码可以在安装全局 API 后继续调用 `MGFX.RoundedBoxEx`、`MGFX.StartPanel` 等
PascalCase helper。

## 安装工具链

从 Lux 主仓库下载 release：

```text
tools/
  luxc/
    luxc.exe
    packages/
```

`packages/` 必须和 `luxc.exe` 保持同级。release 自带的 packages 包含
`@lux/mgfx`、`@lux/gmod`、`@lux/std` 等内置包。如果使用源码仓库开发，克隆主仓库
时要带 submodule，确保 package 仓库存在。

## 项目结构

创建普通 GMod addon 目录，把 Lux 源码放在 `src/`：

```text
my_addon/
  addon.json
  lux.toml
  src/
    hud/
      module.lux
```

推荐的 `lux.toml`：

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

如果项目自己 vendored packages，可以添加 package root：

```toml
package_roots = "vendor/lux-packages"
```

普通 release 用户不需要写这个字段，因为编译器会自动发现随 `luxc.exe` 一起发布的
内置 packages。

## 导入 MGFX

使用 Lux package id：

::: code-group

```lux [Lux]
import * as mgfx from "@lux/mgfx"
import * as console from "@lux/mgfx/console"

client fn installMgfx() {
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
}
```

```lua [生成 Lua 形状]
local mgfx = __lux_import("@lux/mgfx")
local console = __lux_import("@lux/mgfx/console")

local function installMgfx()
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
end
```

:::

`@lux/mgfx` 是 client-only package。Lux 的运行域检查器知道它的公开导出只在客户端
可用。请从 `cl_` 文件导入，或者在明确标记为 `client` 的声明里使用。

## 在 Lux 中绘制

Lux 代码可以直接使用 lower-case 模块表面：

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

```lua [生成 Lua 形状]
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

这是新 Lux 代码的推荐写法。它让 import 明确，给编译器提供运行域信息，也避免依赖
全局变量。

## 暴露旧风格全局 API

如果旧 GLua 代码或 VGUI panel 仍然要调用 `MGFX.*`，可以在客户端安装一次全局 API：

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

```lua [生成 Lua 形状]
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

installed owner 使用贴近 GMod 习惯的 PascalCase 方法名，例如 `StartPanel`、
`RoundedBoxEx`、`LinearGradient`、`TextEx`、`Status`。Lux module 则保留
`mgfx.paint.roundedBoxEx` 这样的 lower-case 名称。

## 构建 addon

运行 GMod 后端：

```powershell
luxc gmod build --manifest lux.toml
```

构建过程会为 MGFX 做这些事情：

- 从 package root 解析 `@lux/mgfx`
- 编译实际导入到的 MGFX module part
- 保持所有 MGFX 导出为 client-only
- 通过生成 loader 批量处理 `AddCSLuaFile`
- 为生成 Lua 写出 source map
- 把 Lua 产物写入 `generated_root`

之后可以把生成的 `lua/` 树合并进 addon，或者让本地开发流程直接指向生成后的 addon
结构。

## 旧 Lua addon 到哪里去了

原版 MGFX 是 `garrysmod/addons/mgfx` 下的直接 Lua addon。这个历史对 API 连续性有
意义，但它不再是 Lux 项目的主要分发方式。

新 Lux 项目不要再复制旧的 `lua/autorun/server/mgfx_loader.lua` 和
`lua/autorun/client/mgfx_loader.lua`。Lux GMod 后端负责生成 loader。新的 MGFX 源码
位于 package 树：

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

Package 内部由 Lux module 和 module part 拆分。例如 `widgets/src/module.lux` 声明稳定
的 part order：

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

这取代了数字文件名前缀和手工 include 顺序。它也让 Lux 的 module scope 规则保护内部
helper，只导出明确的 public API。

## 运行时命令

`@lux/mgfx/console` 可以安装开发命令：

```text
mgfx_status
mgfx_selftest
mgfx_reload
mgfx_demo
mgfx_text_status
mgfx_text_cache_clear
```

常用客户端 cvar：

```text
mgfx_force_fallback 0/1
mgfx_profile 0/1
mgfx_draw_counts 0/1
mgfx_text_composed 0/1
mgfx_text_composed_budget 6
```

开发时打开诊断；真正测试 FPS 时关闭诊断。
