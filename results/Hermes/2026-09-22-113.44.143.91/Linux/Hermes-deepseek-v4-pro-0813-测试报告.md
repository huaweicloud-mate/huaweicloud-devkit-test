# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-22 05:30 CST（北京时间）
> **执行归档**：`results/Hermes/2026-09-22-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 缺陷：D2-4 / D4-16 / D4-23）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（6.8.0-106-generic，x86_64） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11 |
| 被测版本（SUT） | v1.1.6-next.0（npm @next，gitHead `faaefb8f`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS，tools/list 实测 40） |
| hcloud / 依赖 | KooCLI 已配置（cn-north-4） |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001 双已就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E / 评测 harness |
| daily 基准用例 | 设计级 100 / 展开级 43 / 追踪表 211 |

> **执行方法**：探针脚本（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与真机 hcloud，决策/结果落 `stdout.log`；CLI/真云真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 143（设计级 100 + 展开级 43） |
| 已执行 | 143 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 116 / 23 / 0 / 2 / 2 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 82.3%（116/141） |
| P0 / P1 / P2 缺陷 | 3 / 6 / 5（含 2 SPEC） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC/OBS 删除验证、沙箱会话关闭、只读子账号无残留） |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 85 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | 不符预期，根因见缺陷清单 #1~#12 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 2 | D9-9 / D4-24 契约漂移，待裁决 |
| NOT_RUN | 1 | D1-39（Windows 专属，Linux 由 EXP-NR3-10 代表覆盖） |
| **合计** | **100** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | EXP-C4×22 + EXP-NR3×4 + EXP-D5×2 + EXP-E HIT×3 |
| FAIL | 11 | EXP-E01/02/03/04/05/07/10/11/12/13/14（路由 MISS，归于 D10-3） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP-E08（诊断意图不适用 serviceCatalog 路由） |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 完整 14 项缺陷见同目录 `FINDINGS.md`（严格格式，为提单脚本解析输入）。下表为摘要索引。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏不完整（小写 ak=/sk= 明文泄漏） | safety-policy.mjs:34-45 |
| 2 | P0 | D4-16 | 命令包裹穿透（sh -c env-dump 未拦截） | safety-policy.mjs:384-419 |
| 3 | P0 | D4-23 | 全局规则 huawei-agent-rules 注入未生效 | src/bin 无注入引用 |
| 4 | P1 | D4-27 | 双路径输出脱敏漏小写 ak=/sk= | safety-policy.mjs + hcloud-cli.mjs（同 D2-4） |
| 5 | P1 | D10-3 | 路由准确率 21.4%（中文意图路由缺失） | tools.mjs:1778-1886 |
| 6 | P1 | D9-2 | JSON-RPC 非法参数无 -32602 错误对象 | mcp-protocol.mjs:46-77 |
| 7 | P1 | D3-S3 | 沙箱预览 URL 未就绪（nginx_serving FAIL） | sandbox deploy_check |
| 8 | P2 | D4-25 | Python hook 写命令分类错误（cli:invoke） | huaweicloud-safety.py:46/95 |
| 9 | P2 | D4-26 | findings 证据脱敏漏小写 ak=/sk= | risk-rule-engine.mjs:25（同 D2-4） |
| 10 | P2 | D8-9 | sanitizeValue 不脱敏凭证 | telemetry.mjs:189-196 |
| 11 | P2 | D8-1 | 文档工具数漂移 39 vs 40 | AGENTS.md 未同步 |
| 12 | P2 | D3-S5 | 复合意图分层路由不拆多服务 | tools.mjs routeMap（同 D10-3） |
| 13 | P1 | D9-9 | 取消能力未声明（SPEC-MISMATCH） | mcp-protocol.mjs:63 |
| 14 | P1 | D4-24 | 确认令牌精确 JSON 契约未实现（SPEC-MISMATCH） | tools.mjs auth_confirm 分支 |

### 相对 v1.1.5 的正向回归（本轮修复项）

- **D4-17「hook 模糊 fail-open」已修复**：v1.1.5 中 `risk-rule-engine.mjs` 无规则命中默认 `allow`（fail-open）；v1.1.6-next.0 由 #564「risk engine fails closed on malformed input」修复，本轮 `classifyTextCommand` 对畸形/危险输入返回非 allow → PASS。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（npm.cmd spawnSync 无 shell:true 的 EINVAL 场景）；本机 Linux，由展开级 EXP-NR3-10 代表覆盖 | 无需改（OS 专属已在 OS 列标注「专属」） |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断意图（ECS 启动失败分析）不适用 `serviceCatalog` 服务路由（应走 explain_error 工具）；run-eval 记为 N/A（期望路由=null） | 建议将 EXP-E08 期望动作改为「诊断」并路由到 explain_error，而非 serviceCatalog MISS/N/A 判 FAIL |

> 无 BLOCKED 用例（真云凭证、只读子账号、沙箱配额均已就绪并实机执行）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针输出均脱敏字段名，未落盘真实 AK/SK；只读子账号探针输出已遮掩）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（真云用例均真实建删并归零）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（testbot3-hermes-d3s2b-*） | 是 | 已删 | ShowVpc 返回 not found（归零=true） |
| OBS bucket（testbot3-hermes-c13b-*） | 是 | 已删 | finally-delete-bucket 归零 |
| 沙箱会话（ws=8d898bc423） | 是 | 已关 | close-session 返回 ok |
| 只读子账号写残留 VPC（hdk-ro-probe） | 否 | — | ListVpcs 无残留（write-iam-denied=PolicyNotAuthorized） |
| ECS（只读查询，未创建） | 否 | — | — |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL（本次归零）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明）、`D4-24`（确认令牌精确 JSON 契约未实现）
- 本轮未覆盖（范围说明）：
  - D3-S6 FunctionGraph 全量 E2E（函数创建+触发器绑定）仅验证到 plan 分类（decision=allow+token），未实建函数（需预置 code bucket，为测试数据前置，非产品缺陷）
  - D3-S7 跨服务 RDS+Web 全量 E2E 仅验证到 serviceCatalog 复合路由（RDS+部署目标命中），未实建 RDS（成本控制，仅验确定性路由层）
- 建议：
  - D2-4 / D4-26 / D4-27 三项同根因（脱敏正则缺 `i`），建议合并修复；
  - D10-3 / D3-S5 两项同根因（routeMap 中文路由缺失），建议统一补中文意图路由表；
  - D4-17 已修复，建议将风险规则 fail-closed 修复纳入回归用例固化。