# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-24 13:00:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-24-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 缺陷 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows 11 (win32)` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.7-next.1`（npm @next，gitHead `657ceb7b`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置 / doctor 确认` |
| 真云凭证 | `cn-north-4（AKSK / 已使用）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 工具真机调用（run_readonly_command/plan_cli_command/explain_error/voucher_status/service_catalog/sandbox_check_user），决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `139`（设计级 100 + 展开级 39） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `121 / 18 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `87.1%` |
| P0 / P1 / P2 新增缺陷 | `3 / 4 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（仅只读操作，无创建资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 无未执行 |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `33` | 有证据且通过 PASS 门禁（EXP-C4 22 + EXP-E 3 + EXP-D5 2 + 其他 6） |
| FAIL | `6` | EXP-E01~E05, E07, E10~E14 路由 MISS（归入 D10-3 缺陷） |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 无未执行 |
| **合计** | **`39`** | |

> 注：展开级 11 个 EXP-E FAIL 归入 #8 D10-3 serviceCatalog 路由缺陷统一提单。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证env打印拦截不完整 | `printenv HW_SECRET_KEY` → `deny` | 返回 `allow` | `cloud-risk-rules.json:39` | P | 待提单 |
| 2 | P0 | `D4-3` | 明文secret API拦截缺失 | `--adminPass`/`--ak`/`--sk` → `deny` | 返回 `allow` | `cloud-risk-rules.json`（缺规则） | P | 待提单 |
| 3 | P0 | `D4-16` | 命令包裹穿透 | `sh -c "cat credentials.json"` → `deny` | 返回 `allow` | `risk-rule-engine.mjs:143` | P | 待提单 |
| 4 | P1 | `D4-7` | hook_check_command对内联密钥无效 | 含 `--ak`/`--sk` → `deny` | 返回 `allow` | 同 #2 | P | 待提单 |
| 5 | P1 | `D4-17` | 未知命令fail-open | 未知命令 → `deny` 或 `warn` | 返回 `allow` | `risk-rule-engine.mjs:106` | P | 待提单 |
| 6 | P1 | `D2-4` | 凭证脱敏遗漏token= | `token=xxx` → `token=<redacted>` | `token=token123` 明文 | `safety-policy.mjs:42-45` | P | 待提单 |
| 7 | P2 | `D4-26` | findings证据脱敏遗漏token= | `token=xxx` → `token=<redacted>` | `token=tok789` 明文 | 同 #6 | P | 待提单 |
| 8 | P1 | `D10-3` | serviceCatalog路由准确率21.4% | 路由准确率 ≥90% | 21.4%（3/14 HIT） | `tools.mjs` serviceCatalog | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证env打印拦截不完整**
- 期望：`printenv HW_SECRET_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39`
  `hwc-command-env-dump` 规则的正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀
- 证据：`evidence/D4-2/stdout.log`，MCP 工具实测 `printenv HW_SECRET_KEY` → `allow`

**#2 [P0] D4-3 明文secret API拦截缺失**
- 期望：hcloud 命令含 `--adminPass`/`--ak`/`--sk` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — 缺少内联密钥参数检测规则
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**
- 期望：`sh -c "cat credentials.json"` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:143` — 不解析 shell 包裹内层命令
- 证据：`evidence/D4-16/stdout.log`

**#5 [P1] D4-17 未知命令fail-open**
- 期望：未知命令 → `deny` 或 `warn`（fail-closed）
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` — `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则匹配时返回 `allow`
- 证据：`evidence/D4-17/stdout.log`

**#6 [P1] D2-4 凭证脱敏遗漏token=**
- 期望：`token=token123` → `token=<redacted>`
- 实际：`token=token123` 明文
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42-45` — `redactString()` 正则不含裸 `token` 关键字
- 证据：`evidence/D2-4/stdout.log`

**#8 [P1] D10-3 serviceCatalog路由准确率21.4%**
- 期望：路由准确率 ≥90%
- 实际：21.4%（3 HIT / 14 total），11/14 中文意图落入通用兜底
- 根因：`plugins/huaweicloud-core/src/tools.mjs` — serviceCatalog 意图匹配模式覆盖面不足
- 证据：`evidence/D10-3/stdout.log`、`evidence/eval-run-result.csv`

---

## 五、未执行用例与原因

无未执行用例。全部 139 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（AK/SK 均被 redactSecrets 脱敏）
- [x] 真云执行：D3-S1 只读查ECS（count=0）、D3-S2 删VPC审批拦截（deny）、D3-S3 沙箱check_user（verified）、D3-S4 领券状态（claimed）、D3-S7 跨服务路由（RDS+CloudDeploy）、D3-S8 排障指引（explain_error）、D4-13 只读凭证（redacted）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（只读查询） | N/A | count=0，无残留 |
| VPC | 否（plan_only） | N/A | safeToRun=false，未执行 |
| 沙箱 | 否（check_user only） | N/A | 无创建 |
| RDS | 否（service_catalog only） | N/A | 无创建 |

> 本轮真云用例均为只读/规划操作，未创建任何云资源，无需销毁归零。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：D3-S7 跨服务交付仅验证路由规划层，未实际创建 RDS+部署 Web 应用（成本考虑）
- 建议：
  1. **P0 紧急修复**：`cloud-risk-rules.json` env-dump 正则添加 `HW_` 前缀；新增内联密钥参数检测规则；`risk-rule-engine.mjs` 添加 shell 包裹解析
  2. **P1 修复**：`risk-rule-engine.mjs:106` 改 fail-closed（未知命令默认 deny/warn）；`safety-policy.mjs:42` 正则添加 `token` 关键字
  3. **P1 修复**：`tools.mjs` serviceCatalog 扩展中文意图匹配模式覆盖面
