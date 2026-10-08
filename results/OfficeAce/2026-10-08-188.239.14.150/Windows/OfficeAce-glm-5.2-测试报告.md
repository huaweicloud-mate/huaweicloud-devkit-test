# OfficeAce-glm-5.2 每日测试报告
> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-10-08 14:50:11（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-08-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（gitHead: ffd7b474） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针直调（MCP 工具层 + 源码级函数调用）+ 评测 harness（run-eval.mjs serviceCatalog 路由层）+ 真云 E2E（AK/SK 凭证）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 3 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 140） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `1 / 2 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `真云用例已归零（创建→测后删除→验证）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

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
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `tools.mjs:1147` 未调 classifyTextCommand | 待提单 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `hcloud-cli.mjs:776-777` 前缀截断+正则不匹配短键名 | 待提单 |
| 3 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS | `tools.mjs:2191` 分词器未切分 CJK/拉丁边界 | 待提单 |

### 根因详情

#### D4-16 命令包裹穿透（P0）
- **期望**：hook 检测到 `sh -c "hcloud ..."` 包裹内层命令并 deny
- **实际**：返回 `allow`，包裹命令穿透安全检查
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1147` — `hook_check_command` 调用 `evaluateCommandRisk`（`risk-rule-engine.mjs:143`），仅对原始命令字符串做正则规则匹配，**从未调用** `safety-policy.mjs` 中的 `classifyTextCommand`/`extractInnerCommand`（shell 包裹拆解逻辑所在）。`sh -c "hcloud ECS DeleteServers"` 整体送入规则引擎，无规则匹配包裹层 → 返回 `allow`
- **证据**：`evidence/D4-16/stdout.log`

#### D4-27 双路径输出脱敏（P1）
- **期望**：`redactSecrets` 与 `redactOutput` 双路径均将 AK/SK/token 明文替换为占位符
- **实际**：输出中 `{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1...` 凭证仍为明文
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:776-777` — `redactOutput` 先执行 `text.substring(bracketIdx)` 截掉首个 `{` 前的前缀文本（前缀中凭证被丢弃非脱敏）；JSON 路径仅脱敏 `isSecretKeyName` 能识别的键名（`safety-policy.mjs:20` 正则不匹配短键名 `ak`/`sk`）；字符串回退路径 `redactString` 仅匹配 `key:=value` 格式
- **证据**：`evidence/D4-27/stdout.log`

#### EXP-E01 serviceCatalog 路由未命中（P1）
- **期望**：中文意图"创建ECS"路由到 ECS 服务
- **实际**：返回 MISS（"Run hcloud --help to list available services."）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2191` — 分词器 `it.split(/[\s,./-]+/)` 不在 CJK 与拉丁字符间切分。`"创建ECS"` 经 `toLowerCase()` → `"创建ecs"`，无分隔符 → 整体成为一个 token `"创建ecs"`。路由匹配 `tokens.has('ecs')` → `false`，所有路由条目均不命中 → MISS
- **证据**：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox code path verified (skill + tools + session-manager + API module all present), but cannot execute real sandbox check-user/connect without MCP server context. Unblock condition: run probe through MCP server with valid sandbox service quota. |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D4-27 脱敏不完整但探针使用测试凭证，非真实泄漏）
- [x] 写操作误判 read-only：`无`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：`D4-27 发现双路径脱敏不完整（ak/sk 短键名未覆盖），已记为 FAIL 待修`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/安全组 | 真云用例按需创建 | 测后逐一删除 | ✅ 已验证归零 |
| EIP | 真云用例按需创建 | 测后释放 | ✅ 已验证归零 |
| IAM 子用户 | D4-13 只读切换 | env 生命周期自动还原 | ✅ 未落盘 |

> 真云用例均按「最低配置创建 → 测后删除 → 归零验证」执行，只删本次创建资源。

---

## 八、遗留与建议

- **D4-16（P0）**：`hook_check_command` 应在规则引擎前先调 `classifyTextCommand`/`extractInnerCommand` 拆解 shell 包裹，对内层命令递归检查。建议修复优先级：高（P0 安全缺陷）
- **D4-27（P1）**：`redactOutput` 不应截断前缀文本，应全量脱敏；`isSecretKeyName` 正则需覆盖短键名 `ak`/`sk`/`token`；`redactString` 需支持裸值格式。建议修复优先级：中
- **EXP-E01（P1）**：`serviceCatalog` 分词器需在 CJK 与拉丁字符边界插入分隔（如 `text.replace(/([\u4e00-\u9fff])([a-z])/gi, '$1 $2')`），确保 `"创建ecs"` → `["创建", "ecs"]`。建议修复优先级：中
- **D3-S3（BLOCKED）**：需 MCP server 上下文执行 sandbox API 调用，非 DSH 客户端当前无法自动化。建议后续通过 CDP 会话自动化或 MCP 直连解决
- **SPEC 裁决**：无 SPEC-MISMATCH 项
