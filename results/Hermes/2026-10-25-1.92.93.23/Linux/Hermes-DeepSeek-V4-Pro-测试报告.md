# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-25 05:20（北京时间）
> **执行归档**：`results/Hermes/2026-10-25-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro`（deepseek-v4-pro-0813） |
| OS / 架构 | `Linux aarch64`（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed07801`，与 10-24 同版） |
| 工具全集 | 43 MCP 工具（tools.mjs TOOL_DEFINITIONS，含 serviceCatalog/router） |
| 真云凭证 | `cn-north-4`（管理员 AKSK + 只读子账号 test001 均就绪） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 43（已按客户端+OS 预筛） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与真机 CLI；真云 E2E 通过 `plan_cli_command → run_approved_command` 最低规格创建 → 测后删除并归零验证；证据统一落 `evidence/<case-id>/`（probe.mjs + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（唯一未执行 D1-39 为 Windows 专属 P0，Linux 由 EXP-NR3-10 覆盖） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `134 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 146） | `91.8%` |
| P0 / P1 / P2 新增缺陷（FAIL+SPEC） | `4 / 6 / 5`（含 SPEC：P0 1、P1 1、P2 1） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/子网/OBS/EIP 均删除并 List 复核不含本次资源）` |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 92 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 3 | 契约漂移（D8-9/D9-9 产品缺陷、D10-4 用例断言滞后） |
| NOT_RUN | 1 | D1-39 Windows 专属（OS 列标注「专属」），Linux 由 EXP-NR3-10 覆盖 |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（云主机口语化别名路由 MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `env \| grep -i access_key` 应判 `deny`（裸 access_key 属凭证探测） | 判 `allow (risk=not_huaweicloud)` | `src/safety-policy.mjs:546` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 未匹配裸 `access_key` |
| 2 | P0 | D4-21 | IaC/策略制品预检未覆盖 HCL actions/托管策略 | `AdministratorFullAccess` 与 `actions=["*"]` 应判 `deny` | `[admin-full]` 判 `allow`、HCL `actions=["*"]` 未命中规则 | `safety/rules/cloud-risk-rules.json:196-218` 仅匹配 JSON `Action:*` 形态 |
| 3 | P0 | D9-12 | initialize 握手协议安全基线 | initialize 应接 `runVersionCheck`；非法时序 `tools/list`（未 initialize）应拒 `-32600` | `runVersionCheck in init=false`；未 initialize 时 `tools/list` 仍返回 `listed=true` | `src/mcp-protocol.mjs:32-59` initialize 不接版本检查，dispatch 无 initialize 前置状态机 |
| 4 | P1 | D4-6 | adminPass 回显警告未覆盖 command 阶段 | `hook_check_command --admin_pass` 应告警/拦截且不裸回显密码 | `findings=[]`、`decision=allow`；`--admin_pass 空格` 与 JSON 带引号 key 形态未脱敏 | `safety/rules/cloud-risk-rules.json:74` stages 仅 `artifact/deploy_plan` 未含 `command`；`redactString` 不匹配空格/引号形态 |
| 5 | P1 | D4-17 | hook 模糊输入 fail-open | 空串/空白/`&& rm -rf /*`/`$(curl ...)` 应被拒绝（fail-closed） | 全部判 `ok`（allow） | `src/risk-rule-engine.mjs:103` 无规则命中默认 `decision=allow`（fail-open） |
| 6 | P1 | D3-S3 | 沙箱预览未返回 URL | `deploy_nginx` 应返回可访问 URL（`ok=true`） | `deploy_nginx ok=false, url=空`；但 `deploy_check` 实测 `nginx_serving PASS (HTTP 200)` | `src/sandbox/session-manager.mjs:814-820` `evaluateDeployNginxVerify` 要求 `verify.nginxTest==='PASS'`，沙箱 `nginx -t` 未产出该标记 |
| 7 | P1 | D3-S7 | 跨服务交付（Web+RDS）最小创建缺参 | RDS `CreateInstance` 最小参数集应在部署目标命中时返回实例 ID | `[USE_ERROR]Invalid parameter: db.password`；复合意图部署目标命中=false | `src/tools.mjs:1859` 最小参数集缺 `db.password`；routeMap 无 Web 部署目标分解 |
| 8 | P1 | EXP-E01 | serviceCatalog 口语化别名路由 MISS | 「华北北京四有哪些云主机」应路由到 `ECS` | 路由 MISS（返回 `hcloud --help` 兜底） | `src/tools.mjs:2033-2037` ECS keywords 缺口语化别名「云主机」 |
| 9 | P2 | D4-25 | Python hook 事件遥测分类错误 | `hcloud vpc CreateVpc` 遥测 key 应为 `cli:write` | 记为 `cli:invoke` | `hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 致分类失效 |
| 10 | P2 | D4-26 | findings 证据脱敏残留 | `redactEvidence` 后 `secret_key`/`adminPass` 明文应无残留 | `leaked=true`（`SKSECRETVALUE9`/`MyP@ss12345` 残留） | `src/risk-rule-engine.mjs:22-23` `redactEvidence` 正则 `key\s*[:=]` 不匹配 JSON 带引号 key |
| 11 | P2 | D3-S5 | 复合意图分层路由未分解 | 「存储+托管」复合意图应多路命中多个 service | 单意图匹配，`多路=false`、服务未分解 | `src/tools.mjs:2023-2277` serviceCatalog routeMap 单意图匹配 |
| 12 | P2 | D3-S6 | FunctionGraph 定时任务最小参数缺 code.filename | `CreateFunction` 最小参数集应返回 URN 并绑定触发器 | `[USE_ERROR]Invalid parameter: code.filename`、URN 空、触发器未绑定 | `src/tools.mjs:1854` 最小参数集缺 `code.filename` |
| 13 | P1 | D9-9 | tools/call 取消能力未声明（SPEC） | `capabilities` 应声明 `cancellation` | `capabilities={"tools":{}}`，无 cancellation | `src/mcp-protocol.mjs:47-49` capabilities 仅声明 `{tools:{}}` |
| 14 | P2 | D8-9 | 遥测值脱敏缺失（SPEC） | `sanitizeValue` 应移除 AK/SK/token 敏感值（契约要求） | 仅去控制字符+超长截断，`access_key/secret_key/token` 明文保留 | `src/telemetry/telemetry.mjs:189-197` sanitizeValue 无敏感值脱敏 |

> D10-4（P0，SPEC）为**测试侧**用例断言滞后：规则库已 16→19 条（9 deny + 10 warn），用例仍断言 16 条（9 deny + 7 warn），非产品缺陷，不计入提单（见 FINDINGS.md 标注）。

---

## 五、未执行用例与原因

| 用例ID | 维度 | 标题 | 状态 | 分类 | 原因 |
|---|---|---|---|---|---|
| D1-39 | D1安装 | Windows 升级检测链可用性 | NOT_RUN | 【调归属】 | OS 列标注「专属」：Windows 升级检测链 EINVAL 专属；Linux/macOS 由 NR3 终端矩阵覆盖，本机 Linux 由 EXP-NR3-10 实测（`queryDistTagsSync/queryDistTags` 返回 `{latest:1.1.12, next:1.1.10-next.6}`，无 EINVAL，PASS） |

无 BLOCKED 用例。全部真云用例（建删资源）均已真机执行并归零（见 §七）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**。真云与只读子账号探针均内置 AK/SK 正则脱敏（`HPUA***/AKIA***`），stdout 无明文 AK/SK。
- [x] 写操作误判 read-only：D4-25 遥测分类 `cli:invoke`（应 cli:write）为遥测标签问题，安全拦截层（hook）本身对写操作仍正确 `deny`，未造成放行。
- [x] 红线（I 类）违规：**0 项**。所有高危（凭证文件读取/删除/明文 secret/公网暴露）均被 `deny`/`warn` 拦截（D4-1/3/5/9/15/22/28/29 PASS 佐证）。
- [x] 脱敏复核：D4-26/D8-9 存在敏感值脱敏残留（已列入缺陷清单）。

---

## 七、资源释放（真云 E2E 建删归零）

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14/D3-S2/D3-C1 各自独立） | 最低规格 CreateVpc（192.168.99.0/24 等） | DeleteVpc | ListVpcs 不含本次资源 ✅ |
| 子网（D3-C1） | CreateSubnet | DeleteSubnet | 随 VPC 清理 ✅ |
| ECS（D3-C1） | c6.large.2 单实例 | DeleteServers（delete_volume=true） | ListServersDetails 不含本次资源 ✅ |
| OBS 桶（D3-C2/D3-C13） | obs mb + 上传 index.html | obs rm 清对象 + 删桶 | 桶已删除 ✅ |
| EIP（D3-C7） | 最低规格 | 删除 | 归零核实 ✅ |
| 沙箱会话（D3-C3/D3-C6/D3-S3） | connect/upload/deploy | close_session | 会话关闭 ✅ |

> 全部真云资源均已销毁并归零，无残留。D4-20「拒绝路径零操作」实测未创建任何资源（`notCreated=true`）。

---

## 八、遗留与建议

- **SPEC 裁决（产品侧）**：D9-9（cancellation 声明）、D8-9（遥测敏感值脱敏）需维护者裁决是否纳入后续版本；D10-4 为测试侧用例计数滞后，建议维护侧更新用例断言 16→19 条。
- **修复优先级建议**：P0 三缺陷（D4-2 凭证 env 拦截、D4-21 IaC 预检、D9-12 握手状态机）涉及安全边界与协议健壮性，建议优先修复。
- **未覆盖项**：Windows 专属用例（D1-39）由 Windows 侧客户端代表覆盖，本机 Linux 不适用；D10 真实 Agent 会话评测（需 dsh 的 run-agent-eval）非 Hermes 客户端路径。