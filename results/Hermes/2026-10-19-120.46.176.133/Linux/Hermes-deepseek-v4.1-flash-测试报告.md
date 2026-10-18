# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-19 05:20:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-19-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 FAIL/SPEC 缺陷；无新增缺陷，全部命中历史单复核）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux x86_64`（内核 6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm（私有镜像） / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9`（npm latest，gitHead `05a67b6`，PR #950 `chore(release): 1.1.9`） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS，探针实测 tools/list=42） |
| hcloud / 依赖 | KooCLI 已配置（`hcloud 7.x`），真云凭证 `~/.config/huaweicloud/credentials.json`（cn-north-4） |
| 只读子账号 | `~/.config/huaweicloud/credentials.readonly.json`（D4-13 经 `run-as-readonly.py` 注入） |
| 测试类型 | 源码级探针直调 / MCP 协议真机 / CLI 真机 / 真云 E2E（建删资源） |
| 设计真源 | 设计级（daily 下发 107）/ 展开级（daily 下发 43，已按 agent+OS 预筛） |
| daily 基础用例 | 设计级 107 / 展开级 43 = **150** |

> **执行方法**：Phase A 4 组分组探针（d2-auth / d1-upgrade / d4-security / mcp-tools）本日**重新执行**，逐用例拆分证据；Phase B 13 个专用探针（`probes_stage/`）经 `$EVID_DIR` 自写证据；Phase C 真云 E2E（D3-C1/C2/C3/C6）真机建删资源。证据统一落 `evidence/<case-id>/`（probe.mjs + 非空 stdout.log），回填 `执行状态/执行时间/evidencePath` 后经 `verify_no_fake_pass.py` + `verify_coverage.py` 双门禁校验通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `150`（PASS+FAIL+BLOCKED+SPEC-MISMATCH = 149；NOT_RUN 1） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 5 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 144，不含 BLOCKED/NOT_RUN） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（9 FAIL + 3 SPEC 全部命中上游历史单，本次为复核） |
| 红线（I 类，明文凭证残留） | `3`（D2-4 明文 SK / D4-26 明文 password / D8-9 sanitizeValue 未脱敏） |
| 资源释放 | `本次创建资源全部归零`（ECS=0、本次 VPC=0、本次子网=0、OBS=0、EIP=0、EVS=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见 §四 |
| BLOCKED | `5` | 账户受限 / 缺编排 harness（见 §五） |
| SPEC-MISMATCH | `3` | 契约漂移，待裁决 |
| NOT_RUN | `1` | D1-39 Windows 专属 P0（OS 专属豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（路由 MISS，与 D3-S1/D10-3 同源） |
| **合计** | **`43`** | |

### 3.3 门禁

| 门禁 | 结果 |
|---|---|
| `verify_no_fake_pass.py Hermes Linux` | **PASS**（所有 PASS 用例均有 evidencePath 且证据非空） |
| `verify_coverage.py Hermes Linux` | **PASS**（P0 无 NOT_RUN/空；NOT_RUN+空 占比 0.0% ≤ 15%；5 条 BLOCKED 均含 blockedReason） |

---

## 四、缺陷清单

> 全部 12 项（9 FAIL + 3 SPEC-MISMATCH）经 `file_issue.py` 历史查重**均命中上游已有 issue**，本次**不重复开单**，生成 `HISTORY_LINKS.md` 关联清单；**新增缺陷 0**。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏对 JSON 字符串不生效（明文 SK 残留） | `safety-policy.mjs:34-47` | 历史复核（#844 等） |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手无状态机（非法时序未拒） | `mcp-protocol.mjs:30,57` | 历史复核（#814 等） |
| 3 | P1 | `D3-S1` | D3功能 | serviceCatalog 中文意图路由未命中 ECS（退化为 help） | `tools.mjs:1997-2228` | 历史复核（#844 等） |
| 4 | P1 | `D10-3` | D10评测 | 评测集路由准确率 92.9%（1 条 MISS） | `tools.mjs:1999` routeMap | 历史复核（#844 等） |
| 5 | P1 | `EXP-E01` | D10评测 | 单条评测中文意图路由 MISS | `tools.mjs:1999` routeMap | 历史复核（#844 等） |
| 6 | P1 | `D3-C7` | D3功能 | 跨区域引导错误码与契约不符（Common.0013 而非 Ecs.0021） | `tools.mjs` region 校验链 | 历史复核（#828） |
| 7 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs:1997` serviceCatalog | 历史复核（#788） |
| 8 | P2 | `D4-25` | D4安全 | Python hook 写命令事件分类错误且落错目录 | `huaweicloud-safety.py:24,46` | 历史复核（#752） |
| 9 | P2 | `D4-26` | D4安全 | risk findings.evidence 明文口令残留 | `risk-rule-engine.mjs:97` | 历史复核（#896 等） |
| 10 | P2 | `D1-65` | D1安装 | 调试开关仅接受字面量 "true" | `telemetry.mjs:81` | 历史复核（#754） |
| 11 | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反 | `credentials.mjs:225` | 历史复核（#765） |
| 12 | P2 | `D8-9` | D8遥测 | telemetry sanitizeValue 未做敏感值脱敏 | `telemetry.mjs:189` | 历史复核（#896 等） |

### 根因详情

**#1 D2-4【P0】明文 SK 残留** — 现象：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 原样返回，`redact-json` 断言 FAIL。断言：脱敏结果不得包含 `SKTEST1234567890abcdef1234`。根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` —— 第 42 行键名表只覆盖 `access_key|secret_key|...` 等长键名（`ak`/`sk` 短键未覆盖），第 45 行 `/(AK|SK)\s*[:=]\s*/g` 无 `i` 标志、也不接受被引号包裹的 JSON 键（`"sk":`），故 JSON 形态 AK/SK 全部漏脱敏。证据：`evidence/D2-4/stdout.log`。

**#2 D9-12【P0】握手时序无状态机** — 现象：未 `initialize` 直接发 `tools/list`，服务端正常返回 `listed:42`，未返回 `-32600`；断言 `非法时序拒绝=false`。断言：`initialize` 之前的 `tools/list` 必须返回 JSON-RPC `-32600`。根因：`plugins/huaweicloud-core/src/mcp-protocol.mjs:30` `dispatch()` 按方法名直接路由，`:57` `if (method === 'tools/list') return { tools: TOOL_DEFINITIONS }` 无「已初始化」前置状态校验。证据：`evidence/D9-12/stdout.log`。

**#3 D3-S1 / #4 D10-3 / #5 EXP-E01【P1】中文意图路由覆盖不足** — 现象：`serviceCatalog({intent:'只读查询 ECS 实例…'})` 返回 `recommendedServices=["Run hcloud --help to list available services."]`（退化为 help）；`eval/harness/run-eval.mjs` 15 条中文意图 HIT=13 MISS=1 N/A=1，准确率 92.9%（EXP-E01 MISSS）。断言：目标意图的 `recommendedServices` 必须含 `ECS`；评测集服务路由类意图 HIT=100%。根因：`plugins/huaweicloud-core/src/tools.mjs:1997` `serviceCatalog()` / `:1999` `routeMap` 中文关键词表未覆盖「只读查询/查看云主机」类短语，`:2228` 循环未命中即回落 help。证据：`evidence/D3-S1/stdout.log`、`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`。

**#6 D3-C7【P1】跨区域错误码契约漂移** — 现象：`--cli-region=ap-southeast-3` 只读查询返回 `Common.0013`（region 与 project name 不匹配），用例契约期望区域不可用命中 `Ecs.0021`、资源不存在命中 `Ecs.0200`；5 项断言 3 通过 2 失败（另 1 项失败为跨区创建 EIP 返回 `VPC.0502 Tenant status is op_restricted`，属账户受限，见 §五）。断言：跨区/资源不存在必须返回契约约定的服务级错误码。根因：`plugins/huaweicloud-core/src/tools.mjs` 跨区域引导未做错误码归一（直接透出 KooCLI `Common.0013`）。证据：`evidence/D3-C7/stdout.log`。

**#7 D3-S5【P2】复合意图未拆分** — 现象：复合中文意图仅 `recommendedServices=["ECS"]`，未同时命中分层目标。断言：复合意图须拆分并命中多个对应服务。根因：`tools.mjs:1997` `serviceCatalog()` 仅做单服务关键词首命中，无复合意图拆分。证据：`evidence/D3-S5/stdout.log`。

**#8 D4-25【P2】Python hook 写命令分类错误 + 落错目录** — 现象：写命令（`ECS CreateServers`）事件被记为 `cli:invoke`（keys=["cli:read","cli:invoke","cli:invoke"]），且写入 `plugins/telemetry`，Node 侧读取目录存在=false → 事件不被消费。断言：写→`cli:write`、读→`cli:read`，事件必须落 Node 读取的 telemetry 目录。根因：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:24` `PLUGIN_DIR = Path(__file__).resolve().parents[2]`（误指向 `plugins/`，应为 `plugins/huaweicloud-core`）、`:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，空格分隔写动词不匹配。证据：`evidence/D4-25/stdout.log`。

**#9 D4-26【P2】findings.evidence 明文口令** — 现象：`decision=warn findings=1` 的 evidence 含明文 `--password MyS3cret123`。断言：`findings[].evidence` 中 AK/SK/token/password 必须 `<redacted>`。根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:97` `evidence: excerpt(context.text)` 未过 `redactString()`。证据：`evidence/D4-26/stdout.log`。

**#10 D1-65【P2 SPEC】调试开关仅接受 "true"** — 现象：`HUAWEICLOUD_DEVKIT_DEBUG=1` 日志增量 0；`=true` 增量 1254。根因：`src/telemetry/telemetry.mjs:81` `=== 'true'`，未兼容 `1`。证据：`evidence/D1-65/stdout.log`。

**#11 D1-68【P2 SPEC】region 变量优先级反了** — 现象：同时设两变量时 `HW_REGION` 胜出（`region=cn-test-hw-wins`）。根因：`src/auth/credentials.mjs:225` `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，与契约相反。证据：`evidence/D1-68/stdout.log`。

**#12 D8-9【P2 SPEC】sanitizeValue 未脱敏** — 现象：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回。根因：`src/telemetry/telemetry.mjs:189` 仅 trim/截断/去控制字符，未调用 `redactSecrets()`。证据：`evidence/D8-9/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN（1）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【调归属】 | D1-39「Windows 升级检测链可用性」为 **OS 专属** 用例，当前 OS=Linux 不适用；Linux 侧升级链路由展开级 `EXP-NR3-10`（已实测 PASS：`platform=linux`、`queryDistTagsSync` 无 EINVAL）代表覆盖 | 无需改用例（归属正确，属 OS 专属 P0 在非对应 OS 的豁免情形） |

### BLOCKED（5）— 全部为**真机执行后**的账户/环境阻塞，非「未跑即标阻塞」

| 用例ID | 层级 | 优先级 | 分类 | blockedReason（实测时间 2026-10-19 05:0x CST） | 解除条件 |
|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | 【补环境】 | 真云执行：VPC+子网创建成功、审批链 `allow`、归零确证；**ECS CreateServers 返回 `Ecs.0067 Your account is insufficient balance.`**（账户余额不足） | 账户恢复余额后复测 ECS 生命周期 |
| `D3-C2` | 设计级 | P1 | 【补环境】 | 真云执行：**OBS CreateBucket 返回 403 `UserRestricted`（forbidden for restricted users）**；set/get 站点随之为 404（桶不存在）；ListBuckets 未含本次桶名 → 无残留 | 账户解除受限后复测 OBS 静态站 |
| `D3-C13` | 设计级 | P1 | 【补环境】 | 真云执行：**OBS CreateBucket 403 `UserRestricted`**（任意桶名均被拒），未创建任何桶，无残留 | 账户解除受限后复测 OBS 网站托管 get/set/delete |
| `D3-S6` | 设计级 | P2 | 【补环境】 | 真云执行：**FunctionGraph CreateFunction 返回 `FSS.0403 user restricted`**；ListFunctions 未含本次函数名 → 无残留 | 账户解除受限后复测函数创建 + TIMER 触发器绑定 |
| `D3-S7` | 设计级 | P1 | 【补环境】 | 跨服务交付需「建 RDS → 沙箱/ECS 部署 Web → 连接串注入 → 归零」编排 harness + RDS 实例配额；每日单服务真云探针未覆盖，且本账户当前写操作受限（OBS 403 / ECS Ecs.0067 / FunctionGraph FSS.0403），RDS 亦无法创建 | 提供跨服务编排 harness + 账户恢复 + RDS 配额 |

> **说明**：AC 账户本轮处于「受限 + 余额不足」状态（OBS/ECS/FunctionGraph 写操作均被云端拒绝），但**只读/规划类与沙箱类真云用例仍实测通过**（D3-C4 22 服务只读规划 22/22、D3-C6 沙箱 7 隐式工具 5/5、D3-C3 沙箱部署 5/5、D3-S3 公网预览 URL HTTP 200）。**沙箱未阻塞**，故不以「无环境」笼统标阻塞。

### 本轮由 BLOCKED/FAIL 转 PASS（真机复测，非虚报）

| 用例ID | 前一日（10-17） | 今日 | 说明 |
|---|---|---|---|
| `D3-S3` | FAIL | **PASS** | 上一轮失败根因是沙箱工作区遗留 nginx 监听占满 8080-8089；本轮先清理测试残留后真机复测：`deploy_nginx` 成功、`deploy_check nginx_serving=PASS`、`expose_tunnel` 返回 `https://5iqntxnj-8080.devbridge-s2.hwtunnel.com` 且 `HTTP 200`、会话正常关闭 |
| `D3-C3` | PASS | **PASS**（复跑确证） | 首跑因同一沙箱残留端口占用导致 `deploy_nginx` 无可用端口而报错；清理残留后按原样例（port 8080）复跑 5/5 PASS（connect/upload/deploy_nginx static:8080/deploy_check PASS/close） |
| `D3-S6` | PASS | BLOCKED | 由产品通过转为**账户受限**阻塞（`FSS.0403`），非产品回归 |
| `D3-C1` | PASS | BLOCKED | 由产品通过转为**账户余额不足**阻塞（`Ecs.0067`），非产品回归 |

---

## 六、安全与红线合规

- **凭证泄漏事件（I 类）**：**3 项明文残留**（均命中历史单复核，非新增）——
  - `D2-4`：`redactSecrets()` 对 JSON 形态 AK/SK 漏脱敏，明文 SK 可经返回值外泄（`safety-policy.mjs:34-47`）；
  - `D4-26`：风险引擎 `findings[].evidence` 含明文 `--password`（`risk-rule-engine.mjs:97`）；
  - `D8-9`：`telemetry.sanitizeValue()` 未调用脱敏，遥测可带凭证明文（`telemetry.mjs:189`）。
- **写操作误判 read-only**：未发现。`D4-15/D4-16` 类命令包裹/审批链断言均 PASS；`D3-C4` 22 服务只读规划 22/22 通过。
- **审批链红线**：真云建资源全部走 `plan_cli_command(allowWrites)` → `run_approved_command(approvedByToken)` 审批链（D3-C1 实测 `classification.decision=allow` 且返回 approvalToken）。
- **脱敏复核**：除上述 3 项外，`redactOutput`/hook 拦截类用例（D4-1/2/3/5/9/15/16/28 等）均 PASS。
- **只读子账号**：`D4-13` 经 `run-as-readonly.py` 注入 test001 只读凭证实测——只读 IAM 校验=true、只读可用=true、写被拒=true（最小权限成立）。

---

## 七、资源释放

| 资源 | 本次创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS 云服务器 | 0（创建被 `Ecs.0067` 拒绝） | — | `ListServersDetails` → `count=0`、`servers=[]` ✅ |
| VPC（本次 `testbot3-hermes-e2e-2357…`） | 1 | DeleteVpc 已提交 | 解析 `ListVpcs` 集合键后确证缺席 ✅ |
| 子网（本次 `testbot3-hermes-e2e-2357…-subnet`） | 1 | DeleteSubnet 已提交 | 解析 `ListSubnets` 集合键后确证缺席 ✅ |
| OBS 桶（D3-C2/C13） | 0（403 拒绝） | — | `ListBuckets` 未含本次桶名 ✅ |
| EIP | 0 | — | `ListPublicips` → `total_count=0` ✅ |
| EVS 云硬盘 | 0 | — | `ListVolumes` → `count=0` ✅ |
| 沙箱会话 | 2（D3-C3/D3-S3/D3-C6） | `close_session` 全部 ok | 沙箱内 nginx/隧道已 `delete-all` 清理（剩余监听=0）✅ |

> **历史遗留（非本次创建，按「只删本次创建」红线未动）**：账户内 2 条 `testbot3-hermes-e2e-0543499948-subnet` / `testbot3-hermes-e2e-0543344318-subnet`（2026-09-27 创建，所属 VPC 已不存在，孤儿子网）；另有其他 agent 的 VPC `testbot1-hermes-e2e-2099592118`。三者均非本机本次执行产物。
> **归零判定方法修正（测试侧）**：真云 E2E 归零判定**不以 KooCLI 退出码**、也**不以「列表文本不含 ID」**为准（列表 API 被限流/报错时文本为空会被误判「已归零」）——本轮 D3-C1 探针改为解析 `List*` 响应 JSON 的集合键（`servers`/`vpcs`/`subnets`）确证缺席，判据不足时周期重发删除。

---

## 八、遗留与建议

1. **账户受限为本轮最大阻塞面**：`Ecs.0067 insufficient balance` + OBS `403 UserRestricted` + `FSS.0403 user restricted` 导致 4 条真云写用例（D3-C1/C2/C13/S6）阻塞。建议维护者确认测试账号是否因保证金/实名或配额策略被限；解除后可一键复跑本轮 Phase C 用例。
2. **沙箱工作区残留会放大端口占用**：`close_session` 不清理由 `deploy_nginx` 启动的 nginx 监听，工作区被复用时 8080–8093 逐步耗尽，直接导致 `deploy_nginx` 无可用端口（首跑 D3-C3/D3-S3 即因此失败）。建议产品侧在 `close_session` 中回收 nginx/释放端口，或扩大端口搜索区间；测试侧已在探针内加入「开跑前清残留」收尾步骤。
3. **serviceCatalog 中文路由**（D3-S1 / D10-3 / EXP-E01 / D3-S5）仍是 P1 主线缺口，建议按 routeMap 关键词补全并加入评测集回归门禁（当前 92.9%，较历史基线 21.4% 已有大幅改善）。
4. **脱敏三处缺口**（D2-4 / D4-26 / D8-9）属 I 类红线，建议统一收敛到 `redactString()` 单一实现，避免「safety-policy 脱敏、risk-rule/telemetry 漏脱敏」的分叉。
5. **SPEC 待裁决**（D1-65 调试开关接受 `1`、D1-68 region 变量优先级）建议同步更新实现或用例契约，避免长期漂移。
6. **D3-S7 跨服务交付**建议立项专项（独立编排 harness + RDS 配额），否则每日用例将持续阻塞。
