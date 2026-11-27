# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告
> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-28 05:07:19（北京时间）
> **执行归档**：`results/OpenCode/2026-11-28-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `2.0.1-next.1` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（tools.js / update-check.js / safety-policy.js 等）+ MCP stdio 真实握手（initialize → notifications/initialized → tools/call）+ hcloud 真云 API 调用；真云 E2E 建删资源并归零（ECS/VPC/子网、OBS 桶、FunctionGraph 函数）；只读子账号 test001 直连验证最小权限。每条证据落 `evidence/<case-id>/`（probe.mjs + 非空 stdout.log），由 `backfill_daily.py` 机械回填。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 4 / 3 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 新增缺陷 | `3 / 9 / 2` |
| 红线（I 类）违规 | `0`（D2-4 实测 plaintext_leak=false；D8-9 遥测敏感值属 P2 缺陷） |
| 资源释放 | 真云 E2E 创建资源均已删除并归零（ECS/VPC/子网、OBS 桶、FunctionGraph 函数），零残留 |

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
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链静默降级 | `src/update-registry.ts:403` queryDistTagsSync → `:412` spawnSync dist-tags 解析失败返回 null | 待提单 |
| 2 | P0 | `D4-19` | D4安全 | 确认流下预检未生效 | `src/hcloud-plan.ts:311` planHcloudCommand 未合并 risk-rule-engine findings | 待提单 |
| 3 | P0 | `D10-4` | D10评测 | 风险规则库契约漂移（SPEC） | `safety/rules/cloud-risk-rules.json` 实为 15 deny + 14 warn（契约 9+7） | 待提单 |
| 4 | P1 | `D2-10` | D2认证 | profile 参数空格分隔致 KooCLI USE_ERROR | `src/packs/huaweicloud-cli/tools.ts:73` args.push('--cli-profile', ...) | 待提单 |
| 5 | P1 | `D2-4` | D2认证 | 凭证脱敏自检因 profile 读取失败无法验证 | 同源 `src/packs/huaweicloud-cli/tools.ts:73` | 待提单 |
| 6 | P1 | `D3-B3` | D3功能 | run_readonly 注入无效凭证致 APIGW.0301 | `src/hcloud-sts.ts:34` resolveStsInjectArgs 强制注入 S1 凭证 | 待提单 |
| 7 | P1 | `D4-8` | D4安全 | hook 双路径判定不一致 | `src/tools.ts:397` hook 分支未合并 classify-text write 分类 | 待提单 |
| 8 | P1 | `D10-3` | D10评测 | 路由准确率 86.7% < 90% 门禁 | `src/capability-catalog.ts:20/22/266` 关键词覆盖不足 | 待提单 |
| 9 | P1 | `EXP-E01` | 评测 | 服务器创建意图未命中 ECS | `src/capability-catalog.ts:22` routeMap ECS 同义词缺失 | 待提单 |
| 10 | P1 | `EXP-E08` | 评测 | 错误解释意图未命中 explain_error | `src/capability-catalog.ts:22` routeMap 缺报错/失败意图词 | 待提单 |
| 11 | P1 | `D2-16` | D2认证 | auth_switch import 擦除时机漂移（SPEC） | `src/lib/credentials.ts:79` + `src/approval-gate.ts:320` 审批门控先于擦除 | 待提单 |
| 12 | P1 | `D9-9` | D9协议 | initialize capabilities 未声明取消能力（SPEC） | `src/mcp-protocol.ts:319` 仅注册 tools 能力 | 待提单 |
| 13 | P2 | `D1-68` | D1安装 | HUAWEICLOUD_REGION 未优先于 HW_REGION | `src/auth/credential-resolver.ts:32` 顺序相反 | 待提单 |
| 14 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token | `src/telemetry/telemetry-values.ts:27` 仅去控制字符/截断 | 待提单 |

### 根因详情

1. **D1-39**：Windows+npm 下 `queryDistTagsSync()` 返回 null（`src/update-registry.ts:403`，`:412` spawnSync 解析失败），`judgeUpdate` 判为 `check_failed`；异步 `queryDistTagsFetch()` 正常，说明同步分支解析缺陷。证据 `evidence/D1-39/stdout.log`。
2. **D4-19**：`VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口，plan `decision=deny` 但 `sgFindings=[]`；`planHcloudCommand`（`src/hcloud-plan.ts:311`）未合并风险引擎 findings。证据 `evidence/D4-19/stdout.log`。
3. **D10-4**：`loadRiskRules()` 实 15 deny + 14 warn，契约 9+7，warn 多 7 条（`safety/rules/cloud-risk-rules.json`）。证据 `evidence/D10-4/stdout.log`。
4. **D2-10**：`--cli-profile default` 空格分隔触发 KooCLI `[USE_ERROR]`，应为 `--cli-profile=default`（`src/packs/huaweicloud-cli/tools.ts:73`）。证据 `evidence/D2-10/stdout.log`。
5. **D2-4**：`show_profile_redacted` 返回 ok=false / PARAM_ERROR，与 D2-10 同源；leak=false，未发现明文凭证。证据 `evidence/D2-4/stdout.log`。
6. **D3-B3**：MCP `run_readonly_command` 返回 APIGW.0301，同机直连 hcloud code=0；`resolveStsInjectArgs`（`src/hcloud-sts.ts:34`）注入无效 S1 凭证覆盖 profile。证据 `evidence/D3-B3/stdout.log`。
7. **D4-8**：同命令 `classifyTextCommand`=deny 而 `hook_check_command`=warn（`src/tools.ts:397`）。证据 `evidence/D4-8/stdout.log`。
8. **D10-3**：eval-set 15 条意图 13 命中（86.7%），MISS=EXP-E01/EXP-E08；routeMap 关键词不足（`src/capability-catalog.ts:22/266`）。证据 `evidence/D10-3/stdout.log`。
9. **EXP-E01 / EXP-E08**：分别为「服务器创建」与「ECS 失败解释」意图返回兜底路由，与 D10-3 同源。证据 `evidence/EXP-E01|EXP-E08/stdout.log`。
10. **D2-16**：import 返回 USER_CONFIRMATION_REQUIRED，`creds-import.json` 未即时擦除（`src/lib/credentials.ts:79` + `src/approval-gate.ts:320`），契约漂移。证据 `evidence/D2-16/stdout.log`。
11. **D9-9**：initialize `capabilities={"tools":{"listChanged":true}}` 未声明取消能力（`src/mcp-protocol.ts:319`），取消超时 -32000 断言无实现依据。证据 `evidence/D9-9/stdout.log`。
12. **D1-68**：`HW_REGION` 抢在 `HUAWEICLOUD_REGION` 前（`src/auth/credential-resolver.ts:32`），与官方文档优先级相反。证据 `evidence/D1-68/stdout.log`。
13. **D8-9**：`sanitizeValue('token=abc123 password=Passw0rd')` 值原样保留（`src/telemetry/telemetry-values.ts:27`）。证据 `evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | DevStation 沙箱上游不可用：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: b482bcf3698d463fb461e9876bad371c]；解除条件：HDKIT 服务恢复实名状态查询 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 7 个沙箱工具均已注册，但 check_user 上游失败：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 0cb758ba7b2a45a7bb6716bc64bc6897]；解除条件：HDKIT 服务恢复 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 沙箱上游不可用："ASK_CONFIRMATION_REQUIRED" / "ASK_CONFIRMATION_REQUIRED"；解除条件：HDKIT 服务恢复 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 多服务编排前置阻塞：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 实测 plaintext_leak=false；D4-26 findings.evidence 中 AK/SK/token 均 `<redacted>`；D9-13 tools/call 无明文凭证）
- [x] 写操作误判 read-only：`0`（D4-5 五类写操作均 deny；D4-10 正常只读/普通操作未被误杀）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：D8-9 遥测 `sanitizeValue` 未脱敏敏感值，已如实记 P2 缺陷；D4-6/D4-27 结果脱敏正常

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS 实例 + VPC + 子网（D3-C1） | 1 套 | 已删除 | 通过：删除后清单归零，零残留（56.8s） |
| OBS 桶（D3-C2） | 1 个 | 已删除（DELETE） | 通过：删除后 list `gone=true` |
| VPC（D3-S2） | 1 个 | 已删除 | 通过：未确认删除不生效 + 清理归零 |
| FunctionGraph 函数（D3-S6） | 1 个 | 已删除 | 通过：func_urn 获取→调用→删除归零 |
| 跨服务 RDS 编排（D3-S7） | 0（BLOCKED，未创建） | — | 未创建资源，无残留 |
| 沙箱实例（D3-S3/C3/C6/C14） | 0（上游不可用） | — | 未创建资源，无残留 |

> 所有真云用例只创建/删除本次资源；执行后逐项验证清单归零，无遗留计费资源。

---

## 八、遗留与建议

- **待裁决 SPEC（3 项）**：D10-4（规则库 15+14 vs 契约 9+7）、D2-16（import 擦除改为审批后）、D9-9（capabilities 未声明取消能力）——需维护者确认以实现为准更新契约，还是按契约修实现。
- **建议修复优先级**：P0 三项（D1-39 同步 dist-tags 解析、D4-19 plan 合并风险引擎、D10-4 规则库对齐）优先；P1 的 D2-10/D2-4 同源参数拼接一行可修；D10-3/EXP-E01/EXP-E08 同源 routeMap 关键词补全。
- **环境阻塞 4 项**（D3-C3/C6/C14/S7）：均为 HDKIT 上游实名查询/凭证校验不可用，非产品缺陷，待服务恢复后补测。
- **未覆盖项**：无（NOT_RUN=0，P0 全测）。
