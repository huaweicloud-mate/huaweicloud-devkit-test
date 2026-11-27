# Codex-GPT-5 每日测试报告
> **报告名**：`Codex-GPT-5-测试报告.md`
> **生成时间**：2026-11-28 05:19:06（北京时间）
> **执行归档**：`results/Codex/2026-11-28-10.1.8.37/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.16 (gitHead 905498cb)` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：在 Windows Codex 宿主上真实执行 CLI（doctor/status/version）、MCP initialize/tools/list/tools/call、源码导出函数夹具、协议/超时/WebSocket harness、22 服务只读 `list_operations` 与 15 条路由评测；每条结论均写入 `evidence/<case-id>/stdout.log`。本轮未调用资源创建/删除 API。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 4 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0` |
| 红线（I 类）违规 | `2`（凭证字符串脱敏、KMS 明文解密操作拦截） |
| 资源释放 | `未创建云资源；残留 0` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
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
| 1 | P0 | `D2-4` | D2认证 | 小写 `ak=/sk=` 未脱敏 | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | KMS `DecryptData` 被判定为 allow | `safety/policy.json:26`、`safety-policy.mjs:249` | 待提单 |
| 3 | P1 | `EXP-E01` | D10路由 | “云主机”未路由到 ECS | `tools.mjs:2578-2591`、`tools.mjs:2827-2829` | 待提单 |

### 根因详情

**#1 [P0] D2-4 小写 AK/SK 参数未脱敏**

- 期望：`redactSecrets("config: ak=... sk=...")` 不包含任何原始 AK/SK 值。
- 实际：返回值完整保留小写 `ak=` 与 `sk=` 后的测试凭证。
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的 `(AK|SK)` 正则缺少 `i` 标志，仅匹配大写键名。
- 证据：`evidence/D2-4/stdout.log`。

**#2 [P0] D4-3 KMS DecryptData 未被敏感操作策略拦截**

- 期望：`hcloud KMS DecryptData` 分类结果必须为 `deny`。
- 实际：`classifyTextCommand` 返回 `allow`。
- 根因：`plugins/huaweicloud-core/safety/policy.json:26` 的 `blockedSecretOperations` 未包含 `DecryptData`；`plugins/huaweicloud-core/src/safety-policy.mjs:249` 仅按该数组精确匹配。
- 证据：`evidence/D4-3/stdout.log`。

**#3 [P1] EXP-E01 “云主机”意图未命中 ECS**

- 期望：意图“帮我查一下我账号在华北北京四有哪些云主机”推荐服务包含 `ECS`。
- 实际：返回 fallback `Run hcloud --help to list available services.`。
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2578-2591` 的 ECS 中文关键词包含“云服务器”等词但缺少“云主机”；未命中后由 `tools.mjs:2827-2829` 返回 fallback。
- 证据：`evidence/EXP-E01/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | 【调归属】该用例验证 DSH 专属 `AGENT_TOOLKIT_MODE=local` 安装路径，不适用于 Codex；建议在设计级增加 DSH 专属归属标记。 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】实测时间 2026-11-28 05:14 CST；缺少可达的 DevStation/Sandbox 上游会话连接；影响为无法执行真实沙箱部署 E2E；解除条件为给 Codex 测试机配置可用 DevStation workspace 与 hwlink 会话后复测 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 【补环境】实测时间 2026-11-28 05:14 CST；缺少可达的 DevStation HDKit 上游会话；影响为无法验证真实 hwlink 凭证交换链路（本地 fixture 已执行并发现独立失败）；解除条件为提供有效 DevStation session/dev_stage_id 与上游网络后复测 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】实测时间 2026-11-28 05:14 CST；缺少可达的 DevStation/Sandbox 上游会话；影响为无法获得真实预览 URL；解除条件为配置可用 DevStation workspace、hwlink 隧道和预览端点后复测 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】实测时间 2026-11-28 05:14 CST；缺少可达的 DevStation/Sandbox 上游会话；影响为无法执行 Web 应用与 RDS 的跨服务交付及归零验证；解除条件为配置可用 DevStation workspace、hwlink 会话和对应沙箱权限后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`1 项测试载荷未脱敏（D2-4），未使用真实凭证值`
- [x] 写操作/敏感操作误判：`1 项（D4-3，KMS DecryptData 判为 allow）`
- [x] 红线（I 类）违规：`2 项，均已记录根因并进入统一提单`
- [x] 脱敏复核：`证据仅含合成测试值；D4-13 仅记录只读账号 AK 前缀，不含 SK/token`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/OBS/RDS 等云资源 | 否 | 不适用 | 本轮仅执行只读 `list_operations` 与 plan，无资源创建请求，残留 0 |
| DevStation/Sandbox | 否 | 不适用 | 上游会话不可达，4 项如实 BLOCKED，未产生资源 |

> 本轮无创建型真云用例执行；未调用删除操作，也未触碰既有资源。

---

## 八、遗留与建议

- 4 项 Sandbox/DevStation 真实上游链路待环境补齐后复测，解除条件已逐条写入 `blockedReason`。
- `D1-67` 应调整为 DSH 专属归属，避免继续下发给 Codex。
- 专项 fixture 另发现若干测试契约与 1.1.16 文案/返回结构漂移；未映射为本轮 daily FAIL 的项目不纳入产品提单。
