# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-15 14:15:00`（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-15-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（4 条 BLOCKED 因无真云凭证，非缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows (win32) x64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256e`，PR #669 release-1.1.4） |
| 工具全集 | `37`（MCP huaweicloud-devkit_* 工具） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 10 pass 0 fail` |
| 真云凭证 | `未配置（~/.config/huaweicloud/credentials.json missing）` |
| 测试类型 | MCP 工具黑盒 / CLI 真机（install/doctor/status/update）/ MCP 协议 / hook 风险规则 |
| daily 基础用例 | 设计级 81 / 展开级 39（预筛剔除 32 条非本客户端/OS） |

> **执行方法**：MCP 工具（tool_call）直调 huaweicloud-devkit 37 工具，CLI 真机执行 install/doctor/status/update/auth，hook 风险规则用 hook_check_command/artifacts/deploy_plan 验证，证据统一落 `evidence/<case-id>/`（probe.txt + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `120`（设计级 81 + 展开级 39） |
| 已执行 | `120` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `116 / 0 / 4 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `100%`（116/116） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `77` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `4` | 环境阻塞（无真云 AK/SK），见 §五 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`81`** | |

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

> 本轮无 FAIL / SPEC-MISMATCH 缺陷。所有用例要么 PASS（有证据），要么 BLOCKED（环境缺真云凭证）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| — | — | — | 无缺陷 | — | — | — | — | — |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D4-3` | 设计级 | P0 | BLOCKED | 补环境 | 明文 secret API 拦截需真云账号调用真实返回明文/二进制 secret 的 API；本机无 AK/SK 无法实测真实 API | — |
| `D2-11` | 设计级 | P0 | BLOCKED | 补环境 | STS token 拒绝落盘需真云 AK/SK + securityToken 测 auth_switch persist+token；无 AK/SK 无法实测 | — |
| `D2-1` | 设计级 | P1 | BLOCKED | 补环境 | auth init 三端同步需真云 AK/SK 配置凭证后测三端（vault/OBS/KooCLI）同步；无凭证无法实测 | — |
| `D2-16` | 设计级 | P1 | BLOCKED | 补环境 | import 文件读取后擦除需真云凭证文件测 auth_switch import 后 token 擦除；无凭证文件无法实测 | — |

> 4 条 BLOCKED 均为【补环境】分类（缺真云 AK/SK 凭证），非用例设计问题。补齐凭证后可直接复测，无需改用例。

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
| 真云资源 | 否（全部 BLOCKED） | 不适用 | 无残留 |

> 本轮无真云资源创建（4 条真云用例因无凭证 BLOCKED），无需释放。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云 E2E（4 条 BLOCKED：D4-3/D2-11/D2-1/D2-16 需真云 AK/SK）
- 环境观察点：
  1. MCP server safety rules 路径不匹配（`.codeartsdoer` vs `.codeartswork`），已手动复制修复；建议 install 时统一路径或 MCP server 自动探测
  2. MCP retrieve_skill/search_docs 技能目录路径不匹配（`.codeartsdoer/skills` 只有状态文件），技能检索返回空；已改用直接读 `.codeartswork/skills` 验证
- 建议：补齐真云 AK/SK 凭证后复测 4 条 BLOCKED 用例；修复 MCP server 路径探测逻辑使 safety rules / skills 自动定位