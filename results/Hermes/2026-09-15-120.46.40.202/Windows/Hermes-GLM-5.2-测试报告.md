# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-15 18:42:10（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.4（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（3 FAIL + 1 SPEC-MISMATCH + 5 BLOCKED，P0 有缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + GLM-5.2 |
| OS / 架构 | Windows 10 (x86_64) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.8 / Python 3.11.15 |
| 被测版本 | huaweicloud-devkit@1.1.4 (stable) |
| hdk commit | 9b67256e |
| 工具全集 | 39（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | 未使用（无 AK/SK，真云用例标 BLOCKED） |
| 测试类型 | 源码级探针 + 真机 CLI（doctor/status/version） |
| daily 基础用例 | 设计级 77 / 展开级 21 |
| 执行时间 | 2026-09-15 18:35~18:42 (CST) |
| 机器 IP | 120.46.40.202 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 77 + 展开级 21 = 98 |
| 已执行 | 98 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 89 / 3 / 5 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC = 93） | 95.7% |
| P0 缺陷 | 3 FAIL + 1 SPEC-MISMATCH |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无真云操作） |

门禁校验：
- ✅ PASS 门禁通过：所有 PASS 用例均有 evidencePath 且证据文件存在
- ✅ 覆盖率门禁通过：P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 68 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | 不符预期，根因见缺陷清单 |
| BLOCKED | 5 | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | 1 | 契约漂移，待裁决 |
| NOT_RUN | 0 | 无 |
| **合计** | **77** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 20 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-NR3-09 spawnSync EINVAL |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无 |
| **合计** | **21** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | echo 凭证变量未拦截 | `classifyTextCommand('echo $HUAWEICLOUD_SDK_AK').decision === 'deny'` | 返回 `allow/not_huaweicloud` | `safety-policy.mjs:335` | 已知缺陷 #677/#688 |
| 2 | P0 | D4-16 | Shell 包裹命令穿透 | `classifyTextCommand('sh -c "hcloud ECS DeleteServer"').decision === 'deny'` | 返回 `allow/not_huaweicloud` | `safety-policy.mjs:345` | 已提单 #690 |
| 3 | P0 | D4-22 | 公网暴露规则误报 | `evaluateDeployPlan(safePlan)` 不应含 `hwc-functiongraph-public-no-auth` 当 `public_access=false` | 安全配置也触发告警 | `risk-rule-engine.mjs` | 待提单 |
| 4 | P0 | EXP-NR3-09 | spawnSync EINVAL | `spawnSync('npm.cmd', ['--version'], {shell:false}).error?.code !== 'EINVAL'` | `error.code=EINVAL, status=null` | `update-check.mjs` queryDistTagsSync | 已知缺陷 #677 |

### 根因详情

**#1 [P0] D4-2 echo 凭证环境变量未拦截**
- 期望：`echo $HUAWEICLOUD_SDK_AK` → `deny`
- 实际：返回 `allow/not_huaweicloud`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — 环境变量检测正则 `/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i` 不包含 `echo` 命令
- 证据：`evidence/D4-2/stdout.log`
- 状态：已知缺陷 #677/#688（fix PR #688 open），本次复现确认

**#2 [P0] D4-16 Shell 包裹命令穿透安全分类器**
- 期望：`sh -c "hcloud ECS DeleteServer"` → `deny`
- 实际：返回 `allow/not_huaweicloud`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:345` — `splitSimpleCommand` 按空格分割后 `sh` 被当作 service，内层 hcloud 命令未被提取
- 证据：`evidence/D4-16/stdout.log`
- 状态：已提单 #690

**#3 [P0/SPEC] D4-22 hook_check_deploy_plan 公网暴露规则误报**
- 期望：当 `public_access=false` 时，不应触发 `hwc-functiongraph-public-no-auth`
- 实际：安全配置也触发 `severity=warn` 告警
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 规则匹配 FunctionGraph CreateFunction 动作但不检查 `public_access` 字段值
- 证据：`evidence/D4-22/stdout.log`
- 状态：待提单

**#4 [P0] EXP-NR3-09 spawnSync('npm.cmd') EINVAL**
- 期望：`spawnSync('npm.cmd', ['--version'], {shell:false})` 不应返回 EINVAL
- 实际：`error.code=EINVAL, status=null`；使用 `shell:true` 则正常 `status=0, stdout=10.9.2`
- 根因：Node.js 在 Windows 上 `spawnSync` 不带 `shell:true` 时无法执行 `.cmd` 文件
- 证据：`evidence/EXP-NR3-09/stdout.log`
- 状态：已知缺陷 #677 (D1-39)，本次复现确认

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 需真实 Agent+插件 E2E 交互环境，当前为源码级探针，无法端到端验证安全干预有效性 | 无需改用例，需补 Agent 会话环境 |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 需真云 AK/SK 凭证验证最小权限通过率，本机未配置真云凭证 | 无需改用例，需补 AK/SK |
| D6-1 | 设计级 | P2 | BLOCKED | 补环境 | 需 MCP 服务器运行测量检索响应延迟 | 无需改用例，需 MCP 服务器 |
| D6-3 | 设计级 | P2 | BLOCKED | 补环境 | 需 MCP 服务器运行测量冷启时间 | 无需改用例，需 MCP 服务器 |
| D6-4 | 设计级 | P2 | BLOCKED | 补环境 | 需 MCP 服务器运行验证并发调度 | 无需改用例，需 MCP 服务器 |

---

## 六、安全/红线

- ✅ 真云资源：无真云操作（无 AK/SK），未创建/删除任何云资源
- ✅ 凭证安全：所有测试使用模拟数据，无真实 AK/SK 泄露风险
- ✅ 红线遵守：只提交 `results/Hermes/` 目录，未碰 Summary/其他客户端/test-cases 母版
- ✅ PASS 门禁：所有 PASS 用例均有 evidencePath 且证据文件存在
- ✅ 覆盖率门禁：P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%

---

## 七、资源释放

- 无云资源需释放（本次测试全部为源码级探针 + CLI 真机检查，未操作真实云资源）
- 已清理 hdk 目录下的临时探针文件（probe-p0-verify.mjs, probe-p1-comprehensive.mjs, probe-p1b.mjs）

---

## 八、遗留建议

1. **D4-2 修复建议**：在 classifyTextCommand 的环境变量检测正则中加入 `echo` 命令模式，或检测 `$HUAWEICLOUD_*` / `%HUAWEICLOUD_*%` 变量引用
2. **D4-16 修复建议**：在 classifyTextCommand 中增加 shell 包裹解包逻辑（识别 `sh -c`/`bash -c`/`eval`/`cmd /c` 并提取内层命令）
3. **D4-22 修复建议**：修改 `hwc-functiongraph-public-no-auth` 规则，仅在 `public_access=true` 或存在 `0.0.0.0/0` endpoint 时触发
4. **EXP-NR3-09 修复建议**：在 `queryDistTagsSync` 中使用 `shell:true` 调用 `spawnSync('npm.cmd')`，或改用 `queryDistTagsFetch`（fetch-based）
5. **doctor 检查**：doctor 显示 MCP server can start (CodeArts Work)，但 status 显示 Hermes Agent 未安装插件——这是多 Agent 机器上的预期行为（devkit 安装给了 CodeArts Work，未给 Hermes 单独安装）
