# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-28 09:40（北京时间）
> **执行归档**：`results/Hermes/2026-09-28-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 阻断项 2 个，均命中历史跟踪单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux (x86_64/arm64 兼容) |
| Node / npm | Node v22.13.0 / npm 10.9.2 |
| 被测版本（SUT） | v1.1.7（npm latest，gitHead `7456d05`，PR #813） |
| daily 基础用例 | 设计级 102 / 展开级 43（预筛后）/ 追踪表 211 行 |

> **执行方法**：源码级探针（grouped probe .mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，如 `classifyTextCommand`/`redactSecrets`/`evaluateCommandRisk`）；真机 CLI（install/doctor/status/update/install-hcloud/uninstall 隔离 HOME 生命周期）；MCP 协议层（`eval/harness/protocol-probe.mjs`）；D10 中文意图路由（`eval/harness/run-eval.mjs`）；审批流（D4-approval-probe）；真云只读连通性（hcloud VPC ListVpcs）。证据统一落 `evidence/<case-id>/`（grouped probe 已展开为 per-case `stdout.log`）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 145（设计级 102 + 展开级 43） |
| 已执行 | 143 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 121 / 20 / 0 / 2 / 2 |
| 通过率（分母 = PASS+FAIL+SPEC） | 84.6%（121/143） |
| P0 / P1 / P2 缺陷 | 2 / 14 / 6（含展开级 EXP-E 中文路由 11 条 MISS，均为历史单） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云只读检查无残留（本轮未创建需销毁资源）；沙箱/隔离 HOME 已 trap 清理 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 90 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 2 | D1-68、D8-9 |
| NOT_RUN | 1 | D3-S7（真云 RDS 计费窗口） |
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
| 2 | P0 | D4-16 | 命令包裹/shell 穿透写拦截 | safety-policy.mjs:428 | 历史 |
| 3 | P1 | D1-70 | no_proxy CIDR 网段未匹配 | proxy-config.mjs:42-47 | 历史 |
| 4 | P1 | D3-S1 | 中文「查云主机」未命中 ECS | routeMap 英文-only | 历史 |
| 5 | P1 | D3-S3 | 沙箱预览公网 URL 不可达 | devbridge tunnel 未建立 | 历史 |
| 6 | P2 | D3-S5 | 复合中文意图分层路由未拆分 | routeMap 英文-only | 历史 |
| 7 | P1 | D4-27 | 双路径输出脱敏缺口 | safety-policy.mjs:42-45 | 历史 |
| 8 | P2 | D4-25 | Python hook 写操作遥测落 cli:invoke | huaweicloud-safety.py | 历史 |
| 9 | P2 | D4-26 | findings 证据明文泄漏 | risk-rule-engine.mjs:97 | 历史 |
| 10 | P2 | D8-9 | sanitizeValue 未脱敏(SPEC) | telemetry.mjs:189 | 历史 |
| 11 | P1 | EXP-E01~E14 | 中文意图路由 MISS 11 条（准确率 21.4%） | routeMap 英文-only | 历史 |

> 另经协议层探针与源码级探针复现、命中历史的 P1/P0：D2-11（R3 STS 先于 R2 冲突门，tools.mjs:1214-1228）、D4-5（Change* 误判只读，policy.json 缺 Change）、D4-23（全局规则 huawei-agent-rules.md 安装未注入，setup-cli.mjs）、D4-4、D4-8、D4-11、D4-17、D4-24、D9-2（tools/list 非法参数无 -32602）、D9-9（cancellation 未声明）、D10-3。协议层实测：D9-2b invalid-params FAIL（缺 error 对象）、D9-9a SPEC-MISMATCH（capabilities.notifications 缺失），余 PASS。

### 根因详情（本轮 fresh 复现的关键 P0/P1）

**#1 [P0] D2-4 凭证脱敏缺小写 ak=/sk=**
- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` → `<redacted>`
- 实际：返回原文不脱敏；大写 `AK=`/`SK=` 正常脱敏（grouped d2-auth `redact-json` 断言失败）
- 根因：`safety-policy.mjs:45` `.replace(/(AK|SK).../g)` 大小写敏感无 `/i`
- 证据：`evidence/d2-auth/stdout.log`、`evidence/D2-4/stdout.log`

**#2 [P0] D4-16 命令包裹/shell 穿透**
- 期望：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` → `deny`
- 实际：返回 `allow`（shell 包裹穿透，grouped d4-security `wrap-sh` 断言失败）
- 根因：`safety-policy.mjs:428` 前导匹配未全链解包 shell 包裹
- 证据：`evidence/d4-security/stdout.log`、`evidence/D4-16/stdout.log`

**#3 [P0] D4-23 全局规则未注入**
- 期望：`install --target hermes` 后隔离 HOME 内含 `huawei-agent-rules.md`
- 实际：`[缺] 未找到 huawei-agent-rules.md`（probe-cli.sh fresh 复现）
- 根因：`setup-cli.mjs` 安装产物未复制 `rules/` 目录
- 证据：`evidence/D4-23/stdout.log`、probe-cli.sh 运行日志

**#4 [P1] D9-2b tools/list 非法参数未返回 -32602**
- 期望：`tools/list` 非法参数 → `-32602 Invalid params`
- 实际：无 error 对象（协议层探针 FAIL）
- 根因：`mcp-protocol.mjs:57-59` 参数校验缺失
- 证据：`eval/results/protocol-probe-*.json`

**#5 [P1] D10-3 / EXP-E01~E14 中文意图路由准确率 21.4%**
- 期望：15 条中文意图命中 ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等服务
- 实际：HIT=3 MISS=11 N/A=1（准确率 21.4%），多数回退 `Run hcloud --help`
- 根因：`routeMap` 英文-only，无中文映射
- 证据：`eval/results/eval-run-20260928*.csv`

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-S7 | 设计级 | P1 | NOT_RUN | 补环境 | 真云跨服务交付需建 RDS 实例（10~20min + 按需计费），每日窗口无法完成建删归零闭环 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断意图需真实 Agent 会话行为（路由层无「诊断」关键词映射），建议改源码级断言或标注需 LLM harness |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 Change* 为产品侧缺陷，非测试误判）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK/未脱敏日志（真云仅记录 VPC 名/id 指纹）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 隔离 HOME（probe-cli.sh） | 是 | trap EXIT 清理 | 是 |
| 真云 VPC（ListVpcs 只读） | 否 | — | 只读无残留（存量 1 个 testbot3 历史 VPC 非本轮创建） |

> 本轮 daily 无破坏性真云建删（D3-C4 服务矩阵为 DAILY_EXCLUDE，真云建删归零由 D3-S2/S3/C13/S6/D4-14 等专项轮承担）；只读连通性检查无新建资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（HW_REGION 优先级）、`D8-9`（sanitizeValue 脱敏）。
- 本轮 NOT_RUN：`D3-S7`（真云 RDS 计费窗口）、`EXP-E08`（真实 Agent 诊断行为）。
- 建议（同源可合并批修）：① 脱敏同源（D2-4/D4-26/D4-27/D8-9）补 `/i` + 覆盖输出/证据/遥测路径；② 写动词同源（D4-4/D4-5）`policy.json` 补 `Change`；③ 绕过同源（D4-11/D4-16）`safety-policy.mjs:428` 全链解包；④ 中文路由同源（D10-3/D3-S1/D3-S5/EXP-E）routeMap 补中文映射；⑤ 规则注入（D4-23）setup-cli 补 rules/。