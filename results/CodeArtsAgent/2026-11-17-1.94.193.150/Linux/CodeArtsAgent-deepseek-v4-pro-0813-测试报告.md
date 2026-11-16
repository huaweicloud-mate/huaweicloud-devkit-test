# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-17 05:28:05（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-17-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.14 (gitHead bd985051)` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（import 1.1.14 的 `safety-policy.mjs`/`risk-rule-engine.mjs`/`tools.mjs`/`telemetry.mjs` 等函数）+ MCP 工具真机调用（`huaweicloud_*` 40 工具）+ 真云 E2E（hcloud CLI 建删 VPC/OBS、认证三端、沙箱连通、CTS 审计）。证据统一落 `evidence/<case-id>/`（probe.mjs + stdout.log），由 `_probes/` 五个 driver 脚本批量驱动。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 6 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `95.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 3` |
| 红线（I 类）违规 | `无`（无真实凭证外泄/写操作误放行） |
| 资源释放 | `VPC/OBS/沙箱会话已销毁并归零` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety-policy.mjs:249 | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | risk-rule-engine.mjs:150 | 待提单 |
| 3 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | huaweicloud-safety.py:46 | 待提单 |
| 4 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | risk-rule-engine.mjs:97 + safety-policy.mjs:34 | 待提单 |
| 5 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs:190 | 待提单 |
| 6 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图路由 | tools.mjs:2370 | 待提单 |

### 根因详情

> 详细根因（均历史已知缺陷复现，详见 FINDINGS.md）：
> 1. **D4-3** 期望 DecryptData 判 deny，实际 allow；根因 blockedSecretOperations/文本正则缺 DecryptData/DecryptDatakey。
> 2. **D4-21** 期望 HCL AdministratorFullAccess 判 deny，实际 warn(hwc-sandbox-missing-ttl)；根因 HCL 解析未识别 huaweicloud_identity_agency delegated_role。
> 3. **EXP-E01** 期望「云主机」路由 ECS，实际 MISS；根因 ECS 别名缺「云主机」。
> 4. **D4-26** 期望 findings.evidence 脱敏，实际含明文 Secret123；根因 evidence 未脱敏 + redactString 不支持 --key value 空格形态。
> 5. **D4-25** 期望写操作 cli:write，实际 cli:invoke；根因 WRITE_OPERATION_RE 前缀不匹配空格分隔命令。
> 6. **D8-9** 期望 sanitizeValue 移除敏感值，实际保留原文；根因 sanitizeValue 无脱敏逻辑。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（Windows 升级检测链 EINVAL 语义），本机 Linux 结构性不适用；Linux 由 D1-40 反向提醒覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D1-66/D2-4/D4-2/D4-27 脱敏与拦截均 PASS，无真实凭证外泄）
- [x] 写操作误判 read-only：`无`（D4-5 DeleteServer 正确 classify write+deny）
- [x] 红线（I 类）违规：`无`（真云测后资源归零，无越权写操作）
- [ ] 脱敏复核：`2 项不完整`（D4-26 findings 证据、D8-9 sanitizeValue 未脱敏，均历史已知，见 FINDINGS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-s3-c1-*/s2-*/audit-*/deny-*） | 4 个（D3-C1/D3-S2/D4-14/D4-20） | 已 DeleteVpc | `hdk-s3-` VPC 残留=0 |
| OBS bucket（hdk-s3-obs-*/web-*） | 2 个（D3-C2/D3-C13） | 已 obs rm -f | 无残留 |
| 沙箱会话 | 2 次 connect（D3-C3/D3-S3） | 已 close_session | 无残留 |

---

## 八、遗留与建议

- 6 项 FAIL 均为历史已知缺陷在 1.1.14 正式版的稳定复现（P0×2 / P1×1 / P2×3），均已历史查重不重复开单，见 HISTORY_LINKS.md。
- 建议优先修复 P0：`blockedSecretOperations` 补 `DecryptData/DecryptDatakey`；HCL `delegated_role/AdministratorFullAccess` 语义识别。
- 建议补 `云主机` 到 serviceCatalog ECS 别名；统一 `redactString`/`sanitizeValue` 覆盖 `--key value` 空格形态脱敏。
