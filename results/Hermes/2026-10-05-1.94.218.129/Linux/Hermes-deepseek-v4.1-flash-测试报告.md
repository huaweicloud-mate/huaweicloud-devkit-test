# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-05 05:06:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-05-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项；真云已实测并归零；10 项缺陷全部命中历史单、原样复现，无新增）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux` / `aarch64` |
| 执行机 | `1.94.218.129` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（npm `next` tag，gitHead `ffd7b474`） |
| 源码仓库 commit | `ffd7b474 chore(release): 1.1.8-next.1`（`hdk`） |
| daily 基础用例 | 设计级 102 / 展开级 43（共 145） |
| 执行时间 | 2026-10-05 05:01–05:05（北京时间） |

> **执行方法**：`prepare_env.py --update` 拉最新（测试仓库 main + `hdk` checkout 到被测包 commit + npm 安装 `@next`）→ `init_day.py Hermes Linux` 建包 → 4 个 grouped 参考探针（d2-auth / d1-upgrade / d4-security / mcp-tools）+ 11 个专用探针（probe_cloud / probe_cloud2 / probe_d10 / probe_d413 / probe_d910 / probe_d94_d95 / probe_d169_d428 / probe_missing / probe_telemetry / probe_exp_nr3 / **probe_s6**）**全部针对今日 1.1.8-next.1 重新真机运行**，逐用例证据落 `evidence/<case-id>/`（probe.mjs + stdout.log），再 `backfill_daily.py` 回填；D4-13 经 `run-as-readonly.py` 注入只读子账号 env 实测。
> **真云实测**：D3-S1/S2/S3/S4、D3-C13、D3-S6、D4-13、D4-14、EXP-C4-01~22 走真实华为云账号（KooCLI + MCP 工具），建删资源已归零（见 §七）。
> **本次测试侧修复（较 10-04 的改进）**：修复 `D3-S6` 探针——补 FunctionGraph `CreateFunction` 必填 `--memory_size/--timeout`，新增 TIMER 定时触发器绑定，删除时去除 URN `:latest` 后缀。真云实测创建+绑触发器+删除+归零全通过 → **D3-S6 由 FAIL 转 PASS**。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `143`（NOT_RUN 2） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 7 / 0 / 3 / 2` |
| 通过率（分母 = PASS+FAIL+SPEC = 143） | `93.0%`（133/143） |
| P0 / P1 / P2 产品缺陷 | `1 / 3 / 6` |
| 红线（I 类）违规 | `无`（凭证无明文泄露、无未授权写操作、真云建删已归零） |
| 资源释放 | `本次创建资源已全部删除并归零验证通过` |

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见 §四 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `2` | D1-39（Windows 专属）、D3-S7（跨服务交付） |
| BLOCKED | `0` | — |
| **合计** | **`102`** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（评测集路由 MISS） |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| BLOCKED | `0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 关联历史单 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D9-12` | D9协议 | initialize 握手前置状态机缺失 | `src/mcp-protocol.mjs:57`（dispatch :30）tools/list 无 initialize 前置检查，非法时序未返回 -32600 | #774 / #818 |
| 2 | P1 | `D3-S1` | D3功能 | 「云主机」中文意图路由未命中 | `src/tools.mjs:1970-1983` ECS keywords 缺「云主机」（:2195 CJK 子串匹配） | #844 / #842 / #705 |
| 3 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（1 条 MISS） | 同 #2，`src/tools.mjs:1966-2217` routeMap 中文关键词覆盖不全 | #705 / #844 |
| 4 | P1 | `EXP-E01` | 展开-D10 | 评测集路由 MISS | 同 #2（harness verdict=MISS） | #705 / #805 / #846 |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类错误+目录写偏 | `hooks/huaweicloud-safety.py:46` 写动词正则前置字符类不匹配空格分隔；`:24` PLUGIN_DIR 误指 `plugins/` | #844 / #847 |
| 6 | P2 | `D4-26` | D4安全 | findings.evidence 未脱敏 | `src/risk-rule-engine.mjs:97` `evidence: excerpt(context.text)` 未调 `redactSecrets` | #844 / #847 |
| 7 | P2 | `D8-9` | D8质量 | sanitizeValue 未做凭证脱敏 | `src/telemetry/telemetry.mjs:189` 仅 trim/截断，未移除 AK/SK/token | #844 / #847 |
| 8 | P2 | `D1-65` | D1安装 | DEBUG 开关仅认字面量 'true' | `src/telemetry/telemetry.mjs:81` `=== 'true'`，`DEBUG=1` 不生效 | #844 / #847 |
| 9 | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反 | `src/auth/credentials.mjs:222` `HW_REGION || HUAWEICLOUD_REGION` | #844 / #847 |
| 10 | P2 | `D3-S5` | D3功能 | 复合中文意图仅命中单一服务 | `src/tools.mjs:1966-2217` serviceCatalog 无复合意图分层拆解 | #788 |

### 根因详情

1. **D9-12（P0）** — 未 initialize 直接 `tools/list` 返回 41 工具（`{"threw":false,"code":"listed:41"}`），未按 MCP 生命周期返回 `-32600`。根因 `src/mcp-protocol.mjs:57` 无会话状态检查。证据 `evidence/D9-12/stdout.log`。
2. **D3-S1（P1）** — `service_catalog('帮我查一下我账号有哪些云主机')` 回落 `['Run hcloud --help to list available services.']`；ECS keywords 数组（`src/tools.mjs:1970-1983`）无「云主机」。证据 `evidence/D3-S1/stdout.log`。
3. **D10-3 / EXP-E01（P1）** — harness 15 条中文意图 HIT=13 MISS=1 N/A=1，准确率 92.9%；MISS 与 #2 同一 routeMap 关键词缺口。证据 `evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`。
4. **D4-25（P2）** — 写命令 `hcloud ECS CreateServers` 事件落 `cli:invoke`（应 `cli:write`）；事件落 `plugins/telemetry` 而 Node 读 `plugins/huaweicloud-core/telemetry`（不一致）。证据 `evidence/D4-25/stdout.log`。
5. **D4-26（P2）** — `hook_check_command` findings.evidence 原样含 `--password MyS3cret123`（明文残留）。证据 `evidence/D4-26/stdout.log`。
6. **D8-9（P2）** — `sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123')` 未脱敏。证据 `evidence/D8-9/stdout.log`。
7. **D1-65（P2）** — `HUAWEICLOUD_DEVKIT_DEBUG=true` 日志增量=1254，`=1` 增量=0。证据 `evidence/D1-65/stdout.log`。
8. **D1-68（P2）** — 同设两 region 变量时取 `HW_REGION`（region=`cn-test-hw-wins`），契约要求 `HUAWEICLOUD_REGION` 优先。证据 `evidence/D1-68/stdout.log`。
9. **D3-S5（P2）** — 复合意图仅返回 `["ECS"]`，无分层拆解。证据 `evidence/D3-S5/stdout.log`。

> **与前一日的对比**：SUT commit 与前一日（2026-10-04）一致（`ffd7b474`），10 项产品缺陷原样复现、无新增、无回归变化。相关修复 PR（#818/#842/#843/#847/#848）尚未发布到 npm `next` 包，故未生效。**本日较 10-04 唯一变化：D3-S6 测试侧探针修复后真云 PASS**（设计级 PASS 90→91、FAIL 7→6）。历史单关联详见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN（2）

| 用例ID | 层级 | 优先级 | 维度 | 标题 | 分类 | 详细原因 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | D1安装 | Windows 升级检测链可用性 | 【调归属】 | Windows 专属 P0 用例，非对应 OS（本机 Linux）不适用；Linux 侧由展开级 `EXP-NR3-10`（本机实测 PASS）代表覆盖（AGENTS 状态口径唯一例外） |
| `D3-S7` | 设计级 | P1 | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【改用例/补环境】 | 跨服务复合编排（RDS 建库 + 沙箱部署 + 连接串注入 + 归零）超出每日单服务真云探针范围，需专用编排 harness 与 RDS 实例配额，建议转专项隔离执行 |

> BLOCKED：`0`（真云凭证 + 只读子账号均已就绪，全部真云用例已真机执行）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**。`D2-4` 凭证脱敏 PASS；`D9-13` 凭证不泄露 PASS；`D4-1/D4-2` 凭证文件/env 打印拦截 PASS。
- [x] 写操作误判 read-only：**无**。`D4-5` DeleteServers 分类正确 PASS；`D4-13` 只读子账号写操作被 IAM 拒绝（权限不足）PASS。
- [x] 红线（I 类）违规：**无**。禁 mock、真云真机执行、只删本次创建资源；提单走 UTF-8。
- [x] 脱敏复核：发现 `D4-26`（findings.evidence 未脱敏）、`D8-9`（sanitizeValue 未脱敏）两项脱敏缺口，已在 `FINDINGS.md` 记录并关联历史单。

---

## 七、资源释放

| 资源 | 用例 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|---|
| VPC `hdk1-s2-*` | D3-S2 | ✅ 创建成功 | ✅ `DeleteVpc` | ✅ `VPC ListVpcs` 无 `hdk1-*` 残留 |
| OBS 桶 `hdk1-c13-*` | D3-C13 | ✅ 建桶 | ✅ 网站配置 delete + 对象/桶删除 | ✅ `hcloud OBS ls` 无 `hdk1-*` |
| 沙箱会话 | D3-S3 | ✅ connect（DevBridge） | ✅ `sandbox_close_session` | ✅ 会话已关闭，无计费残留 |
| FunctionGraph 函数 `hdk1-s6-*` + TIMER 触发器 | D3-S6 | ✅ 函数+触发器均创建成功 | ✅ `DeleteFunction`（去除 URN `:latest`） | ✅ `ListFunctions` 无 `hdk1-s6-*` |
| ECS / EIP | D4-13 / EXP-C4 | 未创建（仅只读规划） | — | ✅ `ECS ListServersDetails` count=0；`EIP ListPublicips` total_count=0 |
| 凭证（D4-13 只读子账号） | D4-13 | 仅 env 临时注入 | ✅ 未落盘、命令结束还原 | ✅ 无写资源 |
| 兑换券 | D3-S4 | 已领取过（`claimed=true`） | — | ✅ 无计费资源 |

> **零残留复核（本机实测 2026-10-05 05:05）**：`hcloud ECS ListServersDetails` → count=0；`hcloud VPC ListVpcs` → 无 `hdk1-*`；`hcloud FunctionGraph ListFunctions` → 无 `hdk1-s6-*`；`hcloud EIP ListPublicips` → total_count=0；`hcloud OBS ls` → 无 `hdk1-*`。

---

## 八、遗留与建议

- **P0 优先修复**：`D9-12` MCP `initialize` 前置状态机缺失，属协议安全基线，建议在 `dispatch` 层引入会话状态机，未 initialize 的 `tools/list`/`tools/call` 返回 `-32600`（已有 PR #818，待发布）。
- **路由层**：`D3-S1`/`D10-3`/`EXP-E01` 同一 routeMap 关键词缺口（口语化中文），建议扩充 ECS 等 routeMap 的关键词表（云主机/主机 等），并将评测集纳入 CI 门禁（已有 PR #842/#843）。
- **脱敏一致性**：`D4-26`/`D8-9` 两处脱敏缺失，建议统一在输出/遥测写入路径调用 `redactSecrets`/`sanitizeValue`（已有 PR #847）。
- **遥测分类**：`D4-25` Python hook 写动词正则与事件目录不一致，建议与 Node 侧目录对齐并修正正则（已有 PR #847）。
- **测试侧**：`D3-S6` 探针已修复并通过真云验证（补 required 参数 + TIMER 触发器 + `:latest` 去除）；建议将该修复沉淀回 `probes_stage/probe_s6.mjs`。
- **D3-S7** 跨服务交付用例建议转专项隔离执行（需 RDS 配额与编排 harness）。
- 本报告与 `FINDINGS.md`、`HISTORY_LINKS.md`、3 份 CSV、`evidence/` 已随 `results/Hermes/` 提交并 push 远端；10 项产品缺陷经历史查重**全部命中上游仓已有开放单**（#844/#845/#846/#818/#842/#847/#788 等），按红线「命中即不重复开单」，仅生成 `HISTORY_LINKS.md` 关联清单，未新开重复单。