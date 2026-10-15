# Hermes-deepseek-v4.1-flash 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-16 05:22:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-16-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit **`1.1.9-next.0`**（npm `next` 预发布，gitHead `6302921c`；插件副本已 sync）
> **结论**：`PARTIAL`（有 FAIL/SPEC 缺陷：P0 2 项、P1 4 项、P2 7 项；另有 7 项真云用例因账户配额/沙箱上游 502 标 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（Ubuntu 24.04，aarch64） |
| 被测版本（SUT） | **`1.1.9-next.0`**（npm `next`，gitHead `6302921c`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：① **源码级探针直调**（`hdk/plugins/huaweicloud-core` @ gitHead `6302921c`：`auth/credentials.mjs`、`safety-policy.mjs`、`risk-rule-engine.mjs`、`telemetry/telemetry.mjs`、`tools.mjs`、`mcp-protocol.mjs`、`hooks/huaweicloud-safety.py`）——确定性函数调用，覆盖 D1/D2/D4/D8/D9 多数用例；② **MCP server 真机**（stdio + remote JSON-RPC：`initialize`/`tools/list`/`tools/call`，稳定 **42 工具**）；③ **真云 E2E 实机**（`scripts/realcloud_e2e.mjs` + 专用探针：OBS 静态站建删归零、ECS/VPC 生命周期、沙箱会话、FunctionGraph 函数+定时触发器、跨区域引导）；④ **只读子账号实测**（`scripts/run-as-readonly.py` 注入 test001 凭证验证 D4-13）；⑤ **评测集 harness**（`eval/harness/run-eval.mjs` 15 条中文意图跑 serviceCatalog 路由）。所有 PASS 用例证据落 `evidence/<case-id>/`（`probe.mjs` + 非空 `stdout.log`）。

> **本轮环境变更（影响执行面）**：
> - **账户 VPC 路由器配额耗尽**：`CreateVpc` 持续返回 `VPC.0114 OverQuota: ['router']`（账户内有他人残留 VPC `tctest-diag2` / `devkit-bench-*` / `testbot1-hermes-*`）→ D3-C1 / D3-S2 / D4-13 阻塞。
> - **沙箱编排上游 502**：`GET /open-api-public/v1/agreements`、`/v2/devenvs` 全部 502（重试仍失败）→ D3-C3 / D3-C6 / D3-S3 / D3-S7 阻塞。
> - **SUT 未变**：仍为 `1.1.9-next.0`（gitHead `6302921c`），故 10-15 轮次的 FAIL/SPEC 结论在本轮**逐条复现**。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（另有 1 条 Windows 专属用例在 Linux 标 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 10 / 7 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.8%` |
| P0 / P1 / P2 新增缺陷 | `2 / 4 / 7`（另 SPEC-MISMATCH 3 项单列于 §四） |
| 红线（I 类）违规 | `3`（明文凭证残留：D2-4 / D4-26 / D8-9） |
| 资源释放 | `全部归零`（本轮创建的 OBS 桶、FunctionGraph 函数均已删；ECS 0 台本轮创建、VPC 无 testbot3-* 残留、EIP total_count=1 属他方设备、沙箱未建立会话） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `7` | 环境/配额/上游阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行（Windows 专属用例在 Linux） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01 路由 MISS），根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏对 JSON 字符串不生效（明文 SK 残留） | `src/safety-policy.mjs:35-48` | 待提单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手时序无状态机（非法时序未拒） | `src/mcp-protocol.mjs:57` | 待提单 |
| 3 | P1 | `D3-S1` | D3功能 | serviceCatalog 中文意图路由未命中 ECS（退化为 help） | `src/tools.mjs` routeMap | 待提单 |
| 4 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（1 条中文意图 MISS） | `src/tools.mjs` routeMap | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | 评测集单条路由 MISS | `src/tools.mjs` routeMap | 待提单 |
| 6 | P1 | `D3-C7` | D3功能 | 跨区引导错误码不符（Common.0013 ≠ Ecs.0021） | `src/auth/credentials.mjs:224` + 引导层无归一 | 待提单 |
| 7 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `src/tools.mjs` serviceCatalog | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 写命令事件分类错误且落错目录 | `hooks/huaweicloud-safety.py:41` / `:24` | 待提单 |
| 9 | P2 | `D4-26` | D4安全 | findings.evidence 明文密码残留 | `src/risk-rule-engine.mjs`（未走 redactString） | 待提单 |
| 10 | P2 | `D8-9` | D8遥测 | sanitizeValue 未做敏感值脱敏（SPEC-MISMATCH） | `src/telemetry/telemetry.mjs:189` | 待提单 |
| 11 | P2 | `D1-65` | D1安装 | 调试开关仅接受字面量 "true"（SPEC-MISMATCH） | `src/telemetry/telemetry.mjs:81` | 待提单 |
| 12 | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反（SPEC-MISMATCH） | `src/auth/credentials.mjs:224` | 待提单 |
| 13 | P2 | `D3-S4` | D3功能 | 领券状态闭环前后不一致（true→已领取过→false） | `src/sandbox/hdkitservice-api.mjs:127-134` | 待提单 |

> 非产品缺陷（环境阻塞 / 测试侧）共 5 条，见 `FINDINGS.md` #14~#18：VPC 配额（D3-C1/D3-S2/D4-13）、沙箱上游 502（D3-C3/D3-C6/D3-S3/D3-S7）、D3-C2 退出码误判（已修正复测 PASS）、probe_cloud2 D3-S6 缺参（已由 probe_s6 复测 PASS）、D1-39 OS 专属。

### 根因详情

- **D2-4（P0，明文 SK 残留）**：期望 `redactSecrets` 结果不含 `SKTEST…`；实际原样返回。根因 `src/safety-policy.mjs:35-48` —— `redactString()` 键名正则只覆盖 `access_key|secret_key` 长键名，且 `:47` `/(AK|SK)\s*[:=]/g` 不接受被引号包裹的 JSON 键（`"sk":`）。证据：`evidence/D2-4/stdout.log`。
- **D9-12（P0，握手无状态机）**：期望 `tools/list` 早于 `initialize` 返回 `-32600`；实际返回 `listed:42`。根因 `src/mcp-protocol.mjs:57` 直接按方法名路由，无 initialize 前置校验。证据：`evidence/D9-12/stdout.log`。
- **D3-S1 / D10-3 / EXP-E01（P1，路由覆盖不足）**：期望中文意图命中目标服务（HIT 率 100%）；实际 D3-S1 返回 help 兜底、评测集 HIT=13 MISS=1 N/A=1（92.9%）、EXP-E01 verdict=MISS。根因 `src/tools.mjs` `serviceCatalog.routeMap` 关键词缺失。证据：`evidence/D3-S1/stdout.log`、`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`。
- **D3-C7（P1，跨区错误码）**：期望区域不可用 → `Ecs.0021`；实际 `Common.0013`（region-scoped token 项目名不匹配）/`VPC.0501`。根因 `src/auth/credentials.mjs:224` 解析的 region 绑定 `cn-north-4`，凭证层先于服务层失败，引导层未做错误码归一。证据：`evidence/D3-C7/stdout.log`。
- **D3-S5（P2，复合意图）**：期望拆分命中 >=2 服务；实际 `["ECS"]`。根因 `src/tools.mjs` serviceCatalog 仅单服务首命中。证据：`evidence/D3-S5/stdout.log`。
- **D4-25（P2，hook 遥测）**：期望写命令记 `cli:write` 且落 Node 读取目录；实际记 `cli:invoke`、写入 `plugins/telemetry`（Node 读 `plugins/huaweicloud-core/telemetry`）。根因 `hooks/huaweicloud-safety.py:41` 前置字符类 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词、`:24` `parents[2]` 目录误指。证据：`evidence/D4-25/stdout.log`。
- **D4-26（P2，明文口令）**：期望 `findings[].evidence` 脱敏；实际含 `--password MyS3cret123` 明文。根因 `src/risk-rule-engine.mjs` 组装 evidence 未走 `redactString()`。证据：`evidence/D4-26/stdout.log`。
- **D8-9 / D1-65 / D1-68（P2，SPEC-MISMATCH）**：`sanitizeValue` 不脱敏（`telemetry.mjs:189`）、`DEBUG` 仅认 `'true'`（`telemetry.mjs:81`）、`HW_REGION` 优先于 `HUAWEICLOUD_REGION`（`credentials.mjs:224`）。证据：`evidence/D8-9/stdout.log`、`evidence/D1-65/stdout.log`、`evidence/D1-68/stdout.log`。
- **D3-S4（P2，领券状态翻转）**：期望 claim 后 `claimed=true`；实际 `true → 已领取过 → false`。根因 `src/sandbox/hdkitservice-api.mjs:127-134` catch 分支将上游异常兜底为 `{claimed:false}`，无法区分「未领取」与「查询失败」。证据：`evidence/D3-S4/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | **OS 专属**（P0 唯一例外）：D1-39 为 Windows 专属 P0 用例，Linux 不适用；Linux 侧升级链路由 EXP-NR3-10 代表覆盖且已 PASS。证据目录保留 `evidence/D1-39/`（stdout.log 写明 NOT_RUN 原因）。 |

### BLOCKED

| 用例ID | 维度 | 标题 | 分类 | 阻塞原因 |
|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 【补环境】 | 账户 VPC 路由器配额耗尽（`VPC.0114 OverQuota: ['router']`，`CreateVpc` 重试仍失败；`VPC ShowQuota` 返回 `vpc=-1`，但 neutron router 配额已达上限，账户内残留他人 VPC `tctest-diag2`/`devkit-bench-*`/`testbot1-hermes-*`）。ECS 全生命周期（建→ACTIVE→删→归零）无法取证。解除条件：清理残留 VPC / 提升 router 配额。 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 【补环境】 | 同 D3-C1：账户 VPC 配额耗尽，私有网络场景无法创建 VPC/子网；只读与归零断言已验证（本轮无资源残留）。 |
| `D4-13` | D4安全 | 最小权限凭证通过率 | 【补环境】 | 只读子账号**只读可用**断言已实测通过（`ListServersDetails` 可用、`validateIamCredentials valid=true`），但「写被 IAM 拒绝」断言无法判定——写命令 `CreateVpc` 返回 `VPC.0114 OverQuota`，配额校验先于策略拒绝返回，未取得期望的 `VPC.0010 disallowed by policy`。解除条件：清理残留 VPC / 提升配额后复测。 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】 | 沙箱编排上游 hdkitservice 502（`GET /open-api-public/v1/agreements`、`/v2/devenvs` failed，trace `5bd279466d974ad79c84d93ad440f028`；05:15 重试仍 502），`sandbox_connect` 无法建立会话，上传/部署/预览断言无法取证。解除条件：沙箱编排服务恢复。 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 【补环境】 | 同 D3-C3：沙箱上游 502，`check_user`/`connect`/`credentials`/`exec_one_shot` 全部无法执行。解除条件：沙箱编排服务恢复。 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】 | 同 D3-C3：沙箱上游 502，无法取得预览 URL，故无法复测 10-15 轮记录的 `expose_tunnel publicUrl` 缺陷；本轮不判 PASS/FAIL。解除条件：沙箱编排服务恢复。 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】/【改用例】 | 跨服务复合编排（RDS+沙箱+连接串注入+归零）依赖沙箱编排服务且需 RDS 实例配额，本轮上游 502 且配额未获批，无法执行。建议拆为专项 harness 用例。解除条件：沙箱服务恢复 + RDS 配额。 |

---

## 六、安全与红线合规

- **凭证泄漏事件：有（3 项，I 类红线）** — D2-4（JSON 形态 AK/SK 未脱敏）、D4-26（`findings.evidence` 明文 password）、D8-9（`sanitizeValue` 未移除敏感值）。均已落证据并按缺陷提单。
- **写操作误判 read-only：无** — D4-14（CTS 审计）PASS：`hcloud` 操作可在 CTS 追溯；本轮写操作（VPC/OBS/FunctionGraph 创建）均由 `plan_cli_command` 分类后经审批执行。
- **红线（I 类）违规：3** — 见上「凭证泄漏事件」，均为 SUT 侧脱敏覆盖不足，非本轮测试操作引入。
- **脱敏复核：不通过** — 本轮脱敏相关 3 条用例（D2-4 / D4-26 / D8-9）全部未达契约；旁证：D4-27 等其余脱敏用例 PASS。
- **测试侧自律**：本机自建探针（D3-C2 退出码判定、probe_cloud2 D3-S6 缺参）缺陷已自曝并归档（FINDINGS #16/#17），未计入产品缺陷。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证（2026-10-16 05:17 实测） |
|---|---|---|---|
| VPC / 子网（D3-C1/D3-S2） | 本轮**未创建**（`VPC.0114` 配额拒绝） | — | `VPC ListVpcs` 无 `testbot3-*` 前缀（计数 0）；`ListSubnets` 仅余 2 条 10-13/10-14 轮次孤儿子网（其父 VPC 已删，非本轮） |
| ECS（D3-C1） | 本轮**未创建**（依赖 VPC） | — | `ECS ListServersDetails` count=1，为 `hc-activity-2048-ecs`（2026-10-14 创建，非本次、非 Hermes 命名） |
| OBS 桶（D3-C2 / D3-C13） | `testbot3-hermes-obs-2098973802`（D3-C2 复测）、`hdk1-c13-*`（D3-C13） | 均 `Delete bucket [...] successfully!` | `hcloud obs ls` 无 `testbot3-hermes` / `hdk1-c13-*` 残留（计数 0） |
| FunctionGraph 函数 + TIMER 触发器（D3-S6） | `hdk1-s6-*` 创建成功 + 触发器绑定成功 | `DeleteFunction` 执行成功 | `FunctionGraph ListFunctions` count=**0** |
| EIP | 本轮未创建 | — | `EIP ListPublicips` total_count=1（属他方设备，非本次创建，未触碰） |
| 沙箱会话（D3-C3/C6/S3/S7） | 本轮**未建立**（上游 502） | — | 无 `sandbox_connect` 成功记录，`workspace_id` 为空 |

> 结论：**本轮创建资源 100% 归零**；BLOCKED 用例均因配额/上游不可用而未创建任何资源，无新增泄漏。

---

## 八、遗留与建议

1. **P0 脱敏/协议两项（D2-4、D9-12）连续多轮复现**，建议合并到既有脱敏重构单（上游 #791 方向）优先修复：`redactString()` 覆盖 JSON 形态键名 + `mcp-protocol` 增加 initialize 前置状态机。
2. **路由覆盖（D3-S1 / D3-S5 / D10-3 / EXP-E01）同源**：建议为 `serviceCatalog.routeMap` 补齐「只读查/查看」类中文短语并引入复合意图拆分；与历史单 #852 / #788 同源，本轮结论可作为复现证据补充。
3. **跨区错误码契约（D3-C7）** 建议在引导层统一归一，或在凭证 region 不匹配时给出前置提示，避免用户误解为「资源不存在」。
4. **环境治理建议（非产品缺陷）**：账户 VPC 路由器配额已被他人残留 VPC 占满（`tctest-diag2`/`devkit-bench-*`/`testbot1-hermes-*`），建议维护者统一清理，否则真云 E2E（D3-C1/C2/S2/D4-13）将持续阻塞；同时请关注 10-13 轮次遗留的 2 条 `testbot3-hermes-e2e-*-subnet` 孤儿子网（父 VPC 已删）。
5. **沙箱编排上游 502** 为服务侧可用性问题，建议在恢复后补测 D3-C3/C6/S3/S7（尤其复测 10-15 记录的 `expose_tunnel publicUrl` 携带 `\r\nReady` 缺陷）。
6. **测试脚本改进**：`scripts/realcloud_e2e.mjs` 应删除对 KooCLI 退出码的判成败（`hcloud OBS mb` 成功返回 6）；`probe_cloud2.mjs` 的 FunctionGraph 创建需补 `--memory_size`/`--timeout`。两项均已在本轮以本地修正探针绕过。