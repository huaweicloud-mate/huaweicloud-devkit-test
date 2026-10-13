# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-14 05:25（北京时间）
> **执行归档**：`results/AtomCode/2026-10-14-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项；红线脱敏缺陷 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.8`（npm latest，gitHead `74f519d`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调（函数级断言，如 `redactString`/`serviceCatalog`/`judgeUpdate`/`classifyTextCommand`）+ MCP 协议探针（`protocol-probe.mjs` 发 initialize/tools/list/tools/call）+ 评测 harness（`run-eval.mjs` 路由核对）+ 真云 E2E 真机（`realcloud_e2e.mjs`：ECS/VPC/OBS/沙箱建删归零）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另有 1 条 OS 专属用例结构性豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 11 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `92.4%` |
| P0 / P1 / P2 新增缺陷 | `1 / 6 / 3`（另有 1 条测试侧 + 1 条非产品缺陷）；SPEC-MISMATCH 1 项 |
| 红线（I 类）违规 | `2`（D2-4 JSON 凭证脱敏、D4-27 小写 ak/sk 脱敏） |
| 资源释放 | 全部真云资源已归零（ECS count=0、OBS 删桶成功、沙箱 close_session） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | 未执行（D1-39 Windows 专属，OS 专属豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:34-62` | 历史问题，不复提单 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS | `tools.mjs:2212-2222` | 历史问题，不复提单 |
| 3 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | `tools.mjs:2212-2222` | 历史问题，不复提单 |
| 4 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | `tools.mjs:1986-2113` | 历史问题，不复提单 |
| 5 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:45` | 历史问题，不复提单 |
| 6 | P1 | `D9-9` | D9协议 | 取消能力未声明（SPEC-MISMATCH） | `mcp-protocol.mjs:47-49` | 历史问题，不复提单 |
| 7 | P1 | `EXP-E01` | 评测集 | 中文「云主机」未路由 | `tools.mjs:2212` | 历史问题，不复提单 |
| 8 | P2 | `D3-S5` | D3功能 | 复合意图分层路由 | `tools.mjs:2212-2222` | 历史问题，不复提单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 遥测分类 | `hooks/huaweicloud-safety.py:46` | 历史问题，不复提单 |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:189-195` | 历史问题，不复提单 |
| 11 | 测试侧 | `D3-C1` | D3功能 | ECS生命周期E2E | 测试 harness 150s 轮询窗口过短（非产品缺陷） | 不计入提单 |
| 12 | 非产品缺陷 | `D3-C7` | D3功能 | 跨区域 EIP 建删 | 账户级 region/project 绑定阻断（VPC.0501） | 不计入提单 |

### 根因详情

- **D2-4**：`redactSecrets('{"ak":"AKID...","sk":"...","token":"..."}')` 原样返回，JSON 键值形态漏脱敏。根因 `safety-policy.mjs:34-62`（`redactString` 不 `JSON.parse`，`(AK|SK)\s*[:=]` 不匹配带引号 JSON 键）。证据 `evidence/D2-4/stdout.log`。
- **D3-S1/D3-S2/D3-S3/D3-S5/EXP-E01**：中文意图分词粘连，`service_catalog` 返回 `Run hcloud --help`（MISS）。根因 `tools.mjs:2212-2222`（英文 `ecs/vpc/sandbox` 需精确 token 命中，CJK 语段粘连成单 token 不命中）。证据对应 `evidence/<ID>/stdout.log`。
- **D4-27**：小写 `ak=`/`sk=` 值明文残留。根因 `safety-policy.mjs:45`（`(AK|SK)` 仅大写）。证据 `evidence/D4-27/stdout.log`。
- **D9-9**：`initialize` 返回 `capabilities: { tools: {} }`，未声明 `notifications.cancellation`。根因 `mcp-protocol.mjs:47-49`。证据 `evidence/D9-9/stdout.log`。
- **D4-25**：空格分隔写命令被分类为 `cli:invoke` 而非 `cli:write`。根因 `hooks/huaweicloud-safety.py:46`。证据 `evidence/D4-25/stdout.log`。
- **D8-9**：`sanitizeValue('AK=ABC...')` 明文残留。根因 `telemetry/telemetry.mjs:189-195`。证据 `evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「升级检测链 EINVAL 专属 Windows」，本机为 Linux，按状态口径结构性豁免（Linux 侧由 d1-upgrade 探针 + 展开级 NR3 代表覆盖）。分类【调归属】。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无生产凭证泄漏；测试注入的假 AK/SK 无外泄。
- [x] 写操作误判 read-only：无（D4-5 高危写命令均判 deny/allow 写，未误判只读）。
- [x] 红线（I 类）违规：`2` 项——D2-4（JSON 凭证脱敏失效）、D4-27（小写 ak/sk 脱敏失效），均已定位根因并入 FINDINGS。
- [x] 脱敏复核：已复核，漏脱敏点集中在 `safety-policy.mjs` 的 `redactString`（JSON 键值 + 小写键形态）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | CreateServers 返回 serverIds | DeleteServers 提交 | 150s 轮询窗口内未确认，测试后人工补删并确认 `count=0` |
| VPC/子网（D3-C1） | CreateVpc/CreateSubnet | DeleteSubnet/DeleteVpc | OK 归零 |
| OBS 桶（D3-C2） | hcloud OBS mb | OBS rm 删桶 | successfully 归零 |
| 沙箱会话（D3-C3/D3-C6） | sandbox_connect + upload/deploy | sandbox_close_session | 会话关闭（"ok"） |
| 跨区域 EIP（D3-C7） | 创建被 VPC.0501 阻断（未建成） | — | total_count=0 归零 |

---

## 八、遗留与建议

- **中文意图路由（高频根因，合 5 条缺陷）**：`serviceCatalog` 对 CJK 语段粘连分词无同义词命中，建议补中文关键词表（云主机→ECS、沙箱/预览→Sandbox、物联网/时序数据→DDS/GaussDB 等）。
- **凭证脱敏统一键名策略（D2-4/D4-27/D8-9）**：`redactString` 建议对键名大小写不敏感、并对 JSON 字符串先 `JSON.parse` 递归脱敏；`sanitizeValue` 缺失敏感值过滤。
- **D9-9 SPEC-MISMATCH 待裁决**：`capabilities` 是否需声明 `notifications.cancellation` 由维护者裁决（本测按「未声明即 SPEC-MISMATCH」记录）。
- 全部产品缺陷均命中上游历史 issue，本次不复提单，详见 `HISTORY_LINKS.md`。