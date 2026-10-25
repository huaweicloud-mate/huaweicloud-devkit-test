# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-26 05:23:00（北京时间）
> **执行归档**：`results/AtomCode/2026-10-26-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本(.mjs) 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 CLI(install/doctor/status) + MCP 协议 + 真云 E2E(建删归零)；决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 9 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `93.7%` |
| P0 / P1 / P2 新增缺陷 | `1 / 5 / 3` |
| 红线（I 类）违规 | `0`（无凭证明文外泄；脱敏缺陷见 D2-4/D4-27/D8-9） |
| 资源释放 | `全部归零（D3-C1/C2/C3/C6/C7 真云 E2E 已核实无残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:20-31,57` | 待提单 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:2188,2441-2443` | 待提单 |
| 3 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | `tools.mjs:2188,2441-2443` | 待提单 |
| 4 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | `tools.mjs:2188,2441-2443` | 待提单 |
| 5 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:2188,2441-2443` | 待提单 |
| 6 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46,112` | 待提单 |
| 7 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:42-45` | 待提单 |
| 8 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:189-197` | 待提单 |
| 9 | P1 | `EXP-E01` | D10评测集 | serviceCatalog 中文意图路由 | `tools.mjs:2188,2441-2443` | 待提单 |
| 10 | P1 | `D9-9` | D9协议 | tools/call 超时协议语义与取消 | `mcp-protocol.mjs:47` | SPEC-MISMATCH |

### 根因详情

> 完整「现象 / 断言 / 根因（文件:行号）/ 证据」见同目录 `FINDINGS.md`（file_issue.py 的提单输入），此处不再重复。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），Linux 由 d1-upgrade 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 真云 VPC 配额超限(VPC.0114 Quota exceeded)：已真机尝试 CreateVpc 被云侧配额阻断，finally 反查归零验证无本批资源残留 |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨 region(ap-southeast-3) EIP 建删被 IAM token 区域绑定(cn-north-4)阻断(VPC.0501)：只读查询+plan 已通过，EIP 建删归零(count=0)已核实；仅该 region 写操作因 token 区域不匹配不可执行 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`3 项脱敏缺陷（D2-4/D4-27/D8-9），已记 FINDINGS 待提单`
- [x] 写操作误判 read-only：`1 项写命令降级（D4-25 DeleteServers→cli:invoke）`
- [x] 红线（I 类）违规：`0（真云 E2E 均最低配置建删归零，无 mock）`
- [x] 脱敏复核：`redactSecrets/redactOutput 真机复测（见 D4-27/D2-4 证据）`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/VPC/子网（D3-C1） | 尝试创建（被配额阻断） | 无需销毁 | finally 反查无残留 ✅ |
| OBS 桶（D3-C2） | 创建成功 | 已删除 | 删桶 success ✅ |
| Sandbox 会话（D3-C3/C6） | 已连接/部署 | close_session | 会话已关 ✅ |
| EIP（D3-C7） | 创建被 token 区域阻断 | 未创建 | total_count=0 ✅ |

> 真云 E2E 全部真实执行：最低配置创建 → 测后删除 → 归零验证，只删本次创建（唯一时间戳名），无残留。

---

## 八、遗留与建议

- SPEC-MISMATCH：`D9-9`（mcp-protocol 未声明 cancellation/notifications），待维护者裁决契约。
- 脱敏缺口：`safety-policy.mjs` 的 `isSecretKeyName`/正则需补 `ak`/`sk` 短键与小写形态；`telemetry.mjs` 的 `sanitizeValue` 需接入凭证脱敏。
- 路由建议：`tools.mjs` 的 `serviceCatalog.routeMap` 需扩充服务/中文意图覆盖，降低 help 回落。
- 环境阻塞：`D3-C1`（VPC 配额）、`D3-C7`（跨 region token 区域绑定）待解除后补测。
