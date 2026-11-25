# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告
> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-26 05:20:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-26-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@2.0.0-next.6`；源码 `hdk` HEAD `e99b9ee8` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：逐用例真实执行——① 源码/构建产物直调（tools.js、update-check.js、safety-policy.js 等）；② MCP stdio 真实握手（initialize → notifications/initialized → tools/call）；③ hcloud 真机 API（真云 E2E 建删资源并归零）；④ 只读子账号 test001 直连验证最小权限。每条证据落 `evidence/<case-id>/`（probe.mjs + 非空 stdout.log），由 `backfill_daily.py` 机械回填。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 4 / 3 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 缺陷 | `3 / 9 / 2`（共 14 条，11 FAIL + 3 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0`（D2-4 实测 plaintext_leak=false；D8-9 遥测脱敏为 P2 缺陷） |
| 资源释放 | ECS/VPC/子网/OBS/FunctionGraph 均建后即删，终态全零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链静默降级 | `src/update-registry.ts:403/412` + `update-hint.ts` check_failed | 待提单 |
| 2 | P0 | `D4-19` | D4安全 | 确认流下预检未生效 | `src/hcloud-plan.ts:311`（未合并 risk-rule-engine） | 待提单 |
| 3 | P0 | `D10-4` | D10评测 | 风控规则库契约漂移（SPEC-MISMATCH） | `safety/rules/cloud-risk-rules.json`（29 条 vs 契约 16 条） | 待提单 |
| 4 | P1 | `D2-10` | D2认证 | profile 参数空格分隔导致 KooCLI USE_ERROR | `src/packs/huaweicloud-cli/tools.ts:73` | 待提单 |
| 5 | P1 | `D2-4` | D2认证 | 凭证脱敏无法验证（同源 D2-10） | `src/packs/huaweicloud-cli/tools.ts:73` | 待提单 |
| 6 | P1 | `D3-B3` | D3功能 | run_readonly 注入无效 S1 凭证 | `src/hcloud-sts.ts:34` + `runReadonly` 调用点 | 待提单 |
| 7 | P1 | `D4-8` | D4安全 | hook 双路径判定不一致（deny vs warn） | `src/tools.ts:397` + `src/safety/classify-text.ts:744` | 待提单 |
| 8 | P1 | `D10-3` | D10评测 | serviceCatalog 路由准确率 86.7% < 90% | `src/capability-catalog.ts:20/22/266` | 待提单 |
| 9 | P1 | `EXP-E01` | D10评测 | 兜底路由未命中 ECS | `src/capability-catalog.ts:22`（ECS 关键词缺失） | 待提单 |
| 10 | P1 | `EXP-E08` | D10评测 | 纠错场景未命中 explain_error | `src/capability-catalog.ts:22`（explain 关键词缺失） | 待提单 |
| 11 | P1 | `D2-16` | D2认证 | import 擦除契约漂移（SPEC-MISMATCH） | `src/lib/credentials.ts:80`（peek 不擦除）+ `approval-gate.ts:320` | 待提单 |
| 12 | P1 | `D9-9` | D9协议 | initialize capabilities 未声明取消能力（SPEC-MISMATCH） | `src/mcp-protocol.ts:319`（capabilities 仅 tools.listChanged） | 待提单 |
| 13 | P2 | `D1-68` | D1安装 | HUAWEICLOUD_REGION 未优先于 HW_REGION | `src/auth/credential-resolver.ts:32` | 待提单 |
| 14 | P2 | `D8-9` | D8质量 | sanitizeValue 未移除 AK/SK/token 敏感值 | `src/telemetry/telemetry-values.ts:27` | 待提单 |

### 根因详情

1. **D1-39（P0）**：期望 Windows 下升级检测链返回 `update_available|up_to_date`；实际 `queryDistTagsSync()` 返回 null → `judgeUpdate` 得 `check_failed`（`distTags:null`）。根因 `src/update-registry.ts:403` 定义、`:412` `spawnSync('npm view ...')`，`parseDistTagsOutput` 空输出即返回 null；同源异步 `queryDistTagsFetch` 正常。证据 `evidence/D1-39/stdout.log`。
2. **D4-19（P0）**：对 `VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口执行 plan，`decision=deny` 但 `sgFindings=[]`，确认流未展示风险。根因 `src/hcloud-plan.ts:311 planHcloudCommand` 未合并 `risk-rule-engine.evaluateCommandRisk` 的 plan/artifact 阶段结论。证据 `evidence/D4-19/stdout.log`。
3. **D10-4（P0，SPEC-MISMATCH）**：`loadRiskRules()` 实测 15 deny + 14 warn（29 条），用例契约 9 deny + 7 warn（16 条），warn 多 7 条。根因 `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则集新增但契约/文档未同步。证据 `evidence/D10-4/stdout.log`。
4. **D2-10（P1）**：`show_profile_redacted` 生成 `hcloud configure show --cli-profile default`（空格分隔），KooCLI 报 `[USE_ERROR]参数 default 的格式错误`。根因 `src/packs/huaweicloud-cli/tools.ts:73` `args.push('--cli-profile', String(profile))`，应为 `--cli-profile=<profile>`。证据 `evidence/D2-10/stdout.log`。
5. **D2-4（P1）**：`show_profile_redacted` 因上述参数缺陷 `ok=false`（PARAM_ERROR），无法产出可脱敏 profile 输出；`leak=false`（未发现明文泄露），用例判定 FAIL。与 D2-10 同源，合并提单。证据 `evidence/D2-4/stdout.log`。
6. **D3-B3（P1）**：`huaweicloud_run_readonly_command {ECS ListServersDetails}` 返回 `ok:false, errorCode=APIGW.0301`，直连 `hcloud` 同参数 `code=0`。根因 `src/hcloud-sts.ts:34 resolveStsInjectArgs` 强制注入 S1 占位/无效 AK/SK，覆盖 KooCLI profile 有效凭证。证据 `evidence/D3-B3/stdout.log`。
7. **D4-8（P1）**：同一命令 `hcloud ECS DeleteServer --server_id=abc`，`classifyTextCommand` 判 deny（write 类），`hook_check_command` 返回 warn（destructive 规则），双路径 decision 不一致。根因 `src/tools.ts:397` 的 hook 分支仅走 `evaluateCommandRisk`，未与 `src/safety/classify-text.ts:744` 的 write/credential 分类合并取严。证据 `evidence/D4-8/stdout.log`。
8. **D10-3（P1）**：`eval-set-v1` 15 条意图路由 13 命中（86.7% < 90% 门禁），MISS：EXP-E01、EXP-E08。根因 `src/capability-catalog.ts:20 serviceCatalog` + `:22 routeMap` + `:266` 匹配循环关键词覆盖不足。证据 `evidence/D10-3/stdout.log`。
9. **EXP-E01（P1）**：`"我想买一台云主机……在华为云上有哪些服务器"` 返回兜底路由，未命中 ECS。根因 `src/capability-catalog.ts:22` routeMap 缺“服务器/实例/主机”同义词。证据 `evidence/EXP-E01/stdout.log`。
10. **EXP-E08（P1）**：`"ECS 创建失败，帮我解释错误"` 未命中 `explain_error`。根因 `src/capability-catalog.ts:22` routeMap 缺“解释/纠错/失败”意图词。证据 `evidence/EXP-E08/stdout.log`。
11. **D2-16（P1，SPEC-MISMATCH）**：`auth_switch mode=import` 引入用户终端审批门控（`USER_CONFIRMATION_REQUIRED`），未批准前不擦除 `creds-import.json`；契约由“读取即擦除”漂移为“审批后擦除”。根因 `src/lib/credentials.ts:80 peekImportFile`（无副作用读）+ `src/approval-gate.ts:320`（creds-import.json 受保护路径），擦除改由 `clearImportFile` 在执行路径触发。证据 `evidence/D2-16/stdout.log`。
12. **D9-9（P1，SPEC-MISMATCH）**：`initialize` 返回 `capabilities={"tools":{"listChanged":true}}`，未声明取消能力；设计要求取消/超时 `-32000` 断言无实现依据。根因 `src/mcp-protocol.ts:319 createDevkitMcpServer` 仅注册 tools 能力。证据 `evidence/D9-9/stdout.log`。
13. **D1-68（P2）**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4` 时取后者，`HW_REGION` 优先，与官方文档契约相反。根因 `src/auth/credential-resolver.ts:32` `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`。证据 `evidence/D1-68/stdout.log`。
14. **D8-9（P2）**：`sanitizeValue('market.token=abc123 password=Passw0rd 测试')` 仅去控制字符/截断，敏感值原样保留，`installId stable=true`。根因 `src/telemetry/telemetry-values.ts:27` 无 AK/SK/token/password 值替换规则。证据 `evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因

无 NOT_RUN（P0 全部 PASS/FAIL/BLOCKED，无留空），NOT_RUN+空占比 0.0%。

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | DevStation 沙箱上游不可用：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 8feab83b66b54cebafec940e3dec9b8a]；解除条件：HDKIT 服务恢复实名状态查询 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 7 个沙箱工具均已注册，但 check_user 上游失败：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 46ae7a30bc974d7d94b549054b3311e2]；解除条件：HDKIT 服务恢复 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 沙箱上游不可用："USER_CONFIRMATION_REQUIRED" ×2；解除条件：HDKIT 服务恢复 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 多服务编排前置阻塞：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`。D2-4 实测 `plaintext_leak=false`（profile 读取失败故无输出）；D3-C2 只读子账号 list 被拒；D4-* 风险规则用例全部实测。
- [x] 写操作误判 read-only：`0`。D3-S2 真机验证未确认删除不生效（`CONFIRM_TOKEN_NOT_FOUND`）。
- [x] 红线（I 类）违规：`0`。
- [x] 脱敏复核：D8-9 FAIL（遥测 value 未脱敏敏感值，P2），已入缺陷清单；其余脱敏用例 PASS。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS ×1（D3-C1） | VPC+子网+ECS 创建→ACTIVE | 删除 ECS/子网/VPC | 归零（ECS count=0、VPC=[]） |
| OBS 桶（D3-C2） | 带 LocationConstraint 建桶 | 删除桶 | 归零（afterList 空） |
| VPC（D3-S2） | 真机创建 | plan=deny + 确认流；清理删除 | 归零（zeroResidue=true） |
| FunctionGraph（D3-S6） | 创建→调用 | 删除函数 | 归零（zeroResidue=true） |
| EXP-C4-* / D4-* 真云尝试 | 只读规划 + 只读子账号写尝试被拒 | 未创建资源 | 无残留 |

> **终态复核（2026-11-26 05:18，管理员 AK/SK 实测）**：ECS `count=0`、VPC `vpcs=[]`、EIP `publicips=[]`、RDS `instances=[]`、FunctionGraph `functions=[]` —— 全部归零，仅删本次创建。

---

## 八、遗留与建议

- **P0 优先**：D1-39（Windows 升级检测静默失败）、D4-19（确认流安全预检缺位）、D10-4（风控规则契约漂移）建议本迭代修复。
- **契约裁决**：D2-16（import 擦除改为审批后擦除）、D9-9（capabilities 未声明取消）属安全增强/能力缺口，请维护者确认是否更新用例契约。
- **路由词表**：D10-3/EXP-E01/EXP-E08 建议扩充 `capability-catalog.ts` 同义词与纠错意图。
- **参数格式**：D2-10/D2-4 统一改为 `--cli-profile=<name>`（CLI 包与 OBS 包两处）。
- **环境依赖**：4 条 BLOCKED 全部由 HDKIT 沙箱上游不可用导致，服务恢复后需补测 D3-C3/C6/C14/S7。
- **建议**：修复后重跑 daily 全量回归，确认 P0 清零。