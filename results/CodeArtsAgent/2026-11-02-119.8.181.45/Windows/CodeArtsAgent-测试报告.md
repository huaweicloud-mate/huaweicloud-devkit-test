# CodeArtsAgent-Node 每日测试报告

> **报告名**：`CodeArtsAgent-测试报告.md`
> **生成时间**：2026-11-02 21:30:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-02-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（有 P0 FAIL 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent (testbot4-codearts1) |
| OS / 架构 | Windows |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.13-next.0（npm @next，gitHead 47170d1f） |
| 工具全集 | 46（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.x / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK / 未使用） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 列 |
| daily 基础用例 | 设计级 81 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 107（设计级）+ 39（展开级） |
| 已执行 | 37 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 25 / 12 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 67.6% |
| P0 / P1 / P2 新增缺陷 | 5 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 25 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | 环境阻塞 |
| SPEC-MISMATCH | 0 | 契约漂移 |
| NOT_RUN | 0 | 本轮未覆盖 |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 0 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | 不符预期 |
| BLOCKED | 0 | 环境阻塞 |
| SPEC-MISMATCH | 0 | 契约漂移 |
| NOT_RUN | 39 | 本轮未覆盖（按客户端+OS 预筛） |
| **合计** | **39** | |

---

## 四、缺陷清单

详见 [FINDINGS.md](./FINDINGS.md)

| # | 级别 | 用例ID | 缺陷描述 |
|---|---|---|---|
| 1 | P0 | D1-39 | Windows 升级检测链 spawnSync EINVAL |
| 2 | P0 | D4-2 | 凭证 env 打印拦截不完整 |
| 3 | P0 | D4-16 | 命令包裹穿透防护不足 |
| 4 | P0 | D4-21 | CreateServer 写操作未拦截 |
| 5 | P0 | D4-22 | CreateVpc 写操作未拦截 |
| 6 | P1 | D3-A1 | skill 检索完整性不足 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-C1~C7 | 设计级 | P1/P2 | NOT_RUN | 补环境 | 真云 E2E 用例需真实 AK/SK 和云资源 |
| D3-S1~S8 | 设计级 | P1/P2 | NOT_RUN | 补环境 | 场景类用例需真云环境 |
| D1-41, D1-42 | 设计级 | P1 | NOT_RUN | 补环境 | MCP 真实返回契约需隔离 HOME 环境 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | - | - | - |

> 本次测试未创建真云资源，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云 E2E、多终端矩阵、审批流实时对话框
- 建议：
  1. 修复 D4-2 风险规则引擎对 env 命令的拦截
  2. 补充 D4-16/D4-21/D4-22 的写操作分类规则
  3. 调查 D1-39 Windows spawnSync EINVAL 是否可通过升级 Node.js 解决

