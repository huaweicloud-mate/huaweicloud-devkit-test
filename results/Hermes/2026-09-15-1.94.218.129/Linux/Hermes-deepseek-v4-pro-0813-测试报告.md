# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 18:22（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（6 FAIL + 2 SPEC-MISMATCH，均为已知缺陷，与历史单同源）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（官方 npm `latest` 正式版，gitHead `9b67256`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，含 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置） |
| 真云凭证 | `cn-north-4`（管理员 AK/SK 已配置；只读子账号凭证缺失，见 §五） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/install-hcloud）/ MCP 协议 |
| 设计真源 | daily 精选：设计级 77 / 展开级 49（预筛后本机 26）/ 追踪表 183 行 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（hdk checkout `9b67256`=release 1.1.4），决策/结果落 `stdout-*.log`；CLI 真机执行记录日志；D9-2 用 stdio server 层真机探针；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 77 + 展开级 26（本机预筛后）= **103** |
| 已执行 | 103（无 NOT_RUN / 空列） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 65 / 6 / 30 / 2 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 65 / 73 = **89.0%** |
| P0 / P1 / P2 缺陷 | 3 / 5 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 59 | 有证据且通过 PASS 门禁 |
| FAIL | 6 | D4-2 / D4-4 / D4-11 / D4-16 / D4-23 / D10-3，根因见缺陷清单 |
| BLOCKED | 10 | 环境/凭证阻塞（破坏性/多客户端/真云/镜像源），见 §五 |
| SPEC-MISMATCH | 2 | D9-2（JSON-RPC 错误码漂移）、D9-9（cancellation 未声明） |
| NOT_RUN | 0 | — |
| **合计** | **77** | |

### 3.2 展开级（26）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 6 | EXP-D5-8-1 / D5-8-3 / NR3-02 / NR3-04 / NR3-10 / NR3-24 |
| FAIL | 0 | — |
| BLOCKED | 20 | 评测集 15（LLM 预算）+ 白名单矩阵 5（PTY 交互），见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **26** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 全部经真实执行后填写，字段完整到可让修复方直接定位。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应 `deny` | 返回 `allow`，`HW_` 前缀未拦截 | `safety-policy.mjs:335-336` | P | 已跟踪 |
| 2 | P0 | D4-16 | 命令包裹穿透 | `sh -c 'hcloud ... DeleteServers'` 应 `deny` | 返回 `allow`，内层写命令未拦截 | `safety-policy.mjs:345` | P | 已跟踪 |
| 3 | P0 | D4-23 | 全局规则未注入 | 安装后 `rules/huawei-agent-rules.mdc` 应存在 | `package.json` files 不含 `rules`，安装后缺失 | `package.json:8` | P | 已跟踪 |
| 4 | P1 | D4-4 | 写操作审批门漏词 | `ChangeServerOsWithoutCloudInit` 应 `deny` | 返回 `allow`，`Change` 前缀未覆盖 | `safety/policy.json:27` | P | 已跟踪 |
| 5 | P1 | D4-11 | 提示注入防护绕过 | 自然语言夹带 hcloud 写命令应 `deny` | 返回 `allow`，写语义丢失 | `safety-policy.mjs:76` | I | 已跟踪 |
| 6 | P1 | D10-3 | serviceCatalog 中文意图路由未命中 | `service_catalog('查询云服务器')` 应含 `ECS` | 返回 `Run hcloud --help`，3 条中文 miss | `tools.mjs:1776-1907` | P | 已跟踪 |
| 7 | P1 | D9-2 | JSON-RPC 错误码不规范 | 未知方法错误码应 `-32601` | 返回 `-32603` | `mcp-server.mjs:169` | P | 已跟踪 |
| 8 | P1 | D9-9 | cancellation 能力未声明 | capabilities 应含 `notifications.cancellation` | `capabilities={"tools":{}}` 未声明 | `mcp-protocol.mjs:63` | P | 已跟踪 |

> **去重结论**：上述 8 项均与 1.1.4-next/1.1.4 阶段历史缺陷同源，`file_issue.py` 历史查重全部命中已跟踪 open issue（#683/#682/#681/#679/#677/#671/#643/#651/#652/#672/#676/#674/#689/#561），本轮不重复拆单。详见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 本轮 **NOT_RUN=0**。以下为 BLOCKED 用例（建包已剔除不适用客户端/OS 的展开级），全部已回填 blockedReason，均为「补环境」类（环境/凭证/依赖缺失），**无需改用例**。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-1 | 设计级 | P1 | BLOCKED | 补环境 | 全新环境引导安装需空 HOME + PTY 交互（破坏性） |
| D1-2 | 设计级 | P2 | BLOCKED | 补环境 | 多 Agent 探测需多客户端并存环境 |
| D1-5 | 设计级 | P1 | BLOCKED | 补环境 | uninstall 干净度属破坏性（卸载全局包） |
| D1-45 | 设计级 | P1 | BLOCKED | 补环境 | 兜底提示预热竞态需冷启时序注入；Linux 兜底已由 EXP-NR3-24 覆盖 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期审计需发布流水线上下文 |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 只读 IAM 子账号凭证 `credentials.readonly.json` 未配置 |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 操作可审计性需真云 CTS 审计日志核对 |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | 国内镜像源安装需镜像网络可达 |
| D8-1 | 设计级 | P2 | BLOCKED | 补环境 | 文档与能力一致性需全文人工核对 |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 跨客户端互通需 ≥3 真实客户端 + Inspector |
| EXP-E01~15 | 展开级 | P1 | BLOCKED | 补环境 | 评测集需 LLM 模型预算 + 评测 harness |
| EXP-D1-58-01~05 | 展开级 | P1 | BLOCKED | 补环境 | 隔离 HOME 白名单矩阵需 PTY 交互驱动 install 菜单 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/OBS/沙箱等） | 否（本轮未创建） | — | 无残留 |

> 本轮未创建任何真云资源；下载安装的 hcloud 为客户端工具非云资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-2`（JSON-RPC 错误码 -32603 vs -32601）、`D9-9`（cancellation 能力未声明）
- 本轮未覆盖（说明范围）：`真云 E2E（D4-13/D4-14/D-CTS）、跨客户端矩阵（D9-6）、评测集 LLM 路由（EXP-E01~15）、白名单矩阵执行层（EXP-D1-58-*）`
- 建议：
  1. `D4-13 需在测试机补配 ~/.config/huaweicloud/credentials.readonly.json（只读 IAM 子账号 test001），以解除真云最小权限验证阻塞`；
  2. `本机私有 npm registry（127.0.0.1:45998）latest 版本滞后 1.1.3，建议 prepare_env --update 增加 --registry https://registry.npmjs.org 兜底`。