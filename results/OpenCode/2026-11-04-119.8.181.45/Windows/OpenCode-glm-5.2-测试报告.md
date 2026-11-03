# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-11-04 05:34:54（北京时间）
> **执行归档**：`results/OpenCode/2026-11-04-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.3`（gitHead: 7ad8a533） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（risk-rule-engine/mcp-protocol/tools.mjs/auth/credentials.mjs）+ MCP 工具真机调用（plan_cli_command/hook_check_command/run_readonly_command/auth_init/show_profile_redacted/list_operations/voucher_status/explain_error/check_update/retrieve_skill）+ eval harness（d9-6-cross-client.mjs）+ 只读子账号(test001)真云只读验证

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 2 / 9 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 137） | `98.5%` |
| P0 / P1 / P2 新增缺陷 | `2 / 0 / 0` |
| 红线（I 类）违规 | 无（凭证未泄漏、写操作未误判 read-only、PASS 门禁通过、覆盖率门禁通过） |
| 资源释放 | 只读操作未创建资源；BLOCKED 用例未建资源（凭证占位/沙箱维护）；零残留 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `9` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | `plugins/huaweicloud-core/src/update-check.mjs:86` parseDistTagsOutput 拒绝 Array.isArray(parsed) → 返回 null。npm 12.1.0 `npm view ... dist-tags --json` 返回数组 `[{latest,next}]`（npm 单包结果包数组）→ queryDistTagsSync 返回 null → getCachedUpdateInfo 得 null distTags → judgeUpdate(current,null) → result=check_failed。升级检测静默失败。 | 待提单 |
| 2 | P0 | `D1-40` | D1安装 | 镜像 lag 下检测正确性(反向提醒防护) | 同 D1-39 根因：queryDistTagsSync 在默认 registry 和官方 registry 下均返回 null（parseDistTagsOutput 拒绝数组）→ judgeUpdate 无法比较版本 → 镜像 lag / 版本倒退检测不可能。`update-check.mjs:86` | 待提单 |

### 根因详情

**D1-39 / D1-40（同一根因）**：
- **期望**：queryDistTagsSync 返回 `{latest, next}` 真实 dist-tags；judgeUpdate 比较版本判断是否升级；镜像 lag 时不得提示版本倒退。
- **实际**：npm 12.1.0 `npm view huaweicloud-devkit dist-tags --json` 返回 `[{latest:"1.1.12", next:"1.1.13-next.3"}]`（数组）。parseDistTagsOutput (update-check.mjs:86) `if (Array.isArray(parsed)) return null` → 返回 null。queryDistTagsSync → null。MCP huaweicloud_check_update 返回 `{latestStable:null, latestNext:null, result:"check_failed"}`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:86` — `if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;` 拒绝数组形式。
- **修复建议**：parseDistTagsOutput 接受数组：`if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] && typeof parsed[0] === 'object') parsed = parsed[0];`
- **证据**：evidence/D1-39/stdout.log + evidence/D1-40/stdout.log

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 【补环境】本机 credentials.json 为占位凭证(test_ak/test_sk)，无法执行 ECS CreateServers/DeleteServers 真机创建删除；只读子账号(test001)仅有只读权限，IAM 拒绝写操作。解除条件：配置真实管理员 AK/SK 到 credentials.json |
| `D3-C2` | D3功能 | OBS静态站部署E2E | 【补环境】本机 credentials.json 为占位凭证；obsutilconfig 同步的也是占位值；无法执行 OBS bucket 创建/上传/删除真机操作。解除条件：配置真实 AK/SK |
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE「沙箱功能正在升级优化，暂时无法使用」。解除条件：沙箱服务升级完成恢复可用 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 【补环境】huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE；沙箱工具链无法执行。解除条件：沙箱服务升级完成 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | 【补环境】本机 credentials.json 为占位凭证；obs_set_website_config 工具注册已验证(D3-C5工具冒烟)，但无法真机对一个真实 bucket 执行 get/set/delete。解除条件：配置真实 AK/SK |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 【补环境】huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE。解除条件：沙箱服务升级完成 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 【补环境】本机 credentials.json 为占位凭证；plan_cli_command + hook_check_command 预检部分已验证(D4-18/D4-19)，但无法真机执行 DeleteVpc 删除资源。解除条件：配置真实管理员 AK/SK |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE。解除条件：沙箱服务升级完成 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】本机 credentials.json 为占位凭证；无法建 RDS 实例；沙箱也在维护。解除条件：配置真实管理员 AK/SK 且沙箱恢复 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（D2-4 show_profile_redacted AK/SK/token 全 `<redacted>`；D9-13 tools/call 返回无 AK/SK/token 明文；D4-1/D4-2 凭证文件/env 打印拦截 deny）
- [x] 写操作误判 read-only：无（D4-5 plan_cli_command 对 CreateServers/DeleteServers 均判 deny/write；D4-18 写操作需 approvalToken 确认）
- [x] 红线（I 类）违规：无（PASS 门禁 + 覆盖率门禁均通过；真云用例未 mock）
- [x] 脱敏复核：通过（D2-4/D4-27 双路径脱敏；redactEvidence + safety-policy redact 均生效）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（只读） | 未创建 | N/A | ListServersDetails 返回 2 已有实例，未创建/删除 |
| 沙箱 | 未创建 | N/A | sandbox 维护中，未连接 |
| OBS/RDS/VPC | 未创建 | N/A | credentials.json 占位，写操作 BLOCKED |

> 本次测试仅只读操作（test001 子账号），未创建任何云资源；BLOCKED 用例因凭证占位/沙箱维护未执行建删，零残留。

---

## 八、遗留与建议

- **D1-39/D1-40 缺陷（P0）**：parseDistTagsOutput 拒绝 npm 12 数组输出，升级检测静默失败。建议修复：接受数组形式 `parsed[0]`。已记入 FINDINGS.md 待提单。
- **BLOCKED 用例（9 条）**：8 条因 credentials.json 占位凭证（test_ak/test_sk）无法真机建删资源；5 条因沙箱服务维护（HDKIT_SANDBOX_MAINTENANCE）。解除条件：配置真实管理员 AK/SK + 沙箱恢复。
- **环境问题**：本机 credentials.json 为占位凭证（test_ak_20char123456 / test_sk_30char...），auth_status 报 configured 但实际非真实凭证；只读子账号(test001)凭证真实可用。建议维护者检查 credentials.json 是否被误覆盖为测试值。
