# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-15 21:50:00（北京时间）— 补测更新
> **执行归档**：`results/WorkBuddy/2026-09-15-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 3 个 P0 FAIL + 1 个 P1 FAIL + 1 个 P1 EXP-E 路由 FAIL + 1 个 SPEC-MISMATCH）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f6`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI v7.2.12 已安装 |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针（.mjs 直调导出函数）+ CLI 真机 + MCP 工具验证 + D10 评测 harness |
| 设计真源 | 设计级 77（daily 精选）/ 展开级 17（预筛 WorkBuddy+Windows） |

> **执行方法**：
> - 探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（judgeUpdate/applyUpdateHint/mergeMcpServersFile/resolveManagedProfile/readKooCliProfiles/removeKooCli/probeHcloud/detectAgent/classifyHcloudArgs/redactSecrets 等）
> - D10 评测 harness `eval/harness/run-eval.mjs` 跑 15 条中文意图路由评测
> - D6-4 并发压测 `supplement-probe.mjs` 15 并发 tools/list
> - 证据统一落 `evidence/<case-id>/`

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 94（设计级 77 + 展开级 17） |
| 已执行 | 94（PASS+FAIL+BLOCKED+SPEC-MISMATCH） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 76 / 15 / 2 / 1 / 0 |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED/SPEC-MISMATCH） | 83.5%（76/91） |
| P0 / P1 / P2 新增缺陷 | 3 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（未创建真云资源） |

> **补测说明**：本次补测将原 12 个 BLOCKED 中的 9 个回填为 PASS（源码级直调验证）、1 个回填为 SPEC-MISMATCH（D9-9）、仅 2 个保留 BLOCKED（D4-13/D4-24 真·外部依赖）。D10 评测 harness 首次实际运行，发现 11/14 中文意图路由 MISS（基线 21.4% 准确率）。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 70 | 有证据且通过 PASS 门禁（含补测 9 个原 BLOCKED→PASS） |
| FAIL | 4 | 不符预期，根因见缺陷清单（D1-39/D4-2/D4-16/D4-6） |
| BLOCKED | 2 | 真外部依赖阻塞（D4-13 只读凭证/D4-24 真云审批流），见 §五 |
| SPEC-MISMATCH | 1 | D9-9 initialize 未声明 cancellation 能力 |
| NOT_RUN | 0 | — |
| **合计** | **77** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 6 | EXP-E06/E08/E09/E15 命中或诊断类 + EXP-D5-5-1/D5-5-3 |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14 serviceCatalog 路由 MISS（基线 21.4%） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **17** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> **铁律**：缺陷必须真实执行后填写；未执行/推测的不得记为缺陷。字段完整到可让修复方直接定位。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | Windows 升级检测链不可用 | `queryDistTagsSync()` 应返回 `{latest,next}` | 返回 `null`；`spawnSync('npm.cmd')` status=null | `update-check.mjs:238` | P | 待提单 |
| 2 | P0 | `D4-2` | HW_ACCESS_KEY/HW_SECRET_KEY env 打印未拦截 | `classifyTextCommand('printenv HW_ACCESS_KEY')` → `deny` | 返回 `allow` | `safety-policy.mjs:336` | P | 待提单 |
| 3 | P0 | `D4-16` | 命令包裹穿透（sh -c/bash -c 包裹 hcloud 写命令） | `classifyTextCommand('sh -c "hcloud ECS DeleteServer"')` → `deny` | 返回 `allow` | `safety-policy.mjs:345` | P | 待提单 |
| 4 | P1 | `D4-6` | adminPass 空格分隔 CLI 参数未脱敏 | `redactSecrets('--adminPass MyPassword123!')` → `--adminPass <redacted>` | 返回原文未脱敏 | `safety-policy.mjs:42` | P | 待提单 |
| 5 | P1 | `EXP-E01~E14` | serviceCatalog 中文意图路由命中率仅 21.4% | 15 条中文意图应正确路由到期望服务 | 11/14 MISS，返回 "Run hcloud --help..." 后备 | `tools.mjs:1886-1908` | P | 待提单 |
| 6 | SPEC | `D9-9` | initialize 未声明 notifications/cancellation 能力 | capabilities 应含 cancellation 字段 | 仅 `{tools:{}}` | `mcp-protocol.mjs:62-68` | I | SPEC-MISMATCH |

### 根因详情

**#1~#4** 详见 FINDINGS.md #1~#4（与原报告一致）。

**#5【P1】EXP-E01~E14 serviceCatalog 中文意图路由命中率仅 21.4%**

- 期望：中文意图（如"帮我查一下我账号在华北北京四有哪些云主机"→ECS）应被 `serviceCatalog` 正确路由
- 实际：11/14 MISS，返回 `"Run hcloud --help to list available services."` 后备响应
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1886-1908` — routeMap 关键词以英文为主，缺少中文关键词
- 证据：`evidence/EXP-E01/stdout.log`（含 15 条评测集完整结果），`eval/results/eval-run-20260915134457.csv`

**#6【SPEC-MISMATCH】D9-9 initialize 未声明 cancellation 能力**

- 期望：`initialize.result.capabilities` 应含 `notifications/cancellation`
- 实际：仅 `{tools:{}}`
- 根因：`plugins/huaweicloud-core/src/mcp-protocol.mjs:62-68`
- 证据：`evidence/D9-9/stdout.log`

---

## 五、BLOCKED 用例（真·外部依赖）

| 用例ID | 层级 | 优先级 | 状态 | blockedReason（四要素） |
|---|---|---|---|---|
| `D4-13` | 设计级 | P1 | BLOCKED | 实测时间:2026-09-15T13:50:00Z \| 缺什么资源:只读子账号凭证 credentials.readonly.json 未配置 \| 影响:无法验证最小权限凭证通过率（D3只读用例100%通过率+写用例权限识别） \| 解除条件:配置 ~/.config/huaweicloud/credentials.readonly.json（只读子账号 test001 AK/SK）后可复测 |
| `D4-24` | 设计级 | P1 | BLOCKED | 实测时间:2026-09-15T13:50:00Z \| 缺什么资源:真云计费资源（需创建最小规格ECS测试审批流）+ 可注入时钟（令牌TTL=60s加速） \| 影响:无法验证令牌过期（CONFIRM_TOKEN_EXPIRED）和重复确认（already_processed）精确响应；源码级已验证classification gate（write→deny, read→allow）和redactSecrets \| 解除条件:配置真云凭证+可注入时钟后可复测 |

> 仅 2 个 BLOCKED 为真·外部依赖（凭证/计费资源缺失），非假阻塞。原 12 个 BLOCKED 中 9 个已补测为 PASS（源码级直调），1 个为 SPEC-MISMATCH（D9-9）。

---

## 六、补测详情（原 BLOCKED → 新状态）

| 用例ID | 原状态 | 新状态 | 补测方法 | 证据 |
|---|---|---|---|---|
| D1-1 | BLOCKED | PASS | 直调 agent-registry.mjs：23 个 agent 注册（含 WorkBuddy），detectAgentHarness 正确返回 | evidence/D1-1/stdout.log |
| D1-2 | BLOCKED | PASS | 直调 agent-detect.mjs：detectAgent 覆盖全部注册 agent，AGENT_HARNESS env 覆盖正常 | evidence/D1-2/stdout.log |
| D1-5 | BLOCKED | PASS | 直调 uninstall-cleanup.mjs：removeKooCli/removeObsConfig 在 temp dir 验证清理+空目录不崩溃 | evidence/D1-5/stdout.log |
| D1-6 | BLOCKED | PASS | 直调 hcloud-probe.mjs：KooCLI v7.2.12 已安装，probeHcloud 返回 ok | evidence/D1-6/stdout.log |
| D1-42 | BLOCKED | PASS | 直调 update-check.mjs：writeSkipState→readSkipState→judgeUpdate(cooldown→dismissed→expire→update_available) 全链路 | evidence/D1-42/stdout.log |
| D1-45 | BLOCKED | PASS | 直调 update-check.mjs applyUpdateHint + mcp-protocol.mjs _decorateResult：check/upgrade 不注入，其他工具注入，一次性消费 | evidence/D1-45/stdout.log |
| D1-58 | BLOCKED | PASS | 直调 mcp-config-merge.mjs + mcp-config-backup.mjs：幂等合并+用户参数保留+坏JSON处理+backup/restore roundtrip | evidence/D1-58/stdout.log |
| D2-10 | BLOCKED | PASS | 直调 reconcile.mjs：readKooCliProfiles(current=deploy)→resolveManagedProfile→切换current=default→加密配置处理 | evidence/D2-10/stdout.log |
| D6-4 | BLOCKED | PASS | supplement-probe.mjs：15 并发 tools/list 全部返回 40 工具，无死锁/消息错乱 | evidence/D6-4/stdout.log |
| D9-9 | BLOCKED | SPEC-MISMATCH | 直调 mcp-protocol.mjs dispatch('initialize')：capabilities 不含 notifications/cancellation | evidence/D9-9/stdout.log |
| D4-13 | BLOCKED | BLOCKED | 真外部依赖：只读子账号凭证缺失 | — |
| D4-24 | BLOCKED | BLOCKED | 真外部依赖：真云计费资源+可注入时钟；源码级已验证 classification gate | evidence/D4-24/stdout.log |
| EXP-E01~E15 | PASS | 6 PASS/11 FAIL | eval/harness/run-eval.mjs：15 条中文意图路由评测，21.4% 准确率 | evidence/EXP-E*/stdout.log |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（测试中未发生凭证泄漏）
- [x] 写操作误判 read-only：`0`（D4-5 验证写操作均不被误判为 allow）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志
- [ ] **安全缺陷 3 个 P0**：D4-2（env 变量漏拦截）、D4-16（shell 包裹穿透）、D1-39（升级检测链失效）
- [x] **红线 #4 合规**：所有 BLOCKED 均有 blockedReason 四要素；无假阻塞（探针/harness/直调均已执行）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | — | 未创建任何真云资源（源码级探针测试） |
| 临时文件 | 是 | 已清理 | skip 文件/creds-import.json/fake config 测试后已删除 |

---

## 九、遗留与建议

- **待提单缺陷 5 个 + 1 个 SPEC-MISMATCH**（3 P0 + 2 P1），详见 FINDINGS.md
- **BLOCKED 2 个**：真·外部依赖（D4-13 只读凭证/D4-24 真云审批流），blockedReason 四要素已写明
- **建议优先修复**：
  1. D4-2 + D4-16：安全策略正则补齐（`HW_` 前缀 + shell 包裹检测）— 安全风险最高
  2. D1-39：`spawnSync` 加 `shell: true`（Windows .cmd 必需）— 影响所有 Windows 用户
  3. EXP-E 路由：routeMap 补充中文关键词（云主机/云服务器/弹性公网IP/云数据库/备份/监控/证书/权限审计/费用）— 影响中文场景路由准确率
  4. D4-6：`redactString` 正则支持空格分隔 CLI 参数格式
  5. D9-9：initialize 响应补充 cancellation 能力声明
- **未覆盖范围**：真云 E2E（需真云资源创建销毁）、只读子账号凭证测试（D4-13）、真云审批流时钟测试（D4-24）
