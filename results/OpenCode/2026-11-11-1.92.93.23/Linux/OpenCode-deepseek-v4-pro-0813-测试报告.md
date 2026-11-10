# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-11 05:20:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-11-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷：P0 5 项 / P1 4 项 / P2 2 项，SPEC-MISMATCH 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64`（非 TTY，bash） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14-next.2`（npm @next，gitHead `5c9478d3`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS 注册源数量） |
| hcloud / 依赖 | `KooCLI 7.2.12`（cn-north-4 已认证） |
| 真云凭证 | `cn-north-4`（AKSK 管理账号 + test001 只读子账号，均就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议（stdio）/ 真云 E2E（建删资源归零）/ 沙箱 E2E / D10 评测集 harness |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（`_probe/main.mjs` + `checks1-4.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（hdk 已 checkout 到被测版本 5c9478d3），决策/结果机器可读落 `evidence/<case-id>/stdout.log`；真云 E2E 用 `hcloud` CLI 真机建删资源并归零验证（D3-C2 OBS 静态站 curl200 通过、D3-C1 VPC/子网/安全组创建→删除→归零通过、D3-C3 沙箱部署重试后通过）；MCP 协议用例用 `mcp-server.mjs` stdio 子进程发包；D10 路由层用 `run-eval.mjs` 跑 serviceCatalog。证据统一按 `evidence/<case-id>/`（probe.mjs + stdout.log）组织，146 条用例全部落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 条 Windows 专属用例在 Linux 标 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC = 143，不含 BLOCKED/NOT_RUN） | `90.9%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 2`（另有 2 项测试侧断言过严，非产品缺陷） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS 未建成/VPC·子网·安全组·OBS·EIP·沙箱会话均已删，云端复核无本次创建残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单（含 2 项测试侧：D2-10、D3-C14） |
| BLOCKED | `2` | 环境阻塞（D3-C1 billing、D3-C7 跨 region），见 §五 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级），待裁决 |
| NOT_RUN | `1` | D1-39 Windows 专属用例，本机 Linux 不适用 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 ak=/sk= | 任意大小写 `ak=`/`sk=` 均 `<redacted>` | 小写 `ak=`/`sk=` 明文残留 | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | KMS DecryptData 明文 secret API 未拦截 | `hcloud kms DecryptData` 返回 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:47-67` | 待提单 |
| 3 | P0 | `D4-16` | 命令包裹穿透（sh -c 内层 env dump） | `sh -c "env \| grep ..."` 返回 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:26-44` | 待提单 |
| 4 | P0 | `D4-21` | HCL/Terraform IAM 制品未拦截 | HCL `actions = ["*"]` 返回 `deny` | 返回 `allow`（JSON 正常 deny） | `safety/rules/cloud-risk-rules.json:196-219` | 待提单 |
| 5 | P0 | `D9-12` | initialize 握手未 enforce 时序 | 未 init 先 tools/list 返回 `-32600` | 返回 40 工具列表 | `src/mcp-server.mjs:189-199` | 待提单 |
| 6 | P1 | `D4-17` | 模糊输入 fail-closed 失效 | `$(curl ...)` 返回 `deny`/`warn` | 返回 `allow`（fail-open） | `src/risk-rule-engine.mjs:106` | 待提单 |
| 7 | P1 | `D3-S7` | 跨服务复合意图仅命中 RDS | 同时命中 RDS+部署目标 | 仅命中 `RDS` | `src/tools.mjs:2548-2573` | 待提单 |
| 8 | P1 | `EXP-E01` | 「云主机」意图未路由 ECS | 命中 `ECS` | fallback `Run hcloud --help` | `src/tools.mjs:2323-2337` | 待提单 |
| 9 | P1 | `D3-S3` | 沙箱预览 URL 端口漂移后不自动完成 | `tunnel_url_accessible=true`/`complete=true` | `complete=false`（devbridge_tunnel FAIL） | `src/sandbox/session-manager.mjs:208,1118-1121` | 待提单 |
| 10 | P2 | `D1-68` | region 优先级契约漂移 | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `src/auth/credentials.mjs:225` | 待提单 |
| 11 | P2 | `D8-9` | 遥测 sanitizeValue 未脱敏 | 凭证值 `<redacted>` | 明文残留 | `src/telemetry/telemetry.mjs:190-197` | 待提单 |
| 12 | 测试侧 | `D2-10` | fixture 对双语报错文案精确相等断言过严 | （非产品缺陷） | fixture exit=1，功能 5 项全 PASS | `eval/harness/fixtures/d2-10-koocli-profile.mjs` | 不提单 |
| 13 | 测试侧 | `D3-C14` | fixture 对本地化文案精确相等断言过严 | （非产品缺陷） | fixture exit=1，9/10 断言 PASS | `eval/harness/fixtures/d3-c14-sandbox-hwlink-cred.mjs` | 不提单 |

> 完整根因 + 代码定位见 `FINDINGS.md`（统一提单脚本解析输入）。#12/#13 为测试侧断言问题（产品行为正确：报错文案正确附加中文指引/本地化），不计入产品缺陷单。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注「Windows（升级检测链 EINVAL 专属；Linux/macOS 由 NR3 终端矩阵按负面/环境验证）」，本机为 Linux，非对应 OS，按 OS 专属豁免标 NOT_RUN | 无（Linux 侧由展开级 EXP-NR3 代表覆盖，归属正确） |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | ECS CreateServers 订单提交被 billing 拒绝：`Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已真机实测 VPC/子网/安全组 创建→删除→归零 全部成功，ECS 到达订单提交层 | 账号开通 ECS 购买产品/开启按需计费后复测 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3、plan_cli_command 含 --cli-region | 账号开通 ap-southeast-3 项目/region 权限后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 写操作判定 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 AK/SK 仅从 `~/.config/huaweicloud/credentials.json` 注入，未写入 evidence）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/子网/安全组（D3-C1、D3-S2） | 是 | 已删 | 云端复核无 `testbot2-opencode-*` VPC 残留 |
| OBS 桶（D3-C2、D3-C13） | 是 | 已删 | `hcloud OBS ls` 无 `testbot2-opencode-*` 桶 |
| ECS（D3-C1） | 否（订单被 billing 拒绝） | — | 无创建即无残留 |
| EIP（D3-C7 跨区域） | 否（region 无权限） | — | 无创建即无残留 |
| 沙箱会话（D3-C3/C6/S3） | 是 | 已 close_session | session 关闭 |

> 真云只删本次创建资源；未动其他客户端/历史创建的任何资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（HUAWEICLOUD_REGION vs HW_REGION 优先级，修契约 or 修实现）。
- 历史缺陷复核：本轮 11 项产品缺陷与 2026-11-10 FINDINGS 基本一致（SUT 由 v1.1.14-next.1 → next.2 未修复），其中 `D3-C3` 由「8080-8089 端口被占 BLOCKED」重试后转 `PASS`（环境恢复）。
- 本轮未覆盖：真实 Agent 会话评测执行器（D10-1/2/5/9）非 DSH 客户端不适用；Windows 专属 D1-39。
- 建议：① `safety-policy.mjs:45` 正则补 `/i` 并收编小写 `ak/sk`；② `cloud-risk-rules.json` 补 KMS `DecryptData`、HCL `actions`、shell 包裹展开；③ `risk-rule-engine.mjs` 默认改 fail-closed；④ mcp-server 维护 initialize 状态机；⑤ serviceCatalog 补「云主机」关键词与中文部署意图、sandbox 端口漂移自动重绑 devbridge 隧道。