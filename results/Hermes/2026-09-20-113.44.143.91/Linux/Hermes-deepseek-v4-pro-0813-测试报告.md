# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-20 19:43（北京时间）
> **执行归档**：`results/Hermes/2026-09-20-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 5 项 P0 缺陷，均为历史缺陷复核，无新增 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro（deepseek-v4-pro-0813） |
| OS / 架构 | Linux（Ubuntu 24.04 aarch64） |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`，release PR `#696`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，含 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | hcloud（KooCLI）已配置，doctor 11/11、status 正常、help exit 0 |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001 实机） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 100 / 展开级 43（init_day 已按 agent+OS 预筛展开级） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 建删归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 / 展开级 43 |
| 已执行 | 设计级 99 / 展开级 42（各 1 条 NOT_RUN：D1-39 Windows专属 / EXP-E08 诊断类） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | `81 / 16 / 0 / 2 / 1` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（展开级） | `31 / 11 / 0 / 0 / 1` |
| 通过率（设计级，分母=99） | `81.8%` |
| P0 / P1 / P2 缺陷 | `5 / 7 / 4`（另 SPEC-MISMATCH 2 项） |
| 红线（I 类）违规 | `0 新增`（D2-4/D4-2/D4-16/D4-27 为历史缺陷复核） |
| 资源释放 | `全部归零`（真云 E2E 建删归零 + D4-13 只读无残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `81` | 有证据且通过 PASS 门禁 |
| FAIL | `16` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `2` | D9-9（cancellation 未声明）、D4-24（确认令牌契约） |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 由 EXP-NR3-10 代表覆盖） |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `31` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 全为 D10-3 中文意图路由同根因叠加（EXP-E01~E14） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `1` | EXP-E08 诊断意图（不适用 serviceCatalog 服务路由） |
| **合计** | **`43`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> **铁律**：缺陷均真实执行后填写；根因已定位到文件:行号；详见 `FINDINGS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-11` | STS 冲突态绕过 R3 拒绝落盘 | `tools.mjs:1214-1231` | G | 历史复核 |
| 2 | P0 | `D2-4` | redactSecrets 漏小写 ak=/sk= | `safety-policy.mjs:34-45` | I | 历史复核 |
| 3 | P0 | `D4-2` | env 打印拦截未覆盖 HW_ 前缀 | `safety-policy.mjs:399` | I | 历史复核 |
| 4 | P0 | `D4-16` | env-dump 被 shell 包裹穿透 | `safety-policy.mjs:398` | I | 历史复核 |
| 5 | P0 | `D4-23` | 全局规则 agent-rules 未注入 | install 流程零命中 | G | 历史复核 |
| 6 | P1 | `D3-S3` | 沙箱预览 URL deploy_check FAIL | `session-manager.mjs` deployCheck | G | 待查重 |
| 7 | P1 | `D3-S7` | 复合意图未拆分 RDS+部署目标 | `tools.mjs:1778-1886` | G | 待查重 |
| 8 | P1 | `D4-8` | Python/Node 钩子策略不一致 | `huaweicloud-safety.py:170-188` | G | 历史复核 |
| 9 | P1 | `D4-17` | hook fail-open | `risk-rule-engine.mjs:105-107` | G | 历史复核 |
| 10 | P1 | `D4-27` | 双路径 redact 漏小写+裸 token | `safety-policy.mjs:34-45`+`hcloud-cli.mjs:587-596` | I | 历史复核 |
| 11 | P1 | `D9-2` | invalid params 无 -32602 | `mcp-protocol.mjs:46-77` | G | 历史复核 |
| 12 | P1 | `D10-3` | 中文意图路由 21.4%（含 11 条 EXP-E*） | `tools.mjs:1778-1886` | G | 历史复核 |
| 13 | P2 | `D3-S5` | 复合/单 ECS 中文意图 MISS | `tools.mjs:1778-1886` | G | 待查重 |
| 14 | P2 | `D4-25` | Python hook 写命令分类未匹配 | `huaweicloud-safety.py` write regex | G | 待查重 |
| 15 | P2 | `D8-1` | 文档工具数漂移 39→40 | 源仓 `AGENTS.md` | P | 历史复核 |
| 16 | P2 | `D8-9` | 遥测值 sanitizeValue 不脱敏 AK/SK/token | `telemetry.mjs` sanitizeValue | G | 待查重 |
| 17 | SPEC | `D4-24` | 确认令牌精确 JSON 契约未实现 | `tools.mjs:1748-1750` | G | 历史复核（#745） |
| 18 | SPEC | `D9-9` | capabilities.cancellation 未声明 | `mcp-protocol.mjs:63` | G | 历史复核 |

> P/G/I 分类：P=产品文档漂移、G=通用产品缺陷、I=红线（I 类，凭证/安全）违规。标注「历史复核」= 与 2026-09-19 及更早已提单缺陷为同一根因，`file_issue.py` 查重后不重复开单。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P2 | NOT_RUN | 调归属 | Windows 专属（npm.cmd EINVAL），Linux 由展开级 EXP-NR3-10 代表覆盖 | 无需改（OS 专属设计，Linux 侧有等价展开级） |
| `EXP-E08` | 展开级 | P1 | NOT_RUN | 改用例 | 诊断类意图（"运行报错如何排查"）不适用 serviceCatalog 服务路由评测 | 该用例归属 serviceCatalog 路由评测不合理，建议改归属到「explain_error/诊断」能力或标注为 N/A |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（本次及 D4-13 只读子账号实测均无明文凭证暴露）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无新增`（D2-4/D4-2/D4-16/D4-27 为历史缺陷复核，非本次引入）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（ak/sk 均已 `***` 前缀化或 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 是（真云 E2E） | 已删 | ShowServer=DELETED，count=0 |
| VPC / Subnet | 是（真云 E2E） | 已删 | ShowVpc=VPC.9904 not found |
| OBS 桶 | 是（真云 E2E） | 已删 | 删桶归零 |
| 沙箱会话 | 是（scenarios3） | 已关 | close-session ok |
| D4-13 只读子账号写入 | 否（IAM 拒绝） | — | ListVpcs name=hdk-ro-probe 无残留 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。本次 D4-13 只读子账号 CreateVpc 被 IAM 拒绝（VPC.0010 PolicyNotAuthorized），未产生任何资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（cancellation 未声明）、`D4-24`（确认令牌契约，已开 #745）
- 本轮未覆盖（范围说明）：真实 Agent 会话评测（D10-1/2/5/9 需 DSH headless 或 CDP 自动化，本机为 Hermes 非 DSH 客户端）
- 本轮修正说明：D1-66 前轮误用环境变量名 `TELEMETRY` 导致误报 FAIL，本轮改用实现真实读取的 `HUAWEICLOUD_DEVKIT_TELEMETRY` 复测 → PASS；D4-13 前轮 env 注入被 admin 凭证 configuredBySession 拦截且 hcloud 不读 HW_ACCESS_KEY env，本轮清 HW_SECURITY_TOKEN 并直接 `--cli-access-key/--cli-secret-key` 注入只读子账号 → 写命令干净验证 IAM PolicyNotAuthorized
- 建议：中文意图路由（D10-3/D3-S5/D3-S7 同根因）为最高优先级体验缺陷，建议优先重构 routeMap 增加 CJK 关键字与服务别名