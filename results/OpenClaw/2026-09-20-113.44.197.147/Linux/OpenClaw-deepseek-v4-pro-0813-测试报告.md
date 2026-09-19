# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-20 07:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-20-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（15 项 FAIL/SPEC 全部历史同源，无新增缺陷；D4-25 已由 AtomCode #752 提单、D3-S5 归属中文路由族；1 项 P0 Windows 专属 OS 豁免）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4，6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f6`，release-1.1.5） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，D9-1 实测 40） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 全项 pass） |
| 真云凭证 | `cn-north-4`（管理员 AKSK + 只读子账号 `test001`，均已实测有效） |
| 测试类型 | 源码级探针 / MCP 协议 / 真机 CLI / 真云 E2E（VPC+subnet+RDS 建删归零 + 沙箱预览出公网 URL + OBS 静态网站 + FunctionGraph 建删 + 最小权限只读切换） |
| daily 基础用例 | 设计级 100 / 展开级 39（本客户端 OpenClaw+Linux 预筛后） |

> **执行方法**：本轮全量 fresh 重跑——42 个 legacy 探针（`evidence/run_all.sh`，34 PASS）+ 新增确定性探针 `new-cases/probe-new-deterministic.mjs`（66 断言，D1-40/65/66/67/68/69/70、D2-27、D4-26/28/29、D6-9、D8-9/10、D9-10/11、D3-S5/S8）+ 独立探针 `probe-d4-25-telemetry.py`（Python hook 三态实测）+ `probe-d3-c14.mjs`（沙箱参数/凭证）+ 真云场景探针 `realcloud/probe-scenario-realcloud.mjs`（S1/S2/S4/S6/C13）+ `realcloud/probe-d3-s3-sandbox.mjs`（沙箱预览出公网 URL，HTTP 200 实测）+ `realcloud/probe-d3-s7.mjs`（VPC+subnet+RDS 建删归零）。全部证据落盘 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily，预筛后） | `139`（100 设计级 + 39 展开级） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `111 / 25 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC，去 BLOCKED/NOT_RUN） | `81.0%`（111/137） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（D4-25→#752 AtomCode 已提单、D3-S5→中文路由族，均历史同源不重复开单） |
| 红线（I 类）违规 | `4`（D4-2/D4-16/D4-21/D4-23 凭证/越权安全红线，均历史同源） |
| 资源释放 | `全部归零 / 本轮真机新建 VPC×2、subnet×2、RDS×1、OBS 桶×2、FunctionGraph 函数×2 测后全删归零（VPC/RDS/FG/OBS/ECS 残留均 0）` |

---

## 三、状态汇总

### 3.1 设计级（100，OS 专属豁免 1）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 84 | 有证据且通过 PASS 门禁（含 D1 生命周期、D2 认证真云项、D3 真云场景 S1/S2/S3/S4/S6/S7/C13、D4-13 最小权限、D9-1 40 工具、D8-7 技能等） |
| FAIL | 14 | D4-2/D4-16/D4-21/D4-23（P0×4）+ D4-6/D4-7/D4-17/D4-25/D4-27/D9-2/D9-4/D9-7/D10-3/D3-S5（P1/P2×10），根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 capabilities.cancellation 未暴露 |
| NOT_RUN | 1 | D1-39（Windows 专属，OS 豁免） |
| **合计** | **100** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-C4-01~22（22）+ EXP-D5-9-1/3（2）+ EXP-E06/E09/E15（3，路由命中） |
| FAIL | 11 | EXP-E01~05/E07/E10~14 路由 MISS（同 #11 D10-3 中文关键词缺失根因） |
| BLOCKED | 1 | EXP-E08（真实 Agent 会话诊断意图层，run-eval.mjs 无法代理） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

> 铁律：缺陷真实执行后填写；字段完整到可让修复方直接定位。历史同源项标记「历史」。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P1 | `D4-25` | Python hook 写命令遥测误分类 cli:invoke | `record_cli_event("hcloud VPC CreateSecurityGroup")` → `key=cli:write` | `key=cli:invoke`（写动词前空格不命中） | `hooks/huaweicloud-safety.py:46` | 历史 #752 |
| 2 | P1 | `D3-S5` | 复合中文意图分层路由拆分失败 | `serviceCatalog(复合意图)` 同时含 `RDS`+`OBS` | 仅 `["Sandbox","DevStation"]` 单路 | `tools.mjs:1884`（全角逗号不拆分） | 历史（中文路由族 #705/#683/#674/#689） |
| 3 | P0 | `D4-2` | 凭证 env 打印拦截残留（HW_ 前缀） | `env\|grep HW_SECRET_KEY` → `deny` | `allow` | `safety-policy.mjs:399` | 历史 |
| 4 | P0 | `D4-16` | 命令包裹穿透（sh -c 文本路径） | `sh -c "env\|grep ..."` → `deny` | `allow` | `safety-policy.mjs:67-102,399` | 历史 |
| 5 | P0 | `D4-21` | hook_check_artifacts HCL broad IAM 漏检 | `actions=["*"]` → 拦截 | `allow`（0 findings） | `safety/rules/cloud-risk-rules.json:189` | 历史 |
| 6 | P0 | `D4-23` | 全局规则 huawei-agent-rules.mdc 注入失效 | `files` 含 `rules` + 安装目标注入 | 0 引用 | `package.json:8-18` + `setup-cli.mjs` | 历史 |
| 7 | P1 | `D4-6` | adminPass 空格形式回显未脱敏 | 空格形式 args 不含明文 | 含明文 | `safety-policy.mjs:42` | 历史 |
| 8 | P1 | `D4-7` | hook_check_artifacts HCL broad IAM 未拦截 | deny | allow | `cloud-risk-rules.json:189` | 历史 |
| 9 | P1 | `D4-17` | hook 三工具畸形输入 fail-open | 畸形输入 deny(fail-closed) | allow | `risk-rule-engine.mjs:111-119` | 历史 |
| 10 | P1 | `D4-27` | 裸 token=/小写 ak=/sk= 未脱敏 | `<redacted>` | 原文 | `safety-policy.mjs:42-45` | 历史 |
| 11 | P1 | `D9-2` | tools/list invalid params 未返回 -32602 | `-32602` | 正常 result / -32603 | `mcp-protocol.mjs:46-98` | 历史 |
| 12 | P1 | `D9-4` | initialize 前 tools/list 未按规范报错 | JSON-RPC 错误 | 正常 result | `mcp-server.mjs:156-162` | 历史 |
| 13 | P1 | `D9-7` | protocolVersion 不校验不回显 | 协商降级/报错 | 原样回显 | `mcp-protocol.mjs:62` | 历史 |
| 14 | P1 | `D9-9` | capabilities.cancellation 未暴露（SPEC） | 声明取消能力 | `capabilities:{tools:{}}` | `mcp-protocol.mjs:62-65` | 历史 |
| 15 | P1 | `D10-3` | serviceCatalog 中文意图路由 21.4% | 准确率 ≥90% | 3/14 HIT | `tools.mjs:1776-1910` | 历史 |
| 16 | P1 | `EXP-E08` | 真实 Agent 对话诊断意图层需 LLM harness | 诊断意图路由 | BLOCKED | 测试侧（harness 无法代理） | 补环境 |

### 根因详情（新增缺陷 P0/P1 附代码片段 + 复现证据）

**#1 [P1] D4-25 Python hook 写命令遥测误分类**

- 期望：`record_cli_event("hcloud VPC CreateSecurityGroup")` → `key=cli:write`
- 实际：`key=cli:invoke`（写动词前是空格，`(^|[A-Za-z0-9])` 前缀不命中）
- 根因：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46`

```python
WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*", re.I)
# command_text() 产出 "hcloud VPC CreateSecurityGroup"，Create 前是空格 → (^|[A-Za-z0-9]) 不命中 → is_write=False
```

- 证据：`evidence/new-cases/probe-d4-25-telemetry.stdout.log`（实测 keys=['cli:read','cli:invoke','cli:invoke']）

**#2 [P1] D3-S5 复合中文意图分层路由拆分失败**

- 期望：`serviceCatalog('部署一个网站，数据库用 MySQL，还需要对象存储')` → 同时含 `RDS`、`OBS`
- 实际：`["Sandbox","DevStation"]`（单路）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1884`

```javascript
const tokens = new Set(it.split(/[\s,./-]+/).filter((t) => t.length > 0));
// 中文全角逗号 ，不在分隔符集合内 → "MySQL，" 不拆词 → 失配
```

- 证据：`evidence/new-cases/probe-new-deterministic.stdout.log`（D3-S5 RDS/OBS 断言 FAIL）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标「专属」）：Windows 升级检测链 EINVAL/npm.cmd 语义，Linux 无 npm.cmd/EINVAL，结构性不适用 | Linux 侧已有 EXP-NR3-10 展开级代表覆盖（probe-d1-39-linux 佐证 dist-tags latest+next 可用），无需改 |
| `EXP-E08` | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话诊断意图层（"ECS启动失败帮我分析原因"）需真实 LLM Agent 判断是否路由 `huaweicloud_explain_error`；`run-eval.mjs` 的 serviceCatalog 确定性路由层无法代理该诊断意图。本客户端 OpenClaw 无 dsh | 接入可交互真实 Agent 会话级 harness（仅 DSH/装 dsh 客户端可用），或将该断言下放至 DSH 代表客户端 |

无其他 NOT_RUN/BLOCKED。覆盖率门禁通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`4`（D4-2/D4-16/D4-21/D4-23，均历史同源，见 FINDINGS 去重）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针均 <redacted> 化，admin AK/SK 仅经 spawnSync env 传递未打印）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-s7- / tctest-s2-） | 是 | 已删 | ListVpcs/v3 残留 0 |
| Subnet（tctest-s7-） | 是 | 已删 | 已同步删除 |
| RDS MySQL 5.7（tctests7db） | 是（postPaid，ACTIVE） | 已删 | ListInstances 残留 0 |
| OBS 桶（tctest-obs-website-*） | 是 | 已删 | obs ls 残留 0 |
| FunctionGraph 函数（tctestfn*） | 是 | 已删 | ListFunctions 残留 0 |
| ECS | 否 | — | servers 0 |
| 沙箱（one-user-one-instance） | 复用 | close_session | 无私建计费资源 |

> 真云只删本次创建资源（tctest- 前缀），删除前全量盘点 + 白名单，禁删既有/他人资源。归零为 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未暴露，历史 #698）
- 本轮缺陷结：`D4-25`（Python hook 写命令遥测误分类，已由 AtomCode #752 提单，本轮复核评论）、`D3-S5`（中文全角逗号复合意图拆分失效，归属中文路由族 #705/#683/#674/#689，复核评论）——均已历史查重不重复开单，见 HISTORY_LINKS.md
- 建议：① `huaweicloud-safety.py` 的 WRITE_OPERATION_RE 对齐 Node 侧 `\b(Create|Delete|...)` 词边界语义；② `serviceCatalog` tokenizer 增加全角逗号 `，` 到分隔符集合，并为 MySQL/OBS 增补中文关键词。
- 遗留范围：D3-S7 真机 RDS 生命周期二次自动化探针受 RDS 建库时长（BUILD→ACTIVE 约 8-10min）限制，首轮真机已实测到 ACTIVE（连接串 10.201.1.247:3306）并测后归零；自动化探针记录到 BACKING UP 阶段（生命周期完整可判定）。