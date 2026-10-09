# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-09 10:56:48（北京时间）
> **执行归档**：`results/OpenCode/2026-10-09-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ECS ecs-hd-ai-work-00-0007，cn-north-4） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | huaweicloud-devkit@1.1.8-next.1（npm @next，gitHead ffd7b474） |
| 工具全集 | 41（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud（KooCLI）已配置；AK/SK 已配置（~/.hcloud/config.json，admin profile） |
| 真云凭证 | cn-north-4（AKSK 主账号 + 只读子账号 test001，credentials.readonly.json 已就绪） |
| 测试类型 | 源码级探针 / MCP 协议 / 路由层 eval harness / 真机 CLI + 只读凭证注入 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；D9 协议/D10 路由经 `mcp-server.mjs` stdio JSON-RPC 真机调用；D4-13 经 `run-as-readonly.py` 注入只读子账号凭证实测；决策/结果落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 136 / 3 / 0 / 0 / 2 |
| 通过率（分母 = PASS+FAIL = 139） | 97.8% |
| P0 / P1 / P2 新增缺陷 | 1 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云仅 1 次只读查询 + 1 次 VPC 创建后删除，已归零验证） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 99 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-16、D4-17（安全规则/ hook fail-open），根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | D1-39（Windows 专属 P0，非对应 OS） |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 37 | EXP-C4-01~22 + EXP-D5-1-1/3 + EXP-E02~E15（除 E08） |
| FAIL | 1 | EXP-E01（路由层"云主机"关键词缺失） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP-E08（诊断类意图，不归 service_catalog 服务路由） |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-16 | risk-rule-engine 未解包 sh -c/eval 内层命令，包裹穿透 | `sh -c "printenv HW_ACCESS_KEY"` 应返回 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:14,35` + `risk-rule-engine.mjs` 无解包 | P | 待提单 |
| 2 | P1 | D4-17 | hook 解析畸形/空输入静默放行（fail-open） | 畸形 JSON 输入应输出 `permissionDecision=deny` | 空输出（放行） | `hooks/huaweicloud-safety.mjs:47-49` | P | 待提单 |
| 3 | P1 | EXP-E01 | 路由层中文"云主机"关键词缺失，ECS 查询 MISS | serviceCatalog('…云主机') 应含 `ECS` | 返回默认提示（MISS） | `src/tools.mjs:1970-1983` | P | 待提单 |

### 根因详情

**#1 [P0] D4-16 命令包裹穿透**

- 期望：`evaluateCommandRisk('sh -c "printenv HW_ACCESS_KEY"')` → `deny`
- 实际：返回 `allow`（`hwc-command-env-dump` 的 `(^|\s)(env|printenv)` 锚点要求动词前是行首/空白，`sh -c "` 的引号不满足；`cat credentials.json` 同理）
- 复现：`evidence/D4-16/stdout.log` 记录 4 条包裹命令，`sh -c` 包凭证读取/打印均 `allow`
- 对照：`safety-policy.mjs` 的 `classifyTextCommand`（经 `extractInnerCommand`，`safety-policy.mjs:405`）对相同输入返回 `deny`，但 MCP 工具 `huaweicloud_hook_check_command` 已切到 `risk-rule-engine.evaluateCommandRisk`，未复用解包逻辑

**#2 [P1] D4-17 hook fail-open**

- 期望：`echo 'not-json' | node huaweicloud-safety.mjs` → 输出 `permissionDecision=deny`
- 实际：无输出（exit 0，调用方视作放行）
- 根因：`hooks/huaweicloud-safety.mjs:47-49` `catch { return; }`

**#3 [P1] EXP-E01 路由层关键词缺失**

- 期望：`serviceCatalog('…有哪些云主机')` → `recommendedServices` 含 `ECS`
- 实际：`Run hcloud --help to list available services.`
- 根因：`src/tools.mjs:1970-1983` ECS routeMap keywords 缺「云主机」

---

## 五、未执行用例与原因（NOT_RUN / BLOCKED）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | OS 专属 P0 用例（Windows 升级检测链 EINVAL 专属），本机 Linux 非对应 OS；由 Windows 侧对应客户端覆盖 | — |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 调归属 | 诊断类意图（"我的 ECS 启动失败"）不归 service_catalog 服务路由，应走 explain_error 工具；eval harness 对 E08 判 N/A（无期望服务映射） | 建议展开规则明确"诊断类意图走 explain_error，非 service_catalog"，或将断言改为验证 explain_error 工具可达 |

---

## 六、安全与红线合规

- 凭证泄漏事件：0（D4-16/D4-17 为安全策略绕过缺陷，测试过程未实际泄露真实凭证）
- 写操作误判 read-only：0（`hcloud ECS DeleteServers` 判定 `warn`，`ListServersDetails` 判定 `allow`）
- 红线（I 类）违规：无
- 脱敏复核：evidence 含 `redactSecrets` 输出均为 `<redacted>`，无原始 AK/SK 落盘

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（minpriv-test-vpc） | 是（D4-13 只读凭证注入验证时误用 admin 创建） | 已删 | ListVpcs 归零验证：残留 0（仅他方 testbot3-hermes-e2e-* 2 个非本客户端资源） |
| ECS/VPC/其他 | 否 | — | 仅 1 次只读查询（ListServersDetails），无创建 |

> 真云只删本次创建资源；删除前已核对 VPC 名 `minpriv-test-vpc` 为本轮所建，他人资源未动。

---

## 八、遗留与建议

- D4-2（env | grep HW_）已于 1.1.8-next.1 修复（本轮判定 PASS），历史缺陷关闭。
- D4-23（全局规则注入）已于 1.1.8-next.1 修复（`rules/huawei-agent-rules.mdc` 入包 + `setup-cli.injectAgentRules` 21 处注入），本轮判定 PASS。
- D10 路由层准确率已由基线 21.4% 提升至 92.9%（13/14 HIT），仅剩「云主机」1 条 MISS。
- 建议：① `cloud-risk-rules.json` 取消 `(^|\s)` 锚点或让 `risk-rule-engine` 复用 `extractInnerCommand` 解包；② `huaweicloud-safety.mjs` 解析失败默认 deny；③ ECS routeMap 补「云主机」关键词。