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

> **执行方法**：源码级直调（safety-policy/risk-rule-engine/update-check/mcp-protocol 等导出函数）+ MCP callTool 真机调用 + 真云 E2E（OBS 建桶/删桶归零、VPC ListVpcs 只读、plan/run_approved 审批流）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `115 / 27 / 4 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 142） | `81.0%` |
| P0 / P1 / P2 新增缺陷 | `3 / 14 / 10` |
| 红线（I 类）违规 | `0`（所有红线用例真实执行，未虚报） |
| 资源释放 | `OBS 桶 1 个（已删归零）；VPC 0 个（配额阻塞）；ECS 0 个（配额阻塞）；沙箱 0 个（未连接）` |

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

**P0 缺陷根因**：

1. **D2-4** (`safety-policy.mjs:45`): 正则 `/(AK|SK)\s*[:=]\s*(value)/g` 缺少 `i` 标志，仅匹配大写 `AK=`/`SK=`，不匹配小写 `ak=`/`sk=`。hcloud CLI 使用 `--ak=`/`--sk=`（小写），导致明文凭证泄露。

2. **D4-2** (`risk-rule-engine.mjs` + `safety-policy.mjs`): env-dump 规则未覆盖 Windows 风格环境变量访问（`%VAR%`）、`set <VAR>` 命令、以及 `grep -i (ak|sk|key|token)` 模式。`printenv | grep -i ak`、`set HW_ACCESS_KEY`、`echo %HW_ACCESS_KEY%` 均未被拦截。

3. **D4-3** (`risk-rule-engine.mjs` + `safety-policy.mjs`): `hwc-command-secret-value-read` 规则未覆盖 KMS DecryptData、CSMS ListSecrets、ECS ShowServerPassword 等敏感读取操作。classifyHcloudArgs 仅对 Write 操作判 deny，未分类 sensitive-read。

**P1/P2 缺陷根因**：见各 `evidence/<case-id>/stdout.log` 的 `why` 和 `result.rootCause` 字段。

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

- [x] 凭证泄漏事件：`D2-4` 发现小写 `ak=`/`sk=` 脱敏缺失（P0 缺陷，safety-policy.mjs:45 正则缺少 i 标志）
- [x] 写操作误判 read-only：`D4-5` PASS — 所有写操作（DeleteServer/CreateServer/UpdateServer 等）均被正确分类为 write/deny
- [x] 红线（I 类）违规：`0` — 所有红线用例（D2-4 小写 ak= 脱敏 / D4-3 KMS DecryptData 拦截 / D4-2 env·bash 穿透 / D4-16 命令包裹穿透）均真实构造攻击输入执行，D4-16 PASS（bash -c/cmd /c/sudo/powershell 包裹均被拦截），D2-4/D4-2/D4-3 发现真实缺陷标 FAIL
- [x] 脱敏复核：对象级脱敏（isSecretKeyName）正常；字符串级脱敏在 lowercase ak= 场景失败（D2-4）

**红线用例执行说明（0 缺陷全 PASS 时的复核材料）**：
- **D2-4**：真实构造 `hcloud configure set --ak=HPUAN1ROXXXXXXXX --sk=SK1234567890abcdefghijklmnop`，调用 `redactSecrets(cmd)`，输出保留明文 → FAIL（根因 safety-policy.mjs:45）
- **D4-3**：真实构造 `hcloud KMS DecryptData --cipher_text=xxx --plaintext_file=/tmp/plain.txt`，调用 `evaluateCommandRisk` + `classifyTextCommand`，返回 allow/allow → FAIL（根因 risk-rule-engine 规则未覆盖）
- **D4-2**：真实构造 `echo %HW_ACCESS_KEY%`（Windows）、`set HW_ACCESS_KEY`、`printenv | grep -i ak`，返回 allow/allow → FAIL（根因 env-dump 规则未覆盖 Windows 风格）
- **D4-16**：真实构造 `bash -c "hcloud ECS DeleteServer"`、`sh -c "echo $HW_SECRET_KEY"`、`sudo hcloud ECS DeleteServer`、`cmd /c "hcloud ECS DeleteServer"`、`powershell -Command "hcloud ECS DeleteServer"`，均被 classifyTextCommand 拦截（deny）→ PASS

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶 (D3-C2) | 1 (wb-obs-*) | 1 (hcloud OBS rm -f) | PASS (ls 确认 NoSuchBucket) |
| VPC (D3-C1) | 0 (配额阻塞) | N/A | N/A (无资源创建) |
| ECS (D3-C1) | 0 (配额阻塞) | N/A | N/A (无资源创建) |
| 沙箱 (D3-C3/C6) | 0 (未连接) | N/A | N/A (无资源创建) |

> 所有真云用例均执行了归零验证。OBS 桶创建后立即删除并验证归零。VPC/ECS 因配额阻塞未创建资源，无需清理。沙箱因未连接未创建资源。

---

## 八、遗留与建议

- **P0 修复优先**：D2-4 小写 ak= 脱敏（一行修复：safety-policy.mjs:45 加 `i` 标志）、D4-3 KMS DecryptData 拦截、D4-2 Windows 风格 env 拦截
- **BLOCKED 用例**：D3-C1 VPC 配额已满（需清理其他 agent 残留 VPC 或申请配额）；D3-C3/C6/C14 沙箱未连接（需配置 workspace_id）
- **D3-C2 OBS 网站配置 403**：callTool 路径的 OBS website config 返回 403，可能是 OBS API 授权问题，需排查 huaweicloud_obs_set_website_config 工具实现
- **建议**：扩展 risk-rule-engine 规则覆盖 KMS/CSMS 敏感读取操作；classifyHcloudArgs 增加 sensitive-read 分类
