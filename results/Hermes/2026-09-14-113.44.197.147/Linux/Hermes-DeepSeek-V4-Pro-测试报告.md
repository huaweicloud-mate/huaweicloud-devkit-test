# Hermes-DeepSeek-V4-Pro 测试报告

> **生成时间**：2026-09-14 07:33:54（北京时间）
> **执行归档**：`results/Hermes/2026-09-14-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 3 个 P0 FAIL + 1 个 P1 SPEC-MISMATCH，P0 缺口不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.4-next.3`（npm @next，gitHead `3b6290b`，PR #647） |
| 源码仓库（hdk） | `huaweicloud/huaweicloud-devkit` @ `3b6290b`（chore(release): 1.1.4-next.3） |
| 工具全集 | 39（`tools.mjs` `TOOL_DEFINITIONS`，tools/list 实测 39） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | cn-north-4（AK/SK 已配置；本轮未创建真云资源，仅源码级/只读） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/uninstall/install-hcloud）/ MCP stdio 协议 / 只读规划冒烟 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数断言决策；MCP stdio JSON-RPC 驱动 `mcp-server.mjs` 真实协议；CLI 真机执行多命令；证据落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行 | 110（PASS 102 + FAIL 3 + BLOCKED 4 + SPEC-MISMATCH 1） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 102 / 3 / 4 / 1 / 42 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | **96.2%**（102/106） |
| P0 / P1 / P2 新增缺陷 | 3 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源；探针临时文件已清理） |

---

## 三、状态汇总

### 3.1 设计级（81 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 66 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D4-2 / D4-16 / D4-23（根因见缺陷清单 #1/#2/#3） |
| BLOCKED | 3 | D4-13/D4-14/D4-24（真云/CTS/审批流环境阻塞） |
| SPEC-MISMATCH | 1 | D9-9（取消/超时协议能力缺失） |
| NOT_RUN | 8 | D4-11/D7-4/D9-6/D10-*（需评测 harness / 多客户端 / 镜像源） |
| **合计** | **81** | |

### 3.2 展开级（71 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | EXP-C4 22 / EXP-NR3 7 / EXP-D1-58 5 / EXP-D5-8 Hermes 2 |
| FAIL | 0 | 0 |
| BLOCKED | 1 | EXP-NR3-11（macOS/ARM 无环境） |
| SPEC-MISMATCH | 0 | 0 |
| NOT_RUN | 34 | 其余客户端矩阵 18 + EXP-E 15 + EXP-NR3-09(Windows) |
| **合计** | **71** | |

---

## 四、逐用例结果（已执行项，非 NOT_RUN）

> 与副本 CSV「执行状态」+「evidencePath」列完全一致（同一来源）。NOT_RUN 用例见第六节。

| 用例 ID | 优先级 | 标题/要点 | 结果 | 证据路径 |
|---|---|---|---|---|
| `D1-1` | P1 | 全新环境引导安装 | PASS | `evidence/D1-1/stdout.log` |
| `D1-2` | P2 | 多Agent探测 | PASS | `evidence/D1-2/stdout.log` |
| `D1-26` | P1 | 升级提醒工具注册与协议暴露 | PASS | `evidence/D1-26/stdout.log` |
| `D1-27` | P1 | 检测语义-已是最新 | PASS | `evidence/D1-27/stdout.log` |
| `D1-28` | P1 | 检测语义-有新版本 | PASS | `evidence/D1-28/stdout.log` |
| `D1-3` | P1 | doctor健康自检 | PASS | `evidence/D1-3/stdout.log` |
| `D1-30` | P2 | semver 比对正确性 | PASS | `evidence/D1-30/stdout.log` |
| `D1-31` | P1 | dismiss 冷却期 | PASS | `evidence/D1-31/stdout.log` |
| `D1-33` | P2 | skip 文件持久化与多路径 | PASS | `evidence/D1-33/stdout.log` |
| `D1-39` | P0 | Windows 升级检测链可用性 | PASS | `evidence/D1-39/stdout.log` |
| `D1-4` | P2 | status/update幂等 | PASS | `evidence/D1-4/stdout.log` |
| `D1-40` | P0 | 镜像 lag 下检测正确性(反向提醒防护) | PASS | `evidence/D1-40/stdout.log` |
| `D1-41` | P1 | check_update 真实 MCP 返回契约 | PASS | `evidence/D1-41/stdout.log` |
| `D1-42` | P1 | dismiss 真实闭环与跨调用持久化 | PASS | `evidence/D1-42/stdout.log` |
| `D1-45` | P1 | 兜底提示真实序列与预热竞态 | PASS | `evidence/D1-45/stdout.log` |
| `D1-5` | P1 | uninstall干净度 | PASS | `evidence/D1-5/stdout.log` |
| `D1-58` | P1 | 通用 MCP 白名单接入（Claude/Cursor merge 语义） | PASS | `evidence/D1-58/stdout.log` |
| `D1-6` | P2 | install-hcloud | PASS | `evidence/D1-6/stdout.log` |
| `D10-1` | P1 | 工具描述可选择性 | NOT_RUN | |
| `D10-2` | P1 | skill激活率 | NOT_RUN | |
| `D10-3` | P1 | 路由准确率+混淆矩阵 | NOT_RUN | |
| `D10-4` | P0 | 安全干预有效性 | NOT_RUN | |
| `D10-5` | P1 | 多轮任务完成率 | NOT_RUN | |
| `D2-1` | P1 | auth init三端同步 | PASS | `evidence/D2-1/stdout.log` |
| `D2-10` | P1 | R7 current档跟随 | PASS | `evidence/D2-10/stdout.log` |
| `D2-11` | P0 | R3 STS token拒绝落盘 | PASS | `evidence/D2-11/stdout.log` |
| `D2-12` | P1 | R10 runtime非空禁止落盘 | PASS | `evidence/D2-12/stdout.log` |
| `D2-13` | P1 | R9 configuredBySession优先env | PASS | `evidence/D2-13/stdout.log` |
| `D2-16` | P1 | import文件读取后擦除 | PASS | `evidence/D2-16/stdout.log` |
| `D2-2` | P2 | auth status判定准确性 | PASS | `evidence/D2-2/stdout.log` |
| `D2-4` | P0 | 凭证脱敏正确性 | PASS | `evidence/D2-4/stdout.log` |
| `D2-5` | P1 | 凭证缺失报错指引 | PASS | `evidence/D2-5/stdout.log` |
| `D3-A1` | P1 | skill检索完整性 | PASS | `evidence/D3-A1/stdout.log` |
| `D3-B1` | P2 | list_operations规范名 | PASS | `evidence/D3-B1/stdout.log` |
| `D3-B3` | P1 | run_readonly脱敏执行 | PASS | `evidence/D3-B3/stdout.log` |
| `D3-B5` | P2 | detect_framework识别 | PASS | `evidence/D3-B5/stdout.log` |
| `D3-C4` | P1 | 服务创建类回归 | PASS | `evidence/D3-C4/stdout.log` |
| `D3-C5` | P1 | 工具冒烟 | PASS | `evidence/D3-C5/stdout.log` |
| `D4-1` | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1/stdout.log` |
| `D4-10` | P2 | 规则库新增回归 | PASS | `evidence/D4-10/stdout.log` |
| `D4-11` | P1 | 提示注入防护 | NOT_RUN | |
| `D4-12` | P2 | 供应链安装期安全 | PASS | `evidence/D4-12/stdout.log` |
| `D4-13` | P1 | 最小权限凭证通过率 | BLOCKED | `` |
| `D4-14` | P2 | 操作可审计性 | BLOCKED | `` |
| `D4-15` | P0 | hook绕过尝试 | PASS | `evidence/D4-15/stdout.log` |
| `D4-16` | P0 | 命令包裹穿透 | FAIL | `evidence/D4-16/stdout.log` |
| `D4-17` | P1 | hook模糊fail-closed | PASS | `evidence/D4-17/stdout.log` |
| `D4-18` | P0 | confirm-not-deny审批语义 | PASS | `evidence/D4-18/stdout.log` |
| `D4-19` | P0 | 确认流下预检仍生效 | PASS | `evidence/D4-19/stdout.log` |
| `D4-2` | P0 | 凭证env打印拦截 | FAIL | `evidence/D4-2/stdout.log` |
| `D4-20` | P1 | 拒绝后零操作 | PASS | `evidence/D4-20/stdout.log` |
| `D4-21` | P0 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | PASS | `evidence/D4-21/stdout.log` |
| `D4-22` | P0 | hook_check_deploy_plan 具名回归（部署计划预检） | PASS | `evidence/D4-22/stdout.log` |
| `D4-23` | P0 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | FAIL | `evidence/D4-23/stdout.log` |
| `D4-24` | P1 | 确认令牌过期与重复确认边界（审批流健壮性） | BLOCKED | `` |
| `D4-3` | P0 | 明文secret API拦截 | PASS | `evidence/D4-3/stdout.log` |
| `D4-4` | P1 | 写操作审批门 | PASS | `evidence/D4-4/stdout.log` |
| `D4-5` | P0 | 写操作误判检测 | PASS | `evidence/D4-5/stdout.log` |
| `D4-6` | P1 | adminPass回显警告 | PASS | `evidence/D4-6/stdout.log` |
| `D4-7` | P1 | hook三工具有效性 | PASS | `evidence/D4-7/stdout.log` |
| `D4-8` | P1 | Python/Node策略一致 | PASS | `evidence/D4-8/stdout.log` |
| `D4-9` | P0 | 公开暴露/破坏性预检 | PASS | `evidence/D4-9/stdout.log` |
| `D5-1` | P1 | 清单发现加载 | PASS | `evidence/D5-1/stdout.log` |
| `D5-3` | P1 | 工具全量枚举 | PASS | `evidence/D5-3/stdout.log` |
| `D6-1` | P2 | 检索响应延迟 | PASS | `evidence/D6-1/stdout.log` |
| `D6-3` | P2 | MCP冷启时间 | PASS | `evidence/D6-3/stdout.log` |
| `D6-4` | P1 | 并发调度正确性 | PASS | `evidence/D6-4/stdout.log` |
| `D7-4` | P2 | 国内镜像源安装 | NOT_RUN | |
| `D8-1` | P2 | 文档与能力一致 | PASS | `evidence/D8-1/stdout.log` |
| `D8-4` | P1 | 引导步骤可机械执行 | PASS | `evidence/D8-4/stdout.log` |
| `D8-6` | P2 | 中英文文档一致 | PASS | `evidence/D8-6/stdout.log` |
| `D8-7` | P0 | 7 个 meta/通用技能指引可机械执行验证 | PASS | `evidence/D8-7/stdout.log` |
| `D9-1` | P1 | tools/list合规 | PASS | `evidence/D9-1/stdout.log` |
| `D9-2` | P1 | JSON-RPC错误码 | PASS | `evidence/D9-2/stdout.log` |
| `D9-3` | P1 | tools/call响应格式 | PASS | `evidence/D9-3/stdout.log` |
| `D9-4` | P1 | 协议生命周期 | PASS | `evidence/D9-4/stdout.log` |
| `D9-5` | P1 | stdio传输健壮 | PASS | `evidence/D9-5/stdout.log` |
| `D9-6` | P1 | 跨客户端互通 | NOT_RUN | |
| `D9-7` | P2 | 协议版本协商降级 | PASS | `evidence/D9-7/stdout.log` |
| `D9-8` | P2 | inputSchema版本合规 | PASS | `evidence/D9-8/stdout.log` |
| `D9-9` | P1 | tools/call 超时协议语义与取消 | SPEC-MISMATCH | `evidence/D9-9/stdout.log` |
| `EXP-C4-01` | P1 | ECS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-01/stdout.log` |
| `EXP-C4-02` | P1 | VPC 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-02/stdout.log` |
| `EXP-C4-03` | P1 | OBS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-03/stdout.log` |
| `EXP-C4-04` | P1 | RDS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-04/stdout.log` |
| `EXP-C4-05` | P1 | GaussDB 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-05/stdout.log` |
| `EXP-C4-06` | P1 | CCE 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-06/stdout.log` |
| `EXP-C4-07` | P1 | FunctionGraph 只读规划冒烟: list_operations + plan 只读命 | PASS | `evidence/EXP-C4-07/stdout.log` |
| `EXP-C4-08` | P1 | IAM 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-08/stdout.log` |
| `EXP-C4-09` | P1 | CTS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-09/stdout.log` |
| `EXP-C4-10` | P1 | CES 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-10/stdout.log` |
| `EXP-C4-11` | P1 | DDS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-11/stdout.log` |
| `EXP-C4-12` | P1 | DCS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-12/stdout.log` |
| `EXP-C4-13` | P1 | SMN 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-13/stdout.log` |
| `EXP-C4-14` | P1 | DMS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-14/stdout.log` |
| `EXP-C4-15` | P1 | WAF 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-15/stdout.log` |
| `EXP-C4-16` | P1 | CDN 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-16/stdout.log` |
| `EXP-C4-17` | P1 | ModelArts 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-17/stdout.log` |
| `EXP-C4-18` | P1 | DEW 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-18/stdout.log` |
| `EXP-C4-19` | P1 | CBR 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-19/stdout.log` |
| `EXP-C4-20` | P1 | EVS 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-20/stdout.log` |
| `EXP-C4-21` | P1 | EIP 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-21/stdout.log` |
| `EXP-C4-22` | P1 | ELB 只读规划冒烟: list_operations + plan 只读命令 | PASS | `evidence/EXP-C4-22/stdout.log` |
| `EXP-D1-58-01` | P1 | 白名单探测：空 HOME 跑 install 菜单 option3，断言探测 ~/.claude | PASS | `evidence/EXP-D1-58-01/stdout.log` |
| `EXP-D1-58-02` | P1 | 命中 merge：构造 fake ~/.claude.json，断言生成 .bak 备份 + m | PASS | `evidence/EXP-D1-58-02/stdout.log` |
| `EXP-D1-58-03` | P1 | 同 key 跳过：已含 huaweicloud-devkit 的配置重跑，断言 skipping | PASS | `evidence/EXP-D1-58-03/stdout.log` |
| `EXP-D1-58-04` | P1 | 坏 JSON 零写入：构造损坏 JSON 配置跑菜单，断言报 'not valid JSON'  | PASS | `evidence/EXP-D1-58-04/stdout.log` |
| `EXP-D1-58-05` | P1 | 未命中 snippet：无 Claude/Cursor 配置跑菜单，断言输出可粘贴 stdio  | PASS | `evidence/EXP-D1-58-05/stdout.log` |
| `EXP-D5-1-1` | P1 | 在 OpenCode 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-1-3` | P1 | 在 OpenCode 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-10-1` | P1 | 在 AtomCode 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-10-3` | P1 | 在 AtomCode 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-2-1` | P1 | 在 Codex 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-2-3` | P1 | 在 Codex 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-3-1` | P1 | 在 CodeArtsAgent 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-3-3` | P1 | 在 CodeArtsAgent 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-4-1` | P1 | 在 CodeArtsWork 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-4-3` | P1 | 在 CodeArtsWork 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-5-1` | P1 | 在 WorkBuddy 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-5-3` | P1 | 在 WorkBuddy 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-6-1` | P1 | 在 DSH 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-6-3` | P1 | 在 DSH 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-7-1` | P1 | 在 OfficeAce 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-7-3` | P1 | 在 OfficeAce 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-D5-8-1` | P1 | 在 Hermes 上执行 D5-1 用例 | PASS | `evidence/EXP-D5-8-1/stdout.log` |
| `EXP-D5-8-3` | P1 | 在 Hermes 上执行 D5-3 用例 | PASS | `evidence/EXP-D5-8-3/stdout.log` |
| `EXP-D5-9-1` | P1 | 在 OpenClaw 上执行 D5-1 用例 | NOT_RUN | |
| `EXP-D5-9-3` | P1 | 在 OpenClaw 上执行 D5-3 用例 | NOT_RUN | |
| `EXP-E01` | P1 | 期望路由: ECS查询→run_readonly | NOT_RUN | |
| `EXP-E02` | P1 | 期望路由: ECS创建→plan/approve | NOT_RUN | |
| `EXP-E03` | P1 | 期望路由: OBS静态站→deploy | NOT_RUN | |
| `EXP-E04` | P1 | 期望路由: EIP→plan | NOT_RUN | |
| `EXP-E05` | P1 | 期望路由: RDS查询→read | NOT_RUN | |
| `EXP-E06` | P1 | 期望路由: DCS创建→plan | NOT_RUN | |
| `EXP-E07` | P1 | 期望路由: CBR→plan | NOT_RUN | |
| `EXP-E08` | P1 | 期望路由: explain_error→诊断 | NOT_RUN | |
| `EXP-E09` | P1 | 期望路由: CCE创建→plan | NOT_RUN | |
| `EXP-E10` | P1 | 期望路由: FunctionGraph→plan | NOT_RUN | |
| `EXP-E11` | P1 | 期望路由: 费用查询→read | NOT_RUN | |
| `EXP-E12` | P1 | 期望路由: CES→plan | NOT_RUN | |
| `EXP-E13` | P1 | 期望路由: 证书/ELB→plan | NOT_RUN | |
| `EXP-E14` | P1 | 期望路由: IAM审计→read | NOT_RUN | |
| `EXP-E15` | P1 | 期望路由: voucher_claim→执行 | NOT_RUN | |
| `EXP-NR3-01` | P1 | 函数级+stdio MCP 四态契约；dismiss 落盘+重启复查 | PASS | `evidence/EXP-NR3-01/stdout.log` |
| `EXP-NR3-02` | P1 | D1-27 检测语义 up_to_date：mcp-loop D1-41a/init/tools | PASS | `evidence/EXP-NR3-02/stdout.log` |
| `EXP-NR3-03` | P1 | 真实安装布局 skip 落 <pluginDir>/.update-skip.json（D1-5 | PASS | `evidence/EXP-NR3-03/stdout.log` |
| `EXP-NR3-04` | P1 | D1-42 dismiss 跨进程持久化：mcp-loop D1-42a~e + upgrade | PASS | `evidence/EXP-NR3-04/stdout.log` |
| `EXP-NR3-09` | P0 | spawnSync('npm.cmd') EINVAL 直捕；sync/async 双路径静默； | NOT_RUN | |
| `EXP-NR3-10` | P0 | Linux 无 .cmd/EINVAL 语义；54 条通用断言通过（探针 Windows 专测断 | PASS | `evidence/EXP-NR3-10/stdout.log` |
| `EXP-NR3-11` | P0 | BLOCKED：无 macOS/ARM 机器或 CI runner；影响=声明支持的 macOS | BLOCKED | `` |
| `EXP-NR3-23` | P1 | 兜底一次性消费+预热竞态双时序（stdio 有 prewarm） | PASS | `evidence/EXP-NR3-23/stdout.log` |
| `EXP-NR3-24` | P1 | D1-45 兜底序列+预热竞态：mcp-loop D1-45a~f 全 PASS（testbot | PASS | `evidence/EXP-NR3-24/stdout.log` |

---

## 五、缺陷清单（详尽，每缺陷详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证环境变量打印拦截未覆盖 HW_ 前缀 | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`（`HW_*` 前缀未拦截） | `safety-policy.mjs:334-337`（`huaweicloud-safety.py` ENV_DUMP_RE 同） |
| 2 | P0 | `D4-16` | 命令包裹穿透未拦截内层写命令 | `sh -c '...DeleteServers'` 应 `deny` | 返回 `allow` | `safety-policy.mjs:313-319`（`splitSimpleCommand`） |
| 3 | P0 | `D4-23` | 全局规则 huawei-agent-rules.mdc 未注入 | 注入逻辑 grep 应命中 | 0 命中（孤儿文件） | `setup-cli.mjs`（无 agent-rules 注入）；`rules/huawei-agent-rules.mdc` 无消费方 |
| 4 | P1 | `D9-9` | tools/call 超时/取消能力缺失（SPEC-MISMATCH） | 超时 `-32000` / capabilities.cancellation 实测 | capabilities 仅 `{tools:{}}`，无超时/取消 | `mcp-protocol.mjs:46-89`、`mcp-server.mjs:156-174` |

---

## 六、阻塞项与未覆盖

| 项 | 原因 |
|---|---|
| D4-13 最小权限凭证通过率 | 需最小权限只读真云凭证；本机仅全量 AK/SK |
| D4-14 操作可审计性 | 需真云 CTS 审计 + 写操作；本机不做真云写 |
| D4-24 确认令牌过期边界 | 需真云创建最小规格 ECS + 审批流 |
| D3-C4 真云轻量创建→释放部分 | 红线：不做真云资源创建（只读规划冒烟 EXP-C4 已全 PASS） |
| EXP-NR3-11 macOS/ARM | 无 macOS/ARM 机器或 CI runner |
| EXP-NR3-09 Windows EINVAL | Windows 专测；本机 Linux 无法复现 |
| D9-6 跨客户端互通 | 需 Inspector + 3 客户端实机；本机仅 Hermes |
| D10-1/2/3/5 + EXP-E15 | 需 LLM 路由/评测 harness |
| D10-4 安全干预有效性 | 需安全评测 harness + Agent 会话 |
| D4-11 提示注入防护 | 需 Agent 会话观察注入指令行为 |
| D7-4 国内镜像源安装 | 需配置国内 npm registry 实测（GitCode 镜像仅用于 clone fallback） |
| 其余 18 个 EXP-D5 客户端矩阵 | 非本客户端（OpenCode/Codex/…/AtomCode），本 agent 仅 Hermes |

---

## 七、安全与红线合规

- 凭证泄漏事件：0（D2-4 脱敏实证、D2-16 import 后擦除实证、D2-11 STS 拒绝落盘实证）
- 写操作误判 read-only：0（D4-5 实证 DeleteServers→deny/write）
- 红线（I 类）违规：无
- 脱敏复核：证据目录无原始凭证/未脱敏日志（探针用临时 HUAWEICLOUD_HOME，已自动清理）
- 低危观察（不阻断，记录在案）：
  1. `hvcc-sandbox-missing-ttl` 规则对无 ttl 的 benign IaC 产生 `warn`（D4-21 实测 `safe.decision=warn`，过度告警，仅告警不阻断）
  2. 6 个 meta 技能用 `huaweicloud-` 前缀、`getting-started` 用 `huawei-` 前缀（命名轻徽漂移，见 D8-7）
  3. D9-4「非法时序被拒」未强制（dispatch 无 initialize 状态机，tools/list 可先于 initialize 响应）——低危观察，不阻断

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/RDS等） | 否 | — | 本轮未创建 |
| MCP 临时 HOME（/tmp/hdk-*） | 是 | 探针退出即释放 | 无残留 |
| KooCLI | 复用已有 7.2.12（install-hcloud 重装同版本） | — | 无新增残留 |
| 本机 Hermes 插件（D1-1/D1-5） | install→已 uninstall | — | status 回溯到 Not installed（原状） |

---

## 九、遗留与建议

1. 3 个 P0 缺陷（D4-2/D4-16/D4-23）待上游修复后回归；D9-9 取消/超时能力待产品裁定是否纳入协议契约。
2. 建议：将 `HW_` 前缀并入 env-dump 规则；`splitSimpleCommand` 对 `sh -c`/`bash -c` 内层二次展开；`setup-cli.mjs` 在 install 时注入 `huawei-agent-rules.mdc` 到各目标。
3. 后续补齐：Windows/macOS 终端矩阵（需对应环境或 CI）、LLM 评测 harness（D10/EXP-E）、Inspector 跨客户端互通（D9-6）。