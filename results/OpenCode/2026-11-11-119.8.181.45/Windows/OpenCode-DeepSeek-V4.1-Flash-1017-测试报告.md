# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告

> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-11 06:10:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-11-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit，GitHub `huaweicloud/huaweicloud-devkit`
> **结论**：`PARTIAL`（存在 P0/P1 缺陷各 1 项，不得判 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` / x64（主机 119.8.181.45） |
| Node / npm / Python | `Node v22.22.2` / `npm 12.1.0` / `Python 3.11.9` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14-next.2`（npm @next，gitHead `5c9478d3`） |
| 工具全集 | `46`（tools/list 实测枚举，schema 全量完整） |
| hcloud / 凭证 | `hcloud 7.3.12`；管理员 credentials.json 为占位凭证（ak 前缀 `test`），只读子账号 test001 为真实凭证（cn-north-4） |
| 执行方式 | 源码级直调（`hdk/plugins/huaweicloud-core/src/*`）+ 已安装 CLI（doctor/status/install/help）+ 已安装 MCP server JSON-RPC（tools/call）+ 真实 hcloud 只读调用 |
| daily 用例来源 | 设计级 107 / 展开级 39 / 使命清单 9（另有追踪表 216 条为设计映射，不含执行状态） |

> **执行纪律**：每个用例结论写入 `evidence/<case-id>/stdout.log`（JSON 含 status/why/executedAt）与 `probe.mjs`（真实探针），由 `backfill_daily.py` 一次性回填三份 CSV；`verify_no_fake_pass.py` 与 `verify_coverage.py` 双门禁均通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划执行（daily 行数） | `155`（设计级 107 + 展开级 39 + 使命 9） |
| 已执行 | `155` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `144 / 3 / 8 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，排除 BLOCKED/NOT_RUN） | `98.0%`（147/150） |
| 全量口径通过率（含 BLOCKED 为分母） | `94.8%`（147/155） |
| P0 / P1 / P2 新增缺陷 | `1 / 1 / 0` |
| 红线（I 类）违规 | `0`（无凭证泄露、无未审批写操作执行） |
| 资源释放 | 本次未成功创建任何云资源（写操作均被 IAM 拒绝），无需释放；账号内既有 `testbot3-hermes-*` 资源非本次创建，未触碰 |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据并通过 PASS 门禁 |
| FAIL | `2` | D4-3（P0）、D4-7（P1） |
| BLOCKED | `8` | D3-C1/C2/C3/C6/C13/C14/S2/S7 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | P0 无 NOT_RUN |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | EXP-C4-01~22 服务矩阵、EXP-D5-1-1/1-3、EXP-E01~E15 评测路由 |
| FAIL / BLOCKED / NOT_RUN | `0 / 0 / 0` | — |
| **合计** | **39** | |

### 3.3 使命清单（9）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `8` | D4-1/2/4/5/15/16/25/27 |
| FAIL | `1` | D4-7（同设计级，缺陷不重复计） |
| **合计** | **9** | |

---

## 四、缺陷清单（摘要，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 唯一可判定断言 | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | 创建明文密钥类 API 未被拦截 | 返回明文 secret 的命令应 deny/warn | 3/3 = `allow` | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:47`（缺 IAM 创建访问密钥规则） | 待提单 |
| 2 | P1 | `D4-7` | 网络载荷直管 shell 未拦截 | `curl ... \| bash` 应 deny/warn | `allow` | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:102`（仅覆盖解码管道，未覆盖网络载荷管道） | 待提单 |

---

## 五、未执行用例与原因（BLOCKED 8 条，逐条）

| ID | 层级/优先级 | 状态 | 分类 | 详细原因（实测） | 改用例/环境建议 |
|---|---|---|---|---|---|
| D3-C1 | 设计/P1 | BLOCKED | 【补环境】 | 真云 ECS 生命周期需写权限；实测只读子账号 test001 调 `VPC CreateVpc` 返回 `VPC.0010 PolicyNotAuthorized / 调用底层权限不足`，管理员 credentials.json 为占位凭证（ak 前缀 test） | 下发具备写权限的真实管理员 AK/SK；用例本身合理，无需改 |
| D3-C2 | 设计/P1 | BLOCKED | 【补环境】 | OBS 静态站部署需真实 OBS 写凭证；obsutilconfig 同步的是占位 AK/SK，写操作被拒 | 同上，配置真实管理员 AK/SK 后可测 |
| D3-C13 | 设计/P1 | BLOCKED | 【补环境】 | OBS 静态网站托管 get/set/delete 需真实 bucket 与写凭证；工具注册已验证（D3-C5 PASS），真机操作被拒 | 同上；另需提供一个测试 bucket |
| D3-S2 | 设计/P1 | BLOCKED | 【补环境】 | 删除 VPC 真机执行需写权限；预检链路已由 D4-18/D4-19 覆盖，真机删除被 IAM 拒绝 | 下发写权限 AK/SK 后重跑 |
| D3-S7 | 设计/P1 | BLOCKED | 【补环境】 | 跨服务（Web+ERP/RDS）交付并归零需创建 RDS/ECS，写权限缺失 | 同上 |
| D3-C3 | 设计/P1 | BLOCKED | 【补环境】 | `huaweicloud_sandbox_check_user` 真实 MCP 调用返回 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 4e508191...]`，沙箱上游服务不可用 | 【补环境】等待沙箱 upstream 恢复；用例无需改 |
| D3-C6 | 设计/P1 | BLOCKED | 【补环境】 | 同上，沙箱 7 隐式工具具名冒烟因 check_user 上游错误无法继续 | 同上 |
| D3-C14 | 设计/P2 | BLOCKED | 【补环境】 | 同上，沙箱 HDKit 参数与 hwlink 凭证依赖 check_user 成功 | 同上 |

> 说明：以上 8 条均为「本机真实执行后被外部权限/服务拒绝」的实测阻塞（非未跑、非 mock）。本机不满足写权限与沙箱可用性，无法通过改用例解除；解除条件已写明。

---

## 六、安全 / 红线

- **凭证安全**：探针输出未包含真实 AK/SK 明文；`show_profile_redacted` 对 accessKeyId/secretAccessKey/securityToken 均返回 `<redacted>`（D2-4 PASS）。
- **写操作审批门**：未审批写操作全部被拦截（D4-4/D4-5 PASS）；`plan_cli_command` 返回 approvalToken 而非直接执行。
- **命令注入/绕过**：大小写变体、参数拆分变体均被判 `warn`（D4-15 PASS）；`rm -rf /`、强制删除判 `deny`。
- **红线判定**：未出现凭证泄露；未执行任何未经审批的真实写操作（所有写尝试均被 IAM 拒绝），I 类违规 0。
- **缺陷红线**：发现 2 项安全策略缺口（D4-3 P0、D4-7 P1），已在 FINDINGS.md 记录并统一提单（不拆单）。

---

## 七、资源释放

- 本次测试**未创建任何云资源**：写操作（VPC/ECS/OBS/RDS）均被只读子账号 IAM 策略拒绝，账号资源计数未因本次测试增加。
- 复核（只读子账号，cn-north-4）：ECS 仅 1 台 `testbot3-hermes-ecs-4345122940`（创建于 2026-11-10，属其它 agent 历史资源，非本次创建，未触碰）；EIP 列表为空；VPC 中 `testbot3-hermes-e2e-*` 为其它 agent 历史资源，未触碰。
- 结论：**本次新增资源 = 0，无残留、无需释放**（只删本次创建原则已遵守）。

---

## 八、遗留建议

1. **D4-3 规则缺口**：在 `cloud-risk-rules.json` 增加 IAM `CreatePermanentAccessKey`/`CreateTemporaryAccessKeyByAgency`/`CreateAccessKey` 与 KMS `CreateKey` 的 `deny/warn` 规则，覆盖“生成并回显明文凭据”类 API（对应缺陷 #1）。
2. **D4-7 规则缺口**：增加 `curl|wget ... | bash|sh|python`、`| powershell` 等“网络载荷直管解释器”匹配（对应缺陷 #2）。
3. **发布工具链**：`scripts/pack-verify.mjs:18` 假设 `npm pack --json` 返回数组，npm 12 返回以包名为键的对象，导致 `npm run pack:verify` 恒失败；建议兼容两种结构（非产品缺陷，已记录于 FINDINGS #3）。
4. **运行副本版本漂移**：npm 全局包为 `1.1.14-next.2`，但 OpenCode 实际 MCP 运行副本 `~/.config/opencode/huaweicloud-plugins` 仍为 `1.1.9-next.0`；`prepare_env.py` 只同步 Hermes。建议增加 OpenCode target 同步或文档说明，避免“测的包 ≠ 跑的包”。
5. **环境 PATH**：本机存在两个 node 版本目录（`22.22.2-2` 陈旧 shim、`22.22.2-3` 实际 npm prefix），`huaweicloud-devkit` 默认命中陈旧 shim 导致 MODULE_NOT_FOUND；建议统一 PATH 或清理陈旧 shim（已在本次测试中通过显式 PATH 规避）。