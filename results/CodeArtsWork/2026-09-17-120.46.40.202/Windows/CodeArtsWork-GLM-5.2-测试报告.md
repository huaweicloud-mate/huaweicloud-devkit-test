# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-17 06:55:00`（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-17-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（全部用例通过，0 FAIL / 0 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows (win32) x64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | `40`（MCP huaweicloud-devkit_* 工具） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 10 pass 0 fail` |
| 真云凭证 | `已配置（~/.config/huaweicloud/credentials.json）` |
| 只读子账号 | `已配置（credentials.readonly.json，D4-13 用 run-as-readonly.py 切）` |
| 测试类型 | MCP 工具黑盒 / CLI 真机（install/doctor/status/update）/ MCP 协议 / hook 风险规则 |
| daily 基础用例 | 设计级 78 / 展开级 39（预筛剔除 32 条非本客户端/OS） |

> **执行方法**：MCP 工具（tool_call）直调 huaweicloud-devkit 40 工具，CLI 真机执行 install/doctor/status/update/auth，hook 风险规则用 hook_check_command/artifacts/deploy_plan 验证，证据统一落 `evidence/<case-id>/`（probe.txt + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `117`（设计级 78 + 展开级 39） |
| 已执行 | `117` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `117 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `100%`（117/117） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `78` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`78`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> 本轮无 FAIL / SPEC-MISMATCH 缺陷。所有用例均 PASS（有证据）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| — | — | — | 无缺陷 | — | — | — | — | — |

---

## 五、未执行用例与原因

> 无未执行用例。全部 117 条用例均已执行并通过（PASS）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted 返回 `<redacted>`，run_readonly 拒绝 configure show）
- [x] 写操作误判 read-only：`0`（plan_cli_command 对 create/delete 正确分类 write/deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | 不适用 | 无残留 |

> 本轮无真云资源创建，无需释放。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：无（全部用例已执行并通过）
- 环境观察点：
  1. MCP server safety rules 路径在 `.codeartswork/huaweicloud-plugins/safety/rules/` 下，与部分用例预期的 `huawei-agent-rules.md` 文件名不同，实际以 `cloud-risk-rules.json` + `policy.json` 形式存在，功能等价
  2. Skills 目录在 `.codeartswork/skills/` 下，共 65 个技能目录，远超 D8-7 要求的 7 个 meta/通用技能
- 建议：无
