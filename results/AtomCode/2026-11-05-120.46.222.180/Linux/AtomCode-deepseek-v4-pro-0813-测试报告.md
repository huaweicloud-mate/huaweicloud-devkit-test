# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-05 05:15（北京时间）
> **执行归档**：`results/AtomCode/2026-11-05-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**FAIL**（存在 6 项产品缺陷，含 1 项 P0 安全红线）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.13-next.5`（npm @next，gitHead `4ab34ed2`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI 7.2.12（AKSK，region cn-north-4） |
| 真云凭证 | `cn-north-4`（AKSK 已配置，真机执行） |
| 测试类型 | 源码级探针 / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 / 追踪表 216 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云 E2E 走 `scripts/realcloud_e2e.mjs` 真机建删资源；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 145（1 条 OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 130 / 9 / 5 / 1 / 1 |
| 通过率（PASS+FAIL+SPEC-MISMATCH 分母） | 92.9%（130/140） |
| P0 / P1 / P2 缺陷 | 1 / 3 / 2 |
| 红线（I 类）违规 | 1（D2-4 AK/SK/token 未脱敏） |
| 资源释放 | 全部归零（无残留） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 92 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | 不符预期，根因见缺陷清单 |
| BLOCKED | 5 | 环境阻塞（真云建删资源真机已执行、非产品缺陷） |
| SPEC-MISMATCH | 1 | 契约漂移（D9-9 cancellation） |
| NOT_RUN | 1 | D1-39 Windows 专属用例在 Linux |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由缺失 |
| BLOCKED / SPEC-MISMATCH / NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | redactSecrets 未脱敏 JSON 字符串形态 ak/sk/token | 三类值替换为 `<redacted>` | 明文 `AKID123456`/`secret789`/`TOKEN123` 原样返回 | `src/safety-policy.mjs:40-45` | I | 待提单 |
| 2 | P1 | `D4-27` | 双路径输出小写 ak=/sk= 未脱敏 | `ak=`/`sk=`/`token=` 不分大小写均脱敏 | `token=<redacted> ak=AKID456 sk=secret789` | `src/safety-policy.mjs:40-45` | I | 待提单 |
| 3 | P1 | `D3-S1/D3-S2/D3-S3/D3-S5/EXP-E01` | serviceCatalog 路由缺失回落 help | 中文意图路由到对应服务 | `recommendedServices` 回落 `Run hcloud --help...` | `src/tools.mjs:2273,2524-2526` | P | 待提单 |
| 4 | P2 | `D4-25` | Python hook 写命令遥测分类错误 | `DeleteServers` 命中 `cli:write` | 判为 `cli:invoke` | `hooks/huaweicloud-safety.py:46,111-112` | P | 待提单 |
| 5 | P2 | `D8-9` | sanitizeValue 不脱敏凭证 | `AK=...` 替换为占位符 | `AK=ABC123XYZ` 原样返回 | `src/telemetry/telemetry.mjs:190-197` | I | 待提单 |
| 6 | P1 | `D9-9` | mcp-protocol 未声明 cancellation | capabilities 声明 `cancellation`/`notifications` | 仅 `tools: {}` | `src/mcp-protocol.mjs:51-53` | P | SPEC-MISMATCH |

### 根因详情

**#1 [P0] D2-4 凭证 JSON 字符串未脱敏**
- 期望：`redactSecrets('{"ak":"AKID123456",...}')` → ak/sk/token 值替换为 `<redacted>`
- 实际：三字段明文原样返回
- 根因：`redactString` 的凭证正则（`token|authorization|... \s*[:=]`）要求键名后紧跟 `[:=]`，无法命中 `"token":` JSON 键；补充的 `(AK|SK)` 又大小写敏感且不覆盖 `ak`/`sk`
- 证据：`evidence/D2-4/stdout.log`

**#3 [P1] serviceCatalog 中文意图路由 MISS**
- 期望：中文意图（查 ECS / 删 VPC 确认 / 沙箱出 URL / 复合意图）路由到具体服务
- 实际：`recommendedServices` 回落 help，多类意图未命中
- 根因：`routeMap` 关键词/服务覆盖不全，空结果时回落 `Run hcloud --help...`
- 证据：`evidence/D3-S1/stdout.log` 等 5 份

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真机已执行：VPC/子网创建并归零成功；ECS 创建被账户余额不足拒绝（`Ecs.0067 insufficient balance`），无 ECS 创建、无残留 | — |
| `D3-C2` | 设计级 | P1 | BLOCKED | 补环境 | 真机已执行：OBS 建桶被 `403 UserRestricted` 拒绝（账户受限），无桶创建、无残留 | — |
| `D3-C3` | 设计级 | P1 | BLOCKED | 补环境 | 真机已执行：沙箱服务维护期（`HDKIT_SANDBOX_MAINTENANCE`），connect 未建立会话，无资源 | — |
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | 真机已执行：沙箱服务维护期，全部 sandbox 工具未就绪，无资源 | — |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 真机已执行：4/5 通过；创建 EIP 被租户受限拒绝（`VPC.0502 Tenant status is op_restricted`），EIP 无创建、归零验证 total_count=0 | — |
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（升级检测链 EINVAL 专属，OS 列标注「专属」），本客户端 Linux | Linux 侧由展开级代表段覆盖，无需改 |

> 说明：以上 BLOCKED 均已完成真机执行（建删资源归零），非「无 AK/SK / mock」，属账户余额/账户受限/沙箱维护等外部环境阻塞。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`1`（D2-4 JSON 字符串形态 AK/SK/token 未脱敏，P0 I 类）
- [ ] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`1`（D2-4）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 未建成（余额不足） | 无 | VPC/子网已删（subnet:OK vpc:OK） |
| OBS 桶（D3-C2） | 未建成（UserRestricted） | 无 | 无残留 |
| 沙箱会话（D3-C3/C6） | 未建立（维护期） | 无 | 无残留 |
| EIP（D3-C7） | 未建成（租户受限） | 无 | total_count=0 |
| 昨日孤儿 ECS | — | 已删 | `testbot3-hermes-ecs-3740204810` 已清除，列表为空 |

> 真云只删本次创建资源；本轮无资源残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（mcp-protocol 未声明 cancellation）。
- 本轮环境阻塞（非产品缺陷）：D3-C1（余额不足）/ D3-C2（账户受限）/ D3-C3、D3-C6（沙箱维护）/ D3-C7（租户受限），补环境后复测。
- 本轮未覆盖：D1-39（Windows 专属，Linux 由展开级代表段覆盖）。
- 建议：D2-4 为 P0 I 类安全红线（凭证脱敏失效），建议优先修复；其余 5 项与历史缺陷单一致，随修复统一回归。