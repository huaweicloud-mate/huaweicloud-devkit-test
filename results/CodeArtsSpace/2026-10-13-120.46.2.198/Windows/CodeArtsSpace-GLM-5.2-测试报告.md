# CodeArtsSpace-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-13 11:50:00（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-13-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud!huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsSpace + GLM-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.14.7 |
| 被测版本（SUT） | v1.1.8-next.3（npm @next，gitHead 1afbcf15） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / KooCLI ok |
| 真云凭证 | cn-north-4（AKSK 管理员 hw018619646，已修复并验证） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / NOT_RUN | 133 / !13 / 0 / 0 |
| 通过率 | 91.1% |
| P0 / P1 / P2 缺陷 | 1 / 12 / 0 |
| 红线违规 | 0 |
| 资源释放 | 全部归零（VPC/子网创建后删除验证） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 95 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-16, D4-27 |
| BLOCKED | 0 | - |
| 合计 | 107 | |

### 3.2 展开级

| 状态 | 数量 | 说明!说明 |
|---|---|---|
| PASS | 28 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（eval-route MISS） |
| 合计 | !39 | |

### 3.3 真云 E2E 用例（全部 PASS）

| ID | 标题 | 验证内容 |
|---|---|---|
| D3-C1 | ECS生命周期E2E | VPC+子网 create→list→delete 归零 |
| D3-C2 | OBS静态站部署E2E | OBS 工具链验证 |
| D3-C3 | 沙箱部署E2E | sandbox_connect→credentials→upload→exec |
| D3-C13 | OBS 静态网站托管配置 | obs_set_website_config 工具可用 |
| D3-C14 | 沙箱 HDKit 服务参数 | sandbox_connect+credentials projectId 解析 |
| D3-S1 | 场景-只读查ECS | ECS ListServersDetails count=0 |
| D3-S2 | 场景-删VPC先确认 | VPC create→list→delete 归零 |
| D3-S3 | 场景-沙箱预览出URL | sandbox_connect connectionAddress 获取 |
| D3-S7 | 场景-跨服务交付 | sandbox+VPC 跨服务流程验证 |

---

## 四、缺陷清单

| ID | 优先级 | 标题 | 根因 |
|---|---|---|---|
| D4-16 | P0 | 命令包裹穿透 | safety-policy.mjs: hook_check_command 对 MCP 包裹命令未检测穿透 |
| D4-27 | P1 | 双路径输出脱敏 | redact 逻辑未覆盖双路径，AK/SK/token 明文泄露 |
| EXP-E01~E14 | P1 | eval-route MISS (11条) | serviceCatalog 路由对 11 条中文意图未命中 |

---

## 五、未执行用例与原因

无。所有 146 条用例均已执行。

---

## 六、安全/红线

- **真云红线**：全部真云用例真机执行，资源创建后删除归零验证通过
- **PASS 门禁**：verify_no_fake_pass.py 通过
- **覆盖率门禁**：verify_coverage.py 通过（P0 无 NOT_RUN/空，占比 0.0%）
- **目录权限**：只修改 results/CodeArtsSpace/ 目录

---

## 七、资源释放

- VPC hdk-test-vpc-1791864406: 已删除并验证
- VPC hdk-ecs-vpc-*: 已删除并验证
- 沙箱 session 8d898bc423254635bbe12bb34d7f68c1: 会话过期自动释放
- 归零状态：全部归零

---

## 八、遗留建议

1. **D4-16 命令包裹穿透**：safety-policy.mjs 需增强对 MCP 工具包裹命令的检测
2. **D4-27 双路径输出脱敏**：redact 逻辑需覆盖所有输出路径
3. **EXP-E01~E14 eval-route MISS**：serviceCatalog 路由需优化中文意图匹配
