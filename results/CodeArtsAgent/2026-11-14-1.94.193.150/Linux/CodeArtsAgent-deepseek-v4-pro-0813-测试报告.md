# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-14 06:00:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-14-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| Node / npm / Python | `v22.13.0 / 10.9.2 / 3.12.3` |
| 被测版本（SUT） | `1.1.14-next.5`（gitHead `4fb59d76`） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS，含 40 MCP 工具） |
| hcloud / 依赖 | `hcloud 7.2.12`（authenticated，version_mismatch vs 7.3.12） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真机执行） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / D10 评测 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本 `.mjs` 直调 `plugins/huaweicloud-core/src/*` 导出函数 + `spawn src/mcp-server.mjs` 协议探测 + `tools.callTool` 工具探测 + `hcloud` 真机建删归零；证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 6 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `95.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC=0 / ECS=0 / OBS 桶=0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | D1-39（Windows 专属，OS 列豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 本轮全执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截缺 DecryptData | `safety-policy.mjs:249` + `safety/policy.json` blockedSecretOperations 缺 DecryptData |
| 2 | P0 | `D4-21` | D4安全 | HCL AdministratorFullAccess 未触发 IAM deny | `risk-rule-engine.mjs:150` HCL 解析未识别 identity_agency |
| 3 | P1 | `EXP-E01` | D10评测 | 「云主机」中文意图未路由 ECS | `tools.mjs:2358-2371` 路由表缺「云主机」别名 |
| 4 | P2 | `D4-26` | D4安全 | findings 证据未脱敏（--key value 空格形态） | `risk-rule-engine.mjs:97` evidence 未脱敏 + `safety-policy.mjs:34` redactString 只匹配 `key[:=]value` |
| 5 | P2 | `D4-25` | D4安全 | Python hook 遥测写操作误判 cli:invoke | `hooks/huaweicloud-safety.py:57` WRITE_OPERATION_RE 前缀无法匹配空格 |
| 6 | P2 | `D8-9` | D8质量 | sanitizeValue 不脱敏敏感值 | `telemetry/telemetry.mjs:190` 仅 trim+截断 |

> 全部 6 项均为产品缺陷，已统一合入 FINDINGS.md，由 file_issue.py 历史查重后提单（见 HISTORY_LINKS.md）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属 P0（OS 列标注「专属」），Windows 升级检测链仅 Windows 适用，Linux 由 D1-40 反向提醒覆盖（P0 NOT_RUN 唯一豁免） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted 正确 `<redacted>`）
- [x] 写操作误判 read-only：`0`（DeleteServer/CreateVpc 均 deny/write）
- [x] 红线（I 类）违规：`无`
- [x] 真云归零：ECS=0 / VPC=0 / OBS 桶=0（本次创建 `hdk-s3-*` 全部删除）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-s3-c1/s2/audit/deny） | 是 | 已删 | VPC 残留 0 |
| OBS 桶（hdk-s3-obs/web） | 是 | 已删 | OBS 桶残留 0 |
| 沙箱 session | 是 | 已 close | 无残留 |

> 真云只删本次 `hdk-s3-*` 前缀资源；删除前全量盘点，最终 ECS/VPC/OBS 残留均 0。

---

## 八、遗留与建议

- 本版本（1.1.14-next.5）为 1.1.x 系列，安全策略与 v2（2.0.0-next.3）存在覆盖差异：DecryptData 未列入 secret API、HCL broad IAM 解析不全、redactString 不处理 `--key value` 空格形态、Python hook 写操作遥测分类正则缺陷。
- 中文意图路由（serviceCatalog）缺「云主机」别名，D10 评测 E01 MISS。
- 建议：补齐 DecryptData/DecryptDatakey 到 blockedSecretOperations；修复 WRITE_OPERATION_RE 前缀为 `\b`；redactString 增加 `--key value` 空格形态；serviceCatalog 路由表补「云主机」别名。
