# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-16`（北京时间）
> **执行归档**：`results/Hermes/2026-09-16-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（设计级 9 项产品缺陷：5 P0 + 3 P1 + 1 P2；展开级 12 条 FAIL 为同一根因 D10-3 叠加）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS，IP 113.44.143.91） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`，release PR `#696`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS 实测，新增 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | KooCLI 7.2.12（doctor 确认） |
| 真云凭证 | cn-north-4（AKSK 已配置；本轮真机建删 VPC/安全组并归零验证） |
| 测试类型 | 源码级探针 + 真机 CLI（install/doctor/status）+ MCP 协议 + 真云 E2E + D10 评测 harness |
| daily 基础用例 | 设计级 78 / 展开级 48（Hermes+Linux 预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。本轮重点覆盖 v1.1.5 的凭证安全（D2/D4）、Python/Node 钩子一致性（D4-8）、全局规则注入（D4-23）、文档一致性（D8）、服务路由（D10）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 126（设计级 78 + 展开级 48） |
| 设计级 PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 68 / 9 / 0 / 0 / 1 |
| 展开级 PASS / FAIL / BLOCKED / NOT_RUN | 36 / 12 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 88.3%（68/77）；展开级 75.0%（36/48） |
| P0 / P1 / P2 缺陷 | 5 / 3 / 1（详见 FINDINGS.md） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮 Hermes 建删资源全部归零验证通过 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 68 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | D2-11/D2-4/D4-2/D4-16/D4-23（P0）、D4-8/D4-17/D10-3（P1）、D8-1（P2） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | D1-39 Windows 专属（Linux 由展开级 EXP-NR3-10 代表覆盖） |
| **合计** | **78** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | EXP-C4-* 服务矩阵 + EXP-E06/E09/E15 路由命中 + NR3/D1-58/D5-8 探针 |
| FAIL | 12 | EXP-E01~E05/E07/E08/E10~E14（中文意图路由 MISS，同 D10-3 根因） |
| BLOCKED / NOT_RUN | 0 | 已全部消解 |
| **合计** | **48** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 缺陷均真实执行后填写；根因为 v1.1.5 源码文件:行号；完整根因/证据见 FINDINGS.md。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-11` | STS 临时凭证冲突态绕过 R3 拒绝落盘 | `{status:error, scope:rejected}` | `status=needs_confirmation` | `tools.mjs:1214-1235` |
| 2 | P0 | `D2-4` | redactString 漏小写 ak=/sk= | `ak=AK123456 sk=SKsecret` 应脱敏 | 原样返回（对象形态正常脱敏） | `safety-policy.mjs:45` |
| 3 | P0 | `D4-2` | 凭证 env 打印未覆盖 HW_ 前缀 | `env \| grep HW_ACCESS_KEY` 应 `deny` | `allow risk=not_huaweicloud` | `safety-policy.mjs:397-400` |
| 4 | P1 | `D4-8` | Python/Node 钩子策略不一致 | 同输入应判定一致 | Node `deny` / Python 放行 | `hooks/huaweicloud-safety.py:166-188` |
| 5 | P0 | `D4-16` | env-dump 被 shell 包裹穿透 | `sh -c "env \| grep ..."` 应 `deny` | `allow` | `safety-policy.mjs:398` |
| 6 | P1 | `D4-17` | hook 模糊 fail-open | 异常输入应默认拒绝 | 默认 `allow`/放行 | `risk-rule-engine.mjs:105-107` |
| 7 | P0 | `D4-23` | 全局规则 huawei-agent-rules.md 未注入 | 安装应产出并注入该制品 | 未找到 `huawei-agent-rules.md` | 源码零命中（未实现注入） |
| 8 | P2 | `D8-1` | 文档工具数漂移（39→40） | 文档与实现一致（40） | AGENTS.md 仍写 39 | `AGENTS.md:27,45` |
| 9 | P1 | `D10-3` | serviceCatalog 中文路由缺失 | 中/英意图均命中；≥90% | 中文 21.4% 回退 | `tools.mjs:1778-1908` |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（npm.cmd spawnSync 无 shell:true EINVAL）；Linux 由展开级 EXP-NR3-10（54 条通用断言）代表覆盖 | — |

> 展开级「不涉及本客户端/OS」已在建包时剔除（init_day 预筛），无跨客户端展开级残留。本轮 BLOCKED = 0，NOT_RUN 仅 1 条（OS 专属 P0 豁免，已由对应展开级覆盖）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 show_profile_redacted / D4-2 均使用假凭证；脱敏探针未落真 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`（真云仅建删本次创建资源，测后归零验证通过）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以 `<redacted>` 指纹出现）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 VPC（D4-14） | 是 | 已删 | ListVpcs 不含本次资源 = 通过 |
| 真云安全组（D4-19） | 是 | 已删 | 归零核实通过 |
| 隔离 HERMES_HOME（install/uninstall 测试） | 是 | 已删 | 退出即清理 |
| 临时 HUAWEICLOUD_HOME / skip 临时文件 | 是 | 已删 | mkdtemp 随探针退出清理 |

> 真云只删除本次 Hermes 创建资源；删除前全量盘点，未触碰既有/他人资源。Hermes 自身残留 = 0。

---

## 八、遗留与建议

- 待裁决 SPEC：无。
- 观察（非缺陷）：
  1. v1.1.5 相对 v1.1.4 的部分修复已落地（`printenv HW_*` deny、shell 包裹破坏性命令 deny、未知 method `-32601`），但 env-dump 裸命令 `env | grep HW_*`、shell 包裹 env-dump、Python/Node 钩子不一致、fail-open、中文路由等仍残留（见 FINDINGS.md 逐项根因）。
  2. 工具全集实测 `40`；新增 `huaweicloud_obs_set_website_config` 尚未同步源仓 AGENTS.md 工具数（D8-1）。
  3. `serviceCatalog` routeMap 仅 2/23 含 CJK 关键字，中文意图大面积 miss（#9）。
- 本轮已覆盖：真实云 E2E（建删 VPC/安全组 + 归零验证）、Python/Node 钩子一致性（D4-8）、全局规则注入（D4-23）、认证/脱敏（D2-4/D2-11）、文档一致性（D8-1）、服务路由（D10-3）。
- 建议：上游按 FINDINGS.md 逐项修复，重点补 `HW_` 前缀 env-dump、STS 凭证冲突态 R3 校验、Python 钩子规则对齐、huawei-agent-rules.md 注入实现。