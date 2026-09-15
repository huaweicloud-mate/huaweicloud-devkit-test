# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-15 18:30`（北京时间）
> **执行归档**：`results/OpenClaw/2026-09-15-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（8 项 FAIL 均已有同根因历史单；4 项 P0 未修复，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256`，PR #669） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | `cn-north-4`（管理员 AKSK 已配置；只读子账号 `credentials.readonly.json` 未配置） |
| 测试类型 | 源码级探针 / MCP 协议 / 部分真机 CLI；真云 E2E 与多终端矩阵受环境限制 |
| daily 基础用例 | 设计级 77 / 展开级 17（本客户端 OpenClaw+Linux 预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 / 走真实 mcp-server JSON-RPC，决策与结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily，预筛后） | `94`（77 设计级 + 17 展开级） |
| 已执行 | `94` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `55 / 17 / 22 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC，去 BLOCKED/NOT_RUN） | `76.4%`（55/72） |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（8 项 FAIL 均历史同源或已提单，无新增） |
| 红线（I 类）违规 | `4`（D4-2/D4-16/D4-21/D4-23 均为凭证/越权安全红线，历史未修复） |
| 资源释放 | `全部归零 / 本轮未创建真云资源` |

---

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 50 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | D4-2/D4-16/D4-21/D4-23/D4-6/D4-7/D9-2/D10-3，根因见缺陷清单 |
| BLOCKED | 19 | 真机生命周期/真云 E2E/夹具缺失，均写 blockedReason |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **77** | |

### 3.2 展开级（17）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | EXP-D5-9-1/EXP-D5-9-3 + EXP-E06/E09/E15（路由命中，有证据） |
| FAIL | 9 | EXP-E01/E02/E04/E05/E07/E10/E11/E12/E14（路由 MISS，同 D10-3 根因） |
| BLOCKED | 3 | EXP-E03/E08/E13（oracle 需维护者裁决，详见 §五） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **17** | |

---

## 四、缺陷清单

> 本轮 8 项 FAIL（设计级）+ 9 项展开级 FAIL（映射 D10-3）均有明确根因（`文件:行号`）+ 复现证据。经 `file_issue.py` 查重口径逐条核对上游 open issue，**全部命中历史同源单或已提单**，按红线「勿重复拆单」本轮不新开单。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整（HW_ 前缀） | `safety-policy.mjs:336` | 历史 #651/#652/#673/#674/#676/#679/#681 |
| 2 | P0 | D4-16 | 命令包裹穿透（sh -c wrapper） | `safety-policy.mjs:335` | 历史 #651/#652/#674/#676/#681/#682 |
| 3 | P0 | D4-21 | 制品预检未检出 HCL broad IAM | `cloud-risk-rules.json:188-196` | 历史 #651/#652 |
| 4 | P0 | D4-23 | 全局规则 huawei-agent-rules 注入失效 | `package.json:8-18` + `setup-cli.mjs` | 历史 #651/#673/#674/#676/#679 |
| 5 | P1 | D4-6 | adminPass 空格形式回显未脱敏 | `safety-policy.mjs:42` | 历史 #651/#673/#679 |
| 6 | P1 | D4-7 | hook_check_artifacts broad IAM 失效 | `cloud-risk-rules.json:188-196` | 历史 #651/#652 |
| 7 | P1 | D9-2 | JSON-RPC 未知方法 -32601 缺失 | `mcp-server.mjs:169` | 历史 #651/#652/#674/#676/#689 |
| 8 | P1 | D10-3 | 中文意图路由未命中（serviceCatalog 仅英文关键词） | `tools.mjs:1776-1910` | 已提单 #689（Hermes 开出） |

每个缺陷的「现象 + 精确断言 + 证据路径」见同目录 `FINDINGS.md`（严格遵循 file_issue.py 解析格式）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 本轮 NOT_RUN = 0。BLOCKED 共 22 条（设计级 19 + 展开级 3），均写 blockedReason，逐条分类如下：

### 设计级（19，均为「补环境」，少数标注需维护者裁决）

| 用例ID | 优先级 | 分类 | 详细原因 |
|---|---|---|---|
| D1-1 | P1 | 补环境 | 需真机 OpenClaw install --target 生命周期 + 隔离 HOME 验证 |
| D1-2 | P2 | 补环境 | 需多客户端共存环境验证 auto-detect，本机仅 OpenClaw |
| D1-3 | P1 | 补环境 | 需真机 doctor CLI + 人为制造组件缺失场景 |
| D1-4 | P2 | 补环境 | 需真机 status/update CLI + 用户自定义 config 保护 |
| D1-5 | P1 | 补环境 | 需真机 uninstall + 残留扫描（本机无真机安装态） |
| D1-6 | P2 | 补环境 | 需无 KooCLI 环境；本机已装 hcloud 7.2.12 |
| D1-41 | P1 | 补环境 | 需隔离 MCP 进程 + 可控 registry 四态注入 |
| D1-42 | P1 | 补环境 | 需隔离 HOME + CROSS_PROCESS 跨进程复查 |
| D1-45 | P1 | 补环境 | 需隔离 MCP 进程 + 预热竞态双时序注入 |
| D2-1 | P1 | 改用例 → 需裁决 | 现 tool 描述已改为 S1/S2/S3 语义（README 的"沙箱 API"措辞已失效）；沙箱端无独立同步路径，三端=KooCLI/OBS 实际可达，建议维护者修订用例措辞 |
| D4-10 | P2 | 补环境 | 需规则库版本快照 + 新增规则项注入夹具 |
| D4-12 | P2 | 补环境 | 需 npm 供应链攻击仿真夹具 |
| D4-13 | P1 | 补环境 | 只读子账号 `credentials.readonly.json` 未配置，`run-as-readonly.py` 无法切换 |
| D4-14 | P2 | 补环境 | 需真云 CTS 审计日志验证 |
| D4-24 | P1 | 补环境 | 需真云确认流 + 可注入时钟（审批流健壮性） |
| D9-4 | P1 | 补环境 | 需长连接断连/重连/关闭时序夹具 |
| D9-6 | P1 | 补环境 | 需多客户端同机环境 |
| D9-7 | P2 | 补环境 | 需多版本服务端/客户端夹具 |
| D9-9 | P1 | 补环境 | 需可注入延迟夹具 + capabilities.cancellation |

### 展开级（3，均「改用例」，需维护者修订母版 oracle）

| 用例ID | 优先级 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|
| EXP-E03 | P1 | 改用例 | 实现「部署/网站→sandbox first」与设计 oracle「OBS 静态站」漂移，两关键字表（OBS keywords 与 sandbox keywords）交叠于 `static website/静态` | 明确 OBS 静态站部署与 sandbox 部署的区分规则，或拆分为两用例 |
| EXP-E08 | P1 | 改用例 | 诊断类意图应走 `explain_error`，不归 `serviceCatalog`；单一 serviceCatalog 断言无法判定 | 展开规则改为「断言走 explain_error 诊断工具」，而非 serviceCatalog 命中服务 |
| EXP-E13 | P1 | 改用例 | 「证书/ELB」横跨 DEW（证书）+ ELB 两域，单一推荐服务断言不可判定 | 拆为「申请证书（DEW）」与「绑定 ELB（ELB）」两条，或允许推荐集含两域任一 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`4`（D4-2/D4-16/D4-21/D4-23，均为凭证 dump / 命令包裹 / broad IAM / 规则注入失效，历史未修复，已跟踪既有 issue）
- [x] 脱敏复核：证据目录无原始凭证 / 未脱敏日志（探针全部使用假凭证 `AK*`/`SK*` 占位）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/RDS/CCE/WAF/OBS 等 | 否 | — | 本轮未创建任何真云资源 |
| 临时 HOME / 隔离目录 | 是（探针内 `/tmp/hdk-*`） | 已删（finally rm） | 无残留 |

> 本轮全部为源码级探针与只读规划，未触发真云写操作，无资源残留风险。

---

## 八、遗留与建议

- **历史缺陷未修复**：D4-2/D4-16/D4-21/D4-23 四项 P0 安全红线在 v1.1.4 正式版仍未修复（均已有上游 open issue + 部分含修复 PR #688），建议维护者跟进合入，本客户端持续复测。
- **中文路由是重灾区**：D10-3 中文意图准确率仅 21.4%（15 条中 3 条命中），根因 `tools.mjs` routeMap 全部英文关键词，中文用户主场景（ECS/RDS/OBS/费用/监控等）无法路由——这是真实可用性缺口，建议列为高优先级修复。#689 已提单。
- **本轮未覆盖范围**：真云 E2E（建删资源归零）、多终端矩阵、审批流实时对话框、真机 install/doctor/uninstall 生命周期。补齐只读子账号 `credentials.readonly.json` 后 D4-13 可执行。
- **建议**：`serviceCatalog` 增加 CJK（中文）关键词→服务映射；`D2-1` 用例措辞与现行 S1/S2/S3 三端语义对齐。