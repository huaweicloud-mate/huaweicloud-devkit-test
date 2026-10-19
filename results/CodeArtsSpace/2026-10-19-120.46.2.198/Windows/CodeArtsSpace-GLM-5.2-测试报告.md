# CodeArtsSpace-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-19 18:35:00（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-19-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 15 条 FAIL，含 1 条 P0 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.14.7` |
| 被测版本（SUT） | `v1.1.9`（npm latest，gitHead `05a67b6`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置 / doctor 确认` |
| 真云凭证 | `cn-north-4（AKSK 已使用，VPC 建删归零验证）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。真云用例 D3-C1 真机执行 VPC 建删归零。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146` |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 15 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `89.7%` |
| P0 / P1 / P2 新增缺陷 | `1 / 14 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC 44f83f01 已删验证 VPC.9904 not found）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `103` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | MCP 工具命令包裹穿透未拦截 | `powershell -Command "Get-Content credentials.json"` 经 MCP 工具应 `deny` | MCP 返回 `allow`（`decision=allow, risk=not_huaweicloud`） | `safety-policy.mjs` classifyTextCommand 对 powershell -Command 包裹的凭证路径未识别 | P | 待提单 |
| 2 | P1 | `D4-27` | 双路径输出脱敏不完整 | `redactSecrets({ak,sk,token})` 应返回所有敏感字段为 `<redacted>` | `sk`/`token` 原样返回未脱敏 | `safety-policy.mjs:57` isSecretKeyName 未匹配 `ak`/`sk`/`token` 短键名 | P | 待提单 |
| 3 | P1 | `D8-4` | 引导文档 INSTALL.md 未随 npm 包发布 | `npm` 包应含 `INSTALL.md` | 包内仅有 `README.md`/`README.zh-CN.md`，无 `INSTALL.md` | `package.json` files 字段未包含 `INSTALL.md` | P | 待提单 |
| 4 | P1 | `D8-9` | 安装 ID 与遥测值未脱敏 | 遥测值含凭证时应脱敏为 `<redacted>` | `AKIDTEST12345678` 原样输出 | 遥测上报路径未调 redactSecrets | P | 待提单 |
| 5 | P1 | `EXP-E01` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS`（未命中） | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 6 | P1 | `EXP-E02` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 7 | P1 | `EXP-E03` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 8 | P1 | `EXP-E04` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 9 | P1 | `EXP-E05` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 10 | P1 | `EXP-E07` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 11 | P1 | `EXP-E10` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 12 | P1 | `EXP-E11` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 13 | P1 | `EXP-E12` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 14 | P1 | `EXP-E13` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |
| 15 | P1 | `EXP-E14` | serviceCatalog 路由未命中 | 意图应路由到对应华为云工具 | `MISS` | `serviceCatalog` 路由表覆盖不全 | G | 待提单 |

### 根因详情

**#1 [P0] D4-16 MCP 工具命令包裹穿透未拦截**
- 期望：`powershell -Command "Get-Content credentials.json"` → `deny`
- 实际：MCP 工具返回 `allow`（`risk=not_huaweicloud`）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` `classifyTextCommand()` 对 `powershell -Command` 包裹的凭证文件路径未识别为敏感操作
- 证据：`evidence/D4-16/stdout.log`

**#2 [P1] D4-27 双路径输出脱敏不完整**
- 期望：`redactSecrets({ak:'AKID123',sk:'SK...',token:'STS...'})` → 所有字段 `<redacted>`
- 实际：`{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN123"}` 原样返回
- 根因：`safety-policy.mjs:57` `isSecretKeyName(key)` 未匹配 `ak`/`sk`/`token` 短键名
- 证据：`evidence/D4-27/stdout.log`

**#3 [P1] D8-4 引导文档 INSTALL.md 未随 npm 包发布**
- 期望：npm 包含 `INSTALL.md`
- 实际：包内仅有 `README.md`、`README.zh-CN.md`
- 根因：`package.json` `files` 字段未包含 `INSTALL.md`
- 证据：`evidence/D8-4/stdout.log`

**#4 [P1] D8-9 安装 ID 与遥测值未脱敏**
- 期望：遥测值含凭证时应脱敏
- 实际：`AKIDTEST12345678` 原样输出
- 根因：遥测上报路径未调用 `redactSecrets`
- 证据：`evidence/D8-9/stdout.log`

**#5-15 [P1] EXP-E01~E14 serviceCatalog 路由未命中**
- 期望：15 条中文意图经 `huaweicloud_service_catalog` 路由应命中对应工具
- 实际：11 条 `MISS`（基线 21.4% MISS）
- 根因：`serviceCatalog` 路由表覆盖不全
- 证据：`evidence/EXP-E*/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。所有 146 条用例均已执行并回填状态。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-16 是包裹穿透，非误判 read-only）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `hdk-codearts-daily-20261019` (44f83f01-fd3c-498b-8ad4-40d351296a3f) | 是（2026-10-19 10:32:58） | 已删 | ShowVpc 返回 VPC.9904 not found，残留 0 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留 0。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：无（146 条全执行）
- 建议：
  1. D4-16：`classifyTextCommand` 应递归识别 `powershell -Command`/`cmd /c` 包裹的凭证文件路径
  2. D4-27：`isSecretKeyName` 应补充 `ak`/`sk`/`token` 等短键名匹配
  3. D8-4：`package.json` files 应包含 `INSTALL.md`
  4. D8-9：遥测上报路径应调用 `redactSecrets`
  5. EXP-E 系列：`serviceCatalog` 路由表应扩充中文意图覆盖
