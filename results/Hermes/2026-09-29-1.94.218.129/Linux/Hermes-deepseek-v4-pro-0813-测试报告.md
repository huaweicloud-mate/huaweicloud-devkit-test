# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-29 05:35（北京时间）
> **执行归档**：`results/Hermes/2026-09-29-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 阻断项 5 个，均命中历史跟踪单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux (aarch64) |
| Node / npm | Node v22.13.0 / npm 10.9.2 |
| 被测版本（SUT） | v1.1.7（npm latest，gitHead `7456d05`，PR #813） |
| daily 基础用例 | 设计级 102 / 展开级 43（预筛后）/ 追踪表 211 行 |

> **执行方法**：源码级探针（grouped probe .mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，如 `classifyHcloudArgs`/`classifyTextCommand`/`redactSecrets`/`judgeUpdate`）；补强探针（Change* 写动词 / R2-R3 顺序 / Py-Node hook 决策 / 提示注入 / fail-closed / 确认令牌契约）；真机 CLI（install/doctor/help/status）；MCP 协议层（`eval/harness/protocol-probe.mjs`）；D10 中文意图路由（`eval/harness/run-eval.mjs`）；真云 E2E（建删归零：VPC/OBS/FunctionGraph/领券/只读子账号）。证据统一落 `evidence/<case-id>/`（含补强探针展开 per-case `stdout.log`）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 145（设计级 102 + 展开级 43） |
| 已执行 | 142 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 109 / 28 / 1 / 4 / 3 |
| 通过率（分母 = PASS+FAIL+SPEC） | 77.3%（109/141） |
| P0 / P1 / P2 缺陷 | 5 / 15（含 EXP-E 11 条中文路由 MISS）/ 5 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云建删全部归零（VPC/OBS/FunctionGraph 删除后 List 不含本次 id）；隔离 HOME 已清理 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 78 | 有证据且通过 PASS 门禁 |
| FAIL | 17 | 不符预期，根因见缺陷清单 |
| BLOCKED | 1 | D3-S3（沙箱 HDKIT_NOT_AGREEMENT） |
| SPEC-MISMATCH | 4 | D1-68、D4-24、D8-9、D9-9 |
| NOT_RUN | 2 | D1-39（OS 专属）、D3-S7（真云 RDS 计费窗口） |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 有证据 |
| FAIL | 11 | EXP-E01~E14 中文意图路由 MISS 11 条 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP-E08（需真实 Agent 会话诊断行为） |
| **合计** | **43** | |

---

## 四、缺陷清单

> 全部缺陷实测复现、根因定位到文件:行号；经 `file_issue.py` 历史查重，均命中已跟踪上游 open issue，本轮**未重复开单**（关联见 HISTORY_LINKS.md）。

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏缺小写 ak=/sk= | safety-policy.mjs:45 正则无 /i | 历史 |
| 2 | P0 | D2-11 | R2 冲突门先于 R3 STS 拒绝 | tools.mjs:1226-1250 | 历史 |
| 3 | P0 | D4-5 | Change* 写动词误判只读 | policy.json:27 缺 Change | 历史 |
| 4 | P0 | D4-16 | 命令包裹/shell 穿透写拦截 | safety-policy.mjs:428 | 历史 |
| 5 | P0 | D4-23 | 全局规则 huawei-agent-rules.md 未注入 | setup-cli.mjs | 历史 |
| 6 | P1 | D1-70 | no_proxy CIDR 网段未匹配 | proxy-config.mjs:42-47 | 历史 |
| 7 | P1 | D3-S1 | 中文「查云主机」未命中 ECS | routeMap 英文-only | 历史 |
| 8 | P1 | D4-4 | 审批门 Change* 漏拦截 | policy.json:27 缺 Change | 历史 |
| 9 | P1 | D4-8 | Python/Node 钩子策略不一致 | huaweicloud-safety.py:46 | 历史 |
| 10 | P1 | D4-11 | 提示注入夹带写命令未拦截 | safety-policy.mjs 前导匹配 | 历史 |
| 11 | P1 | D4-17 | 畸形输入 fail-open | hooks try/catch 静默放行 | 历史 |
| 12 | P1 | D4-27 | 双路径输出脱敏缺口 | safety-policy.mjs:42-45 | 历史 |
| 13 | P1 | D9-2 | tools/list 非法参数无 -32602 | mcp-protocol.mjs:57-59 | 历史 |
| 14 | P1 | D9-9 | capabilities.cancellation 未声明(SPEC) | mcp-protocol.mjs:47-49 | 历史 |
| 15 | P1 | D10-3/EXP-E | 中文意图路由准确率 21.4% | routeMap 英文-only | 历史 |
| 16 | P1 | D4-24 | 确认令牌 JSON 契约未实现(SPEC) | tools.mjs:1258-1260 | 历史 |
| 17 | P2 | D3-S5 | 复合中文意图未拆分 | routeMap 英文-only | 历史 |
| 18 | P2 | D4-25 | Python hook 写遥测落 cli:invoke | huaweicloud-safety.py | 历史 |
| 19 | P2 | D4-26 | findings 证据明文泄漏 | risk-rule-engine.mjs:97 | 历史 |
| 20 | P2 | D8-9 | sanitizeValue 未脱敏(SPEC) | telemetry.mjs:189 | 历史 |
| 21 | P2 | D1-68 | HW_REGION 优先级(SPEC) | credentials.mjs:133 | 历史 |

### 根因详情（本轮 fresh 复现的关键 P0）

**#1 [P0] D2-4 凭证脱敏缺小写 ak=/sk=**
- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` → `<redacted>`
- 实际：返回原文不脱敏；大写 `AK=`/`SK=` 正常脱敏（grouped d2-auth `redact-json` 断言失败）
- 根因：`safety-policy.mjs:45` 正则大小写敏感无 `/i`
- 证据：`evidence/d2-auth/stdout.log`

**#3 [P0] D4-5 Change* 写动词误判只读**
- 期望：`hcloud ecs ChangeServerOsWithoutCloudInit` → `deny`/risk=write
- 实际：`decision=allow risk=unknown_read`（4/4 误判，`evidence/D4-5/stdout.log` 补强探针）
- 根因：`policy.json:27` writeOperationPrefixes 缺 `Change`
- 证据：`evidence/D4-5/stdout.log`

**#2 [P0] D2-11 R2 冲突门先于 R3 STS**
- 期望：带 securityToken 的 persist 立即 R3 rejected
- 实际：`R2 冲突门(conflict 判定)先于 persistCredentials(R3)`（源码定位 1226 < 1250）
- 根因：`tools.mjs:1226-1250`
- 证据：`evidence/D2-11/stdout.log`

**#5 [P0] D4-23 全局规则未注入**
- 期望：`install --target hermes` 后隔离 HOME 含 `huawei-agent-rules.md`（rules/ 目录）
- 实际：安装产物无 `rules/` 目录、无该文件（`evidence/D4-23/stdout.log` 两断言 FAIL）
- 根因：`setup-cli.mjs` 安装仅复制 skills/commands/src/safety/hooks，未复制 `rules/`
- 证据：`evidence/D4-23/stdout.log`

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义（OS 列标「专属」），本机 Linux；由展开级 EXP-NR3-10 代表覆盖 | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 `huaweicloud_sandbox_connect` 返回 `HDKIT_NOT_AGREEMENT：用户未签署最新版协议，签署需用户本人确认`（人工操作无法自动化） | 解除条件：用户签署 HDKit 协议后复测 |
| D3-S7 | 设计级 | P1 | NOT_RUN | 补环境 | 真云跨服务交付(Web+RDS)需建 RDS 实例（10~20min + 按需计费），每日档位无法完成建删归零闭环 | 评估改标真云独立补测轮或缩短建删路径 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断意图需真实 Agent 会话行为（源码级 routeMap 无「诊断」映射，harness 判 N/A） | 建议改源码级断言或标注需 LLM harness |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 Change* 为产品侧缺陷，非测试误判）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK/未脱敏日志（真云仅记录 VPC/bucket/函数 urn 等指纹）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C4 hdk-c4-probe / D3-S2 hdk-s2-probe） | 是 | 已删 | ListVpcs 无本次 id |
| OBS（testbot3-hermes-c4 / -c13） | 是 | 已删 | Delete bucket 成功 |
| FunctionGraph（hdk1-s6-* 函数+TIMER 触发器） | 是 | 已删 | ListFunctions 不含本次 URN |
| 只读子账号（D4-13 test001） | 否 | — | 只读（无新建资源） |

> 本轮 daily 真云建删全部归零；只删本次创建资源（已核对前缀 hdk-/testbot3-hermes-）。沙箱（D3-S3）因协议未签署未进入建删流程。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（HW_REGION 优先级）、`D8-9`（sanitizeValue 脱敏）、`D9-9`（capabilities.cancellation）、`D4-24`（确认令牌 JSON 契约）。
- 本轮未覆盖：`D3-S7`（真云 RDS 计费窗口）、`D3-S3`（沙箱协议签署）、`EXP-E08`（真实 Agent 诊断行为）。
- 建议（同源可合并批修）：① 脱敏同源（D2-4/D4-26/D4-27/D8-9）补 `/i` 并覆盖输出/证据/遥测路径；② 写动词同源（D4-4/D4-5）`policy.json` 补 `Change`；③ 绕过同源（D4-11/D4-16/D4-17）钩子全链解包 + fail-closed；④ 中文路由同源（D10-3/D3-S1/D3-S5/EXP-E）routeMap 补中文映射；⑤ R2-R3 顺序（D2-11）STS 检查前置；⑥ 规则注入（D4-23）setup-cli 补 rules/。
- 另注：`D8-4` 源码 INSTALL.md 存在（引导步骤可机械执行，判 PASS），但 npm 包未随发 INSTALL.md，属轻微打包缺口，建议随包发布。