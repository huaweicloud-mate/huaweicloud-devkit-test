# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 13:22（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（5 FAIL + 1 SPEC-MISMATCH，均为已知缺陷，与历史单同源）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（官方 npm `latest` 正式版，gitHead `9b67256`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，含新增 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，本轮未使用真云资源） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/install-hcloud）/ MCP 协议 |
| 设计真源 | 设计级 81 / 展开级 71（预筛后 48）/ 追踪表 183 行 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（hdk checkout `9b67256`=release 1.1.4），决策/结果落 `stdout-daily.log`/`stdout-supplement.log`/`stdout-exp.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 81 + 展开级 48（本机预筛后）= **129** |
| 已执行 | 129（无 NOT_RUN / 空列） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 63 / 5 / 60 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 63 / 69 = **91.3%** |
| P0 / P1 / P2 缺陷 | 3 / 3 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级（81）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 57 | 有证据且通过 PASS 门禁 |
| FAIL | 5 | D4-2 / D4-4 / D4-11 / D4-16 / D4-23，根因见缺陷清单 |
| BLOCKED | 18 | 环境阻塞（真云/评测 harness/破坏性/跨客户端），见 §五 |
| SPEC-MISMATCH | 1 | D9-2（JSON-RPC 错误码漂移） |
| NOT_RUN | 0 | — |
| **合计** | **81** | |

### 3.2 展开级（48）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 6 | EXP-D5-8-1 / D5-8-3 / NR3-02 / NR3-04 / NR3-10 / NR3-24 |
| FAIL | 0 | — |
| BLOCKED | 42 | 真云 22 服务 / 15 评测集 / 5 隔离 HOME 矩阵 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **48** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 全部经真实执行后填写，字段完整到可让修复方直接定位。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_` 前缀未拦截 | `safety-policy.mjs:335-336` | P | 待提单 |
| 2 | P0 | D4-16 | 命令包裹穿透 | `sh -c 'hcloud ecs DeleteServers ...'` 应返回 `deny` | 返回 `allow`，内层写命令未拦截 | `safety-policy.mjs:345` | P | 待提单 |
| 3 | P0 | D4-23 | 全局规则未注入 | 安装后 `rules/huawei-agent-rules.mdc` 应存在 | `package.json` files 不含 `rules`，安装后缺失 | `package.json:8` | P | 待提单 |
| 4 | P1 | D4-4 | 写操作审批门漏词 | `ChangeServerOsWithoutCloudInit` 应返回 `deny` | 返回 `allow`，`Change*` 前缀未覆盖 | `safety/policy.json:27` | P | 待提单 |
| 5 | P1 | D4-11 | 提示注入防护绕过 | 自然语言夹带 hcloud 写命令应 `deny` | 返回 `allow`，写语义丢失 | `safety-policy.mjs:76` | I | 待提单 |
| 6 | P1 | D9-2 | JSON-RPC 错误码不规范 | 未知方法错误码应为 `-32601` | 返回 `-32603` | `mcp-server.mjs:169` | P | 待提单 |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`printenv HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336`
  `classifyTextCommand()` 的 env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 真实凭证前缀

```javascript
/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
/HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)   // ← 缺 HW_ 前缀
```

- 证据：`evidence/D4-2/stdout.log`，实测 `printenv HW_ACCESS_KEY` → `allow`

**#4 [P1] D4-4 写操作审批门漏词**

- 期望：`ChangeServerOsWithoutCloudInit` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes` 32 项缺 `Change` 前缀
- 证据：`evidence/D4-4/stdout.log`（`missed=["Change"]`，`leak=[ChangeServerOsWithoutCloudInit, ChangeServerChargeMode, ChangeVpc]`）

> **去重结论**：上述 6 项与 1.1.4-next/1.1.4 阶段历史缺陷同源（上游单号由 `file_issue.py` 查重确定，预计命中 #671/#679/#681/#682/#651/#652），本轮不重复拆单。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 本轮 **NOT_RUN=0**。以下为 BLOCKED 用例（建包已剔除不适用客户端/OS 的展开级），全部已回填 blockedReason。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-C4 / EXP-C4-01~22 | 设计/展开 | P1 | BLOCKED | 补环境 | 需真云 22 服务建删资源（红线最低配置+归零） |
| D4-14 | 设计 | P2 | BLOCKED | 补环境 | 操作可审计性需真云 CTS 审计日志 |
| EXP-E01~15 / D10-1/2/3/5 | 设计/展开 | P1 | BLOCKED | 补环境 | 评测集需评测 harness + 模型预算 |
| D6-1/3/4 | 设计 | P1/P2 | BLOCKED | 补环境 | 性能采样需专用 harness |
| D9-6 | 设计 | P1 | BLOCKED | 补环境 | 跨客户端互通需多 MCP 客户端终端 |
| D1-1 / D1-2 / D1-5 / EXP-D1-58-01~05 | 设计/展开 | P1/P2 | BLOCKED | 补环境 | 破坏性/隔离（卸载/全新安装/隔离 HOME 需专机） |
| D1-45 | 设计 | P1 | BLOCKED | 补环境 | 预热竞态需冷启时序观测（Linux 兜底已由 EXP-NR3-24 覆盖） |
| D4-12 | 设计 | P2 | BLOCKED | 补环境 | 供应链安装期审计需发布流水线上下文 |
| D7-4 | 设计 | P2 | BLOCKED | 补环境 | 国内镜像源安装需镜像网络可达 |
| D8-1 | 设计 | P2 | BLOCKED | 补环境 | 文档全文一致性人工核对（本轮抽查 D8-4/D8-6） |
| D9-9 | 设计 | P1 | BLOCKED | 补环境 | 超时取消语义需注入长耗时服务 |

> 均为「补环境」类（环境/凭证/配额/依赖缺失），**无需改用例**。

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

> 真云只删本次创建资源；本轮未创建任何真云资源，下载安装的 hcloud 为客户端工具非云资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-2`（JSON-RPC 错误码 -32603 vs -32601）
- 本轮未覆盖（说明范围）：`真云 E2E（D3-C4/EXP-C4-*/D4-14）、多终端/跨客户端矩阵（D9-6）、评测集（EXP-E*/D10-*）、性能采样（D6-*）`
- 建议：
  1. `test-cases 母版 D5-3/D9-1/EXP-D5-8-3 计数「39」需更新为「40」`（1.1.4 新增 `huaweicloud_obs_set_website_config`，非产品缺陷）；
  2. `本机私有 npm registry（127.0.0.1:45998）latest 版本滞后，建议 prepare_env --update 增加 --registry https://registry.npmjs.org 兜底`。