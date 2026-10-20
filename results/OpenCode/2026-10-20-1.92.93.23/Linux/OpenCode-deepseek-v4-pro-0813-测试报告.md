# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-20 09:55（北京时间）
> **执行归档**：`results/OpenCode/2026-10-20-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项；含 1 项 1.1.10-next.0 新引入的沙箱 deploy_nginx 假阴性回归）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.10-next.0`（npm next，gitHead `d1a3d6e`，PR #962） |
| 工具全集 | `43`（`tools.mjs` TOOL_DEFINITIONS，较 v1.1.9 的 39 新增 check_cli/obs_set_website_config 等） |
| hcloud / 依赖 | `KooCLI 7.2.12`（插件配对 7.3.12，soft version_mismatch 提示） |
| 真云凭证 | `cn-north-4（主账号 hw018619646 + 只读子账号 test001）` |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：探针直调（源码级 `import safety-policy.mjs / risk-rule-engine.mjs / mcp-server.mjs / tools.mjs / mcp-protocol.mjs` 等）+ MCP 真机（plan/approve/run_readonly/service_catalog 43 工具链）+ 真云 E2E（ECS 生命周期 / OBS 静态站 / 沙箱部署 / 跨区域 EIP / 服务矩阵 22 服务 / VPC 建删审计 / 只读子账号）。全部探针本轮真实运行，证据落 `evidence/<case-id>/stdout.log`。
>
> **关键环境变化**：共享账号 hw018619646 已于今日（2026-10-20）恢复余额并解冻——ECS 建机、EIP 建删、OBS 建桶均真机成功并归零。昨日（10-19）4 项真云写操作用例的 BLOCKED（D3-C1/D3-C2/D3-C13/D3-C7）今日全部真机 PASS。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146`（NOT_RUN 1 = OS 专属 D1-39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.7%` |
| P0 / P1 / P2 缺陷（FAIL+SPEC） | `4 / 6 / 5` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `全部归零（见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无（账号已解冻） |
| SPEC-MISMATCH | `3` | D9-9 / D8-9 / D10-4 |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 由 NR3-10 代表覆盖） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机未命中） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

### 3.3 使命清单（AI Test Manager）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `7` | mission-001（D4 安全域） |
| FAIL | `2` | D4-2 / D4-25 |
| **合计** | **`9`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖裸 access_key | `safety-policy.mjs:546` | 待提单 |
| 2 | P1 | `D4-6` | adminPass 空格/JSON 形态未告警未脱敏 | `cloud-risk-rules.json:68-82` | 待提单 |
| 3 | P1 | `D4-17` | hook 模糊/畸形输入 fail-open | `risk-rule-engine.mjs:105-106` | 待提单 |
| 4 | P0 | `D4-21` | HCL 宽 IAM + AdministratorFullAccess 未拦截 | `cloud-risk-rules.json:196` | 待提单 |
| 5 | P2 | `D4-25` | Python hook 写遥测误分类 cli:invoke | `huaweicloud-safety.py:46` | 待提单 |
| 6 | P2 | `D4-26` | findings.evidence 脱敏漏 secret_key/adminPass | `risk-rule-engine.mjs:19-25` | 待提单 |
| 7 | P1 | `D3-S3` | 沙箱预览 URL 未返回（deploy_nginx 假阴性） | `session-manager.mjs:812-825` | 待提单（1.1.10-next.0 新引入） |
| 8 | P2 | `D3-S5` | 复合意图分层路由未分解 | `tools.mjs` serviceCatalog routeMap | 待提单 |
| 9 | P2 | `D3-S6` | FunctionGraph 最小参数创建失败 | `tools.mjs:1854` | 待提单 |
| 10 | P1 | `D3-S7` | 复合意图+RDS 最小实例创建失败 | `tools.mjs:1859` + routeMap | 待提单 |
| 11 | P0 | `D9-12` | initialize 握手两处缺口 | `mcp-protocol.mjs:32-59` | 待提单 |
| 12 | P1 | `EXP-E01` | 中文意图「云主机」未命中 ECS | `tools.mjs:2030-2037` | 待提单 |
| 13 | P1 | `D9-9` | capabilities.cancellation 未声明 | `mcp-protocol.mjs:47-49` | 待提单（SPEC） |
| 14 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK/token | `telemetry/telemetry.mjs:189` | 待提单（SPEC） |
| 15 | P0 | `D10-4` | 规则库 16→19 条契约漂移 | `cloud-risk-rules.json` | 待提单（SPEC） |

> 15 项缺陷完整「现象/断言/根因/证据」见同目录 `FINDINGS.md`。其中 **#7（D3-S3 沙箱 deploy_nginx 假阴性）为 1.1.10-next.0 新引入回归**（1.1.9 返回 ok:true；对比详见 session-manager.mjs A1 #935 新增写验证逻辑）。其余 14 项与 10-19 逐条一致，疑似历史缺陷，`file_issue.py` 会自动查重。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows 专属」（升级检测链 EINVAL 专属）；Linux 由展开级 NR3-10 代表覆盖（`queryDistTags` 返回对象无 EINVAL 异常，已在本轮 disttags.log 验证） |

### BLOCKED

本轮**无 BLOCKED**。昨日 4 项因账号冻结标注 BLOCKED 的真云写操作用例（D3-C1/D3-C2/D3-C13/D3-C7）今日真机执行全部 PASS（账号已充值解冻）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（探针统一 redact，AK/SK 落 `HPUA***REDACTED***`，未向仓库落盘明文）
- [x] 写操作误判 read-only：无（D4-18/19/20 审批流 confirm-not-deny / 预检 / 拒绝零操作均通过）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：evidence 中 AK/SK/token 均已按 `HPUA***REDACTED***` / `<redacted>` 处理
- [x] 真机凭证：主账号 + 只读子账号 test001（D4-13 实测最小权限：读 CES regex 误判实为 code=0、写 CreateVpc 被 PolicyNotAuthorized 拒、residualZero=true）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-C1 ECS 生命周期 | VPC+子网+ECS（CreateServers → ACTIVE） | 删 ECS 含磁盘 + 删 VPC+子网 | 归零 OK（ECS count=0，cleanOk=true） |
| D3-C2 OBS 静态站 | tctest-opencode-obs-* 桶+对象+静态站 | rm 对象 + rm 桶 | 归零 OK |
| D3-C7 跨区域 EIP | CreatePublicip（返回 id） | DeletePublicip | 归零 OK |
| D3-C3 / D3-S3 / D3-C6 沙箱 | connect/upload/deploy | close_session | 无残留 |
| D3-C13 OBS 托管 | 建桶 + set website | rm -f 删桶 | 归零 OK |
| D3-S2 删VPC确认 | tctest-opencode-s2-* VPC | 确认后 DeleteVpc | 归零 OK |
| D4-14 VPC 审计 | tctest-opencode-20261006-* VPC | DeleteVpc | 归零 OK（ListVpcs 不含本次资源） |
| D4-13 只读子账号 | KooCLI profile test001 | 清理 profile 恢复 default | 未创建资源（写被 IAM 拒，residualZero=true） |

> 说明：本轮主账号 hw018619646 已恢复余额并解冻，真云写操作全部真机执行并归零，无残留。

---

## 八、遗留与建议

- **【新发现·1.1.10-next.0 回归】#7**：`huaweicloud_sandbox_deploy_nginx` 新增 A1 (#935) 写验证 `evaluateDeployNginxVerify`（session-manager.mjs:812-825）产生假阴性——nginx 实际已服务（deploy_check HTTP 200）却返回 `ok:false "nginx -t did not pass"`、不返回 URL。建议放宽为「deploy_check nginx_serving 生效即视为成功」或修复沙箱内 nginx -t 标记采集。
- **【路由改善】**：1.1.10-next.0 的 serviceCatalog 路由准确率从基线 78.6%（21.4% MISS）提升到 92.9%（HIT=13 MISS=1 N/A=1），仅剩「云主机」别名未命中（EXP-E01）。
- **【工具数变化】**：TOOL_DEFINITIONS 从 39 → 43，多份用例母版仍写「40 工具」（D5-3/D6-4/EXP-D5-1-3 等），建议维护者同步用例计数与 D10-4 规则库计数。
- D3-C4 服务矩阵中 DMS/DEW 已升级为聚合服务（DMS→Kafka/RabbitMQ/RocketMQ，DEW→KMS/CSMS，`aggregate:true` + subServices），`list_operations` 返回聚合形态，EXP-C4-14/18 判定 PASS；建议用例母版补充聚合服务形态断言。
- 建议 `package.json` 将 KooCLI 配对态收敛（当前插件配对 7.3.12，本机 7.2.12，check_cli soft 提示 version_mismatch）。