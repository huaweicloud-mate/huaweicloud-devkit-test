# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-18 05:40:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-18-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.15-next.1 (gitHead df6bea57)` |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| 真云凭证 | `cn-north-4（AKSK 真机）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（`safety-policy.mjs`/`risk-rule-engine.mjs`/`tools.mjs`/`telemetry.mjs` 等） + MCP 工具真机调用（`huaweicloud_*` 46 工具）+ 真云 E2E（hcloud 建删 VPC/OBS、沙箱连通）。证据统一落 `evidence/<case-id>/`（probe.mjs + stdout.log），由 `_probes/` 五个 driver 脚本批量驱动。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 6 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `95.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 3` |
| 红线（I 类）违规 | `0`（无真实凭证外泄/写操作误放行） |
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
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety-policy.mjs:249 | 历史已查重 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts HCL 委托角色未拦截 | risk-rule-engine.mjs:150 | 历史已查重 |
| 3 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图路由 | tools.mjs:2307-2314 | 历史已查重 |
| 4 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | risk-rule-engine.mjs:97 + safety-policy.mjs:34 | 历史已查重 |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | huaweicloud-safety.py:46 | 历史已查重 |
| 6 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs:190 | 历史已查重 |

### 根因详情

> 6 项 FAIL 均为历史已知缺陷在 1.1.15-next.1 的稳定复现（P0×2 / P1×1 / P2×3），已历史查重不重复开单，见 HISTORY_LINKS.md / FINDINGS.md。

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
| VPC（hdk-s3-c1-*/s2-*/audit-*） | 3 个（D3-C1/D3-S2/D4-14） | 已 DeleteVpc | `hdk-s3-` VPC 残留=0 |
| VPC（D4-20 拒绝后零操作） | 0 个（plan 被 deny 未创建） | — | notCreated 校验通过 |
| OBS bucket（hdk-s3-obs-*/web-*） | 2 个（D3-C2/D3-C13） | 已 obs rm -f | 无残留 |
| 沙箱会话 | 2 次 connect（D3-C3/D3-S3） | 已 close_session | 无残留 |

---

## 八、遗留与建议

- 6 项 FAIL 均为历史已知缺陷在 1.1.15-next.1 正式复现（较 1.1.14 无变化），已历史查重不重复开单，见 HISTORY_LINKS.md。
- 建议优先修复 P0：`blockedSecretOperations` 补 `DecryptData/DecryptDatakey`；HCL `delegated_role/AdministratorFullAccess` 语义识别。
- 建议补 `云主机` 到 serviceCatalog ECS 别名；统一 `redactString`/`sanitizeValue` 覆盖 `--key value` 空格形态脱敏。
- 备注：被测包 engines 声明 `node ^22.19.0 || >=23.4.0`，本机 Node v22.13.0 触发 EBADENGINE 警告（不影响本轮执行，建议环境升级），详见 D4-12。
