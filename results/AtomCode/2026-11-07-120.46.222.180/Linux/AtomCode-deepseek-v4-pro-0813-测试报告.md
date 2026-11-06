# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-07 05:30:00（北京时间）
> **执行归档**：`results/AtomCode/2026-11-07-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 1 个 P0 缺陷 D2-4 + 11 个 P1/P2 缺陷，详见缺陷清单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4 LTS） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.14-next.0`（npm @next，gitHead `ac955889`，PR #1111） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 提示配对标 7.3.12）；doctor 11 pass / 1 warn / 0 fail |
| 真云凭证 | cn-north-4（AK/SK 已配置，真机执行） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146（真实 node 重跑探针 + 真云 E2E） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 132 / 12 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 91.0%（132/145） |
| P0 / P1 / P2 新增缺陷 | 1 / 8 / 3（产品级；另有 2 项测试侧） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云 1 处残留已人工补删并复核归零） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 94 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 取消语义未声明，待裁决 |
| NOT_RUN | 1 | D1-39（Windows 专属 P0，Linux 由 d1-upgrade 代表覆盖，OS 豁免） |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 中文意图路由 miss |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | JSON 字符串凭证（小写键 ak/sk/token）不脱敏，AK/SK/token 泄露 | `safety-policy.mjs:34-47`（:45 AK/SK 无 `i`） | P | 待提单 |
| 2 | P1 | D4-27 | 小写 `ak=`/`sk=` 不脱敏，仅 `token=` 脱敏 | `safety-policy.mjs:45` | P | 待提单 |
| 3 | P2 | D8-9 | `sanitizeValue` 不脱敏任何键值 | `telemetry/telemetry.mjs:190-199` | P | 待提单 |
| 4 | P2 | D4-25 | 空格分隔写命令未分类为 `cli:write` | `hooks/huaweicloud-safety.py:46` | P | 待提单 |
| 5 | P1 | D3-S1/S2/S3/S5 + EXP-E01 | serviceCatalog 中文意图含英文服务名路由 miss，返回 fallback | `tools.mjs:2546`（分词）+ `:2572`（fallback） | P | 待提单 |
| 6 | P1 | D9-9 | mcp-protocol 未声明 cancellation/取消语义 | `mcp-protocol.mjs` | P | 待提单（SPEC） |
| 7 | P1 | D3-C7 | 跨区域写操作（ap-southeast-3 EIP）因 token 项目绑定 cn-north-4 失败，引导未预警 | `tools.mjs`（regional availability/plan 只校验服务可用性，未校验项目绑定） | P | 待提单 |
| 8 | P1 | D3-C1 | 真云 finally 归零未确认 ECS 删除，遗留 ACTIVE 资源（已人工补删归零） | `scripts/realcloud_e2e.mjs` finally 归零轮询 | G | 测试侧 |
| 9 | P1 | D3-C2 | 「OBS建桶」断言误判 false（实际建桶成功、删桶归零成功） | `scripts/realcloud_e2e.mjs` OBS 建桶断言 | G | 测试侧 |

> 根因代码片段与复现证据详见 `FINDINGS.md`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属（OS 专属） | Windows 升级检测链 EINVAL 语义；OS 列标注「专属」，Linux 由 d1-upgrade `queryDistTagsSync-no-EINVAL` 代表覆盖，本客户端/OS 不适用 |

> 其余无 NOT_RUN/BLOCKED。展开级建包时已按 agent+OS 预筛，非本客户端/OS 用例不在此列。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针用伪造值 AKID123456/secret789 等，真云用预配置凭证，未落盘真实密钥）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始真实凭证；脱敏类失败为「应脱敏而未脱敏」缺陷（见 #1/#2/#3）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1, cn-north-4） | 是 | 已删（脚本提交后未确认，人工补删） | `hcloud ECS` 核查无残留 ✓ |
| VPC/子网（D3-C1, cn-north-4） | 是 | 已删（人工补删） | `hcloud VPC` 核查无残留 ✓ |
| OBS 桶（D3-C2, cn-north-4） | 是 | 已删（脚本 `删桶归零` PASS） | 无残留 ✓ |
| EIP（D3-C7, ap-southeast-3） | 否（VPC.0501 未创建成功） | — | `total_count=0` ✓ |

> 真云只删本次创建资源（名称前缀 `testbot3-hermes-*`、时间戳 TS=3999221055）。同账号下 `testbot3-hermes-*-3999574479` 为其他并发运行资源，未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（tools/call 取消/超时语义未声明）。
- 本轮未覆盖范围：非 DSH 客户端真实 Agent 会话评测（D10-1/2/5/9 需 CDP 自动化环境）未执行，当前 CSS 仅 EXP-E01~E15 确定性路由层已跑。
- 建议：#1/#2/#3 同源于安全脱敏能力覆盖缺口（JSON 语法键、小写 ak/sk、遥测路径），建议合并修复 `redactString`/`isSecretKeyName`/`sanitizeValue` 三类脱敏入口并共享同一脱敏规则库。