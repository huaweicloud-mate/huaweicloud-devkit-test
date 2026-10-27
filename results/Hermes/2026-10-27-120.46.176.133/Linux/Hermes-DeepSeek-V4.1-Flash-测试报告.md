# Hermes-DeepSeek-V4.1-Flash 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4.1-Flash-测试报告.md`
> **生成时间**：2026-10-27 09:52:00（北京时间，当日第二次执行·全量刷新）
> **执行归档**：`results/Hermes/2026-10-27-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.12（npm `latest` 正式版，gitHead `4ed07801`）
> **测试客户端**：Hermes (DeepSeek-V4.1-Flash) / Linux (aarch64) / 120.46.176.133
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43）
> **执行说明**：本日为该 IP 的第二次全量执行（09:36–09:46 重跑 prepare_env 拉最新后全量重执探针），结果与当日首轮一致——同一 SUT（gitHead `4ed07801`）13 项缺陷全部连续复现。
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项；同一 SUT，10 项 FAIL + 3 项 SPEC 连续复现；沙箱类 3 项因服务维护 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4.1-Flash` |
| OS / 架构 | `Linux` (aarch64) |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |
| 源码仓库检出 | `hdk` @ `4ed07801`（release-1.1.12） |
| npm 私仓 vs 官方 | 私仓 `latest=1.1.12` = 官方 `1.1.12`（本轮无版本漂移） |

> **执行方法（真实执行，非文档解读）**：
> ① **源码级直调探针**：分组探针 `d2-auth` / `d1-upgrade` / `d4-security` / `mcp-tools` 直调本地 hdk 源码函数（`redactSecrets` / `classifyHcloudArgs` / `judgeUpdate` / `dispatch` / `decorateResult` 等），逐断言判定后按用例 ID 拆分证据（同一用例被多组覆盖时，任一断言失败即整体判 FAIL，防掩盖真 P0）；
> ② **专用探针**：`probe_cloud.mjs`（真云只读+规划）、`probe_cloud2.mjs`（真云 OBS/C13 等）、`probe_d10.mjs`（eval harness 路由层 + 风险规则）、`probe_missing.mjs`（遥测/协议/安全补漏）、`probe_telemetry.mjs`、`probe_c7.mjs`、`probe_s6.mjs`、`probe_d3s3.mjs` 等，各自 `writeFileSync` 落盘 `evidence/<case-id>/stdout.log`；
> ③ **真云 E2E 真机执行**：`scripts/realcloud_e2e.mjs`（D3-C1/C6）+ 修正探针 `probe_d3c1_fixed.mjs`/`probe_d3c2_fixed.mjs`（建删归零复核）；
> ④ 每用例证据独立落 `evidence/<case-id>/`（`probe.mjs` + 非空 `stdout.log`），回填 `backfill_daily.py --write` 一次写回三份 CSV（设计级 107 + 展开级 43 = 150 条）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148`（NOT_RUN 2 为 OS 专属/超每日范围；BLOCKED 3 为沙箱服务维护） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 10 / 3 / 3 / 2` |
| 通过率（分母 = PASS+FAIL = 142） | `93.0%` |
| P0 / P1 / P2 新增缺陷 | `2 / 5 / 3`（另 SPEC 3 项） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `已归零（本轮真云用例创建的 3 组 testbot3-hermes-* VPC+子网+ECS 因脚本 finally 归零判定缺陷遗留，测试侧复核后手动反序补删并复核：ECS(本次)=0 / 子网(本次)=0 / VPC(本次)=0 / EIP total_count=0；账户内其余 VPC 为他客户端 openclaw 与另一并发 agent 资源，未触碰）` |

> **较 2026-10-26（v1.1.12，gitHead `4ed07801`）变化**：
> - 被测包为**同一版本**（npm latest 未推进，`1.1.12` = 上一轮），本轮 13 项缺陷（FAIL 10 + SPEC 3）**连续复现**，无新增/净修复；
> - **沙箱服务进入维护窗口**（`HDKIT_SANDBOX_MAINTENANCE`），D3-C3/D3-C6/D3-S3 三项沙箱用例**本轮改判 BLOCKED**（上一轮 D3-C3 为产品 FAIL，本轮因沙箱整体不可用无法复现/证伪）；
> - 全部 13 项经 `file_issue.py` 查重**命中上游既有 open issue**（`HISTORY_LINKS.md`），本轮为连续复现复核，不重复开单。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 沙箱服务维护（D3-C3/D3-C6/D3-S3），写 blockedReason |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `2` | 未执行（OS 专属 1 + 超每日范围 1） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

> 门禁复核：`verify_no_fake_pass.py` 通过（所有 PASS 用例均有 evidencePath 且证据存在）；`verify_coverage.py` 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.9% ≤ 15%，BLOCKED 3 项均含原因）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（JSON 小写 ak/sk 未脱敏） | `src/safety-policy.mjs:34/49` 键名正则未覆盖小写 `ak`/`sk` | 历史命中（不重复开单） |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（非法时序未拒绝） | `src/mcp-protocol.mjs:57` `tools/list` 分支无 initialize 前置校验 | 历史命中（不重复开单） |
| 3 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（错误码与契约不符） | `src/tools.mjs` `explain_error` 映射未覆盖 `Common.0013`/`VPC.0501` | 历史命中（不重复开单） |
| 4 | P1 | `D3-S1` | D3功能 | 场景-只读查 ECS：`serviceCatalog` 中文「云主机」路由 MISS | `src/tools.mjs:2190 routeMap`（ECS 关键词 ~:2200）缺「云主机」 | 历史命中（不重复开单） |
| 5 | P1 | `D4-4` | D4安全 | 写操作审批门：`Change*` 变更类动词漏拦截 | `safety/policy.json:27 writeOperationPrefixes` 缺 `Change` 前缀 | 历史命中（不重复开单） |
| 6 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（1 条中文意图 MISS） | `src/tools.mjs` routeMap 缺「云主机」（同 #4/#7 根因） | 历史命中（不重复开单） |
| 7 | P1 | `EXP-E01` | D10评测 | 评测集「云主机」中文意图路由 MISS | `src/tools.mjs` ECS routeMap 缺「云主机」同义词 | 历史命中（不重复开单） |
| 8 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由仅命中单一服务 | `src/tools.mjs serviceCatalog` 单关键词并集，无复合意图分层拆解 | 历史命中（不重复开单） |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类：写操作落 `cli:invoke` | `hooks/huaweicloud-safety.py:46 WRITE_OPERATION_RE`；`:24 PLUGIN_DIR` 误指向 `plugins/` | 历史命中（不重复开单） |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（`--password <值>` 明文残留） | `src/risk-rule-engine.mjs:22 redactEvidence` 仅匹配 `key[:=]value` 形态 | 历史命中（不重复开单） |
| — | P2 | `D1-65` | D1安装 | 调试模式环境变量仅认字面量 `'true'`（**SPEC-MISMATCH**） | `src/telemetry/telemetry.mjs:81` `=== 'true'` 严格比较 | 历史命中（不重复开单） |
| — | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反（**SPEC-MISMATCH**） | `src/auth/credentials.mjs:225`（另 :173、:339）`HW_REGION \|\| HUAWEICLOUD_REGION` | 历史命中（不重复开单） |
| — | P2 | `D8-9` | D8质量 | `sanitizeValue` 未做凭证脱敏（**SPEC-MISMATCH**） | `src/telemetry/telemetry.mjs:189` 仅 trim/截断/去控制字符 | 历史命中（不重复开单） |

### 根因详情

1. **D2-4【P0】**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 原样返回，SK 明文残留。期望 JSON 形态小写 `ak`/`sk` 键亦被脱敏为占位符。根因 `plugins/huaweicloud-core/src/safety-policy.mjs:34`（`redactString`）/`:49`（`redactSecrets`）键名正则仅覆盖 `access_key`/`secret_key`/大写 `AK=`/`SK=`。证据 `evidence/D2-4/stdout.log`。
2. **D9-12【P0】**：spawn `mcp-server` 后不发 `initialize` 直接 `tools/list`，服务端返回 46 工具列表（未拒绝），非法时序拒绝=false。期望返回 `-32600`。根因 `src/mcp-protocol.mjs:57`（dispatch `tools/list` 分支，`dispatch` 定义于 :30）无 initialize 前置状态机。证据 `evidence/D9-12/stdout.log`。
3. **D3-C7【P1】**：跨区只读查询返回 `Common.0013`（token 的 project 与 region 不匹配）、跨区创建 EIP 返回 `VPC.0501`，与契约预期 `Ecs.0200`/`Ecs.0021` 精确错误码不符。根因 `src/tools.mjs` `explain_error` 错误码映射未覆盖 `Common.0013`/`VPC.0501`（`huaweicloud_explain_error` 定义 :377、处理分支 :1329）。证据 `evidence/D3-C7/stdout.log`。
4. **D3-S1【P1】**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help ...']`（未命中 ECS）；只读 ListServersDetails 正常。根因 `src/tools.mjs:2190 routeMap`（ECS 关键词清单 ~:2200 含「弹性云服务器/云服务器/服务器/虚拟机/镜像」，缺「云主机」）。证据 `evidence/D3-S1/stdout.log`。
5. **D4-4【P1】**：`ChangeServerOs`/`ChangeServer`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` 判定 `decision=allow, isWrite=undefined`（0/5 拦截），对照 `CreateServers` `decision=deny`。根因 `safety/policy.json:27 writeOperationPrefixes` 列表缺 `Change` 前缀。证据 `evidence/D4-4/stdout.log`。
6. **D10-3【P1】**：eval-harness 15 条中文意图 HIT=13 MISS=1 N/A=1，准确率 92.9%。根因同 #4（routeMap 缺「云主机」）。证据 `evidence/D10-3/stdout.log`。
7. **EXP-E01【P1】**：『帮我查一下我账号在华北北京四有哪些云主机』harness verdict=MISS。根因同 #4。证据 `evidence/EXP-E01/stdout.log`。
8. **D3-S5【P2】**：复合中文意图 → `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未拆分命中预览/沙箱分层目标。根因 `src/tools.mjs serviceCatalog` 单关键词并集路由，无复合意图分层拆解。证据 `evidence/D3-S5/stdout.log`。
9. **D4-25【P2】**：写命令事件 keys=`["cli:read","cli:invoke","cli:invoke"]`（写操作未落 `cli:write`），Node 读取目录存在=false。根因 `hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，空格分隔写动词不匹配；`:24` `PLUGIN_DIR=parents[2]` 误指向 `plugins/`，事件落 `plugins/telemetry` 而 `telemetry.mjs:21` 读 `plugins/huaweicloud-core/telemetry`。证据 `evidence/D4-25/stdout.log`。
10. **D4-26【P2】**：`IAM CreateUser --password MyS3cret123` findings.evidence 明文残留=true，decision=warn。根因 `src/risk-rule-engine.mjs:22 redactEvidence` 正则键名表仅匹配 `key[:=]value` 形态，未覆盖 `--password <值>` 空格形态。证据 `evidence/D4-26/stdout.log`。
11. **D1-65【P2/SPEC】**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 日志增量=0（不生效），仅 `=true` 生效（增量=1254）；契约「1/true 均可」。根因 `src/telemetry/telemetry.mjs:81`。证据 `evidence/D1-65/stdout.log`。
12. **D1-68【P2/SPEC】**：同设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时 `resolveCredentials` 取 `HW_REGION`（cn-test-hw-wins），契约要求 `HUAWEICLOUD_REGION` 优先。根因 `src/auth/credentials.mjs:225`（另 :173、:339 同序）。证据 `evidence/D1-68/stdout.log`。
13. **D8-9【P2/SPEC】**：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回（仅 trim/截断/去控制字符），未移除敏感值。根因 `src/telemetry/telemetry.mjs:189`。证据 `evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 + 改用例建议 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【调归属】 | Windows 专属 P0 用例（OS 列标注「专属」），当前 OS=Linux 不适用，属 AGENTS.md 状态口径唯一例外；Linux 侧由 `EXP-NR3-10`（platform=linux/queryDistTagsSync）代表覆盖且 PASS。无需改用例，归属正确。 |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 【改用例】 | 场景-跨服务交付（Web应用+RDS）需专用编排 harness 与 RDS 实例配额，超出每日单服务真云探针范围；建议转专项隔离执行（补环境+编排脚本），不并入每日 daily 包。 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 + 解除条件 |
|---|---|---|---|---|---|
| `D3-C3` | 设计级 | P1 | BLOCKED | 【补环境】 | 实测 2026-10-27 05:08：华为云沙箱服务处于维护窗口，`huaweicloud_sandbox_connect/exec` 均返回 `HDKIT_SANDBOX_MAINTENANCE`（『沙箱功能正在升级优化，暂时无法使用』）。缺：可用的沙箱服务端。影响：沙箱部署 E2E 链路本日无法建立，5/5 断言失败。解除条件：沙箱服务恢复后重测（`probe.mjs` 已就绪可直接重跑）。 |
| `D3-C6` | 设计级 | P1 | BLOCKED | 【补环境】 | 同上，沙箱 7 隐式工具具名冒烟（check_user/credentials/signature/exec/close 等）因沙箱服务维护整体不可用，5/5 断言失败。解除条件：沙箱服务恢复后重测。 |
| `D3-S3` | 设计级 | P1 | BLOCKED | 【补环境】 | 同上，场景-沙箱预览出 URL 依赖沙箱会话（devbridge 隧道 + nginx），沙箱维护期间探针返回 `HDKIT_SANDBOX_MAINTENANCE`。解除条件：沙箱服务恢复后重测。 |

> BLOCKED 仅用于**真·外部依赖**（华为云沙箱服务端维护，不可由本机解除）；探针已就绪，恢复后可直接重跑，非「缺 harness/缺基准」假阻塞。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`。真云探针全程使用 `~/.config/huaweicloud/credentials.json`（管理员）与 `credentials.readonly.json`（只读子账号，D4-13 经 `run-as-readonly.py` 临时注入 env，不落盘）；只读子账号实测「只读可用=true / 写被拒=true」（CreateVpc 被拒 VPC.0010）。
- [x] 写操作误判 read-only：`无`。D3-C4 22 服务只读规划 22/22 通过，`plan=true decision=allow` 均为只读 API。
- [x] 红线（I 类）违规：`0`。
- [x] 脱敏复核：产品侧发现 3 项脱敏缺陷（D2-4 小写 ak/sk、D4-26 `--password` 空格形态、D8-9 sanitizeValue），已如实计入 FINDINGS；测试侧证据文件本身不含明文凭证。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-C1 真云 ECS 生命周期（realcloud_e2e.mjs） | VPC `testbot3-hermes-e2e-3064978816` + subnet + ECS `testbot3-hermes-ecs-3064978816` | 脚本 finally 未删净（List 限流误判为已归零）→ **测试侧复核发现后手动反序补删** | ✅ 本次 VPC/子网/ECS 均消失 |
| D3-C1 修正探针（probe_d3c1_fixed.mjs） | VPC `testbot3-hermes-e2e-3065208471` + subnet + ECS `testbot3-hermes-ecs-3065208471` | `hcloud ECS DeleteServers --delete_volume=true` → 反序删 subnet → 删 VPC | ✅ ECS `count=0`、本次 VPC/子网均消失 |
| 真云 E2E 第三组（Phase C 重试/并发会话） | VPC `testbot3-hermes-e2e-3065508610` + ECS `testbot3-hermes-ecs-3065508610` | 同上反序补删 | ✅ 本次 VPC/ECS 均消失 |
| D3-C2 OBS 静态网站 E2E（probe_d3c2_fixed.mjs） | OBS 桶 `testbot3-hermes-obs-3065569640` | 探针自删 | ✅ 删后不存在（探针自校） |
| D3-C13 OBS 静态站（probe_cloud2.mjs） | OBS 桶 `hdk1-c13-65148365` | 探针自删 | ✅ OBS=0 |
| D3-S6 FunctionGraph | 函数 + TIMER 触发器 | 删除函数与触发器 | ✅ `FunctionGraph 归零=true` |
| EIP（D3-C7 跨区 / 通用） | 跨区创建受限（未在本区落资源） | — | ✅ `EIP ListPublicips total_count=0` |
| 终态复核（本次资源） | — | — | ✅ ECS(本次)=0 / 子网(本次)=0 / VPC(本次)=0 / EIP=0 |

> **测试侧发现（非产品缺陷，记录备查）**：`scripts/realcloud_e2e.mjs` 与 `probe_d3c1_fixed.mjs` 的 finally 清理在 `List*` 接口被限流返回空文本时误判「无资源需清理」，本轮再次遗留 3 组 `testbot3-hermes-e2e-3064978816` / `-3065208471` / `-3065508610`（各含 VPC + 子网 + ECS）；测试侧复核发现后已用 `cleanup_1027.py` 反序补删（ECS DeleteServers `--delete_volume=true` → 删 subnet → 删 VPC，子网删除与 VPC 删除间需等待异步生效后重试）并复核归零。终态账户内剩余 `tctest-openclaw-c1-3065400083-vpc`(+ECS) 为**其他客户端 openclaw** 资源、`hdk-s7-vpc-mvq0xyig` 为**另一并发 agent** 资源，均非本次创建，未触碰。建议该脚本改用「解析 List* 响应 JSON 集合键确证缺席 + 周期重发删除」，勿以空文本判归零（该问题在测试仓库 `huaweicloud-mate/huaweicloud-devkit-test`，不计入源码仓提单）。 |

---

## 八、遗留与建议

1. **P0 两项应优先修复**：D2-4（凭证脱敏缺口，安全面）与 D9-12（MCP 握手时序绕过，协议面）连续多版本复现，建议纳入 v1.1.13 必修。
2. **routeMap 同义词语料**：D3-S1 / D10-3 / EXP-E01 同一根因（缺「云主机」），建议一次性补齐 ECS routeMap 中文同义词表并扩充评测集回归。
3. **SPEC 三项待裁决**：D1-65（DEBUG 认值口径）、D1-68（region 优先级）、D8-9（sanitizeValue 是否应脱敏）——实现与契约漂移，需产品/维护者裁定以文档为准还是以实现为准。
4. **沙箱服务维护影响**：本轮 D3-C3/D3-C6/D3-S3 因沙箱维护 BLOCKED；其中 D3-C3 上一轮为产品 FAIL（`deploy_nginx` 端口冲突自动递增后 `ok=false` 假失败），建议沙箱服务恢复后立即复测以确认是否仍复现。
5. **测试侧改进**：`realcloud_e2e.mjs` / 修正探针归零判定改 JSON 集合键校验（见 §七）；D3-S7 建议转专项 harness。
6. **历史关联**：本轮 13 项产品缺陷（含 3 项 SPEC）经 `file_issue.py` 查重均命中上游既有 open 单，详见 `HISTORY_LINKS.md`，不重复开单。