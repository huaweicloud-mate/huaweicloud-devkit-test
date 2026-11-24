# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告

> **测试时间**：2026-11-25 05:00–05:45（北京时间）
> **执行归档**：`results/OpenCode/2026-11-25-119.8.181.45/Windows/`
> **被测对象**：`huaweicloud-devkit@2.0.0`（npm latest 正式版，2026-11-24 11:43 UTC 发布）；源码 hdk gitHead `ba9425d5`（v2.0.0）
> **结论**：PARTIAL（P0 有 1 项沿用历史缺陷 D1-39；P0 另有 D4-19 / D2-4 失败、D10-4 契约漂移）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode / DeepSeek-V4.1-Flash-1017 |
| OS / 架构 | Windows（AMD64），IP 119.8.181.45 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | `huaweicloud-devkit@2.0.0`（npm `latest`），hdk `ba9425d5` |
| KooCLI | hcloud 7.3.12 |
| 云凭证 | `~/.config/huaweicloud/credentials.json`（AK 20 位，region=cn-north-4）；只读子账号 test001 就绪 |
| 测试方式 | 源码级直调（2.0.0 `dist/*.js`）/ 真实 MCP stdio 协议 / 真实 hcloud API / 真云 E2E 建删 |
| 用例范围 | daily 精选：设计级 107 + 展开级 39 = 146；追踪表 216 行同步 |
| 执行方式说明 | 2.0.0 为 TypeScript 重构版（`plugins/huaweicloud-core/src/*.ts` 编译为 `dist/*.js`），探针由前日 1.1.15 版按新布局适配（`src/*.mjs`→`dist/*.js`）并真实重跑；对 vendor gate 门控工具注入 `vendorConfirmed`，确定性测试层设 `HUAWEICLOUD_VENDOR_CHALLENGE=off` |

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 128 / 11 / 4 / 3 / 0 |
| 通过率（PASS+FAIL+SPEC 为分母） | 90.1%（128/142） |
| 执行覆盖率（含 FAIL/SPEC，排除 BLOCKED） | 97.3%（142/146） |
| P0 结果 | 21 条：PASS 17 / FAIL 3 / SPEC 1 / BLOCKED 0 |
| 安全红线违规 | 0 |
| 真云资源 | 全部删除归零（ECS=0，VPC/子网/FunctionGraph/OBS 均无残留） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 |
|---|---|
| PASS | 91 |
| FAIL | 9 |
| BLOCKED | 4 |
| SPEC-MISMATCH | 3 |
| NOT_RUN | 0 |
| **合计** | **107** |

### 3.2 展开级（39）

| 状态 | 数量 |
|---|---|
| PASS | 37 |
| FAIL | 2（EXP-E01、EXP-E08） |
| BLOCKED | 0 |
| SPEC-MISMATCH | 0 |
| NOT_RUN | 0 |
| **合计** | **39** |

---

## 四、缺陷清单（详见 FINDINGS.md）

> 均为历史已存在缺陷（历史查重命中，统一合入既有缺陷单，不新开单）。根因位置以 1.1.x 源码行号记录，2.0.0 对应同名 `.ts` 实现，逻辑未变。

| # | 级别 | 用例 | 缺陷摘要 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D1-39 | Windows 更新检测 `queryDistTagsSync` 返回 null → `check_failed` 静默降级 | `update-check.mjs:370-385`（2.0.0 `update-check.ts`） |
| 2 | P0 | D4-19 | 确认流程风险预检未生效（plan 未合并安全 finding） | `tools.mjs:1428` / `hcloud-cli.mjs:371`（2.0.0 `.ts`） |
| 3 | P0 | D2-4（同源 D2-10） | 2.0.0 下 `show_profile_redacted` 对 `--cli-profile default` 参数错误返回 `ok:false`，D2-4 凭证明文断言被连带判 FAIL | `tools.mjs:2132/2196`（参数应为 `--cli-profile=default`） |
| 4 | P1 | D2-10 | profile 命令以空格分隔参数，KooCLI 报 `[USE_ERROR]` | `tools.mjs:2132` |
| 5 | P1 | D3-B3 | `run_readonly_command` 注入 S1 占位凭证导致 APIGW.0301，直连 hcloud 正常 | `tools.mjs:1186/1430`、`hcloud-cli.mjs:300` |
| 6 | P1 | D4-8 | `classifyTextCommand`（deny）与 `hook_check_command`（warn）双路径判定不一致 | `tools.mjs:1447-1448` |
| 7 | P1 | D10-3 / EXP-E01 / EXP-E08 | serviceCatalog 路由准确率 86.7% < 90% 门禁，ECS 故障排查与 explain_error 未命中 | `tools.mjs:2574-2805` |
| 8 | P1 | D9-9 | `initialize` capabilities 未声明取消能力（SPEC-MISMATCH） | `mcp-protocol.mjs:60`（2.0.0 `mcp-protocol.ts`） |
| 9 | P0 | D10-4 | 风险规则库实为 15 deny + 14 warn（契约 9+7），契约漂移（SPEC-MISMATCH） | `safety/rules/cloud-risk-rules.json` |
| 10 | P2 | D1-68 | `HUAWEICLOUD_REGION` 未优先于 `HW_REGION` | `auth/credentials.mjs:225` |
| 11 | P2 | D8-9 | `sanitizeValue` 未移除 AK/SK/token 等敏感值 | `telemetry/telemetry.mjs:190` |
| 12 | P1 | D2-16 | 2.0.0 `auth_switch import` 引入用户终端审批门控，未批准前不擦除 creds-import.json（SPEC-MISMATCH，设计变更） | 2.0.0 approval-gate |

---

## 五、未通过用例与原因

### 5.1 FAIL（11 条）

| 用例 | 级别 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|
| D1-39 | P0 | FAIL | 【补环境/产品】 | Windows npm dist-tags 同步查询返回 null，`judgeUpdate` 降级 check_failed（历史缺陷 #1） |
| D2-4 | P0 | FAIL | 【产品】 | 同 D2-10 根因：profile 查询参数格式错误导致 `ok:false`，非真实明文泄漏（`leak=false`） |
| D4-19 | P0 | FAIL | 【产品】 | 写操作 plan 未合并安全 finding，确认流程未显示风险（历史 #2） |
| D2-10 | P1 | FAIL | 【产品】 | `--cli-profile default` 空格分隔，KooCLI 拒绝（历史 #4） |
| D3-B3 | P1 | FAIL | 【产品】 | run_readonly_command APIGW.0301，直连 hcloud 成功（历史 #5） |
| D4-8 | P1 | FAIL | 【产品】 | hook 与 classify 双路径 deny/warn 不一致（历史 #6） |
| D10-3 | P1 | FAIL | 【产品】 | serviceCatalog 路由 13/15=86.7%，低于 90%（历史 #7） |
| D1-68 | P2 | FAIL | 【产品】 | 区域环境变量优先级与文档契约相反（历史 #10） |
| D8-9 | P2 | FAIL | 【产品】 | telemetry sanitizeValue 未脱敏敏感值（历史 #11） |
| EXP-E01 | P1 | FAIL | 【产品】 | 意图“云上还有哪些服务器”未路由到 ECS（历史 #7 同源） |
| EXP-E08 | P1 | FAIL | 【产品】 | “ECS 创建失败怎么解释”未路由 explain_error（历史 #7 同源） |

### 5.2 SPEC-MISMATCH（3 条）

| 用例 | 级别 | 漂移点 |
|---|---|---|
| D10-4 | P0 | 规则库 15 deny + 14 warn，用例契约 9+7（warn 多 7 条） |
| D9-9 | P1 | initialize capabilities 仅 `{"tools":{"listChanged":true}}`，无 cancellation/cancel 字段 |
| D2-16 | P1 | 2.0.0 auth_switch import 需用户终端 `approve`，批准前不擦除 creds-import.json（由“立即擦除”漂移为“审批后擦除”） |

### 5.3 BLOCKED（4 条，外部上游不可用）

| 用例 | 级别 | blockedReason（实测时间 + 缺什么 + 解除条件） |
|---|---|---|
| D3-C3 | P1 | 2026-11-25 05:1x，DevStation 沙箱 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败`；解除条件：HDKIT 服务恢复实名状态查询 |
| D3-C6 | P1 | 2026-11-25 05:1x，7 个沙箱工具已注册但 `check_user` 上游失败（同上）；解除条件：HDKIT 服务恢复 |
| D3-C14 | P2 | 2026-11-25 05:2x，`sandbox_connect` 返回 `USER_CONFIRMATION_REQUIRED`，无交互通道完成用户确认；解除条件：沙箱审批链恢复或提供可自动化确认通道 |
| D3-S7 | P1 | 2026-11-25 05:2x，沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001）；解除条件：HDKIT 恢复 + 具备 RDS 写权限凭证 |

> 以上 4 条均为真·外部依赖，非“假阻塞”。

---

## 六、安全 / 红线

- 安全类用例（D4 系列）除 D4-8 外全部 PASS：命令拦截、凭证读取阻断、明文密钥脱敏、审批令牌不可重放、公网暴露告警等均符合预期。
- 未出现越权创建、未授权删除、明文凭证落盘等红线违规。
- 2.0.0 新增 vendor gate / approval gate 行为在确定性测试层通过 `vendorConfirmed` + `HUAWEICLOUD_VENDOR_CHALLENGE=off` 正常验证，未发现绕过。

---

## 七、资源释放（真云 E2E）

| 用例 | 创建资源 | 删除 | 归零验证 |
|---|---|---|---|
| D3-C1 | VPC + 子网 + ECS（ac7.large.2，ACTIVE） | ECS/VPC/子网全部删除（删除重试后 44s 闭环） | `ECS ListServersDetails count=0`；VPC/子网 Show 返回 VPC.9904/SYS.0404 |
| D3-S2 | VPC（删除确认用例） | 未确认删除被拒 → 探针清理删除 | VPC 不存在 |
| D3-S6 | FunctionGraph 函数（创建→调用） | DeleteFunction | ListFunctions 归零 |
| D3-C2 | OBS 桶（带 LocationConstraint 创建） | DeleteBucket | list 前缀无该桶 |
| D4-13 | 只读子账号尝试创建 VPC（预期拒绝） | 未创建 | 无资源 |
| D4-20 | 拒绝后不执行删除 | 未执行 | ECS 清单不变 |

最终核验：`hcloud ECS ListServersDetails count=0`，无遗留 VPC/子网/安全组/FunctionGraph/OBS 桶。

---

## 八、遗留与建议

1. **2.0.0 大版本适配**：本次为 2.0.0 发布后首日回归，探针已按 `dist/*.js` 新布局与 vendor/approval gate 适配后真实执行。建议测试用例母版尽快同步 2.0.0 内部导出（`mcp-protocol.dispatch`、`risk-rule-engine.extractInnerCommand` 等已移除/迁移），避免后续每日测试反复做探针适配。
2. **P0 历史缺陷**：D1-39（更新检测）与 D4-19（风险预检）仍复现，建议优先修复；D2-4/D2-10 同源，修复 `--cli-profile` 参数格式即可同时消除。
3. **路由准确率**：serviceCatalog 86.7% 连续多日低于 90% 门禁，建议补齐中文同义词/故障排查意图。
4. **沙箱上游**：D3-C3/C6/C14/S7 受 HDKIT 上游实名/确认通道影响，待服务恢复后补测。