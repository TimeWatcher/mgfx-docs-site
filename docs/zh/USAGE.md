# 使用 MGFX

MGFX 是同时提供 Plain GLua 与 Lux 实现的库。新的集成应显式加载 renderer core，并把
全局兼容、开发命令和示例留在默认路径之外。

| 层 | Plain GLua | Lux |
| --- | --- | --- |
| 核心库 | `include("mgfx/init.lua")` | `@lux/mgfx` |
| 全局兼容 | `mgfx/global.lua` | `@lux/mgfx/global` |
| 命令与诊断 | `mgfx/devtools.lua` | `@lux/mgfx/devtools` |
| 示例 | `mgfx/examples.lua` | 显式导入 demo package |

核心入口不会安装公共全局、控制台命令、hook、诊断 cvar 或示例。

<span id="use-with-plain-glua"></span>

## 给 Plain GLua 使用

普通 Garry's Mod addon 或 gamemode 使用 `lua-mgfx`。库文件位于 `lua/mgfx`，客户端
代码只 include 公共入口。

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

### 分发库文件

在服务端代码中调用分发 helper：

```lua
if SERVER then
    local distribute = include("mgfx/distribute.lua")
    distribute()
end
```

它会发送核心 Lua 文件与 shaderpack chunks，并注册库内字体。如果字体由另一个 addon
负责，可调用 `distribute({font = false})`。只有显式传入 `{examples = true}` 才会分发
demo 文件。

### 加载客户端 API

把返回表保存在当前 addon 的局部变量中：

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

不要直接 include `cl_mgfx*.lua`。`init.lua` 负责模块顺序、shaderpack 绑定，以及私有
加载上下文的清理。

### Plain GLua 可选适配层

只有旧 GLua 代码依赖 `MGFX.*` 时才安装全局表：

```lua
include("mgfx/global.lua")("MGFX", mgfx)
```

只有开发环境需要命令和诊断 cvar 时才安装 devtools：

```lua
include("mgfx/devtools.lua")(mgfx)
```

示例依赖全局兼容层，并且必须显式分发与加载：

```lua
-- 服务端
include("mgfx/distribute.lua")({examples = true})

-- 客户端
local mgfx = include("mgfx/init.lua")
include("mgfx/global.lua")("MGFX", mgfx)
include("mgfx/devtools.lua")(mgfx)
include("mgfx/examples.lua")
```

仓库自带的 autorun 文件只用于兼容独立旧式安装：它们会分发库、安装 `_G.MGFX`
并启用 devtools，但不会加载 demo。把 MGFX 作为无默认副作用的库嵌入其他 addon 时，
不要复制这些 autorun 适配层。

<span id="use-from-lux"></span>

## 在 Lux 中使用

安装 package set：

```powershell
luxc install @lux/mgfx --from github:TimeWatcher/lux-mgfx --tag v0.1.0
```

导入 `@lux/mgfx` 不会安装全局、命令、hook、诊断 cvar 或示例。默认的 `mgfx.api`
renderer 在第一次使用时才会创建：

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

集成需要独立的 PascalCase owner 表时，调用 `mgfx.create()`：

```lux
import * as mgfx from "@lux/mgfx"

client fn createRenderer() = mgfx.create()
```

### Lux 可选适配层

全局桥接与 devtools 是独立 package：

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

`@lux/mgfx/devtools` 会安装诊断 cvar、profiler API wrapper 和控制台命令，但不会
导入 demo package。只有确实需要示例时才显式导入并安装：

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

在项目根目录运行 `luxc gmod build --manifest lux.toml`。Lux 只解析实际导入的 package
graph，保留 client realm，写出生成 Lua 与 source map，并为当前 addon 生成配置好的
loader/autorun forwarder。

## 运行时命令

安装 devtools 后，可使用这些客户端命令：

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

已移除的 `mgfx_reload` 与 `mgfx_hot_reload` 不属于新的入口模型。`mgfx_demo`、
`mgfx_perf_demo`、`mgfx_wheel_demo` 等命令只有在对应示例安装后才存在。

常用诊断 cvar：

```text
mgfx_force_fallback 0/1
mgfx_profile 0/1
mgfx_draw_counts 0/1
mgfx_text_composed 0/1
mgfx_text_composed_budget 6
```

进行代表性 FPS 测试时应关闭诊断。

## 授权

MGFX 使用 [Lux MGFX Community License 1.1](./LICENSE)。满足条件的社区服务器可以
回收合理运营成本，也允许开发和分发免费插件；商业服务器变现、付费插件、客户委托和
其他商业使用仍需另行取得书面授权。
