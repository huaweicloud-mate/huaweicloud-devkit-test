# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-15 05:22:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-15-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit **`1.1.9-next.0`**（npm `next` 预发布，gitHead `6302921c`；插件副本已 sync）
> **结论**：`PARTIAL`（有 FAIL/SPEC 缺陷：P0 2 项、P1 5 项、P2 3 项、SPEC-MISMATCH 3 项；P0 安全项经历史查重，见 FINDINGS.md / HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux`（Ubuntu 24.04，aarch64） |
| 被测版本（SUT） | **`1.1.9-next.0`**（npm `next`，gitHead `6302921c`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：① **源码级探针直调**（`hdk/plugins/huaweicloud-core` @ gitHead `6302921c`：`auth/credentials.mjs`、`safety-policy.mjs`、`risk-rule-engine.mjs`、`telemetry/telemetry.mjs`、`tools.mjs`、`mcp-protocol.mjs`、`hooks/huaweicloud-safety.py`）——确定性函数调用，覆盖 D1/D2/D4/D8/D9 多数用例；② **MCP server 真机**（stdio + remote JSON-RPC：`initialize`/`tools/list`/`tools/call`，**42 工具**）；③ **真云 E2E 实机**（`scripts/realcloud_e2e.mjs` + 专用探针：ECS 全生命周期建删归零、OBS 静态站建删归零、沙箱部署/预览 URL、沙箱 7 隐式工具、FunctionGraph 函数+定时触发器建删归零、跨区域引导）；④ **只读子账号实测**（`scripts/run-as-readonly.py` 临时注入 test001 凭证，验证最小权限 D4-13：只读可用 + 写被拒）；⑤ **评测集 harness**（`eval/harness/run-eval.mjs` 15 条中文意图跑 serviceCatalog 路由）。所有 PASS 用例证据落 `evidence/<case-id>/`（`probe.mjs` + 非空 `stdout.log`）。

> **本轮变更**：
> - **SUT 升级**：npm 由 `1.1.8`（gitHead `74f519dc`）→ **`1.1.9-next.0`**（gitHead `6302921c`）；MCP `tools/list` 稳定 **42** 工具。
> - **新发现（相对上一轮）**：**D3-S3 沙箱预览 URL 不可用**（`expose_tunnel` 返回的 `publicUrl` 携带 `\r\nReady`，见 #3）——并回溯确认上一轮（10-13）该用例的 PASS 系**探针缺陷导致的假 PASS**（探针 URL 兜底正则误取了报错 hint 里的文档 URL，见 §八）。
> - **上一轮结论稳定性**：D2-4（脱敏）、D8-9（脱敏）、D9-12（握手时序）、D10-3/EXP-E01（路由）、D4-25/D4-26、D1-65/D1-68、D3-C7 在新版本上**全部复现**；D3-S1/D3-S5 亦复现。
> - **测试侧自曝 2 项脚本缺陷**（D3-C1 清理轮询窗口、D3-C2 以 KooCLI 退出码判 OBS 建桶成败），已人工补删归零并入库为【测试侧】条目（见 FINDINGS #14/#15）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 10 / 0 / 3 / 2` |
| 通过率（分母 = PASS+FAIL = 145） | `93.1%` |
| P0 / P1 / P2 新增缺陷 | `2 / 5 / 3`（另 SPEC-MISMATCH 3 项单列于 §四） |
| 红线（I 类）违规 | `3`（明文凭证残留：D2-4 / D4-26 / D8-9） |
| 资源释放 | `全部归零`（ECS 0 / VPC 无 testbot3-hermes-* / 子网已删 / EIP total_count=1 且属他方设备 / OBS 本次桶已删；FunctionGraph 与沙箱会话建删归零） |
| 门禁 | `verify_no_fake_pass.py` PASS（rc=0）、`verify_coverage.py` PASS（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.9%） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移（D1-65 / D1-68 / D8-9） |
| NOT_RUN | `2` | 未执行（D1-39 Windows 专属 / D3-S7 复合编排） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（serviceCatalog 路由 MISS） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏对 JSON 字符串不生效（明文 SK 残留） | `safety-policy.mjs:34-47`（`:45` 全大写 AK/SK 且不接受引号键） | 待提单 |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手时序无状态机（非法时序未拒 -32600） | `mcp-protocol.mjs:57` | 待提单 |
| 3 | P1 | `D3-S3` | D3功能 | expose_tunnel 返回 publicUrl 携带 `\r\nReady`，URL 不可用 | `sandbox/session-manager.mjs:1266` → `:1283` | 待提单 |
| 4 | P1 | `D3-S1` | D3功能 | 只读 ECS 意图 serviceCatalog 未命中 ECS | `tools.mjs` serviceCatalog routeMap | 待提单 |
| 5 | P1 | `D10-3` | D10评测 | 评测集路由准确率 92.9%（1 条 MISS） | `tools.mjs` serviceCatalog routeMap | 待提单 |
| 6 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图路由 MISS | `tools.mjs` serviceCatalog routeMap | 待提单 |
| 7 | P1 | `D3-C7` | D3功能 | 跨区域引导错误码不符（Common.0013/VPC.0501 ≠ Ecs.0021/Ecs.0200） | 凭证 region 作用域先失败（`auth/credentials.mjs`）+ 引导层无归一 | 待提单 |
| 8 | P2 | `D3-S5` | D3功能 | 复合意图分层路由仅命中单一服务 | `tools.mjs` serviceCatalog（无复合拆分） | 待提单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 写命令事件分类错 + 落错目录 | `hooks/huaweicloud-safety.py:46`、`:24` | 待提单 |
| 10 | P2 | `D4-26` | D4安全 | findings.evidence 明文密码残留 | `risk-rule-engine.mjs`（evidence 未走 redactString） | 待提单 |
| 11 | SPEC | `D8-9` | D8遥测 | sanitizeValue 未做敏感值脱敏 | `telemetry/telemetry.mjs:189` | 待提单 |
| 12 | SPEC | `D1-65` | D1安装 | 调试开关仅接受字面量 "true"（`1` 无效） | `telemetry/telemetry.mjs:81` | 待提单 |
| 13 | SPEC | `D1-68` | D1安装 | region 环境变量优先级与契约相反（HW_REGION 胜出） | `auth/credentials.mjs:222` | 待提单 |

### 根因详情

**#1 D2-4（P0｜红线 I 类）** — 期望：`redactSecrets()` 输出不含明文 SK；实际：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 原样返回（探针断言 `redact-json` FAIL，3 项断言中 2 项通过：credentials 可读、profile 已脱敏）。根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` —— `:42` 正则要求长键名（`secret_key`/`access_key`）且不容忍引号包裹的键；`:45` `/(AK|SK)\s*[:=]\s*/g` 全大写且不匹配 `"sk":` 形态，故 JSON 字符串形态的 ak/sk 全部漏脱敏。证据：`evidence/D2-4/stdout.log`。

**#2 D9-12（P0）** — 期望：`tools/list` 在 `initialize` 之前调用返回 `-32600`；实际：未握手直接 `tools/list` 正常返回 `listed:42`（探针 `非法时序拒绝=false`）。根因：`mcp-protocol.mjs:57` `dispatch()` 按方法名直接路由，缺「已 initialize」状态校验。证据：`evidence/D9-12/stdout.log`。

**#3 D3-S3（P1，本轮新发现）** — 期望：终点返回**可访问**公网 URL（HTTP 200）；实际：`expose_tunnel` 返回 `ok:true` 但 `publicUrl="https://<id>-8080.devbridge-s2.hwtunnel.com\r\nReady"`，直接 fetch 得 404/404/404/502、curl 得 `000`，插件内置健康检查 `httpCode=""`（附带 warning「Tunnel reachable check returned HTTP (expected 200/304)」）。根因：`sandbox/session-manager.mjs:1266` 用 `sed -n 's/.*Tunnel URL: *//p' ${hostLog} | tail -1` 从 host 日志抽地址，未清洗日志中的 CR/进度 marker；`:1270` 原样 `echo` 后由 `:1283 parseDevbridgeExposeOutput()` 解析为 `publicUrl` 返回。旁证：仅截取 host 段手工 `curl` 该 URL 可达（HTTP 200）→ 应用本身在线，缺陷在返回值清洗。证据：`evidence/D3-S3/stdout.log`。

**#4/#5/#6 D3-S1 / D10-3 / EXP-E01（P1，同源）** — `serviceCatalog` 中文意图路由未命中期望服务：D3-S1 返回兜底 `route=["Run hcloud --help to list available services."]`（未命中 ECS）；harness 15 条评测 HIT=13 MISS=1 N/A=1（92.9%），其中 `EXP-E01` MISS。根因：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog.routeMap` 中文关键词覆盖不足。证据：`evidence/D3-S1/stdout.log`、`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`。

**#7 D3-C7（P1）** — 期望：区域不可用 → `Ecs.0021`；资源不存在 → `Ecs.0200`。实际：跨区只读查询返回 `Common.0013`（region-scoped token 项目名不匹配），跨区创建 EIP 返回 `VPC.0501`；plan 命令已正确携带 `--cli-region=ap-southeast-3`（5 项断言 3 通过 2 失败）。根因：凭证层 region 作用域先于服务层校验失败（`credentials.json` 的 token 绑定 `cn-north-4`），引导层未做可判定错误码归一/前置提示。证据：`evidence/D3-C7/stdout.log`。

**#8 D3-S5（P2）** — 期望：复合意图拆分命中多个 service；实际：`recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`（仅单服务）。证据：`evidence/D3-S5/stdout.log`。

**#9 D4-25（P2）** — 期望：写命令→`cli:write`，事件落 Node 读取的 telemetry 目录；实际：`ECS CreateServers` 被记为 `cli:invoke`（keys=["cli:read","cli:invoke","cli:invoke"]），事件写入 `plugins/telemetry` 而 Node 声明读取目录存在=false（`telemetry.mjs:21` 读 `plugins/huaweicloud-core/telemetry`）→ 事件不被消费。根因：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置字符类 `(^|[A-Za-z0-9])` 使空格分隔写动词不匹配；`:24` `PLUGIN_DIR = parents[2]` 误指向 `plugins/`。证据：`evidence/D4-25/stdout.log`。

**#10 D4-26（P2，红线 I 类）** — 期望：`findings[].evidence` 中 password 等被 `<redacted>`；实际：`evidence="hcloud IAM CreateUser --password MyS3cret123 --cli-region=cn-north-4"` 明文残留。证据：`evidence/D4-26/stdout.log`。

**#11 D8-9（SPEC）** — 期望：`sanitizeValue()` 移除 AK/SK/token；实际：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回（installId 稳定持久=true 部分正常）。根因：`telemetry.mjs:189` 仅 trim/截断/去控制字符，未调用 `redactSecrets()`。证据：`evidence/D8-9/stdout.log`。

**#12 D1-65（SPEC）** — 期望：`DEBUG=1` 或 `true` 均开启调试日志；实际：`=true` 增量 1254、`=1` 增量 0、未设 0。根因：`telemetry.mjs:81` `=== 'true'` 严格字面量。证据：`evidence/D1-65/stdout.log`。

**#13 D1-68（SPEC）** — 期望：`HUAWEICLOUD_REGION` 优先；实际：`HW_REGION` 胜出（`region=cn-test-hw-wins`）。根因：`auth/credentials.mjs:222` `HW_REGION || HUAWEICLOUD_REGION` 顺序与契约相反。证据：`evidence/D1-68/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【调归属】 | D1-39 为 **Windows 专属** P0 用例（OS 列标注「专属」），当前执行 OS=Linux 不适用，按 AGENTS.md「P0 NOT_RUN 唯一例外 = OS 专属 P0 用例在非对应 OS」处理。Linux 侧由展开级 `EXP-NR3-10`（`platform=linux` 分支，本轮 PASS）代表覆盖，**Linux 侧检测链具备覆盖，无缺口**。 |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 【改用例】 | 「跨服务复合编排（RDS 建实例 + 沙箱连接串注入 + 全量归零）」超出每日**单服务**真云探针范围与单条用例 15min 预算，需独立编排 harness（RDS 建删 + 沙箱 + 连接串注入 + 归零校验）。建议：拆为专项用例（`D3-S7a` RDS 建删归零 / `D3-S7b` 连接串注入）或在专用 harness 建成后执行；**非**环境阻塞，故标 NOT_RUN 而非 BLOCKED。 |

### BLOCKED

`0` 项。本轮真云用例（含沙箱、ECS、OBS、FunctionGraph）均在真机实际执行（建删资源归零），无「无凭证」类假阻塞。

---

## 六、安全与红线合规

- **凭证泄漏事件**：**3 项（红线 I 类违规）** —— `D2-4`（JSON 形态 AK/SK 未脱敏）、`D4-26`（`findings.evidence` 明文 password 残留）、`D8-9`（`sanitizeValue` 未脱敏，SPEC-MISMATCH）。三者均属脱敏链路漏点，根因见 §四 #1/#10/#11。
- **写操作误判 read-only**：**无**（`D4-16` 命令包裹穿透本轮 PASS；`D4-13` 只读子账号实测：只读 `ListServersDetails` 可用、写 `CreateVpc` 被拒 `VPC.0010`，最小权限通过率符合预期）。
- **红线（I 类）违规**：3（同上，均已在 FINDINGS 提单清单）。
- **脱敏复核**：`redactSecrets` 对**参数数组/对象**形态生效（D2-4 `profile-mcp` PASS），但对 **JSON 字符串**（`"sk":`）、**risk-rule-engine evidence**、**telemetry sanitizeValue** 三处漏；本轮以探针直调逐点验证并落证据。
- **真云凭证使用**：管理员 AK/SK（管理员凭证）仅用于 E2E 建删；只读子账号（test001）经 `scripts/run-as-readonly.py` 以 env 临时注入（不落盘、不替换 `credentials.json`），命令结束自动还原。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证（只读复核） |
|---|---|---|---|
| VPC（`testbot3-hermes-e2e-2011916545`） | 1（D3-C1） | 已删（脚本 + 人工补删） | `VPC ListVpcs` **无 testbot3-hermes-e2e-\***（另清理上一轮遗留 `…-1926086575`） |
| 子网（`…-2011916545-subnet`） | 1 | 已删 | `VPC ListSubnets --vpc_id` 空 |
| ECS（`testbot3-hermes-ecs-2011916545`） | 1（D3-C1，c6.large.2/40GB GPSSD） | 已删（脚本提交 + 人工 `DeleteServers --delete_publicip=true`） | `ECS ListServersDetails` 无 `testbot3-*` 前缀 |
| EIP | 0（本轮未创建） | — | `EIP ListPublicips` `total_count=1`，该 EIP（121.36.54.113）绑定他方设备 `hc-activity-2048-ecs`，**非本次创建**，未动 |
| OBS 桶（`testbot3-hermes-obs-2012082840`，D3-C2） | 1 | 已删（`OBS rm`） | `OBS ls` 无 `testbot3-hermes-obs-*` |
| OBS 桶（`hdk1-c13-…`/`hdk1-s13-…`，探针用） | 本轮 D3-C13/EXP-C4 各建即删 | 已删 | 仅剩 10-13/10-14 历史遗留的 `hdk1-*` 桶（非本次创建；删除命令 `OBS rm -r -f` 被安全钩子拦，保留待维护者） |
| FunctionGraph（D3-S6 / D3-C 相关） | 1（定时触发器） | 已删 | `ListFunctions` 无本次函数名 |
| 沙箱会话（D3-C3 / D3-C6 / D3-S3） | 各 1 | 全部 `close_session` ok | 会话关闭；沙箱不计费资源 |
| ECS 归零总览 | — | — | **ECS=0、VPC 无 testbot3 前缀、子网已删、EIP 无本次新增** |

---

## 八、遗留与建议

1. **【测试侧·假 PASS 回溯】上一轮（10-13）`D3-S3` 的 PASS 系探针缺陷所致**：当 `expose_tunnel` 返回 `ok:false` 时，`probes_stage/probe_cloud2.mjs:55` 的 `url` 兜底正则 `JSON.stringify(exp).match(/https:\/\/[^\s"]+/)` 会从报错 `hint` 文本里取到 DevBridge API Key 文档页 URL（`https://devstation.connect.huaweicloud.com/space/devbridge/apikey`），该页面 HTTP 200 → 错误判 PASS。**建议**：兜底正则改为只认 `exp.publicUrl`/`exp.url` 字段，禁止从 `hint`/`error` 文本兜底取 URL。该改动已在本轮新增探针 `probes_stage/probe_d3s3.mjs` 中落地（并加 curl 交叉验证 + 传播延迟重试）。
2. **【测试侧】`scripts/realcloud_e2e.mjs` 两处判定缺陷**（FINDINGS #14/#15）：① D3-C1 `finally` 归零轮询窗口 150s 对 ECS 异步删除偏短 → 建议改为「按 serverId/name 前缀反查 + 指数退避轮询至 300s」；② D3-C2 `OBS建桶` 以 KooCLI 退出码判定，而 `hcloud OBS mb` 成功时返回 6 → 建议改判输出中的 `Create bucket … successfully`。
3. **【改用例】`D3-S7`**：建议按 §五 拆分为专项用例（RDS 建删归零 + 连接串注入）。
4. **【待裁决 SPEC】`D1-65` / `D1-68` / `D8-9`**：三项均为「实现与文档/契约漂移」，建议维护者裁定以文档还是实现为准后固化用例断言。
5. **【历史遗留资源】** 云端仍存 `hdk1-c13-*` / `hdk1-s13-*` 旧 OBS 桶（10-13 / 10-14 探针遗留）；批量删除命令被本机安全钩子拦截，建议维护者在具备审批通道的机器上清理。
6. **【路由表】** `serviceCatalog.routeMap` 中文关键词覆盖不足已连续多轮出现（#4/#5/#6），建议系统性补齐中文短语（「只读查/查看 X」「部署预览」等）后重跑 `eval/harness/run-eval.mjs` 复核基线。
