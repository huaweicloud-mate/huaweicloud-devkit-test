# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-20 06:25:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-20-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit `1.1.9`（npm latest，gitHead `05a67b64`，PR #950）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（x86_64，node v22.13.0 / Python 3.12.3） |
| 被测版本（SUT） | `huaweicloud-devkit 1.1.9（npm latest，gitHead 05a67b64，PR #950）` |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：`prepare_env.py --update` 拉最新（SUT=1.1.9）→ `init_day.py` 建包 → 逐条执行 **P0→P1→P2**，证据落 `evidence/<case-id>/`（`probe.mjs` + 非空 `stdout.log`）→ `backfill_daily.py` 批量回填 → 双门禁 → 报告 + FINDINGS。执行手段：① 分组探针（d1-upgrade/d2-auth/d4-security/mcp-tools）直调源码函数（`HDK_SRC` 指向 hdk `1.1.9` 对应 commit）；② 专用探针（`probes_stage/*.mjs`）覆盖真云/协议/遥测/D10；③ **真云 E2E 真机执行**（`realcloud_e2e.mjs` + 本地修正探针）：D3-C1 ECS 生命周期、D3-C2 OBS 静态站、D3-S2 VPC 建删、D3-S3 沙箱预览、D3-C3 沙箱部署、D3-C6 沙箱凭证、D3-C13 OBS 网站托管、D3-S6 FunctionGraph 定时任务、D3-C4/EXP-C4 只读规划；④ D4-13 用 `run-as-readonly.py` 注入只读子账号实测最小权限。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（唯一未执行 D1-39 = Windows 专属 P0，Linux 不适用） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 9 / 2 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `93.8%` |
| P0 / P1 / P2 新增缺陷 | `2 / 4 / 3` |
| 红线（I 类）违规 | `3`（D2-4 / D4-26 / D8-9 明文凭证残留，均为历史单待查重） |
| 资源释放 | 本次真云创建资源除 D3-C1 的 1 套 VPC（账户级 `VPC.0112` 受阻，见 §五/§七）外全部归零；并按 §七 清理 4 套本客户端历史遗留 VPC |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境阻塞（D3-C1 账户 VPC 删除受阻、D3-S7 缺跨服务编排 harness） |
| SPEC-MISMATCH | `3` | 契约漂移（D1-65 / D1-68 / D8-9） |
| NOT_RUN | `1` | D1-39（Windows 专属 P0，Linux 不适用） |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏对 JSON 字符串不生效 | `safety-policy.mjs:34-47` `redactString()` 短键/引号 JSON 键未覆盖 | 待提单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手时序无状态机 | `mcp-protocol.mjs:30/57` `dispatch()` 缺初始化前置状态校验 | 待提单 |
| 3 | P1 | `D3-S1` | D3功能 | serviceCatalog 中文意图路由未命中 ECS | `tools.mjs:1997/1999/2228` `routeMap` 中文关键词缺失→回落 help | 待提单 |
| 4 | P1 | `D10-3` | D10评测 | 评测集路由准确率 92.9% | `tools.mjs:1999` `routeMap` 中文关键词缺失 | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | 中文意图路由 MISS | `tools.mjs:1999` `routeMap` 中文关键词缺失 | 待提单 |
| 6 | P1 | `D3-C7` | D3功能 | 跨区错误码透出 Common.0013 | `tools.mjs` 跨区引导链未做契约错误码映射 | 待提单 |
| 7 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单服务 | `tools.mjs:1997` `serviceCatalog()` 无复合意图拆分 | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 写命令事件分类/落盘错误 | `hooks/huaweicloud-safety.py:24,46` | 待提单 |
| 9 | P2 | `D4-26` | D4安全 | findings.evidence 明文密码残留 | `risk-rule-engine.mjs:97` 未走 `redactString()` | 待提单 |
| 10 | P2 | `D1-65` | D1安装 | 调试开关仅接受字面量 "true"（SPEC） | `telemetry/telemetry.mjs:81` `=== 'true'` 未兼容 `1` | 待提单 |
| 11 | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反（SPEC） | `auth/credentials.mjs:225` `HW_REGION \|\| HUAWEICLOUD_REGION` 顺序反向 | 待提单 |
| 12 | P2 | `D8-9` | D8遥测 | sanitizeValue 未做敏感值脱敏（SPEC） | `telemetry/telemetry.mjs:189` 未调用 `redactSecrets()` | 待提单 |

### 根因详情

- **D2-4（P0，I 类红线）**：期望 `redactSecrets(<含 ak/sk 的 JSON>)` 不含明文 SK；实际原样返回。根因 `plugins/huaweicloud-core/src/safety-policy.mjs:34-47`。证据 `evidence/D2-4/stdout.log`。
- **D9-12（P0）**：期望未握手直接 `tools/list` 返回 `-32600`；实际返回 `listed:42`。根因 `plugins/huaweicloud-core/src/mcp-protocol.mjs:30,57`。证据 `evidence/D9-12/stdout.log`。
- **D3-S1 / D10-3 / EXP-E01 / D3-S5（P1/P2，同源）**：`serviceCatalog` 中文路由表覆盖不足（`tools.mjs:1999 routeMap`），D10-3 评测 15 条 HIT=13（92.9%）、EXP-E01 MISS、复合意图不分层。证据 `evidence/{D3-S1,D10-3,EXP-E01,D3-S5}/stdout.log`。
- **D3-C7（P1）**：跨区只读返回 `Common.0013` 而非契约 `Ecs.0021`；跨区建 EIP 返回 `VPC.0501`（账户受限因素）。根因 `tools.mjs` 跨区引导链。证据 `evidence/D3-C7/stdout.log`。
- **D4-25（P2）**：写命令事件记 `cli:invoke` 且写入 `plugins/telemetry`（Node 读 `plugins/huaweicloud-core/telemetry`）。根因 `hooks/huaweicloud-safety.py:24,46`。证据 `evidence/D4-25/stdout.log`。
- **D4-26（P2，I 类红线）**：`findings[].evidence` 含明文 `--password MyS3cret123`。根因 `risk-rule-engine.mjs:97`。证据 `evidence/D4-26/stdout.log`。
- **D1-65 / D1-68 / D8-9（P2，SPEC-MISMATCH）**：调试开关 `1` 不生效（`telemetry.mjs:81`）、region 优先级反向（`credentials.mjs:225`）、`sanitizeValue` 未脱敏（`telemetry.mjs:189`）。证据 `evidence/{D1-65,D1-68,D8-9}/stdout.log`。

> 以上 12 项为产品缺陷，已按红线「全量测完统一提单 + 提单前历史查重」处理：`FINDINGS.md` 非空 → 统一提交源码仓库 1 个合并单（命中历史单则不重复开单，落 `HISTORY_LINKS.md`）。另有非产品缺陷/测试侧条目见 `FINDINGS.md` #13–#18。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属 P0（Windows）在 Linux 不适用；P0 不得 NOT_RUN 的唯一例外，门禁按 OS 列「专属」豁免；Linux 侧升级链路由 EXP-NR3-10 代表覆盖且 PASS | 【调归属】归属正确，无需改用例 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 环境(账户)阻塞：ECS 生命周期（CreateVpc→CreateSubnet→CreateServers→**ACTIVE**→DeleteServers 归零）已**真机实测通过**；但收尾 `DeleteVpc` 持续返回 `VPC.0112`（router 引用租户 `default` 安全组），该 default SG 删除被拒（`VPC.9902 Insufficient rights for removing default security group`）→ 本次创建的 VPC `testbot3-hermes-e2e-2445428660`(9757654e) 未能归零。判据 `evidence/D3-C1/stdout.log`。解除条件：账户侧允许删除 default SG 或成功回收该 VPC | 【补环境】账户 VPC 服务限制 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 环境(缺编排 harness)：需「RDS 实例创建 + 沙箱部署 + 连接串注入 + 全量归零」的跨服务编排 harness 及 RDS 实例配额，每日单服务真云探针（`realcloud_e2e.mjs`）未覆盖。解除条件：提供跨服务编排 harness + RDS 配额 | 【补环境】缺跨服务编排 harness |

> 全部 BLOCKED 已按第 7 步「补测收尾」追一轮：D3-C1 已改用本地修正探针（等 ACTIVE 再删）复跑至收敛于账户限制；D3-S7 复核确为缺跨服务编排 harness（非「需环境」搪塞）。其余环境类假阻塞（D3-C13/D3-S6/D4-13/D3-S2 早前受账户受限 + router 配额影响）已解除并实测 PASS。

---

## 六、安全与红线合规

- [x] **凭证泄漏事件（I 类红线）**：3 项——`D2-4`（JSON 形态 AK/SK 漏脱敏）、`D4-26`（findings.evidence 明文密码）、`D8-9`（`sanitizeValue` 未脱敏）。均记根因（文件:行号）+ 证据，待统一提单。
- [x] **写操作误判 read-only**：`D4-13` 用只读子账号（`run-as-readonly.py` 注入）实测——只读 `ECS ListServersDetails` 可用（count=0），写 `VPC CreateVpc` 被 IAM 拒绝 `VPC.0010 Rules on create_router by *** disallowed by policy` → **写被正确识别为权限不足，最小权限通过**（`evidence/D4-13/stdout.log`）。`D4-28` hook 校验（`cred-file/safe-read/cmd-key` deny）亦通过。
- [x] **红线（I 类）违规**：无新增红线之外的违规；上述 3 项属既有脱敏缺口。
- [x] **脱敏复核**：`redactString`（safety-policy）对 `KEY=value` 形态有效，但对 JSON / 短键 / risk-rule evidence / telemetry sanitizeValue 三处缺口仍漏（见缺陷 1/9/12）。
- [x] **真云零写约束**：`D3-C4` + `EXP-C4-01..22` 对 22 个服务只读操作规划 22/22 `decision=allow`，全程零写。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| `D3-C1` VPC/子网 | VPC `testbot3-hermes-e2e-2445428660` + 子网 | 子网已删；**VPC 未删**（`VPC.0112`，账户 default SG 受阻） | VPC 残留 1 套（见 §五 BLOCKED） |
| `D3-C1` ECS | `testbot3-hermes-ecs-*`（c6.large.2, 40G GPSSD） | `DeleteServers --delete_publicip=true` | ✅ 已归零（`ListServersDetails` 确认缺席） |
| `D3-C2` OBS 桶 | `testbot3-hermes-obs-*` | `OBS rm -f` | ✅ 已归零（`OBS ls` 确认缺席） |
| `D3-S2` VPC | `hdk1-s2-*` | 确认后 `DeleteVpc` | ✅ 已归零 |
| `D3-C13` OBS 桶 | `hdk1-c13-*` | 删桶 | ✅ 已归零 |
| `D3-S6` FunctionGraph | 函数 + 定时触发器 | 删函数/触发器 | ✅ 已归零 |
| `D3-S3/D3-C3/D3-C6` 沙箱 | 沙箱工作区 + nginx + tunnel | `close_session` | ✅ 会话关闭 |
| `D4-13` 只读探测 | 无（写被拒） | — | ✅ 未产生资源 |
| **历史遗留清理（非本次）** | 本客户端历次遗留 4 套 VPC/子网 | 手动 `DeleteSubnet`+`DeleteVpc` | ✅ 已删除以释放 router 配额 |

> **执行前账户态**：ECS≥1（他机）、VPC 5（含本客户端遗留 4 套）；`CreateVpc` 曾报 `VPC.0114 Quota exceeded for resources: ['router']`。**执行后账户态**：本次创建的 ECS/OBS/VPC（除 D3-C1 受阻 VPC）/FunctionGraph 全部归零；EIP=0、EVS=0、OBS=0；账户内 VPC 仅剩 D3-C1 受阻的 1 套（`9757654e`）。清理仅限本客户端（`testbot3-`）探针遗留，未触碰他机资源（`testbot1-*`、`tctest-*`）。

---

## 八、遗留与建议

1. **P0 两项必须优先闭环**：`D2-4`（JSON 凭证漏脱敏）与 `D9-12`（未握手即可 `tools/list`）均为安全/协议基线，建议合并入当日缺陷单并优先修复。
2. **路由表覆盖（同源 4 例）**：`D3-S1 / D10-3 / EXP-E01 / D3-S5` 同源于 `tools.mjs:1999 routeMap`，建议补中文关键词（含「只读查询/查看云主机」）并支持复合意图拆分，一次性收敛评测集基线至 100%。
3. **跨区错误码归一**：`D3-C7` 建议对 KooCLI `Common.0013` 做契约错误码映射（`Ecs.0021/Ecs.0200`），避免错误语义随 CLI 抖动。
4. **脱敏三处缺口**（`D2-4 / D4-26 / D8-9`）属 I 类红线，建议统一收敛到 `redactString()` 单一实现，避免「safety-policy 脱敏、risk-rule/telemetry 漏脱敏」的分叉。
5. **SPEC 待裁决**（`D1-65` 调试开关接受 `1`、`D1-68` region 变量优先级）建议同步更新实现或用例契约，避免长期漂移。
6. **真云探针测试侧修正建议**：`scripts/realcloud_e2e.mjs` 建议 ① OBS 建桶按云端副作用（而非 KooCLI 退出码）判定；② ECS 归零改为「等 ACTIVE 再删 + 延长轮询」；③ 收尾增加安全组删除步骤（`VPC.0112` 需先删 SG 再删 VPC）。已在本轮以本地修正探针归档（`FINDINGS.md` #15）。
7. **环境治理建议**：账户内大量历史遗留 VPC/子网（2026-09~10）持续占用 router 配额并致 `VPC.0114`；且多测试机（`testbot1-*` 等）共享同一账号并发抢占配额。建议建立按客户端前缀的定期归零清理 + 配额监控。
8. **D3-C1 归零收尾**：残留 VPC `9757654e-cb8e-499f-b73e-024bc64a0d28` 受账户 `default` 安全组不可删限制无法回收，建议账户侧解除后由维护者统一清理。
9. **D3-S7 立项**：跨服务交付（Web 应用 + RDS）建议立项专项（独立编排 harness + RDS 配额），否则每日用例将持续阻塞。