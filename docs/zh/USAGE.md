# 使用 MGFX

MGFX 以 Lux package `@lux/mgfx` 的形式维护，但有两种消费路径：

- **给 Plain GLua 使用**：挂载生成好的 loader 分发，在现有 Lua 文件里调用安装后的
  `MGFX.*` facade。
- **在 Lux 中使用**：在 Lux 源码里导入 `@lux/mgfx`，由 `luxc gmod build` 把 package
  编译进 addon 输出。

新的 Lux 代码应优先使用明确的模块导入，例如 `mgfx.paint`、`mgfx.style`、
`mgfx.frame` 和 `mgfx.widgets`。现有 GLua panel 可以继续使用熟悉的 PascalCase
facade，例如 `MGFX.StartPanel`、`MGFX.RoundedBoxEx`、`MGFX.LinearGradient` 和
`MGFX.TextEx`。

<span id="use-with-plain-glua"></span>

## 给 Plain GLua 使用

当 addon 仍然是普通 GLua，或者你想在不引入 Lux 源码的情况下使用 MGFX 时，可以使用
生成好的 loader 分发。把 MGFX release 里的 `lua/` 树复制或挂载到 addon 里。客户端
loader 会初始化 MGFX，并默认安装 `_G.MGFX`。

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

loader 跑起来后，直接通过 `MGFX.*` 绘制：

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

这个 plain GLua 分发不是手写旧 loader，也不是 package 的内联拷贝。它仍然来自同一份
Lux MGFX source，只是 loader 已经生成好，并且为非 Lux 调用方安装了全局 facade。

<span id="use-from-lux"></span>

## 在 Lux 中使用

创建 Lux 项目并安装所需 package：

```powershell
luxc init my_addon --std
Push-Location my_addon
luxc install @lux/mgfx --from github:TimeWatcher/lux-mgfx
Pop-Location
```

推荐的 `lux.toml`：

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

Lux 没有 registry。manifest 用 `github`、`url` 或 `path` 指定具体 package 来源，
`lux.lock` 记录解析后的依赖图。项目需要固定 package set 时，再使用 `tag`、
`branch` 或 `commit`。

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

`@lux/mgfx` 是 client-only。Lux 的运行域检查器知道它的公开导出只在客户端可用。
请从 `cl_` 文件导入，或者在显式标记为 `client` 的声明里使用。

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

## 暴露 GLua facade

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

安装后的 owner 使用贴近 GMod 习惯的 PascalCase 方法名，例如 `StartPanel`、
`RoundedBoxEx`、`LinearGradient`、`TextEx`、`Status`。Lux module 则保留
`mgfx.paint.roundedBoxEx` 这样的 lower-case 名称。

## 构建 addon

在项目根目录运行 GMod 后端：

```powershell
luxc gmod build --manifest lux.toml
```

构建过程会为 MGFX 做这些事情：

- 从 `lux.lock` 解析 `@lux/mgfx`
- 编译实际导入到的 MGFX module part
- 保持所有 MGFX 导出为 client-only
- 把 Lua 产物写入 `target.gmod.out`
- 为生成 Lua 写出 source map
- 生成 GMod loader 和可选的 `autorun` forwarder

之后可以把生成的 `lua/` 树合并进 addon，或者把 manifest 的 `out`
指向本地开发流程使用的 Lua 根目录。

## 旧 Lua addon 到哪里去了

原版 MGFX 是 `garrysmod/addons/mgfx` 下的直接 Lua addon。这个历史对 API 连续性有
意义，但当前的 source of truth 是 Lux package。不要把旧的手写 autorun loader 复制
到新项目里。

Plain GLua 用户应该使用生成好的 loader 分发。Lux 用户应该导入 `@lux/mgfx`，
再让 `luxc gmod build` 为对应项目生成 loader。

Package 内部由 Lux module 和 module part 拆分。例如 `widgets/src/module.lux` 声明
稳定的 part order：

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
