# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-11 05:49:00（北京时间）
> **执行归档**：`results/AtomCode/2026-11-11-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12` |
| 被测版本（SUT） | `v1.1.14-next.2`（npm @next，gitHead `5c9478d3a`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS.length） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真机执行） |
| 测试类型 | 源码级探针（直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数）/ MCP 协议 / 真云 E2E（建删资源） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云用例走 `scripts/realcloud_e2e.mjs` 经 `callTool`/`hcloud` 真机建删资源；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `1 / 8 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/subnet count=0，EIP total_count=0，OBS 桶已删）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | OS 专属用例在非对应 OS（D1-39 Windows 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 miss，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | JSON 字符串形式凭证（小写键 ak/sk/token）不被脱敏，原始 AK/SK/token 完整泄露 | `safety-policy.mjs:34-47` | 待提单 |
| 2 | P1 | `D3-C7` | D3功能 | 跨区域写操作因 IAM token 项目绑定不匹配失败，引导未提前预警 | `tools.mjs` `get_regional_availability`/`plan_cli_command` | 待提单 |
| 3 | P1 | `D3-S1` | D3功能 | serviceCatalog 中文意图含英文服务名路由 miss | `tools.mjs:2548-2552` | 待提单 |
| 4 | P1 | `D3-S2` | D3功能 | serviceCatalog 中文意图含英文服务名路由 miss | `tools.mjs:2548-2552` | 待提单 |
| 5 | P1 | `D3-S3` | D3功能 | serviceCatalog 中文意图含英文服务名路由 miss | `tools.mjs:2548-2552` | 待提单 |
| 6 | P2 | `D3-S5` | D3功能 | serviceCatalog 复合意图分层路由 miss | `tools.mjs:2548-2552` | 待提单 |
| 7 | P2 | `D4-25` | D4安全 | 空格分隔写命令未被分类为 `cli:write` | `hooks/huaweicloud-safety.py:46` | 待提单 |
| 8 | P1 | `D4-27` | D4安全 | 小写 `ak=`/`sk=` 不被脱敏，仅 `token=` 被脱敏 | `safety-policy.mjs:45` | 待提单 |
| 9 | P2 | `D8-9` | D8质量 | `sanitizeValue` 完全不脱敏任何键值 | `telemetry/telemetry.mjs:190-199` | 待提单 |
| 10 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图含英文服务名路由 miss | `tools.mjs:2548-2552` | 待提单 |
| 11 | P1 | `D9-9` | D9协议 | MCP 协议未声明 cancellation/cancel（SPEC-MISMATCH） | `mcp-protocol.mjs` | 待裁决 |
| — | 测试侧 | `D3-C1` | D3功能 | finally 归零轮询未确认 ECS 删除（已人工补删归零） | `scripts/realcloud_e2e.mjs` | 非产品缺陷 |
| — | 测试侧 | `D3-C2` | D3功能 | OBS 建桶断言误判 false（实际成功，已删除归零） | `scripts/realcloud_e2e.mjs` | 非产品缺陷 |

### 根因详情

**#1 [P0] D2-4 凭证脱敏正确性**
- 期望：输入 `{"ak":"AKID123456",...}` 后，输出不得包含 `AKID123456`
- 实际：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 返回原文，三者全未脱敏
- 根因：`safety-policy.mjs:34-47` `redactString()` 仅匹配未加引号键的 `key=value`/`key: value` 形式，且 `(AK|SK)` 正则未加 `i`、仅覆盖大写键名，JSON 引号键 + 小写 `ak`/`sk` 均漏网
- 证据：`evidence/D2-4/stdout.log`

**#2 [P1] D3-C7 跨区域资源操作引导**
- 期望：跨区域写操作前识别 token 项目与目标区域不匹配并引导切换
- 实际：`available=true`、`plan` 带 `--cli-region=ap-southeast-3`，但最小 EIP 创建返回 `VPC.0501`（token 项目 cn-north-4 与目标区域不匹配）
- 根因：`tools.mjs` 仅校验服务级可用性（静态 cache），未校验目标区域 IAM 项目绑定
- 证据：`evidence/D3-C7/stdout.log`

**#3-6,#10 [P1/P2] D3-S1/S2/S3/S5 + EXP-E01 serviceCatalog 中文意图路由 miss**
- 期望：含 ECS/VPC/沙箱等明确服务语义的中文意图应命中对应服务
- 实际：返回 `Run hcloud --help to list available services.`（未命中）
- 根因：`tools.mjs:2548` 分词对「中文+英文无空格」不切分英文 token，:2552 英文关键词仅 `tokens.has(kw)` 全等匹配，叠加关键词覆盖缺口
- 证据：`evidence/D3-S1|S2|S3|S5|EXP-E01/stdout.log`

**#7 [P2] D4-25 Python hook 遥测分类**
- 期望：`hcloud ECS DeleteServers` 应分类为 `cli:write`
- 实际：未命中 `cli:write`，落到 `cli:invoke`
- 根因：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前向边界 `(^|[A-Za-z0-9])` 在空格分隔命令 token 场景未命中
- 证据：`evidence/D4-25/stdout.log`

**#8 [P1] D4-27 双路径输出脱敏**
- 期望：输入含 `ak=AKID456` 后，输出不得包含 `AKID456`
- 实际：`token=<redacted> ak=AKID456 sk=secret789`
- 根因：`safety-policy.mjs:45` `/(AK|SK)\s*[:=]/g` 未加 `i`，小写 `ak=`/`sk=` 不命中
- 证据：`evidence/D4-27/stdout.log`

**#9 [P2] D8-9 遥测值脱敏**
- 期望：`sanitizeValue("AK=ABC123XYZ")` 输出不得包含明文值
- 实际：返回原样 `AK=ABC123XYZ`
- 根因：`telemetry/telemetry.mjs:190-199` `sanitizeValue()` 仅做控制字符清理 + 长度截断，无任何键名脱敏
- 证据：`evidence/D8-9/stdout.log`

**#11 [P1] D9-9 MCP 协议取消语义（SPEC-MISMATCH）**
- 期望：MCP 协议实现声明取消/超时语义
- 实际：`mcp-protocol.mjs` 不包含 `cancellation`/`notifications`/`cancel` 声明
- 根因：`mcp-protocol.mjs` 未实现/未声明 tools/call 超时与取消（契约漂移待裁决）
- 证据：`evidence/D9-9/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属（OS 专属） | OS 列标注「Windows（升级检测链 EINVAL 专属；Linux/macOS 由 NR3 终端矩阵按负面/环境验证）」；Linux 侧由展开级 EXP-NR3 代表覆盖 |

> 说明：D1-39 为 P0 中唯一 OS 专属用例，符合「OS 专属 P0 用例在非对应 OS 标 NOT_RUN」的唯一例外（OS 列已标注「专属」）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（发现 3 项脱敏缺陷 D2-4/D4-27/D8-9，均为产品侧未脱敏，测试证据未写回真实凭证）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针使用伪造值 `AKID123456` 等测试桩）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（`bb0df1f2-eef0-40e6-a4b9-74a6c18ee7ab`） | 已删（人工补删） | `ListServersDetails` count=0 |
| VPC（D3-C1） | 是（`2e607f33`） | 已删 | `ListVpcs` count=0 |
| subnet（D3-C1） | 是（`4b1a5d66`） | 已删 | `ListSubnets` count=0 |
| EIP | 否（本次未创建成功） | — | `ListPublicips` total_count=0 |
| OBS 桶（D3-C2） | 是（`testbot3-hermes-obs-4346594308`） | 已删 | `Delete bucket successfully` |
| 沙箱会话（D3-C3/C6） | 是（ws=71a94ace36） | 已关 | `close_session` PASS |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL。本次所有资源已归零，见 `evidence/D3-C1/zeroing-verify.json`、`evidence/D3-C2/zeroing-verify.json`。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（MCP 协议取消/超时语义声明）
- 本轮未覆盖（说明范围）：`D1-39` Windows 升级检测链 EINVAL 语义（Linux 非对应 OS，由 EXP-NR3 代表覆盖）；多终端矩阵全量（单客户端单机抽样）
- 建议：D2-4/D4-27/D8-9 三项脱敏缺陷为跨版本历史问题（next.1→next.2 复现），建议安全侧统一收口；serviceCatalog 中文意图路由（D3-S1/S2/S3/S5 + EXP-E01）建议分词逻辑对中文+英文无空格混合做子串匹配兜底。