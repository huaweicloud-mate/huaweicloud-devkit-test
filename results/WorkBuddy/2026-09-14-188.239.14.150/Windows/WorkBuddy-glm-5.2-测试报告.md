# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-14 22:45:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-14-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit v1.1.4-next.6（npm @next, gitHead main branch latest）
> **结论**：`PARTIAL`（有 FAIL 和 SPEC-MISMATCH，但 P0 缺陷数较 next.3 减少）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + glm-5.2 |
| OS / 架构 | Windows Server 2019 (x86_64) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.13.14 |
| 被测版本（SUT） | `v1.1.4-next.6`（npm @next） |
| 源码仓库 | hdk main 分支 (commit 9b67256) |
| 工具全集 | 40（next.6 新增 1 个工具，设计基线为 39） |
| 真云凭证 | cn-north-4（credentials.json 已配置，AKSK 模式） |
| 测试类型 | 源码级探针（.mjs 直调导出函数）+ 源码静态检查 |
| 设计真源 | daily 精选：设计级 81 / 展开级 71 |

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 81（设计级） |
| 已执行 | 66 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 55 / 5 / 5 / 1 / 15 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 90.2% |
| P0 / P1 / P2 缺陷 | 3 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |
| 较 next.3 变化 | D4-21/D4-22/D8-7 从 FAIL→PASS（next.6 修复）；D4-2/D4-16/D4-23/D9-2 持续 FAIL |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 55 | 有证据且通过 PASS 门禁 |
| FAIL | 5 | D4-2/D4-16/D4-23/D5-1/D9-2 |
| BLOCKED | 5 | D1-1/D1-5/D1-58/D9-8/D9-9 |
| SPEC-MISMATCH | 1 | D5-3（工具数 39→40 契约变更） |
| NOT_RUN | 15 | 真云 E2E/多终端矩阵/D10 评测等 |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 48 | 源用例 PASS 的展开行 |
| FAIL | 4 | 源用例 FAIL 的展开行 |
| BLOCKED | 5 | 源用例 BLOCKED 的展开行 |
| SPEC-MISMATCH | 2 | D5-3 展开行 |
| NOT_RUN | 12 | 源用例 NOT_RUN 的展开行 |
| **合计** | **71** | |

---

## 四、逐用例结果

| 用例ID | 优先级 | 状态 | 证据路径 |
|---|---|---|---|
| D1-1 | P1 | BLOCKED | — |
| D1-2 | P2 | NOT_RUN | — |
| D1-3 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D1-4 | P2 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D1-5 | P1 | BLOCKED | — |
| D1-6 | P2 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D1-26 | P1 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-27 | P1 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-28 | P1 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-30 | P2 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-31 | P1 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-33 | P2 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-39 | P0 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-40 | P0 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-41 | P1 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-42 | P1 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-45 | P1 | PASS | evidence/d1-upgrade/probe-p0-upgrade.mjs |
| D1-58 | P1 | BLOCKED | — |
| D2-1 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D2-2 | P2 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D2-4 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D2-5 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D2-10 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D2-11 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D2-12 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D2-13 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D2-16 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D3-A1 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D3-B1 | P2 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D3-B3 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D3-B5 | P2 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D3-C4 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D3-C5 | P1 | PASS | evidence/d2-d3-auth-func/probe-d2-d3-auth-func.mjs |
| D4-1 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-2 | P0 | FAIL | evidence/d4-security-core/probe-p0-security.mjs |
| D4-3 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-4 | P1 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-5 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-6 | P1 | NOT_RUN | — |
| D4-7 | P1 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-8 | P1 | NOT_RUN | — |
| D4-9 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-10 | P2 | NOT_RUN | — |
| D4-11 | P1 | NOT_RUN | — |
| D4-12 | P2 | NOT_RUN | — |
| D4-13 | P1 | NOT_RUN | — |
| D4-14 | P2 | NOT_RUN | — |
| D4-15 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-16 | P0 | FAIL | evidence/d4-security-core/probe-p0-security.mjs |
| D4-17 | P1 | NOT_RUN | — |
| D4-18 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-19 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-20 | P1 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-21 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-22 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D4-23 | P0 | FAIL | evidence/d4-security-core/probe-p0-security.mjs |
| D4-24 | P1 | NOT_RUN | — |
| D5-1 | P1 | FAIL | evidence/d5-static/probe-d5-d9-static.mjs |
| D5-3 | P1 | SPEC-MISMATCH | evidence/d5-static/probe-d5-d9-static.mjs |
| D6-1 | P2 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D6-3 | P2 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D6-4 | P1 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D7-4 | P2 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D8-1 | P2 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D8-4 | P1 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D8-6 | P2 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D8-7 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D9-1 | P1 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D9-2 | P1 | FAIL | evidence/d9-robust/probe-d9-robust-source.mjs |
| D9-3 | P1 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D9-4 | P1 | PASS | evidence/d5-static/probe-d5-d9-static.mjs |
| D9-5 | P1 | PASS | evidence/d9-robust/probe-d9-robust-source.mjs |
| D9-6 | P1 | NOT_RUN | — |
| D9-7 | P2 | PASS | evidence/d9-robust/probe-d9-robust-source.mjs |
| D9-8 | P2 | BLOCKED | — |
| D9-9 | P1 | BLOCKED | — |
| D10-1 | P1 | NOT_RUN | — |
| D10-2 | P1 | NOT_RUN | — |
| D10-3 | P1 | NOT_RUN | — |
| D10-4 | P0 | PASS | evidence/d4-security-core/probe-p0-security.mjs |
| D10-5 | P1 | NOT_RUN | — |

---

## 五、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 - HW_ 前缀缺失 | `env \| grep HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，HW_ 前缀未拦截 | `safety-policy.mjs:335-343` env-dump 正则 `/HUAWEICLOUD\|HWC_\|HCLOUD\|OS_/i` 未覆盖 `HW_` 前缀 | P | 持续未修复（next.3→next.6） |
| 2 | P0 | D4-16 | 命令包裹穿透 - sh -c wrapper 内层命令未检测 | `sh -c "env \| grep HUAWEICLOUD"` 应返回 `deny` | 返回 `allow` | `safety-policy.mjs:classifyTextCommand()` 只检查整行文本，不提取 wrapper 内层参数 | P | 持续未修复（next.3→next.6） |
| 3 | P0 | D4-23 | agent-rules.md 未注入 WorkBuddy 安装目标 | WorkBuddy 安装目标应包含 `huawei-agent-rules.md` | 缺少复制逻辑 | `setup-cli.mjs` WorkBuddy 安装目标分支 | P | 持续未修复（next.3→next.6） |
| 4 | P1 | D5-1 | manifest.json 不存在 | 安装后应生成 `manifest.json` | 文件不存在 | `setup-cli.mjs` manifest 生成逻辑缺失 | P | 持续未修复 |
| 5 | P1 | D9-2 | JSON-RPC 错误码 -32603 而非 -32601 | 未知方法应返回 `-32601` (Method not found) | 硬编码 `-32603` (Internal Error) | `mcp-server.mjs:164-173` 统一 catch 块 | P | 持续未修复（next.3→next.6） |

### next.6 修复确认（与 next.3 对比）

| 用例 | next.3 状态 | next.6 状态 | 说明 |
|---|---|---|---|
| D4-21 | FAIL | PASS | broad IAM 制品规则已覆盖（新增 cloud-risk-rules.json 规则） |
| D4-22 | FAIL | PASS | 公网暴露 deploy plan 规则已覆盖 |
| D8-7 | FAIL | PASS | 7 个 meta 技能 SKILL.md 均可机械执行验证 |
| D4-9 | FAIL | PASS | evaluateCommandRisk findings 现在有内容 |

### SPEC-MISMATCH

| 用例 | 变更 | 说明 |
|---|---|---|
| D5-3 | 39→40 工具 | next.6 新增 1 个工具（`huaweicloud_check_update`/`huaweicloud_upgrade` 已注册为独立 MCP 工具），总工具数从 39 增至 40。设计基线仍为 39。 |

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-1 | 全新环境引导安装需重置环境 | 需独立 manifest + 环境重置 | 一次性环境 |
| D1-5 | uninstall 干净度需独立环境 | 需卸载后重装验证 | 一次性环境 |
| D1-58 | 通用 MCP 白名单需多客户端环境 | Claude/Cursor 环境依赖 | 多客户端环境 |
| D9-8 | MCP server spawn 触发 reg.exe 安全策略 | WorkBuddy 沙箱禁止 reg.exe | 安全中心移除 reg.exe 黑名单 |
| D9-9 | 同上 | 同上 | 同上 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | 否 | N/A | N/A |

> 本轮仅执行源码级探针和静态检查，未创建任何真云资源，无残留。

---

## 九、遗留与建议

- 待裁决 SPEC：D5-3 工具数 39→40（需更新设计基线或回退新增工具）
- 本轮未覆盖（说明范围）：真云 E2E（D3-C 系列）、多终端矩阵（D5-1~10 完整矩阵）、D10 评测集、D4-6/8/10/11/12/13/14/17/24 安全用例
- 建议：
  1. **P0 紧急修复**：D4-2 HW_ 前缀正则覆盖（安全漏洞，持续 3 轮未修复）
  2. **P0 紧急修复**：D4-16 wrapper 命令内层检测（安全漏洞，持续 3 轮未修复）
  3. **P0 紧急修复**：D4-23 WorkBuddy agent-rules.md 注入（持续 3 轮未修复）
  4. **P1 修复**：D9-2 JSON-RPC 错误码区分（-32601 vs -32603）
  5. **P1 修复**：D5-1 manifest.json 生成逻辑
  6. 解除 reg.exe 安全策略限制以覆盖 D9-8/D9-9
  7. 更新 D5-3 设计基线从 39→40（如新增工具为预期变更）

---

## 证据清单

| 证据目录 | 探针脚本 | 覆盖用例 |
|---|---|---|
| `evidence/d4-security-core/` | `probe-p0-security.mjs` + `stdout.log` | D4-1/2/3/4/5/7/9/15/16/18/19/20/21/22/23 + D2-4/11 + D10-4 + D8-7 |
| `evidence/d1-upgrade/` | `probe-p0-upgrade.mjs` + `stdout.log` | D1-26/27/28/30/31/33/39/40/41/42/45 |
| `evidence/d2-d3-auth-func/` | `probe-d2-d3-auth-func.mjs` + `stdout.log` | D2-1/2/5/10/12/13/16 + D3-A1/B1/B3/B5/C4/C5 + D1-3/4/6 |
| `evidence/d5-static/` | `probe-d5-d9-static.mjs` + `stdout.log` | D5-1/3 + D6-1/3/4 + D7-4 + D8-1/4/6 + D9-1/3/4 |
| `evidence/d9-robust/` | `probe-d9-robust-source.mjs` + `stdout.log` | D9-2/5/7 |
