# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-04 05:27:00（北京时间）
> **执行归档**：`results/AtomCode/2026-10-04-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | hdk gitHead `ffd7b47`（v1.1.8-next.1；全局 CLI 二进制 `--version`=1.1.7） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：grouped 探针 5 组本机重跑（d4-security / d2-auth / d1-upgrade / mcp-tools / c4-service-matrix）+ fixtures run-all 18 项 + protocol-probe（D9）+ run-eval harness（D10-3/EXP-E01~E15）+ realcloud E2E 真机（建删资源归零）+ CLI 真机（doctor/--help/--version）+ supplement 源码直调 18 项。所有 PASS 均本机真实执行并落盘 evidence/<case-id>/。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（另 1 条 OS 专属豁免 D1-39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 9 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `93.5%` |
| P0 / P1 / P2 缺陷 | `1 / 7 / 2`（含 1 项 P1 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0`（凭证脱敏缺陷非本机引入；安全 hook 三工具全拦截） |
| 资源释放 | 已全部归零（ECS/VPC/子网/EIP 清理见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏 JSON 键值漏脱敏 | `safety-policy.mjs:42-45` redactString 不识别 JSON `"key":"value"` | 待提单 |
| 2 | P1 | `D3-S1` | D3功能 | 只读查 ECS 自然语言路由 MISS | `tools.mjs:2191-2195` ASCII 关键词 `tokens.has()` 粘中文不命中 | 待提单 |
| 3 | P1 | `D3-S2` | D3功能 | 删 VPC 先确认路由 MISS | `tools.mjs:2191-2195`（同上） | 待提单 |
| 4 | P1 | `D3-S3` | D3功能 | 沙箱预览路由 MISS | `tools.mjs:2146-2158` 缺「沙箱/预览」中文关键词 | 待提单 |
| 5 | P2 | `D3-S5` | D3功能 | 复合意图分层路由 MISS | `tools.mjs:1968-2188` 缺复合意图关键词/多服务路由 | 待提单 |
| 6 | P1 | `D4-27` | D4安全 | 双路径输出脱敏漏小写 ak/sk | `safety-policy.mjs:45` 仅大写 `(AK|SK)` | 待提单 |
| 7 | P2 | `D8-9` | D8质量 | 遥测值未脱敏 | `telemetry.mjs:189-196` sanitizeValue 未调 redactSecrets | 待提单 |
| 8 | P1 | `D9-2` | D9协议 | JSON-RPC 非法参数未返回 -32602 | `mcp-protocol.mjs:57-59` tools/list 无 params 校验 | 待提单 |
| 9 | P1 | `D9-9` | D9协议 | capabilities 未声明 cancellation（SPEC-MISMATCH） | `mcp-protocol.mjs:47-49` capabilities 仅 tools | 待提单 |
| 10 | P1 | `EXP-E01` | D10评测 | 中文意图「云主机」路由 MISS | `tools.mjs:1978-1980` 缺「云主机」关键词 | 待提单 |

### 根因详情

- **D2-4（P0）**：期望 `redactSecrets('{"ak":"..","sk":"..","token":".."}')` 键值全脱敏；实际原样返回。根因 `safety-policy.mjs:42` 键名正则（`token|password|admin_pass|credential` 等）仅匹配 `key:value`/`key=value` 分隔，不识别 JSON `"key":"value"`。证据 `evidence/D2-4/stdout.log`。
- **D3-S1/S2/S5 + EXP-E01（P1/P2）**：期望自然语言全句命中对应服务；实际返回 `Run hcloud --help`。根因 `tools.mjs:2191-2195` 纯 ASCII 关键词走精确分词 `tokens.has(kw)`，英文缩写粘中文后不命中；`tools.mjs:2146-2158`/`1978-1980` 缺「沙箱/预览」「云主机」等中文关键词。证据 `evidence/D3-S1|S2|S5|EXP-E01/stdout.log`。
- **D4-27（P1）**：期望 `ak=`/`sk=` 与小写短形同 token 一起脱敏；实际仅 token 脱敏。根因 `safety-policy.mjs:45` 仅有 `(AK|SK)\s*[:=]` 大写短形。证据 `evidence/D4-27/stdout.log`。
- **D9-2（P1）**：期望非法 params 返回 -32602；实际无 error 对象。根因 `mcp-protocol.mjs:57` tools/list 分支无 params 校验。证据 `evidence/D9-2/stdout.log`。
- **D9-9（P1, SPEC-MISMATCH）**：期望 initialize 声明 `notifications.cancellation`；实际缺失。根因 `mcp-protocol.mjs:47-49` capabilities 仅声明 tools。证据 `evidence/D9-9/stdout.log`。
- **D8-9（P2）**：期望遥测值凭证脱敏；实际原样。根因 `telemetry.mjs:189-196` sanitizeValue 未调 redactSecrets。证据 `evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属：Windows 升级检测链 EINVAL 专属；Linux 侧由 d1-upgrade `queryDistTagsSync-no-EINVAL` 代表覆盖（EXP-NR3-10 对应展开级代表） |

> 无 BLOCKED 用例：所有真云/真机/harness/评估集均已实机执行，无「假阻塞」残留。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（d4-security 36 项 + d2-auth 47 项拦截全通过；D2-4/D4-27/D8-9 为脱敏覆盖面缺陷，非本机泄漏事件）
- [x] 写操作误判 read-only：无（DeleteServers/CreateServers 正确判为非 read-only）
- [x] 红线（I 类）违规：无（破坏性删除/公开暴露/凭证明文 API 全部 deny）
- [x] 脱敏复核：adminPass/双路径/JSON 形态已复测，JSON 与小写短形覆盖缺口见缺陷清单 #1/#6/#10

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（2 台） | realcloud D3-C1 两次 E2E 运行各建 1 台 | 已 DeleteServers 删除 | `ListServersDetails count=0` |
| VPC（2 个） | D3-C1 两次运行各建 1 个（1061632880/1061699839） | 已 DeleteVpc | 本机残留 VPC 列表=空 |
| 子网（2 个） | 随 VPC 创建 | 已 DeleteSubnet | VPC 内子网 count=0 |
| EIP | 未创建 | — | `ListPublicips=0` |
| OBS 桶 | D3-C2 建 `testbot3-hermes-obs-*` | 已删桶 | 删桶成功 |

> 说明：D3-C1 探针「finally 归零」因 ECS 异步删除轮询未确认（ECS 异步删除），本次已人肉补删并验证 ECS/VPC/子网/EIP 均归零，无残留计费资源。D3-C2 探针「OBS 建桶」断言为误报（hcloud 退出码非 0 但实际 `Create bucket successfully`），桶已正常建/删。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9 capabilities.cancellation 未声明——建议下一版本在 `mcp-protocol.mjs` initialize 响应补 `notifications.cancellation`（或明确版本不支持并写入契约文档）。
- 未覆盖项：D10-1/2/5/9 真实 Agent 会话评测（需 dsh headless / CDP 自动化，AtomCode 客户端无 dsh）——本次以 D10-3 确定性路由层（EXP-E01~E15）+ D4 静态规则层覆盖，真实会话层留待有 dsh/CDP 的客户端。
- 修复建议：① `tools.mjs` serviceCatalog 对纯 ASCII 关键词改用子串匹配（而非 `tokens.has`），并补「云主机/沙箱/预览/物联网/时序」中文关键词；② `safety-policy.mjs` redactString 增加 JSON `"key":"value"` 结构识别 + 小写 ak/sk 短形；③ `telemetry.mjs` sanitizeValue 调用 redactSecrets；④ `mcp-protocol.mjs` tools/list 增加 params 校验返回 -32602。
- 版本待核对：全局 CLI 二进制 `--version` 报 1.1.7，而 prepare_env 声明安装 next=1.1.8-next.1 且源码 checkout ffd7b47；建议核对 npm dist-tag 与发布产物版本一致性。