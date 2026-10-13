# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-10 05:26:47（北京时间）
> **执行归档**：`results/AtomCode/2026-10-10-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64`（Ubuntu 24.04.4 LTS） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.2`（npm @next，gitHead `681895da`） |
| 工具全集 | `40+`（`tools.mjs` TOOL_DEFINITIONS） |
| 真云凭证 | `cn-north-4`（AK/SK 已配置；本日子集无建删 E2E 用例，未触发真云建删） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（gitHead 681895da = 被测包对应版本），运行时计算 status 落 `stdout.log`；MCP 协议用例经 `mcp-server.mjs` stdio 真实收发 JSON-RPC；D10 评测集经 `huaweicloud_service_catalog` 真实路由判定；Python hook 用例经 `hooks/huaweicloud-safety.py` 真实执行并核对 `hook-events.jsonl` 事件键。证据统一落 `evidence/<case-id>/`，全部在本机真实重跑。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 9 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `93.5%` |
| P0 / P1 / P2 新增缺陷 | `1 / 5 / 3`（另 1 项 P1 SPEC-MISMATCH D9-9；均历史复现，无新增） |
| 红线（I 类）违规 | `0`（凭证类缺陷均源码级直调复现，未触发真实凭证泄漏） |
| 资源释放 | `本次零建删`（本日子集无真云建删 E2E 用例，未创建/遗留任何云端资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注「专属」） |
| **合计** | **`102`** | |

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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:34-48` redactString 不识别 JSON 带引号键 | 历史复现 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:2194-2199` 英文关键词精确 token 匹配，CJK 粘连 | 历史复现 |
| 3 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | `tools.mjs:2194-2199` 同上 | 历史复现 |
| 4 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | `tools.mjs:2149-2162` sandbox 路由缺「沙箱/预览」CJK 关键词 | 历史复现 |
| 5 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:2194-2199` 复合意图关键词缺失 | 历史复现 |
| 6 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 左边界 | 历史复现 |
| 7 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:48` (AK\|SK) 大小写敏感，漏小写 ak/sk | 历史复现 |
| 8 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:189-195` sanitizeValue 无脱敏 | 历史复现 |
| 9 | P1 | `EXP-E01` | D10评测集 | 中文「云主机」路由 | `tools.mjs:2194-2199` 同 D3-S1 | 历史复现 |
| 10 | P1 | `D9-9` | D9协议 | capabilities 未声明 cancellation | `mcp-protocol.mjs:47-49` capabilities 仅 tools{} | SPEC-历史 |

### 根因详情

> 10 项缺陷与本轮真实重跑结果一致，但**均属历史缺陷原样复现**（gitHead 681895da 相对上一轮 ffd7b47 仅 tools.mjs 技能命名 + sandbox session 改动，未触及上述缺陷点）；D9-2（上一轮 FAIL「非法参数未返回 -32602」）本轮实测已修复（`mcp-protocol.mjs:67-77` 已对未知工具/未知方法/非法参数正确返回 -32602/-32601），故不再列入。完整断言/根因/证据见 `FINDINGS.md`。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属（OS 列标注「专属」），Linux 无该语义 | Linux 侧已由 d1-upgrade queryDistTagsSync-no-EINVAL 代表覆盖，无需改 |

> 其余 NOT_RUN / BLOCKED 无。展开级已在 init_day 建包时按 agent+OS 预筛，非本客户端/OS 的用例未下发。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（脱敏类缺陷均为源码级直调复现，探针输入全部为测试样例值，未输出真实 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-5 delete/create-not-readonly 断言通过）
- [x] 红线（I 类）违规：`无`（D2-4/D4-27/D8-9 脱敏缺陷未触发真实凭证泄漏）
- [x] 脱敏复核：证据目录无真实凭证/未脱敏日志（探针全部使用测试样例值）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / VPC / 子网 / OBS / RDS / 沙箱 | 否 | — | 本日子集无建删 E2E 用例（D3-C1/C2/C3/C6 未下发），全程零建删 |

> 本日 daily 子集（设计级 102 + 展开级 39）不含「建删资源」真云 E2E 用例；D3-C4/EXP-C4 系列为「只读规划冒烟」（list_operations + plan 只读命令），D3-S4/S7 验证的是 serviceCatalog 确定性路由层，均未触发任何云端资源创建，故无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 cancellation）—— MCP 标准能力缺失，建议版本补齐或明确契约。
- 本轮确认修复：`D9-2`（JSON-RPC 非法参数/未知工具/未知方法已正确返回 -32602/-32601），上一轮 FAIL 已闭合。
- 本轮未覆盖：真实 Agent 会话评测（AtomCode 无 DSH，D10-1/2/5/9 执行器属 DSH 客户端专属；本客户端走 `huaweicloud_service_catalog` 确定性路由层已覆盖 D10-3 的 EXP-E01~E15）。
- 建议：`tools.mjs` serviceCatalog 路由分词对 CJK 粘连段（如「4的ecs」「些云主机」）应改用子串包含策略；sandbox 路由补 CJK「沙箱/预览」关键词；`safety-policy.mjs` 脱敏补 JSON 键形态与小写 ak/sk；`hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 左边界对齐 `\b`。
