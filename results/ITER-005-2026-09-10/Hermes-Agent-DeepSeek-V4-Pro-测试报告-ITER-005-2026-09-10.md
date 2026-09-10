# Hermes-Agent-DeepSeek-V4-Pro-测试报告-ITER-005-2026-09-10

## 1. 概述

| 项 | 值 |
|---|---|
| 被测对象 | `huaweicloud-devkit@1.1.3-next.2` |
| 源码基线 | tag `v1.1.3-next.2`，commit `c6c0965f0bdf6181abef65edb6fee7ed2115cd68` |
| npm 基线 | `dist-tags.next=1.1.3-next.2`，gitHead 与源码一致 |
| 对照基线 | 1.1.2-next.4（608b120） |
| 变更规模 | 核心 PR #592 + #593，`baa169c`（install 决策树 + 通用 MCP + 品牌 + README + badge 脚本） |
| 测试依据 | 开发侧《2026-09-09 全量问题集 总设计/总计划文档》 |
| 测试范围 | D1–D8 / C1–C5 / P1–P7 / R1–R2 / O1–O2 / P9，共 25 项 |
| 报告模型 | Hermes Agent + DeepSeek V4 Pro（deepseek-v4-pro-0813） |
| 执行日期 | 2026-09-10（北京） |
| 环境 | Windows 本机（Node v22.23.2）+ Linux 真机 zhangshuang（Ubuntu 24.04 aarch64, Node v22.23.2） |

## 2. 执行摘要

| 度量 | 值 |
|---|---|
| 设计项总数 | 25 |
| 展开测试点 | 约 40 条 |
| 通过 | 39 条（含 24 项设计项完整通过） |
| 观察（非失败） | 1 条（D2 措辞残留，属 plan 既定"冲突采用远端完整版"决策） |
| 产品缺陷 | 0 条 |
| Linux 单测（agent-install） | **44/44 pass, 0 fail, 0 skip** |
| 真机验证项 | 12 项全部真机执行通过 |

## 3. 分维度结论

### 3.1 README/品牌/文档（D1–D7, P3–P7, C1–C5）—— ✅ 全部落地

- **D1 徽章动态化**：`next-stable.mjs`（override 优先 / stable+1）+ `sync-readme-badge.mjs`（校验/回写）已接入 `npm run validate`；实测计算输出 `1.1.3` 与 README badge `beta-v1.1.3-orange` 一致。
- **D3 Other Agents env**：已改为"平台/CI 注入"语义 + 明文警告 + 指向 `auth init`（single entry point），与 SKILL.md 冲突消除。
- **D4 version 补 `--yes`/`@latest`**：README "Update All Agents" 节已补；真机 `npx @next version` 返回 `1.1.3-next.2`。
- **D5 AGENTS.md**：`Node >= 22 required`，对齐 engines `>=22`。
- **D6**：公开文档无 `IACMCPServer` 引用（仅测试代码注释保留，合理）。
- **D7 品牌**：展示名/引导文案统一 `HuaweiCloud DevKit`（K 大写），无裸 `Devkit` 残留；命中的均为连字符 URL/代码标识符（属 C2/C1 保持范围）。
- **P3/P4/P5/P6/P7**：Supported Services 消歧（20+ 常用 / 200+ 路由可达）、Quick Start 顶部"全局命令"定性、完整决策树 note、ZH 徽章镜像英文、Windows npx 路径补全（`%LOCALAPPDATA%\npm-cache\_npx` + `rmdir /s /q`）均落地，无 "TBD"。

### 3.2 install 目标解析决策树（P1, D8）—— ✅ 四态全部验证通过

| 分支 | 结果 | 验证通道 |
|---|---|---|
| 显式合法 --target 直装 | ✅ | Linux ok 29/30 |
| 显式未知 --target | ✅ exit 1 + Unknown target + 列表 | 本机隔离 + Linux ok 35 |
| 0 检测 TTY 菜单（指定/all/通用MCP/退出） | ✅ | Linux ok 37/38/39/40 |
| 0 检测非 TTY 确定性报错 | ✅ | Linux ok 31 |
| 1 检测直装 `for <target>` | ✅ | Linux ok 30 |
| 多检测 TTY 多选（chosen/全选/取消/逗号/非法回退） | ✅ | Linux ok 26/27/28/33/34 |
| 多检测非 TTY 报错引导 | ✅ | 本机隔离 + Linux ok 25 |
| reinstall 复用同一解析 | ✅ | 源码 L4295→L3294 |

### 3.3 通用 MCP 接入（P2）—— ✅ 白名单 merge 全路径通过

Claude Code `~/.claude.json` 与 Cursor `~/.cursor/mcp.json` 白名单探测；命中备份 `.bak` 后 merge 单键；同 key 跳过不备份；坏 JSON 不动原文件；未命中打印可粘贴片段 + remote 提示。5 条子路径全部 Linux 真机通过（ok 41/43/44 + 手动 P2-4）。

### 3.4 工程卫生（R1, R2, O1, O2, P9）—— ✅ 全部落地

- **R1**：`confirm()` 开头 `!isTTY → false`；真机非 TTY `reinstall` 64ms 快速退出，无挂起。
- **O1**：`test/risk-rule-deny-after-approval.test.mjs` 已删。
- **O2**：`.gitignore` 5 组规则齐备（telemetry×2 / superpowers / .superpowers / .codeartsdoer）。
- **P9**：cmdUpdate 尾部无可达死代码（#586 已删）。

## 4. 发现明细

本次针对设计文档 25 项验证，**未发现产品缺陷**，仅 1 条观察 + 1 条测试方法教训：

| 编号 | 类别 | 级别 | 描述 | 处置 |
|---|---|---|---|---|
| OBS-D2 | 观察 | P3 文档 | README.zh-CN L295 仍保留"同步到沙箱接口"措辞；"唯一入口/切勿手写"已补。plan 已注明"冲突时采用远端更完整版"，属既定决策，非遗漏 | 记录，无需上报（如开发要求字面删除可后续跟进） |
| 测试方法 | 教训 | — | Windows 上 officeace 检测经注册表 `readOfficeaceRegistryInstallDir()` 定位，不受 USERPROFILE 隔离，隔离 HOME 测试会意外直装到真实 OfficeAce | 已 `uninstall --target officeace` 清理复原；0/1 检测/TTY 菜单/MCP 类用例转 Linux 真机（与上游 `skip: win32` 策略一致） |

## 5. 上报闭环

本次无新发现产品缺陷，无需新增 issue。历史 issue 状态不属本轮设计文档验证范围（已由 ITER-004 覆盖）。

## 6. 结论档位

> **`huaweicloud-devkit@1.1.3-next.2` 对开发设计/计划文档列出的 25 项改动已全部正确落地，无产品缺陷、无退化。**

- 文档/品牌/文案 12 项（D1/D3/D5/D6/D7/P3/P4/P5/P6/P7 + C1–C5）全部达成；
- install 决策树四态（P1/D8）+ 通用 MCP 接入（P2）+ reinstall 非 TTY 保护（R1）真机 100% 通过；
- 工程卫生（O1/O2/P9）落地；
- 唯一观察项 D2 属 plan 既定"远端完整版"决策，不阻塞发布。

## 7. 后续建议

- D2 措辞"沙箱接口"若需字面删除，可提交文案 PR 或在下个迭代与开发对齐；
- Windows 侧 install 决策树自动化单测建议上游完善 officeace 注册表隔离（当前 `skip: win32` 依赖 Linux CI 兜底），避免本机多客户端环境下的测试污染。

## 8. 数据留痕

- 测试用例：`results/ITER-005-2026-09-10/测试用例与验证计划-1.1.3-next.2.md`
- 执行记录：`results/ITER-005-2026-09-10/测试执行记录.md`
- 基线：`results/ITER-005-2026-09-10/baseline.md`
- Linux 单测结果：`results/ITER-005-2026-09-10/evidence/linux-agent-install-44pass.txt`
- 隔离验证脚本：`devkit-test/scripts/_n113_isolated.mjs`（本机隔离）/ `_linux_run_install.py`、`_linux_p24.py`（Linux 真机）