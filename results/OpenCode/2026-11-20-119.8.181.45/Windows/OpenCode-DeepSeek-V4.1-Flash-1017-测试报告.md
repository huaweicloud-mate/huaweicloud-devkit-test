# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告

> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-20 05:20（北京时间）
> **执行归档**：`results/OpenCode/2026-11-20-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit `1.1.14`（npm latest 正式版；源码仓 `huaweicloud/huaweicloud-devkit` commit `bd985051`）
> **结论**：`PARTIAL` —— 146 用例全量执行，120 PASS / 9 FAIL / 15 BLOCKED / 2 SPEC-MISMATCH；9 FAIL 全部命中历史单，无新增产品缺陷。

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows`（Windows Server 2022, x64） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14`（npm latest）；源码 `hdk`@`bd985051` |
| 机器 IP | `119.8.181.45`（出口 IP） |
| daily 用例 | 设计级 107 / 展开级 39（去重后 146） |
| Node / KooCLI | Node `v22.22.2` / KooCLI `7.3.12` |

> **执行方法**：三条真实执行通道——
> 1. **源码级探针直调**：`node evidence/<case-id>/probe.mjs`，直接 import `hdk/plugins/huaweicloud-core/src/*.mjs` 调用真实函数（`judgeUpdate`、`classifyTextCommand`、`evaluateCommandRisk`、`planHcloudCommand`、`sanitizeValue` 等），非字符串匹配。
> 2. **MCP 真机**：真实启动 `mcp-server.mjs` 子进程走 stdio JSON-RPC（initialize / tools/list / tools/call），核验 47 工具 schema 与错误码。
> 3. **真云调用**：`spawnSync` 真实调用 `hcloud`（KooCLI）与 MCP 工具发起 API 请求，凭证为 S1 全局库 + KooCLI profile + test001 只读子账号注入。
>
> 探针执行完成即把结果 JSON 写入 `evidence/<case-id>/stdout.log`，`backfill_daily.py` 一次性回填三份 CSV；PASS 门禁 `verify_no_fake_pass.py` 通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `120 / 9 / 15 / 2 / 0` |
| 通过率（分母 = PASS+FAIL = 129） | `93.0%` |
| 执行率（146/146） | `100%` |
| NOT_RUN 占比 | `0.0%` |
| 新增产品缺陷 | `0`（9 FAIL + 2 SPEC-MISMATCH 全部命中历史单） |
| 红线（I 类）违规 | `0` |
| 资源创建 / 残留 | `0 / 0`（所有真云写调用在创建前被 IAM 拒绝） |

### 按优先级

| 优先级 | 用例 | PASS | FAIL | BLOCKED | SPEC-MISMATCH |
|---|---|---|---|---|---|
| P0 | 21 | 18 | 2 | 0 | 1 |
| P1 | 95 | 76 | 5 | 13 | 1 |
| P2 | 30 | 26 | 2 | 2 | 0 |
| **合计** | **146** | **120** | **9** | **15** | **2** |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 86 | 有证据且通过 PASS 门禁 |
| FAIL | 7 | 不符预期，根因见缺陷清单 |
| BLOCKED | 12 | 云凭证失效 / 沙箱上游不可用 / 缺 obsutil |
| SPEC-MISMATCH | 2 | D9-9 契约漂移、D10-4 规则计数漂移 |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 34 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | EXP-E01 / EXP-E08 路由 MISS |
| BLOCKED | 3 | EXP-C4-01/04/06 真机建删被 IAM 拒绝 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

### 3.3 使命清单（mission-001，9 条 P0）

全部 PASS：D4-1、D4-2、D4-4、D4-5、D4-7、D4-15、D4-16、D4-25、D4-27（凭证拦截 / 审批 / 脱敏红线基线）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链 dist-tags 解析失败导致静默降级 | `update-check.mjs:81-86` / `:116,120` | 历史问题 |
| 2 | P0 | `D4-19` | D4安全 | 确认流程风险预检未生效（plan 未合并风险裁定） | `tools.mjs:1349` + `hcloud-cli.mjs:371` | 历史问题 |
| 3 | P1 | `D2-10` | D2认证 | profile 参数以空格分隔两参数传入，KooCLI 报 USE_ERROR | `tools.mjs:2048` / `:2112` | 历史问题 |
| 4 | P1 | `D4-8` | D4安全 | hook 双路径判定不一致（源码 deny vs MCP 工具 warn） | `tools.mjs:1363-1364` | 历史问题 |
| 5 | P1 | `D10-3` | D10评测 | serviceCatalog 路由准确率 86.7% < 90% 门禁 | `tools.mjs:2360` / `:2589` | 历史问题 |
| 6 | P1 | `D9-9` | D9协议 | initialize capabilities 未声明取消能力（SPEC-MISMATCH） | `mcp-protocol.mjs:60` | 历史问题（契约） |
| 7 | P2 | `D1-68` | D1安装 | HUAWEICLOUD_REGION 未优先于 HW_REGION | `auth/credentials.mjs:225`（同源 `:173`,`:339`） | 历史问题 |
| 8 | P2 | `D8-9` | D8质量 | sanitizeValue 未移除 AK/SK/token 敏感值 | `telemetry/telemetry.mjs:190-197` | 历史问题 |
| 9 | P1 | `EXP-E01` | D10评测集 | 「查北京四云主机」未命中 ECS（并入 D10-3） | 同 #5 | 历史问题 |
| 10 | P1 | `EXP-E08` | D10评测集 | 「ECS 启动失败求分析」未命中 explain_error（并入 D10-3） | 同 #5 | 历史问题 |
| 11 | 非产品缺陷 | `D10-4` | D4安全 | 规则库 9 deny + 10 warn 与契约 9+7 漂移（SPEC-MISMATCH） | `safety/rules/cloud-risk-rules.json` | 契约确认，不提单 |

### 根因详情

- **D1-39（P0）** 期望：`dist-tags --json` 输出非空时 `queryDistTagsSync()` 返回 `{latest,next}` 非空，`judgeUpdate().result ∈ {update_available, up_to_date}`。实际：`current=1.1.14`、`distTags=null`、`result=check_failed`。根因：`parseDistTagsOutput()` 对 `npm.cmd` 包装 banner 解析失败返回 `null`，`update-check.mjs:116/120` 直接降级 `check_failed`。影响 Windows/npm 全量用户升级提示丢失。证据 `evidence/D1-39/stdout.log`。
- **D4-19（P0）** 期望：`VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口在确认流程返回 `findings` 含 `hwc-network-public-admin-port`(deny)。实际：`decision=deny`(write)、`safeToRun=false`、`sgFindings=[]`，无风险 finding。根因：`tools.mjs:1349` → `hcloud-cli.mjs:371 planHcloudCommand` 仅做读写分类，未合并 `risk-rule-engine.evaluateCommandRisk`。证据 `evidence/D4-19/stdout.log`。
- **D2-10（P1）** 实际命令 `hcloud configure show --cli-profile default` → KooCLI `[USE_ERROR]参数 default 的格式错误`。根因 `args.push('--cli-profile', String(profile))` 应合并为单 token `--cli-profile=default`。证据 `evidence/D2-10/stdout.log`。
- **D4-8（P1）** 同一 `hcloud ECS DeleteServer --server_id=abc`：`classifyTextCommand`=deny，`hook_check_command`=warn。根因 `tools.mjs:1364` 仅调 `evaluateCommandRisk`，未与 write/credential 分类合并。证据 `evidence/D4-8/stdout.log`。
- **D10-3（P1）** 15 条中文意图 13 命中（86.7%），MISS=EXP-E01/EXP-E08。根因 `routeMap` 缺「云主机/实例」同义词与排查（explain_error）意图词。证据 `evidence/D10-3/stdout.log`。
- **D9-9（P1，SPEC-MISMATCH）** `initialize` capabilities=`{"tools":{}}`，未声明 cancellation；设计要求取消能力需声明，否则契约漂移。证据 `evidence/D9-9/stdout.log`。
- **D1-68（P2）** `HUAWEICLOUD_REGION=cn-east-3` + `HW_REGION=cn-north-4` 时取到 `cn-north-4`，优先级顺序与契约相反。证据 `evidence/D1-68/stdout.log`。
- **D8-9（P2）** `sanitizeValue('market.token=abc123 password=Passw0rd')` 保留明文，仅去控制字符/截断。证据 `evidence/D8-9/stdout.log`。
- **D10-4（非产品）** `loadRiskRules()`=9 deny + 10 warn，契约 9+7 → 规则库新增 3 条 warn 未同步契约。证据 `evidence/D10-4/stdout.log`。

---

## 五、未执行 / 阻塞用例与原因（BLOCKED 15）

| 用例ID | 维度 | 标题 | 阻塞原因（实测证据） |
|---|---|---|---|
| `D3-B3` | D3功能 | run_readonly 脱敏执行 | 工具与直连 `hcloud` 均 `APIGW.0301 Unauthorized`（本机 KooCLI profile / 只读子账号均失效），无有效基线可比 |
| `D3-C1` | D3功能 | ECS 生命周期 E2E | `ECS CreateServers` 被 IAM 拒绝 `Pdp.0001`（test001 仅只读）；按名复检 0 台，零残留 |
| `D3-C2` | D3功能 | OBS 静态站部署 E2E | KooCLI 无 OBS 建桶命令 + 本机无 `obsutil` 可执行文件 + 仅只读凭证；未建桶，零残留 |
| `D3-C3` | D3功能 | 沙箱部署 E2E | DevStation 上游 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败` |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具冒烟 | 7 工具已注册，但 `check_user` 上游 `HDKIT_UPSTREAM_ERROR` |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 区域参数正确，但 test001 认证失败（APIGW.0301 + 缺 project_id），业务错误码无法验证 |
| `D3-C14` | D3功能 | 沙箱 HDKit 参数与 hwlink 凭证 | 凭证注入前 IAM 拒绝（401 / APIGW.0301）+ sandbox_connect 25s 无响应 |
| `D3-S2` | D3功能 | 场景-删 VPC 先确认 | 未确认零执行（rejected）正确；真机 `CreateVpc` 被 IAM 拒绝，`tctest-s2` 归零 |
| `D3-S3` | D3功能 | 场景-沙箱预览出 URL | `sandbox_connect` 25s 超时，无法产出公网 URL |
| `D3-S6` | D3功能 | 场景-FunctionGraph 定时任务 | 创建请求缺必填参数（memory_size/package/timeout）+ 无写权限，未创建 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web+RDS)归零 | 沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001） |
| `D4-13` | D4安全 | 最小权限凭证通过率 | 只读子账号 test001 认证失败（APIGW.0301 + 缺 project_id），只读前提不成立 |
| `EXP-C4-01` | D3-C4服务矩阵 | ECS 真机建删 | 只读规划通过；`CreateServers` 获取项目 ID 失败（APIGW.0301），零残留 |
| `EXP-C4-04` | D3-C4服务矩阵 | RDS 真机删 | 只读规划通过；`DeleteInstance` APIGW.0301，零残留 |
| `EXP-C4-06` | D3-C4服务矩阵 | CCE 真机删 | 只读规划通过；`DeleteCluster` APIGW.0301，零残留 |

> **解除条件**：① 下发具备 ECS/RDS/CCE/OBS 写权限的有效管理员 AK/SK，并恢复有效只读子账号（test001）与 KooCLI profile；② 安装 `obsutil`；③ 待 HDKIT/DevStation 沙箱服务恢复。NOT_RUN = 0（无「归我但未跑」用例）。

---

## 六、安全与红线合规

- [x] **凭证泄漏事件：0**。D4-1（读 `.hcloud` 凭证目录）deny、D4-2（env 引用/导出 3/3 deny）、D4-3（明文 secret API 3/3 deny）、D4-15/D4-16（5 种绕过 + 6 种命令包装均拦截）、D4-17（空/异常 fail-closed 3/3）。
- [x] **写操作误判 read-only：0**。D4-5 `Create/Delete` 均 deny；D4-25 分类 read_only/write/not_huaweicloud 正确；D4-29 包装分类正确。
- [x] **红线（I 类）违规：0**。mission-001 九条 P0 全部 PASS。
- [x] **脱敏复核：通过**。D2-4 `plaintext_leak=false`；D4-6/D4-26 AK/SK/token/adminPass 均 `<redacted>`；D4-27 `redactSecrets/redactOutput` 双路径替换且不误伤 region；D9-13 tools/call 无明文凭证。
- [x] **审批闭环**。D4-4/D4-14/D4-18/D4-24 令牌一次性、不可重放、伪造 invalid。
- [x] **注入防护**。D4-11 注入 payload 仅作检索词、未触发 hcloud 执行。

> 遗留（非红线）：D8-9 `sanitizeValue` 遥测值未做 pattern 级脱敏（P2，历史单跟踪）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS 云主机（D3-C1 / D4-13 / EXP-C4-01） | 0（IAM 拒绝 `Pdp.0001` / `APIGW.0301`） | 0（未创建） | 按名 `tctest-ro13` 复检 0 台 |
| VPC（D3-S2） | 0（IAM 拒绝） | 0（未创建） | `ListVpcs` 不含 `tctest-s2` |
| RDS / CCE（EXP-C4-04 / 06 / D3-S7） | 0（IAM 拒绝） | 0（未创建） | 无实例/集群创建记录 |
| OBS 桶（D3-C2） | 0（无 obsutil + 只读凭证） | 0（未创建） | 无桶操作 |
| FunctionGraph（D3-S6） | 0（参数不全 + 无写权限） | 0（未创建） | 无函数创建 |
| DevStation 沙箱（D3-C3/C6/C14/S3/S7） | 0（上游不可用） | 0（未创建） | `sandbox_connect` 超时，无实例 |

> **结论**：本轮真云调用全部在「创建资源」步骤前被 IAM / 参数 / 上游服务拒绝，**云端零残留**，无需销毁。

---

## 八、遗留与建议

1. **凭证是当前最大阻塞源**：S1 全局凭证库为占位值（`AK_BK_00000000000000`）、KooCLI profile（test001）与只读子账号注入均 `APIGW.0301`。建议本机重新下发有效管理员 + 只读子账号 AK/SK（并刷新 KooCLI profile），否则 8 条真机写用例（D3-B3/C1/S2/C7、D4-13、EXP-C4-01/04/06）无法闭环。
2. **补装 obsutil** 以解开 D3-C2 OBS 静态站 E2E（KooCLI 不覆盖 OBS 建桶）。
3. **沙箱上游（HDKIT/DevStation）** 连续多日 `HDKIT_UPSTREAM_ERROR` / 25s 超时，建议在服务恢复后补测 D3-C3/C6/C14/S3/S7。
4. **D3-S6** 探针缺 FunctionGraph 必填参数（memory_size/package/timeout），建议补全创建参数后重跑。
5. **历史缺陷复核**：9 FAIL + 2 SPEC-MISMATCH 全部与昨日（2026-11-19）同源，无新增回归；建议推动 #1063（D1-39）、#1133（D4-19）、#852/#705（D10-3 路由）等 P0/P1 历史单修复。
6. **契约对齐**：D10-4 规则计数（9+10）与用例契约（9+7）漂移，属用例/文档侧更新，不单独提单。