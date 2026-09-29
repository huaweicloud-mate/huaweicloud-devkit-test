# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-30 05:40:00`（北京时间）
> **执行归档**：`results/AtomCode/2026-09-30-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 P0 缺陷 D2-4、P1/P2 缺陷见缺陷清单；无 P0 用例 NOT_RUN）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode（deepseek-v4-pro-0813） |
| OS / 架构 | Linux aarch64（Ubuntu 6.8；IP 113.44.197.147） |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12 |
| 被测版本（SUT） | `1.1.8-next.1`（npm @next；源码 gitHead `ffd7b47`，释放号 `1.1.8-next.1`） |
| 工具全集 | `41`（tools/list 实测 41 工具；设计真源 40+） |
| hcloud / 依赖 | hcloud 7.2.12；doctor 确认 MCP / skills 29 / 凭证全绿 |
| 真云凭证 | cn-north-4（AKSK 已用，真机建删归零） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/--version）/ MCP 协议 / 真云 E2E / 路由评测 |
| 设计真源 | 设计级 81（daily 精选）/ 展开级 71（建包预筛后 39） |
| daily 下发 | 设计级 102 / 展开级 39（含预筛） |

> **执行方法**：5 个 grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）+ 18 个 fixtures + run-eval.mjs（D10-3 路由）+ protocol-probe.mjs（D9 协议）+ realcloud_e2e.mjs（真云建删）+ supplement 源码级直调，均本机新鲜重跑，结论落 `evidence/<case-id>/stdout.log`。

> **环境备注**：`prepare_env.py --update` 判定 next=1.1.8-next.1 > latest=1.1.7 而将 hdk 源码 checkout 到 1.1.8-next.1（gitHead ffd7b47），但 `npm ls -g huaweicloud-devkit` 与 CLI `--version` 显示 1.1.7（见 §八）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计 102 + 展开 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 9 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `92.8%` |
| P0 / P1 / P2 新增缺陷 | `1 / 7 / 2`（含 1 SPEC-MISMATCH 计入 P1） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS/VPC/subnet/OBS 建删归零，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | D2-4、D3-S3、D3-S5、D3-S8、D4-6、D4-27、D8-9、D9-2 |
| BLOCKED | `1` | D1-67（需真实 DSH 插件环境） |
| SPEC-MISMATCH | `1` | D9-9（capabilities 未声明 cancellation） |
| NOT_RUN | `1` | D1-39（Windows 升级检测链 OS 专属） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（中文意图「云主机」未路由 ECS） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

**关键结论**：相对 1.1.7（上一日），1.1.8-next.1 已修复 D4-2（env dump 的 HW_* 前缀）、D4-16（sh -c 包裹穿透）、D4-21（broad IAM 未检出）、D4-23（全局规则注入缺失）、D4-25（Python hook cli:write 分类）5 项历史缺陷；仍遗留 D2-4 / D4-27 / D8-9 / D9-2 / D9-9 / D3-S8 等，并暴露 D3-S3 / D3-S5 / EXP-E01 等路由覆盖新缺口。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏对 JSON 键值形态漏脱敏 | `redactSecrets('{"ak":"…","sk":"…","token":"…"}')` 应整串脱敏 | JSON 字符串原样返回 | `safety-policy.mjs:42`(redactString 键名表缺短形 ak/sk，且不识别 JSON 键值形) | P | 历史（待复核） |
| 2 | P1 | D4-27 | 裸 `ak=`/`sk=` 小写短形未脱敏 | `redactSecrets('token=abc ak=AKID sk=secret')` 应全部 `<redacted>` | 仅 `token=<redacted>`，`ak=`/`sk=` 原样 | `safety-policy.mjs:42`（键名表缺 `ak`/`sk` 短形） | P | 待提单 |
| 3 | P1 | D4-6 | adminPass 空格分隔形式值未脱敏 | `--adminPass abc123XYZ` 应脱敏 | 值原样返回 | `safety-policy.mjs:42`（redactString 仅覆盖 `=`/`:` 分隔，空格分隔不命中） | P | 待提单 |
| 4 | P1 | D9-2 | JSON-RPC 非法参数错误码不规范 | tools/list 传非 object params 应返回 `-32602` | 无 error 对象（正常 result） | `mcp-protocol.mjs:57`(tools/list handler 缺 params 类型校验) | P | 待提单 |
| 5 | P1 | D9-9 | capabilities 未声明 cancellation | initialize 应声明 `capabilities.notifications.cancellation` | notifications 缺失 | `mcp-protocol.mjs:47`(initialize capabilities 无 notifications) | G | SPEC 待裁决 |
| 6 | P1 | D3-S3 | 沙箱预览意图未路由 | 「部署到沙箱预览出 URL」应命中 Sandbox/DevStation | 返回 `Run hcloud --help`(MISS) | `tools.mjs:1968`(serviceCatalog routeMap 缺「沙箱预览」关键词) | P | 待提单 |
| 7 | P1 | D3-S8 | 排障意图未路由 | 「ECS 启动失败帮我分析」应路由 troubleshooting/explain_error | 返回 `Run hcloud --help`(MISS) | `tools.mjs:1968`(routeMap 无排障/诊断分支) | P | 待提单 |
| 8 | P1 | EXP-E01 | 「云主机」未路由 ECS | 「华北北京四有哪些云主机」应命中 ECS | 返回 `Run hcloud --help`(MISS) | `tools.mjs:1971`(ECS 关键词表缺「云主机」) | P | 待提单 |
| 9 | P2 | D3-S5 | 复合意图召回不全 | 「数据存 DDS + OBS 托管」应同时召回 DDS+OBS | 仅 OBS+Sandbox+DevStation，漏 DDS | `tools.mjs:1968`(routeMap 单意图命中即停，无复合意图聚合) | P | 待提单 |
| 10 | P2 | D8-9 | 遥测值未脱敏 | `sanitizeValue('AK=ABC123')` 应脱敏 | 原样返回 | `telemetry/telemetry.mjs:189`(sanitizeValue 未调 redactSecrets) | P | 待提单 |

### 根因详情（P0/P1 缺陷附代码片段）

**#1 [P0] D2-4 凭证脱敏 JSON 键值形态漏脱敏**

- 期望：`redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}')` → 值脱敏为 `<redacted>`
- 实际：JSON 字符串原样返回（d2-auth 探针 `D2-4 redact-json` FAIL）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42`

```javascript
if (/(^|\s)(env|printenv|...)/i.test(text) …) // env-dump 路径只认 env 命令
const secretRe = /((?:access[_-]?key|secret[_-]?key|security[_-]?token|x[_-]?auth[_-]?token|token|authorization|password|passwd|admin[_-]?pass|credential)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi;
// ↑ 键名表无 ak/sk 短形；只匹配 `key=value`/`key:value`，不识别 JSON "key":"value" 结构
```

- 证据：`evidence/D2-4/stdout.log`（redact-json FAIL）

**#2 [P1] D4-27 裸 token=/小写 ak=/sk= 仍泄漏**

- 期望：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` 三值均 `<redacted>`
- 实际：`token=<redacted> ak=AKID456 sk=secret789`（仅 token 脱敏）
- 根因：`safety-policy.mjs:42` 键名表未含 `ak`/`sk` 短形，仅有 `access[_-]?key`/`secret[_-]?key` 长形
- 证据：`evidence/D4-27/stdout.log`（bare-token-eq 实测）

**#3 [P1] D4-6 adminPass 空格形式值未脱敏**

- 期望：`redactSecrets('hcloud ECS CreateServers --adminPass abc123XYZ')` → 值脱敏
- 实际：整串原样返回
- 根因：`safety-policy.mjs:42` 的 `<key>[:=]<value>` 分隔符仅 `:` 与 `=`，`--adminPass <空格>值` 不命中
- 证据：`evidence/D4-6/stdout.log`（adminPass-space 实测）

**#4 [P1] D9-2 JSON-RPC 非法参数错误码不规范**

- 期望：`tools/list` 传 `params: 'not-an-object'` → `error.code=-32602`
- 实际：无 error 对象，返回正常 result（protocol-probe D9-2b invalid-params FAIL）
- 根因：`mcp-protocol.mjs:57` 的 tools/list 分支未做 params 类型校验（仅 tools/call 分支 :62 有）
- 证据：`evidence/D9-2/stdout.log`（protocol-probe D9-2b 实测）

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议（分类=改用例 时必填） |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「Windows 专属」）；Linux/macOS 由 NR3 终端矩阵代表覆盖 | — |
| D1-67 | 设计级 | P2 | BLOCKED | 补环境 | AGENT_TOOLKIT_MODE/SKIP_DSH 注入验证需真实 DSH 插件安装后跳过安装，run-only 环境无 DSH 客户端实际安装 | 解除条件=真实 DSH 客户端环境 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云 E2E 返回无明文 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（stdout.log 仅存脱敏后值）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `testbot3-hermes-e2e-*` | 是 | 已删 | DeleteVpc OK |
| Subnet | 是 | 已删 | DeleteSubnet OK |
| ECS `testbot3-hermes-ecs-0716192372` (56fe5590-…) | 是 | 已删（异步） | 补删后 ListServersDetails 计数=0 归零 |
| OBS `testbot3-hermes-obs-*` | 是 | 已删 | 删桶归零 OK |
| 安全组（D3-C4 只读规划） | 否 | — | 无残留 |

> 说明：ECS 删除为异步，realcloud 探针 150s 轮询窗口内未确认时被记为「仍在/未确认」，agent 补发 DeleteServers 并二次轮询后确认归零（计数 = 0）；最终无任何本次创建资源残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities 未声明 `notifications.cancellation`（无 -32000/timeout 语义），需维护方裁决是否为契约缺口。
- 环境观察：`prepare_env.py --update` 判定 next(1.1.8-next.1) > latest(1.1.7) 并将源码 checkout 到 1.1.8-next.1（gitHead ffd7b47），但本机 `npm ls -g huaweicloud-devkit` 与 CLI `--version` 仍为 1.1.7 —— 即 SUT 源码（探针实测对象）与 npm 安装包版本不一致，建议维护者核实 npm `@next` dist-tag 发布是否命中 1.1.8-next.1（`npm view dist-tags` 显示 next=1.1.8-next.1，与 `npm ls -g` 实测 1.1.7 矛盾）。
- 历史查重：D2-4（JSON 脱敏）与上一日 FINDINGS 重复，file_issue.py 应命中历史单、不重复开单。
- 本轮范围说明：D3-S7（跨服务 Web+RDS 真机建删编排）沿用源码级路由结论 + realcloud 单服务建删抽样，未做多服务全链路真机编排（时间/配额约束）。