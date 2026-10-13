# OfficeAce-glm-5.2 每日测试报告
> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-10-09 09:00:00（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-09-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.13.4` |
| 被测版本（SUT） | `1.1.8-next.1`（gitHead: ffd7b474） |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 15 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 140） | `89.3%` |
| P0 / P1 / P2 新增缺陷 | `1 / 12 / 2` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞（D3-S3 沙箱需 MCP 上下文） |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，服务路由 MISS（同根因） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `tools.mjs:1147` hook 未拆解 shell 包裹 | 待提单 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `hcloud-cli.mjs:776-777` 短键名 ak/sk 未脱敏 | 待提单 |
| 3 | P1 | `EXP-E01~E14` | D10评测 | serviceCatalog 中文路由 MISS（11 条） | `tools.mjs:2191` CJK 分词器不切分中拉边界 | 待提单 |
| 4 | P2 | `D1-66` | D1安装 | sanitizeValue 未清除换行/制表符 | `telemetry.mjs` sanitizeValue 缺少 \n/\t 替换 | 待提单 |
| 5 | P2 | `D1-69` | D1安装 | --version 输出版本号匹配未命中 | `cli.mjs` 版本检测正则与输出格式不匹配 | 待提单 |

### 根因详情

**#1 [P0] D4-16 命令包裹穿透**
- 期望：hook_check_command 对 `sh -c "hcloud ECS DeleteServers ..."` 返回 decision=deny
- 实际：返回 decision=allow，未检测内层命令
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1147` — hook_check_command 调用 evaluateCommandRisk（risk-rule-engine.mjs:143），仅对原始命令字符串做正则规则匹配，从未调用 classifyTextCommand/extractInnerCommand（shell 包裹拆解逻辑所在）
- 证据：`evidence/D4-16/stdout.log`

**#2 [P1] D4-27 双路径输出脱敏不完整**
- 期望：redactSecrets/redactOutput 将 ak/sk/token 明文替换为占位符
- 实际：{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1...} 凭证仍为明文
- 根因：`plugins/huaweicloud-core/src/hcloud-cli.mjs:776-777` — JSON 路径仅脱敏 isSecretKeyName 能识别的键名，safety-policy.mjs:20 正则不匹配短键名 ak/sk
- 证据：`evidence/D4-27/stdout.log`

**#3 [P1] EXP-E01~E14 serviceCatalog 路由未命中中文意图（11 条同根因）**
- 期望：serviceCatalog("创建ECS") 返回 recommendedServices 含 ECS
- 实际：返回 MISS（"Run hcloud --help to list available services."）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2191` — 分词器 split(/[\s,./-]+/) 不在 CJK 与拉丁字符间切分。"创建ECS" → "创建ecs" 成为一个 token，tokens.has('ecs') → false
- 证据：`evidence/EXP-E01/stdout.log`（代表），其余 EXP-E02~E05/E07/E10~E14 同源

**#4 [P2] D1-66 sanitizeValue 未清除换行/制表符**
- 期望：sanitizeValue("hello\nworld\ttab") 返回 "hello world tab"
- 实际：返回 "hello/nworld/ttab"（\n 和 \t 未替换为空格）
- 根因：`plugins/huaweicloud-core/src/telemetry.mjs` sanitizeValue 函数 — 截断逻辑正常但未对 \n/\t 做替换
- 证据：`evidence/D1-66/stdout.log`（pass=6 fail=1）

**#5 [P2] D1-69 --version 输出版本号匹配未命中**
- 期望：--version 输出含可识别版本号，检测返回 true
- 实际：stdout 输出 "HuaweiCloud DevKit CLI: 1.1.8-next.1" 但检测返回 undefined
- 根因：`plugins/huaweicloud-core/src/cli.mjs` --version 输出格式与检测正则不匹配
- 证据：`evidence/D1-69/stdout.log`（pass=10 fail=1）

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | Sandbox code path verified (skill + tools + session-manager + API module all present), but cannot execute real sandbox check-user/connect without MCP server context. Unblock condition: run probe through MCP server with valid sandbox service quota. | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS | 否 | 不适用 | 无资源创建，无需清理 |

> 本轮测试以源码级探针为主，未创建真云资源。

---

## 八、遗留与建议

- **P0 缺陷 D4-16（命令包裹穿透）**：最高优先级修复，hook_check_command 需集成 shell 包裹拆解逻辑
- **P1 缺陷 D4-27（脱敏不完整）**：redactOutput 需扩展 isSecretKeyName 正则覆盖短键名 ak/sk/token
- **P1 缺陷 EXP-E01~E14（中文路由 MISS）**：分词器需在 CJK 与拉丁字符边界插入分隔，影响所有中文意图路由
- **BLOCKED D3-S3**：需 MCP server 上下文 + 沙箱配额才能执行，非产品缺陷
- 建议：D4-16 和 D4-27 为已知缺陷（昨日 FINDINGS 同源），file_issue.py 提单时历史查重应命中既有 issue