# Codex-GPT-5 每日测试报告
> **报告名**：`Codex-GPT-5-测试报告.md`
> **生成时间**：2026-11-19 05:12:55（北京时间）
> **执行归档**：`results/Codex/2026-11-19-10.1.8.13/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.14 (gitHead bd985051)` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码导出函数直调、Codex 客户端夹具、CLI 真机命令、MCP stdio 协议调用、华为云只读身份/余额探活及 serviceCatalog 评测集；逐用例证据落入 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0` |
| 红线（I 类）违规 | `2 项安全断言失败，无真实凭证或云资源泄漏事件` |
| 资源释放 | `本轮未创建计费云资源，无待释放资源` |

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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `plugins/huaweicloud-core/src/safety-policy.mjs:45` | 待查重提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/src/safety-policy.mjs:249` | 待查重提单 |
| 3 | P1 | `EXP-E01` | D10评测集 | 中文“云主机”查询路由 | `plugins/huaweicloud-core/src/tools.mjs:2362` | 待查重提单 |

### 根因详情

**D2-4 凭证脱敏正确性**

- 期望：字符串中的小写 `ak=` 和 `sk=` 值均替换为 `<redacted>`。
- 实际：`redactSecrets()` 原样返回两个测试凭证值。
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的短键正则仅匹配大写 `(AK|SK)`，缺少 `i` 标志。
- 证据：`evidence/D2-4/stdout.log`。

**D4-3 明文 secret API 拦截**

- 期望：`hcloud KMS DecryptData` 分类结果为 `deny`。
- 实际：`classifyTextCommand()` 返回 `allow`。
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:249` 仅按 `blockedSecretOperations` 精确匹配，且后续明文读取正则不含 `DecryptData`。
- 证据：`evidence/D4-3/stdout.log`。

**EXP-E01 中文云主机查询路由**

- 期望：中文意图“有哪些云主机”推荐服务包含 `ECS`。
- 实际：返回通用 `Run hcloud --help to list available services.`。
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2362` 的 ECS 关键词表包含“云服务器”，但缺少常用同义词“云主机”。
- 证据：`evidence/EXP-E01/stdout.log`。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | 【调归属】2026-11-19 05:09 CST 实测；缺 DSH 宿主注入的 `HUAWEICLOUD_AGENT_TOOLKIT_MODE`；无法验证 DSH 跳过安装分支；在 DSH 客户端执行即可解除。 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】2026-11-19 05:09 CST 实测；缺可连接的 DevStation 沙箱上游；无法完成部署并取得公网 URL；接入有效 DevStation 会话后解除。 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 【补环境】2026-11-19 05:09 CST 实测；缺 DevStation HDKit 上游与 hwlink 会话；无法验证参数透传；配置有效上游会话后解除。 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】2026-11-19 05:09 CST 实测；缺可用 DevStation 沙箱连接；无法取得真实预览 URL；沙箱服务可连接后解除。 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】2026-11-19 05:09 CST 实测；缺 DevStation 沙箱上游；跨服务交付链无法启动，未创建任何资源；接入沙箱后按创建、验证、销毁、归零流程解除。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 使用固定测试值，未写入真实 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`2 项产品安全断言失败，均已记录根因与证据`
- [x] 脱敏复核：证据中不含真实凭证；D2-4 暴露内容为探针固定测试值

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/RDS/OBS 等计费资源 | 否 | 不适用 | 前置探活与 MCP 调用均为只读或 plan，未执行创建 |
| DevStation 沙箱 | 否 | 不适用 | 上游不可用，未建立沙箱会话 |

> 本轮没有创建云资源，因此没有资源删除动作；未触碰既有资源。

---

## 八、遗留与建议

- 修复 `redactString()` 对小写 `ak`/`sk` 的匹配，并加入大小写回归样例。
- 将 `DecryptData` 纳入明文 secret 操作阻断集合。
- 将“云主机”加入 ECS 中文路由关键词。
- 5 项 BLOCKED 在 DSH/DevStation 对应环境补测。
