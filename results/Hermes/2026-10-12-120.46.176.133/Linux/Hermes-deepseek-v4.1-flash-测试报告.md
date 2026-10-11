# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-12 05:25:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-12-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.8-next.2（npm `next` tag，gitHead `681895da`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项；全部经历史查重，见 FINDINGS.md / HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（Ubuntu 24.04，aarch64） |
| 被测版本（SUT） | `v1.1.8-next.2`（npm `next` tag，gitHead `681895da`） |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：① **源码级探针直调**（`hdk/plugins/huaweicloud-core` 固定 gitHead `681895da`：`auth/credentials.mjs`、`safety-policy.mjs`、`risk-rule-engine.mjs`、`telemetry/telemetry.mjs`、`tools.mjs`、`mcp-protocol.mjs`、`hooks/huaweicloud-safety.py`）——确定性函数调用，覆盖 D1/D2/D4/D8/D9 多数用例；② **MCP server 真机**（stdio + remote JSON-RPC：`initialize`/`tools/list`/`tools/call`，41 工具）；③ **真云 E2E**（OBS 桶建删归零、FunctionGraph 函数+定时触发器建删归零、ECS/VPC/EIP 只读列举）；④ **只读子账号实测**（`scripts/run-as-readonly.py` 临时注入 test001 凭证，验证最小权限 D4-13）；⑤ **评测集 harness**（`eval/harness/run-eval.mjs` 15 条中文意图跑 serviceCatalog 路由）。所有 PASS 用例证据落 `evidence/<case-id>/`（`probe.mjs` + `stdout.log`）。
>
> **本轮变更（测试侧）**：修正编排时的代理环境变量泄漏——首跑前为 git push 导出的 `https_proxy`/`http_proxy` 误入探针进程，使 D1-70（代理配置用例读 env 代理）、D1-66（自定义遥测端点 localhost POST 被代理拦截）、D6-9（marketplace fetch 走代理失败）三项产生**假 FAIL**；清空代理后重跑全量，三项恢复 PASS。**SUT 版本与上一轮一致（1.1.8-next.2 / gitHead 681895da），缺陷集合稳定**。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `143` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 8 / 0 / 3 / 2` |
| 通过率（分母 = PASS+FAIL = 140） | `94.3%` |
| P0 / P1 / P2 新增缺陷 | `2 / 3 / 6` |
| 红线（I 类）违规 | `3`（明文凭证残留：D2-4 / D4-26 / D8-9） |
| 资源释放 | `全部归零`（OBS 桶 / FunctionGraph 函数+触发器建删归零；ECS 0、EIP 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `7` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `2` | 未执行（OS 专属 / 超范围） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

> 门禁：`verify_coverage.py` 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 1.0% ≤ 15%）；`verify_no_fake_pass.py` 通过（全部 PASS 均有 evidencePath 且证据存在）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` regex 未加 `/i` + 白名单缺 `ak`/`sk` | 待提单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:57` 无 initialize 前置会话检查 | 待提单 |
| 3 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:1970-1983` ECS keywords 缺「云主机」 | 待提单 |
| 4 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:1966-2217` routeMap 中文关键词覆盖不全 | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | 评测集路由命中 | `tools.mjs:1966-2217` ECS keywords 缺「云主机」 | 待提单 |
| 6 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:1966-2217` 单关键词并集路由，无分层拆解 | 待提单 |
| 7 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` 写动词正则 + `:24` 目录写偏 | 待提单 |
| 8 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `risk-rule-engine.mjs:97` evidence 未走 redactSecrets | 待提单 |
| 9 | P2 | `D8-9` | D8遥测 | 安装ID与遥测值脱敏（SPEC） | `telemetry/telemetry.mjs:189` sanitizeValue 未脱敏 | 待提单 |
| 10 | P2 | `D1-65` | D1安装 | 调试模式环境变量（SPEC） | `telemetry/telemetry.mjs:81` 仅认字面量 `'true'` | 待提单 |
| 11 | P2 | `D1-68` | D1安装 | 区域环境变量优先级（SPEC） | `auth/credentials.mjs:222` 优先级与契约相反 | 待提单 |

### 根因详情

1. **D2-4（P0）**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 原样返回，`sk` 明文残留（`redact-json` 断言 false）。根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的 `(AK|SK)\s*[:=]` 正则未加 `/i`，且 `isSecretKeyName`(:20-31) 白名单不含小写 `ak`/`sk` → 小写键名 / JSON 形态两处规则均不命中。证据 `evidence/D2-4/stdout.log`。
2. **D9-12（P0）**：未 `initialize` 直接 `tools/list` 返回 41 工具而非 `-32600`（`非法时序拒绝=false`）。根因：`src/mcp-protocol.mjs:57` `tools/list` 分支无会话状态检查。证据 `evidence/D9-12/stdout.log`。
3. **D3-S1（P1）**：`"帮我查一下我账号有哪些云主机"` → 回落 `Run hcloud --help...`，未命中 ECS。根因：`src/tools.mjs:1970-1983` ECS keywords 含「弹性云服务器/云服务器」但缺「云主机」。证据 `evidence/D3-S1/stdout.log`。
4. **D10-3（P1）**：harness 15 条意图 HIT=13 MISS=1 N/A=1，准确率 92.9%。根因：`src/tools.mjs:1966-2217` routeMap 中文关键词覆盖不全。证据 `evidence/D10-3/stdout.log`。
5. **EXP-E01（P1）**：同 #3 的「云主机」缺词导致 harness verdict=MISS。证据 `evidence/EXP-E01/stdout.log`。
6. **D3-S5（P2）**：复合意图仅返回单一 `ECS`，未分层拆解多服务。证据 `evidence/D3-S5/stdout.log`。
7. **D4-25（P2）**：`hcloud ECS CreateServers`（空格分隔写动词）落 `cli:invoke`（应 `cli:write`）；事件写 `plugins/telemetry` 而 Node 读取目录不存在。根因：`hooks/huaweicloud-safety.py:46` 正则前置字符类 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词，`:24` `PLUGIN_DIR` 误指向 `plugins/`。证据 `evidence/D4-25/stdout.log`。
8. **D4-26（P2）**：`findings[0].evidence` 保留明文 `--password MyS3cret123`。根因：`src/risk-rule-engine.mjs:97` 直接 `excerpt(context.text)` 未脱敏。证据 `evidence/D4-26/stdout.log`。
9. **D8-9（P2/SPEC）**：`sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123')` 原样返回。根因：`src/telemetry/telemetry.mjs:189` 未做凭证脱敏。证据 `evidence/D8-9/stdout.log`。
10. **D1-65（P2/SPEC）**：`DEBUG=true` 生效（增量 1248），`DEBUG=1` 不生效。根因：`src/telemetry/telemetry.mjs:81` `=== 'true'` 仅认字面量。证据 `evidence/D1-65/stdout.log`。
11. **D1-68（P2/SPEC）**：`HW_REGION` 与 `HUAWEICLOUD_REGION` 同时设时取 `HW_REGION`，与契约相反。根因：`src/auth/credentials.mjs:222` 优先级反序。证据 `evidence/D1-68/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【调归属】 | D1-39「Windows 升级检测链可用性」为 **Windows 专属 P0** 用例，当前 OS=Linux 不适用；Linux 侧同一覆盖点由展开级 `EXP-NR3-10`（platform=linux judgeUpdate 链）代表，已 PASS。 | 无需改用例；OS 专属 P0 在非对应 OS 豁免 NOT_RUN 符合状态口径。 |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 【改用例】 | 「场景-跨服务交付(Web应用+RDS)并归零」需同轮创建 RDS 实例 + Web 应用 + 沙箱 + 连接串注入的复合真云编排，超出每日单服务真云探针（`probe_cloud*.mjs`）范围；RDS 属按需计费且创建耗时超日常窗口。 | 建议拆为单服务子用例（RDS 建删归零 / 沙箱连接串注入各一条），或标注为「版本全量测试」执行，避免每日包内 P1 长期 NOT_RUN。 |

### BLOCKED

无（真云、只读子账号、评测 harness 均已实测，无环境阻塞项）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**3 项明文残留**（I 类红线）——D2-4（JSON 小写 ak/sk 明文）、D4-26（findings.evidence 明文 password）、D8-9（telemetry sanitizeValue 未脱敏）。均按 FINDINGS #1/#8/#9 记录根因（文件:行号）并纳入合并提单。
- [x] 写操作误判 read-only：**无**。D4-13 只读子账号（test001）实测：只读 `ListServersDetails` 可用（count=0），写 `CreateVpc` 被拒（`VPC.0010` policy disallowed）→ 最小权限生效；D4-10/11/12 风险引擎对写命令判 warn/deny，未误判为可自由执行。
- [x] 红线（I 类）违规：**3 项**，见上（凭证脱敏缺口）。无「未授权真云写操作」「跨目录提交」等其他红线违规。
- [x] 脱敏复核：D2-4 profile-mcp（`huaweicloud_show_profile_redacted`）PASS、creds-readable PASS，但 `redact-json` 路径 FAIL → 脱敏覆盖不完整（同一用例内断言不一致即判 FAIL）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶 `hdk1-c13-52657221`（D3-C13） | true | true | 复列 `hcloud obs ls -s` 无该桶 |
| FunctionGraph 函数 + TIMER 触发器（D3-S6） | true | true | `ListFunctions` count=0 |
| ECS 实例（D4-13 只读列举） | 未创建（只读） | — | `ListServersDetails` count=0 |
| VPC / 子网（只读列举） | 未创建（只读） | — | `VPC ListVpcs` vpcs=[] |
| EIP（只读列举） | 未创建（只读） | — | `EIP ListPublicips` total_count=0 |

> 只删本次创建资源。`hcloud obs ls -s` 仍可见 `hdk1-s13-*`（历史轮次遗留，非本次创建，未触碰）。真云探测复用统一账号 hw018619646，区域 cn-north-4。

---

## 八、遗留与建议

- **P0 优先**：D2-4（凭证 JSON 小写脱敏缺口）、D9-12（MCP initialize 前置状态机缺失）直接影响 I 类红线与协议基线，建议优先修复。D2-4 与 DSH/AtomCode 2026-10-10 上报为同一 P0（同一根因 `safety-policy.mjs`），建议合并修复。
- **SPEC 裁决**：D8-9（sanitizeValue 未脱敏）、D1-65（DEBUG 仅认 `'true'`）、D1-68（region 优先级反序）三项为实现与设计契约漂移，建议维护者裁决「改实现」或「改用例契约」。
- **路由覆盖**：D3-S1 / D10-3 / EXP-E01 / D3-S5 同源（`tools.mjs` serviceCatalog 中文关键词覆盖 + 无分层拆解），建议一并补「云主机」等口语化近义词并评估复合意图分层。
- **用例优化**：D3-S7 长期 NOT_RUN，建议拆分子用例或明确迁移至版本全量测试包（见 §五）。
- **测试侧已闭环**：SUT 版本与上一轮一致，缺陷集合稳定；本轮唯一环境噪声（代理环境变量泄漏致 3 项假 FAIL）已在重跑中修正，不计入产品缺陷。

---

> 归档：`results/Hermes/2026-10-12-120.46.176.133/Linux/`（测试报告 + 设计级/展开级/追踪表 3 份 CSV + `evidence/<case-id>/` 证据），已 push 远端 main。
