# 普通 GLua 快速开始

普通 Garry's Mod addon 或 gamemode 不使用 Lux 时，从这里开始。

## 安装

把 `lua-mgfx/` 作为 addon 根目录复制：

```text
garrysmod/addons/mgfx/
  lua/
  materials/
  resource/
  addon.json
```

在客户端代码中 include 公共入口，并把返回的 API 表保存在局部变量：

```lua
local mgfx = include("mgfx/init.lua")
```

不要直接 include `cl_mgfx*.lua` 实现文件。仓库中的 autorun 文件是兼容旧用法的适配层，会安装全局表和 devtools；新的 addon 与 gamemode 应直接使用 `init.lua`。

## 第一个 Panel

::: code-group

```lua [GLua]
local mgfx = include("mgfx/init.lua")

function PANEL:Paint(w, h)
    mgfx.StartPanel(self, w, h)

    mgfx.RoundedBoxEx(0, 0, w, h, {
        radius = 10,
        fill = Color(18, 24, 32, 230),
        shadow = {x = 0, y = 6, blur = 14, color = Color(0, 0, 0, 110)},
    })

    mgfx.Text("READY", "DermaDefaultBold", 16, 18, color_white, TEXT_ALIGN_LEFT, TEXT_ALIGN_CENTER)
    mgfx.EndPanel()
end
```

```lux [Lux 对照]
import * as mgfx from "@lux/mgfx"

fn PANEL:Paint(w, h) {
  local draw = mgfx.api
  draw.startPanel(self, w, h)

  draw.roundedBoxEx(0, 0, w, h, {
    radius = 10,
    fill = Color(18, 24, 32, 230),
    shadow = {x = 0, y = 6, blur = 14, color = Color(0, 0, 0, 110)},
  })

  draw.text("READY", "DermaDefaultBold", 16, 18, color_white, TEXT_ALIGN_LEFT, TEXT_ALIGN_CENTER)
  draw.endPanel();
}
```

:::

`StartPanel` 会建立 panel-local 坐标系，不要再手动叠加 `LocalToScreen` 偏移。

## HUDPaint

```lua
hook.Add("HUDPaint", "MyMGFXHud", function()
    mgfx.StartScreen()

    local x, y = 32, ScrH() - 72
    mgfx.ProgressBarEx(x, y, 220, 14, LocalPlayer():Health() / 100, {
        radius = 7,
        padding = 2,
        track = Color(255, 255, 255, 22),
        fill = mgfx.LinearGradient(0, 0, 1, 0, Color(255, 96, 78), Color(255, 190, 66)),
    })

    mgfx.EndScreen()
end)
```

screen-space HUD 和 overlay 使用 `StartScreen`；VGUI panel 使用 `StartPanel`。

## 命名

| 任务 | GLua |
| --- | --- |
| 开始 frame | `mgfx.StartPanel(...)` |
| 绘制形状 | `mgfx.RoundedBoxEx(...)` |
| 创建渐变 | `mgfx.LinearGradient(...)` |
| 创建图像遮罩 | `style.mask = {kind = "circle"}` |
| 共享抗锯齿裁剪 | `mgfx.Mask(...)` + `mgfx.Clip(...)` |
| 特效文字 | `mgfx.TextEx(...)` |

## 可选适配层

只安装当前集成真正需要的层：

```lua
include("mgfx/global.lua")("MGFX", mgfx) -- 兼容旧 GLua 调用方
include("mgfx/devtools.lua")(mgfx)       -- 命令与诊断 cvar
```

服务端通过 `include("mgfx/distribute.lua")()` 分发核心库。只有确实需要 demo
文件时才传入 `{examples = true}`；默认不会分发或加载示例。

Lux 等价 API 位于 `mgfx.api`，名称使用 lowerCamelCase。

## 下一步

- 阅读 [核心概念](./concepts)，理解 frame scope、`Name` / `NameEx` 和 style table。
- 精确参数和字段查 [API 参考](../api-reference/)。
- shadow、outer glow、backdrop 和 pattern 查 [特效指南](./effects)。
- 多次绘制共享非矩形边界时，查 [Mask 与抗锯齿 Clip](./masks-and-clip)。
