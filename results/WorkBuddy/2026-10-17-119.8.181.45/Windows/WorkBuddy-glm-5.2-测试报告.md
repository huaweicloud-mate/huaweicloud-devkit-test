# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-17 05:21:38（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-17-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.9-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `115 / 27 / 4 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 142） | `81.0%` |
| P0 / P1 / P2 新增缺陷 | `3 / 14 / 10` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `76` | 有证据且通过 PASS 门禁 |
| FAIL | `27` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P2 | `D1-33` | D1安装 | skip 文件持久化与多路径 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D2-10` | D2认证 | R7 current档跟随 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D2-1` | D2认证 | auth init三端同步 | TODO: 待补根因 | 待提单 |
| 5 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 6 | P2 | `D2-27` | D2认证 | KooCLI 版本管理 | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D3-A1` | D3功能 | skill检索完整性 | TODO: 待补根因 | 待提单 |
| 8 | P2 | `D3-B1` | D3功能 | list_operations规范名 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `D3-B3` | D3功能 | run_readonly脱敏执行 | TODO: 待补根因 | 待提单 |
| 10 | P1 | `D3-C4` | D3功能 | 服务创建类回归 | TODO: 待补根因 | 待提单 |
| 11 | P1 | `D3-C5` | D3功能 | 工具冒烟 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | TODO: 待补根因 | 待提单 |
| 13 | P1 | `D3-C13` | D3功能 | OBS 静态网站托管配置 | TODO: 待补根因 | 待提单 |
| 14 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 15 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 16 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 17 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | TODO: 待补根因 | 待提单 |
| 18 | P1 | `D4-11` | D4安全 | 提示注入防护 | TODO: 待补根因 | 待提单 |
| 19 | P1 | `D4-13` | D4安全 | 最小权限凭证通过率 | TODO: 待补根因 | 待提单 |
| 20 | P2 | `D4-14` | D4安全 | 操作可审计性 | TODO: 待补根因 | 待提单 |
| 21 | P1 | `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | TODO: 待补根因 | 待提单 |
| 22 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 23 | P1 | `D5-3` | D5客户端 | 工具全量枚举 | TODO: 待补根因 | 待提单 |
| 24 | P2 | `D6-1` | D6性能 | 检索响应延迟 | TODO: 待补根因 | 待提单 |
| 25 | P2 | `D8-1` | D8质量 | 文档与能力一致 | TODO: 待补根因 | 待提单 |
| 26 | P1 | `D8-4` | D8质量 | 引导步骤可机械执行 | TODO: 待补根因 | 待提单 |
| 27 | P2 | `D8-6` | D8质量 | 中英文文档一致 | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | Real cloud VPC creation blocked by quota: VPC.0114 Quota exceeded for resources [router]. Direct hcloud VPC CreateVpc returns "VPC数目已达到最大配额". callTool path returns APIGW.0301 IAM auth error. 归零 verification passed (no resources created). Blocked condition: VPC quota full in cn-north-4, need existing test VPCs cleaned or quota increased. |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox workspace required. huaweicloud_sandbox_connect returns "workspace_id is required. No sandbox connected". This client has no CloudIDE/workspace sandbox provisioned. 归零 verification passed (no resources created). Blocked condition: need sandbox workspace_id or HW_WORKSPACE_ID env var set. |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | Sandbox workspace required. huaweicloud_sandbox_connect returns "workspace_id is required. No sandbox connected". This client has no CloudIDE/workspace sandbox provisioned. 归零 verification passed (no resources created). Blocked condition: need sandbox workspace_id or HW_WORKSPACE_ID env var set. |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit service requires upstream DevStation connection |

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
