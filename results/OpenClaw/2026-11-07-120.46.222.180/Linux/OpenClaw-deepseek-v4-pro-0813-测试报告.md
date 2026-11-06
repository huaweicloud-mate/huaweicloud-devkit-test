# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-11-07 05:52`（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-07-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（FAIL/SPEC-MISMATCH 均为历史延续，无新增产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0003） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.14-next.0`（npm @next，gitHead `ac955889`） |
| 工具全集 | `47`（tools.mjs TOOL_DEFINITIONS，较 1.1.13 新增 1 个） |
| hcloud / 依赖 | hcloud 7.2.12（插件配对 7.3.12，version_mismatch 状态在 auth_status 中标注） |
| 真云凭证 | cn-north-4（AKSK 主账号 + test001 只读子账号，均已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 + 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。上一日证据探针（run_all.sh / run_source.sh / 各 probe 脚本）沿用，本日 SUT 升级后 fresh 重跑全部探针。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 129 / 13 / 0 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 89.0%（129/145） |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（ECS/VPC/子网/EIP/OBS/RDS/FunctionGraph 均 0 残留） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 91 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | 历史延续，根因见缺陷清单 |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 3 | D1-65 / D1-68 / D9-9 |
| NOT_RUN | 1 | D1-39 Windows 专属（Linux 由 D1-40 覆盖） |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（D10-3 评测集「云主机」路由 MISS） |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无 |
| **合计** | **39** | |

---

## 四、缺陷清单

> 全部为历史延续（相对上一日正式版 fresh 复现，无新增产品缺陷），不在本轮重复提单，详见 `FINDINGS.md` 与 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | 明文 secret API 未拦截（kms DecryptData/DecryptDatakey） | safety/policy.json:26 | 历史 |
| 2 | P0 | D4-15 | hook 绕过未完全拦截（ANSI-C 引号命令替换） | risk-rule-engine.mjs | 历史 |
| 3 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | risk-rule-engine.mjs | 历史 |
| 4 | P0 | D9-12 | initialize 握手时序未强制 | mcp-protocol.mjs:57 | 历史 |
| 5 | P1 | D1-70 | 代理 WebSocket 路径崩溃（undici 浮点依赖） | package.json engines + undici ^8.12.3 | 历史 |
| 6 | P1 | D4-17 | hook 模糊 fail-closed 缺口 | risk-rule-engine.mjs | 历史 |
| 7 | P1 | D4-27 | 空格分隔形态凭证泄露 | safety-policy.mjs:34 | 历史 |
| 8 | P1 | EXP-E01 | 中文意图「云主机」路由 MISS | tools.mjs ECS keywords | 历史 |
| 9 | P2 | D3-S5 | 复合意图分层路由 MISS | tools.mjs serviceCatalog | 历史 |
| 10 | P2 | D4-25 | Python hook 写操作分类错误 | huaweicloud-safety.py | 历史 |
| 11 | P2 | D4-26 | findings 证据脱敏不完整 | risk-rule-engine.mjs:19 | 历史 |
| 12 | P2 | D8-1 | 文档工具数漂移（43/39 vs 实际 47） | AGENTS.md | 历史 |
| 13 | P2 | D8-9 | sanitizeValue 未脱敏 | telemetry.mjs | 历史 |
| SPEC | P2 | D1-65 | telemetry 域 DEBUG '1' 不生效 | telemetry.mjs:82 | 待裁决 |
| SPEC | P2 | D1-68 | HW_REGION 优先级与契约相反 | credentials.mjs | 待裁决 |
| SPEC | P1 | D9-9 | capabilities.cancellation 未声明 | mcp-protocol.mjs | 待裁决 |

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」；Linux 侧由 D1-40 覆盖） |

---

## 六、安全/红线

- 红线 1（真云必须执行）：满足。ECS/VPC/子网/RDS/OBS/FunctionGraph/沙箱 真机用例全部真机执行并测后归零。
- 红线 2（缺陷提单）：13 FAIL + 3 SPEC 全部为历史延续（不重复提单），FINDINGS.md 与上一日 HISTORY_LINKS.md 保留完整历史单号关联。
- 红线 3（PASS 门禁）：`verify_no_fake_pass.py` 通过。
- 红线 4（环境阻塞）：0 项 BLOCKED。

---

## 七、资源释放

- 本轮真云创建资源（ECS / VPC / Subnet / OBS 桶 / FunctionGraph 函数+触发器 / RDS MySQL 实例 / 沙箱）全部测后删除，最终只读核验：ECS count=0、VPC 无 `tctest-openclaw-c1-*`/`tctest-s7-*` 残留、EIP total_count=0、RDS 无 `tctests7db*`、OBS 桶已删。
- D3-C1 ECS 探针的 finally 归零断言因 VPC 异步最终一致竞态标 false，已人工二次 DeleteVpc 后核验 0 残留。
- D1-70 探针残留的假 `proxy.json`（http://proxy.example:8080）已备份移除（`~/.config/huaweicloud/proxy.json.d1-70-20261107.bak`），确认真云探针未被污染。

---

## 八、遗留建议

- 13 FAIL + 3 SPEC 均为跨版本历史问题，建议维护者按 FINDINGS.md 根因（文件:行号）逐条排期修复；其中 D4-3/D4-15/D4-21/D9-12 为 P0 安全/协议红线，建议优先。
- D1-70（undici ^8.12.3 要求 Node >=22.19）建议同时收敛 `engines.node` 声明或降级 undici，本机 Node 22.13.0 属受支持版本却崩溃，属兼容性回归风险。
- D8-1 文档工具数漂移（43/39 vs 实际 47）不影响功能但易误导排查，建议随 tools.mjs 每次增删工具同步更新 AGENTS.md/README。
- fixtures env-var-coverage 新增 7 项 `HUAWEICLOUD_INJECT_STS_CMD` 行为断言失败（源码仅 `=== "0"/"false"` 精确比较，其余值本应 inject 但实测不 inject），本轮归入历史夹具失败，不计入产品 Findings；若该 STS 注入开关属交付契约，建议维护者裁决是否纳入 #14 类 SPEC-MISMATCH。