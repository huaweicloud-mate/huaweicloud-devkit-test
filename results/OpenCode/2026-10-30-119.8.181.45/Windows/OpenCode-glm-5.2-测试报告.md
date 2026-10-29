# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-30 05:10:24（北京时间）
> **执行归档**：`results/OpenCode/2026-10-30-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.13-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（classifyTextCommand/judgeUpdate/redactSecrets 等）+ MCP 真机（mcpToolCall 调 list_operations/plan_cli_command/service_catalog 等）+ CLI 命令（spawnSync npx huaweicloud-devkit doctor/status/plugins/help/auth）+ eval harness（run-eval.mjs）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 无真云资源创建/销毁（本次无真云 E2E 用例执行） |

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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` — `(AK\|SK)` 正则无 `i` 标志，小写 `ak=/sk=` 未脱敏 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `cloud-risk-rules.json:56` — `hwc-command-secret-value-read` 规则未包含 `DecryptData` | 待提单 |
| 3 | P1 | `EXP-E01` | D10评测 | service_catalog 路由 | `tools.mjs:2200-2212` — ECS keywords 缺少 `云主机` 同义词 | 待提单 |

### 根因详情

#### D2-4: 凭证脱敏正确性
- **期望**: `redactSecrets('config: ak=TESTAK... sk=TESTSK...')` 返回值不含 TESTAK/TESTSK
- **实际**: AK 和 SK 明文泄露（akLeak=true, skLeak=true）
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:45` — `.replace(/(AK|SK)\s*[:=]\s*.../g, ...)` 正则仅匹配大写 `AK`/`SK`（无 `i` 标志）；第42行规则匹配 `access_key`/`secret_key` 等完整词但不匹配裸 `ak`/`sk`
- **证据**: `evidence/D2-4/stdout.log`

#### D4-3: 明文secret API拦截
- **期望**: `classifyTextCommand('hcloud KMS DecryptData ...')` 返回 `deny` 或 `warn`
- **实际**: 返回 `decision=allow`（未拦截）
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:56` — `hwc-command-secret-value-read` 规则 regex 仅匹配 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue`，未包含 `DecryptData`；DEW skill 文档明确标注 KMS DecryptData 为 BLOCKED 但规则引擎未实现
- **证据**: `evidence/D4-3/stdout.log`

#### EXP-E01: service_catalog 路由
- **期望**: `recommendedServices` 包含 `'ECS'`
- **实际**: 返回 `['Run hcloud --help to list available services.']`（路由 MISS）
- **根因**: `plugins/huaweicloud-core/src/tools.mjs:2200-2212` — ECS 路由 keywords 含 `弹性云服务器`/`云服务器`/`服务器`/`虚拟机` 但缺 `云主机`；prompt "帮我查一下我账号在华北北京四有哪些云主机" 使用"云主机"未命中
- **证据**: `evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | AGENT_TOOLKIT_MODE=local is DSH-client-specific |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit requires DevStation upstream |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox requires DevStation upstream |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox requires DevStation upstream |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：D2-4 发现 lowercase `ak=` 脱敏遗漏（P0 缺陷，已记 FINDINGS）
- [x] 写操作误判 read-only：D4-5 PASS — DeleteServer 判 deny，无误判 allow
- [x] 红线（I 类）违规：0 项
- [x] 脱敏复核：D4-26/D4-27 PASS — findings/双路径脱敏无泄露；D9-13 PASS — tools/call 响应无 AK/SK 明文

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无真云资源 | N/A | N/A | N/A |

> 本次测试为源码级直调 + MCP 工具调用 + CLI 命令 + eval harness，未执行真云建删资源 E2E 用例。BLOCKED 用例（D3-C3/C14/S3/S7 沙箱类）依赖 DevStation 上游连接，OpenCode 客户端不具备沙箱能力。

---

## 八、遗留与建议

- 3 项缺陷已统一合入 FINDINGS.md，将通过 file_issue.py 向源码仓库 huaweicloud/huaweicloud-devkit 提交 1 个合并 issue。
- D2-4 修复建议：safety-policy.mjs:45 正则添加 `i` 标志。
- D4-3 修复建议：cloud-risk-rules.json `hwc-command-secret-value-read` 规则添加 `DecryptData` 匹配。
- EXP-E01 修复建议：tools.mjs ECS 路由 keywords 添加 `云主机`。
- 5 项 BLOCKED 均为真·外部依赖（DSH 专属 1 项 + 沙箱 DevStation 上游 4 项），非假阻塞。
