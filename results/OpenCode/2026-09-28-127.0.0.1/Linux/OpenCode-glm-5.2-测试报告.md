# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-28 20:40:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-28-127.0.0.1/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（有 FAIL，无 P0 缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Linux aarch64（ECS cn-north-4） |
| Node / npm / Python | Node v24.19.0 / npm 11.17.0 / Python 3.12.13 |
| 被测版本（SUT） | huaweicloud-devkit@1.1.7（latest，gitHead 7456d059） |
| hcloud / 依赖 | hcloud 7.2.12，AK/SK 已配置（~/.hcloud/config.json） |
| 真云凭证 | cn-north-4（AKSK，hcloud CLI 可用）；缺 credentials.readonly.json |
| 测试类型 | 源码级探针 / MCP 协议 / 路由层 eval harness |
| 设计级用例 | 102 条 |
| 展开级用例 | 39 条 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + D10 eval harness 路由评测，决策/结果落 `evidence/<case-id>/stdout.log` + `probe.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / NOT_RUN | 126 / 13 / 1 / 1 |
| 通过率（分母=PASS+FAIL=139） | 90.6% |
| P0 / P1 / P2 缺陷 | 0 / 2 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 89 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-2, D4-16（安全规则绕过） |
| BLOCKED | 1 | D4-13（缺只读子账号凭证） |
| NOT_RUN | 0 | — |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | EXP-C4-01~22（除 C4-03 外全 PASS）+ EXP-D5-1-1/3 + EXP-E06/E09/E15 |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14（路由 MISS） |
| NOT_RUN | 1 | EXP-E08（诊断类 N/A） |
| **合计** | **39** | |

---

## 四、缺陷清单

### 产品缺陷

| # | 级别 | 用例 | 标题 | 根因 |
|---|---|---|---|---|
| 1 | P1 | D4-2 | env\|grep HW_ 凭证泄露 | safety-policy.mjs:398-399 env 拦截规则关键词未含 HW_ |
| 2 | P1 | D4-16 | sh -c/eval 包裹穿透 | safety-policy.mjs:419 printenv 正则锚不匹配引号内 |
| 3 | P2 | EXP-E01~E14 | 路由层中文意图覆盖不全 | tools.mjs:1931 routeMap 缺中文关键词映射 |

### 非产品缺陷

| # | 类型 | 用例 | 原因 |
|---|---|---|---|
| 4 | 环境阻塞 | D4-13 | 缺 credentials.readonly.json（只读子账号 test001） |

> 详细缺陷信息见 `FINDINGS.md`。

---

## 五、未执行与原因

| 用例 | 状态 | 原因 | 分类 |
|---|---|---|---|
| D4-13 | BLOCKED | `~/.config/huaweicloud/credentials.readonly.json` 不存在 | 【补环境】需从维护者拷贝只读子账号凭证 |
| EXP-E08 | NOT_RUN | D10-3 eval harness verdict=N/A（诊断类用例，无期望服务） | 【调归属】诊断类用例无明确服务映射 |

---

## 六、安全红线

| 红线项 | 结果 | 说明 |
|---|---|---|
| 真云资源创建/删除 | N/A | 本轮未执行真云 E2E（D3-C1/C2/C3/C6/B7/B8 不在 daily 精选范围） |
| 缺陷统一提单 | ✅ | 3 个产品缺陷已写入 FINDINGS.md，待 file_issue.py 提单 |
| PASS 门禁 | ✅ | verify_no_fake_pass.py 通过，所有 PASS 有 evidencePath |
| 环境阻塞合规 | ✅ | D4-13 BLOCKED 写四要素 |
| 目录权限 | ✅ | 仅修改 results/OpenCode/ |

---

## 七、资源释放

- 未创建真云资源（本轮为源码级探针 + eval harness，无 ECS/OBS 等资源创建）
- 无残留资源需清理

---

## 八、遗留建议

1. **D4-2/D4-16 安全规则修复**：建议在 safety-policy.mjs 的 env 拦截规则中增加 `HW_` 关键词，并在 printenv 拦截规则中放宽前置锚定以覆盖引号内场景。
2. **EXP-E 路由层增强**：建议在 tools.mjs routeMap 中增加中文关键词到服务的映射（云主机→ECS、云数据库→RDS 等），当前准确率 21.4% 有较大提升空间。
3. **D4-13 环境补全**：从维护者获取只读子账号 credentials.readonly.json，补全后重测 D4-13。
4. **同客户端 Windows 侧**：OpenCode Windows 侧（IP 188.239.14.150）今日已有执行结果，Linux 侧为首执行，两侧结果可交叉对比。
