# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-21 05:42（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-21-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/SPEC 缺陷，P0 9 项；全部历史已知，不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64） |
| Node / npm / Python | `Node v22.23.5 / npm（nodejs/bin）/ Python 3.12.3` |
| 被测版本（SUT） | `1.1.15`（npm latest，源仓 commit bf79b643） |
| 工具全集 | `49`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置（AKSK profile default / cn-north-4）` |
| 真云凭证 | `cn-north-4（AKSK 已配置；只读子账号 test001 已就绪）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（`_probe/core.mjs`+`checks1-6.mjs`）`file://` 直调 `hdk/plugins/huaweicloud-core/src/*.mjs` 导出函数（Node v22 直接 import `.mjs`）+ 经 `tools.callTool` 走真实 MCP 工具面；MCP 协议类自起 `mcp-server.mjs` 走 JSON-RPC 帧；真云 E2E（ECS/OBS/VPC/沙箱）真机执行（建删归零）；D10 评测走 `serviceCatalog` 路由层。证据统一落 `evidence/<case-id>/stdout.log`。

> 本日 SUT 为 **1.1.15**（npm latest，`.mjs` 布局）。前两日（11-19/11-20）被测为 `2.0.0-next.4`（`.ts` 布局），故本日换用 `.mjs` 布局探针 harness（复用 2026-11-18 的 `_probe/`，与 `.mjs` SUT 匹配）全量重跑，本机新证据逐条落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 OS 专属 P0 豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142） | `93.0%` |
| P0 / P1 / P2 缺陷 | `5 / 3 / 2` |
| 红线（I 类）违规 | `0`（测试过程未 mock、未虚标 PASS、未泄露明文凭证；真云资源归零） |
| 资源释放 | `归零`（OBS 静态站建删归零；ECS 前置 VPC/子网/安全组建删归零；沙箱 E2E 上传/nginx/deploy_check 已执行） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行（OS 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01） |
| BLOCKED | `0` | 环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` redactString 的 `(AK\|SK)` 分支不覆盖小写 `ak=`/`sk=` | 历史问题（不重复提单） |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截缺口 | `safety/rules/cloud-risk-rules.json:56` hwc-command-secret-value-read 未覆盖 `DecryptData` | 历史问题（不重复提单） |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety/rules/cloud-risk-rules.json:26` env-dump regex `(^\|\s)` 不匹配引号内 env | 历史问题（不重复提单） |
| 4 | P0 | `D4-21` | D4安全 | HCL 宽泛 IAM 制品未拦截 | `safety/rules/cloud-risk-rules.json:196` iam-admin-policy 只匹配 JSON 形态 | 历史问题（不重复提单） |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手时序未强制 | `mcp-protocol.mjs:70` tools/list 无已初始化校验 | 历史问题（不重复提单） |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊 fail-closed 缺口 | `risk-rule-engine.mjs:143` 对 `$(curl\|sh)` 无规则命中返回 allow | 历史问题（不重复提单） |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务复合意图路由缺失 | `tools.mjs:2758` sandbox route 缺中文「Web 应用」 | 历史问题（不重复提单） |
| 8 | P1 | `EXP-E01` | D10评测 | 云主机意图路由 MISS | `tools.mjs:2586` ECS keywords 缺「云主机」别名 | 历史问题（不重复提单） |
| 9 | P2 | `D1-68` | D1安装 | 区域环境变量优先级契约漂移 | `credentials.mjs:225` HW_REGION 优先于 HUAWEICLOUD_REGION | 历史问题（不重复提单） |
| 10 | P2 | `D8-9` | D8质量 | 遥测值脱敏缺口 | `telemetry/telemetry.mjs:190` sanitizeValue 无脱敏 | 历史问题（不重复提单） |

> 全部 10 项缺陷经 `file_issue.py` 历史查重命中上游已有 open issue（强关联），**不重复提单**，仅生成 `HISTORY_LINKS.md` 关联清单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | 调归属 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；由展开级 EXP-NR3 代表覆盖 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | 补环境 | ECS CreateServers 订单提交被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费 |
| `D3-C7` | 设计级 | P1 | 补环境 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013、EIP 创建返回 VPC.0501。已实测通过项：list_regions 含 ap-southeast-3、plan_cli_command 含 --cli-region。解除条件：账号开通 ap-southeast-3 项目/region 权限 |
| `D3-S3` | 设计级 | P1 | 补环境 | 沙箱 DevBridge 隧道凭证已过期——沙箱内 devbridge create 返回 "API key expired，please login again"。已实测 connect/upload/deploy_nginx 均通过（deploy_check nginx_serving=HTTP 200），仅 tunnel 暴露步骤受阻。解除条件：沙箱环境刷新 devbridge 凭证 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D2-4 为大写 AK=/SK= 正常脱敏，小写 ak=/sk= 为产品侧脱敏缺口，测试未泄露明文凭证至对话/日志）
- [x] 写操作误判 read-only：`无`（D4-5 实测未误判）
- [x] 红线（I 类）违规：`无`（P0 缺陷均为产品侧风险引擎/协议缺口，测试过程未 mock、未虚标 PASS、未泄露明文凭证）
- [x] 脱敏复核：`通过`（D2-4/D4-6/D4-26/D4-27 脱敏链均实测）
- [x] 真云资源释放：`归零`（OBS 静态站、ECS 前置 VPC/子网/安全组均已建删归零）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站） | 是 | 是 | `obs ls` 不含本次 bucket |
| VPC/子网/安全组（D3-C1 前置） | 是 | 是 | finally 反序删除，归零 |
| ECS 本体（D3-C1） | 否 | — | billing Ecs.0707 订单拒绝，未建成 |
| 沙箱（D3-C3 部署 E2E） | 是 | 是 | 上传/nginx/deploy_check 已执行，无残留待清理资源 |

> 真云用例已真机执行建删归零，仅 D3-C1 ECS 本体因 billing Ecs.0707 未建成（前置 VPC/子网/安全组已建删归零），无泄漏资源。

---

## 八、遗留与建议

- 【产品缺陷·历史】全部 10 项缺陷（D2-4/D4-3/D4-16/D4-21/D9-12/D4-17/D3-S7/EXP-E01/D1-68/D8-9）为历史已知缺陷且在 1.1.15 正式版仍未修复，经 `file_issue.py` 查重命中上游 open issue，不重复提单，详见 `HISTORY_LINKS.md`。
- 【流程阻塞】D3-C1（billing Ecs.0707）、D3-C7（跨区域 project 权限）、D3-S3（沙箱 devbridge 凭证过期）为账号侧环境阻塞，建议补环境后复测。
- 【待裁决 SPEC】D1-68 region 优先级契约漂移：实现 `HW_REGION` 优先于 `HUAWEICLOUD_REGION`，与用例契约相反，属历史漂移（#1158/#1055 已记录），需裁决契约或修正实现。
- 【重复性结论】本日 10 项缺陷与近期（11-19/11-20，2.0.0-next.4）及更早 v1 版本完全一致，均为历史已知缺陷，已查重不重复提单，仅记录 HISTORY_LINKS.md 关联清单。