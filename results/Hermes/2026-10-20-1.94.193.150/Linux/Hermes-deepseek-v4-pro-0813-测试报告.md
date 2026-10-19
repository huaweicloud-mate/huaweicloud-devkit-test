# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-20 05:24`（北京时间）
> **执行归档**：`results/Hermes/2026-10-20-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（14 项产品缺陷/契约漂移，与昨日结论一致，含 4 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ECS ecs-hd-ai-work-00-0011） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11 |
| 被测版本（SUT） | `v1.1.9`（npm latest 正式版，gitHead `05a67b6`） |
| hcloud / 依赖 | hcloud 7.2.12（插件配对 7.3.12，doctor 提示 version_mismatch） |
| 真云凭证 | cn-north-4（AKSK 统一账号，`credentials.json` 预置） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107（含 OS 专属豁免计数）/ 展开级 43 / 追踪表 216 |

> **执行方法**：43 批探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn mcp-server 驱动协议 + 真云 E2E 建删资源；决策/结果落盘，证据统一 `evidence/<case-id>/`（非空 `stdout.txt` + `probe.mjs`）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 107 / 展开级 43 |
| 已执行 | 设计级 103（4 条 NOT_RUN 为文档比对类/OS 专属）/ 展开级 43 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 83 / 12 / 5 / 3 / 4 |
| PASS / FAIL（展开级） | 42 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 设计级 84.7%（83/98）；展开级 97.7%（42/43） |
| P0 / P1 / P2 缺陷 | 4 / 6 / 4（含 3 SPEC-MISMATCH） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（D3-C1 ECS 残留已人工二次删除归零，见 §七） |

---

## 三、状态汇总

### 3.1 设计级（107 行，含 OS 专属豁免 1）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 83 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | 不符预期，根因见缺陷清单（11 产品缺陷 + 1 真云 cleanup 时序） |
| BLOCKED | 5 | 环境阻塞（D2-10/D2-13/D4-12/D4-24/D9-6），见 §五 |
| SPEC-MISMATCH | 3 | 契约漂移（D8-9/D9-9/D10-4），待裁决 |
| NOT_RUN | 4 | D1-39（Windows 专属）+ D8-1/D8-4/D8-6（文档全量比对，改用例） |
| **合计** | **107** | |

### 3.2 展开级（43 行）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（`云主机` 未命中，与 D10-3 同根因） |
| BLOCKED / SPEC-MISMATCH / NOT_RUN | 0 / 0 / 0 | |
| **合计** | **43** | |

---

## 四、缺陷清单

> 全部 14 项产品缺陷 + 1 项真云 cleanup 时序（非产品缺陷）与昨日（2026-10-19）结论逐条一致，本轮 v1.1.9 逐一复现，无新修复、无新回归。详单见 `FINDINGS.md`（`file_issue.py` 解析输入）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截未覆盖 generic `access_key` | `env \| grep -i access_key` 应 `deny` | `safety-policy.mjs:515` | 复现 |
| 2 | P0 | D4-21 | hook_check_artifacts 未拦截 HCL 形态 broad IAM | HCL `actions=["*"]`/`AdministratorFullAccess` 应 deny | `cloud-risk-rules.json:196` | 复现 |
| 3 | P0 | D9-12 | initialize 握手安全基线两处缺口 | ③ init 触发 runVersionCheck；⑥ 未 init 先 tools/list 应 -32600 | `mcp-protocol.mjs:32-50,57` | 复现 |
| 4 | P1 | D4-6 | hook_check_command 对 `--admin-pass` 不告警 | 应 warn + 不裸回显密码 | `cloud-risk-rules.json:68` | 复现 |
| 5 | P1 | D4-17 | hook 模糊输入 fail-open（默认放行） | 无法解析输入应 deny（fail-closed） | `risk-rule-engine.mjs:106` | 复现 |
| 6 | P1 | D4-25 | Python hook 写操作遥测误分类 cli:invoke | 写操作应 `cli:write` | `huaweicloud-safety.py:46` | 复现 |
| 7 | P1 | D10-3 | serviceCatalog 中文意图「云主机」未命中（92.9%） | 「云主机」应命中 ECS（100%） | `tools.mjs:1999-2012` | 复现 |
| 8 | P1 | D3-S7 | 复合意图部署目标未命中 + RDS 最小实例创建前置缺 | 应命中 RDS+部署目标、可创建并归零 | `tools.mjs:1999` | 复现 |
| 9 | P2 | D4-26 | findings.evidence JSON 带引号 key 明文 secret_key/adminPass 泄漏 | evidence 中 secret 应 `<redacted>` | `risk-rule-engine.mjs:19` | 复现 |
| 10 | P2 | D3-S5 | 场景复合意图分层路由未分解（存储+托管无命中） | 复合意图应拆多个 service，非回退 --help | `tools.mjs:1999` | 复现 |
| 11 | P2 | D3-S6 | FunctionGraph CreateFunction 参数校验未过（未生成 URN） | 最小配置应返回 URN+触发器 | FunctionGraph CreateFunction 参数集 | 复现 |
| 12 | P1 | D9-9 | capabilities.cancellation 未声明（契约漂移） | 取消能力应按 capabilities 声明 | `mcp-protocol.mjs:47-49` | SPEC |
| 13 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token（契约漂移） | 敏感值应 `<redacted>` | `telemetry.mjs:189` | SPEC |
| 14 | P0 | D10-4 | 规则库 16→19 条（用例断言契约漂移） | 契约 16 条 vs 实现 19 条待裁决 | `cloud-risk-rules.json` | SPEC |
| 15 | 非产品 | D3-C1 | 真云 ECS 生命周期「无残留」归零未过（残留 1 台 ECS，人工二次删除归零） | E2E 无残留 | raw hcloud DeleteServers 异步时序 | 测试侧 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」） | Linux 侧由 EXP-NR3-10（disttags 探针）代表覆盖，无需改用例 |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对，本轮未覆盖 | 缩小为可机械判定的抽样比对，或标注需 docs 快照 |
| D8-4 | 设计级 | P2 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤 | 标注 getting-started 版本快照 + 可判定断言 |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对 | 标注双源路径 + 采样区间 |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） | — |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） | — |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 | — |
| D4-24 | 设计级 | P2 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟 | — |
| D9-6 | 设计级 | P2 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存环境（单机仅 Hermes） | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（全部探针断言 AK/SK/token 脱敏通过；仅 D4-26/D8-9 发现的脱敏缺口已记缺陷）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证 / 未脱敏日志（探针输出均经 redact 处理）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/subnet（D4-14/D3-C1/D3-S2） | 是 | 已删 | 归零（ListVpcs 不含本次资源） |
| ECS（D3-C1） | 是 | 首删未确认→**人工二次删除** | 归零（servers=0、volumes=0） |
| OBS（D3-C2/D3-C13） | 是 | 已删 | 归零（Delete bucket successfully） |
| EIP（D3-C7） | 是 | 已删 | 归零（ListEips 无本次 id） |
| 沙箱会话（D3-C3/C6/S3） | 是 | close_session | 归零 |

> 真云只删本次创建资源（`tctest-`/`testbot3-hermes-` 唯一时间戳名 + 白名单反删）；D3-C1 ECS 首删未确认残留，已人工二次 `DeleteServers` 归零，残留为 0。

---

## 八、遗留与建议

- **待裁决 SPEC**：`D8-9`、`D9-9`、`D10-4`（规则库 19 条，用例契约需维护者确认并修订计数）。
- **本轮未覆盖**：多客户端终端矩阵（D9-6，单机仅 Hermes）、审批流实时对话框边界（D4-24）、npm 供应链安装期抓包（D4-12）、中英双源文档全量比对（D8-1/4/6）。
- **真云 cleanup 时序**：D3-C1 ECS 删除建议探针在删除前等 ECS 进入稳定 ACTIVE + 延长轮询/加删除重试，避免「刚创建即删」时序残留。
- **建议**：14 项产品缺陷集中为既有 open issue 集合，本轮逐一复现，建议追查修复进展；D3-C1 cleanup 时序属测试侧改进，不计入产品缺陷。