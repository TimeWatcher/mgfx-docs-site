# Shader 构建与打包

MGFX 现在把 shader bytecode 作为 Lux 客户端模块发布，而不是作为 addon 树下的
手写 Lua 文件发布。生成后的 shaderpack 位于：

```text
packages/lux/mgfx/shaderpack/src/cl_module.lux
```

这个模块导出当前 `VERSION`、base64 GMA 载荷，以及 `@lux/mgfx/materials` 会使用的
辅助函数。项目导入 `@lux/mgfx` 后，`luxc gmod build` 会把 shaderpack module 编译进
生成的客户端 Lua，并由生成的 GMod loader 和其他客户端产物一起下发。

## 运行时流程

启动时，`@lux/mgfx` 会安装 shaderpack 并创建材质：

```lux
import * as shaderpack from "@lux/mgfx/shaderpack"
import * as materials from "@lux/mgfx/materials"

client fn createMgfxState() {
  shaderpack.installGlobal()
  materials.create()
}
```

生成 Lua 的形状等价于导入这两个编译后的模块，并调用相同的运行时函数。这里不再需要
项目维护 `include(...)` 链，也不需要 MGFX 专用 autorun loader。

内部的 `materials.create()` 会：

1. 通过 `shaderpack.current()` 读取当前 shaderpack。
2. 解码嵌入的 base64 GMA 载荷。
3. 写入 `data/mgfx_shaders_<version>.gma`。
4. 通过 `game.MountGMA` 挂载。
5. 创建指向带版本号 pixel shader 和 vertex shader 的 `screenspace_general` 材质。

如果项目有意在 MGFX 初始化前提供全局 `MGFXShaderPack`，`shaderpack.current()` 可以
使用这个外部 pack。普通 Lux 项目应直接使用 package 自带的模块。

## 源码结构

运行时 package 源码在：

```text
packages/lux/mgfx/
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
```

历史 shader 源码和 SDK 工具可能仍保存在原 addon 备份或构建工作区里，但它们不属于
文档站，也不会被复制进 Lux 项目。package 提交中应包含编译器可以直接消费的
shaderpack Lux module。

## 重新生成契约

当 shader bytecode 变化时，最终结果必须重新生成到
`packages/lux/mgfx/shaderpack/src/cl_module.lux`。

生成模块需要提供这个公开形状：

```lux
export client const VERSION = "..."

export client fn gma()
export client fn pack()
export client fn current()
export client fn installGlobal(name = "MGFXShaderPack")
```

`pack()` 返回：

```lua
{
  Version = VERSION,
  GMA = "<base64 gma payload>",
}
```

`VERSION` 必须和 GMA 内部的 shader 文件名保持一致。MGFX 创建材质时会把版本号加到
shader 名称前，例如：

```text
<version>_mgfx_roundrect_ps30
<version>_mgfx_vs30
```

如果版本号和编译出的 shader 文件名不一致，材质对象可能能创建出来，但无法绑定真正的
shader，MGFX 会退回 fallback 路径。

## 诊断

开发时安装 console package：

```lux
import * as mgfx from "@lux/mgfx"
import * as console from "@lux/mgfx/console"

client fn installTools() {
  local api = mgfx.installGlobal("MGFX")
  console.install(api)
}
```

然后使用：

```text
mgfx_status
mgfx_param_probe
mgfx_param_bench
mgfx_profile 1
mgfx_draw_counts 1
```

正式测 FPS 时关闭：

```text
mgfx_profile 0
mgfx_draw_counts 0
```

每族 draw counter 默认关闭。复杂 immediate UI 中，几百次绘制的计数本身也可能变成
可测开销。

## GMod Shader 规则

这些不是风格建议，而是实际踩坑后的硬规则：

- 对生成材质不要直接依赖 `DrawTexturedRectUV`，除非已经处理 UV 修正。优先使用显式
  UV 的四点 textured quad。
- 抗锯齿需要最终屏幕空间尺寸或 UV derivative。逻辑尺寸不足以代表 shader AA 所需的
  物理像素尺寸。
- 进入 SDF 计算前先 clamp radius 和 chamfer cuts。
- 不要随手增加 data texture 参数路径。被移除的 batch prototype 已经证明，上传和
  调度成本可能压过 draw call 收益。
- `screenspace_general` 的常量寄存器必须遵守 MGFX 文档化布局。MGFX 当前把
  `$c0..$c3` 当作自定义 draw 参数，把 `$c4..$c7` 当作 texture-size 寄存器。不要使用
  `$c8` 这类临时寄存器，它们可能能编译，但运行时读到 0 或未定义值。

## 参数页布局

热路径 shape shader 的 16 个常规 float 参数走 `$viewprojmat`，在 pixel shader 中读作：

```hlsl
const float4x4 MGFXExtraParams : register(c11);
```

Lux 生成的 Lua 会这样写入矩阵：

```lua
mat:SetMatrix("$viewprojmat", matrix)
```

GMod/Source 的矩阵索引会按列抵达 HLSL：`matrix[0]` 读到 `1,5,9,13`，
`matrix[1]` 读到 `2,6,10,14`，依此类推。运行时代码必须使用 MGFX 的统一打包
helper，不要在调用点猜行列顺序。

`MGFXExtraParams` 是主参数页。`$c0..$c3` 是辅助参数页，只给参数超过 16 个 float 的
fused shader 使用，例如 chamfer cuts + inner glow，或者 ring stroke + inner glow。
能放进主参数页的参数不要占用辅助页。

本地 GMod benchmark 中，16 个独立 `SetFloat` 大约是 `SetUnpacked + SetMatrix` 的
7 倍成本，所以 hot shape path 不应回到逐 float 上传。

## 融合 Shape 快速路径

MGFX 允许小型专用 fused shader，但它们必须精确复刻原始分层结果。

当前保留的路径：

- `mgfx_roundrect_fx_ps30`：roundrect fill/stroke + inner glow。只有 inner glow 会导致
  额外 pass 时才启用。
- `mgfx_chamfer_ps30`：chamfer fill/stroke + optional inner glow。fill/stroke 使用
  `MGFXExtraParams`，cuts 和 inner-glow 数据使用 `$c0..$c3`。
- `mgfx_ring_fx_ps30`：ring/arc/sector fill + optional inner glow + stroke。fill-only
  ring 仍走更轻的 `mgfx_ring_ps30`。

这些不是通用 “everything shader”。`pattern`、`shadow`、`outerGlow` 和 `backdrop`
仍可能保持独立，因为它们的 draw bounds、source texture 或 blend order 是可见行为。
未来要融合这些层，必须证明 source-over 结果像素级一致，包括透明渐变和抗锯齿边缘。

## Shape 空间渐变

MGFX 有两类渐变空间：

- 矩形图元空间：`linearGradient`、`radialGradient` 和 `conicGradient` 在图元 bounds 内
  采样归一化 UV。矩形径向渐变必须按短边补偿 aspect ratio，避免被 shape 拉伸。
- 圆环/扇区空间：`ringRadialGradient`、`sectorRadialGradient` 和角向填充由 ring
  shader 按当前 ring/arc/sector 几何解释。

`arcEx` 和 `sectorEx` 不是同一个概念。`arcEx` 是圆弧段，端点按 round cap 距离计算，
适合 gauge mark；`sectorEx` 是直边径向扇区，按 start/end radial boundary 计算，适合
轮盘 wedge。它们可以共享材质族，但 signed-distance 边界数学不同。

圆环/扇区局部径向填充：

```text
t = (r - innerRadius) / (outerRadius - innerRadius)
```

局部周向填充：

```text
t = (angle - startDeg) / (endDeg - startDeg)
```

这不等价于全局 `conicGradient`。`conicGradient` 始终描述围绕中心的 360 度角场。

## Gradient LUT

多 stop 渐变统一走一维 LUT：

- 运行时代码规范化、排序并补齐 0/1 端点，然后烘焙 256x4 render target。
- shader 先算出 `t`，再从 `$texture1` 采样 LUT。
- Linear、radial、conic、ring/sector radial、shape/ring/arc/sector angular 都走同一套
  LUT 采样。
- LUT 按 stop table 缓存在有界 LRU 中。快速动画 stop 颜色或位置会 churn cache，优先
  动画几何、opacity 或显式 offset。
- `mgfx.style.linearGradient`、`mgfx.style.radialGradient`、
  `mgfx.style.conicGradient` 返回的 fill record 被视为 immutable。要改 stop 或颜色，
  应创建新的 fill record，不要原地改表。

## Alpha 踩坑

不要把 gradient stop alpha 写进 render target alpha channel 后再用 `tex2D(...).a`
读取。GMod 的生成材质/render-target 路径里，alpha 写入和后续采样会出现“看似 opaque
stop 正常，但透明 stop 变成不透明黑色”的问题。

可见症状是：本来应该淡出的径向或线性高光，消失后没有回到 `alpha = 0`，而是变成
一块纯黑矩形或扇区，盖住下面所有图层。

当前 `lut-alpha-rgb-v3` 方案刻意把 alpha 当普通颜色数据保存：

```text
rows 0..1  存 visible RGB，alpha 强制 255
rows 2..3  用 grayscale RGB 存 stop alpha
```

shader 的 `mgfx_gradient_lut()` 会采样两组数据并重建 `float4(rgb, alpha)`。这是绕开
Source RT/blend/alpha-write 行为的兼容保护。

如果改这条路径，至少验证：

- `Color(r, g, b, 0)` stop 输出最终 alpha 0，而不是黑色。
- 叠加在彩色背景上的径向渐变能露出下面图层。
- 文本、线条、圆角矩形、ring radial 和 shape-local angular 渐变都读到同一套重建
  alpha。

## 生成 addon 内容

Lux 项目不会直接打包 MGFX 源码树，而是打包 `luxc gmod build` 生成的 GMod 输出。

期望运行时形状：

```text
generated/
  lua/
    autorun/
      <bundle-specific loader>.lua
    lux/
      client/
        ...
```

具体生成文件名由 Lux GMod 后端负责，并包含项目 bundle/package 身份，避免 GMod addon
全局 `lua/` 目录中的文件名冲突。不要手写 MGFX 专用 autorun loader。

文档仓库中的这些内容不是运行时文件：

```text
docs/
site_build/
node_modules/
package.json
package-lock.json
```

它们属于本文档仓库，不应该复制进运行时 GMA。

批处理原型的失败原因见 [已移除的批处理设计](./BATCHING)。
