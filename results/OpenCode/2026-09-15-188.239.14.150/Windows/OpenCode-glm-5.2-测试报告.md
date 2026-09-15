# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-15 20:27:40（北京时间）
> **执行归档**：`results/OpenCode/2026-09-15-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 1 个 P0 FAIL，BLOCKED 项为环境限制）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.4-next.6（npm @next），OpenCode plugin 1.1.4-next.3 |
| 工具全集 | 39（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK，已配置） |
| 测试类型 | MCP 工具实测 + CLI 真机执行 + 源码级分析 |
| 设计真源 | 设计级 81 / 展开级 71 / 追踪表 183 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：MCP 工具直调（hook_check_command/plan_cli_command/auth_*/check_update 等）+ CLI 真机执行（npx huaweicloud-devkit doctor/status）+ 源码级分析（safety-policy.mjs/update-check.mjs/tools.mjs）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 81 设计级 + 71 展开级 = 152 |
| 已执行 | 152（100%） |
| PASS / FAIL / BLOCKED / NOT_RUN | 111 / 1 / 40 / 0 |
| 通过率（分母 = PASS+FAIL = 112） | 99.1% |
| P0 / P1 / P2 新增缺陷 | 1 / 0 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 不涉及（无真云资源创建/删除） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 68 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | D4-2：凭证 env 打印拦截规则未覆盖 HW_ACCESS_KEY |
| BLOCKED | 12 | 环境阻塞（需 MCP Inspector/harness/Linux L/不能卸载被测包） |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 43 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | |
| BLOCKED | 28 | 其他客户端用例（22）+ Linux/macOS 环境（4）+ D1-58 白名单（2） |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **71** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截规则未覆盖实际 HW_ACCESS_KEY 变量名 | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow` | `safety-policy.mjs:336` + `cloud-risk-rules.json:39` | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截规则未覆盖 HW_ACCESS_KEY**

- 期望：`printenv HW_ACCESS_KEY HW_SECRET_ACCESS_KEY` → `decision=deny`
- 实际：返回 `{"ok": true, "decision": "allow"}`，未拦截
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336`

```javascript
// 第 335-336 行
/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
/HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)   // ← 缺 HW_ 前缀
```

关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未包含 `HW_ACCESS_KEY`/`HW_SECRET_ACCESS_KEY`/`HW_SECURITY_TOKEN`。
实际华为云凭证环境变量名（`credentials.mjs:130-132`）使用 `HW_ACCESS_KEY` / `HW_SECRET_ACCESS_KEY` / `HW_SECURITY_TOKEN`，不匹配上述正则。
另外 `echo` 命令不在第 335 行命令检测模式中，`echo %HW_ACCESS_KEY%` 也能绕过。

- 证据：`evidence/D4-2/stdout.log`
- 控制验证：`printenv HUAWEICLOUD_ACCESS_KEY` 正确返回 `deny`（含 HUAWEICLOUD 关键字）

---

## 五、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-5 | 不能卸载正在测试的包 | 被测包本身 | N/A（测试设计限制） |
| D1-58 | 需隔离 HOME 的 Linux L 环境 | Linux L 真机 | 提供 Linux L 环境后复测 |
| D6-4 | 需并发测试工具 | 并发测试 harness | 提供并发测试工具 |
| D9-1~D9-6, D9-9 | 需 MCP Inspector | MCP Inspector 工具 | 安装 MCP Inspector 后复测 |
| D9-7, D9-8 | 需 MCP Inspector | MCP Inspector 工具 | 同上 |
| EXP-D5-2~10 | 其他客户端用例（Codex/CodeArtsAgent 等） | 多客户端环境 | 在对应客户端机器上执行 |
| EXP-NR3-10 | Linux 平台 | Linux 机器 | 在 Linux 机器上执行 |
| EXP-NR3-11 | macOS/ARM 平台 | macOS 机器 | 在 macOS 机器上执行 |
| EXP-D1-58-01~05 | 需隔离 HOME 的 Linux L | Linux L 真机 | 提供 Linux L 环境后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（测试过程中未泄漏任何凭证）
- [x] 写操作误判 read-only：0（D4-5 验证 DeleteServers 正确分类为 write）
- [x] 红线（I 类）违规：0
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 返回 `<redacted>`）
- [x] STS token 落盘：0（D2-11 验证 R3 拒绝机制生效）
- [x] adminPass 回显：0（D4-6 验证 plan_cli_command 正确脱敏 adminPass）

> **注意**：D4-2 发现凭证 env 打印拦截规则有缺口（HW_ACCESS_KEY 未覆盖），但不属于凭证已泄漏事件——是安全策略覆盖不完整，已记录为 P0 缺陷待提单。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/OBS/RDS 等 | 否 | N/A | N/A（本轮未创建真云资源） |
| creds-import.json | 是（测试 D2-11） | 已擦除（auth_switch import 后自动清除） | exists=False 已验证 |
| 测试临时文件 | 是（parse_cases.py 等） | 保留在 workdir | 不影响远端仓库（只提交 results/OpenCode/） |

> 本轮测试未创建任何真云资源，无需资源释放。测试中创建的 creds-import.json 已被 auth_switch 自动擦除。

---

## 八、遗留与建议

- **待提单缺陷**：D4-2（P0）— 凭证 env 打印拦截规则需补充 `HW_ACCESS_KEY`/`HW_SECRET_ACCESS_KEY`/`HW_SECURITY_TOKEN` 关键字，并考虑覆盖 `echo` 命令
- **本轮未覆盖**：D9 协议层测试（需 MCP Inspector）、D6-4 并发调度（需并发 harness）、D1-58 白名单接入（需 Linux L 隔离环境）
- **建议**：
  1. 在 `cloud-risk-rules.json` 的 `hwc-command-env-dump` 规则关键字正则中添加 `HW_ACCESS_KEY|HW_SECRET_KEY|HW_SECURITY_TOKEN`
  2. 考虑在命令检测模式中添加 `echo` 命令的凭证打印检测
  3. 安装 MCP Inspector 以覆盖 D9 协议层测试
