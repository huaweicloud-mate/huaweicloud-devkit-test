# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-31 05:19:27（北京时间）
> **执行归档**：`results/Hermes/2026-10-31-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（npm latest 正式版，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：真实执行——源码级探针直调 hdk 模块（`file://` import + 断言）落盘 `evidence/<case-id>/`；MCP 真机调用（`mcp-server.mjs` 路由层确定性调用）；真云 E2E 真机建删资源（ECS/VPC/OBS/EIP，最低配置创建→测后删除→归零验证）。非复读昨日结论。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 18 / 3 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 143） | `87.4%` |
| P0 / P1 / P2 新增缺陷 | `4 / 10 / 4` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（ECS/VPC/OBS/EIP 均删净验证，详见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `85` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
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
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | undici/lib/interceptor/decompress.js:78（createZstdDecompress 未定义） | 待提单 |
| 2 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | safety-policy.mjs:45 redactString (AK|SK) 大小写敏感 | 待提单 |
| 3 | P1 | `D3-C4` | D3功能 | 服务创建类回归 | tools.mjs list_operations(DMS/DEW) 无 command/result | 待提单 |
| 4 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | tools.mjs serviceCatalog routeMap 单意图未分解 | 待提单 |
| 5 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | tools.mjs CreateFunction 最小参数缺 code | 待提单 |
| 6 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | tools.mjs CreateInstance 缺 db.password | 待提单 |
| 7 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | safety-policy.mjs env-dump 未匹配裸 access_key | 待提单 |
| 8 | P1 | `D4-4` | D4安全 | 写操作审批门 | safety/policy.json:27 缺 Change 前缀 | 待提单 |
| 9 | P1 | `D4-6` | D4安全 | adminPass回显警告 | cloud-risk-rules.json stages 未覆盖 command | 待提单 |
| 10 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | risk-rule-engine.mjs 默认 fail-open(allow) | 待提单 |
| 11 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | cloud-risk-rules.json hwc-iam-admin-policy 仅匹配 JSON | 待提单 |
| 12 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | hooks/huaweicloud-safety.py WRITE_OPERATION_RE 前置捕获组 | 待提单 |
| 13 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | risk-rule-engine.mjs redactEvidence 不复匹配 JSON key | 待提单 |
| 14 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | mcp-protocol.mjs dispatch 无 initialize 前置校验 | 待提单 |
| 15 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | tools.mjs routeMap 缺「云主机」同义词 | 待提单 |
| 16 | P1 | `EXP-C4-14` |  |  | tools.mjs list_operations(DMS) 无路由 | 待提单 |
| 17 | P1 | `EXP-C4-18` |  |  | tools.mjs list_operations(DEW) 无路由 | 待提单 |
| 18 | P1 | `EXP-E01` |  |  | tools.mjs ECS keywords 缺「云主机」 | 待提单 |

### 根因详情

> 每个 FAIL / SPEC 的「现象 / 断言 / 根因（文件:行号）/ 证据」详见同目录 `FINDINGS.md`（21 项产品缺陷 + 3 项非产品缺陷）。根因均已定位到文件:行号：

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），Linux 侧由展开级 EXP-NR3-10（queryDistTags 返回对象无 EINVAL）代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE：沙箱功能正在升级优化)，connect 无法建立会话(外部依赖) |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，7 隐式工具 check_user/connect 均无法执行(外部依赖) |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 华为云沙箱服务维护中(HDKIT_SANDBOX_MAINTENANCE)，check_user 返回 realnameVerified=undefined(外部依赖) |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无新增。D2-4（脱敏缺口）/D4-2（env 打印拦截）/D4-26（findings 证据脱敏）为已知缺陷，见 FINDINGS`
- [x] 写操作误判 read-only：`无新增。D4-4（Change* 漏拦截）/D4-25（遥测分类 cli:invoke）为已知缺陷`
- [x] 红线（I 类）违规：`无（真云建删资源全部归零验证通过）`
- [x] 脱敏复核：`探针输出已 redact 处理，凭证未进 git 仓库；真云 AK/SK 仅本机 ~/.config/huaweicloud/ 与只读子账号独立文件，未提交`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | CreateServers | DeleteServers 含磁盘 | ✅ PASS 8/8，ECS 列表无本次资源 |
| VPC+子网（D3-C1/D4-14） | CreateVpc/CreateSubnet | DeleteVpc/DeleteSubnet | ✅ cleanOk=true，VPC 列表仅 1 个非本资源 |
| OBS 桶+静态网站（D3-C2） | 建桶+policy+website | rm -r -f 清对象 + rm 桶 -f | ✅ PASS 7/7，桶已删净 |
| EIP（D3-C7） | CreatePublicip | DeletePublicip 释放 | ✅ PASS 7/7，EIP 已释放 |
| 只读子账号（D4-13） | CreateVpc 被 IAM 拒 | — | ✅ residualZero=true，未创建任何 VPC |

> 独立复核：`hcloud ECS ListServersDetails`=1（非本资源）、`VPC ListVpcs/v3`=1（tctest-tmr-u1yrtd，非本资源），真云建删资源归零。

---

## 八、遗留与建议

- **D3-C1 归零验证今日复测 PASS**（8/8，异步删除已落地归零），昨日 FINDINGS 中「ECS 归零验证未等待异步删除完成」今日未复现——但仍建议产品侧在 DeleteServers/DeleteSubnet/DeleteVpc 后显式等待异步删除完成，避免时序偶发残留。
- **D2-4 / D4-26 脱敏缺口**（小写 ak=/sk= + JSON 带引号 key）为同一类「键名正则不匹配」根因，建议合并修复 `safety-policy.mjs` / `risk-rule-engine.mjs` 的 `isSecretKeyName` 与 `redactString`。
- **D4-4 / D4-25** 写操作动词（Change*）分类缺口建议在 `policy.json writeOperationPrefixes` 与 `huaweicloud-safety.py WRITE_OPERATION_RE` 一并补齐。
- **D3-C3/C6/S3 沙箱维护**：华为云沙箱（DevStation）服务侧维护中（HDKIT_SANDBOX_MAINTENANCE），非产品缺陷，解除条件=沙箱服务恢复后复测。
- **SPEC 契约漂移（D8-9/D9-9/D10-4）**：建议用例断言与实现契约同步更新（sanitize 敏感值脱敏、capabilities.cancellation 声明、规则库计数）。
