# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-02 05:30:44（北京时间）
> **执行归档**：`results/Hermes/2026-11-02-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.12`（npm `latest` 正式版，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：源码级探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数并落 `stdout.log`；MCP 协议层 spawn `mcp-server.mjs` 真实握手；CLI（install/doctor/status/auth）真机执行；真云 E2E（ECS 生命周期 / OBS 静态站 / EIP 跨区域 / VPC 建删 / 只读子账号最小权限 / D10 eval-harness）真机建删资源并归零验证。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `123 / 18 / 5 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `87.2%` |
| P0 / P1 / P2 新增缺陷 | `4 / 10 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次建删资源已归零（OBS 桶 / EIP 均删净）；共享账号存在历史泄漏（3 ACTIVE ECS + 10 VPC，非本次创建，见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补根因 | 待提单 |
| 2 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D3-C4` | D3功能 | 服务创建类回归 | TODO: 待补根因 | 待提单 |
| 4 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 5 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 7 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D4-4` | D4安全 | 写操作审批门 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 10 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 11 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 12 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 13 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 14 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 15 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 16 | P1 | `EXP-C4-14` |  |  | TODO: 待补根因 | 待提单 |
| 17 | P1 | `EXP-C4-18` |  |  | TODO: 待补根因 | 待提单 |
| 18 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | TODO: 待补原因 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 真云 ECS E2E 无法执行：共享账号 VPC 路由配额已耗尽(OverQuota: router)，CreateVpc 返回 VPC.0105/路由配额超限，CreateSubnet/CreateServers 均无法落地——根因=历史+并发 E2E 泄漏(opencode-e2e/testbot3-hermes-e2e/tctest-tmr 等 10 VPC + 3 ACTIVE ECS 未归零)占满配额，非本次创建资源；解除=清理泄漏释放配额后复测 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE：沙箱功能正在升级优化)，connect 无法建立会话(外部依赖) |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，7 隐式工具 check_user/connect 均无法执行(外部依赖) |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，check_user 返回 realnameVerified=undefined(外部依赖) |
| `D4-14` | D4安全 | 操作可审计性 | 真云 VPC 建删归零用例无法执行：共享账号 VPC 路由配额耗尽(OverQuota: router)，CreateVpc 返回 NeutronError OverQuota('router')，无法创建 VPC 执行建→查CTS→删→归零；根因=历史+并发 E2E 泄漏占满配额；解除=清理泄漏释放配额后复测 |

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
