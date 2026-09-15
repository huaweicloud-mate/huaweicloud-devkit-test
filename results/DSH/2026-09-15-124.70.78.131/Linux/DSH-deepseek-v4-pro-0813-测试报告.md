# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 13:07（北京时间）
> **执行归档**：`results/DSH/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（P0 缺陷 6 项：凭证脱敏/凭证 env 拦截/明文 secret API/命令替换与包裹绕过/全局规则未注入，仍存在于 v1.1.4 正式版）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（Ubuntu，`landlock-run` 沙箱，工作区可写） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256e`，PR #669 release-1.1.4） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS 实测） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 已确认） |
| 真云凭证 | cn-north-4（AK/SK 已配置，本轮仅只读 ListVpcs 冒烟，未创建资源） |
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
| 通过率（分母 = PASS+FAIL，不含 BLOCKED/NOT_RUN） | 73.8%（62/84） |
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
| BLOCKED | 32 | 环境阻塞（真云 E2E/互动确认流/Windows 专属/评测集/压测基线），见 §五 |
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

> 10 项缺陷中 9 项为已提单缺陷在 **v1.1.4 正式版未修复**的复现；#3（kms DecryptData 明文 secret API 未拦截）为本轮新确认。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 小写 `ak=`/`sk=`（obsutilconfig 格式）脱敏漏 | `ak=AK123456 sk=SKsecret` 应替换为 `<redacted>` | 返回原文未脱敏 | `safety-policy.mjs:45` | P | 待提单 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截缺 `HW_` 前缀 | `printenv HW_ACCESS_KEY` → `deny` | 返回 `allow`（`HW_` 漏网） | `safety-policy.mjs:336` | P | 待提单 |
| 3 | P0 | D4-3 | `hcloud kms DecryptData` 明文 secret API 未拦截 | `DecryptData` → `deny` | 返回 `allow/unknown_read` | `safety-policy.mjs:349`(+177) | P | 待提单 |
| 4 | P0 | D4-15 | hook 命令替换绕过（`$(...)` + ANSI-C） | `hcloud $(echo $'E\x43S...')` → `deny` | 返回 `allow` | `risk-rule-engine.mjs:50-53` | P | 待提单 |
| 5 | P0 | D4-16 | shell 包裹穿透（`bash -c`/`sh &&`） | 内层 `hcloud ...Delete*/Create*` → `deny` | 返回 `allow` | `safety-policy.mjs:345` | P | 待提单 |
| 6 | P0 | D4-23 | 全局规则 `huawei-agent-rules.mdc` 未随安装注入 | install 后目标目录应含规则文件 | install 后 `found=0`，`package.json files` 无 `rules` | `package.json:8` files 数组 | P | 待提单 |
| 7 | P1 | D4-17 | hook 畸形输入 fail-open（应 fail-closed） | 畸形制品应默认 `deny` | 返回 `allow`、`findings=[]` | `risk-rule-engine.mjs:106` | — | 待提单 |
| 8 | P1 | D9-2 | JSON-RPC 未知方法未返回结构化 `-32601` | 未知方法 `code===-32601` | 抛普通 `Error`，`code` undefined | `mcp-protocol.mjs:95` + `mcp-server.mjs:169` | — | 待提单 |
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

## 五、未执行用例与原因（供维护 agent 修改用例）

> 逐条列出本轮 **BLOCKED** 用例（展开级「不涉及本客户端/OS」的建包时已剔除，不在此列）。本轮 0 NOT_RUN；36 条 BLOCKED 全部归属「补环境」或「调归属」，无「改用例」项。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-5 | 设计级 | P1 | BLOCKED | 补环境 | uninstall 为破坏性操作（删除本机插件需重装+重启），headless 不做 |
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 专属升级检测链（EINVAL/文件锁）；Linux 侧 queryDistTags 因本机 npm cache 权限返回 null |
| D1-41 | 设计级 | P1 | BLOCKED | 补环境 | 需完整 MCP 四态注入协议序列（冷启动 mcp-server + 四态 content JSON 解析） |
| D1-42 | 设计级 | P1 | BLOCKED | 补环境 | 需 dismiss 跨进程重启复查闭环 |
| D1-45 | 设计级 | P1 | BLOCKED | 补环境 | 需真实会话预热竞态时序 |
| D2-1 | 设计级 | P1 | BLOCKED | 补环境 | 需真云 AK/SK 三端同步（KooCLI/OBS/沙箱）E2E |
| D2-2 | 设计级 | P2 | BLOCKED | 补环境 | 需三端×就绪 8 组合枚举判定矩阵 |
| D3-C4 | 设计级 | P1 | BLOCKED | 补环境 | 需真云逐服务轻量创建→立即释放→归零 E2E（只读 list_operations 已覆盖 22 服务） |
| D4-8 | 设计级 | P1 | BLOCKED | 调归属 | Python/Node 双钩子一致性，DSH 插件仅接 Node 钩子 |
| D4-10 | 设计级 | P2 | BLOCKED | 补环境 | 需规则库新增项回归基线 |
| D4-11 | 设计级 | P1 | BLOCKED | 补环境 | 需提示注入测试集 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 需 npm 供应链安装期审计环境 |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 需真云最小权限账号矩阵 |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 需真实审批流日志审计链路（CTS 追溯） |
| D4-18 | 设计级 | P0 | BLOCKED | 补环境 | 需互动确认流（confirm-not-deny）+ 真云写操作 |
| D4-19 | 设计级 | P0 | BLOCKED | 补环境 | 需互动确认流 + 真云高危写 |
| D4-20 | 设计级 | P1 | BLOCKED | 补环境 | 需互动拒绝确认流 + 云资源验证 |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 需确认令牌过期/重复确认边界时序 + 真云写 |
| D6-1 | 设计级 | P2 | BLOCKED | 补环境 | 需检索响应延迟压测基准（p95） |
| D6-3 | 设计级 | P2 | BLOCKED | 补环境 | 需 MCP 冷启动计时基准 |
| D6-4 | 设计级 | P1 | BLOCKED | 补环境 | 需并发 30 请求调度压测 |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | 需国内镜像源网络环境 |
| D8-4 | 设计级 | P1 | BLOCKED | 补环境 | 需引导步骤机械执行录屏/快照 |
| D8-6 | 设计级 | P2 | BLOCKED | 补环境 | 需中英文文档 diff 基线 |
| D9-5 | 设计级 | P1 | BLOCKED | 补环境 | 需 stdio 大 payload/超长输出/断连压测 |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 需跨客户端互通（3 客户端） |
| D9-7 | 设计级 | P2 | BLOCKED | 补环境 | 需协议版本协商降级矩阵（老客户端模拟） |
| D9-9 | 设计级 | P1 | BLOCKED | 补环境 | 需 tools/call 超时注入 + 取消时序 |
| D10-1 | 设计级 | P1 | BLOCKED | 补环境 | 需真实 Agent 工具描述可选择性评测集 |
| D10-2 | 设计级 | P1 | BLOCKED | 补环境 | 需真实 Agent skill 激活率评测集（20+ 任务） |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 需真实 Agent 安全干预评测集 |
| D10-5 | 设计级 | P1 | BLOCKED | 补环境 | 需真实 Agent 多轮任务完成率评测 |
| EXP-C4-01 (ECS) | 展开级 | P1 | BLOCKED | 补环境 | 需真云 ECS 轻量创建→立即释放→归零验证（只读 list_operations 已覆盖） |
| EXP-C4-04 (RDS) | 展开级 | P1 | BLOCKED | 补环境 | 需真云 RDS 轻量创建→立即释放→归零验证 |
| EXP-C4-06 (CCE) | 展开级 | P1 | BLOCKED | 补环境 | 需真云 CCE 轻量创建→立即释放→归零验证 |
| EXP-C4-15 (WAF) | 展开级 | P1 | BLOCKED | 补环境 | 需真云 WAF 轻量创建→立即释放→归零验证 |

> 无未执行用例时写「无」。本轮 0 NOT_RUN，36 条 BLOCKED 均为补环境/调归属，无改用例项。

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
- 建议：`v1.1.4` 正式版仍携带已提单的 9 项安全/协议/路由缺陷（含 6 项 P0），建议在下个 release 前优先修复 #1/#2/#3/#4/#5/#6（P0 凭证与安全门）；同时补齐 KMS `DecryptData` 明文 secret 拦截（本轮新确认）。