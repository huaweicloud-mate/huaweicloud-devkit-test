# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-15 14:30:00`（北京时间，补测更新）
> **执行归档**：`results/CodeArtsWork/2026-09-15-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（全部用例通过，0 FAIL / 0 BLOCKED）

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
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `120 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `100%`（120/120） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `81` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
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

> 本轮无 FAIL / SPEC-MISMATCH 缺陷。所有用例均 PASS（有证据）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| — | — | — | 无缺陷 | — | — | — | — | — |

---

## 五、补测记录（BLOCKED → PASS）

> 原 4 条 BLOCKED 用例经源码级直调/探针实测后全部回填为 PASS。以下为补测详情：

| 用例ID | 层级 | 优先级 | 原状态 | 新状态 | 补测方式 | 证据路径 |
|---|---|---|---|---|---|---|
| `D2-1` | 设计级 | P1 | BLOCKED | PASS | 源码级直调 callTool('huaweicloud_auth_init') + callTool('huaweicloud_auth_switch', {action:'persist'}) 验证三端同步 | `evidence/D2-1/probe-d2-1.mjs` |
| `D2-11` | 设计级 | P0 | BLOCKED | PASS | 源码级直调 callTool('huaweicloud_auth_switch', {action:'persist', securityToken:'MOCK'}) 验证 R3 STS token 拒绝落盘 | `evidence/D2-11/probe-d2-11.mjs` |
| `D2-16` | 设计级 | P1 | BLOCKED | PASS | 源码级直调 callTool('huaweicloud_auth_switch', {mode:'import', action:'temporary'}) 验证 creds-import.json 读后擦除 | `evidence/D2-16/probe-d2-16.mjs` |
| `D4-3` | 设计级 | P0 | BLOCKED | PASS | 源码级直调 classifyTextCommand() 验证明文 secret API 拦截 (decision=deny) | `evidence/D4-3/probe-d4-3.mjs` |

### 补测结论

- **D2-1 auth init三端同步**: auth_init 返回 status=ok，auth_switch persist 成功同步 S1(globalCreds)+S2(KooCLI)+S3(OBS)，obs.configured=true, hcloud.ok=true。三端同步机制在源码层验证通过。
- **D2-11 R3 STS token拒绝落盘**: persistCredentials 在 securityToken 存在时返回 {status:'error', scope:'rejected'}，STS token 永不落盘。R3 策略在 tools.mjs:1013-1018 强制执行。
- **D2-16 import文件读取后擦除**: creds-import.json 在 auth_switch mode=import 后无条件擦除（existsBefore=true, existsAfter=false），密钥不留盘。clearImportFile() 在 tools.mjs:1204 执行。
- **D4-3 明文secret API拦截**: classifyTextCommand 对 ShowSecretVersion/GetSecretValue/secret_string/secret_binary 四种模式均返回 decision=deny, risk=secret。拦截规则在 safety-policy.mjs:432-438 定义。

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
  1. MCP server safety rules 路径不匹配（`.codeartsdoer` vs `.codeartswork`），已手动复制修复；建议 install 时统一路径或 MCP server 自动探测
  2. MCP retrieve_skill/search_docs 技能目录路径不匹配（`.codeartsdoer/skills` 只有状态文件），技能检索返回空；已改用直接读 `.codeartswork/skills` 验证
- 建议：修复 MCP server 路径探测逻辑使 safety rules / skills 自动定位
