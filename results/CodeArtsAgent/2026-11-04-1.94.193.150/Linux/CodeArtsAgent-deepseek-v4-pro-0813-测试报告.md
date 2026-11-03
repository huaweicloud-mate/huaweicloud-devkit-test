# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-04 05:40（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-04-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（10 FAIL + 1 SPEC-MISMATCH，均历史缺陷未修复）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（testbot2 / 1.94.193.150） |
| Node / npm / Python | Node v22.13.0 / npm 11.19.0 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.13-next.3`（npm @next，gitHead `7ad8a533`） |
| 工具全集 | `46`（tools/list 实测） |
| hcloud / 依赖 | KooCLI 已配置（hcloud 7.x，default profile AKSK） |
| 真云凭证 | cn-north-4（AKSK，真机建删归零） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| 执行用例 | 设计级 107 + 展开级 39 = 146 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 驱动 JSON-RPC；真云用例通过 `plan_cli_command`+`run_approved_command` 真机建删并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 145（D1-39 Windows 专属，Linux 豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 131 / 10 / 3 / 1 / 1 |
| 通过率（PASS/(PASS+FAIL+SPEC)，不含 BLOCKED/NOT_RUN） | 92.3% |
| P0 / P1 / P2 缺陷 | 3 / 3 / 5 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本次创建资源全部归零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 93 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 沙箱服务维护（D3-C3/D3-C6/D3-S3） |
| SPEC-MISMATCH | 1 | D9-9 capabilities 未声明 cancellation |
| NOT_RUN | 1 | D1-39 Windows 专属 |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 云主机意图 MISS |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（11 项，均历史缺陷未修复）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData/DecryptDatakey 明文 secret API 未拦截 | safety/policy.json:26 |
| 2 | P0 | D4-21 | hook_check_artifacts HCL AdministratorAccess/FullAccess 未拦截 | cloud-risk-rules.json:209 |
| 3 | P0 | D9-12 | 非法时序 tools/list(未 initialize) 未拒绝 -32600 | mcp-protocol.mjs:61 |
| 4 | P1 | D4-17 | hook_check_command 命令包裹/替换形态放行 | tools.mjs:1324 |
| 5 | P1 | D9-9 | capabilities 未声明 notifications.cancellation(SPEC) | mcp-protocol.mjs:51 |
| 6 | P1 | EXP-E01 | serviceCatalog「云主机」意图 MISS 未命中 ECS | tools.mjs:2263 |
| 7 | P2 | D3-S5 | 复合意图(存储+托管)拆分命中=false | tools.mjs:2263 |
| 8 | P2 | D4-25 | 写操作遥测分类为 cli:invoke 而非 cli:write | huaweicloud-safety.py:111 |
| 9 | P2 | D4-26 | findings.evidence secret_key/adminPass 明文残留 | risk-rule-engine.mjs:19 |
| 10 | P2 | D8-9 | sanitizeValue 不脱敏 AK/SK/token | telemetry.mjs:190 |
| 11 | P2 | D8-1 | 文档声明 43 tools vs 实际 46 | AGENTS.md:27 |

> 详细根因、断言、证据见 `FINDINGS.md`。全部 11 项经历史查重均命中上游 open issue，不重复提单（关联清单见 `HISTORY_LINKS.md`）。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注 Linux 由 NR3 终端矩阵代表覆盖） |
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护 HDKIT_SANDBOX_MAINTENANCE，删除依赖沙箱会话 |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 7 隐式工具均返回 HDKIT_SANDBOX_MAINTENANCE |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱预览出 URL 依赖沙箱会话，sandbox_check_user 维护中 |

> 沙箱 3 项均为真·外部依赖（华为云沙箱服务 HDKIT_SANDBOX_MAINTENANCE 升级优化中），非测试侧假阻塞，已在探针内真机实测确认。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无明文 AK/SK，探针内 redact 处理）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：真机探针输出经 redact，无原始凭证泄漏

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是 | 已删（手动补删） | ECS count=0 |
| RDS（D3-S7，2 实例） | 是 | 已删 | ListInstances 无 hdk-s7 |
| VPC/子网/安全组 | 是 | 已删 | ListVpcs/Subnets/SG 无本次前缀 |
| OBS bucket | 是 | 已删 | ls 无 tctest 前缀 |
| EIP（D3-C7） | 是 | 已释放 | 归零验证通过 |

> 真云只删本次创建资源（hdk-s7*/tctest-c1*/tctest-c2* 等前缀）。删除前全量盘点。残留 0 项。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities 未声明 `notifications.cancellation`（实测标注 SPEC-MISMATCH）。
- 历史环境残留（非本次创建）：云端存在 2026-10-29 他次测试遗留的 `tctest-tmr-u1yrtd`（ECS ACTIVE + VPC + 子网），非本次 daily 创建，未擅自删除，建议维护者清理。
- 本轮 11 项缺陷均为历史问题（跨版本持续复现），核心安全缺口建议优先修复 P0：D4-3（KMS 明文解密漏拦截）、D4-21（HCL 宽泛 IAM）、D9-12（握手时序）。
