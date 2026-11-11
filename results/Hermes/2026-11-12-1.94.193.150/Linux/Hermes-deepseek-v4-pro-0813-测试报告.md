# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-12 05:21:26（北京时间）
> **执行归档**：`results/Hermes/2026-11-12-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.13`（npm latest 正式版，gitHead `8a6d8be2`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针直调 `hdk/plugins/huaweicloud-core/src/` 导出函数（classify/hook/auth/protocol/extended/supplement/new-* 等 38 批）+ spawn `mcp-server.mjs` 驱动 MCP 协议（D9/D10）+ 真云 E2E 建删资源（D3-C1 ECS 全生命周期 / D3-C2 OBS 静态站 / D3-C3·D3-C6 沙箱 / D3-C7 跨区域 / D4-13 只读子账号 / D4-14 审批流），证据落 `evidence/<case-id>/stdout.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 13 / 5 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 138） | `90.6%` |
| P0 / P1 / P2 新增缺陷 | `3 / 6 / 4` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `真云建删资源全部归零（见 §七）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | `src/proxy/proxy-agent.mjs:20-22`（importUndici 回退 bundled undici@8.12.2 → `undici/lib/interceptor/decompress.js:78` 解构 node:zlib.createZstdDecompress，node22.13 无 → undefined.bind） | 历史复现 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解 | 历史复现 |
| 3 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | `src/tools.mjs` FUNCTION_OPS 参数装配缺口（Invalid parameter: code.zip_file） | 历史复现 |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `src/tools.mjs` serviceCatalog 复合意图部署目标未命中 + RDS CreateInstance 参数装配缺口（Invalid parameter: db.port） | 历史复现 |
| 5 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `src/safety-policy.mjs:550` env-dump 正则只匹配云厂商前缀，不匹配裸 access_key | 历史复现 |
| 6 | P1 | `D4-6` | D4安全 | adminPass回显警告 | `safety/rules/cloud-risk-rules.json:68`（hwc-command-adminpass-exposure）stages 缺 command；safety-policy.mjs redactSecrets 未覆盖 `--admin_pass` 空格形态 | 历史复现 |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `src/risk-rule-engine.mjs:106` evaluate() 无规则命中默认 allow（fail-open） | 历史复现 |
| 8 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `safety/rules/cloud-risk-rules.json:196`（hwc-iam-admin-policy）regex 未覆盖 HCL actions=["*"] 与 AdministratorFullAccess | 历史复现 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^|[A-Za-z0-9])` 永不匹配空格前缀写命令 | 历史复现 |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `src/risk-rule-engine.mjs:22` redactEvidence 键名表仅匹配 key[:=]value，未覆盖空格/JSON 带引号 key | 历史复现 |
| 11 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `src/mcp-protocol.mjs:34-42` initialize 分支未调 runVersionCheck；`mcp-protocol.mjs:61` dispatch() 对 tools/list 无 initialize 前置状态机 | 历史复现 |
| 12 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `src/tools.mjs:2197` routeMap ECS 关键词清单缺「云主机」同义词（HIT=13 MISS=1 → 92.9%） | 历史复现 |
| 13 | P1 | `EXP-E01` | D10评测 | 「云主机」意图路由 MISS | 与 D10-3 同根因 | 历史复现 |
| 14 | P2 | `D8-9` | D8质量 | sanitizeValue 未做凭证脱敏（SPEC） | `src/telemetry/telemetry.mjs:190` sanitizeValue 仅 replace 空白+截断，无敏感值脱敏 | 历史复现 |
| 15 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `src/mcp-protocol.mjs` initialize 响应 capabilities 构造未含 cancellation | 历史复现 |
| 16 | P0 | `D10-4` | D10评测 | 风险规则库条目数漂移（SPEC） | `safety/rules/cloud-risk-rules.json` 规则 16→19 条（9deny+10warn），用例断言未同步 | 历史复现 |

> **根因详情**：以上 16 项（13 FAIL + 3 SPEC，其中 EXP-E01 与 D10-3 同根因合并）全部为 **v1.1.13（gitHead 8a6d8be2）的历史复现**，与上一推（2026-11-11）结论完全一致，无新增缺陷——同一版本同一 commit，未包含对这些缺陷的修复。逐条现象/断言/根因/证据见 `FINDINGS.md`。
>
> **提单结论**：全部命中历史 open issue（`file_issue.py` 内置查重），本轮「不重复开单」，生成 `HISTORY_LINKS.md` 关联清单，仅在既有单上补复核评论。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（本轮探针未触发真实 AK/SK 明文泄漏；D4-26 findings.evidence 明文残留是产品缺陷，已记 FINDINGS #10，非本 agent 操作泄漏）
- [x] 写操作误判 read-only：`无`（D4-13 只读子账号 writeDenied=true，最小权限通过率 100%）
- [x] 红线（I 类）违规：`无`（真云用例均最低配置创建 → 测后删除 → 归零验证；未 mock、未碰他人/既有资源）
- [x] 脱敏复核：`已完成`（D4-6/D4-27 源码级 redactSecrets 双路径验证；D4-26 findings 残留缺口已记缺陷）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，testbot3-hermes-ecs-4431475462） | ✅ 创建成功（serverIds d945c9ab） | ✅ 自动化 finally + 手工 DeleteServers（job_id ff808081a0ed1f4501a1cc775b5022b5） | ✅ ListServersDetails servers=0 |
| VPC（D3-C1，a68da560-5d57-4c71-a51b-8066d617c1af） | ✅ 创建成功 | ✅ DeleteVpc（首次 VPC.0104，重试成功） | ✅ ListVpcs 不含本次 |
| Subnet（D3-C1，7dbf6a3a-643c-4be1-a3e6-8c027bf6fd0b） | ✅ 创建成功 | ✅ DeleteSubnet | ✅ ListSubnets 不含本次 |
| OBS 桶（D3-C2，testbot3-hermes-obs-4431636705） | ✅ 建桶+静态站 | ✅ OBS rm | ✅ Delete bucket successfully |
| VPC（D4-14 审批流，tctest-hermes-20261012-cm5z7y） | ✅ CreateVpc（75dc89fd） | ✅ DeleteVpc | ✅ ListVpcs containsOwn=false |
| EIP（D3-C7 跨区域，publicipId e799fa7e-c9e7-44be-a37e-40f8ad6884b9） | ✅ CreatePublicip | ✅ DeletePublicip | ✅ ListEips 无本次 id |
| 沙箱（D3-C3/D3-C6） | ✅ connect/deploy | ✅ close_session | ✅ 会话关闭 |

> 全域残留复核：`ListServersDetails`/`ListVpcs`/`ListPublicips` 均无本次 `testbot3-hermes-*`（4431475462 时序）残留，OBS 无 `testbot3-hermes-obs-*` 桶。D3-C1 自动化 finally 的 150s 轮询时序抖动+sh().ok 退出码假阳性已手工归零补充（见 evidence/D3-C1/stdout.txt），非产品缺陷。同机并发客户端（Codex/OpenClaw/CodeArtsAgent）同名 `testbot3-hermes-*`/`tctest-openclaw-*` 资源归属各自，按本次 serverId/TS 精确匹配清理，未误删他人资源。

---

## 八、遗留与建议

- 16 项缺陷全部为历史复现（v1.1.13 同 commit），无新增；其中 3 项 SPEC（D8-9/D9-9/D10-4）属契约/断言漂移，建议维护者按 FINDINGS 更新用例母版断言。
- D3-S6/D3-S7 历轮参数装配漂移（本轮分别为 `code.zip_file`/`db.port`，上轮为 `function_name`/`db.password`），FUNCTION_OPS/RDS CreateInstance 参数装配缺口持续存在。
- D1-70 undici@8.12.2 需 node zstd API（node≥22.15），建议 devkit 声明 Node 版本下限或降级/守卫 undici。
- 建议测试侧修复 `scripts/realcloud_e2e.mjs` 的 D3-C1 ECS 删除轮询（150s 偏短）与 sh().ok 退出码假阳性（已本地修正 OBS 建删桶判据，见仓库本地工作树，未提交 scripts/）。