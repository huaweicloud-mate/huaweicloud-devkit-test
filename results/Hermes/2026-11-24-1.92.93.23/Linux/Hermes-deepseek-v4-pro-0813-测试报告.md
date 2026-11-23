# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-24 05:25（北京时间）
> **执行归档**：`results/Hermes/2026-11-24-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit` v1.1.15，gitHead `bf79b643`）
> **结论**：`FAIL`（P0 缺陷 4 项未修复，均为历史复现，无新增缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes（deepseek-v4-pro-0813） |
| OS / 架构 | Linux x86_64 / Ubuntu 24.04.4 LTS |
| 机器 IP | 1.92.93.23 |
| Node / npm / Python | Node v22.20.0 / npm / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.15`（npm latest，gitHead `bf79b643`） |
| 工具全集 | `49`（tools.mjs TOOL_DEFINITIONS） |
| hcloud | `7.2.12`（doctor 提示与插件配对版本 7.3.12 存在版本差，属 WARN 环境态） |
| 真云凭证 | `cn-north-4`（AKSK 管理员 + test001 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/uninstall）/ MCP 协议 / 真云 E2E |
| daily 用例 | 设计级 107 / 展开级 43（已按本客户端+OS 预筛）/ 追踪表 216 / 使命 mission-001 |

> **执行方法**：探针脚本（.mjs/.sh）直调 `plugins/huaweicloud-core/src/*` 导出函数 + 真机 hcloud 命令 + MCP tools/call，决策/结果落 `evidence/<case-id>/stdout.txt`；证据统一 `evidence/<case-id>/`。全量 46 步探针 + 4 项特殊探针（D4-13/23/24/realcloud-probe）+ 真云 E2E（D3-C1/C2/C3/C6/C7）实机执行。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 107 + 展开级 43 = 150 |
| 已执行 | 设计级 103 + 展开级 43 = 146（4 条 NOT_RUN 为文档比对类/OS 专属） |
| PASS / FAIL / SPEC-MISMATCH / NOT_RUN（设计级） | 86 / 13 / 4 / 4 |
| PASS / FAIL（展开级） | 42 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，设计级） | 86/103 = **83.5%** |
| 通过率（展开级） | 42/43 = **97.7%** |
| P0 / P1 / P2 缺陷 | 4 / 7 / 6（含 SPEC） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（D3-C1 ECS/VPC/subnet 自动轮询超时，已手工补删归零；余 OBS/沙箱/EIP 均探针内归零） |

---

## 三、状态汇总

### 3.1 设计级（107 行）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 86 | 有证据且通过 PASS 门禁 |
| FAIL | 13 | 不符预期，根因见缺陷清单 |
| SPEC-MISMATCH | 4 | 契约漂移/断言 stale，待裁决 |
| BLOCKED | 0 | — |
| NOT_RUN | 4 | D1-39（Windows 专属）+ D8-1/D8-4/D8-6（改用例：文档一致性比对类，本轮未覆盖） |
| **合计** | **107** | |

### 3.2 展开级（43 行）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（与 D10-3 同根因） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单（共 17 项，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截未覆盖 generic `access_key` | safety-policy.mjs:550 | 历史复现 |
| 2 | P0 | D4-21 | hook_check_artifacts 未拦截 HCL broad IAM（AdministratorFullAccess） | cloud-risk-rules.json | 历史复现 |
| 3 | P0 | D9-12 | initialize 握手基线缺 createDevkitMcpServer/toClientInfo | mcp-protocol.mjs:43 | 历史复现 |
| 4 | P0 | D10-4 | 风险规则库条目数漂移 19 vs 16（SPEC） | cloud-risk-rules.json | 历史复现 |
| 5 | P1 | D4-6 | --admin-pass 不告警 + JSON 带引号 key adminPass 未脱敏 | cloud-risk-rules.json / safety-policy.mjs:42 | 历史复现 |
| 6 | P1 | D4-17 | hook 模糊输入 fail-open | risk-rule-engine.mjs:106 | 历史复现 |
| 7 | P1 | D3-S7 | 复合意图部署目标未命中 + RDS CreateInstance 缺前置 | tools.mjs | 历史复现 |
| 8 | P1 | D10-3 / EXP-E01 | serviceCatalog 中文「云主机」意图 MISS（92.9%） | tools.mjs:2574-2587 | 历史复现 |
| 9 | P1 | D9-9 | capabilities.cancellation 未声明（SPEC） | mcp-protocol.mjs | 历史复现 |
| 10 | P1 | D3-S3 | 沙箱预览未返回公网 URL（devbridge_tunnel FAIL） | sandbox/* / tools.mjs | 历史复现 |
| 11 | P1 | D3-C2 | OBS 建桶成功但退出码非 0 | hcloud OBS mb 语义未归一化 | 历史复现 |
| 12 | P2 | D3-S5 | 复合意图分层路由仅命中单一服务 | tools.mjs | 历史复现 |
| 13 | P2 | D3-S6 | FunctionGraph 定时任务创建失败 | tools.mjs | 历史复现 |
| 14 | P2 | D4-25 | Python hook 写操作遥测误分类 cli:invoke | hooks/huaweicloud-safety.py | 历史复现 |
| 15 | P2 | D4-26 | findings 证据脱敏不完整 | risk-rule-engine.mjs:22 | 历史复现 |
| 16 | P2 | D8-9 | sanitizeValue 未做凭证脱敏（SPEC） | telemetry/telemetry.mjs | 历史复现 |
| 17 | P2 | D3-C14 | hdkitConnect 参数契约漂移（SPEC，探针 assertion stale） | tools.mjs:1853-1860 | 历史复现 |

> 根因详情、精确断言、复现证据见同目录 `FINDINGS.md`（格式可供 `file_issue.py` 解析）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux/macOS 由 NR3 终端矩阵按负面/环境验证 | Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖，无需改 |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对，本轮未覆盖 | 建议拆分「docs 与实现一致」为可机械校验断言 |
| D8-4 | 设计级 | P1 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 | 建议标注 requiredEvidence 为「逐条步骤核验表」 |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对，本轮未覆盖 | 建议拆分「中英双源一致」为可机械校验断言 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-13 只读子账号探针 redact 处理，D2-4/D2-26/D4-27 均脱敏）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云探针 redact 处理）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是 | 已删（手工补删） | ListServersDetails testbot3-hermes 前缀=0（自动化 150s 轮询窗口不足，手工 DeleteServers 归零） |
| VPC / Subnet（D3-C1） | 是 | 已删（手工补删） | ListVpcs testbot3-hermes 前缀=0（探针删除未确认，手工补删 subnet+vpc） |
| VPC（D4-14） | 是 | 已删 | ListVpcs 不含本次资源（containsOwn=false） |
| OBS 桶（D3-C2 / D3-C13） | 是 | 已删 | 删桶归零 success |
| 沙箱会话（D3-C3/C6/S3） | 是 | close_session | ok |
| EIP（D3-C7） | 是 | 已删 | ListPublicips total_count=0 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单（testbot3-hermes-* / tctest-* 前缀），未误删他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D10-4`（规则库 19 vs 16）、`D9-9`（cancellation 声明）、`D8-9`（sanitizeValue 脱敏）、`D3-C14`（hdkitConnect pool_type 契约）。
- 本轮 17 项缺陷与 2026-11-22/11-23 结论一致（同 v1.1.15 同 commit），均为历史复现，无新增缺陷。
- KooCLI 版本差（本机 7.2.12 vs 插件配对 7.3.12）为环境 WARN，doctor 已正确提示，建议补环境时统一升级。
- D3-S6/D3-S7 真云参数装配漂移（function_name/db.port 历轮变化），建议维护方确认最小创建参数口径。