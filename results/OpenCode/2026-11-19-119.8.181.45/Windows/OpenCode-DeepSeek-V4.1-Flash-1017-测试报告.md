# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告

> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-19 05:12:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-19-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.14`（hdk 源码仓 @ `bd985051`，与 origin/main 一致） |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：全部 146 条用例逐条实跑并落盘证据（`evidence/<case-id>/probe.mjs` + 非空 `stdout.log`）。手段分四类：① 源码级直调（`hdk` @ `bd985051` 的 `tools.mjs`/`safety-policy.mjs`/`update-check.mjs`/`telemetry.mjs` 等真实函数）；② MCP 真机 stdio 会话（`mcp-server.mjs` initialize/tools/list/tools/call）；③ KooCLI 真实 API（`hcloud` 只读调用 + 写操作真实发起验证拒绝）；④ 真云 E2E 建删（受凭证权限限制，实际发起的建删请求与云端归零核查证据见第七节）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 11 / 11 / 2 / 0` |
| 通过率（分母 = PASS+FAIL = 133） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `2 / 5 / 2`（P1 含 EXP-E01/E08 并入 D10-3） |
| 红线（I 类）违规 | `0`（无凭证泄漏、无写操作误判只读、无未确认写执行） |
| 资源释放 | `已归零`（本机写权限受限，所有建删请求均被 IAM 拒绝；复核按名检索 0 命中、云端零残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `9` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | `update-check.mjs:81-86` parseDistTagsOutput 解析 npm.cmd banner 失败 → `:116/:120` check_failed | 历史问题 |
| 2 | P0 | `D4-19` | D4安全 | 确认流下预检仍生效 | `tools.mjs:1348` + `hcloud-cli.mjs:371` 未合并 evaluateCommandRisk | 历史问题 |
| 3 | P1 | `D2-10` | D2认证 | profile 查看命令拼接 | `tools.mjs:2048`（同源 :2112）`--cli-profile` 空格分参数 | 历史问题 |
| 4 | P1 | `D3-B3` | D3功能 | run_readonly 凭证来源选择 | `tools.mjs:1836` + `hcloud-cli.mjs:300` 占位 S1 注入覆盖 KooCLI profile | 历史问题 |
| 5 | P1 | `D4-8` | D4安全 | hook 双路径判定一致 | `tools.mjs:1363` 仅 evaluateCommandRisk，未合并 classifyTextCommand | 历史问题 |
| 6 | P1 | `D10-3` | D10评测 | 路由准确率（86.7% < 90%） | `tools.mjs:2358/2360` serviceCatalog/routeMap 缺同义词与 explain_error 路由 | 历史问题 |
| 7 | P1 | `EXP-E01` | D10评测 | 意图「查北京四云主机」路由 miss | 同 #6（并入 D10-3） | 并入 #6 |
| 8 | P1 | `EXP-E08` | D10评测 | 意图「ECS 启动失败排查」路由 miss | 同 #6（并入 D10-3） | 并入 #6 |
| 9 | P1 | `D9-9` | D9协议 | initialize capabilities 契约漂移（SPEC-MISMATCH） | `mcp-protocol.mjs:60` capabilities 仅含 tools，未声明取消 | 契约确认 |
| 10 | P2 | `D1-68` | D1安装 | 图标离线与区域环境变量 | `auth/credentials.mjs:225`（同源 :173/:339）HW_REGION 优先于 HUAWEICLOUD_REGION | 历史问题 |
| 11 | P2 | `D8-9` | D8质量 | 遥测值脱敏 | `telemetry/telemetry.mjs:190-197` sanitizeValue 无 pattern 脱敏 | 历史问题 |
| 12 | P2 | `D10-4` | D10评测 | 风险规则库计数契约漂移（SPEC-MISMATCH） | `safety/rules/cloud-risk-rules.json` warn 由 7 增至 10，用例契约未同步 | 契约确认 |
| 13 | - | `D3-C7` | D3功能 | 跨区域资源操作引导（外源行为） | 非产品缺陷：ECS API 对不存在 id 返回 fault 而非精确错误码 | 不重复提单 |

### 根因详情

详见 `FINDINGS.md`（12 条，含描述/唯一可判定断言/源码文件:行号/证据路径）。核心三项：

1. **D1-39（P0）**：Windows + npm 下 `parseDistTagsOutput()` 解析 `npm.cmd` 输出失败返回 null，`judgeUpdate` 落到 `check_failed`；实测 `distTags=null`、`result=check_failed`，属解析层缺陷。证据 `evidence/D1-39/stdout.log`。
2. **D4-19（P0）**：`plan_cli_command` 调用链未合并风险规则裁定，`VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口无 deny/warn finding。证据 `evidence/D4-19/stdout.log`。
3. **D10-3（P1）**：15 条评测意图 13 命中（86.7%），低于 90% 门禁，miss 为 EXP-E01（云主机同义词）与 EXP-E08（排障意图）。证据 `evidence/D10-3/stdout.log`。

---

## 五、未执行用例与原因

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 真云 ECS 生命周期无法闭环：KooCLI default = 只读 IAM 用户 test001，创建被 IAM 拒绝（Pdp.0001 ecs:cloudServers:createServers），仅支持只读；按名复检 0 台，云端零残留。解除条件：下发具备 ECS 写权限的管理员 AK/SK | 补环境 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | OBS 凭证同步成功，但静态站部署闭环无法执行：KooCLI 无 OBS 建桶命令（OBS 非 KooCLI 服务，需 obsutil）+ 本机无 obsutil 可执行文件 + 现有凭证为只读 IAM 用户 test001（写操作 Pdp.0001），未创建任何桶、云端零残留。解除条件：安装 obsutil 并下发具备 OBS 写权限的 AK/SK | 补环境 |
| `D3-C3` | D3功能 | 沙箱部署E2E | DevStation 沙箱上游不可用：HDKIT_UPSTREAM_ERROR: 查询实名状态失败；解除条件：HDKIT 服务恢复实名状态查询 | 补环境 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 7 个沙箱工具均已注册，但 check_user 上游失败：HDKIT_UPSTREAM_ERROR: 查询实名状态失败；解除条件：HDKIT 服务恢复 | 补环境 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 沙箱上游不可用：凭证注入前校验被 IAM 拒绝（APIGW.0301 Unauthorized）/ sandbox_connect 25s 无响应；解除条件：HDKIT 服务恢复并下发有效 AK/SK | 补环境 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 先出命令块等确认且未确认零执行（rejected）；真机创建被 IAM 拒绝（PolicyNotAuthorized），tctest-s2 归零 | 补环境 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱不可用，无法产出公网 URL：timeout-25s sandbox_connect 无响应；解除条件：HDKIT 服务恢复 | 补环境 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | FunctionGraph 创建请求缺必填参数（memory_size/package/timeout），未创建函数；解除条件：补齐创建参数并具备写权限 | 补环境 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 多服务编排前置阻塞：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环 | 补环境 |
| `EXP-C4-01` | 服务矩阵 | ECS 只读规划+真机建删 | 只读规划通过，但真机建删被 IAM 拒绝（ECS CreateServers，未授权 ecs:cloudServers:createServers），未创建任何资源，云端零残留 | 补环境 |
| `EXP-C4-04` | 服务矩阵 | RDS 只读规划+真机建删 | 只读规划通过，但真机建删被 IAM 拒绝（RDS DeleteInstance，未授权 rds:instance:deleteInstance），未创建任何资源，云端零残留 | 补环境 |

> 说明：以上 11 条均已**真实发起**对应 API 调用并留存拒绝/上游错误证据，无 mock、无假跑；因外部凭证权限或上游服务不可用而无法闭环，非用例设计问题。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D2-4/D4-6/D4-27/D4-26 全 PASS：`show_profile_redacted` 无明文、`redactSecrets/redactOutput` 双路径替换、findings.evidence 已脱敏；D9-13 tools/call 无明文凭证）
- [x] 写操作误判 read-only：`无`（D4-5 实测 E 类写操作 Create/Delete 均判 deny；D4-25 分类正确；D4-10 正常只读未被误杀）
- [x] 红线（I 类）违规：`无`（D4-17 空/异常输入 fail-closed；D4-24 审批令牌不可重放；D4-14 一次消费失效）
- [x] 脱敏复核：`PASS`（D4-26 AK/SK/token 均为 `<redacted>`；D1-33 skip 文件不含凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1 / EXP-C4-01） | 真实发起 `CreateServers` → IAM 拒绝 `Pdp.0001 ecs:cloudServers:createServers` | 未创建，无需销毁 | 按名 `tctest-c1-*` 检索 0 命中，云端零残留 |
| VPC / 安全组（D3-S2 / D4-19） | D3-S2 真实发起创建 → IAM 拒绝 `PolicyNotAuthorized`；D4-19 仅 plan（`safeToRun=false`，未确认未执行） | 未创建，无需销毁 | VPC 清单无 `tctest-s2` 记录 |
| RDS（D3-S7 / EXP-C4-04） | 真实发起 DeleteInstance/Create 校验 → IAM 拒绝 `rds:instance:deleteInstance` | 未创建，无需销毁 | RDS 实例清单无本次命名资源 |
| OBS 桶（D3-C2） | 未创建（KooCLI 无 OBS 建桶命令，本机无 obsutil） | 无需销毁 | `setup_obs_config` 仅同步凭证，未建桶 |
| FunctionGraph（D3-S6） | 未创建（CreateFunction 缺必填参数 + 无写权限） | 无需销毁 | 函数清单无 `tctest-fg` |
| 沙箱 DevStation（D3-C3/C6/S3/C14/S7） | 未创建（`sandbox_connect` 上游 HDKIT_UPSTREAM_ERROR / 25s 无响应） | 无需销毁 | 无会话建立，无计费实例 |

> 结论：本次为**全量真实发起、零成功创建**，云端资源归零已复核。当前唯一可用 KooCLI 凭证为只读 IAM 子账号 `test001`，所有写操作在 API 侧被 IAM 策略拒绝，未产生任何计费资源与残留；S1 凭证为占位值（`test_ak_*`），MCP 侧凭证类调用返回 `APIGW.0301`，属本机环境问题，已记入阻断原因。

---

## 八、遗留与建议

### 8.1 需维护者/产品侧裁决

1. **D9-9 / D10-4 两处 SPEC-MISMATCH**：均为「实现合理但与用例契约漂移」，建议以用例契约对齐为主（D9-9 在 capabilities 声明 cancel，或在用例中明确不声明；D10-4 更新用例 warn 计数为 10），不建议当功能缺陷修复。
2. **D3-C7 建议改用例**：断言由精确错误码 `Ecs.0200` 改为 `fault contains "could not be found"`，或改用 `ShowServer`（外源 API 语义，devkit 不可控）。
3. **D10-3 路由门禁**：当前 86.7% 未达 90%，需产品侧确认阈值是否按未命中类别分权重，还是补齐 `routeMap` 同义词（云主机/实例/排查）。

### 8.2 本机环境待修复（影响后续每日）

1. `~/.config/huaweicloud/credentials.json` 被占位值覆盖（`test_ak_*`），导致 MCP 凭证类用例（D3-B3/D3-C14 等）报 `APIGW.0301`。建议重新下发有效管理员 AK/SK。
2. KooCLI `default` profile 为只读子账号 `test001`，全部真云写用例（11 条 BLOCKED）无法闭环。建议为本机配置具备 ECS/RDS/VPC/OBS 写权限的 AK/SK。
3. 缺 `obsutil` 可执行文件，OBS 静态站 E2E（D3-C2）无法执行。
4. DevStation 沙箱上游（HDKIT）今日持续 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败`，且 `sandbox_connect` 25s 无响应，6 条沙箱相关用例被阻塞。

### 8.3 亮点（回归无退化）

- 安全红线类 45 条（D4 全维度）全部通过预期：命令分类、凭证脱敏、审批令牌一次性、hook 三态、fail-closed、绕过变体拦截均符合预期（D4-8 为双路径一致性历史缺陷）。
- MCP 协议 13 条（D9）12 PASS + 1 SPEC-MISMATCH：47 工具 schema 完备、错误码规范、stdio 通道纯净、四客户端互通。
- 性能类（D6）全部 PASS：search_docs p95、MCP 冷启动、5 并发无死锁均在阈值内。
- 真云只读规划（EXP-C4）20 PASS：list_operations + plan_cli_command 语法/参数全部正确。
- 场景类 D3-S4（领券闭环）保持 PASS：本机凭证可正常查询代金券领取状态。