# 更新日志

这里记录 MGFX 的重要变更。MGFX 目前尚未发布版本标签，因此还没有归入正式
版本的工作统一记录在“未发布”下。

## 未发布

_当前变更集核对日期：2026-07-28。_

### 新增

- 为普通 GLua 增加显式入口模块，分别负责核心初始化、服务端分发、旧式全局
  适配、开发工具和示例：`mgfx/init.lua`、`mgfx/distribute.lua`、
  `mgfx/global.lua`、`mgfx/devtools.lua` 与 `mgfx/examples.lua`。
- 为 Lux 增加对应的可选 package：`@lux/mgfx/global` 与
  `@lux/mgfx/devtools`。
- 增加独立的动画材质测试 addon，覆盖材质原生直绘、带样式的 source capture，
  以及使用第二个动画材质作为图像 mask 的路径。

### 变更

- 普通 GLua 现在可以通过
  `local mgfx = include("mgfx/init.lua")` 局部持有 MGFX。核心入口不会安装
  公共全局变量、命令、hook 或示例。随附的 autorun loader 仍作为兼容层安装
  `MGFX` 与开发工具。
- 导入 `@lux/mgfx` 不再安装全局变量或开发工具；默认 `mgfx.api` runtime
  改为第一次使用时惰性创建。需要给 GLua 暴露全局表时，应从
  `@lux/mgfx/global` 导入 `installGlobal`。
- 默认 addon 与开发工具入口不再加载示例；示例必须显式分发并安装。不安全的
  `mgfx_reload` 与 `mgfx_hot_reload` 命令已经移除。
- Shader pack loader 改为返回模块数据，不再写入进程级
  `MGFXShaderPack` 全局变量。
- MGFX 源码授权从原非商业许可证切换到 **Lux MGFX Community License
  1.1**。满足条件的非营利社区服务器可以回收合理运营成本，也允许免费插件的
  开发与分发；商业用途仍需书面授权。

### 修复

- `IMaterial` 现在会被当作可执行的图像 source。`ImageUV`、无半径的
  `Image` 和不需要特效的 `ImageEx` 会直接绑定原始材质，从而保留
  `AnimatedTexture` 等 material proxy。
- 需要 MGFX 合成的样式图像路径会先把 source material 执行到 render target，
  再应用 radius、mask、stroke、shadow、outer glow 或 backdrop。材质形式的
  texture mask 使用独立 capture target，使 source 与 mask 的动画互不覆盖。
- 图像纹理 shader 统一从 `$texture1` 采样；可能被 `SetTexture` 重绑的材质
  slot 会以真实纹理值初始化。这样既消除了 `$texture2` 类型警告，也避免通过
  提取 `$basetexture` 绕过材质行为。
- Material capture 会恢复 blend、color modulation、alpha、scissor 与
  coverage 状态，并在 capture 边界应用修正后的 UV。
- 内部白色图像纹理改用 MGFX 自己创建的 material wrapper，不再假定
  `color/white` 是已挂载的 VMT。
- 文字合成现在能在可选开发工具安装后重新发现 ConVar。文字 renderer 和
  profiler 状态不再依赖全局 `MGFX` 表，profiler wrapper 也可以完整卸载。

### 文档

- 更新普通 GLua 与 Lux 快速开始，说明显式入口及可选适配层。
- 补充直绘与 capture 两类 `IMaterial` 行为、动画材质、材质 mask、sampler
  分配以及 render-target capture 成本。
- 同步更新架构、Shader、授权、仓库结构、生成输出与中英文文档。
