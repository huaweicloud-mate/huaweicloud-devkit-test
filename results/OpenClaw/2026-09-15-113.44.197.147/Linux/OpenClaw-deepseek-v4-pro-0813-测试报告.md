# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-16 01:08`（北京时间，真云补测回填后更新）
> **执行归档**：`results/OpenClaw/2026-09-15-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（8 项 FAIL 均已有同根因历史单；4 项 P0 未修复，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256`，PR #669） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | `cn-north-4`（管理员 AKSK + 只读子账号 `test001` `credentials.readonly.json` 均已下调并实测有效） |
| 测试类型 | 源码级探针 / MCP 协议 / 真机 CLI；真云 E2E（最小资源建删归零 + CTS 审计 + 审批流 + 最小权限）本轮已实测 |
| daily 基础用例 | 设计级 77 / 展开级 17（本客户端 OpenClaw+Linux 预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 / 走真实 mcp-server JSON-RPC，决策与结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily，预筛后） | `94`（77 设计级 + 17 展开级） |
| 已执行 | `94` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `61 / 19 / 14 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC，去 BLOCKED/NOT_RUN） | `76.3%`（61/80） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（8 项 FAIL 均历史同源或已提单，无新增） |
| 红线（I 类）违规 | `4`（D4-2/D4-16/D4-21/D4-23 均为凭证/越权安全红线，历史未修复） |
| 资源释放 | `全部归零 / 本轮真机新建 VPC 安全组(tctest-d3c4-*) 测后删除归零` |

---

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 56 | 有证据且通过 PASS 门禁（补测 D1-41/42/45 源码级直调 + D2-1/D4-13/D4-14 真云实测转 PASS） |
| FAIL | 8 | D4-2/D4-16/D4-21/D4-23/D4-6/D4-7/D9-2/D10-3，根因见缺陷清单 |
| BLOCKED | 13 | 真机生命周期/高风险计费/夹具缺失，均写四要素 blockedReason |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **77** | |

### 3.2 展开级（17）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | EXP-D5-9-1/EXP-D5-9-3 + EXP-E06/E09/E15（路由命中，有证据） |
| FAIL | 11 | EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14（路由 MISS，同 D10-3 根因，E03/E13 补测解阻塞转 FAIL） |
| BLOCKED | 1 | EXP-E08（真实 Agent 会话诊断意图层，run-eval.mjs 无法代理） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **17** | |

---

## 四、缺陷清单

> 本轮 8 项 FAIL（设计级）+ 9 项展开级 FAIL（映射 D10-3）均有明确根因（`文件:行号`）+ 复现证据。经 `file_issue.py` 查重口径逐条核对上游 open issue，**全部命中历史同源单或已提单**，按红线「勿重复拆单」本轮不新开单。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整（HW_ 前缀） | `safety-policy.mjs:336` | 历史 #651/#652/#673/#674/#676/#679/#681 |
| 2 | P0 | D4-16 | 命令包裹穿透（sh -c wrapper） | `safety-policy.mjs:335` | 历史 #651/#652/#674/#676/#681/#682 |
| 3 | P0 | D4-21 | 制品预检未检出 HCL broad IAM | `cloud-risk-rules.json:188-196` | 历史 #651/#652 |
| 4 | P0 | D4-23 | 全局规则 huawei-agent-rules 注入失效 | `package.json:8-18` + `setup-cli.mjs` | 历史 #651/#673/#674/#676/#679 |
| 5 | P1 | D4-6 | adminPass 空格形式回显未脱敏 | `safety-policy.mjs:42` | 历史 #651/#673/#679 |
| 6 | P1 | D4-7 | hook_check_artifacts broad IAM 失效 | `cloud-risk-rules.json:188-196` | 历史 #651/#652 |
| 7 | P1 | D9-2 | JSON-RPC 未知方法 -32601 缺失 | `mcp-server.mjs:169` | 历史 #651/#652/#674/#676/#689 |
| 8 | P1 | D10-3 | 中文意图路由未命中（serviceCatalog 仅英文关键词） | `tools.mjs:1776-1910` | 已提单 #689（Hermes 开出） |

每个缺陷的「现象 + 精确断言 + 证据路径」见同目录 `FINDINGS.md`（严格遵循 file_issue.py 解析格式）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 本轮 NOT_RUN = 0。BLOCKED 共 14 条（设计级 13 + 展开级 1），均写四要素 blockedReason（实测时间 + 缺资源 + 影响 + 解除条件）。补测已将 5 条真云/源码级假阻塞转 PASS/FAIL：D1-41/42/45 源码级直调转 PASS（3 条）、D2-1/D4-13/D4-14 真云实测转 PASS（3 条，新证真：真机建删安全组归零 + CTS 审计 + 只读子账号最小权限）、EXP-E03/E13 确定性路由 MISS 转 FAIL（2 条），仅 EXP-E08（真实 Agent 诊断意图）保留 BLOCKED。

### 设计级（13，均「真·外部依赖」，四要素见 CSV blockedReason 列）

| 用例ID | 优先级 | 缺什么资源 | 解除条件 |
|---|---|---|---|
| D1-1 | P1 | 真机 OpenClaw install --target 生命周期 + 隔离 HOME | 供真机安装态或 install 生命周期夹具 |
| D1-2 | P2 | 多客户端共存环境（detectAgent 目标） | 供多客户端同机环境 |
| D1-3 | P1 | 真机 doctor CLI + 组件缺失场景 | 供真机 doctor 或缺失注入夹具 |
| D1-4 | P2 | 真机 status/update CLI + config 保护 | 供真机 CLI 或 config 快照夹具 |
| D1-5 | P1 | 真机 uninstall + 残留扫描 | 供真机安装态或卸载夹具 |
| D1-6 | P2 | 无 KooCLI 环境（本机已装 7.2.12） | 供无 KooCLI 机器 |
| D4-10 | P2 | 规则库版本快照 + 注入夹具 | 供规则库快照 |
| D4-12 | P2 | npm 供应链攻击仿真夹具 | 供恶意依赖仿真环境 |
| D4-24 | P1 | 真云确认流 + 可注入时钟 | 供真云确认流或时钟夹具 |
| D9-4 | P1 | 长连接断连/重连/关闭时序夹具 | 供长连接时序夹具 |
| D9-6 | P1 | 多客户端同机环境（本机仅 OpenClaw） | 供多客户端环境 |
| D9-7 | P2 | 多版本服务端/客户端夹具 | 供多版本夹具 |
| D9-9 | P1 | 可注入延迟夹具 + capabilities.cancellation | 供挂起工具延迟夹具 |

### 展开级（1，真实 Agent 会话评测层）

| 用例ID | 优先级 | 缺什么资源 | 解除条件 |
|---|---|---|---|
| EXP-E08 | P1 | 真实 Agent 会话 LLM harness（ITER-004+ 待建，run-eval.mjs 无法代理） | 接入可交互真实 Agent 客户端（如 Hermes 会话级 CDP 自动化） |

> 补测说明：EXP-E03（OBS 静态站期望 vs 实际 Sandbox+DevStation）与 EXP-E13（证书/ELB 期望 vs 实际空）经 `run-eval.mjs` + 源码直调 `serviceCatalog` 均得到确定性 MISS，属中文关键词缺失的真实路由缺陷（同 D10-3/#689），已由 BLOCKED 转 FAIL，不再作为「oracle 需维护者裁决」阻塞。EXP-E08 诊断类意图须真实 Agent 会话判断是否路由 `explain_error`，`serviceCatalog` 确定性层无法代理，保留 BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`4`（D4-2/D4-16/D4-21/D4-23，均为凭证 dump / 命令包裹 / broad IAM / 规则注入失效，历史未修复，已跟踪既有 issue）
- [x] 脱敏复核：证据目录无原始凭证 / 未脱敏日志（探针全部使用假凭证 `AK*`/`SK*` 占位）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 VPC 安全组 `tctest-d3c4-*` | 是（2 个，本次最小规格、免费） | 已删 | `ListSecurityGroups` 中 `tctest-d3c4-` 计数=0 |
| 临时 HOME / 隔离目录 | 是（探针内 `/tmp/hdk-*`） | 已删（finally rm） | 无残留 |

> 本轮真云部分仅创建免费 VPC 安全组（最低配置）并测后删除归零；未创建任何计费资源（ECS/RDS/CCE/WAF/OBS 等）。

---

## 八、遗留与建议

- **历史缺陷未修复**：D4-2/D4-16/D4-21/D4-23 四项 P0 安全红线在 v1.1.4 正式版仍未修复（均已有上游 open issue + 部分含修复 PR #688），建议维护者跟进合入，本客户端持续复测。
- **中文路由是重灾区**：D10-3 中文意图准确率仅 21.4%（15 条中 3 条命中），根因 `tools.mjs` routeMap 全部英文关键词，中文用户主场景（ECS/RDS/OBS/费用/监控等）无法路由——这是真实可用性缺口，建议列为高优先级修复。#689 已提单。
- **本轮未覆盖范围**：ECS/RDS/CCE/WAF 等计费/高风险服务的轻量创建释放（成本红线）、多终端矩阵、审批流实时对话框、真机 install/doctor/uninstall 生命周期。这些受成本/环境约束标 BLOCKED（四要素）。
- **本次真云补测新增证据**：`evidence/realcloud/probe-realcloud.mjs`（22 断言全 PASS）实测 D2-1 三端同步、D4-13 最小权限、D4-14 CTS 审计、D3-C4 服务矩阵真机建删归零、D4-18/19/20 审批流。
- **建议**：`serviceCatalog` 增加 CJK（中文）关键词→服务映射；`D2-1` 用例措辞与现行 S1/S2/S3 三端语义对齐。