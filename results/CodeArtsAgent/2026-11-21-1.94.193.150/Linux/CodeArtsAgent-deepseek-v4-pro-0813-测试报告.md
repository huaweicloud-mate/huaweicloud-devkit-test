# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-21 05:18:33（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-21-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（6 项缺陷：P0×2 / P1×1 / P2×3）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（deepseek-v4-pro-0813） |
| OS / 架构 | Linux（x86_64，1.94.193.150） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.15`（npm latest，gitHead `bf79b643a1941ef8665548a209683435a2b7a2af`） |
| 工具全集 | `49`（tools.mjs TOOL_DEFINITIONS，D5-3/D9-1 实测） |
| hcloud / 依赖 | hcloud 已装并已认证（check_cli installed=true authenticated=true） |
| 真云凭证 | cn-north-4（AK/SK 已配置，D2-1 三端同步 PASS） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/help）/ MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39 = 146 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 6 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `95.86%`（139/145） |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 3` |
| 红线（I 类）违规 | `2`（D4-3 明文 secret API 未拦截；D4-21 HCL 高权限委托角色未 deny） |
| 资源释放 | 全部归零（真云 driver 归零核实 `hdk-s3-` VPC 残留=0，OBS 桶已删） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | D4-3 / D4-21 / D4-25 / D4-26 / D8-9，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `1` | D1-39（Windows 专属，Linux 不适用） |
| **合计** | **`107`** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | 明文 secret API 拦截缺 DecryptData/DecryptDatakey | `hcloud kms DecryptData` 应 `deny`(risk=secret) | `decision=allow` | `safety-policy.mjs:599` | P | 待提单 |
| 2 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL AdministratorFullAccess | HCL 授予 AdministratorFullAccess 应命中 `hwc-iam-admin-policy`(deny) | `decision=warn`（命中无关规则） | `cloud-risk-rules.json:196` | P | 待提单 |
| 3 | P1 | `EXP-E01` | serviceCatalog「云主机」未路由到 ECS | 中文意图「云主机」应命中 ECS | `recommendedServices` 未含 ECS | `tools.mjs:2586-2587` | P | 待提单 |
| 4 | P2 | `D4-25` | Python hook 遥测分类 CreateVpc 误判为 cli:invoke | 写命令应分类 `cli:write` | keys 仅 `cli:read`/`cli:invoke` | `huaweicloud-safety.py:112` | P | 待提单 |
| 5 | P2 | `D4-26` | findings 证据未脱敏（--key value 空格形态泄露明文） | evidence 应脱敏，不含 Secret123 | evidence 含明文 `Secret123` | `risk-rule-engine.mjs:19-25` | P | 待提单 |
| 6 | P2 | `D8-9` | sanitizeValue 未脱敏敏感值 | 应移除 AK/token 敏感值 | 返回原文未清洗 | `telemetry/telemetry.mjs:190` | P | 待提单 |

> 根因详情、复现命令与代码片段见 `FINDINGS.md`（统一提单脚本解析输入）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注 Windows 专属） | Linux 侧由 D1-40 反向提醒防护覆盖，归属无需改 |

> 其余用例全部执行（无 BLOCKED）。真云 E2E（D2-1/D3-C1/C2/C3/C6/C7/C13/C14/S2/S3/S4/S6/S7/D4-13/14/18/19/20）均真机执行完成并归零。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`2`（D4-3、D4-21，详见缺陷清单）
- [x] 脱敏复核：证据目录 stdout.log 为探针结构化结果，无原始明文凭证

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-s3-c1/s2/audit/deny） | 是 | 已删 | 归零核实 `hdk-s3-` VPC 残留=0 |
| OBS 桶（hdk-s3-obs/web） | 是 | 已删 | `rm -f` 后无残留 |
| 沙箱会话 | 是 | 已关 | session 已 close（D3-C3/D3-S3） |

> 真云只删本次 `hdk-s3-` 前缀资源；删除前盘点并限制前缀，未触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：无（本轮无 SPEC-MISMATCH；1.1.15 为 release 分支，`TOOL_DEFINITIONS` 含 inputSchema，与 2.0.0 的 zod 迁移漂移不适用于本版）
- 本轮未覆盖：无（146/146 全部执行）
- 建议：D4-3/D4-21 为安全红线级缺陷且为 P0，建议优先修复；D4-25 属遥测分类精度问题，可纳入审计准确性治理。
