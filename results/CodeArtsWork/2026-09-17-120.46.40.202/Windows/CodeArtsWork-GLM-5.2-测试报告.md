# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-17 00:30:00（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-17-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 15 个 FAIL，其中 3 个 P0 FAIL、11 个评测路由 FAIL、1 个 P1 安全 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsWork + GLM-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | 40+（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置，readonly 子账号已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / eval harness |
| daily 基础用例 | 设计级 78 / 展开级 39 |

> **执行方法**：MCP 工具直调 + 源码检查 + eval harness；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 117 |
| 已执行 | 117 |
| PASS / FAIL / NOT_RUN | 92 / 15 / 10 |
| 通过率（分母 = PASS+FAIL = 107） | 86.0% |
| P0 / P1 / P2 新增缺陷 | 3 / 12 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 65 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | D1-39, D4-2, D4-3, D4-6 |
| NOT_RUN | 9 | 环境不具备/不适用，均写明原因 |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（eval 路由 MISS） |
| NOT_RUN | 1 | EXP-E08（诊断类 N/A） |
| BLOCKED | 0 | 无 |

### 3.3 优先级分布

| 优先级 | 总数 | PASS | FAIL | NOT_RUN |
|---|---|---|---|---|
| P0 | 18 | 15 | 3 | 0 |
| P1 | 81 | 62 | 12 | 7 |
| P2 | 18 | 15 | 0 | 3 |

---

## 四、缺陷清单

### P0 缺陷（3 个）

| ID | 标题 | 根因 | 严重度 |
|---|---|---|---|
| D1-39 | Windows 升级检测链可用性 | update-check.mjs queryDistTagsSync/queryDistTagsFetch 在 Windows 上返回 check_failed，latestStable=null | P0 |
| D4-2 | 凭证env打印拦截 | risk-rule-engine.mjs cloud-risk-rules.json hwc-command-env-dump 规则 regex `(HUAWEICLOUD\|HWC_\|HCLOUD\|OS_)` 缺少 `HW_` 前缀，safety-policy.mjs 有正确 regex 但 hook_check_command 用 risk-rule-engine | P0 |
| D4-3 | 明文secret API拦截 | risk-rule-engine.mjs hwc-command-secret-value-read 规则 regex 只有 `ShowSecretVersion\|DownloadSecret\|GetSecretValue`，缺少 `ShowSecret`（CSMS ShowSecret 不被拦截） | P0 |

### P1 缺陷（12 个）

| ID | 标题 | 根因 | 严重度 |
|---|---|---|---|
| D4-6 | adminPass回显警告 | cloud-risk-rules.json 无 adminPass 参数检测规则 | P1 |
| EXP-E01 | ECS查询路由 | serviceCatalog 路由 MISS：中文意图"查云主机"未路由到 ECS | P1 |
| EXP-E02 | ECS创建路由 | serviceCatalog 路由 MISS：中文意图"创建云服务器"未路由到 ECS | P1 |
| EXP-E03 | OBS静态站路由 | serviceCatalog 路由 MISS：路由到 Sandbox 而非 OBS | P1 |
| EXP-E04 | EIP路由 | serviceCatalog 路由 MISS：中文意图"绑定公网IP"未路由到 EIP | P1 |
| EXP-E05 | RDS查询路由 | serviceCatalog 路由 MISS：中文意图"MySQL状态"未路由到 RDS | P1 |
| EXP-E07 | CBR路由 | serviceCatalog 路由 MISS：中文意图"备份策略"未路由到 CBR | P1 |
| EXP-E10 | FunctionGraph路由 | serviceCatalog 路由 MISS：中文意图"函数处理"未路由到 FunctionGraph | P1 |
| EXP-E11 | BSS路由 | serviceCatalog 路由 MISS：中文意图"费用情况"未路由到 BSS | P1 |
| EXP-E12 | CES路由 | serviceCatalog 路由 MISS：中文意图"云监控告警"未路由到 CES | P1 |
| EXP-E13 | ELB路由 | serviceCatalog 路由 MISS：中文意图"HTTPS证书"未路由到 ELB | P1 |
| EXP-E14 | IAM路由 | serviceCatalog 路由 MISS：中文意图"权限审计"未路由到 IAM | P1 |

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 分类 | 原因 | 改用例建议 |
|---|---|---|---|---|---|
| D1-5 | 设计 | P1 | 【补环境】 | uninstall 会破坏当前测试环境 | 可在独立容器中执行 |
| D1-28 | 设计 | P1 | 【补环境】 | 无新版本可测升级检测 | 需 npm 发布新版本 |
| D2-16 | 设计 | P1 | 【补环境】 | 无 import 文件 | 需预置 creds-import.json |
| D6-4 | 设计 | P1 | 【补环境】 | 需并发测试 harness | 补充并发调度探针 |
| D9-6 | 设计 | P1 | 【补环境】 | 需多客户端同时连接 | 需多客户端测试环境 |
| D9-9 | 设计 | P1 | 【补环境】 | 需 MCP inspector 超时注入 | 需 inspector 工具 |
| D4-12 | 设计 | P2 | 【补环境】 | 需 npm audit 扫描 | 可集成 npm audit |
| D6-3 | 设计 | P2 | 【补环境】 | 需冷启动时间测量 | 需进程重启计时 |
| D7-4 | 设计 | P2 | 【补环境】 | 需国内镜像源测试 | 需 npmmirror.com 测试 |
| EXP-E08 | 展开 | P1 | 【调归属】 | 诊断类用例 N/A | 评测集应排除诊断类 |

---

## 六、安全/红线

- **真云凭证**：已配置，未创建真云资源（本次测试为源码级+MCP工具级，无真云 E2E）
- **PASS 门禁**：verify_no_fake_pass.py 通过，所有 PASS 用例有 evidencePath 且证据存在
- **覆盖率门禁**：verify_coverage.py 通过，P0 无 NOT_RUN，NOT_RUN+空占比 11.5%（设计级）/ 2.6%（展开级），均 ≤ 15%
- **目录权限**：只修改 results/CodeArtsWork/ 目录，未碰 Summary / 其他客户端 / test-cases 母版
- **红线违规**：0

---

## 七、资源释放

- 无真云资源创建，无需释放
- 无 sandbox 实例创建
- 无临时文件残留

---

## 八、遗留建议

1. **D4-2 修复建议**：在 cloud-risk-rules.json hwc-command-env-dump 规则的 regex 中添加 `HW_` 前缀：`(HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_)`
2. **D4-3 修复建议**：在 cloud-risk-rules.json hwc-command-secret-value-read 规则的 regex 中添加 `ShowSecret`：`(ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue)`
3. **D4-6 修复建议**：在 cloud-risk-rules.json 中新增 adminPass 参数检测规则
4. **D1-39 修复建议**：检查 Windows 上 queryDistTagsSync 的 spawn 选项是否需要 `shell: true`
5. **EXP-E 评测路由**：serviceCatalog 中文意图路由准确率仅 21.4%，需增强中文关键词匹配（11/15 MISS 为"Run hcloud --help"未命中任何服务）
