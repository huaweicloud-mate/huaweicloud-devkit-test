# OfficeAce-GLM-5.2 每日测试报告

> **报告名**：`OfficeAce-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-17 02:50:00（北京时间）
> **执行归档**：`results/OfficeAce/2026-09-17-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（3 个 P0 FAIL + 2 个 P1 FAIL，P0 存在缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OfficeAce + GLM-5.2 |
| OS / 架构 | Windows 11 AMD64 |
| Node / npm / Python | Node v24.14.1 / npm 11.11.0 / Python 3.13.4 |
| 被测版本（SUT） | v1.1.5（gitHead `e7ed6f6`，PR #696） |
| 工具全集 | 39（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已安装（KooCLI） |
| 真云凭证 | cn-north-4（AKSK / 未使用） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 |
| 设计真源 | 设计级 78 / 展开级 39 / 追踪表 10 列 |
| daily 基础用例 | 设计级 78 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；eval harness 从测试仓库 `eval/harness/run-eval.mjs` 执行；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 78（设计级）+ 39（展开级）= 117 |
| 已执行 | 69（设计级）+ 38（展开级）= 107 |
| PASS / FAIL / BLOCKED / NOT_RUN | 91 / 16 / 0 / 10 |
| 通过率（分母 = PASS+FAIL） | 85.0% |
| P0 / P1 / P2 新增缺陷 | 3 / 2 / 0 |
| 红线（I 类）违规 | 2（D4-16 sh wrap bypass, D2-4 AK/SK leak） |
| 资源释放 | 全部归零（未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 64 | 有证据且通过 PASS 门禁 |
| FAIL | 5 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | 无 |
| NOT_RUN | 9 | 本轮未覆盖（P1 用例，环境/依赖限制） |
| **合计** | **78** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | eval harness 路由 MISS（10）+ D2-4 脱敏（1） |
| NOT_RUN | 1 | EXP-E08 诊断类 prompt（N/A） |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-16 | sh -c 命令包裹穿透 | sh wrap 应 deny/confirm | 返回 allow | safety-policy.mjs 未检测 sh -c 包裹 | I | 待提单 |
| 2 | P0 | D2-4 | AK/SK 凭证脱敏不完整 | 所有 AK/SK 格式被 *** 替换 | 部分明文残留 | safety-policy.mjs redactSecrets 正则不全 | I | 待提单 |
| 3 | P0 | D1-39 | Windows queryDistTags 返回 null | 返回 dist-tags 结构 | null | update-check.mjs Windows 兼容问题 | P | 待提单 |
| 4 | P1 | D1-1 | 更新检查 JSON 解析错误 | 优雅降级返回 check_failed | 抛出异常 | update-check.mjs null 防御缺失 | P | 待提单 |
| 5 | P1 | D1-3 | includes 属性读取错误 | 安全默认值 | 抛出异常 | update-check.mjs 属性访问未防御 | P | 待提单 |

### 根因详情

**#1 [P0] D4-16 命令包裹穿透（sh -c wrap bypass）**

- 期望：`classifyTextCommand('sh -c "hcloud ECS CreateServers"')` → `deny` 或 `confirm`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `classifyTextCommand()` 未检测 `sh -c` / `bash -c` 包裹模式
- 证据：`evidence/d4-security/stdout.log`，D4-16 测试项

**#2 [P0] D2-4 凭证脱敏不完整（AK/SK 泄漏）**

- 期望：所有 AK/SK 格式均被 `***` 替换
- 实际：部分凭证格式明文残留
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `redactSecrets()` 正则覆盖不全
- 证据：`evidence/d2-auth/stdout.log`，D2-4 测试项

**#3 [P0] D1-39 Windows 下 queryDistTags 返回 null**

- 期望：Windows 下正常返回 `{ latest: 'x.y.z', next: ... }`
- 实际：返回 `null`
- 根因：`plugins/huaweicloud-core/src/update-check.mjs` 的 `queryDistTagsSync` 在 Windows 上 npm 子进程调用失败
- 证据：`evidence/d1-upgrade/stdout.log`，D1-39 测试项

**#4 [P1] D1-1 更新检查 JSON 解析错误**

- 期望：`judgeUpdate()` 在 distTags 为 undefined 时返回 `check_failed`
- 实际：抛出 `"undefined" is not valid JSON`
- 根因：`plugins/huaweicloud-core/src/update-check.mjs` 未做 null/undefined 防御
- 证据：`evidence/d1-upgrade/stdout.log`，D1-1 测试项

**#5 [P1] D1-3 includes 属性读取错误**

- 期望：`judgeUpdate()` 在参数缺失时返回安全默认值
- 实际：抛出 `Cannot read properties of undefined (reading 'includes')`
- 根因：`plugins/huaweicloud-core/src/update-check.mjs` 属性访问未做 null 防御
- 证据：`evidence/d1-upgrade/stdout.log`，D1-3 测试项

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-58 | 设计级 | P1 | NOT_RUN | 补环境 | 需真云 ECS 实例操作，本轮未配置真云凭证 |
| D2-12 | 设计级 | P1 | NOT_RUN | 补环境 | 需 IAM 多账号环境 |
| D2-13 | 设计级 | P1 | NOT_RUN | 补环境 | 需 STS 临时凭证实际签发 |
| D2-16 | 设计级 | P1 | NOT_RUN | 补环境 | 需多区域凭证配置 |
| D3-A1 | 设计级 | P1 | NOT_RUN | 补环境 | 需沙箱 DevStation 环境 |
| D3-C5 | 设计级 | P1 | NOT_RUN | 补环境 | 需多服务真云 List 操作 |
| D6-4 | 设计级 | P1 | NOT_RUN | 补环境 | 需长时间性能基准测试环境 |
| D9-9 | 设计级 | P1 | NOT_RUN | 补环境 | 需 MCP server 长连接稳定性测试 |
| D8-4 | 设计级 | P1 | NOT_RUN | 补环境 | 需多语言文档完整性校验环境 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断类 prompt 无明确预期服务，verdict=N/A |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`1`（D2-4 AK/SK 脱敏不完整，已记录为 P0 缺陷）
- [x] 写操作误判 read-only：`1`（D4-16 sh wrap bypass，已记录为 P0 缺陷）
- [x] 红线（I 类）违规：`2`（D4-16 + D2-4）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | N/A | 本轮未创建真云资源 |

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云 E2E / 多终端矩阵 / 长时间性能基准 / MCP 长连接稳定性
- eval harness 路由准确率 21.4%（3 HIT / 11 MISS / 1 N/A），与基线一致，非本轮新增退化
- 建议：优先修复 D4-16 sh wrap bypass 和 D2-4 AK/SK 脱敏两个 P0 安全缺陷
