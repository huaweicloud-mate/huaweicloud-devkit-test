# CodeArtsSpace-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-13 11:30:00（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-13-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 和 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsSpace + GLM-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.14.7 |
| 被测版本（SUT） | v1.1.8-next.3（npm @next，gitHead 1afbcf15） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已安装 / KooCLI ok |
| 真云凭证 | cn-north-4（AKSK 占位符/已过期，真云用例 BLOCKED） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（BLOCKED） |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；MCP 工具真机执行；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 124 / 13 / 9 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 90.5% |
| P0 / P1 / P2 新!新增缺陷 | 1 / 12 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云未执行（凭证过期），无资源创建 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 96 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-16, D4-27 |
| BLOCKED | 9 | 真云 E2E（凭证过期） |
| NOT_RUN | 0 | - |
| 合计 | 107 | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（eval-route MISS） |
| BLOCKED | 0 | - |
| NOT_RUN | 0 | - |
| 合计 | 39 | |

### 3.3 P0 覆盖

| P0 用例 | 状态 | 说明 |
|---|---|---|
| D1-39 | PASS | Windows 升级检测链可用性 |
| D1-40 | PASS | 镜像 lag 下检测正确性 |
| D2-4 | PASS | 凭证脱敏正确性 |
| D2-11 | PASS | R3 STS token拒绝落盘 |
| D4-1 | PASS | 凭证文件读取拦截 |
| D4-2 | PASS | 凭证env打印拦截 |
| D4-3 | PASS | 明文secret API拦截 |
| D4-5 | PASS | 写操作误判检测 |
| D4-9 | PASS | 公开暴露/破坏性预检 |
| D4-15 | PASS | hook绕过尝试 |
| D4-16 | **FAIL** | 命令包裹穿透 |
| D4-18 | PASS | confirm-not-deny审批语义 |
| D4-19 | PASS | 确认流下预检仍生效 |
| D4-21 | PASS | hook_check_artifacts 具名回归 |
| D4-22 | PASS | hook_check_deploy_plan 具名回归 |
| D4-23 | PASS | 全局规则注入生效性 |
| D4-28 | PASS | Node 版安全 hook 链路 |
| D8-7 | PASS | 7 个 meta/通用技能指引验证 |
| D9-12 | PASS | initialize 握手协议安全基线 |
| D9-13 | PASS | tools/call 凭证不泄露与权限校验 |
| D10-4 | PASS | 安全干预-静态规则层 |

---

## 四、缺陷清单

### 4.1 FAIL 用例

| ID | 优先级 | 标题 | 根因 |
|---|---|---|---|
| D4-16 | P0 | 命令包裹穿透 | safety-policy.mjs: hook_check_command 对 MCP 工具包裹的 hcloud 命令未检测穿透，返回 allow 应返回 deny |
| D4-27 | P1 | 双路径输出脱敏 | redact 逻辑未覆盖双路径输出，AK/SK/token 明文泄露 |
| EXP-E01~E05,E07,E10~E14 | P1 | eval-route MISS (11条) | serviceCatalog 路由对 11 条中文意图评测集未命中，基线 21.4% MISS |

### 4.2 BLOCKED 用例

| ID | 优先级 | 标题 | blockedReason |
|---|---|---|---|
| D3-C1 | P1 | ECS生命周期E2E | credentials.json 占位符 AK/SK（4字符），STS token 空，APIGW.0301 |
| D3-C2 | P1 | OBS静态站部署E2E | 同上 |
| D3-C3 | P1 | 沙箱部署E2E | 同上 |
| D3-C13 | P1 | OBS 静态网站托管配置 | 同上 |
| D3-C14 | P2 | 沙箱 HDKit 服务参数 | 同上 |
| D3-S1 | P1 | 场景-只读查ECS | 同上 |
| D3-S2 | P1 | 场景-删VPC先确认 | 同上 |
| D3-S3 | P1 | 场景-沙箱预览出URL | 同上 |
| D3-S7 | P1 | 场景-跨服务交付 | 同上 |

---

## 五、未执行用例与原因

### BLOCKED 分类

| ID | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|
| D3-C1~C3,C13,C14,S1,S2,S3,S7 | 【补环境】 | credentials.json 包含占位符 AK/SK（AK=AKRT, 4字符），STS token 空（0字符），所有云 API 调用返回 APIGW.0301 Unauthorized。需刷新账号 hw018619646 的永久 AK/SK 或获取新 STS token。 | 无需改用例，需补环境：刷新 ~/.config/huaweicloud/credentials.json 为真实 AK/SK |

---

## 六、安全/红线

- **真云红线**：凭证过期（占位符），真云用例标 BLOCKED 而非 mock/跳过，符合红线要求
- **PASS 门禁**：verify_no_fake_pass.py 通过，所有 PASS 用例有 evidencePath 且证据存在
- **覆盖率门禁**：verify_coverage.py 通过，P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%
- **目录权限**：只修改 results/CodeArtsSpace/ 目录，未碰 Summary/其他客户端/test-cases

---

## 七、资源释放

- 真云资源：未创建（凭证过期，真云用例 BLOCKED）
- 本地资源：无副作用操作
- 归零状态：无需归零

---

## 八、遗留建议

1. **【紧急】刷新真云凭证**：credentials.json 中 AK/SK 为占位符（4字符），需替换为账号 hw018619646 的真实永久 AK/SK 或有效 STS token
2. **D4-16 命令包裹穿透**：safety-policy.mjs 需增强对 MCP 工具包裹命令的检测，防止通过 MCP 工具绕过 hook 检查
3. **D4-27 双路径输出脱敏**：redact 逻辑需覆盖所有输出路径，防止 AK/SK/token 明文泄露
4. **EXP-E01~E14 eval-route MISS**：serviceCatalog 路由需优化中文意图匹配，当前 21.4% MISS 基线需降低
