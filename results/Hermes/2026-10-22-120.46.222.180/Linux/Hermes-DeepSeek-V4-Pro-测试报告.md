# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-22 05:20:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-22-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.10`（npm `latest` 正式版，gitHead `b0e9f026`） |
| 工具全集 | `43`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.x（已配置）+ huaweicloud-devkit CLI 1.1.10` |
| 真云凭证 | `cn-north-4（管理员 AKSK + 只读子账号 test001）` |
| 测试类型 | 源码级探针 / 真机 CLI（help/install/doctor/status）/ MCP 协议 / 真云 E2E（建删归零）/ eval harness |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn hcloud 真机执行，决策/结果落 `stdout.log`；只读子账号用例经 `run-as-readonly.py` 注入 env；真云用例（ECS/VPC/subnet/OBS/FunctionGraph/sandbox）最低配置创建→测后删除→归零验证。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 14 / 0 / 2 / 2` |
| 通过率（分母 = PASS+FAIL = 146） | `90.4%` |
| P0 / P1 / P2 新增缺陷 | `2 / 6 / 5`（产品缺陷）+ SPEC-MISMATCH 2 |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/subnet/OBS/FunctionGraph/sandbox 无残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单（其中 D3-C1 为 VPC 配额非产品缺陷） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移（D1-68、D8-9） |
| NOT_RUN | `2` | D1-39（Windows 专属）、D3-S7（跨服务编排超每日范围） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01『云主机』路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak/sk 未脱敏） | `safety-policy.mjs:34/49` | 历史单（查重命中） |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手非法时序未拒绝 | `mcp-protocol.mjs:57` | 历史单（查重命中） |
| 3 | P1 | `D4-4` | D4安全 | 写操作审批门 Change* 变更类漏拦截 | `safety/policy.json:27` | 历史单（查重命中） |
| 4 | P1 | `D3-C1` | D3功能 | ECS 生命周期 E2E（VPC 配额阻断） | `VPC.0114 配额（非产品缺陷）` | 非产品缺陷 |
| 5 | P1 | `D3-C7` | D3功能 | 跨区错误码与契约不符 | `tools.mjs` explain_error 映射 | 历史单（查重命中） |
| 6 | P1 | `D3-S1` | D3功能 | serviceCatalog「云主机」路由 MISS | `tools.mjs:2025-2042` | 历史单（查重命中） |
| 7 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（1 MISS） | `tools.mjs` routeMap 缺「云主机」 | 历史单（查重命中） |
| 8 | P1 | `EXP-E01` | D10评测 | 『云主机』中文意图路由 MISS | `tools.mjs` routeMap 缺「云主机」 | 历史单（查重命中） |
| 9 | P1 | `D3-C3` | D3功能 | 沙箱 deploy_nginx 端口递增后 ok=false（假失败） | `sandbox/session-manager.mjs:~1014` | 历史单（查重命中） |
| 10 | P2 | `D3-S5` | D3功能 | 复合意图仅命中单一服务 | `tools.mjs` serviceCatalog | 历史单（查重命中） |
| 11 | P2 | `D4-25` | D4安全 | Python hook 写操作落 cli:invoke | `hooks/huaweicloud-safety.py:46` | 历史单（查重命中） |
| 12 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整 | `risk-rule-engine.mjs:19-22` | 历史单（查重命中） |
| 13 | P2 | `D1-65` | D1安装 | DEBUG 仅认字面量 'true'（SPEC） | `telemetry/telemetry.mjs:81` | 历史单（查重命中） |
| 14 | P2 | `D1-66` | D1安装 | 遥测开关/端点 env 不生效 | `telemetry/telemetry.mjs:176-180` | 历史单（查重命中） |
| 15 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏（SPEC-MISMATCH） | `telemetry/telemetry.mjs:189` | 历史单（查重命中） |
| 16 | P2 | `D1-68` | D1安装 | region env 优先级与契约相反（SPEC-MISMATCH） | `auth/credentials.mjs:225` | 历史单（查重命中） |

> 根因（文件:行号）均已在 2026-10-21 提单中定位；本版（v1.1.10，gitHead b0e9f026）较昨日无版本变化，15 项产品缺陷全部稳定复现。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链用例（OS 列标注「专属」），当前 OS=Linux 不适用 | 无（OS 专属，Linux 侧由 EXP-NR3-10 代表覆盖） |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 改用例 | 跨服务复合编排（RDS+沙箱+连接串注入+归零）超出每日单服务真云探针范围，未执行 | 建议纳入真云 E2E 专项或明确采样范围 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D4-13 只读子账号指纹化，无 SK 落盘）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（VPC 配额阻断，D3-C1 未建成） | — | 无残留 |
| VPC / subnet | probe_cloud D3-S2 创建后删除 | 已删 | 归零=true（D3-S2 PASS） |
| OBS 桶（D3-C2/C13） | 是 | 已删（rm-object + rm-bucket） | 归零校验：已归零 |
| FunctionGraph（D3-S6） | 是 | 已删（DeleteFunction 剥离 :latest） | 归零=true |
| 沙箱 session（D3-C3/C6/S3） | 是 | close_session | 全关闭 |

> 真云只删本次创建资源；D3-C1 因 VPC.0114 配额未建成 VPC，「无资源需清理」归零校验通过，无泄漏。

---

## 八、遗留与建议

- 待裁决 SPEC：`D8-9`（sanitizeValue 脱敏）、`D1-68`（region 优先级）——均与设计契约漂移，待维护者裁决。
- 本轮已恢复：`D3-S2`（昨日 VPC 配额非产品缺陷，今日实测 PASS，router 配额边缘波动）。
- 真云配额提醒：共享账号 hw018619646 多机并发每日测试，VPC router 配额在边缘耗尽（D3-C1 今日被阻断、昨日 D3-S2 被阻断），建议维护侧清理历史泄漏 VPC 或扩容配额。
- 建议：15 项产品缺陷与前日提单完全重合，file_issue.py 历史查重命中，无需重复开单；修复优先级建议 P0 两证（D2-4 脱敏、D9-12 握手）→ P1 变更类审批门（D4-4）。