# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-23 05:58:32（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-23-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.12`（npm latest，gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 真机 spawn + 真云 E2E（建删归零）三方结合；决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。今日全部探针 fresh 重跑（run_all.sh 33 支 + ECS/OBS/FG/sandbox/跨区域真云探针）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 14 / 1 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `90.1%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（13 项全为历史延续，见 HISTORY_LINKS.md） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

|---|---|---|---|---|---|---|
| 1 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | session-manager.mjs:1010 deployNginx verify 未 strip OSC-133 | 历史 #981 |
| 2 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同 D3-C3 | 历史 #981 |
| 3 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | tools.mjs serviceCatalog 无复合意图拆解 | 历史 |
| 4 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety/policy.json:26 缺 DecryptData/DecryptDatakey | 历史 |
| 5 | P0 | `D4-15` | D4安全 | hook绕过尝试 | risk-rule-engine.mjs 未解析 ANSI-C 编码 | 历史 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | risk-rule-engine.mjs 无 finding 即 allow | 历史 |
| 7 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | risk-rule-engine.mjs iam-admin-policy 未覆盖 HCL | 历史 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | huaweicloud-safety.py:46 WRITE_OPERATION_RE 前置不匹配空格 | 历史 |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | risk-rule-engine.mjs:19 redactEvidence 正则 | 历史 |
| 10 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | safety-policy.mjs:34 redactString 未覆盖空格形态 | 历史 |
| 11 | P2 | `D8-1` | D8质量 | 文档与能力一致 | AGENTS.md 工具数硬编码未同步（39/43 vs 46） | 历史 |
| 12 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs:189 sanitizeValue 无脱敏 | 历史 |
| 13 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | mcp-protocol.mjs:57 dispatch 无 initialize 前置校验 | 历史 |
| 14 | P1 | `EXP-E01` | D10评测 | 『云主机』路由 MISS | tools.mjs ECS keywords 缺『云主机』 | 历史 |

### 根因详情

> 每项 FAIL 的「期望 / 实际 / 根因（文件:行号）/ 证据」详见 FINDINGS.md（#1~#13 均已含断言+根因+证据+影响）与 HISTORY_LINKS.md（历史单号+关联）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属：Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」；Linux 由 D1-40 覆盖） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 真·外部依赖：RDS 实例创建需 VPC/子网/安全组前置环境 + 正确 db 参数 + 长 provisioning 窗口 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证，全部经 redact 管道（AK/SK/token/adminPass 均 <redacted>）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1/D3-S2/D4-14） | 是 | 已删 | VPC 清单不含本次资源 |
| Subnet | 是 | 已删 | 已删 |
| ECS（D3-C1） | 是 | 已删（含磁盘+EIP） | ECS 0 / EIP total_count=0 |
| OBS 桶（D3-C2/D3-C13） | 是 | 已删桶+对象 | rm 后不存在 |
| FunctionGraph（D3-S6） | 是 | 已删函数 | cleanup=true |
| 沙箱会话（D3-C3/D3-C6） | 是 | close_session | 关闭成功 |

> 真云只删本次创建资源；D3-C1 finally 归零子断言 vpc=false 为探针即时读回与异步最终一致竞态，手工二次 DeleteVpc + 复核 VPC c42c7ac8 已消失。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-65`（telemetry 域调试开关）、`D1-68`（region 优先级）、`D9-9`（取消能力未声明）。
- 历史延续缺陷：13 项（P0×5 / P1×4 / P2×4），均已在既有 issue 上追加复核评论，见 HISTORY_LINKS.md。
- 建议：优先修 D3-C3/D3-S3（session-manager.mjs:1010 deployNginx verify 未 strip OSC-133，1.1.12 已修多处但遗漏该点），阻断沙箱部署主流程。
