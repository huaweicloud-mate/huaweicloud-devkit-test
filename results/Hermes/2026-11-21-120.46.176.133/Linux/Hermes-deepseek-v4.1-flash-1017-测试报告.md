# Hermes-deepseek-v4.1-flash-1017 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-21 05:40（北京时间）
> **执行归档**：`results/Hermes/2026-11-21-120.46.176.133/Linux/`
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

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classify/hook/auth/protocol/extended/supplement/new-* 等 30+ 探针），MCP 协议 spawn `mcp-server.mjs` 驱动；CLI 真机执行（install/status/doctor/update，隔离 HOME）；真云 E2E 建删资源（D3-C1/C2/C6/C3/C7 + realcloud-probe + D4-13 只读子账号）；结果落 `evidence/<case-id>/stdout.txt`，batch 回填三 CSV。全流程 run_all.sh 一次跑完（05:02–05:08，36 组探针 + 5 条真云用例）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 14 / 0 / 4 / 4` |
| 通过率（分母 = PASS+FAIL = 142） | `90.1%` |
| P0 / P1 / P2 缺陷 | `4 / 6 / 7`（合 17 条） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/子网/OBS/沙箱会话/EIP 本次 id 均 GONE，含手工复核）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `86` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单（含新增 D3-S3） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `4` | 契约漂移 |
| NOT_RUN | `4` | 未执行 |
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

---

## 四、缺陷清单

> 完整逐条根因+断言+证据见同目录 `FINDINGS.md`（17 条，含 4 条 SPEC-MISMATCH：D10-4/D9-9/D8-9/D3-C14）。下表为 FAIL 用例（13 条，EXP-E01 与 D10-3 同根因已合并）的根因文件:行号摘要。

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证env打印拦截未覆盖 generic access_key | `safety-policy.mjs:550` env-dump 正则缺裸 access_key/secret_key |
| 2 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL broad IAM 制品 | `safety/rules/cloud-risk-rules.json:196` regex 未覆盖 HCL `actions=["*"]` |
| 3 | P0 | `D9-12` | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:45-66/70` 缺 runVersionCheck + tools/list 无 initialize 前置 |
| 4 | P1 | `D4-6` | --admin-pass 不告警 + adminPass 未脱敏 | `cloud-risk-rules.json:68` stages 缺 command；safety-policy redactSecrets 键名缺口 |
| 5 | P1 | `D4-17` | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` 默认 allow |
| 6 | P1 | `D3-S7` | 跨服务交付 RDS 部署目标未命中 + CreateInstance 缺前置 | `tools.mjs` serviceCatalog 复合意图部署目标缺失 + RDS 参数装配缺口（本轮 db.port） |
| 7 | P1 | `D10-3`/`EXP-E01` | serviceCatalog 中文「云主机」路由 MISS（92.9%） | `tools.mjs:2197` routeMap ECS 缺「云主机」同义词 |
| 8 | P1 | `D3-S3` | **新增**：沙箱预览部署成功但无公网 URL | `sandbox/session-manager.mjs:1282` closeSession 未清理 nginx 配置/进程 → 8080-8089 端口池被历史配置占用；`deployNginx:833` 改绑端口后 DevBridge 隧道未随迁 |
| 9 | P1 | `D9-9` | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs:60-62` initialize capabilities 缺 cancellation |
| 10 | P2 | `D3-S5` | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog 无复合意图分层拆解 |
| 11 | P2 | `D3-S6` | FunctionGraph 定时任务创建失败（code.zip_file） | `tools.mjs` CreateFunction 参数装配缺口 |
| 12 | P2 | `D4-25` | Python hook 写操作遥测误分类 cli:invoke | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组不匹配 |
| 13 | P2 | `D4-26` | findings 证据脱敏不完整 | `risk-rule-engine.mjs:22` redactEvidence 键名表缺空格/JSON 带引号形态 |
| 14 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry/telemetry.mjs:190` sanitizeValue 无敏感值脱敏 |
| 15 | P2 | `D3-C14` | 沙箱 connect template_id 下线改用 pool_type（SPEC） | `sandbox/hdkitservice-api.mjs:191-194` template_id 下线，pool_type 校验 |
| 16 | P0 | `D10-4` | 规则库条目数漂移 16→19（SPEC，实现正确） | `safety/rules/cloud-risk-rules.json` 19 条(9deny+10warn) vs 用例断言 16 条 |
| 17 | P2 | `D3-C2` | OBS 建桶成功但 `hcloud OBS mb` 退出码 6 | 非 devkit JS 源码：KooCLI 7.2.12 OBS `mb` 退出码映射（`scripts/realcloud_e2e.mjs:64` 依赖 rc=0） |

> **版本结论（与上一日对比，v1.1.14 → v1.1.15）**：
> 本轮 SUT 升级到 npm `latest` v1.1.15（源码 HEAD `bf79b643`，merge PR #1166 release-1.1.15）。工具面新增 2 个 MCP 工具（`huaweicloud_plan_manifest`/`huaweicloud_run_approved_manifest`），`tools/list` 47→49；`next` dist-tag 由 `2.0.0-next.4` 改为 `1.1.15-next.2`（D1-33/D1-39 断言语义同步正确）。
> **16 项历史缺陷全部复现、根因（文件:行号）一致**（v1.1.15 未包含修复）；**新增 1 项 D3-S3**（P1，沙箱预览无公网 URL，3 次实测复现，见 FINDINGS #17）。D3-S7/D3-S6 的参数漂移位置本轮变为 `db.port` / `code.zip_file`（同一装配缺口，历轮交替）。`D1-70`（代理 WebSocket 崩溃）继续 PASS。
> 另需注意：本轮 D3-S3 由 PASS 转 FAIL，直接原因是沙箱 workspace 内**上次/历史会话残留的 nginx 配置**（`d3s3-site.conf`/`d3c3-proj.conf`/`hdk-e2e.conf`/`sample-react.conf`）长期占用 8080/8081/8082/8084，`close_session` 不回收 → 端口池污染（与维护者 SandboxMonitor 反复报出的 `MCP -32603 ... all ports 8080-8089 are in use` 同源）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖，本轮该探针 PASS | 【调归属】 |
| `D8-1` | D8质量 | 文档与能力一致 | 需白盒 docs 全量逐篇比对（当前无机器可判定的断言），本轮未覆盖 | 【改用例】 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 需逐条核验 getting-started 步骤（无自动化探针、预期不可机械判定），本轮未覆盖 | 【改用例】 |
| `D8-6` | D8质量 | 中英文文档一致 | 需中英双源逐段比对（无基线差异集），本轮未覆盖 | 【改用例】 |

### BLOCKED

`0`（本轮无 BLOCKED；D4-13 只读子账号、D10-3 评测 harness、D6 压测、D9 协议探针均实跑）

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云/脱敏用例全程无明文 AK/SK 外泄，show_profile_redacted 脱敏 PASS）
- [x] 写操作误判 read-only：`0`（D4-5 写操作不被误判只读 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 AK/SK 仅存 `~/.config/huaweicloud/credentials.json`，未落入 results；D4-26 记录的明文 secret 为**故意构造的测试诱饵值**，非真实凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（fd65de44-…） | 已删（含公网 IP/系统盘） | 自动化 finally 150s 轮询未确认 → 手工 `DeleteServers --delete_publicip=true --delete_volume=true` → round 3 GONE；ListServersDetails 无该 id |
| VPC / 子网（D3-C1） | 是（7bc24bcf-… / 82f1344a-…） | 已删 | `DeleteSubnet` → GONE(round 2) → `DeleteVpc` → GONE；ListVpcs/ListSubnets 仅余他客户端 pre-existing（tctest-*/testbot2-dsh-*），未误删 |
| OBS 桶（D3-C2） | 是（testbot3-hermes-obs-5208871026） | 已删 | `Delete bucket ... successfully`，OBS 桶总数=0 |
| 沙箱会话（D3-C6/D3-C3/D3-S3/D3-S2/D3-C13） | 是 | close_session 已关 | 各用例 close_session "ok"；D3-C3 实测 nginx 8080+deploy_check PASS |
| EIP（D3-C7） | 是（07fdf273-…） | 已释放 | ListEips 无本次 id（无残留） |
| FunctionGraph 函数（D3-S6） | 是（失败回滚） | 已删 | 归零 OK |
| RDS 实例（D3-S7） | 未创建成功 | n/a | CreateInstance 前置失败（db.port），无实例 |
| 只读子账号（D4-13） | 未创建资源 | n/a | readPassRate=100%，写 VPC 被策略拒（VPC.0010），归零核实未创建 |

> 真云只删本次创建资源（按本次 `serverId`/`subnetId`/`vpcId` 精确匹配）；删除前全量盘点，未触碰他人/既有资源。云端终态盘点（cn-north-4）：`ECS=[]`（本次已归零）、`VPC` 仅 tctest-*/testbot2-dsh-*（他客户端）、`SUBNET` 仅 tctest-*、`OBS=0`；EIP 仅余 1 条 `1.92.113.102`（DOWN/未绑定，非本次用例创建，未动）。

---

## 八、遗留与建议

- **本轮继续 PASS**：`D1-70`（代理 WebSocket 崩溃，Node floor 22.19 + undici 升级后不复现），无需再提单。
- **新增缺陷 `D3-S3`（P1）**：沙箱预览部署 `ok=true` 但 `url` 为空、`devbridge_tunnel`/`tunnel_url_accessible` FAIL；根因是 `session-manager.mjs:1282 closeSession()` 不回收 `deployNginx` 写入的 `/etc/nginx/conf.d/*.conf` 与 nginx 进程，沙箱 workspace 复用后 8080-8089 端口池被历史配置占满，改绑端口后 DevBridge 隧道未随迁。建议：①`closeSession`/`deployNginx` 增加配置与进程回收（或按 workspace 维度幂等替换）；②部署改绑端口时自动重建/迁移 DevBridge 隧道，而非只给手工提示；③`deploy_check` 以返回的 `port` 为准校验而非固定 8080。该缺陷同时解释 SandboxMonitor 反复出现的 `all ports 8080-8089 are in use`。
- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明）、`D10-4`（规则库 16→19 条断言漂移）、`D8-9`（sanitizeValue 未脱敏）、`D3-C14`（沙箱 connect template_id 下线改用 pool_type，探针/用例断言需同步）——均待维护更新用例母版/断言。
- 历史缺陷 `D3-C2`（P2）：OBS 建桶/静态站/删桶三步实测均成功，失败点在 `hcloud OBS mb` 成功仍返回退出码 6（`--cli-secure-verify=false` 时 3，KooCLI 7.2.12，连续多日复现）；建议 devkit 侧 OBS CLI 结果判定改用响应文本/JSON 解析而非仅退出码。
- 本轮未覆盖（NOT_RUN，均【改用例】/【调归属】）：`D8-1`/`D8-4`/`D8-6`（文档一致性类需白盒全量比对）、`D1-39`（Windows 专属，Linux 由 EXP-NR3-10 覆盖）。
- 建议：16 项历史缺陷已连续多轮复现，建议上游优先收敛 P0 安全三项（D4-2/D4-21/D9-12）+ 新增沙箱端口回收（D3-S3），并同步 D10-4/D3-C14 用例断言；每日测试 Node 运行时稳定于 `~/node22` v22.23.2。