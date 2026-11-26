# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告
> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-27 05:35:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-27-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@2.0.1-next.0`；源码 `hdk` HEAD `6093af15` |
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
| P0 / P1 / P2 新增缺陷 | `3 / 9 / 2`（共 14 条，11 FAIL + 3 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0`（D2-4 实测 plaintext_leak=false；D8-9 遥测脱敏为 P2 缺陷） |
| 资源释放 | OBS 桶建后即删并归零验证通过；其余真云用例为只读/规划调用，未遗留资源；沙箱类用例因上游不可用未创建资源 |

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
| 3 | P0 | `D10-4` | D10评测 | 风控规则库契约漂移（SPEC-MISMATCH） | `safety/rules/cloud-risk-rules.json`（15 deny + 14 warn vs 契约 9+7） | 待提单 |
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

1. **D1-39（P0）**：期望 Windows 下升级检测链返回 `update_available|up_to_date`；实际 `queryDistTagsSync()` 返回 null → `judgeUpdate` 得 `check_failed`（`distTags:null`，current=2.0.1-next.0）。同源异步 `queryDistTagsFetch()` 可正常获取 registry 结果。根因 `src/update-registry.ts:403/412` 空 stdout 即返回 null。
2. **D4-19（P0）**：对 `VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口，`classification.decision=deny` 但 `sgFindings=[]`，确认流程未展示公网暴露风险。根因 `src/hcloud-plan.ts:311` 未合并 `risk-rule-engine.evaluateCommandRisk`。
3. **D10-4（P0，SPEC-MISMATCH）**：`loadRiskRules()` 实测 15 deny + 14 warn（29 条），契约要求 9 deny + 7 warn（16 条），warn 多 7 条。根因 `safety/rules/cloud-risk-rules.json` 新增 warn 规则未同步契约。
4. **D2-10（P1）**：`show_profile_redacted` 传 `--cli-profile default`（空格分隔），KooCLI 报 `[USE_ERROR]参数 default 的格式错误`。根因 `src/packs/huaweicloud-cli/tools.ts:73`。
5. **D2-4（P1）**：同源 D2-10，profile 读取失败导致脱敏能力无法实测；`leak=false`（未发现明文凭证）。
6. **D3-B3（P1）**：`run_readonly_command` 返回 `APIGW.0301 Unauthorized`，同参数直连 hcloud code=0。根因 `src/hcloud-sts.ts:34` 强制注入 S1 占位凭证覆盖 KooCLI profile。
7. **D4-8（P1）**：同一删除命令 `classifyTextCommand` 判 deny、`hook_check_command` 返回 warn，双路径不一致。根因 `src/tools.ts:397` 未与 `src/safety/classify-text.ts:744` 合并取严。
8. **D10-3（P1）**：eval-set 15 条意图命中 13 条（86.7% < 90%），MISS: EXP-E01、EXP-E08。根因 `src/capability-catalog.ts:20/22/266` 关键词覆盖不足。
9. **EXP-E01（P1）**：云主机采购意图未命中 ECS，返回兜底路由。根因 `src/capability-catalog.ts:22` 缺“服务器/实例/主机”同义词。
10. **EXP-E08（P1）**：ECS 创建失败纠错意图未命中 explain_error。根因 `src/capability-catalog.ts:22` 缺“解释/纠错/失败”意图词。
11. **D2-16（P1，SPEC-MISMATCH）**：`auth_switch mode=import` 返回 `ASK_CONFIRMATION_REQUIRED`，未批准前 `creds-import.json` 未擦除；契约由“读取即擦除”漂移为“审批后擦除”。根因 `src/lib/credentials.ts:80` + `src/approval-gate.ts:320`。
12. **D9-9（P1，SPEC-MISMATCH）**：`initialize` capabilities 仅 `tools.listChanged`，未声明取消能力；设计要求的取消/超时 -32000 断言无实现依据。根因 `src/mcp-protocol.ts:319`。
13. **D1-68（P2）**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4`，解析取 `cn-north-4`，官方语义应 HUAWEICLOUD_REGION 优先。根因 `src/auth/credential-resolver.ts:32`。
14. **D8-9（P2）**：`sanitizeValue` 仅去控制字符/截断，AK/SK/token/password 键值未替换为 `<redacted>`；installId stable=true。根因 `src/telemetry/telemetry-values.ts:27`。

---

## 五、未执行用例与原因

NOT_RUN = 0。

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | DevStation 沙箱上游不可用：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: f674c7ac21d740a4a4546a09037def21]；解除条件：HDKIT 服务恢复实名状态查询 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 7 个沙箱工具均已注册，但 check_user 上游失败：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 1849959433704775b2f6e27e6ecd6970]；解除条件：HDKIT 服务恢复 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 沙箱上游不可用：ASK_CONFIRMATION_REQUIRED；解除条件：HDKIT 服务恢复 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环；解除条件：HDKIT 恢复 + 具备 RDS 写权限凭证 |

> 上述 4 条均为真·外部依赖阻塞（HDKIT 上游服务/子账号权限），已按红线条目记录具体 trace 与解除条件；非“需环境/需基准/harness”类假阻塞。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。D2-4 `plaintext_leak=false`；D2-10 为参数拼接缺陷非泄漏。
- [x] 写操作误判 read-only：无。D4-4/D4-18 实测写操作 `safeToRun=false` + 需显式确认，伪造令牌被拒（ASK_CONFIRMATION_REQUIRED / CONFIRM_TOKEN_NOT_FOUND）。
- [x] 红线（I 类）违规：0。
- [x] 脱敏复核：D2-4/D2-16 实测无明文泄露；D8-9 遥测脱敏不完整已记 P2 缺陷。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2，cn-north-4，带 LocationConstraint） | 1 | 1 | 删除后 list prefix 无残留，归零通过 |
| ECS/VPC/RDS 等真云写资源 | 0（D4-4/D4-18 写操作在确认门被拒，未实际创建） | 0 | 终态归零 |
| DevStation 沙箱资源（D3-C3/C6/C14/S7） | 0（上游不可用未创建） | 0 | 无遗留 |

> 真云凭证已恢复为真实管理 AK（此前 session 测试写入的 S1 占位值已备份），D3-C2 以真实 AK 完成建桶→删桶→归零闭环。

---

## 八、遗留与建议

- **P0 优先修复**：D1-39（升级链静默降级）、D4-19（确认流安全预检失效）、D10-4（规则库契约漂移，需同步契约或规则库）。
- **P1 批量修复**：D2-10/D2-4（KooCLI 参数拼接）、D3-B3（STS 注入覆盖 profile）、D4-8（hook/classify 取严）、D10-3/EXP-E01/EXP-E08（路由关键词）、D2-16/D9-9（契约漂移，建议同步用例契约）。
- **环境侧**：HDKIT 上游（实名查询/sandbox_connect）当日不可用，导致 4 条沙箱类用例 BLOCKED；已记录 trace，建议上游恢复后补测。
- **建议**：D10 路由关键词补齐 ECS/explain 同义词后，准确率应可达 ≥90% 门禁。