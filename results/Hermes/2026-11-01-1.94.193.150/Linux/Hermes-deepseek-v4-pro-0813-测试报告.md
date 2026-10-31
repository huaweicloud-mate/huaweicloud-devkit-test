# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-01 05:23:19（北京时间）
> **执行归档**：`results/Hermes/2026-11-01-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.13-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：`run_all.sh` 编排 43 批探针——源码直调（classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/supplement/new-*）；spawn `mcp-server.mjs` 驱动 MCP 协议（D5/D8/D9）；真云 E2E 建删资源（realcloud-probe 的 D2-1/D3-C4/D4-14/D4-18/19/20、D4-13 只读子账号、D4-23 mdc 注入、D3-C1~C7）。证据逐用例落 `evidence/<case-id>/stdout.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 13 / 8 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 135） | `90.4%` |
| P0 / P1 / P2 新增缺陷 | `3 / 6 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `真云资源已全部归零（ECS/VPC/subnet/OBS/EIP）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行 |
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
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 3 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 5 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 8 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 11 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化），sandbox_connect/deploy_nginx 全链路不可达；解除条件=华为云沙箱维护完成 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），check_user/connect/credentials/exec_one_shot/close_session 7 隐式工具均不可用；解除条件=华为云沙箱维护完成 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】沙箱服务维护中（HDKIT_SANDBOX_MAINTENANCE），check_user 无法返回 realnameVerified/agreementSigned，沙箱预览 URL 场景不可验证；解除条件=华为云沙箱维护完成 |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。本轮 AK/SK/adminPass 均未明文落盘；D4-26/D4-6/D8-9 为「产品未脱敏」缺陷（属被测缺陷，非测试侧泄漏）。
- [x] 写操作误判 read-only：无。D4-14/D4-18/19/20 写操作 plan 均正确 `deny`/`confirm`，D4-13 只读子账号写操作 IAM 拒绝=true（writeDenied=true）。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：`credentialPanel`/`auth_status`/`redactSecrets`/`redactOutput` 均验证通过；证据 stdout 已避免回显明文 AK/SK（黑盒脱敏探针输出为 `<redacted>`）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，testbot3-hermes-e2e-3481*） | ✓ serverId 516e8a7c-… | ✓ DeleteServers | ✓ ListServersDetails 无残留（count=1 仅他方 tctest） |
| VPC（D3-C1，ff54ab52-…） | ✓ | ✓ | ✓ ListVpcs 无本次资源 |
| subnet（D3-C1，56f03a61-…） | ✓ | ✓ | ✓ ListSubnets 无本次子网 |
| OBS（D3-C2，testbot3-hermes-obs-3481329555） | ✓ | ✓ rm -f 删桶 | ✓ Delete bucket successfully |
| EIP（D3-C7，跨区域 ap-southeast-1） | ✓ | ✓ DeletePublicip | ✓ ListEips 无本次 id |
| VPC（D4-14，tctest-hermes-20261012-wwdtht） | ✓ | ✓ DeleteVpc | ✓ containsOwn=false |

> 注：真云沙箱用例（D3-C3/D3-C6/D3-S3）因 `HDKIT_SANDBOX_MAINTENANCE` 服务维护中未创建任何资源，无残留；全部真云写操作按名称前缀白名单只删本次创建资源。

---

## 八、遗留与建议

- 3 项 SPEC-MISMATCH（D8-9/D9-9/D10-4）需维护者裁决用例母版是否同步（D9-9 cancellation 声明、D8-9 sanitizeValue 脱敏、D10-4 规则库 16→19 条断言）。
- 新增缺陷 D1-70：建议 devkit 将 bundled undici 与 zstd-capable node 门槛对齐，或 Node>=22.15 引擎下限、或 proxy-agent 增加 zstd 缺失降级路径。
- 沙箱用例（D3-C3/D3-C6/D3-S3）待华为云沙箱维护完成后补测解除 BLOCKED。
- 既有 14 项缺陷无修复、无新回归（与 2026-10-31 同 gitHead 结论一致）。
