# Hermes-deepseek-v4.1-flash-1017 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-22 05:28（北京时间）
> **执行归档**：`results/Hermes/2026-11-22-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项 FAIL + 1 项 SPEC）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux` (aarch64) |
| 被测版本（SUT） | `v1.1.15`（npm latest 正式版，源码 hdk HEAD `bf79b643`） |
| Node 运行时 | `v22.23.2`（满足 1.1.15 引擎要求） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classify / hook / auth / protocol / extended / supplement / new-* / fixtures 等 30+ 探针），MCP 协议 spawn `mcp-server.mjs` 驱动；CLI 真机执行（install / status / doctor / update，隔离 HOME + HERMES_HOME）；真云 E2E 建删资源（D3-C1/C2/C3/C6/C7 + realcloud-probe + D4-13 只读子账号 + D4-23/D4-24）；结果落 `evidence/<case-id>/stdout.txt`，`backfill_today.py` 批量回填 3 份 CSV。全流程 `run_all.sh` 一次跑完（**05:03:17 → 05:09:19**，43 组步骤），另对 D3-S3 做严格断言复跑。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 14 / 0 / 4 / 4` |
| 通过率（分母 = PASS+FAIL = 142） | `90.1%` |
| P0 / P1 / P2 缺陷 | `4 / 6 / 7`（合 17 条，见 FINDINGS.md） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次创建全部归零（ECS/VPC/子网/OBS/沙箱会话/EIP 均 GONE，含手工复核）` |

> **与上一日（2026-11-21）对比**：SUT 未变（`latest`=1.1.15、hdk `bf79b643`），用例集未变（107+43），**逐用例状态与上一日 0 差异**——17 项缺陷全部复现，无新增、无修复、无 BLOCKED。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `86` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `4` | 契约漂移 |
| NOT_RUN | `4` | 未执行（见第五节） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（与 D10-3 同根因） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

### 3.3 门禁校验

| 门禁 | 结果 |
|---|---|
| `verify_no_fake_pass.py Hermes Linux` | `通过`（所有 PASS 用例均有 evidencePath 且证据存在） |
| `verify_coverage.py Hermes Linux` | `通过`（P0 无 NOT_RUN/空；NOT_RUN+空占比 设计级 2.8% / 展开级 0.0%，阈值 15%） |

---

## 四、缺陷清单

> 完整逐条「级别 + 现象 + 唯一断言 + 根因(文件:行号) + 证据」见同目录 `FINDINGS.md`（17 条，含 4 条 SPEC-MISMATCH：D10-4/D9-9/D8-9/D3-C14）。下表为 13 条 FAIL 用例（EXP-E01 与 D10-3 同根因已合并）摘要。

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 generic access_key | `safety-policy.mjs:550` env-dump 正则缺裸 access_key/secret_key |
| 2 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL broad IAM 制品 | `safety/rules/cloud-risk-rules.json:196` regex 未覆盖 HCL `actions=["*"]` |
| 3 | P0 | `D9-12` | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:45-66/70` 缺 runVersionCheck + tools/list 无 initialize 前置 |
| 4 | P1 | `D4-6` | `--admin-pass` 不告警 + adminPass 未脱敏 | `cloud-risk-rules.json:68` stages 缺 command；`safety-policy.mjs` redactSecrets 键名缺口 |
| 5 | P1 | `D4-17` | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` 默认 allow |
| 6 | P1 | `D3-S7` | 跨服务交付 RDS 部署目标未命中 + CreateInstance 缺前置 | `tools.mjs` serviceCatalog 复合意图部署目标缺失 + RDS 参数装配缺口（本轮 `db.port`） |
| 7 | P1 | `D10-3`/`EXP-E01` | serviceCatalog 中文「云主机」路由 MISS（92.9%） | `tools.mjs:2197` routeMap ECS 缺「云主机」同义词 |
| 8 | P1 | `D3-S3` | 沙箱预览部署成功但无公网 URL | `sandbox/session-manager.mjs:1282` closeSession 未回收 nginx 配置/进程；`deployNginx:833` 未随迁 DevBridge 隧道 |
| 9 | P1 | `D9-9` | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs:60-62` initialize capabilities 缺 cancellation |
| 10 | P2 | `D3-S5` | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog 无复合意图分层拆解 |
| 11 | P2 | `D3-S6` | FunctionGraph 定时任务创建失败（code.zip_file） | `tools.mjs` CreateFunction 参数装配缺口 |
| 12 | P2 | `D4-25` | Python hook 写操作遥测误分类 cli:invoke | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组不匹配（应 `\b`） |
| 13 | P2 | `D4-26` | findings 证据脱敏不完整 | `risk-rule-engine.mjs:22` redactEvidence 键名表缺空格/JSON 带引号形态 |
| 14 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry/telemetry.mjs:190` sanitizeValue 无敏感值脱敏 |
| 15 | P2 | `D3-C14` | 沙箱 connect template_id 下线改用 pool_type（SPEC） | `sandbox/hdkitservice-api.mjs:191-194` template_id 下线，pool_type 校验 |
| 16 | P0 | `D10-4` | 规则库条目数漂移 16→19（SPEC，实现正确） | `safety/rules/cloud-risk-rules.json` 19 条(9deny+10warn) vs 用例断言 16 条 |
| 17 | P2 | `D3-C2` | OBS 建桶成功但 `hcloud OBS mb` 退出码 6 | 非 devkit JS 源码：KooCLI 7.2.12 OBS `mb` 退出码映射（`scripts/realcloud_e2e.mjs:64` 依赖 rc=0） |

> **本轮重点复核**：
> - `D3-S3`（P1）本轮在**全新 workspace/会话**下复测——`deploy_nginx` 返回 `ok=true, port=8080, url=""`（无端口冲突、未改绑端口），`deploy_check` 为 `nginx_serving=FAIL(no HTTP response)` / `devbridge_tunnel=FAIL` / `output_dir=PASS` / `complete=false` → 证明**端口残留只是加剧因素**，只要部署未同步建立并返回 DevBridge 隧道 URL，预览即不可交付。
> - `D3-C2`（P2）建桶/静态站/删桶三步实测均成功（`Create bucket ... successfully` / set 200 / delete successfully），失败点仍是 `hcloud OBS mb` 成功却返回退出码 6，属 KooCLI 退出码映射问题（同机对照 `OBS ls`/`VPC ListVpcs`/`ECS ListServersDetails` rc=0）。
> - `D4-13` 只读子账号：`readPassRate=100%`，写 VPC 被策略拒 `VPC.0010 PolicyNotAuthorized`（符合最小权限预期，PASS）。
> - `D10-3`：评测集 HIT=13 / MISS=1 / N/A=1（准确率 92.9%），唯一 MISS 仍为「云主机」→ECS。

---

## 五、未执行用例与原因

### NOT_RUN（4 条）

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10（disttags 探针）代表覆盖，本轮该探针 PASS | 【调归属】 |
| `D8-1` | D8质量 | 文档与能力一致 | 需白盒 docs 全量逐篇比对（当前无机器可判定的断言），本轮未覆盖 | 【改用例】 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 需逐条核验 getting-started 步骤（无自动化探针、预期不可机械判定），本轮未覆盖 | 【改用例】 |
| `D8-6` | D8质量 | 中英文文档一致 | 需中英双源逐段比对（无基线差异集），本轮未覆盖 | 【改用例】 |

### BLOCKED

`0`（本轮无 BLOCKED：D4-13 只读子账号、D10-3 评测 harness、D6 压测、D9 协议探针、真云 E2E 均实跑）

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云/脱敏用例全程无明文 AK/SK 外泄，`show_profile_redacted` 脱敏 PASS）
- [x] 写操作误判 read-only：`0`（D4-5 写操作不被误判只读 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 AK/SK 仅存 `~/.config/huaweicloud/credentials.json`，未落入 results；D4-26 记录的明文 secret 为**故意构造的测试诱饵值**，非真实凭证）
- [x] 指令红线：未改造用例母版 `test-cases/`、未触碰 `Summary/` 与其他客户端目录、未操作任何 GitHub issue（提单由本轮统一 `file_issue.py` 查重后处理）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（`68e4d403-c084-4bbf-b90f-6aca910c5846`，testbot3-hermes-ecs-5295143747） | 已删（含公网 IP/系统盘） | 自动化 finally 150s 轮询未确认 → 手工 `DeleteServers --delete_publicip=true --delete_volume=true` → 轮询 GONE（round 8；期间同账号另一台 Hermes 机器并发建机干扰计数）→ ListServersDetails 无该 id |
| VPC / 子网（D3-C1） | 是（`4c7c6af6-31cd-4264-a70e-728daeaf19ca` / `e1bc120f-14a3-4a99-b907-a8021712f936`） | 已删 | `DeleteSubnet` → GONE → `DeleteVpc` → GONE；ListVpcs/ListSubnets 无本次 id |
| OBS 桶（D3-C2） | 是（`testbot3-hermes-obs-5295305502`） | 已删 | `Delete bucket [testbot3-hermes-obs-5295305502] successfully!`，OBS 桶总数 = 0 |
| 沙箱会话（D3-C6/D3-C3/D3-S3/D3-S2/D3-C13） | 是 | `close_session` 已关 | 各用例 `close_session -> ok`；D3-C3 部署链路与 deploy_check 已记录 |
| EIP（D3-C7，ap-southeast-1） | 是（`7d17b777-2335-4719-a16d-40fb0749f21c`） | 已释放 | `ListEips` 无本次 id（无残留） |
| FunctionGraph 函数（D3-S6） | 创建失败回滚 | 已删 | 归零 OK |
| RDS 实例（D3-S7） | 未创建成功 | n/a | `CreateInstance` 前置失败（`Invalid parameter: db.port`），无实例残留 |
| 只读子账号（D4-13） | 未创建资源 | n/a | `readPassRate=100%`，写 VPC 被策略拒（VPC.0010），核实未创建 |
| VPC（D3-S2，真实建删演练） | 是（tctest-hermes-s2-*） | 已删 | 确认流后删除成功且归零 |

> 真云只删本次创建资源（按本次 `serverId`/`subnetId`/`vpcId`/`bucketName` 精确匹配）；删除前全量盘点，未触碰他人/既有资源。
> **云端终态盘点（cn-north-4）**：本次 ECS/VPC/SUBNET/EIP/OBS **全部归零**。盘点期间可见同账号另一台 Hermes 机器（`results/Hermes/2026-11-22-1.92.93.23/`，05:10–05:11 并发执行）创建的 `testbot3-hermes-ecs-5295402214` / `testbot3-hermes-ecs-5295456750` 及其 VPC/子网，**非本轮创建，按红线未删除**；另有 `tctest-s2` 等他客户端既有 VPC，亦未触碰。

---

## 八、遗留与建议

- **本轮继续 PASS**：`D1-70`（代理 WebSocket 崩溃，Node floor 22.19 + undici 升级后不复现），无需再提单。
- **`D3-S3`（P1，沙箱预览无公网 URL）**：建议 ①`closeSession`/`deployNginx` 增加 nginx 配置与进程回收（或按 workspace 幂等替换）；②端口改绑时自动重建/迁移 DevBridge 隧道，而非仅给手工提示；③`deploy_check` 以实际返回的 `port` 为准校验而非固定 8080。该缺陷同时解释 SandboxMonitor 反复出现的 `MCP -32603 ... all ports 8080-8089 are in use`。
- **待裁决 SPEC（4 项）**：`D9-9`（capabilities.cancellation 未声明）、`D10-4`（规则库 16→19 条断言漂移）、`D8-9`（sanitizeValue 未脱敏）、`D3-C14`（沙箱 connect `template_id` 下线改用 `pool_type`，探针/用例断言需同步）——均待维护更新用例母版/断言。
- **历史缺陷 `D3-C2`（P2）**：OBS 建桶/静态站/删桶三步实测均成功，失败点在 `hcloud OBS mb` 成功仍返回退出码 6（KooCLI 7.2.12，连续多轮复现）；建议 devkit 侧 OBS CLI 结果判定改用响应文本/JSON 解析而非仅退出码。
- **环境提示**：`realcloud-probe` 的 `auth_status` 报 `version_mismatch`——本机 KooCLI `7.2.12`，本插件配对版本 `7.3.12`（`nextStep: npx huaweicloud-devkit install-hcloud`）。不影响本轮用例结论（D2-1 PASS），但建议各测试机执行 `install-hcloud` 对齐版本，避免 OBS `mb` 等子命令退出码差异干扰判定。
- **未覆盖（NOT_RUN）**：`D8-1`/`D8-4`/`D8-6`（文档一致性类需白盒全量比对，【改用例】）、`D1-39`（Windows 专属，Linux 由 EXP-NR3-10 覆盖，【调归属】）。
- **建议**：17 项缺陷已连续多轮复现，建议上游优先收敛 P0 安全三项（`D4-2`/`D4-21`/`D9-12`）+ 沙箱端口回收与预览 URL（`D3-S3`），并同步 `D10-4`/`D3-C14` 用例断言。每日测试 Node 运行时稳定于 `~/node22` v22.23.2。