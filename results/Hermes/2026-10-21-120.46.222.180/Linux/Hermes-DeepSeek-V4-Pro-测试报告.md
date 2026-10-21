# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-21 05:45:30（北京时间）
> **执行归档**：`results/Hermes/2026-10-21-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/SPEC 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux` (aarch64) |
| 被测版本（SUT） | `1.1.10`（npm latest，gitHead `b0e9f026`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |
| 真云凭证 | cn-north-4 管理员 + test001 只读子账号（D4-13 经 run-as-readonly.py 注入） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云 E2E（ECS/VPC/OBS/FunctionGraph/沙箱）经 hcloud + 真机 AK/SK 建删归零；MCP 协议经 spawn `mcp-server.mjs` 实测；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 15 / 0 / 2 / 2` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 148） | `88.5%` |
| P0 / P1 / P2 新增缺陷 | `2 / 7 / 7`（产品缺陷 16；另 1 项非产品缺陷 D3-S2 VPC 配额） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本轮真云资源全部归零（补删泄漏 ECS+VPC/subnet、OBS、FunctionGraph）` |

> **较 v1.1.9 上一轮变化**：D3-S3（沙箱预览出 URL）已在 1.1.10 修复（`publicUrl` + HTTP 200 实测通过）不再提单；新增 D3-C3（沙箱 deploy_nginx 端口冲突后 ok=false 假失败）。其余 16 项缺陷在 1.1.10 中均未修复（本轮源码 diff 仅涉及命令分类 quote-stripping / 错误码映射补充 / account-type 新工具，未触及这些缺陷代码路径）。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
| NOT_RUN | `2` | 未执行（D1-39 Windows 专属 / D3-S7 跨服务编排） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | JSON 小写 ak/sk 键未脱敏 | `{"ak":…,"sk":…}` 应脱敏为占位符 | `safety-policy.mjs:34/49` | 待查重提单 |
| 2 | P0 | `D9-12` | initialize 握手非法时序未拒绝 | 未 initialize 先 tools/list 应拒 -32600 | `mcp-protocol.mjs:57` | 待查重提单 |
| 3 | P1 | `D4-4` | Change* 变更类写操作漏拦截 | Change* 应 deny/confirm | `safety/policy.json:27` | 待查重提单 |
| 4 | P1 | `D3-C1` | ECS E2E 清理异步删除未验证归零 | 测后资源须归零 | `scripts/realcloud_e2e.mjs` | 待查重提单 |
| 5 | P1 | `D3-C7` | 跨区错误码 Common.0013/VPC.0501 与契约不符 | 命中 Ecs.0200/Ecs.0021 | `tools.mjs` explain_error | 待查重提单 |
| 6 | P1 | `D3-S1` | serviceCatalog「云主机」路由 MISS | 「云主机」应命中 ECS | `tools.mjs:2025-2042` | 待查重提单 |
| 7 | P1 | `D10-3` | 路由准确率 92.9% | 100% HIT（N/A 除外） | `tools.mjs` routeMap | 待查重提单 |
| 8 | P1 | `EXP-E01` | 评测集「云主机」意图 MISS | 应路由 ECS | `tools.mjs` routeMap | 待查重提单 |
| 9 | P1 | `D3-C3` | 沙箱 deploy_nginx 端口冲突后 ok=false 假失败 | 递增端口后应 ok=true | `sandbox/session-manager.mjs` | 待查重提单 |
| 10 | P2 | `D3-S5` | 复合意图分层路由未拆分 | 应多 service 分层 | `tools.mjs` serviceCatalog | 待查重提单 |
| 11 | P2 | `D4-25` | Python hook 写操作落 cli:invoke | 写应落 cli:write | `hooks/huaweicloud-safety.py:46` | 待查重提单 |
| 12 | P2 | `D4-26` | findings `--password` 明文残留 | 应全部脱敏 | `risk-rule-engine.mjs:19-22` | 待查重提单 |
| 13 | P2 | `D1-65` | DEBUG 仅认字面量 'true' | 1 或 true 均应开启 | `telemetry.mjs:81` | 待查重提单 |
| 14 | P2 | `D1-66` | 遥测开关/自定义端点 env 未生效 | off/env 应切换 | `telemetry.mjs:176-180` | 待查重提单 |
| 15 | P2 | `D8-9` | sanitizeValue 未做凭证脱敏（SPEC） | 应移除 ak/sk/token | `telemetry.mjs:189` | 待裁决 |
| 16 | P2 | `D1-68` | region 优先级 HW_REGION 先（SPEC） | HUAWEICLOUD_REGION 应优先 | `credentials.mjs:225` | 待裁决 |
| — | 非产品 | `D3-S2` | VPC router 配额耗尽（环境） | — | 共享账号配额 | 不提单 |

- **非产品缺陷**：D3-S2 真云 CreateVpc 被 `VPC.0114 Quota exceeded for resources: ['router']` 阻断，为共享账号多机并发 + 历史泄漏 VPC 累积导致，非产品代码缺陷，不计入提单（【补环境】）。
- **已修复（1.1.10）**：D3-S3 沙箱预览出 URL（`publicUrl` + HTTP 200），本轮不提单。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | D1-39 为 Windows 专属 P0 用例，当前 OS=Linux 不适用；Linux 侧由 EXP-NR3-10 代表覆盖 |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 改用例/补环境 | 跨服务复合编排（RDS+沙箱+连接串注入+归零）超出每日单服务真云探针范围，建议转专项隔离执行 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始凭证/未脱敏日志；只读子账号经 run-as-readonly.py 注入）
- [x] 写操作误判 read-only：`0`（D4-4/D4-5 写操作正确 deny/confirm，Change* 漏拦截为该反向缺陷）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK 明文；D2-4/D8-9/D4-26 为「脱敏不完整」缺陷而非泄漏事件

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（testbot1-hermes-ecs-*） | 已删（提交删除+手动补删） | `ListServersDetails` count=0 |
| VPC/subnet（D3-C1） | 是（testbot1-hermes-e2e-*） | 已删（手动补删） | `ListVpcs` 无 testbot1-hermes 残留 |
| OBS（D3-C2/D3-C13） | 是 | 已删（rm-object + 删桶） | 归零校验通过 |
| 历史空桶（hdk1-c13-26631096） | 历史泄漏 | 已补删 | 空桶删除成功 |
| FunctionGraph（D3-S6） | 是 | 已删 | `ListFunctions` 无 hdk1-s6 残留 |
| 沙箱（D3-C3/D3-C6/D3-S3） | 是 | close_session 关闭 | 会话已清理 |

> 真云只删本次创建资源（testbot1-hermes-* / hdk1-* 本轮时间戳前缀），动态盘点后补删本轮泄漏 ECS/VPC/subnet + 历史空桶。共享账号中 `testbot3-*` 为其他并发客户端资源，未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级）、`D8-9`（sanitizeValue 脱敏），均由维护方裁决契约。
- 本轮未覆盖（说明范围）：`D1-39`（Windows 专属）、`D3-S7`（跨服务 RDS+沙箱复合编排，超出每日单服务范围）。
- 建议：①将 `Change` 补入 `writeOperationPrefixes`；②serviceCatalog 补「云主机」同义词；③realcloud_e2e ECS/VPC 删除改为主动轮询至归零（不信任提交 exit code）；④沙箱 deploy_nginx 端口冲突递增后 ok 标志修正；⑤共享测试账号 router/VPC 配额扩容或每日测后强制归零泄漏资源。