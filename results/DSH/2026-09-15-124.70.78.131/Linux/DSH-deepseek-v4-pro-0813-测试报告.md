# DSH-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：2026-09-15 09:35（北京时间）
> **执行归档**：`results/DSH/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（P0 缺陷 6 项：凭证脱敏/凭证 env 拦截/明文 secret API/命令替换与包裹绕过/全局规则未注入，仍存在于 v1.1.4 正式版）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256e`，PR #669 release-1.1.4） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 已确认） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS 实测，较文档声明的 39 多 1） |
| 真云凭证 | cn-north-4（AK/SK 已配置，本轮仅用只读 ListVpcs 冒烟，未创建资源） |
| 测试类型 | 源码级探针（.mjs 直调 hdk 导出函数）/ 真机 CLI（install/status/doctor/install-hcloud）/ MCP 协议 / 只读真云冒烟 |
| daily 用例 | 设计级 81 / 展开级 39（预筛剔除 32 条非本客户端/OS） |

> **执行方法**：探针脚本（.mjs）直调 `plugins/huaweicloud-core/src/*` 导出函数（safety-policy / risk-rule-engine / update-check / mcp-protocol / auth / tools），决策与结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。auth 用例以 `HUAWEICLOUD_HOME`/`HCLOUD_OBS_CONFIG_PATH`/`HCLOUD_CONFIG_PATH` 隔离到临时目录，未触碰真实凭证文件。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 120（设计 81 + 展开 39） |
| 已执行 | 120 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 62 / 22 / 36 / 0 / 0 |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED） | 73.8%（62/84） |
| P0 / P1 / P2 新增缺陷 | 6 / 3 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮仅 1 次只读 ListVpcs，无资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 39 | 有证据且通过 PASS 门禁 |
| FAIL | 10 | 不符预期，根因见缺陷清单（9 项回归 + 1 项新发现） |
| BLOCKED | 32 | 环境阻塞（真云 E2E/互动确认流/Windows 专属/评测集/压测基线），见阻塞项 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 23 | 有证据且通过 PASS 门禁（服务矩阵只读规划 18 + D5 客户端矩阵 2 + 路由命中 3） |
| FAIL | 12 | 中文意图路由 miss（EXP-E 评测集 12 条） |
| BLOCKED | 4 | ECS/RDS/CCE/WAF 需真云轻量创建→释放归零 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

> 10 项缺陷中 9 项为 v1.1.4-next.6 已提单缺陷在 **v1.1.4 正式版未修复**的复现；#3（kms DecryptData 明文 secret API 未拦截）为本轮新确认。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 小写 `ak=`/`sk=`（obsutilconfig 格式）脱敏漏 | `ak=AK123456 sk=SKsecret` 应替换为 `<redacted>` | 返回原文未脱敏 | `safety-policy.mjs:45` | P | 待提单 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截缺 `HW_` 前缀 | `printenv HW_ACCESS_KEY` → `deny` | 返回 `allow`（`HW_` 漏网） | `safety-policy.mjs:336` | P | 待提单 |
| 3 | P0 | D4-3 | `hcloud kms DecryptData` 明文 secret API 未拦截 | `DecryptData` → `deny` | 返回 `allow/unknown_read` | `safety-policy.mjs:349`(+177) | P | 待提单 |
| 4 | P0 | D4-15 | hook 命令替换绕过（`$(...)` + ANSI-C） | `hcloud $(echo $'E\x43S...')` → `deny` | 返回 `allow` | `risk-rule-engine.mjs:50-53` | P | 待提单 |
| 5 | P0 | D4-16 | shell 包裹穿透（`bash -c`/`sh &&`） | 内层 `hcloud ...Delete*/Create*` → `deny` | 返回 `allow` | `safety-policy.mjs:345` | P | 待提单 |
| 6 | P0 | D4-23 | 全局规则 `huawei-agent-rules.mdc` 未随安装注入 | install 后目标目录应含规则文件 | install 后 `found=0`，`package.json files` 无 `rules` | `package.json:8` files 数组 | P | 待提单 |
| 7 | P1 | D4-17 | hook 畸形输入 fail-open（应 fail-closed） | 畸形制品应默认 `deny` | 返回 `allow`、`findings=[]` | `risk-rule-engine.mjs:106` | — | 待提单 |
| 8 | P1 | D9-2 | JSON-RPC 未知方法未返回结构化 `-32601` | 未知方法 `code===−32601` | 抛普通 `Error`，`code` undefined | `mcp-protocol.mjs:95` + `mcp-server.mjs:169` | — | 待提单 |
| 9 | P1 | D10-3 | serviceCatalog 中文意图路由大量 miss | 中文意图「创建云服务器」→ ECS | 3/15 命中，余返回 `Run hcloud --help` | `tools.mjs:1776-1907` routeMap 英文-only | — | 待提单 |
| 10 | P2 | D8-1 | 文档与能力漂移（39 vs 40 工具） | 文档工具数 = `TOOL_DEFINITIONS.length` | 文档 39，实测 40 | `hdk/AGENTS.md:27,45` | — | 待提单 |

### 根因详情（代表性）

```javascript
// #1 D2-4  safety-policy.mjs:45  (case-sensitive, 无 i, 缺 ak/sk)
.replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')

// #2 D4-2  safety-policy.mjs:336  (缺 HW_ 前缀)
/HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)

// #6 D4-23  package.json:8  files 数组（缺 "rules"）
["cordis.patch.yml","bin",".agents","plugins/huaweicloud-core",...]  // ← 无 "rules"
```

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D2-1 / D2-2 / D3-C4 / D3-C2 类 | 真云三端同步/组合枚举/服务创建删除归零 | 真云 AK/SK + KooCLI/OBS/沙箱 | 真云 E2E 账号配额 |
| D4-18 / D4-19 / D4-20 / D4-24 | 互动确认流（confirm-not-deny）+ 真云写操作 | 实时对话框 | 交互式客户端 |
| D1-39 / EXP-NR3 Windows | Windows 升级检测链（EINVAL/文件锁） | Windows | Windows 机器 |
| D10-1 / D10-2 / D10-4 / D10-5 | 真实 Agent 评测集（工具描述/skill 激活/安全干预/多轮完成率） | 真实 Agent + 评测集 | 评测集就绪 |
| D6-1 / D6-3 / D6-4 / D9-5 / D9-6 / D9-7 / D9-9 | 压测/超时/并发/跨客户端互通基线 | 压测环境 | 压测基线 |
| EXP-C4 ECS/RDS/CCE/WAF | 轻量创建→立即释放→归零 | 真云 | 真云 E2E |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（auth 用例全部以临时目录隔离，真实凭证仅用于只读 ListVpcs 冒烟）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（未创建/删除任何真云资源）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（AK/SK 均为造数占位符）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/RDS/CCE/WAF/VPC 等 | 否 | — | 未创建（本轮仅只读 ListVpcs） |

> 真云只删本次创建资源；本轮无资源创建，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：无（本轮无 SPEC-MISMATCH）。
- 本轮未覆盖（范围）：真云 E2E（D2/D3-C4/EXP-C4 创建释放）、互动审批流（D4-18/19/20/24）、Windows 专属（D1-39）、真实 Agent 评测集（D10）、压测/跨客户端（D6/D9-5/6/7/9）。
- 建议：`v1.1.4` 正式版仍携带 next.6 已提单的 9 项安全/协议/路由缺陷（含 6 项 P0），建议在下个 release 前优先修复 #1/#2/#3/#4/#5/#6（P0 凭证与安全门）；同时补齐 KMS `DecryptData` 明文 secret 拦截（本轮新确认）。
