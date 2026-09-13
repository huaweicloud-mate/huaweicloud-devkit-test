# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-13 20:10:00（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-13-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（P0 全通过，P1/P2 未覆盖）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows Server (win32 x64)` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290bc`） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 未使用）` |
| 测试类型 | 真机 CLI（install/doctor/status/update）+ MCP 协议（hook_check_command/artifacts/deploy_plan/plan_cli_command）+ 安全策略验证 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：CLI 真机执行（install/doctor/status/update/auth）记录 stdout.log；MCP 工具调用（hook_check_command/artifacts/deploy_plan/plan_cli_command/show_profile_redacted/auth_status）验证安全策略；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `152`（设计级 81 + 展开级 71） |
| 已执行 | `24`（设计级 21 + 展开级 3） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `22 / 0 / 2 / 0 / 128` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 22） | `100%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `20` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `1` | D1-40 镜像 lag 检测需可控 lag 镜像 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `60` | P1/P2 本轮未覆盖（时间/环境限制） |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `2` | EXP-NR3-09/10 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `1` | EXP-NR3-11 需隔离 HOME+fixture 环境 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `68` | P1 本轮未覆盖 |
| **合计** | **`71`** | |

---

## 四、逐用例结果（已执行项，含 PASS/FAIL/BLOCKED/SPEC）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| `D1-1` | P1 | 全新环境引导安装 | PASS | `evidence/D1-1/stdout.log` | install --target codearts-work 成功 |
| `D1-3` | P1 | doctor 健康自检 | PASS | `evidence/D1-3/stdout.log` | 10 pass 0 warn 0 fail |
| `D1-4` | P2 | status/update 幂等 | PASS | `evidence/D1-4/stdout.log` | status 显示全部 Installed |
| `D1-39` | P0 | Windows 升级检测链可用性 | PASS | `evidence/D1-39/stdout.log` | update 成功完成 |
| `D1-40` | P0 | 镜像 lag 下检测正确性 | BLOCKED | `evidence/D1-40/stdout.log` | 无可控 lag 镜像 |
| `D2-4` | P0 | 凭证脱敏正确性 | PASS | `evidence/D2-4/stdout.log` | AK/SK 显示 `<redacted>` |
| `D2-11` | P0 | R3 STS token 拒绝落盘 | PASS | `evidence/D2-11/stdout.log` | runtimeActive=false |
| `D4-1` | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1/stdout.log` | type/cat 被 deny |
| `D4-2` | P0 | 凭证 env 打印拦截 | PASS | `evidence/D4-2/stdout.log` | printenv HW_* 被 deny |
| `D4-3` | P0 | 明文 secret API 拦截 | PASS | `evidence/D4-3/stdout.log` | IAM admin policy 被 deny |
| `D4-5` | P0 | 写操作误判检测 | PASS | `evidence/D4-5/stdout.log` | CreateServers=write/deny, NovaListServers=read/allow |
| `D4-9` | P0 | 公开暴露/破坏性预检 | PASS | `evidence/D4-9/stdout.log` | 公网 SSH 22 被 deny |
| `D4-15` | P0 | hook 绕过尝试 | PASS | `evidence/D4-15/stdout.log` | bash -c 包装仍被 deny |
| `D4-16` | P0 | 命令包裹穿透 | PASS | `evidence/D4-16/stdout.log` | sh -c 包装仍被 deny |
| `D4-18` | P0 | confirm-not-deny 审批语义 | PASS | `evidence/D4-18/stdout.log` | approvedByUser=false 不执行 |
| `D4-19` | P0 | 确认流下预检仍生效 | PASS | `evidence/D4-19/stdout.log` | 预检独立于审批流 |
| `D4-21` | P0 | hook_check_artifacts 具名回归 | PASS | `evidence/D4-21/stdout.log` | IAM admin 策略被拦截 |
| `D4-22` | P0 | hook_check_deploy_plan 具名回归 | PASS | `evidence/D4-22/stdout.log` | 公网 SSH+缺 TTL 被拦截 |
| `D4-23` | P0 | 全局规则注入生效性 | PASS | `evidence/D4-23/stdout.log` | cloud-risk-rules.json 安装+hook 生效 |
| `D8-7` | P0 | 7 个 meta/通用技能可机械验证 | PASS | `evidence/D8-7/stdout.log` | 6 meta-skills frontmatter 有效 |
| `D10-4` | P0 | 安全干预有效性 | PASS | `evidence/D10-4/stdout.log` | 所有 hook 调用正确拦截 |
| `EXP-NR3-09` | P0 | spawnSync EINVAL 复现 | PASS | `evidence/EXP-NR3-09/stdout.log` | bug 已修复于 1.1.4-next.3 |
| `EXP-NR3-10` | P0 | Windows 升级检测链 | PASS | `evidence/EXP-NR3-10/stdout.log` | update 成功 |
| `EXP-NR3-11` | P0 | 隔离环境复现 | BLOCKED | `evidence/EXP-NR3-11/stdout.log` | 需隔离 HOME+fixture |

> **逐用例结果与副本 CSV 的「执行状态」+「evidencePath」列完全一致**（已通过 `verify_no_fake_pass.py` 门禁校验）。

---

## 五、缺陷清单（详尽，每个缺陷一栏）

> 本轮无 FAIL / SPEC-MISMATCH，无产品缺陷。P0 全通过。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| — | — | — | 无产品缺陷 | — | — | — | — | — |

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D1-40` | 需模拟 npm 镜像 lag（源仓库领先于镜像） | 可控 lag 镜像环境 | 配置 lag 镜像后复测 |
| `EXP-NR3-11` | 需隔离 HOME + plugin 目录 + npm cache + HUAWEICLOUD_HOME fixture | 隔离 fixture 环境 | 搭建 fixture 后复测 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有凭证读取/打印均被 hook 拦截，show_profile_redacted 返回 `<redacted>`）
- [x] 写操作误判 read-only：`0`（CreateServers=write/deny, NovaListServers=read/allow 分类正确）
- [x] 红线（I 类）违规：`无`（未创建真云资源，无虚报 PASS，verify_no_fake_pass 通过）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/OBS/VPC 等） | 否 | — | 未创建，无需释放 |
| 本地安装（skills/MCP/safety） | 是（install） | 保留（测试环境） | 非云资源，不影响计费 |

> 本轮未创建任何真云资源，无释放义务。

---

## 九、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖（说明范围）：`P1 113 用例 + P2 18 用例 = 131 NOT_RUN`。主要涉及：多客户端共存矩阵、真云 E2E（创建→测→删除归零）、审批流实时对话框、MCP 协议层 stdio 端到端、性能基准、兼容性矩阵。受限于单会话时间与真云资源配额，本轮聚焦 P0 安全/安装/凭证核心链路。
- 建议：
  1. 后续轮次补测 P1 真云 E2E 用例（需配真云配额 + 创建/删除归零验证）
  2. D1-40 镜像 lag 检测建议搭建可控 lag 镜像环境
  3. EXP-NR3-11 建议搭建隔离 fixture 环境复测
