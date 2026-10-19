# OfficeAce-glm-5.2 每日测试报告
> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-10-19 11:06:42（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-19-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `TODO: 待填（npm 包版本 + gitHead）` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `123 / 13 / 10 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 136） | `90.4%` |
| P0 / P1 / P2 新增缺陷 | `1 / 12 / 0` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `10` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 4 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 5 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 6 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 7 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 8 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 10 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 11 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 需创建/删除ECS实例，主账号AK/SK已过期(APIGW.0301 Unauthorized)。只读子账号可用但无写权限。凭证文件存在(~/.config/huaweicloud/credentials.json)但主账号AK(test_a...3456)认证失败。解除条件: 刷新主账号AK/SK。 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | 需创建/上传/删除OBS资源，主账号AK/SK已过期(APIGW.0301)。只读子账号可用但无写权限。凭证文件存在(~/.config/huaweicloud/credentials.json)但主账号AK(test_a...3456)认证失败。解除条件: 刷新主账号AK/SK。 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 需沙箱connect+upload+deploy+验证+close全链路。沙箱连接需hdkitservice API凭证(非普通AK/SK)，且主账号AK/SK已过期(APIGW.0301)。沙箱check_user/sign_agreement/connect需有效hdkit凭证。解除条件: 刷新hdkit服务凭证或主账号AK/SK。 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 需逐工具最小调用: check_user→credentials→sign_agreement→upload→exec→deploy_check→close。沙箱连接需hdkitservice API凭证(非普通AK/SK)，且主账号AK/SK已过期(APIGW.0301)。沙箱check_user/sign_agreement/connect需有效hdkit凭证。解除条件: 刷新hdkit服务凭证或主账号AK/SK。 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | OBS写操作需主账号凭证，已过期(APIGW.0301)。只读子账号OBS查询也失败。 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 需创建/删除VPC，主账号AK/SK已过期(APIGW.0301)。只读子账号可用但无写权限。凭证文件存在(~/.config/huaweicloud/credentials.json)但主账号AK(test_a...3456)认证失败。解除条件: 刷新主账号AK/SK。 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 需沙箱connect+upload_project+deploy_nginx+deploy_check+close。沙箱连接需hdkitservice API凭证(非普通AK/SK)，且主账号AK/SK已过期(APIGW.0301)。沙箱check_user/sign_agreement/connect需有效hdkit凭证。解除条件: 刷新hdkit服务凭证或主账号AK/SK。 |
| `D3-S4` | D3功能 | 场景-领券闭环 | 真云管理员AK/SK已过期(APIGW.0301)，只读子账号无voucher权限。凭证文件存在但主账号AK(test_a...3456)认证失败。解除条件: 刷新主账号AK/SK或获取新STS凭证。 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | 需创建FunctionGraph函数，主账号AK/SK已过期(APIGW.0301)。只读子账号可用但无写权限。凭证文件存在(~/.config/huaweicloud/credentials.json)但主账号AK(test_a...3456)认证失败。解除条件: 刷新主账号AK/SK。 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 需创建RDS+沙箱部署，主账号AK/SK已过期(APIGW.0301)。只读子账号可用但无写权限。凭证文件存在(~/.config/huaweicloud/credentials.json)但主账号AK(test_a...3456)认证失败。解除条件: 刷新主账号AK/SK。 |

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
