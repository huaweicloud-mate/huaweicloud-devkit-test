# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-11-04 05:07:35（北京时间）
> **执行归档**：`results/WorkBuddy/2026-11-04-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.3`（gitHead: 7ad8a533） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：batch_runner_20261104.mjs 一次性执行全部 146 用例。D1 安装维度用 `npx huaweicloud-devkit doctor/status/plugins` 真实 CLI；D2 认证维度直调源码模块 `auth/credentials.mjs`/`auth/service.mjs`/`safety-policy.mjs`；D3 功能维度通过 `mcp_helper.mjs` 真实 MCP initialize/tools/list/tools/call（service_catalog/list_operations/plan_cli_command）；D4 安全维度直调 `classifyTextCommand` 真实分类函数，对红线攻击输入（小写 ak=、KMS DecryptData、bash/env 穿透）逐条构造攻击并断言 decision 字段；D5/D6/D8/D9 直调源码模块/真实 MCP 握手；D10 跑 `eval/harness/run-eval.mjs` 真实路由层；EXP-C4-01~22 逐服务真调 `huaweicloud_list_operations`；EXP-E01~E15 逐 prompt 真调 `huaweicloud_service_catalog` 断言 recommendedServices。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0` |
| 红线（I 类）违规 | `0`（红线用例 D2-4/D4-3/D4-2/D4-16 均真实构造攻击执行，D2-4/D4-3 发现真实缺陷已记 FINDINGS） |
| 资源释放 | `N/A`（本次测试未创建真云资源 — EXP-C4 系列为只读 list_operations + plan，无创建类真云用例在本客户端执行） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` 正则 `/(AK\|SK)\s*[:=]\s*.../g` 未加 `i` 忽略大小写标志，小写 `ak=`/`sk=` 形式不被脱敏 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety-policy.mjs:524` classifyTextCommand → classifyHcloudArgs 风险规则未含 KMS DecryptData，落入 allow 默认路径 | 待提单 |
| 3 | P1 | `EXP-E01` | D10评测 | service_catalog 路由 MISS | `tools.mjs:2263` serviceCatalog routeMap ECS 关键词列表（行2271-2284）未含 `云主机` | 待提单 |

### 根因详情

#### #1 D2-4 凭证脱敏正确性（P0）
- **期望**：`redactSecrets("config: ak=TESTAK... sk=TESTSK...")` 返回值不含原始 AK/SK
- **实际**：返回值 `config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY` — 明文泄露
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `.replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')` 正则只匹配大写 AK/SK，未加 `i` 标志
- **证据**：`evidence/D2-4/stdout.log`

#### #2 D4-3 明文 secret API 拦截（P0）
- **期望**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx')` 返回 `decision: "deny"` 或 `"warn"`
- **实际**：返回 `decision: "allow"` — KMS 解密操作未被拦截
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:524` `classifyTextCommand` → `classifyHcloudArgs`（行185）的风险规则列表未含 KMS DecryptData 操作，落入行383 `not_huaweicloud` allow 默认路径
- **证据**：`evidence/D4-3/stdout.log`

#### #3 EXP-E01 service_catalog 路由 MISS（P1）
- **期望**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 含 `ECS`
- **实际**：返回 `["Run hcloud --help to list available services."]` — MISS
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2263` `serviceCatalog` routeMap ECS 关键词列表（行2271-2284）含 `云服务器`/`服务器`/`虚拟机` 但未含 `云主机`（华为云 ECS 常见中文别名）
- **证据**：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | AGENT_TOOLKIT_MODE=local is DSH-client-specific (HUAWEICLOUD_AGENT_TOOLKIT_MODE env tested by DSH agent) |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection (real network sandbox) |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit requires DevStation upstream |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox requires DevStation upstream |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox requires DevStation upstream |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：D2-4 发现小写 `ak=`/`sk=` 脱敏绕过（P0 缺陷，见 FINDINGS #1）
- [x] 写操作误判 read-only：D4-5 DeleteServer 正确判 deny（PASS），未发现误判
- [x] 红线（I 类）违规：D2-4（小写 ak= 脱敏绕过）、D4-3（KMS DecryptData 误判 allow）发现真实缺陷；D4-2 env 打印拦截 PASS（4 种攻击全部 deny）、D4-16 命令包裹穿透 PASS（bash/sh/cmd 3 种包裹全部 deny）— 红线用例逐条真实构造攻击执行
- [x] 脱敏复核：D2-4 FAIL（小写 ak 泄露）；D4-26/D4-27 对象/双路径脱敏 PASS（大写 AK/SK 正常脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| N/A | 本次未创建真云资源 | N/A | N/A |

> 本次测试 EXP-C4-01~22 为只读 `list_operations` + `plan` 命令，无创建类真云用例在 WorkBuddy 客户端执行。所有 MCP 调用为真实调用（非 mock），但不涉及资源创建/销毁。

---

## 八、遗留与建议

- 3 项缺陷（D2-4 P0、D4-3 P0、EXP-E01 P1）已记入 FINDINGS.md，将通过 `file_issue.py` 统一提单到源码仓库。
- D2-4 修复建议：`safety-policy.mjs:45` 正则加 `i` 标志：`/(AK|SK)\s*[:=]\s*.../gi`
- D4-3 修复建议：`classifyHcloudArgs` 风险规则新增 KMS DecryptData 等 secret API 操作到 deny/warn 列表
- EXP-E01 修复建议：`tools.mjs:2271` ECS routeMap 关键词列表新增 `云主机`
- BLOCKED 用例（D1-67/D3-C3/D3-C14/D3-S3/D3-S7）均为真·外部依赖（DSH 专属/Sandbox DevStation 上游），非假阻塞。
