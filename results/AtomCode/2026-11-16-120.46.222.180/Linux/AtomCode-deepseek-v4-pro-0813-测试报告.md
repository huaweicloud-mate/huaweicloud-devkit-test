# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-16 05:26:03（北京时间）
> **执行归档**：`results/AtomCode/2026-11-16-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.14-next.5` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行（install/doctor/status/hcloud）；真云 E2E（`scripts/realcloud_e2e.mjs`：ECS/VPC/子网/OBS/沙箱真机建删归零）；MCP 协议直调。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 13 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `91.0%` |
| P0 / P1 / P2 新增缺陷 | `1 / 9 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/子网/OBS/沙箱 session 均已删/关）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
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
| 1 | P0 | `D2-4`/`D4-27` | D2/D4 | 凭证脱敏漏小写 ak/sk 与 JSON 键名 | `safety-policy.mjs:34-45` | 待提单（FINDINGS #1） |
| 2 | P1 | `D3-S1`/`D3-S2`/`D3-S3`/`D3-S5`/`EXP-E01` | D3 | serviceCatalog 中文意图含英文服务名路由 miss | `tools.mjs:2587-2613` | 待提单（FINDINGS #2） |
| 3 | P1 | `D3-C7` | D3 | 跨区域写操作未预警 token 项目不匹配 | `tools.mjs:2925/3045-3046` | 待提单（FINDINGS #3） |
| 4 | P2 | `D4-25` | D4 | Python hook 写命令误判 cli:invoke | `hooks/huaweicloud-safety.py:46` | 待提单（FINDINGS #4） |
| 5 | P2 | `D8-9` | D8 | sanitizeValue 不脱敏 AKSK | `telemetry/telemetry.mjs:190-197` | 待提单（FINDINGS #5） |
| 6 | P1 | `D9-9` | D9 | MCP 未声明 cancellation（SPEC-MISMATCH） | `mcp-protocol.mjs:60-62` | 待裁决（FINDINGS #6） |
| 7 | — | `D1-3` | D1 | doctor 健康自检（Node < 22.19） | 环境：本机 Node v22.13.0 | 不提单（FINDINGS #7） |
| 8 | — | `D3-C1` | D3 | ECS E2E 归零轮询窗偏短 | 测试侧：150s < ECS 异步删除耗时 | 不提单（FINDINGS #8） |
| 9 | — | `D3-C2` | D3 | OBS「建桶」断言误判 false | 测试侧：断言关键字匹配缺陷 | 不提单（FINDINGS #9） |

### 根因详情

> 逐条前缀/根因/证据见同目录 `FINDINGS.md`（`file_issue.py` 解析输入）。核心代码级根因：

- **#1 [P0] 凭证脱敏**：`redactString()`（`safety-policy.mjs:34-45`）键名正则仅覆盖大写 `(AK|SK)\s*[:=]` 与全称键紧跟冒号/等号结构，不覆盖小写 `ak=`/`sk=` 与 JSON `"ak":"`（键值间夹 `"`），致明文泄露。证据 `evidence/D2-4/{stdout.log,probe.mjs}`、`evidence/D4-27/`。
- **#2 [P1] serviceCatalog 路由**：`tools.mjs:2587` 分词 `it.split(/[\s,./-]+/)` 不切「中英无空格」，英文关键词仅 `tokens.has(kw)` 全等匹配（:2591）→ 命中空 → fallback（:2611-2613）。证据 `evidence/D3-S{1,2,3,5}/`、`evidence/EXP-E01/`。
- **#3 [P1] 跨区域引导**：`getRegionalAvailability`（`tools.mjs:2925`）静态缓存 + disclaimer（:3045-3046），`planHcloudCommand` 未做 token 项目绑定预检。证据 `evidence/D3-C7/`。
- **#4 [P2] hook 遥测**：`huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 边界不匹配空格前导写命令。证据 `evidence/D4-25/`。
- **#5 [P2] sanitize 脱敏**：`telemetry.mjs:190-197` `sanitizeValue()` 仅空白/长度处理，无 AKSK 脱敏。证据 `evidence/D8-9/`。
- **#6 [P1 SPEC] MCP 取消语义**：`mcp-protocol.mjs:60-62` `capabilities:{tools:{}}` 未声明 cancellation。证据 `evidence/D9-9/`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（升级检测链 EINVAL 专属），Linux 下由 NR3 终端矩阵按负面/环境验证代表覆盖，本 OS 不适用 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4/D4-27/D8-9 为「脱敏功能缺口」缺陷，未发生真实生产凭证外泄；探针使用测试假凭证）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始真实凭证；真云 AK/SK 未落盘于 evidence

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，`9660d29a…`） | 是 | 已删（探针提交 + 代理补删） | `ListServersDetails` count=0 |
| VPC + 子网（D3-C1，`5b931bf8…`/`572327ef…`） | 是 | 已删（先删子网再删 VPC） | `ListVpcs` 无 `testbot3-hermes-e2e-*` 残留 |
| OBS 桶（D3-C2，`testbot3-hermes-obs-4777489874`） | 是 | 已删 | `rm` 返回 successfully，归零 |
| 沙箱 session（D3-C3/D3-C6，`71a94ace36`） | 是 | 已关 | `close_session` 返回 ok |

> 真云只删本次创建资源（唯一时间戳命名）；D3-C1 探针的 150s ECS 删除轮询窗短于异步删除耗时，探针结束后代理手工核验并补删，ECS/VPC/子网最终归零。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` MCP `tools/call` 未声明 cancellation/notifications/cancel（SPEC-MISMATCH，见 FINDINGS #6）。
- 环境备注：本机 `~/.config/huaweicloud/proxy.json` 原含占位代理 `proxy.example:8080`，致真云/沙箱路径代理解析失败；本轮已清空该代理并重跑 D3-C1/C2/C3/C6 得真实结果（D3-C3/C6 通过），备份见 `proxy.json.bak-20261116`。建议维护侧排查该占位代理的来源。
- 建议：收敛 serviceCatalog 中文意图路由与凭证脱敏（P0）两项为优先修复项。
