# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-13 20:34:49（北京时间）
> **执行归档**：`results/OpenCode/2026-10-13-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（3 FAIL + 3 SPEC-MISMATCH，含 3 P0；另 3 NOT_RUN 为真云 E2E 代表终端归属）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + deepseek-v4-pro-0813 |
| OS / 架构 | Windows（win32，x86_64） |
| 机器 IP | 119.8.181.45 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.8（npm latest，gitHead 74f519dc） |
| 工具全集 | 40+（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 已配置 |
| 真云凭证 | cn-north-4（AK/SK 已配置；只读子账号已配置） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/--help）/ MCP 协议 / eval harness |
| 设计真源 | 设计级 107 / 展开级 39（预筛后）/ 追踪表 216 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 MCP `tools.mjs` 工具，决策/结果落 `evidence/<case-id>/stdout.log`；CLI 真机执行记录日志；eval harness 跑 `eval/harness/run-eval.mjs` 获取 serviceCatalog 路由结果。
>
> **证据组织**：真实执行逻辑集中在执行包批处理探针脚本（`_batch_p0.mjs`/`_batch_p1_rest.mjs`/`_batch_p2.mjs`/`_batch_d1~d3.mjs`/`_batch_expanded.mjs`/`_fix_*.mjs`/`_fix_args.mjs`/`_batch_new_cases.mjs`），每个用例在 `evidence/<case-id>/` 下生成独立的 `probe.mjs` 与非空 `stdout.log`（本机新鲜执行输出）。PASS 门禁 `verify_no_fake_pass.py` 已通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146 |
| PASS / FAIL / SPEC-MISMATCH / BLOCKED / NOT_RUN | 137 / 3 / 3 / 0 / 3 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 95.8% |
| P0 / P1 / P2 缺陷 | 3 / 2 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮为源码级探针 + MCP 工具调用，未建删云资源） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 99 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-16、D4-17 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 3 | D4-3、D2-12、D8-9 |
| NOT_RUN | 3 | D3-C1/C2/C3（真云 E2E 代表终端=Hermes） |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由未命中「云主机」 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | sh -c/eval 包裹内层凭证泄露命令穿透 | 对包裹命令返回 `deny` | `riskDecision=allow` 未识别内层命令 | `cloud-risk-rules.json:14/35` + `risk-rule-engine.mjs evaluate` 未复用 `extractInnerCommand` | P | 待提单 |
| 2 | P0 | `D4-17` | hook 对非法/截断 stdin JSON fail-open | 异常输入默认 deny（fail-closed） | 静默 `return`，不 deny | `huaweicloud-safety.mjs:47` catch 块未 fail-closed | P | 待提单 |
| 3 | P0 | `D4-3` | csms show-secret/download-secret 未拦截 | agent-rules 规定 MUST NOT，应 deny | 分类 read_only/unknown，未 deny | `safety-policy.mjs` classifyTextCommand csms 未列入 deny | P | 待提单 |
| 4 | P1 | `D2-12` | R10 预期 sync 返回 ok:false+suppressed | runtime 非空时返回 `ok:false + suppressed` | 返回 `needs_confirmation`（R2 冲突流） | `tools.mjs` auth_switch handler 走 R2 而非 R10 | G | 待提单 |
| 5 | P1 | `EXP-E01` | serviceCatalog 路由未命中「云主机」 | `recommendedServices` 含 `"ECS"` | 返回兜底 `"Run hcloud --help..."` | `tools.mjs:1987-2000` ECS keywords 缺 `'云主机'` | P | 待提单 |
| 6 | P2 | `D8-9` | sanitizeValue 不脱敏 AK/SK | 移除 AK/SK/token 敏感值 | 仅截断长度/去空白，AK 明文残留 | `telemetry.mjs` sanitizeValue 无敏感字段脱敏 | G | 待提单 |

> **根因详情已逐条落 `FINDINGS.md`（标准格式，供 `file_issue.py` 解析）**，此处不重复粘贴代码片段。关键根因：
> - D4-16：`cloud-risk-rules.json` 锚点 `^|\s` 不匹配 `sh -c "..."` 内层命令；risk 引擎未复用 `extractInnerCommand`。
> - D4-17：`hooks/huaweicloud-safety.mjs:47` `catch { return; }`。
> - D4-3：csms show-secret/download-secret 未列入 safety-policy deny 集。
> - EXP-E01：`tools.mjs:1995-2000` ECS keywords 列表无 `'云主机'`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | NOT_RUN | 调归属+补环境 | 真云 ECS 生命周期 E2E（购买→ACTIVE→删除含磁盘→归零）为贵资源全链路，`agent` 列标「Hermes 代表终端」；本客户端(OpenCode)非代表，且需参考 ECS 实例+预算。已通过 `plan_cli_command` 验证写操作走确认流（risk=write+approvalToken），未建删真实 ECS。 | 归属列 `agent` 保留 Hermes 代表即可；如需 OpenCode 覆盖，须明确最低规格 ECS 参考实例与预算。 |
| `D3-C2` | 设计级 | P1 | NOT_RUN | 调归属+补环境 | OBS 静态站部署 E2E（build→obsutil 上传→public-read→curl200→清理）`agent` 列标「Hermes 代表终端」；本机未装 obsutil，需真云 OBS 桶。已通过 `plan_cli_command` 验证 OBS 写操作确认流。 | 归属列保留 Hermes 代表；补 obsutil + 测试 OBS 桶后可复测。 |
| `D3-C3` | 设计级 | P1 | NOT_RUN | 调归属+补环境 | 沙箱部署 E2E（connect→upload→deploy→URL 可达→close）`agent` 列标「Hermes 代表终端」；需沙箱 DevStation 配额。已通过 `tools/list` 验证 11 个沙箱工具注册。 | 归属列保留 Hermes 代表；补 DevStation 配额后可复测。 |

> 说明：D3-C6（沙箱 7 隐式工具具名冒烟）已真机执行（7 工具注册 + `sandbox_check_user` 返回结构化实名/协议状态）标 PASS；D3-C7（跨区域引导）已真机执行（`get_regional_availability` + `plan_cli_command` 含 `--cli-region=ap-southeast-3` + `list_regions` 命中）标 PASS。真云「建删资源归零」级 E2E（D3-C1/C2/C3）为代表终端 Hermes 归属，本轮如实标 NOT_RUN 并给出分类+原因。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（证据目录无原始凭证/未脱敏日志）
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证
- [x] 安全缺陷：D4-16（命令包裹穿透，P0）、D4-3（csms show-secret 未拦截，P0）、D4-17（hook fail-open，P0）需关注

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / VPC / OBS / 沙箱等 | 否 | N/A | 本轮为源码级探针 + MCP 工具调用，未建删真云资源 |

> 本轮为源码级探针 + eval harness + MCP 工具调用，未创建/删除真云资源。

---

## 八、遗留与建议

- 待提单缺陷：D4-16、D4-17、D4-3（P0 安全）、D2-12（SPEC）、EXP-E01（路由）、D8-9（脱敏）→ 见 FINDINGS.md，统一提单（历史查重由 file_issue.py 执行）。
- 本轮未覆盖（说明范围）：真云 E2E 建删资源（D3-C1/C2/C3，代表终端=Hermes）。
- eval harness 路由准确率：13 HIT / 1 MISS / 1 N/A = 92.9%（分母=HIT+MISS=14），较基线（21.4% MISS）大幅改善，仍有「云主机」关键词缺口（EXP-E01）。
- 建议：ECS keywords 补 `'云主机'`；risk-rule-engine 复用 `extractInnerCommand` 拆解 shell 包裹；hook catch 改 fail-closed；csms show-secret/download-secret 列入 deny 规则；sanitizeValue 增加敏感字段脱敏。