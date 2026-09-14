# CodeArtsAgent-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsAgent-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-13 20:38:02`（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-13-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（19 个 BLOCKED 为真云 E2E 用例，无真云凭证）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `GLM-5.2` |
| OS / 架构 | `Windows 11 (win32)` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.3`（npm @next，KooCLI `7.2.12`） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `未使用（无 ~/.agents/huaweicloud-test-credentials.json）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `152` |
| 已执行 | `152` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `133 / 0 / 19 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `100%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `74` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `7` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | 契约漂移，待裁决 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `59` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `12` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | 契约漂移，待裁决 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`71`** | |

---

## 四、逐用例结果

### 4.1 设计级（81 条）

| ID | 标题 | 优先级 | 执行状态 | evidencePath |
|---|---|---|---|---|
| D1-1 | 全新环境引导安装 | P1 | PASS | evidence/D1-1/ |
| D1-2 | 多Agent探测 | P2 | PASS | evidence/D1-2/ |
| D1-3 | doctor健康自检 | P1 | PASS | evidence/D1-3/ |
| D1-4 | status/update幂等 | P2 | PASS | evidence/D1-4/ |
| D1-5 | uninstall干净度 | P1 | PASS | evidence/D1-5/ |
| D1-6 | install-hcloud | P2 | PASS | evidence/D1-6/ |
| D1-26 | 升级提醒工具注册与协议暴露 | P1 | PASS | evidence/D1-26/ |
| D1-27 | 检测语义-已是最新 | P1 | PASS | evidence/D1-27/ |
| D1-28 | 检测语义-有新版本 | P1 | PASS | evidence/D1-28/ |
| D1-30 | semver 比对正确性 | P2 | PASS | evidence/D1-30/ |
| D1-31 | dismiss 冷却期 | P1 | PASS | evidence/D1-31/ |
| D1-33 | skip 文件持久化与多路径 | P2 | PASS | evidence/D1-33/ |
| D1-39 | Windows 升级检测链可用性 | P0 | PASS | evidence/D1-39/ |
| D1-40 | 镜像 lag 下检测正确性(反向提醒防护) | P0 | PASS | evidence/D1-40/ |
| D1-41 | check_update 真实 MCP 返回契约 | P1 | PASS | evidence/D1-41/ |
| D1-42 | dismiss 真实闭环与跨调用持久化 | P1 | PASS | evidence/D1-42/ |
| D1-45 | 兜底提示真实序列与预热竞态 | P1 | PASS | evidence/D1-45/ |
| D1-58 | 通用 MCP 白名单接入（Claude/Cursor merge 语义） | P1 | PASS | evidence/D1-58/ |
| D2-10 | R7 current档跟随 | P1 | BLOCKED |  |
| D2-11 | R3 STS token拒绝落盘 | P0 | PASS | evidence/D2-11/ |
| D2-12 | R10 runtime非空禁止落盘 | P1 | PASS | evidence/D2-12/ |
| D2-13 | R9 configuredBySession优先env | P1 | PASS | evidence/D2-13/ |
| D2-16 | import文件读取后擦除 | P1 | PASS | evidence/D2-16/ |
| D4-18 | confirm-not-deny审批语义 | P0 | PASS | evidence/D4-18/ |
| D4-19 | 确认流下预检仍生效 | P0 | PASS | evidence/D4-19/ |
| D4-20 | 拒绝后零操作 | P1 | BLOCKED |  |
| D2-1 | auth init三端同步 | P1 | BLOCKED |  |
| D2-2 | auth status判定准确性 | P2 | PASS | evidence/D2-2/ |
| D2-4 | 凭证脱敏正确性 | P0 | PASS | evidence/D2-4/ |
| D2-5 | 凭证缺失报错指引 | P1 | PASS | evidence/D2-5/ |
| D3-A1 | skill检索完整性 | P1 | PASS | evidence/D3-A1/ |
| D3-B1 | list_operations规范名 | P2 | BLOCKED |  |
| D3-B3 | run_readonly脱敏执行 | P1 | PASS | evidence/D3-B3/ |
| D3-B5 | detect_framework识别 | P2 | PASS | evidence/D3-B5/ |
| D3-C4 | 服务创建类回归 | P1 | PASS | evidence/D3-C4/ |
| D3-C5 | 工具冒烟 | P1 | PASS | evidence/D3-C5/ |
| D4-1 | 凭证文件读取拦截 | P0 | PASS | evidence/D4-1/ |
| D4-2 | 凭证env打印拦截 | P0 | PASS | evidence/D4-2/ |
| D4-3 | 明文secret API拦截 | P0 | PASS | evidence/D4-3/ |
| D4-4 | 写操作审批门 | P1 | PASS | evidence/D4-4/ |
| D4-5 | 写操作误判检测 | P0 | PASS | evidence/D4-5/ |
| D4-6 | adminPass回显警告 | P1 | BLOCKED |  |
| D4-7 | hook三工具有效性 | P1 | PASS | evidence/D4-7/ |
| D4-8 | Python/Node策略一致 | P1 | PASS | evidence/D4-8/ |
| D4-9 | 公开暴露/破坏性预检 | P0 | PASS | evidence/D4-9/ |
| D4-10 | 规则库新增回归 | P2 | PASS | evidence/D4-10/ |
| D4-11 | 提示注入防护 | P1 | PASS | evidence/D4-11/ |
| D4-12 | 供应链安装期安全 | P2 | PASS | evidence/D4-12/ |
| D4-13 | 最小权限凭证通过率 | P1 | PASS | evidence/D4-13/ |
| D4-14 | 操作可审计性 | P2 | PASS | evidence/D4-14/ |
| D4-15 | hook绕过尝试 | P0 | PASS | evidence/D4-15/ |
| D4-16 | 命令包裹穿透 | P0 | PASS | evidence/D4-16/ |
| D4-17 | hook模糊fail-closed | P1 | PASS | evidence/D4-17/ |
| D4-21 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | P0 | PASS | evidence/D4-21/ |
| D4-22 | hook_check_deploy_plan 具名回归（部署计划预检） | P0 | BLOCKED |  |
| D4-23 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标 | P0 | PASS | evidence/D4-23/ |
| D4-24 | 确认令牌过期与重复确认边界（审批流健壮性） | P1 | BLOCKED |  |
| D5-1 | 清单发现加载 | P1 | PASS | evidence/D5-1/ |
| D5-3 | 工具全量枚举 | P1 | PASS | evidence/D5-3/ |
| D6-1 | 检索响应延迟 | P2 | PASS | evidence/D6-1/ |
| D6-3 | MCP冷启时间 | P2 | PASS | evidence/D6-3/ |
| D6-4 | 并发调度正确性 | P1 | PASS | evidence/D6-4/ |
| D9-9 | tools/call 超时协议语义与取消 | P1 | PASS | evidence/D9-9/ |
| D7-4 | 国内镜像源安装 | P2 | PASS | evidence/D7-4/ |
| D8-1 | 文档与能力一致 | P2 | PASS | evidence/D8-1/ |
| D8-4 | 引导步骤可机械执行 | P1 | PASS | evidence/D8-4/ |
| D8-6 | 中英文文档一致 | P2 | PASS | evidence/D8-6/ |
| D8-7 | 7 个 meta/通用技能指引可机械执行验证 | P0 | PASS | evidence/D8-7/ |
| D9-1 | tools/list合规 | P1 | PASS | evidence/D9-1/ |
| D9-2 | JSON-RPC错误码 | P1 | PASS | evidence/D9-2/ |
| D9-3 | tools/call响应格式 | P1 | PASS | evidence/D9-3/ |
| D9-4 | 协议生命周期 | P1 | PASS | evidence/D9-4/ |
| D9-5 | stdio传输健壮 | P1 | PASS | evidence/D9-5/ |
| D9-6 | 跨客户端互通 | P1 | PASS | evidence/D9-6/ |
| D9-7 | 协议版本协商降级 | P2 | PASS | evidence/D9-7/ |
| D9-8 | inputSchema版本合规 | P2 | PASS | evidence/D9-8/ |
| D10-1 | 工具描述可选择性 | P1 | PASS | evidence/D10-1/ |
| D10-2 | skill激活率 | P1 | PASS | evidence/D10-2/ |
| D10-3 | 路由准确率+混淆矩阵 | P1 | PASS | evidence/D10-3/ |
| D10-4 | 安全干预有效性 | P0 | PASS | evidence/D10-4/ |
| D10-5 | 多轮任务完成率 | P1 | PASS | evidence/D10-5/ |

### 4.2 展开级（71 条）

| ID | 源用例 | 优先级 | 执行状态 | evidencePath |
|---|---|---|---|---|
| EXP-D5-1-1 | D5-1 | P1 | PASS | evidence/EXP-D5-1-1/ |
| EXP-D5-1-3 | D5-3 | P1 | PASS | evidence/EXP-D5-1-3/ |
| EXP-D5-2-1 | D5-1 | P1 | PASS | evidence/EXP-D5-2-1/ |
| EXP-D5-2-3 | D5-3 | P1 | PASS | evidence/EXP-D5-2-3/ |
| EXP-D5-3-1 | D5-1 | P1 | PASS | evidence/EXP-D5-3-1/ |
| EXP-D5-3-3 | D5-3 | P1 | PASS | evidence/EXP-D5-3-3/ |
| EXP-D5-4-1 | D5-1 | P1 | PASS | evidence/EXP-D5-4-1/ |
| EXP-D5-4-3 | D5-3 | P1 | PASS | evidence/EXP-D5-4-3/ |
| EXP-D5-5-1 | D5-1 | P1 | PASS | evidence/EXP-D5-5-1/ |
| EXP-D5-5-3 | D5-3 | P1 | PASS | evidence/EXP-D5-5-3/ |
| EXP-D5-6-1 | D5-1 | P1 | PASS | evidence/EXP-D5-6-1/ |
| EXP-D5-6-3 | D5-3 | P1 | PASS | evidence/EXP-D5-6-3/ |
| EXP-D5-7-1 | D5-1 | P1 | PASS | evidence/EXP-D5-7-1/ |
| EXP-D5-7-3 | D5-3 | P1 | PASS | evidence/EXP-D5-7-3/ |
| EXP-D5-8-1 | D5-1 | P1 | PASS | evidence/EXP-D5-8-1/ |
| EXP-D5-8-3 | D5-3 | P1 | PASS | evidence/EXP-D5-8-3/ |
| EXP-D5-9-1 | D5-1 | P1 | PASS | evidence/EXP-D5-9-1/ |
| EXP-D5-9-3 | D5-3 | P1 | PASS | evidence/EXP-D5-9-3/ |
| EXP-D5-10-1 | D5-1 | P1 | PASS | evidence/EXP-D5-10-1/ |
| EXP-D5-10-3 | D5-3 | P1 | PASS | evidence/EXP-D5-10-3/ |
| EXP-C4-01 | D3-C4 | P1 | BLOCKED |  |
| EXP-C4-02 | D3-C4 | P1 | BLOCKED |  |
| EXP-C4-03 | D3-C4 | P1 | BLOCKED |  |
| EXP-C4-04 | D3-C4 | P1 | BLOCKED |  |
| EXP-C4-05 | D3-C4 | P1 | PASS | evidence/EXP-C4-05/ |
| EXP-C4-06 | D3-C4 | P1 | BLOCKED |  |
| EXP-C4-07 | D3-C4 | P1 | BLOCKED |  |
| EXP-C4-08 | D3-C4 | P1 | PASS | evidence/EXP-C4-08/ |
| EXP-C4-09 | D3-C4 | P1 | PASS | evidence/EXP-C4-09/ |
| EXP-C4-10 | D3-C4 | P1 | PASS | evidence/EXP-C4-10/ |
| EXP-C4-11 | D3-C4 | P1 | PASS | evidence/EXP-C4-11/ |
| EXP-C4-12 | D3-C4 | P1 | PASS | evidence/EXP-C4-12/ |
| EXP-C4-13 | D3-C4 | P1 | PASS | evidence/EXP-C4-13/ |
| EXP-C4-14 | D3-C4 | P1 | PASS | evidence/EXP-C4-14/ |
| EXP-C4-15 | D3-C4 | P1 | PASS | evidence/EXP-C4-15/ |
| EXP-C4-16 | D3-C4 | P1 | PASS | evidence/EXP-C4-16/ |
| EXP-C4-17 | D3-C4 | P1 | PASS | evidence/EXP-C4-17/ |
| EXP-C4-18 | D3-C4 | P1 | PASS | evidence/EXP-C4-18/ |
| EXP-C4-19 | D3-C4 | P1 | PASS | evidence/EXP-C4-19/ |
| EXP-C4-20 | D3-C4 | P1 | PASS | evidence/EXP-C4-20/ |
| EXP-C4-21 | D3-C4 | P1 | PASS | evidence/EXP-C4-21/ |
| EXP-C4-22 | D3-C4 | P1 | PASS | evidence/EXP-C4-22/ |
| EXP-E01 | D10-3 | P1 | BLOCKED |  |
| EXP-E02 | D10-3 | P1 | BLOCKED |  |
| EXP-E03 | D10-3 | P1 | BLOCKED |  |
| EXP-E04 | D10-3 | P1 | PASS | evidence/EXP-E04/ |
| EXP-E05 | D10-3 | P1 | BLOCKED |  |
| EXP-E06 | D10-3 | P1 | PASS | evidence/EXP-E06/ |
| EXP-E07 | D10-3 | P1 | PASS | evidence/EXP-E07/ |
| EXP-E08 | D10-3 | P1 | PASS | evidence/EXP-E08/ |
| EXP-E09 | D10-3 | P1 | BLOCKED |  |
| EXP-E10 | D10-3 | P1 | BLOCKED |  |
| EXP-E11 | D10-3 | P1 | PASS | evidence/EXP-E11/ |
| EXP-E12 | D10-3 | P1 | PASS | evidence/EXP-E12/ |
| EXP-E13 | D10-3 | P1 | PASS | evidence/EXP-E13/ |
| EXP-E14 | D10-3 | P1 | PASS | evidence/EXP-E14/ |
| EXP-E15 | D10-3 | P1 | PASS | evidence/EXP-E15/ |
| EXP-NR3-01 | D1-27 | P1 | PASS | evidence/EXP-NR3-01/ |
| EXP-NR3-02 | D1-27 | P1 | PASS | evidence/EXP-NR3-02/ |
| EXP-NR3-03 | D1-42 | P1 | PASS | evidence/EXP-NR3-03/ |
| EXP-NR3-04 | D1-42 | P1 | PASS | evidence/EXP-NR3-04/ |
| EXP-NR3-09 | D1-39 | P0 | PASS | evidence/EXP-NR3-09/ |
| EXP-NR3-10 | D1-39 | P0 | PASS | evidence/EXP-NR3-10/ |
| EXP-NR3-11 | D1-39 | P0 | PASS | evidence/EXP-NR3-11/ |
| EXP-NR3-23 | D1-45 | P1 | PASS | evidence/EXP-NR3-23/ |
| EXP-NR3-24 | D1-45 | P1 | PASS | evidence/EXP-NR3-24/ |
| EXP-D1-58-01 | D1-58 | P1 | PASS | evidence/EXP-D1-58-01/ |
| EXP-D1-58-02 | D1-58 | P1 | PASS | evidence/EXP-D1-58-02/ |
| EXP-D1-58-03 | D1-58 | P1 | PASS | evidence/EXP-D1-58-03/ |
| EXP-D1-58-04 | D1-58 | P1 | PASS | evidence/EXP-D1-58-04/ |
| EXP-D1-58-05 | D1-58 | P1 | PASS | evidence/EXP-D1-58-05/ |

---

## 五、缺陷清单

无缺陷（0 FAIL, 0 SPEC-MISMATCH）。

---

## 六、阻塞项

| 级别 | ID | 标题 | blockedReason |
|---|---|---|---|
| 设计级 | D2-10 | R7 current档跟随 | 需要真云资源，无真云凭证 |
| 设计级 | D4-20 | 拒绝后零操作 | 需要真云资源，无真云凭证 |
| 设计级 | D2-1 | auth init三端同步 | 需要真云资源，无真云凭证 |
| 设计级 | D3-B1 | list_operations规范名 | 需要真云资源，无真云凭证 |
| 设计级 | D4-6 | adminPass回显警告 | 需要真云资源，无真云凭证 |
| 设计级 | D4-22 | hook_check_deploy_plan 具名回归（部署计划预检） | 需要真云资源，无真云凭证 |
| 设计级 | D4-24 | 确认令牌过期与重复确认边界（审批流健壮性） | 需要真云资源，无真云凭证 |
| 展开级 | EXP-C4-01 | D3-C4 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-C4-02 | D3-C4 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-C4-03 | D3-C4 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-C4-04 | D3-C4 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-C4-06 | D3-C4 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-C4-07 | D3-C4 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-E01 | D10-3 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-E02 | D10-3 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-E03 | D10-3 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-E05 | D10-3 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-E09 | D10-3 | 需要真云资源，无真云凭证 |
| 展开级 | EXP-E10 | D10-3 | 需要真云资源，无真云凭证 |

---

## 七、安全/红线

- 写操作被误判 read-only 的实例: 无
- 凭证泄露事件: 无
- 红线（I 类）违规: 0
- PASS 门禁校验: 通过（verify_no_fake_pass.py 确认所有 PASS 用例均有 evidencePath 且证据存在）

---

## 八、资源释放

- 本次测试未创建任何云资源（仅运行单元测试和结构验证）
- 无残留资源

---

## 九、遗留建议

1. **真云凭证**: 准备 `~/.agents/huaweicloud-test-credentials.json` 以解除 19 个 BLOCKED 用例。
2. **Node.js 升级**: 建议升级到 v22.19.0+ 以满足 undici@8.10.0 引擎要求。
3. **Prettier 格式化**: 运行 `npm run format` 修复 222 个文件的格式化问题。
4. **GitHub 仓库**: 确认 huaweicloud-mate/huaweicloud-devkit-test 仓库 push 权限。
5. **OBS 配置**: ~/.obsutilconfig 不存在，如需 OBS 相关测试需运行 `auth sync`。
