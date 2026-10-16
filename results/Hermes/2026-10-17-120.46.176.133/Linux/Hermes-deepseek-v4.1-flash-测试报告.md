# Hermes-deepseek-v4.1-flash 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-17 05:30:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-17-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit `1.1.9-next.0`（npm `next`，gitHead `6302921c`；GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（x86_64） |
| 机器 IP | `120.46.176.133` |
| 被测版本（SUT） | `1.1.9-next.0`（npm `next`，gitHead `6302921c`） |
| daily 基础用例 | 设计级 107 / 展开级 43（共 150） |

> **执行方法**：①**函数/MCP 层探针**——4 组分组探针（d2-auth / d1-upgrade / d4-security / mcp-tools）+ Phase B 专用探针（`probes_stage/*.mjs`），经 `HDK_SRC` 直调 `plugins/huaweicloud-core/src` 的 MCP 工具函数；②**协议真机**——本地起 MCP server（stdio/HTTP）跑 `initialize`/`tools/list`/`tools/call`；③**真云 E2E**——`scripts/realcloud_e2e.mjs` 真机在 cn-north-4 建删 ECS/OBS/沙箱资源（D3-C1/C2/C3/C6），其中 D3-C1/C2 叠加本地修正探针修正测试侧判定缺陷后复测；④**评测 harness**——`eval/harness/run-eval.mjs` 跑 15 条中文意图路由评测。
> **版本漂移核查**：官方 npm 与私有镜像 `dist-tags` 一致（`latest=1.1.8`、`next=1.1.9-next.0`），无镜像滞后，SUT 取二者最高者 `1.1.9-next.0`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 10 / 1 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `93.1%` |
| P0 / P1 / P2 新增缺陷 | `2 / 5 / 3`（另 3 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | `有`：D2-4（JSON 凭证明文残留）、D4-26（findings.evidence 明文口令）——均命中历史单，见 `HISTORY_LINKS.md` |
| 资源释放 | `已归零`：ECS=0、VPC=0、OBS 桶=0、本日无新建 EIP（详见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞（D3-S7） |
| SPEC-MISMATCH | `3` | 契约漂移（D1-65 / D1-68 / D8-9） |
| NOT_RUN | `1` | 未执行（D1-39，Windows 专属 P0 在 Linux） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（路由 MISS） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏对 JSON 字符串不生效（明文 SK 残留） | `src/safety-policy.mjs:35-48`（键名正则缺短键 `ak/sk` 且 `:47` 只匹配全大写、不认引号包裹的 JSON 键） | 命中历史单 #809/#791/#683 等（见 HISTORY_LINKS.md），不重复开单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手时序无状态机（非法时序未拒） | `src/mcp-protocol.mjs:57` `dispatch()` 按方法名直路由，无「已初始化」前置校验 | 命中历史单 #814/#699/#844 等，不重复开单 |
| 3 | P1 | `D3-C7` | D3功能 | 跨区域引导的错误码与用例契约不符（Common.0013 而非 Ecs.0021） | `src/auth/credentials.mjs:224`（region 作用域先于服务层校验失败）+ `src/safety-policy.mjs` 引导层未归一错误码 | 命中历史单 #828，不重复开单 |
| 4 | P1 | `D3-S1` | D3功能 | 场景-只读查 ECS（带不改约束）路由未命中 ECS | `src/tools.mjs` `serviceCatalog.routeMap` 中文关键词缺「只读查询/查看 ECS」短语 | 命中历史单 #844，不重复开单 |
| 5 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出 URL：公网 URL 已生成但不可达（404） | `src/sandbox/session-manager.mjs:1113`（publicUrl 仅正则解析未做可达性校验即返回 ok=true）+ `:1096-1097` 就绪判定未上抛 tunnel 可达失败 | 命中历史单 #762/#786/#936，不重复开单 |
| 6 | P1 | `D10-3` | D10评测 | 评测集路由准确率 92.9%（1 条中文意图 MISS） | `src/tools.mjs` `serviceCatalog.routeMap` 关键词覆盖不足（同 #4） | 命中历史单 #844，不重复开单 |
| 7 | P1 | `EXP-E01` | （展开级） | serviceCatalog 中文意图路由 MISS | `src/tools.mjs` `serviceCatalog.routeMap` 中文关键词缺失（同 #4/#6） | 命中历史单 #705/#826/#852 等，不重复开单 |
| 8 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `src/tools.mjs` `serviceCatalog` 仅单服务关键词首命中，无复合意图拆分 | 命中历史单 #788，不重复开单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 写命令事件分类错误且落错目录 | `hooks/huaweicloud-safety.py:46`（WRITE_OPERATION_RE 前置字符类漏空格分隔写动词）+ `:24`（PLUGIN_DIR=parents[2] 误指向 plugins/） | 命中历史单 #752，不重复开单 |
| 10 | P2 | `D4-26` | D4安全 | findings.evidence 明文密码残留 | `src/risk-rule-engine.mjs` 组装 finding 时未走 `redactString()` | 命中历史单 #809/#791/#683 等，不重复开单 |
| 11 | P2 | `D8-9` | D8遥测 | telemetry sanitizeValue 未做敏感值脱敏（SPEC-MISMATCH） | `src/telemetry/telemetry.mjs:189` `sanitizeValue()` 未调用 `redactSecrets()` | 命中历史单 #896/#844 等，不重复开单 |
| 12 | P2 | `D1-65` | D1安装 | 调试开关仅接受字面量 "true"（SPEC-MISMATCH） | `src/telemetry/telemetry.mjs:81` `=== 'true'` 未兼容 `1` | 命中历史单 #754，不重复开单 |
| 13 | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反（SPEC-MISMATCH） | `src/auth/credentials.mjs:224` `HW_REGION \|\| HUAWEICLOUD_REGION` 优先级写反 | 命中历史单 #765，不重复开单 |

### 根因详情

**#1 D2-4【P0】** 期望：`redactSecrets(<含 ak/sk 的 JSON>)` 结果不含 `SKTEST1234567890abcdef1234`；实际：原样返回，`sk` 明文残留。根因：`src/safety-policy.mjs:35-48` `redactString()` 键名正则要求 `access_key|secret_key` 等长键名，第 47 行 `/(AK|SK)\s*[:=]\s*/g` 只匹配全大写且不认引号包裹的 JSON 键。证据：`evidence/D2-4/stdout.log`。

**#2 D9-12【P0】** 期望：`tools/list` 在 `initialize` 之前调用必须返回 `-32600`；实际：正常返回 `listed:42`。根因：`src/mcp-protocol.mjs:57` `dispatch()` 直接按方法名路由，缺 initialize 前置状态校验。证据：`evidence/D9-12/stdout.log`。

**#3 D3-C7【P1】** 期望：区域不可用→`Ecs.0021`，资源不存在→`Ecs.0200`；实际：只读查询返回 `Common.0013`、跨区创建 EIP 返回 `VPC.0501`（5 项断言 3 通过 / 2 失败；plan 已正确带 `--cli-region=ap-southeast-3`）。根因：`src/auth/credentials.mjs:224` 解析出的 region 作用域先于服务层校验失败 + 引导层未做错误码归一。证据：`evidence/D3-C7/stdout.log`。

**#4 D3-S1【P1】** 期望：只读 ECS 意图 `recommendedServices` 含 `ECS`；实际：`["Run hcloud --help to list available services."]`（只读查询本身成功、零写）。根因：`src/tools.mjs` `serviceCatalog.routeMap` 关键词缺「只读查询/查看 ECS」。证据：`evidence/D3-S1/stdout.log`。

**#5 D3-S3【P1】** 期望：`expose` 返回 `publicUrl` 后 GET 应 200/304；实际：`publicUrl=https://k6wctl7l-8080.devbridge-s2.hwtunnel.com` 连续 4 次 HTTP 探测全 404（`curl=000`），`httpCode` 为空，工具仍返回 `ok=true`。根因：`src/sandbox/session-manager.mjs:1113` 仅由 `TUNNEL_URL_PATTERN`（`:35`）正则解析出 URL 即返回，未做可达性校验；`:1096-1097` 就绪判定未把 `tunnel_url_accessible` 失败上抛。证据：`evidence/D3-S3/stdout.log`。**（10-15 轮曾记同一缺陷，本日复现）**

**#6 D10-3【P1】** 期望：15 条评测集服务路由类意图 HIT 率 100%；实际：HIT=13 MISS=1 N/A=1，准确率 92.9%。根因：`src/tools.mjs` `serviceCatalog.routeMap` 覆盖不足。证据：`evidence/D10-3/stdout.log`。

**#7 EXP-E01【P1】** 期望：`EXP-E01`（「帮我查一下我账号在华北北京四有哪些云主机」）verdict=HIT；实际：MISS。根因：同 #4。证据：`evidence/EXP-E01/stdout.log`。

**#8 D3-S5【P2】** 期望：复合意图拆分命中 >=2 个 service（含预览/沙箱层）；实际：`["ECS"]` + `["huawei-ecs"]`。根因：`src/tools.mjs` `serviceCatalog` 无复合意图拆分。证据：`evidence/D3-S5/stdout.log`。

**#9 D4-25【P2】** 期望：写命令→`cli:write` 且事件落 Node 读取的 telemetry 目录；实际：写命令 `ECS CreateServers` 记为 `cli:invoke`，事件落 `plugins/telemetry`（Node 读 `plugins/huaweicloud-core/telemetry`，存在=false）。根因：`hooks/huaweicloud-safety.py:46` 正则前置字符类 `(^|[A-Za-z0-9])` 漏空格分隔写动词 + `:24` `PLUGIN_DIR=parents[2]` 误指向。证据：`evidence/D4-25/stdout.log`。

**#10 D4-26【P2】** 期望：`findings[].evidence` 中 AK/SK/token/password 替换为 `<redacted>`；实际：`decision=warn findings=1` 的 evidence 含明文 `--password MyS3cret123`。根因：`src/risk-rule-engine.mjs` 未对 evidence 走 `redactString()`。证据：`evidence/D4-26/stdout.log`。

**#11 D8-9【P2 SPEC】** 期望：`sanitizeValue()` 移除 AK/SK/token；实际：原样返回。根因：`src/telemetry/telemetry.mjs:189`。证据：`evidence/D8-9/stdout.log`。

**#12 D1-65【P2 SPEC】** 期望：`HUAWEICLOUD_DEVKIT_DEBUG` 取 `1` 或 `true` 均开启调试日志；实际：`=1` 增量 0、`=true` 增量 1254。根因：`src/telemetry/telemetry.mjs:81`。证据：`evidence/D1-65/stdout.log`。

**#13 D1-68【P2 SPEC】** 期望：`HUAWEICLOUD_REGION` 优先于 `HW_REGION`；实际：`HW_REGION` 胜出。根因：`src/auth/credentials.mjs:224` 优先级写反。证据：`evidence/D1-68/stdout.log`。

> **提单结论**：13 项缺陷经 `file_issue.py` 对上游 open issues 逐条查重，**全部命中历史缺陷单**（无新增），按红线「命中即不重复开单」未新建 issue，关联清单见 `HISTORY_LINKS.md`。
> **测试侧修正（非产品缺陷，不计入提单）**：① D3-C1 —— `scripts/realcloud_e2e.mjs` 以 KooCLI 退出码/被截断的列表文本判归零，误报 FAIL；改用列表响应 JSON 结构确证 + 周期重发删除的本地修正探针后 **5/5 PASS**；② D3-C2 —— 同脚本以退出码判 OBS 建桶成败（本轮成功建桶却返 exit=6），改用输出文本判定后 **4/4 PASS**。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属·结构性不适用】OS 专属 P0（Windows 升级检测链 EINVAL）在 Linux 不适用；归 Linux 侧的升级链路由展开级 `EXP-NR3-10` 代表覆盖且本日 PASS。属 P0 不得 NOT_RUN 的唯一例外（`verify_coverage.py` 按 OS 列「专属」自动豁免）。 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】实测时间 2026-10-17 05:15（北京时间）。缺：①跨服务编排 harness（RDS 创建 + 沙箱部署 + 连接串注入 + 全量归零的串联脚本）②RDS 实例配额（账户未预置 RDS 实例创建配额/规格确认）。影响：跨服务交付链路本日无法取证。解除条件：提供跨服务编排 harness 且账户开通 RDS 最低规格实例配额（**沙箱编排服务本日已恢复**，D3-C3 沙箱部署 5/5 PASS、D3-C6 沙箱 7 隐式工具 5/5 PASS，故非沙箱阻塞）。 |

> 本日 NOT_RUN + BLOCKED 共 2 条（占比 1.3%），远低于 15% 阈值；P0 无 NOT_RUN/空（`verify_coverage.py` 通过）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`有` —— D2-4（`redactSecrets` 对 JSON 形态 AK/SK 不脱敏，明文 SK 残留）、D4-26（`findings.evidence` 含明文口令）、D8-9（`sanitizeValue` 未脱敏）——均为红线 I 类，已入清单（命历史单）
- [x] 写操作误判 read-only：`无` —— D4-13 实测只读子账号写操作 `CreateVpc` 被 IAM 拒（`VPC.0010 disallowed by policy`），写/读分类正确 = PASS
- [x] 红线（I 类）违规：`3 项`（D2-4 / D4-26 / D8-9），均命历史单不重复开单
- [x] 脱敏复核：`不通过` —— 同上；另有 D4-28（hooks.json 注册 + echo-cred 拦截）PASS，说明拦截层正常、脱敏层缺口集中在 JSON 键名/短键与 risk-rule-engine evidence
- [x] 真云零写校验：D3-S1 只读场景 `zeroWrite=true`（仅调用 service_catalog + run_readonly_command）；D4-13 只读凭证写操作被拒

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 本次创建 `testbot3-hermes-ecs-*`（c6.large.2） | 已删除（含 delete_publicip） | `ECS ListServersDetails` 无本次实例 = 0 ✅ |
| VPC/子网（D3-C1） | 本次创建 `testbot3-hermes-e2e-*` + 子网 | 已删除 | `VPC ListVpcs`/`ListSubnets` 无本次资源 = 0 ✅ |
| OBS 桶（D3-C2） | 本次创建 `testbot3-hermes-obs-*` | 已删除 | `OBS ListBuckets` 无本次桶 = 0 ✅ |
| 沙箱会话（D3-C3/C6） | DevBridge 会话 + 隧道 + 上传项目 | `close_session` 正常关闭 | 会话关闭返回 ok ✅ |
| EIP | 本日无新建 | — | 账户仅存 1 个 2026-10-14 遗留 EIP（非本次），本日 `created_at` 命中 0 ✅ |
| 函数/其它 | 本日未创建 | — | — |

> **归零说明**：D3-C1 首次执行时 `realcloud_e2e.mjs` 的清理判定误报「已归零」，实测云端遗留 VPC×2 + 子网×2 + ECS×2；已**手工核对并删除本次创建的全部资源**，最终独立核查 `MINE ECS=[] / VPC=[] / OBS=[] / 本日 EIP=[]` 归零。账户另存两条 `testbot3-hermes-e2e-*-subnet`（`created_at` 2026-09-27）历史孤儿子网，非本次创建，按「只删本次创建」红线未动。

---

## 八、遗留与建议

1. **路由覆盖（P1，跨 4 条用例同源）**：`src/tools.mjs` `serviceCatalog.routeMap` 中文关键词覆盖不足是 D3-S1 / D10-3 / EXP-E01 / D3-S5 的共同根因，建议一次性补齐「只读查询/查看/云主机」等短语并支持复合意图拆分，可同时收敛 4 条。
2. **脱敏缺口（P0/P2）**：`redactString()`（safety-policy）与 `sanitizeValue()`（telemetry）/ `risk-rule-engine` evidence 未共用同一脱敏入口，建议按历史单 #791「redact 设计重构」统一键名策略与脱敏路径，避免 JSON 短键/引号键反复漏网。
3. **沙箱公网链路（P1）**：D3-S3 的 `expose` 返回值缺可达性语义，建议在 `session-manager.mjs` 生成 `publicUrl` 后做一次可达性探测，不可达时置 `ok=false` + `nextStep`，避免 Agent 误报「已出链」。
4. **测试脚本自身缺陷（测试侧，建议改测试仓）**：`scripts/realcloud_e2e.mjs` 存在两类判定缺陷——以 KooCLI 退出码判成败（OBS `mb` 成功返 6）、以列表文本空判资源归零（限流/报错时误判）。建议统一改为「解析 List* 响应集合结构 + 文本判定」，并在 `finally` 归零后做独立二次核查；否则会误报 FAIL 并遗留云端资源。
5. **SPEC-MISMATCH 三项（D1-65 / D1-68 / D8-9）**：实现与用例契约漂移，均命历史单；建议裁决契约以哪方为准（环境变量优先级、DEBUG 开关取值、遥测脱敏边界）后同步文档或实现。
6. **镜像/版本**：私有 npm 镜像与官方 `dist-tags` 本日一致（无滞后），SUT 取 `next=1.1.9-next.0`。