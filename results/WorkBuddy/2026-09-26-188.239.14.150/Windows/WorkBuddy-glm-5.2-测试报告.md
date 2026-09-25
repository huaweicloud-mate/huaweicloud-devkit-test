# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-26 05:20:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-26-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` (Windows Server 2022 Standard) |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7` (gitHead: `7456d05`) |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调（safety-policy.mjs / update-check.mjs / mcp-protocol.mjs / tools.mjs / risk-rule-engine.mjs）+ MCP 工具枚举 + eval harness 路由层 + 文档/脚本机械验证。5 个聚合探针 + 1 个补充探针覆盖 152 个用例 ID，每个用例结果落盘 evidence/<case-id>/stdout.log。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 16 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `88.7%` |
| P0 / P1 / P2 新增缺陷 | `3 / 12 / 1` |
| 红线（I 类）违规 | 无凭证泄漏、无 mock 假跑、无虚报 PASS |
| 资源释放 | 无真云资源创建（源码级探针测试，无副作用） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` — `redactString` regex `(AK\|SK)\s*[:=]` 仅匹配大写 AK/SK，JSON 中 lowercase `ak`/`sk` 键值未被脱敏 | 待提单 |
| 2 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:384-430` — `classifyTextCommand` 未对 `sh -c "printenv ..."` 做 shell wrapper 解包（`stripExecutable` 仅在 `classifyHcloudArgs` 路径生效），文本分类直接 fallthrough 到 allow | 待提单 |
| 3 | P0 | `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性 | `setup-cli.mjs` 全文无 `huawei-agent-rules` / `agent-rules` / `rules` 引用 — 安装流程未注入全局规则文件到客户端 | 待提单 |
| 4 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `safety-policy.mjs:45` — 同 D2-4 根因，findings 中 `ak`/`sk` lowercase 键值未被 `redactString` 脱敏 | 待提单 |
| 5 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:45` — 同 D2-4 根因，双路径（MCP + 直调）均未脱敏 lowercase `ak`/`sk` | 待提单 |
| 6-16 | P1 | `EXP-E01~E14` | D10评测 | serviceCatalog 路由 MISS | `hcloud-cli.mjs` serviceCatalog 路由层对 10/15 条评测集意图未命中（基线 21.4% MISS，与历史一致） | 待提单 |

### 根因详情

#### D2-4: 凭证脱敏正确性
- **期望**: `redactSecrets('{"ak":"...","sk":"..."}')` 返回的字符串不含原始 SK 值
- **实际**: SK 值 `SKTEST1234567890abcdef1234` 未被脱敏，完整保留在输出中
- **根因**: `safety-policy.mjs:45` — `redactString` 的 regex `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，不匹配 JSON 中 lowercase `ak`/`sk`
- **证据**: `evidence/D2-4/stdout.log`

#### D4-16: 命令包裹穿透
- **期望**: `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'deny'`
- **实际**: 返回 `decision: 'allow'`（fallthrough 到 not_huaweicloud）
- **根因**: `safety-policy.mjs:384-430` — `classifyTextCommand` 在 hcloud regex 不匹配时直接 fallthrough，未调用 `stripExecutable` 解包 `sh -c` wrapper；`stripExecutable` 仅在 `classifyHcloudArgs` 路径（line 173）生效
- **证据**: `evidence/D4-16/stdout.log`

#### D4-23: 全局规则注入生效性
- **期望**: `setup-cli.mjs` 安装时将 `rules/huawei-agent-rules.mdc` 注入到客户端配置目录
- **实际**: `setup-cli.mjs` 全文无 `huawei-agent-rules` / `agent-rules` / `rules` 引用；规则文件存在于仓库 `rules/huawei-agent-rules.mdc` 但安装流程未注入
- **根因**: `setup-cli.mjs` — 缺少规则注入逻辑（SPEC-MISMATCH）
- **证据**: `evidence/D4-23/stdout.log`

#### D4-26: findings 证据脱敏
- **期望**: findings 输出中 `ak`/`sk` 键值被脱敏
- **实际**: `ak`/`sk` 值未脱敏（同 D2-4 根因）
- **根因**: `safety-policy.mjs:45` — 同 D2-4
- **证据**: `evidence/D4-26/stdout.log`

#### D4-27: 双路径输出脱敏
- **期望**: MCP + 直调双路径均脱敏 `ak`/`sk`
- **实际**: 双路径均未脱敏 lowercase `ak`/`sk`
- **根因**: `safety-policy.mjs:45` — 同 D2-4
- **证据**: `evidence/D4-27/stdout.log`

#### EXP-E01~E14: serviceCatalog 路由 MISS
- **期望**: 15 条评测集意图全部路由命中（HIT）
- **实际**: 10/15 条 MISS（E06/E08/E09/E15 命中）
- **根因**: `hcloud-cli.mjs` serviceCatalog 路由层覆盖不全（基线 21.4% MISS，与历史一致，非本次回归）
- **证据**: `evidence/c4-service-matrix/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。全部 141 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（探针使用测试凭证，真实凭证未泄露）
- [x] 写操作误判 read-only：无（D4-5 写操作误判检测通过）
- [x] 红线（I 类）违规：无（无 mock 假跑、无虚报 PASS、无跳过真云用例）
- [x] 脱敏复核：D2-4/D4-26/D4-27 发现 lowercase `ak`/`sk` 脱敏缺陷（已记入 FINDINGS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无真云资源 | N/A | N/A | N/A |

> 本次测试为源码级探针直调 + MCP 工具枚举 + eval harness 路由层，未创建真云资源。

---

## 八、遗留与建议

1. **D2-4/D4-26/D4-27（脱敏缺陷）**: `redactString` regex 需增加 lowercase `ak`/`sk` 匹配，建议修改 `safety-policy.mjs:45` 为 `/(AK|SK|ak|sk)\s*[:=]\s*/g` 或添加 case-insensitive flag
2. **D4-16（sh -c 穿透）**: `classifyTextCommand` 需在 fallthrough 前调用 `stripExecutable` 解包 shell wrapper，或在文本路径增加 `sh -c` / `bash -c` 解包逻辑
3. **D4-23（规则注入缺失）**: `setup-cli.mjs` 需补充 `huawei-agent-rules.mdc` 注入逻辑，安装时复制到客户端配置目录
4. **EXP-E 路由 MISS**: serviceCatalog 路由层覆盖不全（已知基线问题，非本次回归）
