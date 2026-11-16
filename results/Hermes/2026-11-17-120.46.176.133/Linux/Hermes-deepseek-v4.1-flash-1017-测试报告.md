# Hermes-deepseek-v4.1-flash-1017 每日测试报告
> **报告名**：`Hermes-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-17 05:17:30（北京时间）
> **执行归档**：`results/Hermes/2026-11-17-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项 + P0 SPEC 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.14`（npm `latest`，gitHead `bd985051`，装包时间 2026-11-17 05:01） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：三层混合执行——①**源码级直调探针**（`evidence/_probes/*.mjs` 直接 import 安装包 `plugins/huaweicloud-core/src` 的导出函数：safety-policy / risk-rule-engine / mcp-protocol / tools / proxy-agent / telemetry 等）；②**MCP 真机调用**（拉起 `mcp-server.mjs`，经 JSON-RPC `initialize`/`tools/list`/`tools/call` 实测 40 个工具与 hook 层）；③**真云 E2E**（`scripts/realcloud_e2e.mjs` + `evidence/realcloud-probe`，用统一账号 AK/SK 在 cn-north-4 真建真删 ECS/VPC/子网/EIP/OBS/FunctionGraph/沙箱，测后归零）；④**评测 harness**（`eval/harness/run-eval.mjs` 跑 15 条中文意图 serviceCatalog 路由）。所有结论均在 `evidence/<case-id>/stdout.txt` 留痕，回填经 `verify_no_fake_pass.py` + `verify_coverage.py` 双门禁（本轮双门禁均通过；coverage NOT_RUN+空占比 2.8%）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 11 / 6 / 4 / 4` |
| 通过率（分母 = PASS+FAIL = 136） | `91.9%` |
| P0 / P1 / P2 缺陷（含 SPEC） | `4 / 5 / 5`（其中本轮新增 1 项 P2 SPEC：D3-C14） |
| 红线（I 类）违规 | `0`（无「无凭证即 BLOCKED」、无 mock 假跑、无跨目录提交） |
| 资源释放 | 本机创建的 ECS/VPC/子网/EIP/OBS/FunctionGraph/沙箱全部删除归零（含 D3-C1 ECS 异步删除定向补删复核） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `6` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `4` | 契约漂移（含本轮新增 D3-C14） |
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
| 1 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | `src/proxy/proxy-agent.mjs:20-22` + bundled `undici/lib/interceptor/decompress.js:78` | 历史复核（见 HISTORY_LINKS） |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `src/tools.mjs` serviceCatalog 单关键词并集、无复合拆解 | 历史复核（见 HISTORY_LINKS） |
| 3 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `src/safety-policy.mjs:550` env-dump 正则仅匹配云前缀 | 历史复核（见 HISTORY_LINKS） |
| 4 | P1 | `D4-6` | D4安全 | adminPass回显警告 | `safety/rules/cloud-risk-rules.json:68` + redactSecrets 键名缺口 | 历史复核（见 HISTORY_LINKS） |
| 5 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `src/risk-rule-engine.mjs:106` 无命中默认 allow | 历史复核（见 HISTORY_LINKS） |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `safety/rules/cloud-risk-rules.json:196` 未覆盖 HCL 列表/托管策略 | 历史复核（见 HISTORY_LINKS） |
| 7 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` 前置捕获组不匹配空格 | 历史复核（见 HISTORY_LINKS） |
| 8 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `src/risk-rule-engine.mjs:22` redactEvidence 形态缺口 | 历史复核（见 HISTORY_LINKS） |
| 9 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `src/mcp-protocol.mjs:34-42` / `:61` 无时序状态机 | 历史复核（见 HISTORY_LINKS） |
| 10 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `src/tools.mjs:2197` routeMap 缺「云主机」 | 历史复核（见 HISTORY_LINKS） |
| 11 | P1 | `EXP-E01` |  |  | 同 D10-3（`src/tools.mjs:2197`），合并缺陷单 | 历史复核（见 HISTORY_LINKS） |
| 12 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 参数透传（SPEC，v1.1.14 新增） | `sandbox/hdkitservice-api.mjs:189-193` | 待提单 |

> **提单结论**：`file_issue.py` 查重（上游 open issues 391 条）判定 14 项均命中历史缺陷单 → 按纪律**不重复开单**，关联清单见 `HISTORY_LINKS.md`。
> 其中 D3-C14（template_id 停传）为 v1.1.14 **新增语义**：上游无任何 issue 正文提及 `template_id`（全量检索 0 命中），命中 #883/#1055/#1065 仅因「同用例号」且描述的是 D3-C14 的**其它**缺陷（凭证回退 / 错误文案 / createConnection 签名头）。
> 建议维护者在既有 D3-C14 历史单复核时纳入本条，或按需单开；本次按「命中即历史问题」纪律未新开单、未评论 issue（AGENTS.md：不自行评论 GitHub issue）。

### 根因详情

| 用例ID | 期望（唯一断言） | 实际 | 根因（文件:行号） | 证据 |
|---|---|---|---|---|
| D3-C14 | `hdkitConnect` 应透传 `template_id` 到 body（用例原契约） | 仅透传 source/env/git/flavor_id/pool_type，`template_id` 已停传 | `plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs:189-193`（v1.1.14 主动下线自定义模板） | `evidence/D3-C14/stdout.txt` |
| D4-2 | `env \| grep -i access_key` 应 `deny` | `allow risk=not_huaweicloud` | `plugins/huaweicloud-core/src/safety-policy.mjs:550` env-dump 正则仅匹配云厂商前缀 | `evidence/D4-2/stdout.txt` |
| D4-21 | HCL `actions=["*"]` / `AdministratorFullAccess` 应 `deny` | `allow`（JSON 形态正确 `deny`） | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196` 规则 `hwc-iam-admin-policy` regex 未覆盖 HCL 列表/托管策略形态 | `evidence/D4-21/stdout.txt` |
| D9-12 | ③ initialize 触发 runVersionCheck；⑥ 未 initialize 先 tools/list 应 `-32600` | ③ 未调用 runVersionCheck；⑥ 放行返回工具列表 | `plugins/huaweicloud-core/src/mcp-protocol.mjs:34-42`（initialize 分支）/ `:61`（dispatch 无时序状态机） | `evidence/D9-12/stdout.txt` |
| D1-70 | 有代理时 getWebSocketImpl 应返回 undici ProxyWebSocket，不抛异常 | `TypeError: Cannot read properties of undefined (reading 'bind')` | `plugins/huaweicloud-core/src/proxy/proxy-agent.mjs:20-22` → bundled `undici@8.12.2/lib/interceptor/decompress.js:78` 解构 node:zlib `createZstdDecompress`（node 22.13 无） | `evidence/D1-70/stdout.txt` |
| D4-6 | 含 `--admin-pass` 写命令应 `warn` 且密码不回显 | `allow`、`findings=[]`；`--admin_pass` 空格形态与 JSON 带引号 key 未脱敏 | `safety/rules/cloud-risk-rules.json:68` 规则 stages 缺 `command`；`safety-policy.mjs` redactSecrets 键名正则缺口 | `evidence/D4-6/stdout.txt` |
| D4-17 | 无法解析/模糊输入应 fail-closed（`deny`） | 空命令、`&& rm -rf /*`、`$(curl\|sh)` 均 `allow`/`ok` | `plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` 无命中默认 `allow` | `evidence/D4-17/stdout.txt` |
| D10-3 | 15 条中文意图路由准确率应 100% | HIT=13 MISS=1 N/A=1 = 92.9%，「云主机」回退 `hcloud --help` | `plugins/huaweicloud-core/src/tools.mjs:2197` routeMap ECS 关键词缺「云主机」 | `evidence/D10-3/stdout.txt` |
| EXP-E01 | 「云主机」应命中 ECS | 回退 help（与 D10-3 同根因，合并缺陷单） | 同上 | `evidence/D10-3/stdout.txt` |
| D3-S5 | 复合意图应拆分命中多 service | 回退 `Run hcloud --help`，多路命中=false | `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集，无复合意图拆解 | `evidence/D3-S5/stdout.txt` |
| D4-25 | `hcloud vpc CreateVpc` 应分类 `cli:write` | 误分类 `cli:invoke` | `plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^\|[A-Za-z0-9])` 不匹配空格前置，应用 `\b` | `evidence/D4-25/stdout.txt` |
| D4-26 | findings.evidence 中 password/AK/SK 应无明文残留 | 明文 `secret_key`/`adminPass` 回显 | `plugins/huaweicloud-core/src/risk-rule-engine.mjs:22` redactEvidence 未覆盖空格/JSON 带引号 key | `evidence/D4-26/stdout.txt` |
| D8-9 | sanitizeValue 应移除 ak/sk/token 敏感值 | 原样返回（仅 trim/截断） | `plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` 无敏感值脱敏 | `evidence/D8-9/stdout.txt` |
| D9-9 | initialize capabilities 应含 `cancellation` | `capabilities={"tools":{}}`，未声明 | `plugins/huaweicloud-core/src/mcp-protocol.mjs` capabilities 构造缺字段 | `evidence/D9-9/stdout.txt` |
| D10-4 | 用例断言「规则库 16 条(9 deny + 7 warn)」 | 实测 19 条(9 deny + 10 warn)，逐条行为正常 | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则扩至 19 条，用例断言未同步（SPEC） | `evidence/D10-4/stdout.txt` |

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
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】KooCLI 7.2.12 RDS CreateInstance 未暴露 password 参数（API 必填 db.password）+ 需 VPC/子网/安全组夹具；本轮已核实 ListInstances 只读可达、未创建任何实例（零残留） |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（全程未打印 AK/SK 明文；证据中的 AK 标识已脱敏为 `<AKID>`）
- [x] 写操作误判 read-only：`0`（classify-probe 对 Delete/Create 写命令均判 `write`+`deny/warn`；Python hook 侧存在遥测误分类，见 D4-25）
- [x] 红线（I 类）违规：`0`（真云用例全部真机执行，未以「无 AK/SK / 需保证金」标 BLOCKED，无 mock）
- [x] 脱敏复核：`redactSecrets` 对 `adminPass=xxx`/对象 key 形态正常；空格形态与 JSON 带引号 key 残留明文（D4-6 / D4-26 已记缺陷）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | `98ec6db0…`（testbot3-hermes-ecs-4863*） | DeleteServers 提交 | 探针 finally 轮询超时 → `clean_1117.py` 定向补删，第 3 轮确认已消失（ListServersDetails 无该 id）✅ |
| VPC/子网（D3-C1） | `e2eccf59…` / `d966028b…` | DeleteSubnet/DeleteVpc | 探针内已删成功；补删脚本复核 ListSubnets/ListVpcs 无本次 id ✅ |
| VPC（D3-S2） | tctest-hermes-s2-* | 确认后 DeleteVpc | 归零 = true ✅ |
| VPC（D3-S3/S4、D4-14） | 沙箱/探针临时 VPC | 各探针自删 | 盘点无残留 ✅ |
| EIP（D3-C7、D4-18/19/20） | 最小规格 EIP | DeletePublicip | ListEips 无本次 id，EIP total=0 ✅ |
| OBS 桶（D3-C2） | testbot3-hermes-obs-4863532788 | Delete bucket | `obs rm -f` 输出 successfully，末次盘点 OBS buckets=0 ✅ |
| FunctionGraph（D3-S6） | hdk-s6-* + TIMER 触发器 | DeleteFunction | 删除归零 ✅ |
| 沙箱会话（D3-C3/C6/S3） | 临时沙箱 | close_session | 会话正常关闭（D3-C3/C6 全 PASS）✅ |

> 末次盘点（cn-north-4，`clean_1117.py` 直连 KooCLI）：本机 D3-C1 创建的 ECS `98ec6db0…` / 子网 `d966028b…` / VPC `e2eccf59…` 全部消失；EIP total=0。
> 盘点中仍见 `testbot3-hermes-e2e-4863514171` / `4863601129` 两组 ECS+VPC+子网，其 id/名称在本机今日全部日志与探针输出中均无痕迹（`grep` 零命中），`testbot3-hermes-*` 为多机共用硬编码前缀 → 非本机创建，按纪律不删；`tctest-*` 为他机资源，勿删。

---

## 八、遗留与建议

| 项 | 结论 / 建议 |
|---|---|
| D4 安全域（P0 三项） | D4-2 / D4-21 / D9-12 为跨轮复现的产品缺陷（v1.1.14 首轮仍现），建议优先修复：env-dump 正则补裸 `access_key`/`secret_key`、HCL 制品规则补 `actions=[...]` 与托管策略后缀、MCP initialize 补时序状态机。 |
| D1-70 代理崩溃 | 建议对 bundled `undici` 加载加 try/catch + 能力探测（`typeof zlib.createZstdDecompress`），并在 package.json engines 标注实际所需 node 版本（>=22.15 或降级 undici）。 |
| D3-C14（本轮新增 SPEC） | v1.1.14 主动下线自定义模板、`hdkitConnect` 停传 `template_id`（`sandbox/hdkitservice-api.mjs:189-193`），用例 D3-C14 断言未同步。建议维护者裁定：同步用例母版断言（推荐，实现是主动变更）或在文档/CHANGELOG 明示「template_id 已下线」。 |
| 路由层缺陷（D10-3 / EXP-E01 / D3-S5） | 建议 routeMap 补「云主机」等同义词并支持复合意图拆解；当前准确率 92.9%（13 HIT / 1 MISS / 1 N/A），harness 可重复量化。 |
| BLOCKED 6 项 | 均为真·夹具缺失（KooCLI 多 profile / RDS 密码参数 / npm 供应链抓包 / 审批流可注入时钟 / 多客户端并存），解除条件已在 §五 写明，非产品缺陷。 |
| D3-S7 RDS | KooCLI 7.2.12 `RDS CreateInstance` 未暴露 password 参数（API 必填 `db.password`），建议以 SDK 直调或等 CLI 升级后补测。 |
| SPEC 4 项 | D10-4 规则数已至 19 条（9 deny + 10 warn）、D9-9 cancellation 未声明、D8-9 sanitizeValue 未脱敏、D3-C14 template_id 停传 → 建议同步用例断言或修实现。 |
| 工具面变化（v1.1.14） | tools/list 由 46 增至 47：新增 `huaweicloud_sandbox_shutdown`（D5-1/D9-10/D9-11 按实际枚举判 PASS，schema 均为 `type=object`）。 |
| 本轮与上轮差异 | 被测包升级 v1.1.13→v1.1.14（gitHead `8a6d8be2`→`bd985051`）：13 项历史缺陷全部原样复现（无修复），**新增 1 项 SPEC：D3-C14**；D1 安装域、认证、协议、评测域结论与上轮一致。 |
