# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-13 06:12（北京时间）
> **执行归档**：`results/AtomCode/2026-10-13-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64`（Ubuntu） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8`（npm latest，gitHead `74f519d`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置；本日含建删 E2E 用例 D3-C1/C2/C3/C6/C7，已真机执行并归零） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，运行时计算 status 落 `stdout.log`；MCP 协议用例经 `mcp-server.mjs`/`protocol-probe` 真实收发 JSON-RPC；D10 评测集经 `huaweicloud_service_catalog` 真实路由判定；真云建删 E2E（D3-C1/C2/C3/C6/C7）经 `scripts/realcloud_e2e.mjs` + 真机 hcloud SDK 真实创建/删除并归零验证。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 11 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `92.4%` |
| P0 / P1 / P2 缺陷 | 设计级 P0 1（D2-4）+ P1/P2 共 10 项 FAIL + 1 项 SPEC-MISMATCH（D9-9）；展开级 1 项 P1 FAIL（EXP-E01）。其中 devkit 源码缺陷 10 项为历史复现，D3-C1/D3-C7 为非产品缺陷（测试侧 / 账户级） |
| 红线（I 类）违规 | `0`（凭证类缺陷均源码级直调复现，探针输入均为测试样例值，未触发真实凭证泄漏） |
| 资源释放 | `真机建删并归零`（D3-C1 ECS/VPC/子网、D3-C2 OBS 桶、D3-C3/C6 沙箱会话、D3-C7 EIP 均已清理；D3-C1 的 ECS 真机删除为异步，已在补测中手动确认 count=0/vpcs=[]） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:34-45` redactString 不识别 JSON 带引号键 | 历史复现 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS | `tools.mjs:2212-2222` 英文关键词精确 token 匹配 CJK 粘连 | 历史复现 |
| 3 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | `tools.mjs:2212-2222` 同上 | 历史复现 |
| 4 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | `tools.mjs:1986-2113` sandbox 路由缺「沙箱/预览」CJK 关键词 | 历史复现 |
| 5 | P1 | `EXP-E01` | D10评测 | 中文「云主机」路由 | `tools.mjs:2212` 同 D3-S1 | 历史复现 |
| 6 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:45` (AK\|SK) 大小写敏感漏小写 | 历史复现 |
| 7 | P1 | `D9-9` | D9协议 | capabilities 未声明 cancellation | `mcp-protocol.mjs:47-49` 仅 tools{} | SPEC-历史 |
| 8 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E 归零 | `scripts/realcloud_e2e.mjs` 清理逻辑缺陷（测试侧） | 测试侧 |
| 9 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导 | 账户级 project 绑定 cn-north-4（VPC.0501）（非产品缺陷） | 账户级 |
| 10 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:2212-2222` 复合关键词缺失 | 历史复现 |
| 11 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 左边界 | 历史复现 |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:189-195` sanitizeValue 无脱敏 | 历史复现 |

> 10 项 devkit 源码缺陷（D2-4/D3-S1/D3-S2/D3-S3/EXP-E01/D4-27/D9-9/D3-S5/D4-25/D8-9）与本轮真实执行一致，均属历史缺陷原样复现（gitHead 74f519d 未触及上述缺陷点）。D3-C1 为测试侧 harness 清理缺陷、D3-C7 为账户级 region 边界，均非 devkit 产品缺陷（详见 FINDINGS.md §11/§12）。凭证类缺陷均为源码级直调复现，未触发真实凭证泄漏。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 语义专属（OS 列标注「专属」），Linux 无该语义；Linux 侧由 D1-40 镜像 lag 检测代表覆盖，无需改。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（脱敏类缺陷均为源码级直调复现，未输出真实 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-5 delete/create-not-readonly 断言通过）
- [x] 红线（I 类）违规：`无`（D2-4/D4-27/D8-9 脱敏缺陷未触发真实凭证泄漏）
- [x] 脱敏复核：证据目录无真实凭证/未脱敏日志（探针全部使用测试样例值）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，c6.large.2） | 是 | 是（异步，>150s） | 补测手动删除后 `ListServersDetails count=0` |
| VPC / 子网（D3-C1） | 是 | 是 | `ListVpcs vpcs=[]` 归零 |
| OBS 桶（D3-C2） | 是 | 是 | `OBS rm successfully` 归零 |
| 沙箱会话（D3-C3/C6） | 是 | close_session | `"ok"` 归零 |
| EIP（D3-C7，ap-southeast-3） | 否（VPC.0501 阻断） | — | `ListPublicips total_count=0` 归零 |

> 本日真云建删 E2E 真实执行：D3-C1 的 ECS/VPC/子网、D3-C2 的 OBS 桶、D3-C3/C6 的沙箱会话均已清理归零；D3-C7 因账户 project 绑定 cn-north-4 未在 ap-southeast-3 实际创建资源，EIP 归零验证通过。无计费资源残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 cancellation）—— MCP 标准能力缺失，建议版本补齐或明确契约。
- 测试侧改进：`scripts/realcloud_e2e.mjs` D3-C1 清理应①轮询删除窗口放长（ECS 异步删除常 >150s）②按依赖顺序删除（先 ECS 归零→再子网→再 VPC），避免 hcloud 返回 exit 0 但资源未真删。
- 账户能力：D3-C7 跨区域真实创建受账户 project 绑定（cn-north-4）限制，如需全量覆盖 ap-southeast-3 需开通该 region 或提供 region-scoped project token。
- 建议：`tools.mjs` serviceCatalog 路由分词对 CJK 粘连段应改用子串包含策略；sandbox 路由补 CJK「沙箱/预览」关键词；`safety-policy.mjs` 脱敏补 JSON 键形态与小写 ak/sk；`hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 左边界对齐 `\b`。
- 本轮未覆盖：真实 Agent 会话评测（AtomCode 无 DSH，D10-1/2/5/9 执行器属 DSH 客户端专属；本客户端走 `huaweicloud_service_catalog` 确定性路由层已覆盖 D10-3 的 EXP-E01~E15）。