# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-20（北京时间）
> **执行归档**：`results/AtomCode/2026-09-20-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（ecs-hd-ai-work-00-0003，IP 113.44.197.147） |
| Node / npm / Python | Node v22.13.0 / npm 11 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.5（npm latest，gitHead `e7ed6f6`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | 已配置（doctor pass=11 fail=0） |
| 真云凭证 | cn-north-4（管理员 AK/SK + 只读子账号 test001，均已实测） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/help）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 100 / 展开级 39 / 追踪表 209 行 |

> **执行方法**：探针脚本（.mjs/.sh/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数并实测，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 最低配置创建→测后删除归零；证据统一落 `evidence/<case-id>/`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计 100 + 展开 39） |
| 已执行 | 139（无未执行） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 109 / 25 / 3 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 109 / 135 = **80.7%** |
| P0 / P1 / P2 缺陷 | 4 / 7 / 3（另 SPEC-MISMATCH 1） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云 VPC/安全组测后删除，计数=0） |

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
| P1 | 7 | D4-6 adminPass 空格形式未脱敏 · D4-7 artifacts broad IAM 未拦截 · D4-27 文本裸 token/ak/sk 未脱敏 · D3-S8 排障路由缺失 · D9-2 JSON-RPC 错误码 · D9-4 生命周期未强制 · D10-3 路由准确率 21.4% |
| P2 | 3 | D4-25 Python hook write 分类 · D8-9 sanitizeValue 未脱敏 · D9-7 版本协商缺失 |
| SPEC | 1 | D9-9 超时/取消能力缺失 |

> P0 缺陷集中在**安全拦截/制品预检/规则注入**三处（safety-policy、risk-rule-engine、package setup），为高危漏洞面；D10-3 路由准确率 21.4% 与设计断言 ≥90% 差距巨大，为核心功能缺陷。

## 五、未执行用例与原因（含 BLOCKED）

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计 | P0 | NOT_RUN | 【调归属】 | Windows 专属（npm.cmd/EINVAL 升级检测链），Linux 结构化不适用 | Linux 侧由 EXP-NR3 展开级代表覆盖（已由源码级 queryDistTagsSync 探针佐证） |
| D3-S7 | 设计 | P1 | BLOCKED | 【补环境】 | 跨服务多资源编排（建 RDS→沙箱部署→连接串注入→读写验证→归零）需真实 agent 会话自动化；本客户端无 dsh/CDP harness | 非 DSH 客户端需 CDP 会话自动化，或降级为 source-level 编排断言 |
| D9-6 | 设计 | P1 | BLOCKED | 【补环境】 | 需官方 MCP Inspector 校验 + ≥2 客户端互通冒烟环境 | 接入 Inspector 集成 + 多客户端会话环境 |
| D1-67 | 设计 | P2 | BLOCKED | 【补环境】 | 需真实 DSH 插件安装/跳过验证（破坏性全局安装，run-only 不执行） | 提供非破坏性的 env 注入断言接口 |

## 六、安全 / 红线

- 真云 E2E 均已真机执行：D4-13（只读子账号最小权限 write 被拒/read 可用）、D3-C4（安全组 Create→CTS 审计→Delete→归零计数=0）、D4-14（操作可审计）、D2-1（三端就绪 + ECS/OBS 真云 API 可用）、D2-11（STS token 拒绝落盘）。
- 本机无残留计费资源：VPC/安全组测后删除归零。
- 仅提交本客户端 `results/AtomCode/` 目录，未碰 Summary/其他客户端/test-cases 母版。

## 七、资源释放

- 真云创建的资源（VPC `ac-cc-*`、安全组 `tctest-d3c4-*`）均已测后删除，`list` 计数归零。
- 探针产生的临时文件（proxy.json、devkit-mcp-backup.json、hook-events.jsonl）随测试清理/隔离。

## 八、遗留建议

1. 高危安全项（D4-2/16/21/23）应优先修复并回归——涉及安全拦截与规则注入，属 P0。
2. D10-3 路由准确率（21.4% vs ≥90%）需重点补强中文意图路由词表/语义，或接入 LLM 兜底。
3. 协议层（D9-2/4/7/9）建议引入 MCP 官方 conformance test 补齐状态机与错误码。
4. 新增用例（D1-65~70、D9-10/11、D3-C13/C14、D4-25/26/28/29、D6-9、D8-9/10、D3-S*）本日已完成首轮 source-level 覆盖，D3-S7/D9-6/D1-67 仍待补环境后复测。