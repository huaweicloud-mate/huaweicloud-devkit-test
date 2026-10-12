# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-13 05:20:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-13-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit **v1.1.8**（npm `latest` 正式版，gitHead `74f519dc`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项；全部经历史查重，见 FINDINGS.md / HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（Ubuntu 24.04，aarch64） |
| 被测版本（SUT） | `v1.1.8`（npm `latest`，gitHead `74f519dc`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：① **源码级探针直调**（`hdk/plugins/huaweicloud-core` 固定 gitHead `74f519dc`：`auth/credentials.mjs`、`safety-policy.mjs`、`risk-rule-engine.mjs`、`telemetry/telemetry.mjs`、`tools.mjs`、`mcp-protocol.mjs`、`hooks/huaweicloud-safety.py`）——确定性函数调用，覆盖 D1/D2/D4/D8/D9 多数用例；② **MCP server 真机**（stdio + remote JSON-RPC：`initialize`/`tools/list`/`tools/call`，**42 工具**）；③ **真云 E2E 实机**（`scripts/realcloud_e2e.mjs` + 专用探针：OBS 静态站部署+桶建删归零、FunctionGraph 函数+定时触发器建删归零、沙箱部署/7 隐式工具冒烟、ECS 全生命周期建删归零、跨区域引导）；④ **只读子账号实测**（`scripts/run-as-readonly.py` 临时注入 test001 凭证，验证最小权限 D4-13）；⑤ **评测集 harness**（`eval/harness/run-eval.mjs` 15 条中文意图跑 serviceCatalog 路由）。所有 PASS 用例证据落 `evidence/<case-id>/`（`probe.mjs` + `stdout.log`）。
>
> **本轮变更**：
> - **用例集扩围**：母版 `gen_daily` 新增 5 条真云 E2E 用例（`D3-C1` ECS 生命周期 / `D3-C2` OBS 静态站 / `D3-C3` 沙箱部署 / `D3-C6` 沙箱 7 隐式工具 / `D3-C7` 跨区域），设计级由 102 → **107**；本机按硬约束**逐条真机执行**（建删资源归零），无 mock、无假 BLOCKED。
> - **SUT 版本升级**：npm `latest` 由 `1.1.8-next.2`（gitHead `681895da`）→ **`1.1.8`**（gitHead `74f519dc`）；MCP `tools/list` 由 41 → **42**。**上一轮全部 12 项非 PASS 结论在新版本上逐一复现，缺陷集合完全稳定**（无新增、无修复）。
> - **测试侧缺陷自曝**：`scripts/realcloud_e2e.mjs` 的 ECS 清理存在缺陷——在实例仍处 `BUILD` 态即提交 `DeleteServers`，且以 KooCLI 退出码判断成败（KooCLI 失败时仍返回 0）→ 首轮清理假成功、遗留 ECS/VPC/子网约 10 分钟。已人工补删并验证归零，详见 §七/§八。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 9 / 0 / 3 / 2` |
| 通过率（分母 = PASS+FAIL = 145） | `93.8%` |
| P0 / P1 / P2 缺陷 | `2 / 4 / 3`（另 3 项 SPEC-MISMATCH 单列） |
| 红线（I 类）违规 | `3`（明文凭证残留：D2-4 / D4-26 / D8-9） |
| 资源释放 | `全部归零`（OBS 桶 / FunctionGraph 函数+触发器 / 沙箱会话 / ECS+VPC+子网 建删归零；ECS 0、VPC 空、EIP 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `2` | 未执行（OS 专属 / 超范围） |
| **合计** | **`107`** | 含新增 5 条真云 E2E |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

> 门禁：`verify_coverage.py` 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 **0.9%** ≤ 15%）；`verify_no_fake_pass.py` 通过（全部 PASS 均有 evidencePath 且证据存在）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` regex 未加 `/i` + 白名单缺 `ak`/`sk` | 待提单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:57` 无 initialize 前置会话检查 | 待提单 |
| 3 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | `auth/credentials.mjs:222` region-scoped project/token，无跨区 project 注入 | 待提单 |
| 4 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:1970-1983` ECS keywords 缺「云主机」 | 待提单 |
| 5 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:1966-2217` routeMap 中文关键词覆盖不全 | 待提单 |
| 6 | P1 | `EXP-E01` | D10评测 | 评测集路由命中 | `tools.mjs:1966-2217` ECS keywords 缺「云主机」 | 待提单 |
| 7 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:1966-2217` 单关键词并集路由，无分层拆解 | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` 写动词正则 + `:24` 目录写偏 | 待提单 |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `risk-rule-engine.mjs:97` evidence 未走 redactSecrets | 待提单 |
| 10 | P2 | `D8-9` | D8遥测 | 安装ID与遥测值脱敏（SPEC） | `telemetry/telemetry.mjs:189` sanitizeValue 未脱敏 | 待提单 |
| 11 | P2 | `D1-65` | D1安装 | 调试模式环境变量（SPEC） | `telemetry/telemetry.mjs:81` 仅认字面量 `'true'` | 待提单 |
| 12 | P2 | `D1-68` | D1安装 | 区域环境变量优先级（SPEC） | `auth/credentials.mjs:222` 优先级与契约相反 | 待提单 |

### 根因详情

1. **D2-4（P0）**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 原样返回，`sk` 明文残留（`redact-json` 断言 false）。根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的 `(AK|SK)\s*[:=]` 正则未加 `/i`，且 `isSecretKeyName`(:20-31) 白名单不含小写 `ak`/`sk` → 小写键名 / JSON 形态两处规则均不命中。证据 `evidence/D2-4/stdout.log`。
2. **D9-12（P0）**：未 `initialize` 直接 `tools/list` 返回 **42** 工具而非 `-32600`（`非法时序拒绝=false`）。根因：`src/mcp-protocol.mjs:57` `tools/list` 分支无会话状态检查。证据 `evidence/D9-12/stdout.log`。
3. **D3-C7（P1，新增用例）**：目标区 `ap-southeast-3`，plan 层正确透传 `--cli-region=ap-southeast-3`（参数级断言 PASS），但执行层被 IAM 拒绝——只读查询返回 `Common.0013`（`current region [ap-southeast-3] does not match with the project name [cn-north-4] in tk`）、`EIP CreatePublicip` 返回 `VPC.0501`（`token 携带 region 信息，仅 region-scoped token 可通过鉴权`）；设计断言要求 `Ecs.0021`（区域不可用）/`Ecs.0200`（资源不存在）精确命中 → **均未命中**。根因：`src/auth/credentials.mjs`（profile 的 cn-north-4 project 签发 region-scoped token，跨区无对应 project/token 注入路径），工具链跨区引导未提供可用的 region→project/token 映射。证据 `evidence/D3-C7/stdout.log`（含 `get_regional_availability` 预查结果 `ecs available in ap-southeast-3` — 静态缓存与实际鉴权不一致）。
4. **D3-S1（P1）**：`"帮我查一下我账号有哪些云主机"` → 回落 `Run hcloud --help...`，未命中 ECS。根因：`src/tools.mjs:1970-1983` ECS keywords 含「弹性云服务器/云服务器」但缺「云主机」。证据 `evidence/D3-S1/stdout.log`。
5. **D10-3（P1）**：harness 15 条意图 HIT=13 MISS=1 N/A=1，准确率 92.9%。根因：`src/tools.mjs:1966-2217` routeMap 中文关键词覆盖不全。证据 `evidence/D10-3/stdout.log`。
6. **EXP-E01（P1）**：同 #4 的「云主机」缺词导致 harness verdict=MISS。证据 `evidence/EXP-E01/stdout.log`。
7. **D3-S5（P2）**：复合意图仅返回单一 `ECS`，未分层拆解多服务。证据 `evidence/D3-S5/stdout.log`。
8. **D4-25（P2）**：`hcloud ECS CreateServers`（空格分隔写动词）落 `cli:invoke`（应 `cli:write`）；事件写 `plugins/telemetry` 而 Node 读取目录不存在。根因：`hooks/huaweicloud-safety.py:46` 正则前置字符类 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词，`:24` `PLUGIN_DIR` 误指向 `plugins/`。证据 `evidence/D4-25/stdout.log`。
9. **D4-26（P2）**：`findings[0].evidence` 保留明文 `--password MyS3cret123`。根因：`src/risk-rule-engine.mjs:97` 直接 `excerpt(context.text)` 未脱敏。证据 `evidence/D4-26/stdout.log`。
10. **D8-9（P2/SPEC）**：`sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123')` 原样返回。根因：`src/telemetry/telemetry.mjs:189` 未做凭证脱敏。证据 `evidence/D8-9/stdout.log`。
11. **D1-65（P2/SPEC）**：`DEBUG=true` 生效（增量 1254），`DEBUG=1` 不生效。根因：`src/telemetry/telemetry.mjs:81` `=== 'true'` 仅认字面量。证据 `evidence/D1-65/stdout.log`。
12. **D1-68（P2/SPEC）**：`HW_REGION` 与 `HUAWEICLOUD_REGION` 同时设时取 `HW_REGION`，与契约相反。根因：`src/auth/credentials.mjs:222` 优先级反序。证据 `evidence/D1-68/stdout.log`。

### 新增真云 E2E 用例执行结论（本轮扩围）

| 用例 | 结论 | 证据（关键断言） |
|---|---|---|
| `D3-C2` OBS 静态站部署 E2E | **PASS** | 建桶→上传 index.html→`public-read`→网站配置 set/get→`curl` 站点 URL **HTTP 200**→删桶归零；`evidence/D3-C2/stdout.log` |
| `D3-C3` 沙箱部署 E2E | **PASS** | `sandbox_connect`→`upload_project`(md5 校验)→`deploy_nginx`→`deploy_check`=PASS→`close_session`；`evidence/D3-C3/stdout.log` |
| `D3-C6` 沙箱 7 隐式工具冒烟 | **PASS** | `check_user`/`connect`/`credentials`/`exec_one_shot`/`close_session` 全部规范返回，无静默失败；`evidence/D3-C6/stdout.log` |
| `D3-C1` ECS 生命周期 E2E | **PASS** | 建 VPC→子网→ECS(`c6.large.2`)→`ListServersDetails`=ACTIVE→`DeleteServers(delete_volume=true)`→只读验证归零（count=0/VPC 空）；`evidence/D3-C1/stdout.log` |
| `D3-C7` 跨区域引导 | **FAIL** | 见缺陷 #3；`evidence/D3-C7/stdout.log` |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【调归属】 | D1-39「Windows 升级检测链可用性」为 **Windows 专属 P0** 用例，当前 OS=Linux 不适用；Linux 侧同一覆盖点由展开级 `EXP-NR3-10`（platform=linux judgeUpdate 链）代表，已 PASS。 | 无需改用例；OS 专属 P0 在非对应 OS 豁免 NOT_RUN 符合状态口径。 |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 【改用例】 | 「场景-跨服务交付(Web应用+RDS)并归零」需同轮创建 RDS 实例 + Web 应用 + 沙箱 + 连接串注入的复合真云编排，超出每日单服务真云 E2E 范围；RDS 属按需计费且创建耗时超日常窗口。 | 建议拆为单服务子用例（RDS 建删归零 / 沙箱连接串注入各一条），或标注为「版本全量测试」执行，避免每日包内 P1 长期 NOT_RUN。 |

### BLOCKED

无（真云 AK/SK、只读子账号、沙箱 DevStation、评测 harness 均已实测可用；本轮 5 条新增真云 E2E 全部真机执行，无环境阻塞项）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**3 项明文残留**（I 类红线）——D2-4（JSON 小写 ak/sk 明文）、D4-26（findings.evidence 明文 password）、D8-9（telemetry sanitizeValue 未脱敏）。均按 FINDINGS #1/#9/#10 记录根因（文件:行号）并纳入合并提单。
- [x] 写操作误判 read-only：**无**。D4-13 只读子账号（test001）实测：只读 `ListServersDetails` 可用（count=0），写 `CreateVpc` 被拒（`VPC.0010` policy disallowed）→ 最小权限生效；D4-10/11/12 风险引擎对写命令判 warn/deny，未误判为可自由执行。
- [x] 红线（I 类）违规：**3 项**，见上（凭证脱敏缺口）。无「未授权真云写操作」「跨目录提交」等其他红线违规。
- [x] 脱敏复核：D2-4 profile-mcp（`huaweicloud_show_profile_redacted`）PASS、creds-readable PASS，但 `redact-json` 路径 FAIL → 脱敏覆盖不完整（同一用例内断言不一致即判 FAIL）。
- [x] 真云写操作审批链：新增 `D3-C1` 实测 `CreateServers` 经 `huaweicloud_plan_cli_command` 分类为 `allow` 且返回 approvalToken 后由 `run_approved_command` 执行 → 写操作审批链生效。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站 / D3-C13 桶管理） | true | true | `hcloud obs ls` 仅剩预置桶 `huaweicloud-open-capability-home` |
| FunctionGraph 函数 + TIMER 触发器（D3-S6） | true | true | `ListFunctions` 无本次函数 |
| 沙箱会话（D3-C3 / D3-C6） | true | true | `close_session`=ok（会话关闭） |
| VPC `testbot3-hermes-e2e-*` + 子网（D3-C1） | true | true | `VPC ListVpcs` vpcs=[]（本次已删） |
| ECS 实例 `c6.large.2`（D3-C1） | true | true | `ECS ListServersDetails` count=0 |
| EIP（D3-C7 只读/跨区） | 未创建（跨区被 IAM 拒） | — | `EIP ListPublicips` total_count=0 |

> 只删本次创建资源。真云探测复用统一账号 hw018619646，区域 cn-north-4。
>
> **测试侧遗留（非产品缺陷）**：
> 1. `scripts/realcloud_e2e.mjs` 的 ECS 清理缺陷导致本轮 D3-C1 首轮遗留 ECS(1)/VPC(1)/子网(1) 约 10 分钟；已人工 `DeleteServers`+`DeleteSubnet`+`DeleteVpc` 补删并逐项验证归零。缺陷原因：① 未等实例 `ACTIVE` 即提交删除；② 以 KooCLI 进程退出码判成败（KooCLI 在 API 报错时仍返回 0）；③ 无「按唯一前缀反查」兜底。建议维护者加固。
> 2. 账号内仍存 2 个子网 `testbot3-hermes-e2e-0543499948-subnet` / `testbot3-hermes-e2e-0543344318-subnet`（历史轮次同前缀遗留，非本次创建，按「只删本次创建」未触碰），建议清理并排查其所属 VPC。

---

## 八、遗留与建议

- **P0 优先**：D2-4（凭证 JSON 小写脱敏缺口）、D9-12（MCP initialize 前置状态机缺失）直接影响 I 类红线与协议基线，建议优先修复。
- **新增 P1**：D3-C7 跨区引导——plan 层已正确透传 region，但执行层因 region-scoped token 被 IAM 拒（`Common.0013`/`VPC.0501`），设计断言的 `Ecs.0021`/`Ecs.0200` 无法命中。建议：要么在 `auth/credentials.mjs` 支持 region→project/token 映射，要么将用例断言调整为「跨区不可用时应给出可操作的 region/project 提示」。
- **SPEC 裁决**：D8-9（sanitizeValue 未脱敏）、D1-65（DEBUG 仅认 `'true'`）、D1-68（region 优先级反序）三项为实现与设计契约漂移，建议维护者裁决「改实现」或「改用例契约」。
- **路由覆盖**：D3-S1 / D10-3 / EXP-E01 / D3-S5 同源（`tools.mjs` serviceCatalog 中文关键词覆盖 + 无分层拆解），建议一并补「云主机」等口语化近义词并评估复合意图分层。
- **用例优化**：D3-S7 长期 NOT_RUN，建议拆分子用例或明确迁移至版本全量测试包（见 §五）。
- **测试基建**：修复 `scripts/realcloud_e2e.mjs` 的 ECS 清理缺陷（等 ACTIVE + 以 API 返回体/列表反查判成败），并清理 2 个历史遗留子网。
- **版本稳定性**：SUT 由 `1.1.8-next.2` → `1.1.8`，MCP 工具 41 → 42；上一轮全部 12 项非 PASS 结论在新版本**逐一复现**，缺陷集合完全稳定（无回归、无修复）。

---

> 归档：`results/Hermes/2026-10-13-120.46.176.133/Linux/`（测试报告 + 设计级/展开级/追踪表 3 份 CSV + `evidence/<case-id>/` 证据），已 push 远端 main。
