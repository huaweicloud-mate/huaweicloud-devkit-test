# Hermes-DeepSeek-V4.1-Flash 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4.1-Flash-测试报告.md`
> **生成时间**：2026-10-23 05:25:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-23-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.12（npm `latest` 正式版，gitHead `4ed07801`）
> **测试客户端**：Hermes (DeepSeek-V4.1-Flash) / Linux (aarch64) / 120.46.176.133
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项；较 v1.1.10 上一轮净修复 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4.1-Flash` |
| OS / 架构 | `Linux` (aarch64) |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |
| 源码仓库检出 | `hdk` @ `4ed07801`（release-1.1.12） |

> **执行方法（真实执行，非文档解读）**：
> ① **源码级直调探针**：分组探针 `d2-auth` / `d1-upgrade` / `d4-security` / `mcp-tools` 直调本地 hdk 源码函数（`redactSecrets` / `classifyHcloudArgs` / `judgeUpdate` / `dispatch` / `decorateResult` 等），逐断言判定后按用例 ID 拆分证据；
> ② **专用探针**：`probe_cloud.mjs`（真云只读+规划）、`probe_d10.mjs`（eval harness 路由层 + 风险规则）、`probe_missing.mjs`（遥测/协议/安全补漏）、`probe_telemetry.mjs`、`probe_c7.mjs` 等，各自 `writeFileSync` 落盘 `evidence/<case-id>/stdout.log`；
> ③ **真云 E2E 真机执行**：`scripts/realcloud_e2e.mjs`（D3-C1/C3/C6，最低配置创建→反序删除→归零验证）+ 修正探针 `probe_d3c1_fixed.mjs`/`probe_d3c2_fixed.mjs`（复核删除与归零，规避退出码/限流误判）；
> ④ 每用例证据独立落 `evidence/<case-id>/`（`probe.mjs` + 非空 `stdout.log`），回填 `backfill_daily.py --write` 一次写回三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148`（NOT_RUN 2 为 OS 专属/超每日范围） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `134 / 11 / 0 / 3 / 2` |
| 通过率（分母 = PASS+FAIL = 145） | `92.4%` |
| P0 / P1 / P2 新增缺陷 | `2 / 6 / 3`（另 SPEC 3 项） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `已归零（本次创建的真云资源全部删除，复核 ECS=0 / EIP=0 / 本次 VPC&子网=0 / FunctionGraph=0 / 本次 OBS 桶已删）` |

> **较 2026-10-22（v1.1.10）变化**：
> - ✅ **D1-66 遥测开关/自定义端点（原 FAIL）已修复**：`off->enabled=false`、自定义端点收到 POST=true，本轮 PASS；
> - ✅ **D3-C1 真云 ECS 生命周期 E2E 已恢复 PASS**（v1.1.10 因 router 配额边缘耗尽被阻断；本轮修正探针归零确认通过）；
> - ⚠️ **D1-65 状态由 FAIL 更正为 SPEC-MISMATCH**（契约「1/true 均可」，实现仅认字面量 `'true'`，属契约漂移）；
> - 其余 13 项缺陷与 v1.1.10 相同（连续多版本复现），见 `FINDINGS.md` / `HISTORY_LINKS.md`。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
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

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（JSON 小写 ak/sk 未脱敏） | `src/safety-policy.mjs:34/49` 键名正则未覆盖小写 `ak`/`sk` | 待提单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（非法时序未拒绝） | `src/mcp-protocol.mjs:57` `tools/list` 分支无 initialize 前置校验 | 待提单 |
| 3 | P1 | `D3-C3` | D3功能 | 沙箱 deploy_nginx 端口冲突递增后 ok=false（假失败） | `src/sandbox/session-manager.mjs:1014` 端口递增路径返回 `ok:false` | 待提单 |
| 4 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（错误码与契约不符） | `src/tools.mjs` `explain_error` 映射未覆盖 `Common.0013`/`VPC.0501` | 待提单 |
| 5 | P1 | `D3-S1` | D3功能 | 场景-只读查 ECS：`serviceCatalog` 中文「云主机」路由 MISS | `src/tools.mjs:2190 routeMap`（ECS 关键词 ~:2200）缺「云主机」 | 待提单 |
| 6 | P1 | `D4-4` | D4安全 | 写操作审批门：`Change*` 变更类动词漏拦截 | `safety/policy.json:27 writeOperationPrefixes` 缺 `Change` 前缀 | 待提单 |
| 7 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（1 条中文意图 MISS） | `src/tools.mjs` routeMap 缺「云主机」（同 #5/#8 根因） | 待提单 |
| 8 | P1 | `EXP-E01` | D10评测 | 评测集「云主机」中文意图路由 MISS | `src/tools.mjs` ECS routeMap 缺「云主机」同义词 | 待提单 |
| 9 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由仅命中单一服务 | `src/tools.mjs serviceCatalog` 单关键词并集，无复合意图分层拆解 | 待提单 |
| 10 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类：写操作落 `cli:invoke` | `hooks/huaweicloud-safety.py:46 WRITE_OPERATION_RE`；`:24 PLUGIN_DIR` 误指向 `plugins/` | 待提单 |
| 11 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（`--password <值>` 明文残留） | `src/risk-rule-engine.mjs:22 redactEvidence` 仅匹配 `key[:=]value` 形态 | 待提单 |
| — | P2 | `D1-65` | D1安装 | 调试模式环境变量仅认字面量 `'true'`（**SPEC-MISMATCH**） | `src/telemetry/telemetry.mjs:81` `=== 'true'` 严格比较 | 待提单 |
| — | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反（**SPEC-MISMATCH**） | `src/auth/credentials.mjs:225`（另 :173、:339）`HW_REGION \|\| HUAWEICLOUD_REGION` | 待提单 |
| — | P2 | `D8-9` | D8遥测 | `sanitizeValue` 未做凭证脱敏（**SPEC-MISMATCH**） | `src/telemetry/telemetry.mjs:189` 仅 trim/截断/去控制字符 | 待提单 |

### 根因详情

1. **D2-4【P0】**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 原样返回，SK 明文残留。期望 JSON 形态小写 `ak`/`sk` 键亦被脱敏为占位符。根因 `plugins/huaweicloud-core/src/safety-policy.mjs:34`（`redactString`）/`:49`（`redactSecrets`）键名正则仅覆盖 `access_key`/`secret_key`/大写 `AK=`/`SK=`。证据 `evidence/D2-4/stdout.log`。
2. **D9-12【P0】**：spawn `mcp-server` 后不发 `initialize` 直接 `tools/list`，服务端返回 46 工具列表（未拒绝），非法时序拒绝=false。期望返回 `-32600`。根因 `src/mcp-protocol.mjs:57`（dispatch `tools/list` 分支，`dispatch` 定义于 :30）无 initialize 前置状态机。证据 `evidence/D9-12/stdout.log`。
3. **D3-C3【P1】**：沙箱 `deploy_nginx` 端口 8080 被占自动递增后返回 `ok=false`（detail `static:8089`），而实际部署可用，`deploy_check` 判定 serving PASS——部署成功却报假失败。根因 `src/sandbox/session-manager.mjs:1014`（`deployNginx` 定义于 :827）写校验/端口递增路径在冲突递增时返回 `ok:false`。证据 `evidence/D3-C3/stdout.log`。
4. **D3-C7【P1】**：跨区只读查询返回 `Common.0013`（token 的 project 与 region 不匹配）、跨区创建 EIP 返回 `VPC.0501`，与契约预期 `Ecs.0200`/`Ecs.0021` 精确错误码不符。根因 `src/tools.mjs` `explain_error` 错误码映射未覆盖 `Common.0013`/`VPC.0501`（`huaweicloud_explain_error` 定义 :377、处理分支 :1329）。证据 `evidence/D3-C7/stdout.log`。
5. **D3-S1【P1】**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help ...']`（未命中 ECS）；只读 ListServersDetails 正常。根因 `src/tools.mjs:2190 routeMap`（ECS 关键词清单 ~:2200 含「弹性云服务器/云服务器/服务器/虚拟机/镜像」，缺「云主机」）。证据 `evidence/D3-S1/stdout.log`。
6. **D4-4【P1】**：`ChangeServerOs`/`ChangeServer`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` 判定 `decision=allow, isWrite=undefined`（0/5 拦截），对照 `CreateServers` `decision=deny`。根因 `safety/policy.json:27 writeOperationPrefixes` 列表缺 `Change` 前缀。证据 `evidence/D4-4/stdout.log`。
7. **D10-3【P1】**：eval-harness 15 条中文意图 HIT=13 MISS=1 N/A=1，准确率 92.9%。根因同 #5（routeMap 缺「云主机」）。证据 `evidence/D10-3/stdout.log`。
8. **EXP-E01【P1】**：『帮我查一下我账号在华北北京四有哪些云主机』harness verdict=MISS。根因同 #5。证据 `evidence/EXP-E01/stdout.log`。
9. **D3-S5【P2】**：复合中文意图 → `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未拆分命中预览/沙箱分层目标。根因 `src/tools.mjs serviceCatalog` 单关键词并集路由，无复合意图分层拆解。证据 `evidence/D3-S5/stdout.log`。
10. **D4-25【P2】**：写命令事件 keys=`["cli:read","cli:invoke","cli:invoke"]`（写操作未落 `cli:write`），Node 读取目录存在=false。根因 `hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，空格分隔写动词不匹配；`:24` `PLUGIN_DIR=parents[2]` 误指向 `plugins/`，事件落 `plugins/telemetry` 而 `telemetry.mjs:21` 读 `plugins/huaweicloud-core/telemetry`。证据 `evidence/D4-25/stdout.log`。
11. **D4-26【P2】**：`IAM CreateUser --password MyS3cret123` findings.evidence 明文残留=true，decision=warn。根因 `src/risk-rule-engine.mjs:22 redactEvidence` 正则键名表仅匹配 `key[:=]value` 形态，未覆盖 `--password <值>` 空格形态。证据 `evidence/D4-26/stdout.log`。
12. **D1-65【P2/SPEC】**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 日志增量=0（不生效），仅 `=true` 生效（增量=1254）；契约「1/true 均可」。根因 `src/telemetry/telemetry.mjs:81`。证据 `evidence/D1-65/stdout.log`。
13. **D1-68【P2/SPEC】**：同设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时 `resolveCredentials` 取 `HW_REGION`（cn-test-hw-wins），契约要求 `HUAWEICLOUD_REGION` 优先。根因 `src/auth/credentials.mjs:225`（另 :173、:339 同序）。证据 `evidence/D1-68/stdout.log`。
14. **D8-9【P2/SPEC】**：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回（仅 trim/截断/去控制字符），未移除敏感值。根因 `src/telemetry/telemetry.mjs:189`。证据 `evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 + 改用例建议 |
|---|---|---|---|---|---|
| `D1-39` | 展开级 | P0 | NOT_RUN | 【调归属】 | Windows 专属 P0 用例（OS 列标注「专属」），当前 OS=Linux 不适用，属 AGENTS.md 状态口径唯一例外；Linux 侧由 `EXP-NR3-10`（platform=linux/queryDistTagsSync）代表覆盖且 PASS。无需改用例，归属正确。 |
| `D3-S7` | 展开级 | P2 | NOT_RUN | 【改用例】 | 场景-跨服务交付（Web应用+RDS）需专用编排 harness 与 RDS 实例配额，超出每日单服务真云探针范围；建议转专项隔离执行（补环境+编排脚本），不并入每日 daily 包。 |

> 无 BLOCKED 用例（本轮全部真云/探针用例均真实执行，无假阻塞）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`。真云探针全程使用 `~/.config/huaweicloud/credentials.json`（管理员）与 `credentials.readonly.json`（只读子账号，D4-13 经 `run-as-readonly.py` 临时注入 env，不落盘）；只读子账号实测「只读可用=true / 写被拒=true」。
- [x] 写操作误判 read-only：`无`。D3-C4 22 服务只读规划 22/22 通过，`plan=true decision=allow` 均为只读 API。
- [x] 红线（I 类）违规：`0`。
- [x] 脱敏复核：产品侧发现 3 项脱敏缺陷（D2-4 小写 ak/sk、D4-26 `--password` 空格形态、D8-9 sanitizeValue），已如实计入 FINDINGS；测试侧证据文件本身不含明文凭证。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-C1 真云 ECS 生命周期（realcloud_e2e.mjs） | VPC `testbot3-hermes-e2e-2703339043` + subnet `testbot3-hermes-e2e-2703339043-subnet` + ECS `testbot3-hermes-ecs-2703339043` | 脚本 finally 未删净（List 限流误判为已归零）→ **测试侧复核发现后手动补删**（ECS DeleteServers 提交 + 子网/VPC 反序删除） | ✅ ECS `count=0`；本次 VPC/子网均消失（`ListVpcs` 复核无本次命名） |
| D3-C1 修正探针（probe_d3c1_fixed.mjs） | VPC + subnet + ECS（唯一时间戳名） | 反序删除 + 轮询归零 | ✅ 探针自证「ECS归零确认 subnet:ok vpc:归零确认」 |
| D3-C3 真云部署（realcloud_e2e.mjs） | VPC `testbot3-hermes-e2e-2703373819` + subnet | 手动补删（同上，脚本 finally 未删净） | ✅ `ListVpcs` 复核已消失 |
| D3-C2 OBS 静态网站 E2E | OBS 桶 `testbot3-hermes-obs-<TS>` | `hcloud OBS rm -f` | ✅ `hcloud obs ls` 无本次桶 |
| D3-S3 沙箱预览 | devbridge 隧道 + nginx 会话 | `close_session` | ✅ 探针自证 close=true，URL HTTP 200 实测通过 |
| D3-S6 FunctionGraph | 函数 + TIMER 触发器 | 删除函数与触发器 | ✅ `FunctionGraph ListFunctions count=0` |
| EIP（D3-C7 跨区 / 通用） | 无（跨区创建被拒 `VPC.0501`） | — | ✅ `EIP ListPublicips total_count=0` |

> **测试侧发现（非产品缺陷，记录备查）**：`scripts/realcloud_e2e.mjs` 的 finally 清理在 `List*` 接口被限流返回空文本时误判「无资源需清理」，导致 D3-C1/D3-C3 各遗留 1 套 VPC+子网及 1 台 ECS 未删；本轮已人工复核补删归零。建议该脚本改用「解析 List* JSON 集合键确证缺席 + 周期重发删除」，勿以空文本判归零（该问题在测试仓库，不计入源码仓提单）。

---

## 八、遗留与建议

1. **P0 两项应优先修复**：D2-4（凭证脱敏缺口，安全面）与 D9-12（MCP 握手时序绕过，协议面）连续多版本复现，建议纳入 v1.1.13 必修。
2. **routeMap 同义词语料**：D3-S1 / D10-3 / EXP-E01 同一根因（缺「云主机」），建议一次性补齐 ECS routeMap 中文同义词表并扩充评测集回归。
3. **SPEC 三项待裁决**：D1-65（DEBUG 认值口径）、D1-68（region 优先级）、D8-9（sanitizeValue 是否应脱敏）——实现与契约漂移，需产品/维护者裁定以文档为准还是以实现为准。
4. **D3-C3 沙箱假失败**：端口冲突自动递增后应返回 `ok=true` 并带最终端口；建议同时收敛残留 `.conf` 导致的端口耗尽。
5. **测试侧改进**：`realcloud_e2e.mjs` 归零判定改 JSON 集合键校验（见 §七）；D3-S7 建议转专项 harness。
6. **历史关联**：本轮 15 项产品缺陷（含 3 项 SPEC）经 `file_issue.py` 查重均命中上游既有单，详见 `HISTORY_LINKS.md`，不重复开单。