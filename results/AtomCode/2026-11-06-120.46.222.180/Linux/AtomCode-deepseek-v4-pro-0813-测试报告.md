# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-06 05:20（北京时间）
> **执行归档**：`results/AtomCode/2026-11-06-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04.4，Node v22.13.0 / Python 3.12.3） |
| 被测版本（SUT） | `v1.1.13`（npm latest，hdk gitHead `8a6d8be2`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS.length） |
| hcloud / 依赖 | `hcloud` 7.x 已配置（doctor 自检通过） |
| 真云凭证 | `cn-north-4`（AK/SK 预置 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（已按客户端+OS 预筛） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数产出决策/结果，写 `stdout.log`；CLI 真机执行记录日志；D3-C1/C2/C3/C6 走 `scripts/realcloud_e2e.mjs` 真云建删资源；D10 评测集走 `run-eval.mjs` serviceCatalog 路由。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = 设计级 OS 专属 D1-39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145，不含 BLOCKED/NOT_RUN） | `91.0%` |
| P0 / P1 / P2 新增缺陷（产品缺陷，不含测试侧） | `1 / 6 / 3` |
| 红线（I 类）违规（凭证脱敏类） | `2`（D2-4 未脱敏 JSON 凭证 / D4-27 小写 ak=sk= 泄漏） |
| 资源释放 | `全部归零`（D3-C1 ECS 已补删复核归零；D3-C2 桶已删；D3-C3/C6 会话已关；D3-C7 EIP 未创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单（含 3 测试侧） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | D9-9 契约漂移（cancellation 未声明） |
| NOT_RUN | `1` | D1-39 Windows 专用（OS 专属豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏未覆盖 JSON 字符串形态 ak/sk/token | JSON 中 `ak`/`sk`/`token` 值须全部 `<redacted>` | 原样返回 `AKID123456`/`secret789`/`TOKEN123` | `safety-policy.mjs:42-45` | P | 待提单 |
| 2 | P1 | `D4-27` | 双路径输出脱敏小写 ak=/sk= 未覆盖 | 小写 `ak=`/`sk=` 须替换占位符 | 输出 `ak=AKID456 sk=secret789` 明文 | `safety-policy.mjs:42,45` | P | 待提单 |
| 3 | P1 | `D3-S1/D3-S2/D3-S3` | serviceCatalog 场景路由缺失回落 help | 须路由到 ECS/VPC/sandbox | 回落 `Run hcloud --help...` | `tools.mjs:2300,2551-2553` | I | 待提单 |
| 4 | P2 | `D3-S5` | 复合意图分层路由缺失 | 须命中分层路由 | 回落 help | `tools.mjs:2300,2551-2553` | I | 待提单 |
| 5 | P1 | `EXP-E01` | 中文“查华北北京四云主机”路由 MISS | 期望 ECS → run_readonly | 回落 help | `tools.mjs:2300,2551-2553` | I | 待提单 |
| 6 | P2 | `D4-25` | Python hook 写命令遥测分类错误 | 写动词须命中 `cli:write` | 降级为 `cli:invoke` | `huaweicloud-safety.py:46,111-112` | I | 待提单 |
| 7 | P2 | `D8-9` | 安装 ID/遥测值脱敏缺失 | 凭证形态值须占位符 | 原样返回 `AK=ABC123XYZ` | `telemetry.mjs:190-197` | P | 待提单 |
| 8 | P1 | `D9-9` | MCP 未声明 cancellation/notifications | `initialize.capabilities` 须含取消能力 | 仅 `tools:{}`（SPEC-MISMATCH） | `mcp-protocol.mjs:51-53` | P | 待提单 |
| 9 | 测试侧 | `D3-C1` | ECS 异步删除轮询窗口不足 | 归零校验 | 150s 未确认归零（已补删归零） | 探针轮询上限（非产品） | - | 不计单 |
| 10 | 测试侧 | `D3-C2` | obsutil mb 成功建桶仍非零退出码 | 建桶成功 | 探针误判建桶失败（桶实际已删） | obsutil 退出码（非产品） | - | 不计单 |
| 11 | 测试侧 | `D3-C7` | 跨区域建 EIP 被 IAM token 项目绑定拒绝 | 跨区域建 EIP | `VPC.0501` 项目与区域不匹配 | 凭证作用域（非产品） | - | 不计单 |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

- **D2-4 / D4-27**：`src/safety-policy.mjs:34-47` `redactString` 凭证正则 `/((?:access[_-]?key|secret[_-]?key|…|token|…)\s*[:=]\s*)/gi` 未收录短键 `ak`/`sk`，且 `/(AK|SK)\s*[:=]/` 区分大小写、无法命中 JSON 双引号键 `"ak"` / 小写 `ak=`/`sk=`。证据 `evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`。
- **D3-S* / EXP-E01**：`src/tools.mjs:2298-2533` `serviceCatalog` 的 `routeMap` 内置关键词不覆盖多类中文场景意图；空命中回落 `Run hcloud --help`（`tools.mjs:2551-2553`）。证据 `evidence/D3-S1..S5/stdout.log`、`evidence/EXP-E01/stdout.log`。
- **D8-9**：`src/telemetry/telemetry.mjs:190-197` `sanitizeValue` 仅去换行/截断无脱敏。证据 `evidence/D8-9/stdout.log`。
- **D9-9**：`src/mcp-protocol.mjs:51-53` `capabilities` 仅 `{ tools: {} }`。证据 `evidence/D9-9/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属：Windows 升级检测链 EINVAL 语义；OS 列标注「专属」，Linux 由 d1-upgrade `queryDistTagsSync` no-EINVAL 代表覆盖（展开级 EXP-NR3-10 未下发至 Linux 客户端） |

> 分类：【调归属】——该设计级用例为 Windows 专属，本客户端为 Linux，属 OS 专属豁免，无需改用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`2` 项——D2-4（JSON 凭证未脱敏）、D4-27（小写 ak=/sk= 泄漏），均属「脱敏不完整」类，非 hook 拦截失效导致的外部命令执行泄漏。
- [x] 写操作误判 read-only：`0`（D4-5/9/18/19/20 写操作审批门均 `deny`/`deny/read-only` 正确）。
- [x] 红线（I 类）违规：`2`（D2-4/D4-27 凭证脱敏缺陷，I 类安全红线）。
- [x] 脱敏复核：D4-2/D4-3/D4-5/D4-6 均 `deny` 或 `<redacted>` 正常；仅 D2-4/D4-27/D8-9 三处脱敏缺口。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（testbot3-hermes-e2e-*） | D3-C1 创建 1 个 | 反序删除 | subnet:OK vpc:OK |
| 子网 | D3-C1 创建 1 个 | 反序删除 | OK |
| ECS（c6.large.2 + GPSSD 40G） | D3-C1 创建 1 个（`13124247-2547-4ebc-bd61-e6796494f145`） | DeleteServers 提交 | 150s 内未确认 → 已补删并复核从云上消失（归零） |
| OBS 桶（testbot3-hermes-obs-*） | D3-C2 创建 1 个 | `OBS rm` | 删桶归零 success |
| 沙箱会话（D3-C3/C6） | 连接 ws | close_session | 会话关闭 ok |
| EIP（跨区域） | D3-C7 建 EIP 被拒未创建 | - | total_count=0 |

> 真云用例均真机执行：D3-C1/C2/C3/C6 建删资源，唯一残留（D3-C1 ECS）已在本次补删后复核归零；无本次资源残留。

---

## 八、遗留与建议

- **待裁决 SPEC**：D9-9（MCP `initialize.capabilities` 缺 `cancellation`/`notifications`）——是否纳入 MCP 协议契约需维护者裁决。
- **历史问题复核**：D2-4 / D4-27 / D3-S* / EXP-E01 / D4-25 / D8-9 / D9-9 与 2026-11-05 及更早 FINDINGS 高度一致，属历史缺陷延续，提单时须历史查重，命中则不复开单、仅补复核评论。
- **修复建议**：① `redactString` 增加短键 `ak`/`sk`（不分大小写）+ JSON 双引号键形态匹配（`safety-policy.mjs:42-45`）；② `serviceCatalog` routeMap 扩充 D3/D10 中文场景意图关键词（`tools.mjs:2300`）；③ `sanitizeValue` 复用 `redactSecrets` 脱敏（`telemetry.mjs:190`）；④ `mcp-protocol.mjs` capabilities 增补 `cancellation`/`notifications`。
- **测试侧建议**：D3-C1 ECS 归零轮询窗口由 150s 上调（ECS 异步删除偶发超时）；D3-C2 改以“桶列表/二次查询”判建桶成功而非依赖 obsutil 退出码；D3-C7 跨区域建资源需配套跨区域项目凭证或明确标注为凭证约束预期。