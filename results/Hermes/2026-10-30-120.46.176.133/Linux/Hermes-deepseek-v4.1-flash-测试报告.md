# Hermes-deepseek-v4.1-flash 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-30 05:17:11（北京时间）
> **执行归档**：`results/Hermes/2026-10-30-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `TODO: 待填（npm 包版本 + gitHead）` |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 4 / 3 / 2` |
| 通过率（分母 = PASS+FAIL = 141） | `93.6%` |
| P0 / P1 / P2 新增缺陷 | `2 / 4 / 3` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `2` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | TODO: 待补根因 | 待提单 |
| 3 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D4-4` | D4安全 | 写操作审批门 | TODO: 待补根因 | 待提单 |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 6 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 7 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | TODO: 待补原因 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补原因 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 2026-10-30 05:04 实测：沙箱接口直报 HDKIT_SANDBOX_MAINTENANCE『沙箱功能正在升级优化，暂时无法使用』，huaweicloud_sandbox_connect 无法建立 workspace（ws=""，上层工具报 workspace_id is required. No sandbox connected）。缺：可用的华为云沙箱服务；影响：D3-C3 沙箱部署链路（connect/upload_project/deploy_nginx/deploy_check/清理）5 个断言全部无法执行；解除条件：沙箱维护结束、HDKIT_SANDBOX_MAINTENANCE 消失且 sandbox_connect 能返回 workspace_id。 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 2026-10-30 05:04 实测：check_user 直报 HDKIT_SANDBOX_MAINTENANCE『沙箱功能正在升级优化，暂时无法使用』(trace 41315c0a)，connect 无 workspace。缺：可用的华为云沙箱服务；影响：D3-C6 沙箱凭证/一次性执行/清理 5 个断言全部无法执行；解除条件：沙箱维护结束、check_user 返回 realnameVerified 并可 connect。 |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 2026-10-30 05:04 实测：跨区断言被凭证作用域阻塞——hcloud ECS/VPC 调用 ap-southeast-3 返回 Common.0013『the current region is [ap-southeast-3] and does not match with the project name [cn-north-4] in tk.』与 VPC.0501，凭证 token 仅绑定 cn-north-4 project，无法验证跨区资源不存在错误码(Ecs.0200)与跨区建 EIP 路径。缺：绑定 ap-southeast-3 project 的 AK/SK（或可透传 region 的 IAM token）；影响：5 条断言中 2 条（不存在资源精确错误码、跨区创建 EIP）无法执行，其余 3 条（--cli-region 规划、region 可用性查询、跨区只读调用）已实测通过；解除条件：提供 ap-southeast-3 作用域凭证后重跑该用例。 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 2026-10-30 05:05 实测：探针 probe_d3s3.mjs 调用沙箱接口直报 HDKIT_SANDBOX_MAINTENANCE『沙箱功能正在升级优化，暂时无法使用』(trace ea52ea8)。缺：可用的华为云沙箱服务；影响：D3-S3 沙箱场景用例无法执行；解除条件：沙箱维护结束且 check_user/connect 恢复正常。 |

---

## 六、安全与红线合规

- [ ] 凭证泄漏事件：`TODO: 待填`
- [ ] 写操作误判 read-only：`TODO: 待填`
- [ ] 红线（I 类）违规：`TODO: 待填`
- [ ] 脱敏复核：`TODO: 待填`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| TODO | TODO | TODO | TODO |

> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。

---

## 八、遗留与建议

- TODO: 待裁决 SPEC / 未覆盖项 / 修复建议由 agent 补充。
