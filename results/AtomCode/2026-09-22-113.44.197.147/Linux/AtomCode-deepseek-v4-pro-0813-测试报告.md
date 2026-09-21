# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-22 05:08（北京时间）
> **执行归档**：`results/AtomCode/2026-09-22-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 4 个 P0 缺陷，与 v1.1.5 上一测次一并复现，v1.1.6-next.0 未修复）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0003，IP 113.44.197.147） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.6-next.0（npm @next，gitHead `faaefb8f`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 11 pass 0 warn 0 fail |
| 真云凭证 | cn-north-4（管理员 AK/SK + 只读子账号 test001，均已实测） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 100 / 展开级 39（预筛后）/ 追踪表 211 行 |

> **执行方法**：探针脚本（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数并真机执行，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 最低配置创建→测后删除归零；证据统一落 `evidence/<case-id>/`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计 100 + 展开 39） |
| 已执行 | 139（无未执行） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 109 / 25 / 3 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 109 / 135 = **80.7%** |
| P0 / P1 / P2 新增缺陷 | 4 / 8 / 3（另 SPEC-MISMATCH 1） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云安全组测后删除，计数=0） |

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 81 | 有证据且通过 PASS 门禁 |
| FAIL | 14 | P0×4 / P1×7 / P2×3，根因见 FINDINGS |
| BLOCKED | 3 | D3-S7（多服务编排需 agent 会话）/ D9-6（Inspector+多客户端）/ D1-67（DSH 破坏性安装） |
| SPEC-MISMATCH | 1 | D9-9（capabilities.cancellation 未声明） |
| NOT_RUN | 1 | D1-39（Windows 专属，Linux 结构化不适用） |
| **合计** | **100** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | EXP-C4×22 + EXP-D5-10×2 + EXP-E06/08/09/15 |
| FAIL | 11 | EXP-E01/02/03/04/05/07/10/11/12/13/14（D10-3 路由 MISS，同一根因） |
| **合计** | **39** | |

## 四、缺陷清单

共 **15** 项（见 `FINDINGS.md`，含文件:行号根因）：

| 级别 | 数量 | 概要 |
|---|---|---|
| P0 | 4 | D4-2 凭证 env 漏拦 · D4-16 命令包裹穿透 · D4-21 broad IAM 未检出 · D4-23 全局规则注入链路缺失 |
| P1 | 7 | D4-6 adminPass 空格形式未脱敏 · D4-7 artifacts broad IAM 未拦截 · D4-27 文本裸 token/小写 ak/sk 未脱敏 · D3-S8 排障路由缺失 · D9-2 JSON-RPC 错误码 · D9-4 生命周期未强制 · D10-3 路由准确率 21.4% |
| P2 | 3 | D4-25 Python hook write 分类 · D8-9 sanitizeValue 未脱敏 · D9-7 版本协商缺失 |
| SPEC | 1 | D9-9 超时/取消能力缺失 |

> 本测次 SUT 为 v1.1.6-next.0（gitHead `faaefb8f`），较上一测次（2026-09-21，v1.1.5 `e7ed6f6`）版本号前进一档；`e7ed6f6..faaefb8f` 源码差异仅涉 6 个文件（mcp-protocol/risk-rule-engine/setup-cli/tools/update-check/officeace-paths），**15 项缺陷全部稳定复现，无一条被修复**。P0 缺陷集中在**安全拦截/制品预检/规则注入**三处（safety-policy、risk-rule-engine、package setup），为高危漏洞面；D10-3 路由准确率 21.4% 与设计断言 ≥90% 差距巨大，为核心功能缺陷。

## 五、未执行用例与原因（含 BLOCKED）

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计 | P0 | NOT_RUN | 【调归属】 | Windows 专属（npm.cmd/EINVAL 升级检测链），Linux 结构化不适用 | Linux 侧由源码级 queryDistTagsSync 探针佐证（dist-tags 含 latest+next） |
| D3-S7 | 设计 | P1 | BLOCKED | 【补环境】 | 跨服务多资源编排（建 RDS→沙箱部署→连接串注入→读写验证→归零）需真实 agent 会话自动化；本客户端无 dsh/CDP harness | 非 DSH 客户端需 CDP 会话自动化，或降级为 source-level 编排断言 |
| D9-6 | 设计 | P1 | BLOCKED | 【补环境】 | 需官方 MCP Inspector 校验 + ≥2 客户端互通冒烟环境 | 接入 Inspector 集成 + 多客户端会话环境（单机已测 10/10 clientInfo 互通，缺真实多客户端会话） |
| D1-67 | 设计 | P2 | BLOCKED | 【补环境】 | 需真实 DSH 插件安装/跳过验证（破坏性全局安装，run-only 不执行） | 提供非破坏性的 env 注入断言接口 |

## 六、安全 / 红线

- 真云 E2E 均已真机执行：D4-13（只读子账号 test001 write 被拒/read 可用，run-as-readonly 切换生效）、D3-C4（安全组 Create→CTS 审计→Delete→归零计数=0）、D4-14（操作可审计）、D2-1（三端就绪 + ECS/OBS 真云 API 可用）、D2-11（STS token 拒绝落盘）、D2-16（import 读后擦除）。
- 本机无残留计费资源：安全组 `tctest-d3c4-*` 测后删除归零。
- 仅提交本客户端 `results/AtomCode/` 目录，未碰 Summary/其他客户端/test-cases 母版。
- 探针临时文件（hook-events.jsonl、proxy.json 等）随测试清理/隔离。

## 七、资源释放

- 真云创建的资源（安全组 `tctest-d3c4-*`）均已测后删除，`ListSecurityGroups` 计数归零。
- Python hook 遥测事件文件测试后清理。

## 八、遗留建议

1. 高危安全项（D4-2/16/21/23）应优先修复并回归——涉及安全拦截与规则注入，属 P0，且 v1.1.6-next.0 仍未修复。
2. D10-3 路由准确率（21.4% vs ≥90%）需重点补强中文意图路由词表/语义，或接入 LLM 兜底。
3. 协议层（D9-2/4/7/9）建议引入 MCP 官方 conformance test 补齐状态机与错误码。
4. 待排查（非本日 daily 用例，供参考）：`detectAgent` 对 11 客户端 clientInfo 仅匹配 9/11（probe-d1-2-d4-10 辅助断言，D1-2 属追踪表 REFERENCE_ONLY，未计入 daily 缺陷）。
5. 3 条 BLOCKED（D3-S7/D9-6/D1-67）待补环境后复测，均非假阻塞——真云 AK/SK、只读子账号、D10 路由 harness（run-eval.mjs）均已实测可用。