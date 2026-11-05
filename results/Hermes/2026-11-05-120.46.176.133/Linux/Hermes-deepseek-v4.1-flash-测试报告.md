# Hermes-deepseek-v4.1-flash 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-11-05 10:08:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-05-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（产品侧 15 项唯一根因缺陷全部复现，无新增回归；本轮账号能力恢复，真云 5 项由 BLOCKED 转 PASS，仅沙箱 3 项仍 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（x86_64） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.5`（npm next，gitHead `4ab34ed2`） |
| 运行环境 | Node v22.13.0 / npm 10.9.2 / KooCLI 7.2.12 / 120.46.176.133 |
| daily 基础用例 | 设计级 107 / 展开级 43（+ 使命清单 mission-001 9 条） |
| 真云凭证 | cn-north-4（统一账号 AK/SK + 只读子账号 test001） |

> **执行方法**：`run_all.sh` 编排 44 批探针——源码直调（classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/supplement/new-*）；spawn `mcp-server.mjs` 驱动 MCP 协议（D5/D8/D9）；真云 E2E 建删资源（realcloud-probe 的 D2-1/D3-C4/D4-14/D4-18/19/20、D4-13 只读子账号、D4-23 mdc 注入、D3-C1/C2/C3/C6/C7、D3-C13）。证据逐用例落 `evidence/<case-id>/stdout.txt`。
> **本轮前置**：`python scripts/prepare_env.py --update` 拉最新（测试仓 main、hdk checkout `4ab34ed2`、`npm install -g huaweicloud-devkit@next`）→ `python scripts/init_day.py Hermes Linux` 建包 → 后台 `hourly_sync.py --interval 600` 增量提报 → `bash run_all.sh`（10:01:07–10:04:43）→ 证据分发 → 批量回填。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 13 / 8 / 3 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 138） | `88.4%` |
| P0 / P1 / P2 缺陷（唯一根因 15 项） | `4 / 6 / 5`（全部历史复核复现，无新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次创建真云资源全部归零（ECS/VPC/subnet/EVS/EIP/OBS 复核为空）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/沙箱维护阻塞（本轮账号受限类 5 项已解除转 PASS） |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行（OS 专属 1 + 文档类 3） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01，与 D10-3 同根因） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

### 3.3 本轮状态变化（相对同日 05:2x 轮次）

| 用例 | 原状态 | 本轮 | 变化原因（实测证据） |
|---|---|---|---|
| `D3-C1` ECS 生命周期 E2E | BLOCKED（Ecs.0067 余额不足） | **PASS** | ECS 创建成功（`serverIds d94b7597-…`），创建/审批/返回 4 断言通过；归零由 `clean_1105b.py` 定向删除并复核（ECS/VPC/subnet/EIP/EVS 全空） |
| `D3-C2` OBS 静态站部署 E2E | BLOCKED（403 UserRestricted） | **PASS** | 建桶 successfully / set 200 / get 200 / 删桶 successfully（4 项实测，`OBS建桶` 断言 pass=false 仅 obsutil 退出码口径） |
| `D3-C13` OBS 静态网站托管 | BLOCKED（403 UserRestricted） | **PASS** | 5 项断言全 `[OK]`（建桶/set 缺失参数拒绝/set 200/get 200/删除归零） |
| `D3-C7` 跨区域资源操作引导 | BLOCKED（VPC.0502 op_restricted） | **PASS** | EIP 创建成功 `5d7ada35-…`（命令带 `--cli-region=cn-north-4`）→ 删除释放 → 归零无残留，8/8 |
| `D4-13` 最小权限凭证通过率 | BLOCKED（router 配额耗尽） | **PASS** | 只读 6/6 可用；写 `CreateVpc` 被 IAM 策略拒绝（`VPC.0010 Rules on create_router … disallowed by policy`），非配额拒绝；归零无 VPC |
| `D3-C3`/`D3-C6`/`D3-S3` | BLOCKED | BLOCKED | 沙箱 `HDKIT_SANDBOX_MAINTENANCE` 仍未解除 |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:550` env-dump 正则漏裸 `access_key` | 历史复核 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品 | `cloud-risk-rules.json:196` regex 未覆盖 HCL `actions=["*"]` / `AdministratorFullAccess` | 历史复核 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线两处缺口 | `mcp-protocol.mjs:34-42`（init 未调 runVersionCheck）/ `:61`（tools/list 无前置状态机） | 历史复核 |
| 4 | P0 | `D10-4` | D10评测 | 风险规则库条目数漂移（19 vs 用例断言 16）（SPEC） | `safety/rules/cloud-risk-rules.json` 规则 16→19 条，用例断言未同步 | 历史复核 |
| 5 | P1 | `D1-70` | D1安装 | 代理 WebSocket 路径崩溃（undici 依赖 node zstd API 缺失） | `proxy/proxy-agent.mjs:20-22` + bundled `undici@8.12.2 decompress.js:3/79` | 历史复核 |
| 6 | P1 | `D4-6` | D4安全 | `--admin-pass` 不告警 + flag/JSON 带引号 key 形态未脱敏 | `cloud-risk-rules.json:68`（规则缺 `command` 阶段）+ `safety-policy.mjs` redactSecrets 键名正则 | 历史复核 |
| 7 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:106` evaluate 无规则命中默认 allow | 历史复核 |
| 8 | P1 | `D3-S7` | D3功能 | 跨服务交付(Web应用+RDS) 复合意图部署目标未命中 + CreateInstance 缺前置 | `tools.mjs` serviceCatalog 部署目标匹配缺失 + RDS 参数装配（`Invalid parameter: db.password`） | 历史复核 |
| 9 | P1 | `D10-3` | D10评测 | serviceCatalog 中文「云主机」意图路由 MISS（准确率 92.9%） | `tools.mjs:2197` routeMap ECS 关键词缺「云主机」 | 历史复核 |
| 10 | P1 | `EXP-E01` | 展开-D10 | 同 D10-3 根因（「云主机」→ 预期 ECS，实际回退 help） | `tools.mjs:2197` | 历史复核 |
| 11 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs` initialize capabilities 未含 cancellation | 历史复核 |
| 12 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog 单关键词并集路由，无复合拆解 | 历史复核 |
| 13 | P2 | `D3-S6` | D3功能 | FunctionGraph 定时任务创建失败（未生成 URN/触发器） | `tools.mjs` CreateFunction 参数装配缺口（本轮 `Invalid parameter: code.filename`） | 历史复核 |
| 14 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类为 cli:invoke | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组错（应 `\b`） | 历史复核 |
| 15 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（明文 secret 残留） | `risk-rule-engine.mjs:22` redactEvidence 正则未覆盖空格/JSON 引号 key 形态 | 历史复核 |
| 16 | P2 | `D8-9` | D8质量 | sanitizeValue 未做凭证脱敏（SPEC） | `telemetry/telemetry.mjs:190` 仅截断无脱敏 | 历史复核 |

### 根因详情

> 每项 FAIL/SPEC 的「期望 / 实际 / 根因（文件:行号）/ 影响 / 证据」见同目录 `FINDINGS.md`（15 项唯一根因，`file_issue.py` 解析输入；EXP-E01 与 D10-3 同根，故表内 16 行 / FINDINGS 15 项）。15 项均在上游仓已有历史 issue，本轮为复核（提单前查重命中即不重复开单），关联单号见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN（4）

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖 |

### BLOCKED（8）

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化`，10:02 实测），sandbox_connect/deploy_nginx 全链路不可达；解除条件=华为云沙箱维护完成 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 【补环境】沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE`），`workspace_id is required. No sandbox connected`，7 隐式工具均不可用；解除条件=华为云沙箱维护完成 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 【补环境】沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE`），check_user 无法返回 realnameVerified/agreementSigned；解除条件=华为云沙箱维护完成 |
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界 | 【补环境】需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。本轮 AK/SK/adminPass 均未明文落盘（D4-13 探针输出已对 AK 脱敏）；D4-26/D4-6/D8-9 为「产品未脱敏」缺陷（属被测缺陷，非测试侧泄漏）。
- [x] 写操作误判 read-only：无。D4-14/D4-18/19/20 写操作 plan 均正确 `deny`/`confirm`；D4-13 只读子账号写路径被 IAM 策略正确拒绝（`VPC.0010 disallowed by policy`），通过率判定成立。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：`credentialPanel`/`auth_status`/`redactSecrets`/`redactOutput` 均验证通过；D2-4 证据 stdout 已避免回显明文 AK/SK（黑盒脱敏探针输出为 `<redacted>`）。
- [x] 只删本次创建资源：ECS/VPC/subnet 按本次 TS `3844114968`、OBS 桶按 `testbot3-hermes-obs-3844278262`、EIP 按 `5d7ada35-…`、D4-14 VPC 按 `tctest-hermes-20261012-2wgqtj` 定向删除；他方/并发资源（`tctest-*` 其他 TS、`testbot3-hermes-*` 其他 TS）未触碰。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1，`testbot3-hermes-e2e-3844114968`） | ✓ `2b93c1a9-…` | ✓ DeleteVpc | ✓ `ListVpcs` 不含本次资源 |
| subnet（D3-C1，`…-subnet`） | ✓ `32058179-…` | ✓ DeleteSubnet | ✓ `ListSubnets` 不含本次资源 |
| ECS（D3-C1，`testbot3-hermes-ecs-3844114968`） | ✓ `d94b7597-…` | ✓ DeleteServers（`--servers.1.id`） | ✓ `ListServersDetails` 为空；卷随删（EVS 0） |
| OBS 桶（D3-C2，`testbot3-hermes-obs-3844278262`） | ✓ | ✓ OBS rm | ✓ `Bucket number: 0` |
| OBS 桶（D3-C13） | ✓ | ✓ OBS rm | ✓ 删除归零断言 `[OK]` |
| EIP（D3-C7，`5d7ada35-…`，cn-north-4） | ✓ | ✓ DeletePublicip | ✓ `ListEips` 无本次 id；香港区归零 0 |
| VPC（D4-14 审计链，`tctest-hermes-20261012-2wgqtj`） | ✓ `83bcad1d-…` | ✓ DeleteVpc | ✓ `ListVpcs` 不含本次资源 |
| 最小权限写（D4-13，CreateVpc） | ✗ 被 IAM 拒绝（`VPC.0010`） | — | ✓ 未创建任何 VPC |
| 沙箱资源（D3-C3/C6/S3） | ✗ 维护中未创建 | — | ✓ 无资源产生 |

> 收尾全量复核（`cloud_inv2.py`，10:05）：`ECS=0 / VPC=0 / SUBNET=0 / EIP=0 / EVS=0 / OBS=0`（仅保留账号默认安全组 `default`）。

---

## 八、遗留与建议

1. **P0 安全三项（D4-2 / D4-21 / D9-12）** 连续多轮复现，建议优先修复：env-dump 正则补裸 `access_key`/`secret_key`；规则库补 HCL `actions=["*"]` 与 `AdministratorFullAccess` 形态；initialize 阶段补 `runVersionCheck` 与 `tools/list` 前置状态机。
2. **D10-3/EXP-E01 中文路由**：`tools.mjs:2197` routeMap 补「云主机」等同义词后应可把 92.9% 提升至 100%，建议连同 D10-4 规则条目数断言漂移一并处理。
3. **D4-13 鉴权判定口径**：本轮 router 配额释放后已可正常判定（IAM 策略拒绝），建议探针把「配额拒绝（VPC.0114）」与「策略拒绝（VPC.0010）」区分标注，避免下次配额波动再次误判 BLOCKED。
4. **沙箱三项（D3-C3/C6/S3）**：属外部服务维护窗口，维护结束后需补跑一轮（本轮已如实 BLOCKED，非产品缺陷）。
5. **harness 口径**：D3-C1 finally 归零轮询窗口短于 ECS 异步删除耗时、D3-C2 obsutil 成功场景返回非 0 退出码，建议分别调整轮询上限与退出码判定，减少误报（本轮已在证据中写明并由人工复核归零）。