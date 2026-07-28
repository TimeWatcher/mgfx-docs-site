# Lux 快速开始

项目使用 Lux 并通过 `@lux/mgfx` 消费 MGFX 时，从这里开始。

## 安装

从 GitHub 安装：

```powershell
luxc install @lux/mgfx --from github:TimeWatcher/lux-mgfx --tag v0.1.0
```

从本地 checkout 安装：

```powershell
luxc install @lux/mgfx --from C:\Development\gmod\lux-mgfx
```

普通 Lux 代码导入 public facade，调用 `mgfx.api.*`。导入 `@lux/mgfx` 不会安装全局表、控制台命令、hook 或示例。

把 panel 绘制代码放在 client realm 的 Lux 源文件中。

## 第一个 Panel

::: code-group

```lux [Lux]
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

```lua [GLua 对照]
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

:::

## API 命名

| GLua | Lux |
| --- | --- |
| `mgfx.StartPanel` | `mgfx.api.startPanel` |
| `mgfx.RoundedBoxEx` | `mgfx.api.roundedBoxEx` |
| `mgfx.ProgressBarEx` | `mgfx.api.progressBarEx` |
| `mgfx.LinearGradient` | `mgfx.api.linearGradient` |
| `mgfx.WornPattern` | `mgfx.api.wornPattern` |
| `mgfx.TextEx` | `mgfx.api.textEx` |

旧的 `@lux/mgfx/paint` 不是应用入口。gradient 和 pattern 通过 `mgfx.api` helper 创建，再作为 `fill`、`track`、`pattern` 等字段传入。

## 全局桥接

只有 GLua panel 或旧集成明确依赖 `MGFX.*` 时才安装全局表：

```lux
import * as mgfx from "@lux/mgfx"
import { installGlobal } from "@lux/mgfx/global"

client {
  installGlobal("MGFX", mgfx.create());
}
```

新 Lux UI 代码继续使用 `mgfx.api.*`。开发命令通过 `@lux/mgfx/devtools` 单独按需安装：

```lux
import * as mgfx from "@lux/mgfx"
import * as devtools from "@lux/mgfx/devtools"

client {
  devtools.install(mgfx.create());
}
```

## 下一步

- 阅读 [核心概念](./concepts)，理解 frame scope、`Name` / `NameEx` 和 style table。
- 精确参数和字段查 [API 参考](../api-reference/)。
- shadow、outer glow、backdrop 和 pattern 查 [特效指南](./effects)。
