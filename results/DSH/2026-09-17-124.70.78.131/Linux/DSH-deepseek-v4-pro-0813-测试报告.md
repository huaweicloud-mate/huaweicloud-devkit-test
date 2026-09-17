# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-17 07:10（北京时间）
> **执行归档**：`results/DSH/2026-09-17-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）`v1.1.5`（npm latest，gitHead `e7ed6f66e`）
> **结论**：`FAIL`（设计级 9 FAIL + 1 SPEC-MISMATCH + 6 BLOCKED + 1 NOT_RUN；SUT 未变，与 2026-09-16 一致，10 项缺陷均为历史已提单，无新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64（机器 IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 11.19.0 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66e`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI）/ doctor 确认已配置 |
| 真云凭证 | cn-north-4（AK/SK 管理员 hw018619646 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 78 / 展开级 39（已按客户端+OS 预筛）/ 追踪表 183 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 直调全局包 `/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/`，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 最低配置创建→归零；证据统一落 `evidence/<case-id>/`。本轮为 2026-09-17 强制完整重跑（未借「昨天已跑」跳过），对 25 个探针 + D10 评测 harness 全部重新执行并落盘新证据。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 78 + 展开级 39 = 117 |
| 已执行（PASS+FAIL+SPEC） | 设计级 71 + 展开级 39 = 110 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 设计级 `61 / 9 / 6 / 1 / 1`；展开级 `27 / 12 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 设计级 `85.9%`（61/71）；展开级 `69.2%`（27/39） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（本轮 10 项缺陷均为历史已提单/已知，v1.1.5 无新增） |
| D10 评测集路由准确率 | `21.4%`（HIT=3 / MISS=11 / N/A=1，分母 HIT+MISS=14，与基线一致） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（真云 E2E 创建 VPC/SG 均已删除，tctest-dsh- 残留 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 61 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | D2-4 / D4-3 / D4-15 / D4-16 / D4-17 / D4-23 / D10-3 / D4-13 / D8-1 |
| BLOCKED | 6 | D1-5 / D4-12 / D4-24 / D7-4 / D9-6 / D10-4 |
| SPEC-MISMATCH | 1 | D9-9（tools/call 超时/取消协议契约漂移） |
| NOT_RUN | 1 | D1-39（Windows 专属，本机 Linux） |
| **合计** | **78** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-D5-6-1/3 + EXP-C4-01~22 + EXP-E06/E09/E15 |
| FAIL | 12 | EXP-E01~E05/E07/E08/E10~E14（中文意图路由 miss） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽）

> 10 项为 v1.1.5 仍存缺陷（9 FAIL + 1 SPEC-MISMATCH），复审确认与 2026-09-16 一致；**v1.1.5 无新增缺陷**。历史查重后均命中既有单，不重复提单。根因详见 `FINDINGS.md`（含文件:行号）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | ak=/sk= → `<redacted>` | 返回原文未脱敏 | safety-policy.mjs:45 |
| 2 | P0 | D4-3 | 明文 secret API 拦截漏 kms DecryptData | DecryptData → deny | allow/unknown_read | safety-policy.mjs:432 |
| 3 | P0 | D4-15 | hook 命令替换绕过（$(...)） | 命令替换 → deny | allow | risk-rule-engine.mjs:50-53 |
| 4 | P0 | D4-16 | shell 包裹穿透（部分修复） | bash -c "hcloud..." → deny | bash -c 仍 allow（&& 已拦） | safety-policy.mjs:428 |
| 5 | P1 | D4-17 | hook 畸形输入 fail-open | 畸形输入 → deny | allow | risk-rule-engine.mjs:106 |
| 6 | P0 | D4-23 | 全局规则 huawei-agent-rules 未注入 | install 后含规则文件 | found=0 未注入 | package.json:8 |
| 7 | P1 | D10-3 | serviceCatalog 中文意图路由 miss | 中文意图 → ECS 等 | 11/14 miss（准确率 21.4%） | tools.mjs:1776-1907 |
| 8 | P1 | D4-13 | 最小权限动态切换失效 | 只读 env → test001 | 仍解析为管理员 | credentials.mjs:152-160 |
| 9 | P2 | D8-1 | 文档 39 vs 实现 40 漂移 | 文档=40 | 文档仍 39 | hdk/AGENTS.md:27,45 |
| 10 | P1 | D9-9 | tools/call 超时/取消契约漂移 | -32000 timeout + cancellation | 缺失（SPEC-MISMATCH） | mcp-protocol.mjs:63-65 / mcp-server.mjs:169 |

### 根因详情（代表性）

- **#4 [P0] D4-16**：v1.1.5 在 `classifyHcloudArgs` 新增 `stripExecutable`/`findHcloudCommandSegments`（`safety-policy.mjs:68-90/150-170`），修复了 `sh -c "... && hcloud ..."`；但 `classifyTextCommand` 入口正则 `safety-policy.mjs:428` `/(^|\s)hcloud(\.exe)?\s+/i` 不匹配引号包裹的 `bash -c "hcloud ..."`，故仍 `allow/not_huaweicloud`。证据：`evidence/security/stdout.log`。
- **#8 [P1] D4-13**：`credentials.mjs:152-160` R9 `stored.configuredBySession === true` 时直接以管理员覆盖只读 env 注入。证据：`evidence/D4-13/stdout.log`（`切换生效 false`）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议（分类=改用例 时必填） |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（升级检测链 EINVAL 仅 Windows 可复现）；本机 Linux，Linux 侧由 NR3 展开级代表覆盖 | — |
| D1-5 | 设计级 | P1 | BLOCKED | 补环境 | 本机共享环境已装多客户端，真实全局 uninstall 会破坏其他 agent 环境 | — |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 缺 SBOM 产出工具链（cyclonedx/syft） | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 缺可注入时钟夹具加速 approval token TTL，CI 契约 CONFIRM_TOKEN_EXPIRED/already_processed 无法 E2E | — |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | 缺国内可达华为云 npm 镜像源 registry | — |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 缺 MCP Inspector + ≥3 真实客户端 | — |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 缺真实 Agent 会话评测 LLM harness（行为层，run-eval.mjs 只能代理 serviceCatalog 路由层） | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据仅含 ak 前缀掩码/指纹，无明文 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 真云资源：最低配置创建 → 测后删除归零，只操作 `tctest-dsh-*` 前缀，未触碰他人资源
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（S1/S3 仅 `HPUA****` 等掩码 + sha 指纹）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-dsh-*） | 3（D3-C4/D4-14/D4-18） | 3 | ListVpcs 过滤 tctest-dsh- 计数 0 |
| 安全组（tctest-dsh-*） | 1（D4-19） | 1（含 0.0.0.0/0:22 规则） | ListSecurityGroups 计数 0 |
| ECS/RDS 等计费实例 | 0 | 0 | 未创建任何计费实例 |

> 真云只删本次创建资源（仅操作 `tctest-dsh-*` 前缀），删除前盘点 + 白名单，禁删既有/他人资源。测试结束后重新盘点 VPC/SG/ECS 残留均为 0。

---

## 八、遗留与建议

- **v1.1.5 结论稳定**：本轮强制重跑在 SUT 未变前提下复现 2026-09-16 全部结论（61 PASS / 9 FAIL / 6 BLOCKED / 1 NOT_RUN / 1 SPEC，展开级 27 PASS / 12 FAIL），无新增缺陷。
- **仍存缺陷（10 项，详见 FINDINGS.md）**：D2-4/D4-3/D4-15/D4-16/D4-23（P0 安全类，优先修复）+ D4-17/D4-13/D10-3/D8-1/D9-9(SPEC)。均已历史提单，本轮只补 `HISTORY_LINKS.md` 关联，不重复开单。
- **D1-39 Windows EINVAL**：仍存 v1.1.5 源码（`update-check.mjs` `NPM_BIN='npm.cmd'` 无 `shell:true`），本机 Linux 无法复现，按 OS 专属标 NOT_RUN。
- **D10-3 中文路由**：`eval/harness/run-eval.mjs` 实测准确率仍 21.4%（HIT=3/MISS=11/N/A=1），建议在 `serviceCatalog` 增加中文意图关键词映射。
- 建议：`safety-policy.mjs:428` 入口正则与 `classifyHcloudArgs` 的解包逻辑统一在 `classifyTextCommand` 层先做 shell 包裹解包（`bash/sh/sudo -c`），使 D4-16 完全闭环。