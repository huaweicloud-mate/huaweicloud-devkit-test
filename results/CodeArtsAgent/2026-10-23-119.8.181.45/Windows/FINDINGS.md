# FINDINGS - CodeArtsAgent Windows 每日测试 2026-10-23

> **发现时间**：2026-10-23 05:14（北京时间）
> **客户端**：CodeArtsAgent
> **OS**：Windows
> **版本**：1.1.12

---

## 缺陷清单

### #1 D1-39: Windows 升级检测链可用性

| 项 | 值 |
|---|---|
| **级别** | P0 |
| **用例ID** | D1-39 |
| **维度** | D1安装 |
| **标题** | Windows 升级检测链可用性 |
| **状态** | FAIL |

**现象**：
在 Windows 上执行 npm.cmd view huaweicloud-devkit dist-tags --json 时，不使用 shell:true 选项会返回 EINVAL 错误，导致升级检测链失败。

**期望**：
Windows 下检测链真实可用，不得 EINVAL 静默失败。

**实际**：
无 shell:true 时 spawnSync 返回 EINVAL 错误码。

**根因**：
plugins/huaweicloud-core/src/update-check.mjs 中的 queryDistTagsSync 函数在 Windows 上调用 npm.cmd 时未设置 shell:true，导致 Node.js 的 spawn 无法正确执行 .cmd 文件。

**证据**：


**建议修复**：
在 queryDistTagsSync 函数的 spawnSync 调用中添加 shell: true 选项（Windows 平台），或使用跨平台兼容的方式执行 npm 命令。

---

## 汇总

| 级别 | 数量 | 用例 |
|---|---|---|
| P0 | 1 | D1-39 |
| P1 | 0 | - |
| P2 | 0 | - |
| **合计** | **1** | |
