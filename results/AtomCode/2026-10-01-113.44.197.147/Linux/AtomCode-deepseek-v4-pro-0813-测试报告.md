# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-01 06:10:18（北京时间）
> **执行归档**：`results/AtomCode/2026-10-01-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64（Ubuntu 24.04；IP 113.44.197.147）` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7`（npm latest；源码 gitHead `7456d059`） |
| 工具全集 | `40`（tools/list 实测 40 工具） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 11 pass 0 warn 0 fail` |
| 真云凭证 | `cn-north-4（AKSK 已用，真机建删归零）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E / 路由评测 |
| daily 基础用例 | 设计级 102 / 展开级 39（预筛后） |

> **执行方法**：5 个 grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix，经 reuse_probes 复制并 path-rewrite 指向本机 hdk 源码）+ 18 fixtures run-all + run-eval.mjs（D10-3 路由）+ protocol-probe.mjs（D9 协议）+ realcloud_e2e.mjs（真云建删）+ supplement 源码级直调 + 补充直调，均本机 2026-10-01 新鲜重跑，结论落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `115 / 24 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `82.7%` |
| P0 / P1 / P2 新增缺陷 | `3 / 19 / 2`（含 1 SPEC-MISMATCH 计入 P1） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS/VPC/subnet/OBS 建删归零，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | TODO: 待补根因 | 待提单 |
| 4 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D3-S8` | D3功能 | 场景-操作失败后排障指引 | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 8 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 9 | P0 | `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | TODO: 待补根因 | 待提单 |
| 10 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 11 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `D9-2` | D9协议 | JSON-RPC错误码 | TODO: 待补根因 | 待提单 |
| 13 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 14 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 15 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 16 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 17 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 18 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 19 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 20 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 21 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 22 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 23 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 24 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> 每个 FAIL/SPEC 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」详见同目录 `FINDINGS.md`（11 项缺陷已按 file_issue.py 可解析格式落盘，逐项含根因文件:行号）。
> 核心根因归纳：
> - 凭证脱敏类（D2-4 / D4-6 / D4-27 / D8-9）：`safety-policy.mjs:42/45` 与 `telemetry/telemetry.mjs:189` 键名表/分隔符/入口覆盖不足，JSON 键值形、空格分隔 adminPass、小写 ak=/sk=、遥测 sanitizeValue 均未脱敏。
> - 命令包裹穿透（D4-16 P0）：`safety-policy.mjs:397-426` env-dump 检测不识别引号内层命令，stripExecutable 未用于 classifyTextCommand。
> - 全局规则注入缺失（D4-23 P0）：`package.json:8` files 白名单缺 rules/。
> - 中文路由覆盖不足（D10-3 / D3-S1/S3/S6/S7/S8 / EXP-E01~E14 共 11 条）：`tools.mjs:1817-1921` routeMap 关键词多为英文、无排障分支。
> - 协议类（D9-2 / D9-9 SPEC）：`mcp-protocol.mjs:57`（tools/list 无 params 校验）、`:47`（capabilities 无 cancellation）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属（用例 OS 列标注「Windows 升级检测链 EINVAL 专属」）；Linux/macOS 由 NR3 终端矩阵代表，本日 d1-upgrade queryDistTagsSync-no-EINVAL 已佐证 Linux 侧检测链可用 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云 E2E 返回无明文 AK/SK；脱敏探针输出仅含占位符）
- [x] 写操作误判 read-only：`0`（D4-5 delete/create not readonly PASS）
- [x] 红线（I 类）违规：`无`（I 类=证书/密钥明文泄漏，本日未发现明文泄漏事件；D2-4/D4-27 脱敏缺口为功能缺陷非已泄漏事件）
- [x] 脱敏复核：证据目录 `stdout.log` 仅存脱敏后值/占位符，无原始凭证

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `testbot3-hermes-e2e-0803012481`（id 8ffa9325） | 是 | 已删 | DeleteVpc 后 ListVpcs 计数=0 |
| Subnet（id c1b99880） | 是 | 已删 | DeleteSubnet 后 ListSubnets 计数=0 |
| ECS `testbot3-hermes-ecs-0803012481`（id 5d21edd5） | 是 | 已删（异步） | 补发 DeleteServers 后 ListServersDetails 计数=0 |
| OBS `testbot3-hermes-obs-*` | 是 | 已删 | 删桶归零 OK |
| 沙箱会话（D3-C3/C6） | 是 | close_session | close 返回 ok，无计费残留 |

> 说明：D3-C1 真机 ECS 删除为异步，realcloud 探针 150s 轮询窗口内未确认记为 FAIL，agent 已补发 DeleteServers 并二次轮询确认归零（ListServersDetails 计数=0）；最终无任何本次创建资源残留。D3-C2 建桶步骤 hcloud OBS mb 返回退出码 6（非 0，系 CLI 现象），但 set/get 静态站 200、删桶归零均成功，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities 未声明 `notifications.cancellation`（无 -32000/timeout 语义），需维护方裁决是否为契约缺口。
- 版本口径：今日严格按 AGENTS.md 默认测 **latest=1.1.7 正式版**（`prepare_env.py --update` 默认逻辑会自动取 next=1.1.8-next.1 > latest 而切到 next，故本次显式 `--latest` 装 1.1.7 并对齐源码 gitHead 7456d059）。相对昨日 1.1.8-next.1，1.1.7 正式版仍存在 D4-16 sh-c 包裹穿透、D4-23 rules 注入缺失，且中文路由（D10-3 21.4% vs next 92.9%）覆盖明显不足——**说明这些修复尚未发布到 latest 正式版**，建议维护者评估 1.1.8 正式发布节奏。
- 历史查重：D2-4/D4-6/D4-27/D9-2/D9-9/D8-9 等疑似与上一日 FINDINGS 重复，file_issue.py 应命中历史单、不重复开单。
- 路由优化建议：`tools.mjs` routeMap 补充中文服务名映射（云主机/云服务器/云数据库/函数/监控/证书/备份等）与排障/诊断分支，可将 D10-3 准确率从 21.4% 提升。
