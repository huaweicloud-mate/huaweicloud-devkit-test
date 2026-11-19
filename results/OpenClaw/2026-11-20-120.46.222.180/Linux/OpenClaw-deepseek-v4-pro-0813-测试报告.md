# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-20 05:20:51（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-20-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `2.0.0-next.4`（源仓 commit 16a24814） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（`_probe/core.mjs`+`checks1-6.mjs`）`file://` 直调 `hdk/plugins/huaweicloud-core/src/*.ts`（Node v22 type-stripping 直接 import `.ts` 源码）导出函数 + 经 `tools.callTool` 走真实 MCP 工具面；MCP 协议类自起 `mcp-server.ts` 走 JSON-RPC 帧；真云 E2E（ECS/OBS/VPC/跨区）真机执行（建删归零）；D10 评测走 serviceCatalog 路由层。证据统一落 `evidence/<case-id>/stdout.log`。

> 本日 SUT 与 2026-11-19 相同（2.0.0-next.4 / commit 16a24814，无新代码提交），探针 harness 复用前次 `_probe/` 并全量重跑（非复制证据），本机新证据逐条落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 3 / 6 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `97.8%` |
| P0 / P1 / P2 新增缺陷 | `1 / 1 / 1` |
| 红线（I 类）违规 | `0`（P0 缺陷为产品侧 hook 缺口，测试过程未 mock、未虚标 PASS、未泄露明文凭证；真云资源归零） |
| 资源释放 | `归零`（ECS E2E 的 VPC/子网/安全组建删后归零；OBS 静态站建删后归零；沙箱/OBS-set 因 v2 审批门未产生待清理资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `6` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety/rules/cloud-risk-rules.json:35` env-dump 规则只匹配行首/空白后 env，`evaluateCommandRisk`（`risk-rule-engine.ts:278`）不展开 shell 包裹，`hook_check_command`（`tools.ts:397-398`）走 risk 引擎未拦截 | 历史问题（不重复提单） |
| 2 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry-values.ts:27` sanitizeValue 仅换行替换+trim+截断，无敏感值脱敏 | 历史问题（不重复提单） |
| 3 | P1 | `EXP-E01` | D10评测 | 云主机意图路由 MISS | `capability-catalog.ts:24-36` ECS 路由关键字缺「云主机」别名，routeMap 单意图匹配落空 | 历史问题（不重复提单） |

### 根因详情

| 用例 | 期望 | 实际 | 根因 | 证据 |
|---|---|---|---|---|
| D4-16 | hook_check_command(`sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"`) 拦截 deny | decision=allow, findings=[] | `safety/rules/cloud-risk-rules.json:35` env 正则仅 `(^\|\s)(env\|...)`，引号内 `env` 前导 `"` 不命中；`evaluateCommandRisk` 不展开包裹 | `evidence/D4-16/stdout.log` |
| D8-9 | sanitizeValue 移除 AK/SK/token | 明文原样返回 | `telemetry/telemetry-values.ts:27` sanitizeValue 无脱敏 | `evidence/D8-9/stdout.log` |
| EXP-E01 | 云主机→ECS | `recommendedServices=['Run hcloud --help ...']` | `capability-catalog.ts:24-36` 缺「云主机」关键词 | `evidence/EXP-E01/stdout.log` |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注专属），本机为 Linux，由展开级 EXP-NR3 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C3` | D3功能 | 沙箱部署E2E | v2 审批门（PR-3c）将 sandbox_connect 计入 ALWAYS gated，需用户在终端 approve + PIN 人工确认，无人值守无法完成部署 E2E。解除条件：人工 approve+复位 PIN，或产品提供写路豁免（补环境·v2 审批门人工确认） |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | v2 审批门（PR-3c）将沙箱 connect/sign_agreement/credentials 计入 ALWAYS gated，需用户在终端 approve + PIN 人工确认。已实测：check_user 直接返回(realnameVerified=true)，3 个写面均正确返回 USER_CONFIRMATION_REQUIRED(true)。解除条件：人工 approve+复位 PIN，或产品提供写路豁免（补环境·v2 审批门人工确认） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | v2 审批门（PR-3c approval gate）将 obs_set_website_config 的 set/delete（AWS4 签名写）改为需用户在终端 `npx huaweicloud-devkit approve <token>` + PIN 人工确认，自动化测试机无人值守/无 PIN 无法完成 set 真机写循环与 delete 归零的完整 E2E。已实测通过项：建桶成功、set 缺 indexDocument 前置报错、get 只读 AWS4 路径返回 404 NoSuchWebsiteConfiguration XML、set 正确返回 USER_CONFIRMATION_REQUIRED 审批门槛。解除条件：由人在终端 approve 重置 PIN 后完成 set/delete 写循环，或产品为自动化测试提供写路豁免（补环境·v2 审批门人工确认） |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | v2 审批门（PR-3c）将 sandbox_connect 计入 ALWAYS gated，需用户终端 approve + PIN 人工确认，无人值守无法完成沙箱预览出 URL。解除条件：人工 approve+复位 PIN（补环境·v2 审批门人工确认） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D2-4 小写/大写 ak=/sk= 均脱敏，findings 无明文 secret_key/adminPass）
- [x] 写操作误判 read-only：`无`（D4-5 DeleteVpc 未误判 read_only）
- [x] 红线（I 类）违规：`无`（D4-16 P0 为产品侧 shell 包裹绕过缺口，测试过程未 mock、未虚标 PASS、未泄露明文凭证）
- [x] 脱敏复核：`通过`（D2-4/D4-6/D4-26/D4-27 脱敏链均实测）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（billing Ecs.0707 订单拒绝，未建成） | — | VPC/子网/安全组已删，ListVpcs 不含本次名称 |
| OBS 桶（D3-C2 静态站） | 是 | 是 | rm -f 后 `obs ls` 不含本次 bucket |
| VPC/子网/安全组（D3-C1 前置） | 是 | 是 | finally 反序删除，归零 |
| 沙箱/OBS-set（D3-C3/C6/S3/C13） | 否 | — | v2 审批门阻断，未产生待清理资源 |

> 真云用例已真机执行建删归零，仅 D3-C1 ECS 本体因 billing Ecs.0707（账号 BSS 产品目录无该镜像产品映射）未建成，前置 VPC/子网/安全组已建删归零，无泄漏资源。

---

## 八、遗留与建议

- 【产品缺陷·历史】D4-16：建议 `hook_check_command` 对 shell 包裹（`sh -c`/`bash -c`/`$()`）做内层提取后再跑 `evaluateCommandRisk`，或 env-dump 规则 regex 增加引号边界。（已挂历史单，见 HISTORY_LINKS.md）
- 【产品缺陷·历史】D8-9：建议 `sanitizeValue` 接入 `redactSecrets`，遥测 value 字段脱敏。（已挂历史单）
- 【产品缺陷·历史】EXP-E01：建议 `capability-catalog.ts` ECS 路由关键字补「云主机」别名。（已挂历史单）
- 【流程阻塞】D3-C1（billing Ecs.0707）、D3-C7（跨区域 project 权限）为账号侧配额/权限阻塞；沙箱/OBS 写路（D3-C3/C6/S3/C13）因 v2 审批门需人工 approve+PIN，自动化无人值守无法完成，建议产品为测试自动化提供写路豁免或预置 PIN。
- 【重复性结论】本日 3 项 FAIL（D4-16/D8-9/EXP-E01）与 2026-11-19 完全一致，均为历史已知缺陷（SUT 无版本变化），已查重不重复提单，仅记录 HISTORY_LINKS.md 关联清单。
