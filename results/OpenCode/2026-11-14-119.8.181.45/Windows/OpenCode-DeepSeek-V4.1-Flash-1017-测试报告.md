# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告
> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-14 05:07:58（北京时间）
> **执行归档**：`results/OpenCode/2026-11-14-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.14-next.5` |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| hcloud / 版本 | hcloud 7.3.12（`configure show` 可用，区域 cn-north-4） |
| 真云凭证 | cn-north-4，S1 管理员 AKSK（`credentials.json`）+ 只读子账号 test001（`credentials.readonly.json`） |
| 工具注册数 | 47（`tools.mjs` TOOL_DEFINITIONS） |
| 执行归档 | `results/OpenCode/2026-11-14-119.8.181.45/Windows/`（146 份 evidence） |

> **执行方法**：每个用例独立探针 `evidence/<case-id>/probe.mjs`，直接 `import` `hdk/plugins/huaweicloud-core/src/*` 真实执行（源码级直调），需要 CLI 的用例真实 spawn `hcloud`；结果 JSON 落盘 `evidence/<case-id>/stdout.log` 后再批量回填 CSV。真云用例按 test001 只读凭证真实调用云 API（被 IAM 拒绝时记为 BLOCKED 并验证零残留），未使用 mock。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `121 / 11 / 12 / 2 / 0` |
| 通过率（分母 = PASS+FAIL = 132） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `2 / 7 / 2` |
| 红线（I 类）违规 | `0`（本次未创建任何云端资源，无写操作绕过审批流） |
| 资源释放 | `全部归零`（ECS 无 tctest-* 实例、EIP total_count=0、RDS 0、VPC 仅他人资源 testbot3-hermes-*） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `86` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `10` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `35` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | `update-check.mjs:86` dist-tags 数组被判空 | 待提单 |
| 2 | P0 | `D4-19` | D4安全 | 确认流下预检仍生效 | `tools.mjs:1349` / `hcloud-cli.mjs:371` 未合并风险规则 | 待提单 |
| 3 | P1 | `D2-10` | D2认证 | R7 current档跟随 | `tools.mjs:2048` `--cli-profile` 拆成两参数 | 待提单 |
| 4 | P1 | `D3-B3` | D3功能 | run_readonly脱敏执行 | `tools.mjs:1836` / `hcloud-cli.mjs:300` 占位凭证覆盖 KooCLI profile | 待提单 |
| 5 | P1 | `D4-8` | D4安全 | Python/Node策略一致 | `tools.mjs:1364` 仅走 evaluateCommandRisk | 待提单 |
| 6 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:2358/2360` routeMap 缺「云主机」与诊断路由 | 待提单（含 EXP-E01/E08） |
| 7 | P1 | `D9-9` | D9协议 | tools/call 超时协议语义与取消 | `mcp-protocol.mjs:60` capabilities 仅声明 tools | 契约确认 |
| 8 | P2 | `D1-68` | D1安装 | 图标离线与区域环境变量 | `auth/credentials.mjs:225` 环境变量优先级反序 | 待提单 |
| 9 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190` 无敏感值脱敏 | 待提单 |
| 10 | P2 | `D10-4` | D10评测 | 安全干预-静态规则层 | `safety/rules/cloud-risk-rules.json` 9 deny+10 warn（契约 9+7） | 契约确认 |
| 11 | 非产品缺陷 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | KooCLI/ECS API 对不存在 id 的返回形态（非 devkit） | 不单独提单 |
| 12 | 非产品缺陷 | `EXP-E01`/`EXP-E08` | D10评测 | 评测路由 miss | 与 #6 同源，合并跟踪 | 不单独提单 |

### 根因详情（每个 FAIL 的期望 / 实际 / 根因 / 证据）

**#1 D1-39【P0】** 期望 `parseDistTagsOutput()` 返回 `{latest,next}`、`judgeUpdate` 非 `check_failed`；实际 `distTags=null`、`result=check_failed`（npmRaw 为空，`npm view … dist-tags --json` 实测输出为数组）。根因 `update-check.mjs:86` 的 `Array.isArray(parsed) → return null`。证据 `evidence/D1-39/stdout.log`。

**#2 D4-19【P0】** 期望高危公网放通命令在确认流中被风险预检拦截（deny）；实际 `plan_cli_command` 仅返回缺参 warning，无 `blockedByRiskRule`。根因 `tools.mjs:1349` → `planHcloudCommand` 与 `hcloud-cli.mjs:371` 未调用 `evaluateCommandRisk`。证据 `evidence/D4-19/stdout.log`。

**#3 D2-10【P1】** 期望规划参数为 `--cli-profile=default`；实际 `--cli-profile default` 两参数，KooCLI 报 `[USE_ERROR]参数default的格式错误`。根因 `tools.mjs:2048`、`:2112`。证据 `evidence/D2-10/stdout.log`。

**#4 D3-B3【P1】** 期望 `run_readonly_command` 与直连 hcloud 一致成功；实际 tool 返回 `APIGW.0301 Unauthorized`，直连 `code=0`。根因 `tools.mjs:1836` 取占位 S1 凭证，`hcloud-cli.mjs:300` 注入 `--cli-access-key/--cli-secret-key` 覆盖 KooCLI profile。证据 `evidence/D3-B3/stdout.log`。

**#5 D4-8【P1】** 期望同一命令两条路径判定一致；实际源码 `classifyTextCommand`=deny、MCP `hook_check_command`=warn。根因 `tools.mjs:1364` 只调 `evaluateCommandRisk`。证据 `evidence/D4-8/stdout.log`。

**#6 D10-3【P1】** 期望路由准确率 ≥90%；实际 13/15=86.7%，MISS：EXP-E01「云主机」、EXP-E08「启动失败诊断」。根因 `tools.mjs:2358/2360` routeMap 关键词缺口。证据 `evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`。

**#7 D9-9【P1 SPEC】** 期望取消能力按 capabilities 实测；实际 `capabilities={"tools":{}}`，无取消声明，缺参调用 0ms 返回 -32602。根因 `mcp-protocol.mjs:60`。证据 `evidence/D9-9/stdout.log`。

**#8 D1-68【P2】** 期望 `HUAWEICLOUD_REGION` 优先；实际取 `HW_REGION=cn-north-4`。根因 `auth/credentials.mjs:225`（另见 `:173`、`:339`、`setup-cli.mjs:4983`）。证据 `evidence/D1-68/stdout.log`。

**#9 D8-9【P2】** 期望 `sanitizeValue` 脱敏 token/password；实际原样保留 `abc123`/`Passw0rd`。根因 `telemetry/telemetry.mjs:190-197`。证据 `evidence/D8-9/stdout.log`。

**#10 D10-4【P2 SPEC】** 期望 `{deny:9,warn:7}`；实际 `{deny:9,warn:10}`，规则文件新增 3 条 warn 未同步契约。证据 `evidence/D10-4/stdout.log`。

**#11 D3-C7【非产品缺陷】** 期望不存在实例返回 `Ecs.0200`；实际 `count=1` 且 `fault: "Instance … could not be found."`，属 KooCLI/ECS API 返回形态差异，建议改用例断言 `fault` 文本或改用 `ShowServer`。证据 `evidence/D3-C7/stdout.log`。

---

## 五、未执行用例与原因


### BLOCKED

> 分类口径：【补环境】= 环境/凭证/配额缺失；【改用例】= 用例设计前置/参数不可判定或归属需调整；【调归属】= agent/OS 列写错。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例/补环境建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 【补环境】 | test001 只读子账号被 IAM 拒绝 `ecs:cloudServers:createServers`（Pdp.0001），未创建实例，云端零残留 | 若需真机 E2E，需给 test001 授予最小创建+删除权限；否则用例标注「需写权限」 |
| `D3-C2` | 设计级 | P1 | BLOCKED | 【改用例】 | KooCLI 无 `OBS CreateBucket` 命令，建桶未完成、资源归零 | 改用 obsutil/SDK 建桶，或标注「OBS 控制台/obsutil 前置」 |
| `D3-C3` | 设计级 | P1 | BLOCKED | 【补环境】 | DevStation 沙箱上游 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace 5fe9eba5…]` | 待 HDKIT 服务恢复后复测 |
| `D3-C6` | 设计级 | P1 | BLOCKED | 【补环境】 | 7 个沙箱工具已注册，`check_user` 上游 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace febc7a25…]` | 待 HDKIT 服务恢复 |
| `D3-C14` | 设计级 | P2 | BLOCKED | 【补环境】 | 沙箱凭证注入 401（APIGW.0301）+ `GET /open-api-public/v1/agreements` 失败 | 待 HDKIT 服务恢复 + 有效 STS |
| `D3-S2` | 设计级 | P1 | BLOCKED | 【补环境】 | 先出命令块等确认且未确认零执行（rejected，符合安全预期）；真机创建被 IAM 拒绝（PolicyNotAuthorized），tctest-s2 归零 | 需 test001 VPC 写权限才能完成删除闭环 |
| `D3-S3` | 设计级 | P1 | BLOCKED | 【补环境】 | 沙箱不可用，无法产出公网 URL（agreements 失败 [trace 54d01037…]） | 待 HDKIT 服务恢复 |
| `D3-S6` | 设计级 | P2 | BLOCKED | 【改用例】 | FunctionGraph 创建请求缺必填参数（memory_size/package/timeout），未创建函数 | 用例补齐创建参数；写权限另需授权 |
| `D3-S7` | 设计级 | P1 | BLOCKED | 【补环境】 | 沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环 | 解锁沙箱 + RDS 最小权限后复测 |
| `D9-11` | 设计级 | P1 | BLOCKED | 【补环境】 | hwlink mux 模块/夹具不可用（files=8），无法验证 attach/ready/close 生命周期 | 提供 hwlink mux 夹具后复测 |
| `EXP-C4-01` | 展开级 | P1 | BLOCKED | 【补环境】 | 只读规划通过；真机 `ECS CreateServers` 被 IAM 拒绝（test001 无 createServers），未创建资源、零残留 | 授予最小创建/删除权限后复测 |
| `EXP-C4-04` | 展开级 | P1 | BLOCKED | 【补环境】 | 只读规划通过；真机 `RDS DeleteInstance` 被 IAM 拒绝（test001 无 rds:instance:deleteInstance），未创建资源、零残留 | 授予最小 RDS 权限后复测 |

> 说明：以上 BLOCKED 均已按真实调用验证（tool 返回真实错误码或上游 trace），无 mock；所有用例均确认未产生云端残留资源。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针输出无 AK/SK 明文；`credentials.readonly.json` 仅进程内注入）
- [x] 写操作误判 read-only：`0`（写命令均 `safeToRun=false`/需 approvalToken，未执行）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：`show_profile_redacted` 输出为 `HPU****4MI`/`****`；但 `sanitizeValue` 未脱敏 token/password（见 #9 D8-9）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS 实例（tctest-*） | 0（test001 无 createServers，均被 Pdp.0001 拒绝） | 无需销毁 | `hcloud ECS ListServersDetails` 仅他人 `testbot3-hermes-ecs-4603851570`，无 tctest-* |
| EIP | 0 | 无需销毁 | `EIP ListPublicips` total_count=`0` |
| VPC / 安全组 | 0 | 无需销毁 | `VPC ListVpcs` 仅他人 `testbot3-hermes-e2e-4603851570` |
| RDS | 0 | 无需销毁 | `RDS ListInstances` total_count=`0` |
| OBS 桶 | 0（KooCLI 无 CreateBucket，未建桶） | 无需销毁 | 未产生桶 |
| DevStation 沙箱 | 0（上游 HDKIT 不可用，创建在编排阶段失败） | 无需销毁 | 无会话残留 |

> 本机真实云调用均以 test001 只读子账号执行，写操作在 IAM/安全策略层被拒绝，**本次运行未创建任何计费资源**，归零验证通过。

---

## 八、遗留与建议

- **待裁决 SPEC**：D10-4 风险规则 9 deny+10 warn（契约 9+7，多 3 条 warn）、D9-9 initialize 未声明取消能力 —— 建议维护者确认是否更新用例契约。
- **未覆盖项**：真·Agent 会话行为评测（D10-1/2/5/9）需真实 LLM harness（非 DSH 客户端需 CDP 会话自动化），本机未覆盖；OBS 建桶因 KooCLI 无 CreateBucket 未覆盖。
- **修复建议优先级**：先修 #1/#2 两个 P0（更新检测链、确认流风险预检），再修 #3/#4/#5/#6 四个 P1；#11 D3-C7 建议直接改用例断言。
- **趋势**：本次 PASS 121/146（91.7%），与 2026-11-13（121/146）持平；P0 缺陷与昨日同源（D1-39/D4-19），说明 P0 未修复。
