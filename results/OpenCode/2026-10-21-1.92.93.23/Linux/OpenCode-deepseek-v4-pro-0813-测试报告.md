# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-21 05:20:00（北京时间）
> **执行归档**：`results/OpenCode/2026-10-21-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 12 FAIL + 3 SPEC-MISMATCH，P0 缺陷 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（x64） |
| Node / npm / Python | `Node v22.13.0 / npm 10 / Python 3.12` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.10`（npm latest 正式版，gitHead `b0e9f026`） |
| 工具全集 | `43`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12`（配对 7.3.12，version_mismatch 提示 reinstall） |
| 真云凭证 | `cn-north-4`（AK/SK 主账号 + 只读子账号 test001，已具备执行条件） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 用例 | 设计级 107 / 展开级 39（含 mission-001 打标） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数或 MCP `callTool`，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E（ECS/VPC/OBS/沙箱 建删归零）由 `realcloud-probe` + heavy 探针真机执行。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = D1-39 Windows 专属 OS 豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `91.5%` |
| P0 / P1 / P2 缺陷（FAIL+SPEC 15 项） | `4 / 6 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（VPC/子网/ECS/OBS/沙箱，仅删本次创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `3` | D8-9 / D9-9 / D10-4 契约漂移 |
| NOT_RUN | `1` | D1-39（Windows 专属，本机 Linux） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机 MISS） |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截未覆盖裸 access_key | `src/safety-policy.mjs:546` | 待提单 |
| 2 | P1 | D4-6 | adminPass 回显警告与脱敏不覆盖空格/JSON 形态 | `safety/rules/cloud-risk-rules.json:74` | 待提单 |
| 3 | P1 | D4-17 | hook 模糊/畸形输入 fail-open | `src/risk-rule-engine.mjs:103` | 待提单 |
| 4 | P0 | D4-21 | HCL 宽 IAM 制品未拦截 | `safety/rules/cloud-risk-rules.json:196-218` | 待提单 |
| 5 | P2 | D4-25 | Python hook 写操作遥测误分类 cli:invoke | `hooks/huaweicloud-safety.py:46` | 待提单 |
| 6 | P2 | D4-26 | findings.evidence 脱敏不覆盖 JSON 带引号 key | `src/risk-rule-engine.mjs:22-23` | 待提单 |
| 7 | P1 | D3-S3 | 沙箱预览 URL 未返回（deploy_nginx 假阴性） | `src/sandbox/session-manager.mjs:814-820` | 待提单 |
| 8 | P2 | D3-S5 | 复合意图分层路由未分解 | `src/tools.mjs:2023-2277` | 待提单 |
| 9 | P2 | D3-S6 | FunctionGraph 最小参数创建失败 | `src/tools.mjs:1854` | 待提单 |
| 10 | P1 | D3-S7 | 跨服务复合意图 + RDS 最小实例创建失败 | `src/tools.mjs:1859` | 待提单 |
| 11 | P0 | D9-12 | initialize 握手协议安全基线两处缺口 | `src/mcp-protocol.mjs:32-59` | 待提单 |
| 12 | P1 | EXP-E01 | serviceCatalog「云主机」未命中 ECS | `src/tools.mjs:2033-2037` | 待提单 |
| 13 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `src/telemetry/telemetry.mjs:189-197` | 待提单 |
| 14 | P1 | D9-9 | capabilities 未声明 cancellation（SPEC） | `src/mcp-protocol.mjs:47-49` | 待提单 |
| 15 | P0 | D10-4 | 规则库计数契约漂移 16→19（SPEC） | `safety/rules/cloud-risk-rules.json` | 待提单 |

> 逐项现象/断言/根因/证据详见 `FINDINGS.md`（同目录）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属「Windows 升级检测链可用性」，本机为 Linux，不适用 | OS 列已标「专属」，Linux 侧由 disttags 探针（queryDistTagsSync 无 EINVAL）代表覆盖，无需改用例 |

> 其余 145 条均已在真机/源码级/真云实际执行并回填，无 BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录均经 redact 处理，无明文 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-5 写操作均判 deny，只读判 allow）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（probe 统一 redact）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC + 子网（D3-C1/D3-S2/D4-14/realcloud） | 是 | 已删 | ListVpcs 不含本次资源 ✓ |
| ECS（D3-C1） | 是 | 已删（含磁盘） | ListServers 不含本次 ✓ |
| OBS 桶（D3-C2/D3-C13） | 是 | 已删（rm -r -f） | 桶已移除 ✓ |
| 沙箱会话（D3-C3/D3-C6/D3-S3） | 是 | 已 close_session | 会话关闭 ✓ |
| EIP / RDS / FunctionGraph | 否（未创建/清理归零） | — | 归零 ✓ |

> 真云只删本次创建资源；D4-13 只读子账号写操作 CreateVpc 返回 PolicyNotAuthorized（writeDenied=true），未创建任何资源（residualZero=true）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D8-9`（sanitizeValue 脱敏契约）、`D9-9`（cancellation 声明）、`D10-4`（规则库计数 16→19）。
- 本轮覆盖：设计级 107 + 展开级 39 全量；源码级探针 + MCP 协议 + 真机 CLI + 真云 E2E（ECS/VPC/OBS/沙箱建删归零）已全部执行。
- 建议：优先修 P0 项（D4-2 env-dump 前缀、D4-21 HCL 宽 IAM、D9-12 initialize 安全基线、D10-4 规则计数口径）。