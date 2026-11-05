# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-06 06:05（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-06-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项，均为历史延续）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64（Ubuntu 24.04.4）` |
| Node / npm / Python | `Node v22.13.0 / npm / Python 3.12.3` |
| 被测版本（SUT） | `1.1.13`（npm latest 正式版，gitHead `8a6d8be2`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| 真云凭证 | `cn-north-4（AKSK 真机 + 只读子账号 test001）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / harness / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 / 使命 9 |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 hcloud CLI + MCP server 协议探针 + 真云 AK/SK 建删归零；结果落 `evidence/<case-id>/stdout.log`，回填三份 CSV（设计级/展开级）+ 使命 CSV + 追踪表。SUT 由 1.1.13-next.5（4ab34ed2）升级至正式 1.1.13（8a6d8be2，18 文件变更，沙箱 session-manager/tools.mjs 增强）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 13 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（13 FAIL 全为历史延续） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC/ECS/子网/SG/EIP/OBS/FG/RDS 建删均已核实）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 今日真云环境恢复，昨日 8 项 BLOCKED 全部转 PASS |
| SPEC-MISMATCH | `3` | 契约漂移（D1-65/D1-68/D9-9） |
| NOT_RUN | `1` | OS 专属（D1-39 Windows 专属在 Linux 标 NOT_RUN） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> 13 FAIL + 3 SPEC-MISMATCH 全部为历史延续（相对 next.5 fresh 复现，无新增产品缺陷），故不重复提单，关联历史单见 HISTORY_LINKS.md。缺陷详尽根因见 FINDINGS.md（#1~#16）。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | 明文 secret API 拦截 | `safety/policy.json:26` blockedSecretOperations 缺 DecryptData/DecryptDatakey | 历史 |
| 2 | P0 | `D4-15` | hook 绕过尝试（ANSI-C 引号命令替换） | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C 编码内层 | 历史 |
| 3 | P0 | `D4-21` | hook_check_artifacts HCL broad IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON | 历史 |
| 4 | P0 | `D9-12` | initialize 握手非法时序未拒 | `mcp-protocol.mjs:57` dispatch 无 initialize 前置校验 | 历史 |
| 5 | P1 | `D1-70` | 代理 WebSocket 路径崩溃（undici） | `package.json` engines >=22 + undici ^8.12.3（需 >=22.19） | 历史 |
| 6 | P1 | `D4-17` | hook 模糊 fail-closed 缺口 | `risk-rule-engine.mjs` 无 finding 即 allow | 历史 |
| 7 | P1 | `D4-27` | 双路径输出脱敏空格形态泄露 | `safety-policy.mjs:34` redactString 仅匹配 key[:=]value | 历史 |
| 8 | P2 | `D3-S5` | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog 单关键词并集无拆分 | 历史 |
| 9 | P2 | `D4-25` | Python hook 事件遥测分类错误 | `huaweicloud-safety.py` WRITE_OPERATION_RE 前置不匹配空格 | 历史 |
| 10 | P2 | `D4-26` | findings 证据脱敏不完整 | `risk-rule-engine.mjs:19` redactEvidence 键值正则 | 历史 |
| 11 | P2 | `D8-1` | 文档与能力一致（工具数 43/39 vs 46） | `AGENTS.md` 未随 tools.mjs 同步 | 历史 |
| 12 | P2 | `D8-9` | 安装 ID 遥测值未脱敏 | `telemetry.mjs` sanitizeValue 无敏感值脱敏 | 历史 |
| 13 | P1 | `EXP-E01` | 中文意图『云主机』路由 MISS | `tools.mjs` ECS keywords 缺『云主机』同义词 | 历史 |
| 14 | P2 | `D1-65` | 调试模式环境变量契约漂移（telemetry '1'） | `telemetry.mjs:82` 仅 === 'true' | SPEC |
| 15 | P2 | `D1-68` | 区域环境变量优先级漂移 | `credentials.mjs` HW_REGION 优先于 HUAWEICLOUD_REGION | SPEC |
| 16 | P1 | `D9-9` | capabilities.cancellation 未声明 | `mcp-protocol.mjs` initialize 未声明 cancellation | SPEC |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属用例在非对应 OS，Linux 侧由 D1-40 覆盖 |

### BLOCKED

无（今日真云环境恢复，昨日 8 项 BLOCKED 全部转为真机 PASS）。

---

## 六、安全与红线合规

- 凭证泄漏事件：`无（D2-4/D4-6/D4-13 均按凭证脱敏口径执行；D4-27/D4-26/D8-9 脱敏缺口已记历史缺陷）`
- 写操作误判 read-only：`无（D4-5/D4-29 误判检测均 deny/write 非只读）`
- 红线（I 类）违规：`0`
- 脱敏复核：`通过（show_profile_redacted 走脱敏管道；真云探针输出已 redact AK/SK）`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14/D3-S2/D3-C1/D3-S7） | 是（tctest-/openclaw 前缀，最低规格） | 是（DeleteVpc） | 是（ListVpcs 最终 0 个 openclaw/tctest 残留） |
| ECS（D3-C1） | 是（CreateServers serverIds 返回 + ACTIVE） | 是（DeleteServers） | 是（ListServersDetails 0 残留） |
| 子网（D3-C1/D3-S7） | 是 | 是（DeleteSubnet，RDS 删除后子网自动回收） | 是（0 残留） |
| 安全组（D3-S7） | 是 | 是（RDS 删除后 SG 自动回收） | 是（0 残留） |
| EIP（D3-C7） | 是 | 是（ReleasePublicip） | 是（cn-north-4 / ap-southeast-3 均 0） |
| OBS 桶（D3-C2/C13） | 是 | 是（obs rm 先删对象后删桶） | 是（0 残留） |
| FunctionGraph（D3-S6） | 是 | 是（DeleteFunction） | 是（0 残留） |
| RDS（D3-S7） | 是（BUILD→ACTIVE） | 是（DeleteInstance） | 是（0 残留） |

> 真云建删归零核实：全部真云用例（D3-C1/C2/C3/C4/C6/C7/C13/C14/S1/S2/S3/S4/S6/S7、D4-13/14/18/19/20、D2-1）本机真机执行并建删归零，最终 VPC/ECS/子网/SG/EIP/OBS/FG/RDS 全 0 残留。D3-C1 finally 归零断言因 VPC 异步最终一致竞态曾标 false，已人工二次 DeleteVpc 后复核归零成立。

---

## 八、遗留与建议

- **SPEC-MISMATCH 3 项待维护者裁决**：D1-65（telemetry 域 '1' 不生效）、D1-68（HW_REGION 优先级）、D9-9（capabilities 未声明 cancellation）——均为版本文档契约与实现漂移，根因已定位（FINDINGS.md #14/#15/#16）。
- **13 FAIL 全部历史延续**（fresh 复现，无新增产品缺陷），不重复提单，关联见 HISTORY_LINKS.md。
- **环境变化说明**：今日真云账号恢复写权限（沙箱维护结束、OBS/FG/RDS 可建删），昨日 8 项 BLOCKED 全部转为真机 PASS，覆盖面显著提升。
- **执行过程中的环境插曲**：D1-70 探针（new-config-probe）崩溃于 clearProxyConfig 之前，残留假 proxy.json 污染首轮真云探针；已备份移除 proxy.json 后按序重跑，全部真云归零。