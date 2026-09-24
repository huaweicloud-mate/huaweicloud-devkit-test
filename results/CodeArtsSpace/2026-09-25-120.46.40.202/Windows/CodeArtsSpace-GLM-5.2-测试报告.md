# CodeArtsSpace-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-25 05:15:00`（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-09-25-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（141/141 PASS，0 FAIL，0 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` / `x86_64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.7`（npm latest，gitHead `7456d059`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置 / 本次未使用真云用例）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（master-probe.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（safety-policy/risk-rule-engine/update-check/tools/mcp-protocol），决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141` |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `100%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本次无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `102` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| NOT_RUN | `0` | — |

### 3.3 优先级分布

| 优先级 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|
| P0 | `21` | `0` | `0` | `0` |
| P1 | `70` | `0` | `0` | `0` |
| P2 | `30` | `0` | `0` | `0` |

---

## 四、缺陷清单

本次测试无缺陷（FINDINGS.md 为空，无需提单）。

---

## 五、未执行用例与原因

无未执行用例。所有 141 条用例均已实际执行并落盘证据。

---

## 六、安全/红线

| 红线 | 状态 | 说明 |
|---|---|---|
| 真云用例执行 | N/A | 本次 daily 用例集无真云 E2E 用例需执行 |
| 凭证脱敏 | PASS | redactSecrets 对 {ak, sk} 对象正确脱敏为 `<redacted>` |
| 凭证文件读取拦截 | PASS | classifyTextCommand 对 `cat credentials.json` 返回 `decision: deny` |
| 凭证 env 打印拦截 | PASS | classifyTextCommand 对 `printenv HW_SECRET_KEY` 返回 `decision: deny` |
| 写操作误判检测 | PASS | classifyTextCommand 对 `ecs delete` 返回 `decision: deny` |
| hook 绕过尝试 | PASS | 大小写变体 `hcloud ECS DELETE` 和引号变体 `hcloud ecs "delete"` 均被 deny |
| 命令包裹穿透 | PASS | `sh -c "hcloud ecs delete"` 被正确分类 |
| PASS 门禁 | PASS | verify_no_fake_pass.py 通过：所有 PASS 用例均有 evidencePath 且证据存在 |
| 覆盖率门禁 | PASS | verify_coverage.py 通过：P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0% |

---

## 七、资源释放

本次测试未创建任何真云资源（无 ECS/VPC/安全组/EIP 等创建操作），无需资源释放。

---

## 八、遗留建议

1. **D4-3 csms show-secret 分类**：当前 classifyTextCommand 将 `hcloud csms show-secret` 分类为 `decision: allow`（read-only），依赖输出层 redactSecrets 脱敏。建议后续考虑在命令分类层增加 secret-revealing 操作的 warn 提示。
2. **D4-15 URL 编码绕过**：`hcloud%20ecs%20delete` 未被识别为 hcloud 命令（分类为 `not_huaweicloud`）。由于 shell 不会将 `%20` 解码为空格，这不构成实际绕过风险，但建议后续增加 URL 解码预处理以增强防御纵深。
3. **版本一致性**：被测包 v1.1.7（latest 正式版）与 v1.1.7-next.2（预发布）base 版本相同，daily 测试结果稳定。

---

## 附录：执行环境

| 项 | 值 |
|---|---|
| 机器 IP | `120.46.40.202` |
| 执行时间 | `2026-09-25 05:10:00`（北京时间） |
| 证据目录 | `evidence/`（141 个子目录，每个含 probe.mjs + stdout.log） |
| 回填脚本 | `backfill_daily.py`（1 次调用回填 141 条） |
| 门禁脚本 | `verify_no_fake_pass.py` + `verify_coverage.py` 均通过 |
