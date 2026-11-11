# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-12（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-12-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（10 FAIL + 2 SPEC-MISMATCH；12 项均为跨版本复现的历史缺陷，较 11-11 的 1.1.14-next.2 无新缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（testbot2 / 1.94.193.150，aarch64） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.14-next.2`（npm @next，gitHead `5c9478d3`，PR #1121） |
| 工具全集 | `46`（tools/list 实测） |
| hcloud / 依赖 | KooCLI 已配置（hcloud 7.2.12，default profile AKSK） |
| 真云凭证 | cn-north-4（AKSK，真机建删归零） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| 执行用例 | 设计级 107 + 展开级 39 = 146（D1-39 Windows 专属豁免） |

> **执行方法**：复用 11-11 已建立的 145 个真实探针脚本（.mjs），源码级直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 驱动 JSON-RPC；真云用例通过真机 hcloud 建删并归零验证；对 1.1.14-next.2 重新运行生成新鲜证据，统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 145（D1-39 Windows 专属，Linux 豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 133 / 10 / 0 / 2 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 91.7% |
| P0 / P1 / P2 缺陷 | 3 / 3 / 5 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本次创建资源全部归零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 95 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 2 | D9-9（capabilities 未声明 cancellation）+ D3-C14（template_id 下线，非产品缺陷） |
| NOT_RUN | 1 | D1-39 Windows 专属 |
| **合计** | **107** | |

### 3.2 展开级（本客户端+OS 预筛后）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 云主机意图 MISS |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（12 项历史缺陷跨版本复现）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData/DecryptDatakey 明文 secret 读取未拦截 | safety/policy.json:26 |
| 2 | P0 | D4-21 | hook_check_artifacts HCL AdministratorAccess/FullAccess 未拦截 | cloud-risk-rules.json:209 |
| 3 | P0 | D9-12 | 非法时序 tools/list（未 initialize）未拒绝 -32600 | mcp-protocol.mjs:61 |
| 4 | P1 | D4-17 | hook_check_command 命令包裹/替换形态放行 | tools.mjs:1324 |
| 5 | P1 | D9-9 | capabilities 未声明 notifications.cancellation（SPEC） | mcp-protocol.mjs:51 |
| 6 | P1 | EXP-E01 | serviceCatalog「云主机」意图 MISS 未命中 ECS | tools.mjs:2263 |
| 7 | P2 | D3-S5 | 复合意图(存储+托管)拆分命中=false | tools.mjs:2263 |
| 8 | P2 | D4-25 | 写操作遥测分类为 cli:invoke 非 cli:write | huaweicloud-safety.py:111 |
| 9 | P2 | D4-26 | findings.evidence secret_key/adminPass 明文残留 | risk-rule-engine.mjs:19 |
| 10 | P2 | D8-9 | sanitizeValue 不脱敏 AK/SK/token | telemetry.mjs:190 |
| 11 | P2 | D8-1 | 文档声明 43 tools vs 实际 46 | AGENTS.md:27 |
| 12 | — | D3-C14 | （非产品缺陷）template_id 透传下线，next.2 改用 pool_type | hdkitservice-api.mjs:182-185 |

> 详细根因、断言、证据见 `FINDINGS.md`。12 项经历史查重均命中上游 open issue（11-11 已查重，本轮版本未变结论一致），不重复提单（关联清单见 `HISTORY_LINKS.md`）。D3-C14 为 next.2 有意功能变更（PR #1109 移除 template_id、仅支持 pool_type），属用例契约漂移，需修订 test-cases 母版而非提缺陷单。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注 Linux 由 NR3 终端矩阵按负面/环境验证代表覆盖），Linux 侧不适用 |

> 本轮无 BLOCKED。

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
| ECS（D3-C1） | 是 | 已删 | 删除 job_id 提交成功；探针 30s 未等 ECS DELETED 致 SG/VPC 未自动删净，已手动补删归零 |
| RDS（D3-S7） | 是 | 已删 | RDS 删除归零=true；探针 DeleteVpc 因 DeleteSubnet 异步未完成致 VPC/子网残留，已手动补删归零 |
| VPC/子网/SG（D3-S6 附 RDS 复合） | 是 | 已删 | CreateSecurityGroup 带 vpc_id 失败致 VPC/子网残留，已手动补删归零 |
| VPC（D4-24） | 是 | 已删 | tctest-d424-probe-x 探针未自动删 VPC，已手动补删归零 |
| OBS bucket（D3-C2/C13） | 是 | 已删 | ls 无 tctest-c2/tctest-codeartsagent 前缀 |
| FunctionGraph（D3-S6） | 是 | 已删 | ListFunctions 无 hdk-s6 前缀，删除归零=true |

> 真云只删本次创建资源（tctest-c1*/hdk-s7*/hdk-s6*/tctest-c2*/tctest-codeartsagent*/tctest-d424-probe-x 等前缀）。全部真云用例实测建删并对云上 VPC/SG/子网/ECS/RDS/FG/OBS 全量盘点：ECS=0、RDS=0、FG=0、OBS 无本次桶、VPC/子网/SG 无测试前缀残留，残留数=0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities 未声明 `notifications.cancellation`（历史持续复现）；`D3-C14` template_id 透传下线（next.2 有意变更，建议维护 agent 修订 test-cases 母版 D3-C14 预期）。
- 核心安全缺口建议优先修复 P0：D4-3（KMS 明文解密漏拦截）、D4-21（HCL 宽泛 IAM）、D9-12（握手时序）。
- 探针侧时序缺陷（非产品缺陷，另行观察）：D3-C1/D3-S7 删除环节 DeleteVpc/DeleteSecurityGroup 在 ECS/子网异步删除未完成时调用导致失败，需加等待/重试；D3-S6 RDS 复合意图 CreateSecurityGroup 误带 vpc_id 参数失败；D4-24 探针建 VPC 未加自动清理逻辑。
