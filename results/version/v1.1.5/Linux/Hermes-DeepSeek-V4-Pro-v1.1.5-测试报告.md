# Hermes-DeepSeek-V4-Pro-v1.1.5 版本全量测试报告（Linux）

> **报告名**：`Hermes-DeepSeek-V4-Pro-v1.1.5-测试报告.md`
> **生成时间**：`2026-09-16 11:42:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-16-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest）
> **测试类型**：版本全量测试（母版全量 `init_day --full`）· Linux 侧双 OS 对照
> **结论**：`PARTIAL`（存在 P0 缺陷 D4-16）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work，1.94.218.129） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.5（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | 40（tools/list 实测） |
| 真云凭证 | cn-north-4（AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / MCP 协议 / 真云 E2E / D10 eval harness |
| 用例源 | 母版全量 设计 179 + 展开 137（Hermes+Linux 预筛后 57） |

> 执行方法：探针直调 `hdk/plugins/huaweicloud-core/src/*` 函数；MCP 协议走 protocol-probe；D10 走 run-eval；真云 D4-13 走 run-as-readonly、D3-C4 最小 VPC 创建-删除-归零。证据落 `evidence/<case-id>/`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（预筛后） | 236（设计 179 + 展开 57） |
| 已执行 | 235（展开级 EXP-E08 诊断类 N/A） |
| PASS / FAIL / SPEC-MISMATCH / NOT_RUN | 220 / 14 / 1 / 1 |
| 通过率（分母不含 NOT_RUN） | 93.6%（220/235） |
| P0 / P1 新增缺陷 | 1 / 4 |
| 资源释放 | 全部归零（D3-C4 VPC 已删，ShowVpc VPC.9904） |

## 三、状态汇总

- 设计级（179）：PASS 175 / FAIL 3 / SPEC-MISMATCH 1
- 展开级（57）：PASS 45 / FAIL 11 / NOT_RUN 1

## 四、缺陷清单（与 Windows 侧一致）

| # | 级别 | 用例ID | 缺陷 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-16 | sh -c 包裹凭证 env 打印未拦截 | safety-policy.mjs:384 文本路径未解包 shell |
| 2 | P1 | D10-3 / EXP-E | serviceCatalog 路由命中率 21.4% | tools.mjs:350 路由表缺中文语义 |
| 3 | P1 | D9-2 | invalid params 未返回 -32602 | mcp-server 参数校验分支缺 error |
| 4 | P1 | D8-4 | INSTALL.md 未随包发布 | package.json files 白名单遗漏 |
| 5 | P1 | D9-9 | notifications.cancellation 未声明 | mcp-server.mjs:158 |

> 根因细节见同目录 FINDINGS.md。

## 五、未执行用例

| 用例ID | 层级 | 状态 | 原因 |
|---|---|---|---|
| EXP-E08 | 展开级 | NOT_RUN | 诊断类意图，非服务路由意图（run-eval 判 N/A） |

## 六、安全与红线合规

- 凭证泄漏：0（show_profile_redacted 实测无明文 AK/SK）
- 红线（I 类）：1 —— D4-16 sh -c 包裹穿透
- 真云只删本次创建资源（VPC 65d4cc99-...）

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（testbot3-hermes-c4-0916113219） | 是 | 已删 | ShowVpc VPC.9904 |

## 八、遗留与建议

- 待裁决 SPEC：D9-9；待上游修复：D4-16 / D9-2 / D8-4 / D10-3。
- 双 OS 对照结论：Linux 与 Windows 侧结果一致（同 SUT 1.1.5 确定性行为，缺陷无 OS 差异），唯一差异 D1-39 Windows 专属用例在 Linux 侧 OS 专属豁免。