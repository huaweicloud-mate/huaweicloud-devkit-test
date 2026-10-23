# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：`2026-10-24 05:40:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-24-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.12（npm latest，gitHead `4ed07801`）
> **结论**：`FAIL`（13 项产品缺陷，均为历史延续并 fresh 复现；无新增缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.12（npm latest，gitHead `4ed07801`） |
| 工具全集 | 46（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已登录（default profile，region cn-north-4） |
| 真云凭证 | cn-north-4（AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / harness / 真云 E2E |
| daily 基础用例 | 设计级 107（P0×21 / P1×56 / P2×30）+ 展开级 39 + 追踪表 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 建删归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 145（设计级 106 + 展开级 39；1 条 OS 专属豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 127 / 14 / 1 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 88.2%（127 / 144） |
| 产品缺陷（合单） | 13（P0×4 / P1×4 / P2×5），全部历史延续 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（ECS/VPC/子网/EIP/OBS 桶/FG 函数 均已删并复核） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 89 | 有证据且通过 PASS 门禁 |
| FAIL | 13 | 不符预期，根因见缺陷清单 |
| BLOCKED | 1 | D3-S7 RDS 真云外部依赖（vpc/subnet/sg 前置 + db 参数） |
| SPEC-MISMATCH | 3 | D1-65 / D1-68 / D9-9 契约漂移，待裁决 |
| NOT_RUN | 1 | D1-39 Windows OS 专属，Linux 结构性不适用（由 D1-40 覆盖） |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01「云主机」路由 MISS |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（详见 FINDINGS.md）

> 13 项产品缺陷全部为历史延续（SUT 版本与昨日完全相同，gitHead 4ed07801），今日逐条 fresh 复现。根因均在 FINDINGS.md 标注 `文件:行号`。缺陷单已在上游历史 issue 中（见 HISTORY_LINKS.md），不重复开单。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P1 | D3-C3/D3-S3 | 沙箱 deploy_nginx 写验证误判（DB_NGINX_T=PASS 被 OSC-133 前缀遮挡） | session-manager.mjs:1010 |
| 2 | P0 | D4-3 | kms DecryptData/DecryptDatakey 明文 secret 未拦截 | safety/policy.json:26 |
| 3 | P0 | D4-15 | ANSI-C 引号命令替换绕过写操作规则 | risk-rule-engine.mjs |
| 4 | P0 | D4-21 | HCL/Terraform 广泛 IAM 未拦截 | risk-rule-engine.mjs |
| 5 | P0 | D9-12 | initialize 握手时序未强制 | mcp-protocol.mjs:57 |
| 6 | P1 | D4-17 | hook 模糊 fail-closed 缺口（$() 内层放行） | risk-rule-engine.mjs |
| 7 | P1 | D4-27 | 双路径输出脱敏缺口（--key value 空格形态） | safety-policy.mjs:34 |
| 8 | P1 | EXP-E01 | 评测集「云主机」中文意图路由 MISS | tools.mjs |
| 9 | P2 | D3-S5 | 复合意图分层路由 MISS | tools.mjs serviceCatalog |
| 10 | P2 | D4-25 | Python hook 写→cli:invoke 分类失真 | huaweicloud-safety.py:46 |
| 11 | P2 | D4-26 | findings 证据脱敏不完整（secret_key/adminPass 残留） | risk-rule-engine.mjs:19 |
| 12 | P2 | D8-1 | 文档与能力漂移（39/43 vs 46 工具） | AGENTS.md |
| 13 | P2 | D8-9 | sanitizeValue 未脱敏 | telemetry.mjs:189 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows OS 专属（升级检测链 EINVAL 语义专属），本机 Linux 结构性不适用（OS 列标注「Windows 专属」）；Linux 由 D1-40 + 展开级 EXP-NR3 覆盖 | 无（OS 归属正确，Linux 侧已有代表覆盖） |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 跨服务交付(Web+RDS)：复合意图命中 RDS 但 CreateInstance 需 vpc/subnet/sg 前置编排 + 正确 db 参数（--password 与 KooCLI 系统参数冲突需 --cli-jsonInput），provisioning 3~8min + 按需计费。实测返回 `[USE_ERROR]Invalid parameter: db.password` | 补 vpc/subnet/sg 前置 + RDS 配额 + db 参数脚本化 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有探针输出经 redact 处理）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：真云探针输出含 AK/SK/password 的均 `<redacted>` 处理

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（c6.large.2，ACTIVE） | 已删 | ECS 0、EIP total_count=0、VPC 已删 |
| VPC/子网（D3-C1） | 是 | 已删（手工二次 DeleteVpc 确认 RouterNotFound） | ListVpcs 不含本次 tctest-openclaw-c1-* |
| VPC（D3-S2 / D4-14） | 是 | 已删 | 归零 true |
| OBS 桶（D3-C2 / D3-C13） | 是 | 已删（先删对象后删桶） | rmOk=true |
| FunctionGraph 函数+触发器（D3-S6） | 是（TIMER ACTIVE） | 已删 | DeleteFunction 归零 true |
| 沙箱残留 nginx .conf（D3-C3 前置清理） | — | 已手动 rm + nginx reload | 8080-8089 全部释放（历史 #951 残留） |

> 真云只删本次创建资源；`testbot3-hermes-*` 等其他客户端资源未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：D1-65（telemetry DEBUG '1'）、D1-68（region 优先级）、D9-9（取消能力未声明）
- 历史延续缺陷（13 项）：已在上游历史 issue 中，不重复提单；详见 HISTORY_LINKS.md
- 建议：沙箱 deploy_nginx 残留 .conf 长期未清理（#951）+ verify 未 strip 转义（#981）两处叠加，建议优先修复 #981（一行 stripTerminalEscapes），次优 #951（deploy 后清理自身 .conf 或端口池扩容）。