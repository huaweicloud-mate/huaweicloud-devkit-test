# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-04 05:58（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-04-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项；全部命中历史 issue，未重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（arm64，ecs-hd-ai-work-00-0003） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.8-next.1`（npm next，gitHead `ffd7b47`，PR #843 未合并） |
| 工具全集 | `41`（TOOL_DEFINITIONS，含新增 `huaweicloud_sandbox_expose_tunnel`） |
| hcloud / 依赖 | hcloud 7.2.x（cn-north-4，凭证已配置） |
| 真云凭证 | `cn-north-4`（AK/SK 管理员 + test001 只读子账号） |
| 测试类型 | 源码级探针 / MCP 协议 harness / 真机 CLI / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：44 个源码级探针（`.mjs` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数）+ 确定性 harness（`run-eval.mjs` D10-3 路由、`protocol-probe.mjs` D9 协议、`fixtures/run-all.mjs` 18 夹具）+ 4 个真云 E2E 探针（建删归零），证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（1 条 OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 10 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.8%` |
| P0 / P1 / P2 失败缺陷 | `2 / 5 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（tctest- 前缀残留 0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单（均命中历史 issue） |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `1` | D9-9 capabilities.cancellation 未声明 |
| NOT_RUN | `1` | D1-39 Windows OS 专属，Linux 结构性不适用 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文「云主机」路由 MISS |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-21` | hook_check_artifacts 宽泛 IAM 制品（Terraform HCL）未拦截 | `actions=["*"]` 应 `deny` + hwc-iam-admin-policy finding | `allow`，findings 空 | `safety/rules/cloud-risk-rules.json:196-209` | 历史 #651/#845 |
| 2 | P0 | `D9-12` | initialize 握手时序缺口 | 未 initialize 先 tools/list 应 -32600 | 正常返回 41 工具 | `mcp-protocol.mjs:57` | 历史 #814/#699 |
| 3 | P1 | `D4-6` | adminPass 空格形式值未脱敏 | `--adminPass <v>` 应 `<redacted>` | 明文 Secret123 残留 | `safety-policy.mjs:42` | 历史 #712/#845 |
| 4 | P1 | `D4-7` | hook 三工具有效性不完整（artifacts 宽泛 IAM） | Terraform HCL 宽泛 IAM 应 deny | allow | 同 D4-21 | 历史 #651/#845 |
| 5 | P1 | `D4-27` | 双路径输出脱敏小写缺位 | 小写 `ak=`/`sk=` 应脱敏 | 明文残留 | `safety-policy.mjs:45` | 历史 #683/#845 |
| 6 | P1 | `D9-2` | tools/list 传非法 params 未 -32602 | string params 应 -32602 | 返回完整工具列表 | `mcp-protocol.mjs:57` | 历史 #814/#752 |
| 7 | P1 | `EXP-E01` | 中文「云主机」意图路由 MISS | 应命中 ECS | `Run hcloud --help` | `tools.mjs:1970-1987` | 历史 #705/#845 |
| 8 | P2 | `D3-S5` | 复合中文意图（物联网+时序数据）路由未命中 | 应拆分命中存储+托管多服务 | 空返回 | `tools.mjs:1968-2192` | 历史 #788/#844 |
| 9 | P2 | `D4-25` | Python hook 写命令遥测误分类 | 写应 cli:write | cli:invoke | `hooks/huaweicloud-safety.py:46` | 历史 #844/#752 |
| 10 | P2 | `D8-9` | sanitizeValue 未做凭证脱敏 | 应移除 AK/SK/token | 明文残留 | `telemetry/telemetry.mjs:189-196` | 历史 #844/#845 |

### 根因详情（P0/P1 缺陷附根因 + 复现证据）

**#1 [P0] D4-21 hook_check_artifacts 宽泛 IAM（Terraform HCL）未拦截**
- 期望：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }'}])` → `deny`
- 实际：`{decision:'allow', findings:[]}`
- 根因：`cloud-risk-rules.json:196-209` `hwc-iam-admin-policy` 正则仅覆盖 JSON 大写 `"Action":"*"` / `Action=*` / `AdministratorAccess` / `FullAccess`，不识别 Terraform/HCL 小写复数 `actions=["*"]`
- 证据：`evidence/D4-21/stdout.log`（probe-p0-security fresh fail=1）

**#2 [P0] D9-12 initialize 握手时序缺口**
- 期望：未 initialize 先 tools/list 返回 JSON-RPC `-32600`
- 实际：正常返回 41 工具列表
- 根因：`mcp-protocol.mjs:57` tools/list 分支无 initialize 前置校验，mcp-server.mjs 无 init 状态机
- 证据：`evidence/D9-12/stdout.log`（probe-d9-12-handshake fresh fail=1）

**#3 [P1] D4-6 adminPass 空格形式值未脱敏**
- 期望：`redactSecrets(['ECS','CreateServers','--adminPass','Secret123'])` 无明文 Secret123 且含 `<redacted>`
- 实际：原样返回明文 Secret123
- 根因：`safety-policy.mjs:42` redactString 键值正则 `\s*[:=]\s*` 仅覆盖 `=`/`:` 分隔
- 证据：`evidence/D4-6/stdout.log`

**#4 [P1] D4-27 小写 ak=/sk= 未脱敏**
- 期望：`redactSecrets('ak=AKA123 sk=SKS456')` → 脱敏
- 实际：原样明文残留
- 根因：`safety-policy.mjs:45` `/(AK|SK)\s*[:=]\s*.../g` 无 `/i` 标志
- 证据：`evidence/D4-27/stdout.log`

**#5 [P1] D9-2 tools/list 非法 params 未 -32602**
- 期望：`tools/list` params=string 应返回 `-32602`
- 实际：返回完整工具列表
- 根因：`mcp-protocol.mjs:57` tools/list 分支未校验 params 类型
- 证据：`evidence/D9-2/stdout.log`（protocol-probe D9-2b FAIL）

**#6 [P1] EXP-E01 中文「云主机」未命中 ECS**
- 期望：`service_catalog('帮我查一下有哪些云主机')` → 命中 ECS
- 实际：`recommendedServices=['Run hcloud --help']`
- 根因：`tools.mjs:1970-1987` ECS routeMap 缺「云主机」中文等价词
- 证据：`evidence/EXP-E01/stdout.log`（run-eval HIT=13/MISS=1/N/A=1，准确率 92.9%）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL/npm.cmd 专属；Linux 无该语义，OS 列已标注「专属」，建包预筛仅在设计级全量下发，展开级已按 OS 剔除。Linux 侧由 d1-upgrade probe 佐证 dist-tags 检测正常 | —（OS 专属用例，符合红线唯一 NOT_RUN 例外） |

> 无 BLOCKED 用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-1/2/3/15/16/22 凭证拦截均 PASS；证据目录经核查无原始 AK/SK 明文）
- [x] 写操作误判 read-only：`0`（D4-5/D3-S1 只读分类 allow、写分类 deny 校验通过）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：红密 show_profile 经脱敏管道返回 `<redacted>`；真云探针日志无明文密码（RDS 密码仅经 cli-jsonInput 传输）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-s2/s7） | 是 | 已删 | ListVpcs 无 tctest 残留 |
| Subnet（tctest-s7） | 是 | 已删 | ListSubnets 无 tctest 残留 |
| SecurityGroup（tctest-d3c4） | 是 | 已删 | ListSecurityGroups 无 tctest 残留 |
| RDS（tctests7db） | 是 | 已删（job 受理完成） | ListInstances 无 tctest 残留 |
| OBS 桶（tctest-obs-website） | 是 | 已删 | 桶已删除 |
| FunctionGraph（tctestfn） | 是 | 已删（FSS.1051 确认不存在） | ListFunctions 无残留 |
| 沙箱会话（D3-S3） | 是 | 已 close_session | session 已关闭 |

> 真云只删本次 `tctest-` 前缀创建资源；删除前盘点 + 白名单，未触碰既有/他人资源。归零核验：host `hcloud VPC ListVpcs/ListSubnets/ListSecurityGroups`、`RDS ListInstances` 均无 `tctest-` 残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities.notifications.cancellation 未声明（历史 #828/#774 已跟踪，待维护方裁决 SPEC vs 实现缺失）。
- 本轮 10 项 FAIL/SPEC 全部命中上游历史 issue（见 `HISTORY_LINKS.md`），按红线不重复提单，`file_issue.py` 查重确认「无新问题」，跳过新开单。
- D4-20 / D4-24 / D5-3 / D6-4：旧探针硬编码断言（throw 语义 / 40 工具）已随 1.1.8 #745 结构化契约 / 41 工具更新为真实断言，实测全 PASS，非产品缺陷。
- 建议：`D3-C4` 探针 DMS/DEW 用「伞名」枚举对象，KooCLI 顶级已升级 aggregate 子服务路由；建议母版 `D3-C4` 枚举对象列改用子服务名（Kafka/RabbitMQ/RocketMQ/KMS/CSMS），避免语义歧义。