# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-13（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-13-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（4 项 FAIL，全部为 v1 历史缺陷在 v2 代码基上的复现，无新增产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64，Ubuntu 24.04，kernel 6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v2.0.0-next.3`（npm `@next`，gitHead `4b718720`）|
| hcloud / 依赖 | `KooCLI 7.2.12`（doctor 已配置；预计 7.3.12 有 version_mismatch 提示） |
| 真云凭证 | `cn-north-4`（AK/SK，统一账号 hw018619646；只读子账号 test001 用于 D4-13） |
| daily 基础用例 | 设计级 107 / 展开级 39 / 追踪表 216 / 使命 9 |

> **执行方法**：SUT 已从 v1.1.14-next.2（47 工具 .mjs）切换为 **v2.0.0-next.3（56 工具 TypeScript 重写，gitHead 4b718720）**。探针直接 import npm 全局包 `dist/*.js` 产物（safety-policy / risk-rule-engine / tools / capability-catalog / telemetry / hcloud-cli 等）导出函数做源码级断言；协议用例经 stdio 驱动 `dist/mcp-server.js`；真云 E2E 经 `DEVKIT_APPROVAL_MODE=ask` posture 以 `approvedByUser:true` 驱动真实建删（ECS/VPC/EIP/OBS/FunctionGraph/沙箱），测后逐一归零验证。证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = D1-39 Windows 专属，OS 结构性不适用） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 4 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `97.2%` |
| P0 / P1 / P2 缺陷 | `0 / 2 / 2`（全部 v1 历史缺陷 v2 复现，无新增） |
| 红线（I 类）违规 | `0`（无凭证泄漏、无写操作误判 read-only、真云全归零） |
| 资源释放 | `全部归零`（ECS/VPC/EIP/OBS/FunctionGraph 均测后删除，人工二次核实 0 残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `103` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | D1-65 / D4-27 / D8-9（历史复现） |
| BLOCKED | `0` | 无环境阻塞（真云正常） |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 结构性不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文「云主机」路由 MISS（历史复现） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P2 | `D1-65` | 调试模式环境变量契约漂移（telemetry 域 '1' 不生效） | `src/telemetry/telemetry.ts:168` 仅 `=== 'true'` | 历史问题 |
| 2 | P1 | `D4-27` | 双路径输出脱敏缺口（空格分隔形态泄露 AK/SK） | `src/safety/redact.ts:36` 仅匹配 `[:=]` 分隔 | 历史问题 |
| 3 | P2 | `D8-9` | 安装 ID 与遥测值脱敏缺口（sanitizeValue） | `src/telemetry/telemetry-values.ts:27-33` 无敏感值脱敏 | 历史问题 |
| 4 | P1 | `EXP-E01` | 中文意图「云主机」路由 MISS | `src/capability-catalog.ts:31-40` ECS keywords 缺「云主机」 | 历史问题 |

### 根因详情

1. **[P2] D1-65**：`update-registry.ts:44` 支持 `DEBUG=1||true`，`telemetry/telemetry.ts:168` 仅 `=== 'true'`（`'1'` 不生效）→ 契约「DEBUG=1/true 均开启」漂移（telemetry 域）。证据 `evidence/D1-65/stdout.log`。
2. **[P1] D4-27**：`redactSecrets("--access-key AKIA... --secret-key sk...")` 空格分隔形态未脱敏（`=` 形态正常）。根因 `redact.ts:36` `redactString` 仅匹配 `key[:=]value`。证据 `evidence/D4-27/stdout.log`。
3. **[P2] D8-9**：`sanitizeValue("AK=... token=...")` 原样保留敏感值（仅 trim+截断）。根因 `telemetry-values.ts:27-33` 无敏感值脱敏。证据 `evidence/D8-9/stdout.log`。
4. **[P1] EXP-E01**：中文意图「帮我查一下我账号在华北北京四有哪些云主机」路由 MISS。根因 `capability-catalog.ts` ECS keywords 缺「云主机」同义词。D10-3 准确率 92.9%（HIT=13 MISS=1 N/A=1）。证据 `evidence/EXP-E01/stdout.log`。

> 以上 4 项经 `file_issue.py` 历史查重，均命中上游既有 open issue（见 `HISTORY_LINKS.md`），本次不重复开单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属（Windows EINVAL 语义），本机 Linux 结构性不适用；Linux 侧由 D1-40 镜像 lag 用例覆盖。分类【调归属】 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（show_profile_redacted / redactSecrets `=` 形态 / D9-13 均无明文凭证泄漏；D4-27 空格形态为历史脱敏缺口，已在缺陷清单）
- [x] 写操作误判 read-only：`0`（plan 写操作均 decision=deny；D4-5/D4-18 验证通过）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：`通过`（D2-4/D4-6/D9-13 复核无明文；仅 D4-27 空格形态历史缺口）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC | tctest-openclaw-c1/audit/s2/s2b/c5 等 | DeleteVpc | ListVpcs 0 残留 ✅ |
| EIP | 无 tctest-openclaw 前缀 | — | ListPublicips 0 残留 ✅ |
| OBS | tctest-openclaw-obs-*/web-*/web2-* | obsutil rm -f | obsutil ls 0 残留 ✅ |
| FunctionGraph | tctest-openclaw-fn-* | DeleteFunction | ListFunctions 0 残留 ✅ |
| 沙箱 | connect(ephemeral pool) | close_session | 正常关闭，无计费残留 ✅ |

> 测试侧残留污染：本机 `~/.config/huaweicloud/proxy.json` 残留 `proxy.example:8080` 虚假代理，已备份移除（`proxy.json.bak-20261113`），非产品缺陷。

---

## 八、遗留与建议

- **v2 迁移说明**：本日 SUT 已切换 v2.0.0-next.3（56 工具 TypeScript 重写 + vendor gate + DEVKIT_APPROVAL_MODE=ask posture），47→56 工具差异是 v2 的**契约升级**（新增 gateway/packs/secrets 系列工具），非缺陷；协议用例均按 56 工具口径通过。
- **4 项 FAIL 均为 v1 历史缺陷的 v2 复现**：D1-65（telemetry DEBUG）、D4-27（空格形态脱敏）、D8-9（sanitizeValue）、EXP-E01（云主机路由），已在上游 open issue 跟踪，无需新开单。
- **D1-70 proxy.json 污染**（测试侧，非产品缺陷）：真云探针需在每次执行前清理 `~/.config/huaweicloud/proxy.json` 残留，否则 voucher/region 类工具会因 `lookup proxy.example` 失败。建议维护侧在 `prepare_env.py` 增加 proxy.json 残留自检。
- **D8-1 文档**：v2 AGENTS.md 已声明 56 tools，与实际一致。
- 遗留建议：v1 历史缺陷在 v2 代码基上仍复现的 3 项（D4-27/D8-9/D1-65）优先级建议上调，因 v2 是主分支方向，历史缺陷若在 v2 冻结前不修复将长期延续。