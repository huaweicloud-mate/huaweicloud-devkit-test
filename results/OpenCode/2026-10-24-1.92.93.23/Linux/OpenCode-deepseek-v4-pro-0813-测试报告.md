# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-24 05:20（北京时间）
> **执行归档**：`results/OpenCode/2026-10-24-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项，已历史查重全部命中既有 open issue）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（npm latest，gitHead `4ed07801`，正式版） |
| 工具全集 | `46`（`tools.mjs` `TOOL_DEFINITIONS`） |
| hcloud / 依赖 | `hcloud (KooCLI) 7.2.12`（插件配对 7.3.12，check_cli 提示 version_mismatch 可 install-hcloud 对齐） |
| 真云凭证 | `cn-north-4`（AK/SK 主账号 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（已按客户端+OS 预筛） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.log`；CLI 真机执行记录日志；真云 E2E 建删资源（ECS/OBS/VPC/沙箱/EIP/只读子账号）并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.7%` |
| P0 / P1 / P2 新增缺陷（FAIL） | `3 / 5 / 4` |
| P0 / P1 / P2 契约漂移（SPEC-MISMATCH） | `1 / 1 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/OBS/VPC/沙箱/EIP 均已删并核实不含本次资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `1` | D1-39（Windows 升级检测链专属，Linux 不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（serviceCatalog「云主机」未命中 ECS） |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 所有缺陷均为真实执行后填写；根因定位到文件:行号；全部命中上游历史 open issue（见 HISTORY_LINKS.md 查重结果），本轮为复核，不重复开单。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖裸 access_key | `env \| grep -i access_key` 应返回 `deny risk=credential` | 返回 `allow risk=not_huaweicloud` | `src/safety-policy.mjs:546` | 历史复核 |
| 2 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL 宽 IAM 制品 | HCL `actions=["*"]` 与 `AdministratorFullAccess` 应 `deny` | 返回 `decision=allow findings=[]` | `safety/rules/cloud-risk-rules.json:196-218` | 历史复核 |
| 3 | P0 | `D9-12` | initialize 握手协议安全基线两处缺口 | initialize 应执行 runVersionCheck；非法时序 tools/list 应拒 `-32600` | runVersionCheck 未调用；未 initialize 即 tools/list 未拒（listed=true） | `src/mcp-protocol.mjs:32-59` | 历史复核 |
| 4 | P1 | `D3-S3` | 沙箱预览 URL 未返回（deploy_nginx 写验证假阴性） | deploy_nginx 应返回 `ok:true` 与可访问 URL | `ok:undefined url=`，但 deploy_check 实测 HTTP 200 | `src/sandbox/session-manager.mjs:814-820` | 历史复核 |
| 5 | P1 | `D3-S7` | 复合意图未分解 + RDS 最小实例创建失败 | 复合意图应命中 RDS+部署目标；RDS 最小实例应成功 | 仅命中 RDS（部署目标命中=false）；`[USE_ERROR]Invalid parameter: db.port` | `src/tools.mjs:2281` + `src/hcloud-cli.mjs` RDS REQUIRED_PARAMS | 历史复核 |
| 6 | P1 | `D4-6` | adminPass 回显警告与脱敏不覆盖 command 阶段/空格/JSON 形态 | 命令行含 `--admin-pass <value>` 应告警且不回显 | `hook_check_command(admin-pass)` 返回 `decision=allow findings=[]`；空格/JSON 形态未脱敏 | `safety/rules/cloud-risk-rules.json:74` | 历史复核 |
| 7 | P1 | `D4-17` | hook 模糊/畸形输入 fail-open | 模糊/畸形输入应 fail-closed | 空串/`&& rm -rf`/`$(curl)`/`\x00` 均判 `ok` | `src/risk-rule-engine.mjs:103` | 历史复核 |
| 8 | P1 | `EXP-E01` | serviceCatalog 中文意图「云主机」未命中 ECS | 「云主机」应命中 ECS（run_readonly） | 返回 `Run hcloud --help`（MISS） | `src/tools.mjs:2033-2037` | 历史复核 |
| 9 | P2 | `D3-S5` | 复合意图分层路由未分解 | 复合意图（存储+托管）应拆分命中多个 service | 仅返回兜底 skills、多路=false | `src/tools.mjs:2023-2277` | 历史复核 |
| 10 | P2 | `D3-S6` | FunctionGraph 定时任务最小参数创建失败 | CreateFunction 最小参数集应成功返回 URN | `[USE_ERROR]Invalid parameter: code.zip_file`，URN 未返回、触发器未绑定 | `src/hcloud-cli.mjs:745` | 历史复核 |
| 11 | P2 | `D4-25` | Python hook 写操作遥测误分类 cli:invoke | 写操作事件 key 应为 `cli:write` | 变为 `cli:invoke` | `hooks/huaweicloud-safety.py:46` | 历史复核 |
| 12 | P2 | `D4-26` | findings.evidence 脱敏未覆盖 JSON 带引号 key | 所有 AK/SK/adminPass 无明文残留 | `secret_key`/`adminPass` 明文残留（`access_key` 已脱敏） | `src/risk-rule-engine.mjs:22-23` | 历史复核 |
| 13 | P0 | `D10-4` | 安全规则库计数契约漂移（16→19 条） | 用例断言与规则库条数一致（9 deny + 7 warn） | 规则库 19 条（9 deny + 10 warn） | `safety/rules/cloud-risk-rules.json` | SPEC（历史复核） |
| 14 | P1 | `D9-9` | capabilities 未声明 cancellation（契约漂移） | 协议契约应声明 cancellation | `capabilities:{"tools":{}}` | `src/mcp-protocol.mjs:47-49` | SPEC（历史复核） |
| 15 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK/token（契约漂移） | sanitizeValue 应移除/脱敏敏感值 | 原样返回 AK/SK/token | `src/telemetry/telemetry.mjs:189-197` | SPEC（历史复核） |

### 根因详情（P0/P1 缺陷附代码片段）

**#1 [P0] D4-2 凭证 env 打印拦截未覆盖裸 access_key**
- 期望：`env | grep -i access_key` → `deny risk=credential`
- 实际：`decision=allow risk=not_huaweicloud`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:546` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 仅匹配云厂商前缀，未覆盖裸 `access_key`/`secret_key` 变量名。
- 证据：`evidence/D4-2/stdout.log`（classify.log D4-2 节）

**#2 [P0] D4-21 hook_check_artifacts 未拦截 HCL 宽 IAM 制品**
- 期望：HCL `actions=["*"]` 与 `AdministratorFullAccess` 托管策略引用 → `deny`
- 实际：`decision=allow findings=[]`（对照 JSON broad IAM 正确 deny）
- 根因：`safety/rules/cloud-risk-rules.json:196-218` hwc-iam-admin-policy 仅匹配 JSON `"Action":"*"` 形态，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess`。
- 证据：`evidence/D4-21/stdout.log`（hook.log + hcl-probe.log）

**#3 [P0] D9-12 initialize 握手协议安全基线两处缺口**
- 期望：initialize 调用 runVersionCheck；非法时序 tools/list 被拒 `-32600`
- 实际：`runVersionCheck in init=false`；tools/list（未 initialize）返回 46 工具未拒
- 根因：`src/mcp-protocol.mjs:32-59` initialize 仅做 hash/telemetry 不接 runVersionCheck；dispatch 无 initialize 前置状态机。
- 证据：`evidence/D9-12/stdout.log`（d9-12.log）

**#5 [P1] D3-S7 复合意图 + RDS 最小实例创建失败**
- 期望：复合意图命中 RDS + 部署目标；RDS 最小实例创建成功
- 实际：仅命中 RDS；`[USE_ERROR]Invalid parameter: db.port`（1.1.12；1.1.10 为 db.password）
- 根因：`src/tools.mjs:2281` routeMap 复合意图未分解部署目标；`src/hcloud-cli.mjs` RDS CreateInstance REQUIRED_PARAMS 未覆盖 `--port`/`--password` 形态。
- 证据：`evidence/D3-S7/stdout.log`（new-fg-rds.log D3-S7 节）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），Linux/macOS 由 NR3 终端矩阵按负面/环境验证覆盖（disttags-probe 已在 Linux 实测 queryDistTags 返回对象无 EINVAL 异常） | 本用例 OS 归属应为 Windows 专属，Linux 侧无需执行；无需改用例 |

> 无其它未执行为 NOT_RUN / BLOCKED 用例（真云用例均已真机执行，无环境阻塞项）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云探针全程 redact，无 AK/SK 明文落盘）
- [x] 写操作误判 read-only：`0`（D4-5/realcloud 实测写操作均 correct deny/确认流）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证 / 未脱敏日志（`grep -Rl 'HW_SECRET\|SK=\|AKIA\|secretAccessKey":[^<]' evidence/` 无命中明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 realcloud） | 是（tctest-opencode-*） | 已删 | ListVpcs 不含本次资源（containsOwn=false） |
| ECS（D3-C1） | 是（c6.large.2 最小规格） | 已删（含磁盘 delete_volume） | 归零验证不含本次服务器；VPC+子网 cleanOk=true |
| OBS 桶（D3-C2） | 是（tctest-opencode-obs-*） | 探测后删除 | curl200 后清对象+删桶归零 |
| EIP（D3-C7） | 是（CreatePublicip 返回 id） | 已删（DeletePublicip 释放） | 释放成功 exitCode=0 |
| VPC（D3-S2） | 是（tctest-opencode-s2-*） | 确认后删除 | 归零=true |
| 沙箱（D3-C3/D3-C6/D3-S3） | 是（会话级 e7e931083…） | close_session | 会话关闭，无残留 |
| 只读子账号 profile（D4-13） | 是（test001 profile） | 恢复 default | 未创建任何 VPC（residualZero=true） |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留 = 0。
> 观测说明：账号内存在他人客户端资源（如 `testbot2-dsh-vpc-*`、`testbot3-hermes-ecs-*`，列表见 D3-S1/D3-C7 只读结果），均非本次创建，未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D8-9`（sanitizeValue 脱敏契约）、`D9-9`（capabilities.cancellation）、`D10-4`（安全规则库计数 16→19）。
- 历史问题：全部 15 项缺陷命中上游 open issue，本轮为复核，未重复开单（见 HISTORY_LINKS.md）。
- 版本对比（1.1.10 → 1.1.12）：工具数 43 → 46；D3-S6/D3-S7 报错参数名漂移（D3-S6 本轮为 `code.zip_file`，D3-S7 为 `db.port`），功能级结论不变；DMS/DEW 升级为聚合服务（DMS→Kafka/RabbitMQ/RocketMQ、DEW→KMS/CSMS），routing-probe/realcloud-probe 探针断言滞后需适配聚合形态。
- 评测集路由（D10-3）本轮实测准确率 92.9%（HIT=13 MISS=1 N/A=1），唯一 MISS 为 EXP-E01「云主机」。
- 本轮范围：真云 E2E（ECS/OBS/沙箱/VPC/EIP/只读子账号）已全部真机执行；多终端矩阵由展开级 EXP-D5 客户端矩阵代表。
- 建议：D4-6 真云 E2E「创建 ECS 含 adminPass 回显警告」需真云写场景，本轮以源码级探针覆盖 command/flag/JSON 形态缺口（FINDINGS #6），非源级断言缺口保留。