# Hermes-deepseek-v4.1-flash 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-11-05 05:22:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-05-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（产品侧 15 项历史缺陷复核均复现，无新增回归；真云 5 项因统一账号被冻结/配额受限转 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（x86_64） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.5`（npm next，gitHead `4ab34ed2`） |
| 运行环境 | Node v22.13.0 / npm 10.9.2 / KooCLI 7.2.12 / 120.46.176.133 |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：`run_all.sh` 编排 44 批探针——源码直调（classify/hook/auth/protocol/extended/d1 安装域/updatecheck/disttags/merge/routing/supplement/new-*）；spawn `mcp-server.mjs` 驱动 MCP 协议（D5/D8/D9）；真云 E2E 建删资源（realcloud-probe 的 D2-1/D3-C4/D4-14/D4-18/19/20、D4-13 只读子账号、D4-23 mdc 注入、D3-C1/C2/C3/C6/C7、D3-C13）。证据逐用例落 `evidence/<case-id>/stdout.txt`。
> **本轮前置**：`python scripts/prepare_env.py --update` 拉最新（测试仓 main、hdk checkout `4ab34ed2`、`npm install -g huaweicloud-devkit@next`）→ `python scripts/init_day.py Hermes Linux` 建包 → 后台 `hourly_sync.py --interval 600` 增量提报。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `117 / 13 / 13 / 3 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 133） | `88.0%` |
| P0 / P1 / P2 缺陷（唯一根因 15 项） | `4 / 6 / 5`（全部历史复核，无新增） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次创建真云资源已全部归零（VPC/subnet 已删并复核，ECS/OBS/EIP 未创建成功，无残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `75` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `13` | 环境/权限/账号阻塞（本轮新增 5 项账号受限） |
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

> 每项 FAIL/SPEC 的「期望 / 实际 / 根因（文件:行号）/ 影响 / 证据」见同目录 `FINDINGS.md`（15 项唯一根因，`file_issue.py` 解析输入；EXP-E01 与 D10-3 同根，故表内 16 行 / FINDINGS 15 项）。15 项缺陷均在历史轮次已提，本轮为复核，明细见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN（4）

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖 |

### BLOCKED（13）

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 【补环境】统一账号 hw018619646 被冻结/余额不足：`CreateServers` 返回 `Ecs.0067 Your account is insufficient balance`（05:12 实测）；VPC `19f995ea`/subnet `a838dc91` 已建并删除归零（`subnet:OK vpc:OK`），ECS 未创建故生命周期后段不可验证；解除条件=账号解冻/充值 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | 【补环境】账号 OBS 写被拒：`Create bucket` 返回 `403 UserRestricted`（05:12 实测），set/get/删桶均 404，未创建任何桶；解除条件=账号解冻/恢复 OBS 权限 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 【补环境】账号 op_restricted：`EIP CreatePublicip` 返回 `VPC.0502 Tenant status is op_restricted`（05:15 手工复核同码）；香港区 `ListEips` 归零=0，无残留；解除条件=账号解冻 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | 【补环境】账号 OBS 写被拒：`Create bucket` 返回 `403 UserRestricted`（05:11 实测），静态站 set/get 全 404，未创建桶；解除条件=账号解冻/恢复 OBS 权限 |
| `D4-13` | D4安全 | 最小权限凭证通过率 | 【补环境】router 配额耗尽+账号受限：只读子账号**读操作 6/6 可用**，写路径 `CreateVpc` 返回 `VPC.0114 Quota exceeded for resources: ['router']`（非 IAM 策略拒绝），无法区分「写被拒」与「配额拒绝」；补充探针 `DeleteVpc(不存在UUID)` 返回 `VPC.0105 RouterNotFound`、`CreateSecurityGroup` 客户端参数校验失败，均无法完成鉴权判定；解除条件=共享账号 router 配额释放且账号解冻后重跑 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 【补环境】沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化`），sandbox_connect/deploy_nginx 全链路不可达；解除条件=华为云沙箱维护完成 |
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
- [x] 写操作误判 read-only：无。D4-14/D4-18/19/20 写操作 plan 均正确 `deny`/`confirm`；D4-13 只读子账号写路径本轮因 router 配额耗尽（`VPC.0114`）无法完成鉴权判定，已如实转 BLOCKED（不虚标 PASS）。
- [x] 红线（I 类）违规：无。
- [x] 脱敏复核：`credentialPanel`/`auth_status`/`redactSecrets`/`redactOutput` 均验证通过；D2-4 证据 stdout 已避免回显明文 AK/SK（黑盒脱敏探针输出为 `<redacted>`）。
- [x] 只删本次创建资源：VPC/subnet 均按本次 TS `testbot3-hermes-e2e-3826741655` 定向删除；他方/并发资源（`tctest-*`、`testbot3-hermes-e2e-3826589128`、`testbot3-hermes-e2e-3740204810`）未触碰。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1，`testbot3-hermes-e2e-3826741655`） | ✓ `19f995ea-…` | ✓ DeleteVpc | ✓ `finally归零 subnet:OK vpc:OK` |
| subnet（D3-C1，…-subnet） | ✓ `a838dc91-…` | ✓ DeleteSubnet | ✓ 同上 |
| ECS（D3-C1） | ✗ 未创建（`Ecs.0067` 余额不足） | — | ✓ `ListServersDetails` 无本次实例 |
| VPC（D4-14 审计链，`tctest-hermes-20261012-2m488w`） | ✓ `06d29804-…` | ✓ DeleteVpc | ✓ `ListVpcs 不含本次资源` |
| VPC（D3-S2 确认流，`tctest-hermes-s2-mw2m3ttf`） | ✓ `dec1abc9-…` | ✓ DeleteVpc | ✓ `删除后归零=true` |
| OBS（D3-C2 / D3-C13） | ✗ 未创建（403 UserRestricted） | — | ✓ obsutil `ls` 桶数=0 |
| EIP（D3-C7） | ✗ 未创建（`VPC.0502` op_restricted） | — | ✓ 香港区 `ListPublicips total_count=0` |
| VPC（D4-13 只读子账号） | ✗ 未创建（`VPC.0114` 配额） | — | ✓ `created=false` |

> 注 1：**本轮统一账号（hw018619646）处于受限状态**——ECS `Ecs.0067 Your account is insufficient balance`、OBS `403 UserRestricted`、EIP `VPC.0502 Tenant status is op_restricted`，故 D3-C1/D3-C2/D3-C7/D3-C13 四项真云用例只能验证到「创建被云侧拒绝」，生命周期后段不可验证，统一记 BLOCKED 并写明解除条件（账号解冻/充值），未虚标 PASS。
> 注 2：`D4-13` 写路径失败原因为 `VPC.0114 Quota exceeded for resources: ['router']`（共享账号 router 配额耗于遗留 VPC），已跑补充探针（`evidence/D4-13/ro-deny-probe.mjs` + `ro-deny.txt`）尝试解阻塞：`DeleteVpc(不存在UUID)` 返回 `VPC.0105`、`CreateSecurityGroup` 参数校验失败，均无法在无配额条件下完成 IAM 鉴权判定，故保留 BLOCKED（非「假阻塞」）。
> 注 3：共享账号中并存非本次创建资源：`tctest-tmr-u1yrtd*`（他方 ECS+VPC+EVS）、`hc-activity-*`（他方）、`testbot3-hermes-e2e-3826589128`、`testbot3-hermes-e2e-3740204810` 及其 subnet（本机 ps/本地日志均无该 TS，判非本机产出）——均未删除。全量只读 inventory 复核：VPC 3 / subnet 4 / SG 2 / ECS 1 / EIP 0 / EVS 1 / OBS 0，与开测前一致（零新增残留）。

---

## 八、遗留与建议

- 3 项 SPEC-MISMATCH（D8-9/D9-9/D10-4）需维护者裁决用例母版是否同步（D10-4 规则库 16→19 条断言、D9-9 cancellation 声明、D8-9 sanitizeValue 脱敏）。
- 15 项产品缺陷与上一轮（2026-11-04，gitHead `7ad8a533`）完全一致，无修复、无新回归；`file_issue.py` 查重后命中上游历史合并单，本轮不重复开单，明细见 `HISTORY_LINKS.md`。
- **环境侧（本轮首要阻塞）**：共享账号 hw018619646 疑似余额不足/被冻结，导致 4 项真云用例（D3-C1/C2/C7/C13）无法完成；需运维解冻/充值后补测。建议测试机增加「账号可用性前置自检」（一次只读 `hcloud ECS NovaListServers` 不足以发现写侧受限，建议增加一次最小写探测或账单余额查询），避免整轮真云用例批量转 BLOCKED。
- **配额侧**：router 配额被跨机遗留 VPC 占用（`testbot3-hermes-e2e-3826589128` / `-3740204810` 等），直接阻塞 D4-13 与 D3-C1 重试；建议真云资源命名加入机器唯一标识（`HDK_MACHINE_IP`/主机名），并加强 `realcloud_e2e.mjs` finally 归零轮询（ECS 异步删除 150s 窗口偏短）。
- 沙箱用例（D3-C3/D3-C6/D3-S3）待华为云沙箱维护完成后补测解除 BLOCKED。
- 建议 devkit 将 bundled undici 与 zstd-capable node 门槛对齐（或 Node>=22.15 引擎下限 / proxy-agent 增加 zstd 缺失降级路径），消除 D1-70 在 22.13 等较老 22.x 上的代理 WebSocket 崩溃。