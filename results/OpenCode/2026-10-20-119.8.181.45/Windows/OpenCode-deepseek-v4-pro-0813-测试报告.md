# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-20 11:41:14（北京时间）
> **执行归档**：`results/OpenCode/2026-10-20-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.10-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `118 / 13 / 12 / 3 / 0` |
| 通过率（分母 = PASS+FAIL = 131） | `90.1%` |
| P0 / P1 / P2 新增缺陷 | `4 / 5 / 4` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `12` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补根因 | 待提单 |
| 3 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 4 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 6 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 9 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 11 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 12 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D2-1` | D2认证 | auth init三端同步 | 实测 2026-10-20 Windows: 源码级三端配置文件落位 PASS(auth_status/check_cli/setup_obs OK)，但真云 E2E 三端 API 可用性 BLOCKED(sandbox_check_user/obs_ls 返回 APIGW.0301 STS token 过期，非缺凭证)。解除条件=刷新 STS token 后复测真云 E2E 部分 |
| `D3-C1` | D3功能 | ECS生命周期E2E | 实测 2026-10-20 Windows: hcloud ECS CreateServers 调用返回错误(账号受限 Ecs.0067 余额不足或参数校验失败，非缺凭证)；ECS 生命周期 E2E 受阻。解除条件=账号充值恢复后复测 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | 实测 2026-10-20 Windows: hcloud OBS mb obs://dkt-test-opencode-20261020112726 返回 403 UserRestricted (账号受限，非缺凭证)；OBS 静态站全链路受阻。解除条件=账号解禁 OBS 操作 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 实测 2026-10-20 Windows: sandbox check_user 失败(APIGW.0301 STS token 过期，非缺凭证)；沙箱部署 E2E 受阻。解除条件=刷新 STS token 后复测 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 实测 2026-10-20 Windows: 沙箱 7 隐式工具冒烟依赖 sandbox API(STS token 过期，非缺凭证)。解除条件=刷新 STS token 后复测 |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 实测 2026-10-20 Windows: hcloud EIP CreatePublicip 返回 VPC.0502 op_restricted (账号受限，非缺凭证)；跨区域 EIP 创建受阻。解除条件=账号解冻后复测 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | 实测 2026-10-20 Windows: OBS 建桶/set/get/delete 全返回 APIGW.0301(STS token 过期，非缺凭证)。解除条件=刷新 STS token 后复测 |
| `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | 实测 2026-10-20 Windows: 路由层 PASS(serviceCatalog 命中 ECS)，但 run_readonly ListServersDetails 返回 APIGW.0301(STS token 过期，非缺凭证)。解除条件=刷新 STS token |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 实测 2026-10-20 Windows: 安全确认流 PASS(plan DeleteVpc 要求确认+hook 预检)，但 VPC 创建/删除返回 APIGW.0301(STS token 过期，非缺凭证)。解除条件=刷新 STS token |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 实测 2026-10-20 Windows: sandbox check_user 失败(APIGW.0301 STS token 过期，非缺凭证)；沙箱预览受阻。解除条件=刷新 STS token 后复测 |
| `D4-13` | D4安全 | 最小权限凭证通过率 | 实测 2026-10-20 Windows: 只读子账号凭证已配置，但主账号 STS token 过期(APIGW.0301)，无法验证只读凭证通过率。解除条件=刷新 STS token 后复测 |
| `D4-14` | D4安全 | 操作可审计性 | 实测 2026-10-20 Windows: VPC CreateVpc 返回 APIGW.0301(STS token 过期，非缺凭证)，操作可审计性 E2E 受阻。解除条件=刷新 STS token 后复测 |

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
