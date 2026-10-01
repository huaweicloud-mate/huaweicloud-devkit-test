# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-02 05:38:00（北京时间）
> **执行归档**：`results/AtomCode/2026-10-02-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷：P0 1 项 / P1 3 项 / P2 1 项 + SPEC-MISMATCH 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux（ecs-hd-ai-work-00-0003）` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（npm next；源码 gitHead `ffd7b47`；dist-tags latest=1.1.7 / next=1.1.8-next.1） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS，较 1.1.7 的 40 新增 1 工具） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 全绿` |
| 真云凭证 | `cn-north-4（AK/SK 已配置，账号统一 hw018619646）` |
| 测试类型 | 源码级探针直调 / 夹具 harness / MCP 协议探针 / 真机 CLI / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；`eval/harness` 18 fixtures run-all + protocol-probe + run-eval；supplement 源码级直调；`scripts/realcloud_e2e.mjs` 真机建删；CLI 真机（doctor/--help/--version/status）。结果落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（仅 D1-39 Windows-OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `134 / 5 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `96.4%` |
| P0 / P1 / P2 新增缺陷 | `1 / 3 / 1` |
| 红线（I 类）违规 | `1`（D2-4 凭证脱敏 JSON 键值形态漏脱敏 → I 类凭证明文泄漏风险） |
| 资源释放 | `全部归零（ECS/subnet/VPC/OBS 仅本次创建，已删）` |

> **关键对比（vs 1.1.7）**：1.1.8-next.1 已修复多个 1.1.7 缺陷——D4-16 命令包裹穿透（sh -c wrap now deny）、D4-6 adminPass 空格分隔漏脱敏、D4-23 全局规则注入（files 白名单含 rules/ + setup-cli 注入）、D3-S1/S3/S6/S7 中文场景路由（routeMap 补齐中文关键词）、D10-3 路由准确率 21.4% → **92.9%**。剩余缺陷 6 项（见 §四）。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9 capabilities.cancellation） |
| NOT_RUN | `1` | D1-39 Windows-OS 专属 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS |
| BLOCKED | `0` | 环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏对 JSON 键值形态漏脱敏 | `redactSecrets({"ak":"…","sk":"…","token":"…"})` 应全部脱敏为 `<redacted>` | 原样返回，未脱敏 | `safety-policy.mjs:34-47` | I | 待提单 |
| 2 | P1 | `D4-27` | 双路径输出脱敏漏小写 ak=/sk= | `ak=`/`sk=` 值与 `token=` 一样脱敏 | `token=<redacted> ak=明文 sk=明文` | `safety-policy.mjs:47` | I | 待提单 |
| 3 | P1 | `EXP-E01` | 中文意图「云主机」未路由 ECS | 「云主机」意图应命中 ECS | 返回 `Run hcloud --help` | `tools.mjs:1970-1983` | P | 待提单 |
| 4 | P1 | `D9-2` | JSON-RPC 非法参数未返回 -32602 | 非法 params 应返回 `-32602` | 无 error 对象 | `mcp-protocol.mjs:57-60` | P | 待提单 |
| 5 | P1 | `D9-9` | capabilities 未声明 cancellation（SPEC-MISMATCH） | `capabilities.notifications.cancellation` 应声明 | 未声明 | `mcp-protocol.mjs:46-48` | P | 待提单 |
| 6 | P2 | `D8-9` | 遥测值未脱敏 | 遥测值凭证应脱敏 | `sanitizeValue('AK=…')` 原样返回 | `telemetry/telemetry.mjs:189-196` | I | 待提单 |

### 根因详情

**#1 D2-4（P0，I 类）**：`safety-policy.mjs:34-47` — `redactString` 键名正则仅覆盖 `access_key|secret_key|token|password|admin_pass|credential` 长形（:42-45）与大写 `AK|SK`（:47），且只匹配 `key=value`/`key:value` 分隔，不识别 JSON `"key":"value"` 结构。复现：`redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}')` 原样返回。证据 `evidence/D2-4/stdout.log`（d2-auth redact-json FAIL + supplement 直调）。

**#2 D4-27（P1，I 类）**：`safety-policy.mjs:47` — 仅有 `(AK|SK)\s*[:=]` 大写短形，缺小写 `ak`/`sk`。复现：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` → `token=<redacted> ak=AKID456 sk=secret789`。证据 `evidence/D4-27/stdout.log`。

**#3 EXP-E01（P1）**：`tools.mjs:1970-1983` — ECS routeMap 关键词含「云服务器/服务器/虚拟机/镜像」但缺「云主机」。run-eval D10-3 实测 HIT=13 MISS=1 N/A=1（92.9%），唯一 MISS 即 EXP-E01。证据 `evidence/EXP-E01/stdout.log`。

**#4 D9-2（P1）**：`mcp-protocol.mjs:57-60` — `tools/list` 分支直接返回工具列表，无 params 类型校验。protocol-probe `D9-2b invalid-params` → 期望 -32602，实际无 error 对象。证据 `evidence/D9-2/stdout.log`。

**#5 D9-9（P1，SPEC-MISMATCH）**：`mcp-protocol.mjs:46-48` — `capabilities` 仅声明 `tools`，未声明 `notifications.cancellation`。protocol-probe `D9-9a` → 实际未声明。证据 `evidence/D9-9/stdout.log`。

**#6 D8-9（P2，I 类）**：`telemetry/telemetry.mjs:189-196` — `sanitizeValue` 仅裁剪空白/长度，未调 `redactSecrets`。复现：`sanitizeValue('AK=ABC123XYZ')` 原样返回。证据 `evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属：Windows 升级检测链 EINVAL 专属；Linux 侧由 d1-upgrade `queryDistTagsSync-no-EINVAL` + NR3 终端矩阵代表覆盖，无需在 Linux 判 NOT_RUN 之外的归属 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**发现 1 项 I 类**（D2-4 JSON 键值形态凭证未脱敏；safety-policy.mjs:34-47）
- [x] 写操作误判 read-only：未发现（D4-5 DeleteServers/CreateServers 均正确判 deny 非 read-only）
- [x] 红线（I 类）违规：`1`（D2-4 凭证脱敏缺口，已入缺陷清单）
- [x] 脱敏复核：D4-27（ak/sk 小写）与 D8-9（遥测 sanitizeValue）补充脱敏缺口，均已记根因

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（testbot3-hermes-ecs-0889682727） | realcloud D3-C1 CreateServers | 删除 job `ff808081a0ed1f3901a0f95c806d49c3`（异步超时后补删） | `ListServersDetails count=0` ✓ |
| VPC（f747cfa3） | realcloud D3-C1 CreateVpc | DeleteVpc | `ListVpcs current_count 仅剩非本次创建项` ✓ |
| Subnet（f742e887） | realcloud D3-C1 CreateSubnet | DeleteSubnet | 随 VPC 删除 ✓ |
| OBS 桶（testbot3-hermes-obs-0889682727） | realcloud D3-C2 建桶 + 静态站 | 删桶归零 | `ListBuckets` 无残留 ✓ |

> 全部真云资源仅本次创建、已删除并归零验证；未动非本次创建的 `testbot3-hermes-e2e-0716192372`（他次运行）。

---

## 八、遗留与建议

- **D9-9 SPEC-MISMATCH 待裁决**：MCP 协议 `capabilities.notifications.cancellation` 未声明，需产品侧确认是否在正式版补齐。
- **路由别名补全**：`routeMap` ECS 关键词建议补「云主机」别名（EXP-E01），即可将 D10-3 准确率推至 100%。
- **凭证脱敏 I 类两项（D2-4/D4-27）建议优先修复**：`redactString` 增加 JSON 键值形态识别 + 小写 `ak`/`sk` 短形，消除凭证明文泄漏面。
- **遥测脱敏（D8-9）建议**：`sanitizeValue` 内部调用 `redactSecrets`，避免遥测事件残留凭证。
- **1.1.8-next.1 回归向好**：D4-16/D4-6/D4-23/D3-S/D10-3 等 1.1.7 缺陷已修复，建议升级到正式版时纳入回归确认清单。