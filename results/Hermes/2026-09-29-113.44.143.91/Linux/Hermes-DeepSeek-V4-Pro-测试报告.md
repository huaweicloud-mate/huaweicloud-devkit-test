# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-09-29 09:20（北京时间）
> **执行归档**：`results/Hermes/2026-09-29-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项，均历史复现）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux`（aarch64，ecs-hd-ai-work-00-0007） |
| 被测版本（SUT） | `1.1.7`（npm latest，gitHead `7456d05`，merge PR #813 release-1.1.7） |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：36 支探针全量 fresh 执行（源码级直调探针 d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix/protocol-probe/eval-harness 等 + CLI 冒烟 probe-cli/probe-hook/probe-d158 + 真云 E2E realcloud-s3-d414/realcloud-newcases + D9-12/13 源码级补充探针），证据落盘 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `143` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `118 / 23 / 0 / 2 / 2` |
| 通过率（分母 = PASS+FAIL+SPEC = 143） | `82.5%` |
| P0 / P1 / P2 新增缺陷 | `3 / 17 / 3`（另有 SPEC-MISMATCH 2） |
| 红线（I 类）违规 | `0`（凭证/命令包裹类缺口为源码规则缺口，非运行期凭证泄漏事件） |
| 资源释放 | 真云 E2E 全部归零（见 §七） |

> **版本差异说明**：v1.1.7（gitHead `7456d05`）与 2026-09-28 完全一致，无任何代码变更。今日 36+ 支探针 fresh 全量重跑，23 项 FAIL + 2 项 SPEC-MISMATCH 全部**按根因原样复现**，均为历史缺陷（见 HISTORY_LINKS.md），无新缺陷。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单（历史复现） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `2` | 契约漂移（D1-68、D8-9） |
| NOT_RUN | `1` | D3-S7（真云跨服务交付未在本次探针范围） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `29` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 服务矩阵 DMS/DEW + 中文意图路由 miss（EXP-E01~E14） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `1` | EXP-E08（诊断意图需真实 Agent 会话） |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D4-5` | 写操作误判检测 | `safety/policy.json` writeOperationPrefixes 缺 `Change` 前缀 → `ChangeServerOs*`/`ChangeVpc` 误判 read-only | 历史复现 |
| 2 | P0 | `D4-16` | 命令包裹穿透 | `src/safety-policy.mjs:398-428` env-dump 词边界 `(^|\s)` 不匹配 `sh -c "..."` 内层；stripExecutable 解包未回溯到文本规则 | 历史复现 |
| 3 | P0 | `D9-12` | initialize 握手协议安全基线 | `src/mcp-protocol.mjs` dispatch 无 initialize 状态机，非法时序 tools/list 未返回 -32600（已提单 #814） | 历史复现 |
| 4 | P1 | `D1-70` | 代理配置与 WebSocket 代理 | `src/proxy/proxy-config.mjs:42-47` no_proxy 仅 hostname 后缀匹配，无 CIDR 网段 | 历史复现 |
| 5 | P1 | `D3-S1` | 场景-只读查ECS | `src/tools.mjs` serviceCatalog routeMap 英文-only，中文「查云主机」未命中 ECS | 历史复现 |
| 6 | P1 | `D3-S3` | 场景-沙箱预览出URL | 沙箱 DevBridge 隧道未建立，公网 URL 不可达 | 历史复现 |
| 7 | P1 | `D4-27` | 双路径输出脱敏 | `src/safety-policy.mjs:45` 脱敏正则大小写敏感无 `/i`，小写 `ak=`/`sk=` 漏脱敏 | 历史复现 |
| 8 | P1 | `EXP-C4-14` | DMS · D3-C4 | serviceCatalog list_operations 返回 `unsupported=true`，DMS 服务创建类回归未完整支持 | 历史复现 |
| 9 | P1 | `EXP-C4-18` | DEW · D3-C4 | 同上（DEW） | 历史复现 |
| 10-21 | P1 | `EXP-E01~E14` | 中文意图路由 miss（11 条） | `src/tools.mjs` serviceCatalog routeMap 英文-only，中文意图 fallback `Run hcloud --help` | 历史复现 |
| 22 | P2 | `D3-S5` | 场景-复合意图分层路由 | `src/tools.mjs` routeMap 英文-only；全角逗号 `，` 不拆分 | 历史复现 |
| 23 | P2 | `D4-25` | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^|[A-Za-z0-9])` 未命中空格分隔操作名 → 落 cli:invoke | 历史复现 |
| 24 | P2 | `D4-26` | findings 证据脱敏 | `src/risk-rule-engine.mjs` redactEvidence 正则不匹配 JSON 带引号 key | 历史复现 |
| 25 | P2(SPEC) | `D1-68` | 图标离线与区域环境变量 | `src/auth/credentials.mjs:171,222,352` HW_REGION 优先于 HUAWEICLOUD_REGION | 契约漂移 |
| 26 | P2(SPEC) | `D8-9` | 安装 ID 与遥测值脱敏 | `src/telemetry/telemetry.mjs:189` sanitizeValue 仅折叠空白+截断，未敏感值脱敏 | 契约漂移 |

### 根因详情（关键 FAIL/SPEC）

- **D4-5 / D4-16（P0，凭证/写操作安全规则缺口）**：`safety/policy.json` 写操作前缀缺 `Change`，`safety-policy.mjs` env-dump 检测与 shell 解包边界不完整，属源码静态规则缺口（可直调复现），非运行期泄漏。
- **D9-12（P0，协议安全基线）**：`mcp-protocol.mjs` `dispatch()` 无 initialize 状态跟踪，`tools/list` 分支无条件返回 TOOL_DEFINITIONS，非法时序不返回 -32600。今日源码级探针 `probe-d9-1213.mjs` 复核：`dispatch('tools/list')` 未 initialize 返回 40 工具 → FAIL。已提单 #814。
- **serviceCatalog 中文意图路由（D3-S1/S5 + EXP-E01~E14 + D10-3 同源）**：`tools.mjs` routeMap 23 条路由仅 sandbox/voucher 含 CJK 关键词，其余英文-only；评级集基线 21.4% MISS。
- **小写 ak=/sk= 脱敏（D4-27）**：`safety-policy.mjs:45` `(AK|SK)\s*[:=]` 大小写敏感无 `/i`（v1.1.7 已加 `token`/`adminPass` 处理但未覆盖小写 ak/sk）。
- **DMS/DEW 服务支持（EXP-C4-14/18）**：`list_operations` 返回 `unsupported=true`，D3-C4 服务创建类回归中 DMS/DEW 未完整支持。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 需真云跨服务交付(Web+RDS) 建删并归零，本次真云探针仅覆盖 S1-S4/C13/D4-14 | 【补环境】真云跨服务复合交付场景未纳入本轮探针集 |
| `EXP-E08` | D10评测集 | 诊断意图（ECS 启动失败分析） | 诊断意图需真实 Agent 会话行为，源码级 serviceCatalog 无诊断映射 | 【改用例】诊断类意图无确定性 routeMap 映射 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无运行期凭证泄漏`（真云 E2E 均经脱敏输出，凭证据 evidence/ 复核无明文 AK/SK）
- [x] 写操作误判 read-only：`D4-5 Change* 误判 read-only（源码规则缺口，历史复现 #671 相关）`
- [x] 红线（I 类）违规：`0 新违规`（D4-5/D4-16 等为已知规则缺口，已在上游 open 单跟踪）
- [x] 脱敏复核：`D4-27 小写 ak=/sk= 漏脱敏（历史 P1，上游 #770/#683 等跟踪中）`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-S1 只读查） | 0（只读） | 0 | 只读未创建 |
| VPC（D4-14 建删+CTS） | 1 | 1 | `vpc=true zero=true`（realcloud-s3-d414） |
| CTS 追踪（D4-14） | 1 | 1 | `ctsCreate=true`，测后清理 |
| OBS（D3-C13 托管） | 1 | 1 | `set/get/del=true`（realcloud-newcases） |
| 领券闭环（D3-S4） | — | — | `claimed=true`（无资源残留） |

> 真云用例均为「最低配置创建 → 测后删除归零」，只删本次创建资源；`fresh-realcloud-*.txt` 记录归零验证结果。

---

## 八、遗留与建议

1. **P0 收敛（维护者）**：#814（D9-12 initialize 时序）、D4-5/D4-16（写操作与命令包裹安全规则）三处 P0 建议下一迭代优先修复，修复后复测 `safety-policy.mjs`/`mcp-protocol.mjs`。
2. **serviceCatalog 中文意图路由**（D3-S1/S5、EXP-E01~E14、D10-3）：routeMap 需补齐 ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等中文关键词映射，并支持全角逗号/复合意图拆分。
3. **小写 ak=/sk= 脱敏**（D4-27、D2-4 同源）：`safety-policy.mjs` redactString 正则加 `/i` 或不区分大小写。
4. **DMS/DEW 服务支持**（EXP-C4-14/18、D3-C4）：补齐 DMS/DEW 的 list_operations 服务矩阵支持。
5. 本轮无新缺陷，23 FAIL + 2 SPEC 均为 v1.1.7 既有缺陷原样复现，详见 HISTORY_LINKS.md。