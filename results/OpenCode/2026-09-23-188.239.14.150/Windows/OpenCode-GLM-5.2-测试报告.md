# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 17:10:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-23-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 3 个 P0 FAIL + 1 个 P1 FAIL，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.7-next.0`（npm @next，gitHead `0790e92a`，PR #800） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 已配置）` |
| 测试类型 | 源码级探针 / MCP 工具真机调用 / eval harness / 真云只读查询 |
| 设计真源 | 设计级 100 / 展开级 17（预筛后） / 追踪表 |
| daily 基础用例 | 设计级 100 / 展开级 17 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 工具真机调用（check_cli/list_operations/run_readonly/hook_check_*/plan_cli_command/show_profile_redacted/voucher_status/explain_error/detect_framework）+ eval harness（run-eval.mjs）；决策/结果落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `117`（设计级 100 + 展开级 17） |
| 已执行 | `117` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `102 / 15 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 117） | `87.2%` |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（只读查询无创建资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | D4-2/D4-3/D4-16(P0 安全 hook 缺口) + D10-3(P1 路由准确率) |
| BLOCKED | `0` | 无阻塞 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 全部执行 |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `6` | EXP-D5-1-1/D5-1-3 + EXP-E06/E08/E09/E15 |
| FAIL | `11` | EXP-E01~E05/E07/E10~E14 路由 MISS（与 D10-3 同根因） |
| BLOCKED | `0` | 无阻塞 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 全部执行 |
| **合计** | **`17`** | |

> EXP-C4-01~22（22 条，agent=Hermes）在 init_day.py 预筛中未剔除，已手动从展开级 CSV 移除（归属 Hermes 客户端，非 OpenCode 执行）。

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `printenv HW_SECRET_KEY` 应返回 `deny` | 返回 `allow` | `cloud-risk-rules.json:39` | P | 待提单 |
| 2 | P0 | `D4-3` | 明文 secret API 拦截缺失 | hcloud 含 `--adminPass`/`--ak`/`--sk` 应 `deny/warn` | 返回 `allow` | `cloud-risk-rules.json`（缺规则） | P | 待提单 |
| 3 | P0 | `D4-16` | 命令包裹穿透 | `sh -c "cat credentials.json"` 应 `deny` | 返回 `allow` | `risk-rule-engine.mjs:143` | P | 待提单 |
| 4 | P1 | `D10-3` | serviceCatalog 路由准确率 21.4% < 90% | 路由准确率 ≥90% | 21.4%（3/14 HIT） | `tools.mjs:1815` | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`printenv HW_SECRET_KEY` → `deny`
- 实际：返回 `allow`，`HW_SECRET_KEY` 未被拦截
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39`
  `hwc-command-env-dump` 规则第二个条件正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀。devkit 使用 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 环境变量名，但正则不匹配 `HW_` 前缀。
- 证据：`evidence/D4-2/stdout.log`，MCP `huaweicloud_hook_check_command` 实测 `allow`

**#2 [P0] D4-3 明文 secret API 拦截缺失**

- 期望：`hcloud ECS CreateServers --adminPass Password123! --ak AKEXAMPLE --sk SKEXAMPLE` → `deny/warn`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺少检测 hcloud 命令内联密钥参数（`--adminPass`/`--ak`/`--sk`/`--password`/`--token`）的规则
- 证据：`evidence/D4-3/stdout.log`，MCP 实测 `allow`

**#3 [P0] D4-16 命令包裹穿透**

- 期望：`sh -c "cat credentials.json"` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:143` `evaluateCommandRisk()` 不解析 shell 包裹（`sh -c`/`bash -c`/`cmd /c`）中的内层命令
- 证据：`evidence/D4-16/stdout.log`，MCP 实测 `allow`

**#4 [P1] D10-3 serviceCatalog 路由准确率 21.4%**

- 期望：路由准确率 ≥90%
- 实际：21.4%（3 HIT / 14 total），11/14 中文意图落入 `Run hcloud --help` 兜底
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1815` `serviceCatalog(intent)` 意图匹配模式覆盖不足
- 证据：`evidence/D10-3/stdout.log`、`evidence/eval-run-result.csv`

---

## 五、未执行用例与原因

无未执行用例。EXP-C4-01~22（22 条，agent=Hermes）已从展开级 CSV 移除（init_day.py 预筛未剔除但归属 Hermes，非 OpenCode 执行范围）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 实测 DeleteServers → risk=write, decision=deny）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 实测 AK/SK/securityToken 全部 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（只读查询 ListServersDetails） | N/A | count=0，无创建 |
| 沙箱 | 否（未使用沙箱场景） | N/A | N/A |

> 本轮测试以源码级探针 + MCP 只读工具调用为主，未创建任何云资源，无残留。

---

## 八、遗留与建议

- **P0 安全 hook 缺口（3 项）**：D4-2/D4-3/D4-16 均为风险规则引擎覆盖不足，建议在 `cloud-risk-rules.json` 中新增/修改规则：
  - D4-2: env-dump 规则正则增加 `HW_` 前缀
  - D4-3: 新增 hcloud 内联密钥参数检测规则
  - D4-16: `evaluateCommandRisk()` 增加 shell 包裹内层命令提取逻辑
- **P1 路由准确率（D10-3）**：serviceCatalog 中文意图匹配需大幅扩展，当前 21.4% 远低于 90% 阈值，影响 Agent 路由能力
- **EXP-C4 归属问题**：init_day.py 预筛未剔除 agent=Hermes 的展开级用例，建议修复预筛逻辑
