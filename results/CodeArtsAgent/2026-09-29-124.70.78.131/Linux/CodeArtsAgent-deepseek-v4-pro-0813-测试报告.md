# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-29 05:18:29（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-29-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.7` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（safety-policy / risk-rule-engine / hcloud-cli / mcp-protocol / tools / telemetry 等），决策/结果落 `stdout.log`；CLI 真机执行（install/doctor/status）记录日志；MCP 协议用 Content-Length 帧客户端 spawn `mcp-server.mjs` 实测；真云 E2E 用 `hcloud`/`hcloud obs` 真机建删 VPC/OBS 桶/安全组并归零验证；沙箱全链路用 `huaweicloud_sandbox_*` MCP 工具真机跑通。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `111 / 26 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 137） | `81.0%` |
| P0 / P1 / P2 新增缺陷 | `5 / 16 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC/SG/OBS 前缀 tctest-caa- 计数 0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `84` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:1817` routeMap 复合意图无中文关键词 | 历史(不重复提单) |
| 2 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | `tools.mjs:1817` routeMap FunctionGraph 无中文关键词 | 历史(不重复提单) |
| 3 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `tools.mjs:1817` routeMap 复合意图缺部署目标(只命中 RDS) | 历史(不重复提单) |
| 4 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/policy.json:26` blockedSecretOperations 缺 kms DecryptData | 历史(不重复提单) |
| 5 | P0 | `D4-15` | D4安全 | hook绕过尝试 | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C/命令替换 | 历史(不重复提单) |
| 6 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `data/cloud-risk-rules.json` env-dump 词边界不匹配 shell 包裹 | 历史(不重复提单) |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs` 无 finding 即 allow(fail-open) | 历史(不重复提单) |
| 8 | P0 | `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | `package.json` files 缺 rules + rules/.mdc 无引用 | 历史(不重复提单) |
| 9 | P1 | `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | `hcloud-cli.mjs:85` consumeApprovalToken 无过期校验/结构化返回 | 历史(不重复提单) |
| 10 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py` 写分类正则无 \b 词边界 | 历史(不重复提单) |
| 11 | P2 | `D8-1` | D8质量 | 文档与能力一致 | `AGENTS.md:27` 硬编码 39 vs 实现 40 | 历史(不重复提单) |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry.mjs:189` sanitizeValue 无敏感值脱敏 | 历史(不重复提单) |
| 13 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-server.mjs:166` 无 initialize 状态机 + `mcp-protocol.mjs:57` tools/list 无条件 | 历史(不重复提单) |
| 14 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:1817` routeMap 仅 sandbox/voucher 含 CJK | 历史(不重复提单) |
| 15 | P1 | `EXP-E01` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 16 | P1 | `EXP-E02` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 17 | P1 | `EXP-E03` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 18 | P1 | `EXP-E04` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 19 | P1 | `EXP-E05` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 20 | P1 | `EXP-E07` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 21 | P1 | `EXP-E08` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 22 | P1 | `EXP-E10` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 23 | P1 | `EXP-E11` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 24 | P1 | `EXP-E12` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 25 | P1 | `EXP-E13` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |
| 26 | P1 | `EXP-E14` |  |  | `tools.mjs:1817` routeMap CJK 缺失(同 D10-3) | 历史(不重复提单) |

### 根因详情

> 根因详情与证据见同目录 `FINDINGS.md`（12 项缺陷，全部为历史 issue 复现，v1.1.7 未修复）；历史关联清单见 `HISTORY_LINKS.md`。
>
> 核心根因速览：① `safety/policy.json:26` blockedSecretOperations 缺 kms DecryptData（D4-3）；② `risk-rule-engine.mjs` 纯正则不解析 ANSI-C/命令替换/shell 包裹（D4-15/16/17）；③ `package.json` files 缺 rules（D4-23）；④ `mcp-server.mjs:166` 无 initialize 状态机（D9-12）；⑤ `tools.mjs:1817` routeMap 仅 sandbox/voucher 含 CJK 关键词致中文路由准确率 21.4%（D10-3/D3-S5~S7/EXP-E01~E14）；⑥ `hcloud-cli.mjs:85` 确认令牌无结构化返回（D4-24）；⑦ `telemetry.mjs:189` sanitizeValue 不脱敏（D8-9）；⑧ `mcp-protocol.mjs:47` capabilities 缺 cancellation（D9-9 SPEC）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 专属用例（OS 列标注「专属」），本机 Linux；由 D1-40（Android/Linux 镜像 lag 反向提醒）+ 展开级 EXP-NR3 终端矩阵代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | sandbox_connect failed: "HDKIT_NOT_AGREEMENT: 用户未签署最新版协议，签署需由用户本人确认后完成 [trace: d2acbcda78534a72906b149ada099ee9]" |
| `D9-6` | D9协议 | 跨客户端互通 | 需 MCP Inspector + ≥3 真实客户端并发接入以验证协议互通；本机仅 DSH 单客户端（无 CDP Inspector 多客户端环境）。解除条件=多客户端会话环境 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（`show_profile_redacted` 返回 `<redacted>`，探针断言无 AK/SK/token 明文）
- [x] 写操作误判 read-only：`0`（classifyHcloudArgs 对 ListServersDetails=allow、DeleteServers=deny 分类正确）
- [x] 红线（I 类）违规：`无`（真云最低配置创建→测后删除归零，未 mock、未虚报）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云探针仅记录资源 id/name，无 AK/SK 明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（前缀 `tctest-caa-`） | 是（c4/s2/c18/c20/ro/c14） | 已删 | `ListVpcs` 前缀计数 0 |
| 安全组（前缀 `tctest-caa-`） | 是（D4-19 sg-*） | 已删（含规则） | `ListSecurityGroups` 前缀计数 0 |
| OBS 桶（前缀 `tctest-caa-`） | 是（D3-C13 web-*） | 已删 | `hcloud obs ls` 前缀计数 0 |

> 真云只删本次创建资源（前缀 `tctest-caa-`），删除前全量盘点 + 白名单；沙箱 D3-S3 的 DevStation workspace 因协议未签署未创建（check_user 阶段即返回 HDKIT_NOT_AGREEMENT，未产生需清理的云端资源）。残留即 FAIL，本轮全部归零。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` tools/call 未声明 `notifications.cancellation`（capabilities 仅 `{tools:{}}`）。
- 本轮 BLOCKED：`D3-S3`（沙箱协议未签署，HDKIT_NOT_AGREEMENT，需用户本人确认签署后才能 connect，本机无真实用户通道）；`D9-6`（跨客户端互通需 MCP Inspector + ≥3 真实客户端并发，本机单客户端）。
- 建议：v1.1.7 未修复的 12 项历史缺陷（尤其是 P0 的 D4-3/D4-15/D4-16/D4-23/D9-12）建议排入 v1.1.8 修复计划；serviceCatalog routeMap 中文关键词覆盖是 D10 评测长期低分的根因，建议整体补 CJK 词表。
