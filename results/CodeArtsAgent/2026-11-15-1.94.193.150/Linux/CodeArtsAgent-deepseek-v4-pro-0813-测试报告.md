# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-15 05:18:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-15-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` (Ubuntu 24.04.4) |
| Node / npm / Python | `v22.13.0 / 10.9.2 / 3.12.3` |
| 被测版本（SUT） | `1.1.14-next.5`（npm @next，gitHead `4fb59d76`） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS 唯一 47） |
| hcloud / 依赖 | `hcloud`（KooCLI 已配置，真云执行可用） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置 + 只读子账号已下发） |
| 测试类型 | 源码级探针直调 / 真机 CLI（doctor/help）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（init_day 预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand / evaluateCommandRisk / evaluateArtifacts / serviceCatalog 等），决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 用 hcloud 实建实删（VPC/OBS）并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另 1 条 D1-39 为 Windows 专属，Linux 结构性不适用） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 6 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `95.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC 残留 0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety-policy.mjs:249` + `safety/policy.json`（缺 DecryptData） | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | `risk-rule-engine.mjs:150`（HCL 未识别 AdministratorFullAccess） | 待提单 |
| 3 | P1 | `EXP-E01` | 展开级 | serviceCatalog「云主机」未路由 ECS | `tools.mjs:2358-2371`（ECS 别名缺「云主机」） | 待提单 |
| 4 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `risk-rule-engine.mjs:97` + `safety-policy.mjs:34` | 待提单 |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:57`（WRITE_OPERATION_RE） | 待提单 |
| 6 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190`（sanitizeValue） | 待提单 |

### 根因详情

**#1 [P0] D4-3 明文 secret API 拦截不完整**
- 期望：`hcloud kms DecryptData --ciphertext x` → `deny/secret`（与 ShowSecretVersion/GetSecretValue 一致）
- 实际：返回 `allow/unknown_read`；`ShowSecretVersion=deny, GetSecretValue=deny, DecryptData=allow`
- 根因：`safety-policy.mjs:249` `blockedSecretOperations` 比较 + `safety/policy.json` 缺 `DecryptData/DecryptDatakey`；`safety-policy.mjs:599` 文本正则 `/ShowSecretVersion|ShowSecret|GetSecretValue|secret_string|secret_binary/` 亦不含 DecryptData
- 证据：`evidence/D4-3/stdout.log`

**#2 [P0] D4-21 hook_check_artifacts 未拦截 HCL AdministratorFullAccess**
- 期望：HCL `delegated_role { name = "AdministratorFullAccess" }` → `deny`（`hwc-iam-admin-policy`）
- 实际：`decision=warn`，命中无关规则 `hwc-sandbox-missing-ttl`；JSON broad IAM 正确 `deny(hwc-iam-admin-policy)`
- 根因：`risk-rule-engine.mjs:150` HCL 解析未识别 `huaweicloud_identity_agency` 的 `delegated_role/AdministratorFullAccess` 语义
- 证据：`evidence/D4-21/stdout.log`

**#3 [P1] EXP-E01 serviceCatalog「云主机」未路由到 ECS**
- 期望：中文意图含「云主机」→ 命中 `ECS`
- 实际：`recommendedServices=["Run hcloud --help to list available services."]`，MISS
- 根因：`tools.mjs:2358-2371` ECS 别名路由表仅含「弹性云服务器」「云服务器」，缺「云主机」
- 证据：`evidence/EXP-E01/stdout.log`

**#4 [P2] D4-26 findings 证据未脱敏**
- 期望：findings `evidence` 字段经 redactSecrets 脱敏，不含明文 `Secret123`
- 实际：`evidence` 存原始命令，明文 `--admin-pass Secret123` 未脱敏
- 根因：`risk-rule-engine.mjs:97`（`evidence: excerpt(context.text)` 未脱敏）+ `safety-policy.mjs:34` redactString 正则不匹配 `--key value` 空格形态
- 证据：`evidence/D4-26/stdout.log`

**#5 [P2] D4-25 Python hook 遥测把写操作误分类为 cli:invoke**
- 期望：写操作（Create/Delete）→ `cli:write`，只读 → `cli:read`
- 实际：`keys=["cli:read","cli:invoke"]`，缺 `cli:write`
- 根因：`hooks/huaweicloud-safety.py:57` WRITE_OPERATION_RE 前缀 `(^|[A-Za-z0-9])` 无法匹配空格分隔命令，`is_write` 恒 False
- 证据：`evidence/D4-25/stdout.log`

**#6 [P2] D8-9 sanitizeValue 未脱敏敏感值**
- 期望：`sanitizeValue('AK=AKID1234567890 token=abc123')` 移除敏感值
- 实际：返回原文 `AK=AKID1234567890 token=abc123`
- 根因：`telemetry/telemetry.mjs:190` sanitizeValue 仅 trim/换行替换/截断，无敏感值脱敏逻辑
- 证据：`evidence/D8-9/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 该用例为 Windows 专属（升级检测链 EINVAL 语义），本机 Linux 结构性不适用；Linux 侧由 D1-40「镜像 lag 反向提醒防护」覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 凭证脱敏 PASS：show_profile_redacted 无明文 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-5 写命令正确判 write/deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云只用 `hdk-s3-` 前缀临时资源名）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-s3- 前缀） | 是（D3-C1/D3-S2/D4-14/D4-20） | 已删 | `hcloud VPC ListVpcs` 归零核实残留 0 |
| OBS 桶（hdk-s3- 前缀） | 是（D3-C2/D3-C13） | 已删 | `obs rm -f` 删除 |
| 沙箱会话 | 是（D3-C3/D3-S3） | 已 close_session | 会话关闭 |

> 真云只删本次创建资源；现有/他人资源未触动。真云 18 条用例全部 PASS，建删归零。

---

## 八、遗留与建议

- 待裁决 SPEC：`无`
- 本轮未覆盖：`D1-39 Windows 专属升级检测链`（Linux 侧由 D1-40 覆盖）
- 建议：6 项缺陷与昨日（2026-11-14）完全一致，均为同版本 1.1.14-next.5 的既有问题，待上游修复；其中 2 项 P0（D4-3、D4-21）涉及安全基线，建议优先处理。
