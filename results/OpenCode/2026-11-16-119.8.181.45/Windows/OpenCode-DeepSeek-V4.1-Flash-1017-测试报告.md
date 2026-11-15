# OpenCode-DeepSeek-V4.1-Flash-1017 每日测试报告
> **报告名**：`OpenCode-DeepSeek-V4.1-Flash-1017-测试报告.md`
> **生成时间**：2026-11-16 05:20:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-16-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `DeepSeek-V4.1-Flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.14-next.5`（npm 全局安装；源码 `hdk` @ `4fb59d76`，tag v1.1.14-next.5） |
| daily 基础用例 | 设计级 107 / 展开级 39（另使命 mission-001 9 条已纳入设计级） |

> **执行方法**：逐用例探针（`evidence/<case-id>/probe.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 与 MCP 协议（stdio JSON-RPC），CLI 类用例真实执行 `hcloud`；真云用例真实调用华为云 API（只读清单核验 + 写操作真实发起并记录拒绝码），全部 stdout 落盘 `evidence/<case-id>/stdout.log`。
> **环境**：Node v22.22.2 / npm 12.1.0 / Python 3.11.9 / KooCLI 7.3.12；凭证：KooCLI default = 只读 IAM 子账号 test001（读可用、写 Pdp.0001），S1 credentials.json 为占位值（APIGW.0301）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 11 / 11 / 2 / 0` |
| 通过率（分母 = PASS+FAIL = 133） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `2 / 5 / 2`（另 SPEC-MISMATCH 2 项，见 §4.2） |
| 红线（I 类）违规 | `0`（无 mock 假跑、无无证据 PASS、无越权写资源） |
| 资源释放 | `全部归零`（本机无可写凭证，未创建任何云资源；只读查询 0 侧效应） |

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

### 4.1 产品缺陷

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 更新检测链路 dist-tags 解析被吞导致静默降级 | `plugins/huaweicloud-core/src/update-check.mjs:86`（另 `:115-116`） | 历史问题（见 HISTORY_LINKS.md） |
| 2 | P0 | `D4-19` | D4安全 | 确认流程风险预检未生效（plan 未合并风险裁决） | `plugins/huaweicloud-core/src/tools.mjs:1349` + `src/hcloud-cli.mjs:371` | 历史问题 |
| 3 | P1 | `D2-10` | D2认证 | `--cli-profile` 以空格两参数形式传入，KooCLI 报 USE_ERROR | `plugins/huaweicloud-core/src/tools.mjs:2048`（同类 `:2112`） | 历史问题 |
| 4 | P1 | `D3-B3` | D3功能 | 只读通道注入占位凭证覆盖有效 KooCLI profile（APIGW.0301） | `plugins/huaweicloud-core/src/tools.mjs:1836` + `src/hcloud-cli.mjs:300` | 历史问题 |
| 5 | P1 | `D4-8` | D4安全 | hook 双路径判定不一致（源码 deny vs MCP warn） | `plugins/huaweicloud-core/src/tools.mjs:1364` | 历史问题 |
| 6 | P1 | `D10-3`（含 `EXP-E01`/`EXP-E08`） | D10评测 | serviceCatalog 路由准确率 86.7% < 90% 门禁 | `plugins/huaweicloud-core/src/tools.mjs:2358`、`:2360` | 历史问题 |
| 7 | P2 | `D1-68` | D1安装 | `HUAWEICLOUD_REGION` 未优先于 `HW_REGION` | `plugins/huaweicloud-core/src/auth/credentials.mjs:225`（同源 `:173`/`:339`/`setup-cli.mjs:4983`） | 历史问题 |
| 8 | P2 | `D8-9` | D8质量 | `sanitizeValue` 未移除 AK/SK/token 敏感值 | `plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` | 历史问题 |

### 4.2 SPEC-MISMATCH（契约确认，非功能缺陷）

| # | 级别 | 用例ID | 漂移点 | 结论 |
|---|---|---|---|---|
| 1 | P1 | `D9-9` | `initialize` capabilities 仅 `{"tools":{}}`，未声明取消能力 | 契约 vs 实现漂移，`mcp-protocol.mjs:60`；待裁决 |
| 2 | P0 | `D10-4` | 规则库实为 9 deny + 10 warn（用例契约 9+7，warn 多 3 条） | 用例/文档契约需对齐，非功能缺陷 |

### 4.3 非产品缺陷

| # | 用例ID | 说明 |
|---|---|---|
| 1 | `D3-C7` | 外源 `hcloud` 对不存在实例返回 `fault: could not be found` 且 `count=1`，非 `Ecs.0200`；属 KooCLI/ECS API 语义，非 devkit 缺陷，建议改用例断言 |

### 根因详情

- **D1-39**：期望「npm 12 的 `dist-tags --json` 正常输出时 `queryDistTagsSync()` 返回 `{latest,next}`、`judgeUpdate` 为 `update_available|up_to_date`」；实际 `distTags=null`、`result=check_failed`（`npmRaw` 显示真实输出非空）。根因见 `update-check.mjs:86`。证据 `evidence/D1-39/stdout.log`。
- **D4-19**：期望「`VPC CreateSecurityGroupRule 0.0.0.0/0:22` 在确认流返回 `safeToRun=false` 且 findings 含 `hwc-network-public-admin-port`（deny）」；实际未合并风险裁决。证据 `evidence/D4-19/stdout.log`。
- **D2-10**：期望「`plan.args` 含单元素 `--cli-profile=default` 且 KooCLI 退出码 0」；实际两参数形式触发 `[USE_ERROR]`。证据 `evidence/D2-10/stdout.log`。
- **D3-B3**：期望「KooCLI profile 可用时 `run_readonly_command` 返回 ok=true 与真实清单」；实际 `APIGW.0301`，而同刻直连 `hcloud` 返回 `code=0`。证据 `evidence/D3-B3/stdout.log`。
- **D4-8**：期望「同一命令 `classifyTextCommand` 与 `hook_check_command` 决策一致」；实际 deny vs warn。证据 `evidence/D4-8/stdout.log`。
- **D10-3**：期望「路由准确率 ≥90%（≥14/15）」；实际 13/15=86.7%，MISS=`EXP-E01`(ECS)、`EXP-E08`(explain_error)。证据 `evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`。
- **D1-68**：期望「`HUAWEICLOUD_REGION` 优先」；实际 `HW_REGION` 抢先（`region=cn-north-4`）。证据 `evidence/D1-68/stdout.log`。
- **D8-9**：期望「敏感键值替换为占位符」；实际 `abc123`/`Passw0rd` 原样保留。证据 `evidence/D8-9/stdout.log`。
- **D9-9**：期望「capabilities 声明取消能力」；实际 `{"tools":{}}`，缺 notification 0ms 返回 `-32602`。证据 `evidence/D9-9/stdout.log`。
- **D10-4**：期望「9 deny + 7 warn」；实际 9 deny + 10 warn。证据 `evidence/D10-4/stdout.log`。

> 本次 8 条产品缺陷 + 2 条 SPEC-MISMATCH 已在上游 open issues 命中同源（`file_issue.py` 内置历史查重），按红线「不重复开单」处理，关联清单见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 真云 ECS 生命周期无法闭环：唯一可用凭证（KooCLI default = IAM 用户 test001）创建被 IAM 拒绝（Pdp.0001 ecs:cloudServers:createServers），仅支持只读；按名复检 0 台，云端零残留。解除条件：下发具备 ECS 写权限的管理员 AK/SK |
| `D3-C2` | D3功能 | OBS静态站部署E2E | OBS 凭证同步成功，但静态站部署闭环无法执行：KooCLI 无 OBS 建桶命令（OBS 非 KooCLI 服务，需 obsutil） + 本机无 obsutil 可执行文件（where obsutil 未找到，OBS 桶创建/上传/public-read/curl 200/清理无法真实执行） + 现有唯一可用凭证为只读 IAM 用户 test001（写操作 Pdp.0001），未创建任何桶、云端零残留。解除条件：安装 obsutil 并下发具备 OBS 写权限的 AK/SK |
| `D3-C3` | D3功能 | 沙箱部署E2E | DevStation 沙箱上游不可用：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: deacd8522b7145d696d3ce99942d979c]；解除条件：HDKIT 服务恢复实名状态查询 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 7 个沙箱工具均已注册，但 check_user 上游失败：HDKIT_UPSTREAM_ERROR: 查询实名状态失败 [trace: 2782d6cea6994dfc87b72f0c475d85cc]；解除条件：HDKIT 服务恢复 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 沙箱上游不可用："Credential validation failed before injection: IAM rejected the credentials (HTTP 401: {\"error_msg\":\"Incorrect IAM authentication information: Unauthorized\",\"error_code\":\"APIGW.0301\",\"request_id\":\"3b6dc86314dba23cbc76e680dc157ad9\"}\n). The AK/SK is invalid - check the SK for typos or expired security tokens." / "HDKIT_UPSTREAM_ERROR: 沙箱编排上游调用失败: GET /open-api-public/v1/agreements failed [trace: 071be25547ac4063a57a5c5d1c1d874d]"；解除条件：HDKIT 服务恢复 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 先出命令块等确认且未确认零执行（rejected）；真机创建被 IAM 拒绝（PolicyNotAuthorized），tctest-s2 归零 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱不可用，无法产出公网 URL："HDKIT_UPSTREAM_ERROR: 沙箱编排上游调用失败: GET /open-api-public/v1/agreements failed [trace: 9fc8a1cbfd844f1ea97b1fe25b2dc80a]"；解除条件：HDKIT 服务恢复 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | FunctionGraph 创建请求缺必填参数（memory_size/package/timeout），未创建函数；解除条件：补齐创建参数并具备写权限 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 多服务编排前置阻塞：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环 |
| `EXP-C4-01` |  |  | 只读规划通过，但真机建删被 IAM 拒绝（ECS CreateServers -> Pdp.0001 ecs:cloudServers:createServers），未创建任何资源，云端零残留 |
| `EXP-C4-04` |  |  | 只读规划通过，但真机建删被 IAM 拒绝（RDS DeleteInstance -> rds:instance:deleteInstance 未授权），未创建任何资源，云端零残留 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（`D4-1/D4-2/D4-12/D4-13` 等凭证读写拦截用例全部 PASS；`D8-9` 为遥测脱敏缺陷已单列）
- [x] 写操作误判 read-only：`0`（`D3-B3` 为凭证注入缺陷，非分类误判；写操作分类经 `D4-4~D4-11` 验证）
- [x] 红线（I 类）违规：`0`（全部 PASS 用例均有 probe + 非空 stdout + evidencePath；`verify_no_fake_pass.py` 通过）
- [x] 脱敏复核：`show_profile_redacted` 未泄漏明文凭证（`D2-4` PASS）；遥测 `sanitizeValue` 缺陷见 `D8-9`
- [x] 提权/越权：仅使用本机现有凭证；只读子账号 test001 写操作被 IAM 正确拒绝（`D4-13` PASS、`EXP-C4-01/04` BLOCKED 佐证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1 尝试） | 未创建（IAM Pdp.0001 拒绝） | — | 按名复检 0 台 |
| ECS（EXP-C4-01 尝试） | 未创建（IAM Pdp.0001 拒绝） | — | 按名复检 0 台 |
| RDS（EXP-C4-04 尝试） | 未创建（IAM 拒绝 DeleteInstance 权限路径） | — | 清单无新增 |
| VPC（D3-S2 尝试） | 未创建（PolicyNotAuthorized） | — | `tctest-s2` 不存在 |
| OBS 桶（D3-C2 尝试） | 未创建（无 obsutil / 只读凭证） | — | 无新增桶 |
| 沙箱（D3-C3/C6/C14/S3/S7） | 未创建（HDKIT 上游不可用） | — | 无实例 |

> 本机唯一可用凭证为只读 IAM 子账号，所有真云写操作均在 API 层被拒绝，云端零残留；只读查询（ECS/VPC 清单）无副作用。

---

## 八、遗留与建议

1. **P0 优先修复**：`D1-39`（更新通知全链路失效）与 `D4-19`（高危端口公网开放未经风险裁决）建议在下一预发布前修复。
2. **凭证治理**：本机 S1 `credentials.json` 为占位值（APIGW.0301），仅 KooCLI profile 为只读子账号 test001，导致真云写场景（D3-C1/C2/S2/S6/S7、EXP-C4-01/04）无法闭环；建议重新下发可写 AK/SK 并复核 `auth status` 校验逻辑（关联 `D3-B3`）。
3. **工具补齐**：安装 `obsutil` 以恢复 OBS 静态站 E2E（D3-C2）。
4. **用例维护建议**：`D3-C7` 断言应改为 `fault contains "could not be found"` 或改用 `ShowServer`；`D10-4` 规则计数契约与 `cloud-risk-rules.json`（9+10）对齐。
5. **CI 化**：本次 146 条用例全部探针化，单机全量执行约 6 分钟，建议纳入每日流水线并保留 evidence 归档。