# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-19 05:18`（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-19-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（13 项 FAIL/SPEC 均历史同源，无新增缺陷；1 项 P0 Windows 专属 OS 豁免）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f6`，release-1.1.5） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，D9-1 实测 `40`） |
| hcloud / 依赖 | hcloud 7.x（doctor 全项 pass=11 fail=0） |
| 真云凭证 | `cn-north-4`（管理员 AKSK + 只读子账号 `test001`，均已实测有效） |
| 测试类型 | 源码级探针 / MCP 协议 / 真机 CLI / 真云 E2E（最小资源建删归零 + CTS 审计 + 审批流 + 最小权限） |
| daily 基础用例 | 设计级 80 / 展开级 39（本客户端 OpenClaw+Linux 预筛后） |

> **执行方法**：本轮「强制完整重跑」——重新执行全部 40 个探针 + 2 个新增用例专项探针（D9-6/9-9 跨客户端、D4-13 只读切换），直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 走真实 mcp-server JSON-RPC 协议 + 真机 CLI + 真云 E2E，证据全新落盘 `evidence/<case-id>/`。探针入口脚本 `evidence/run_all.sh`（本轮 40 探针，34 PASS/6 FAIL）+ `evidence/d9-protocol/probe-d9-6-9-crossclient.mjs`（D9-6 PASS / D9-9 SPEC）+ `evidence/realcloud/probe-d4-13-switch.mjs`（只读切换 PASS）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily，预筛后） | `119`（80 设计级 + 39 展开级） |
| 已执行 | `119` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `93 / 23 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC，去 BLOCKED/NOT_RUN） | `79.5%`（93/117） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（13 项 FAIL/SPEC 全部历史同源，见 FINDINGS.md 去重结论） |
| 红线（I 类）违规 | `3`（D4-2/D4-16/D4-21 凭证/越权安全红线，均历史同源） |
| 资源释放 | `全部归零 / 本轮真机新建 VPC 安全组(tctest-d3c4-*) 测后删除归零` |

---

## 三、状态汇总

### 3.1 设计级（80，OS 专属豁免 1）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 66 | 有证据且通过 PASS 门禁（含 D1-1/3/4/5 真机 CLI 生命周期、D4-13 最小权限、D4-24 令牌边界、D4-10/12 源码级直调、D2-26 备份/恢复、D9-1 40 工具 schema、D9-5/6 协议） |
| FAIL | 12 | D4-2/D4-16/D4-21/D4-23/D9-2（P0×5）+ D4-6/D4-7/D4-17/D4-27/D9-4/D10-3（P1×6）+ D9-7（P2×1），根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 capabilities.cancellation 未暴露 |
| NOT_RUN | 1 | D1-39（Windows 专属，OS 豁免） |
| **合计** | **80** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-C4-01~22（22）+ EXP-D5-9-1/3（2）+ EXP-E06/E09/E15（3，路由命中） |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14（11，路由 MISS，同 D10-3 根因） |
| BLOCKED | 1 | EXP-E08（真实 Agent 会话诊断意图层，harness 无法代理） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（13 项，全部历史同源）

> 本轮 13 项 FAIL/SPEC 根因逐条与上游 open issue 核对，**全部命中历史同源单，不重复提单**。详见 `FINDINGS.md` 与 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 历史源 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截残留 | `env\|grep HW_SECRET_KEY`→deny | allow | safety-policy.mjs:399 | #651/#652 等 |
| 2 | P0 | D4-16 | 命令包裹穿透残留 | `sh -c "env\|grep..."`→deny | allow | safety-policy.mjs:67-102 | #651/#652 等 |
| 3 | P0 | D4-21 | hook_check_artifacts 未拦截 HCL broad IAM | HCL `actions=["*"]`→deny | allow | cloud-risk-rules.json:189 | #651/#652 |
| 4 | P0 | D4-23 | 全局规则注入失效 | files 白名单含 rules、安装注入 | 未注入 | package.json:8-18 | #651/#673 等 |
| 5 | P0 | D9-2 | JSON-RPC 错误码残留 | tools/list 非法参数→-32602 | 正常 result | mcp-protocol.mjs:46-98 | #704/#643/#672 |
| 6 | P1 | D4-6 | adminPass 空格形式回显未脱敏 | `--adminPass X` 不回显明文 | 回显明文 | safety-policy.mjs:42 | #712/#651 等 |
| 7 | P1 | D4-7 | hook_check_artifacts broad IAM 未拦截 | HCL broad IAM→deny | allow | cloud-risk-rules.json:189 | #651/#652 |
| 8 | P1 | D4-17 | hook 三工具畸形输入 fail-open | 畸形输入→fail-closed | allow | risk-rule-engine.mjs:111-119 | #564/#689 |
| 9 | P1 | D4-27 | 双路径脱敏缺裸 token/小写 ak=sk= | `token=`/`ak=`→脱敏 | 不脱敏 | safety-policy.mjs:42,45 | #726/#683 |
| 10 | P1 | D9-4 | 协议生命周期 initialize 前未拒 | initialize 前→错误 | 正常 result | mcp-server.mjs:156-162 | #699 |
| 11 | P1 | D10-3 | 中文意图路由未命中 | 中文准确率≥90% | 21.4% | tools.mjs:1776-1910 | #705/#706/#714 |
| 12 | P1 | D9-9 | capabilities.cancellation 未暴露（SPEC） | 声明 cancellation | 未声明 | mcp-protocol.mjs:62-65 | #698 |
| 13 | P2 | D9-7 | 协议版本协商降级缺失 | 未来版本→协商/报错 | 原样回显 | mcp-protocol.mjs:62 | #702 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」）：Windows 升级检测链 EINVAL/npm.cmd 专属语义，Linux 无 npm.cmd/EINVAL。Linux 侧检测链已由源码级 queryDistTagsSync 探针佐证（evidence/d1-upgrade/probe-d1-39-linux.stdout.log：dist-tags 含 latest+next） | 归属列 OS 已标注「专属」，Linux 侧由展开级 EXP-NR3-10 代表覆盖，无需改 |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | 真实 Agent 会话诊断意图层（"ECS 启动失败帮我分析原因"）需真实 LLM Agent 判断是否路由 huaweicloud_explain_error；run-eval.mjs 的 serviceCatalog 确定性路由层无法代理该诊断意图 | 需接入可交互真实 Agent 会话级 harness（ITER-004+ 待建） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK，仅 `<redacted>`/掩码）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`3`（D4-2/D4-16/D4-21，均历史同源，非本轮新增）
- [x] 脱敏复核：证据 stdout.log 未含明文凭证；realcloud 探针输出均为脱敏断言

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组 (tctest-d3c4-*) | 是（本轮真机） | 已删 | 计数归零（探针实测剩余=0） |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未暴露，历史 #698）
- 本轮未覆盖（说明范围）：真实 Agent 会话级诊断路由层（EXP-E08，见 §五）
- 建议：13 项缺陷均为 v1.1.5 历史同源残留，建议维护方推动「中文意图路由 + 全局规则注入 + 脱敏关键字补齐」三项高价值批量修复。