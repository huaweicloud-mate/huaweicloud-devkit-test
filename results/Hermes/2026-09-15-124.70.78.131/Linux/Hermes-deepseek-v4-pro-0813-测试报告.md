# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-15 09:30:00`（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（复现 3 个 P0 + 1 个 P1 缺陷，均为已知缺陷，`v1.1.4` 正式版仍全部未修复，已跟踪 #652）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.16 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256e`，release PR `#669`） |
| 工具全集 | `40`（`tools/list` 实测，0 非法 schema；较上一轮 `39` 新增 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | 已配置（doctor 确认 11 pass，Runtime deps undici 已装） |
| 真云凭证 | cn-north-4（AKSK 已配置；本轮**未创建/删除任何真云资源**，仅只读脱敏查询） |
| 测试类型 | 源码级探针（safety-policy / risk-rule-engine / Python hook）+ 真机 CLI（install/doctor/status/update/uninstall）+ MCP 协议 + 凭证脱敏 + 导入擦除 |
| daily 用例集 | 设计级 81 / 展开级 48（本轮 prepare_env 已同步最新 daily 源） |

> **执行方法**：探针脚本直调安装包 `plugins/huaweicloud-core/src/*` 导出函数（`classifyTextCommand`/`evaluateCommandRisk`/`evaluateArtifacts`）+ spawn `mcp-server.mjs` 驱动 JSON-RPC，结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。CLI 安装/卸载在**同时隔离 HOME 与 HERMES_HOME** 的临时目录完成，未污染真实 agent home。Python hook（`huaweicloud-safety.py`）与 Node 策略一致性单独对比（D4-8）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 129（设计级 81 + 展开级 48） |
| 已执行（设计级） | 29 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 25 / 4 / 14 / 0 / 38 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 86.2%（25 / 29） |
| 展开级 | PASS 1 / BLOCKED 38 / NOT_RUN 9（镜像源设计用例结论） |
| P0 / P1 / P2 缺陷 | 3 P0 + 1 P1（均为已知缺陷，本轮复现确认，`v1.1.4` 未修复） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源；隔离 HERMES_HOME 已还原） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 25 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | 不符预期，根因见缺陷清单（D4-2 P0 / D4-16 P0 / D4-21 P0 / D9-2 P1） |
| BLOCKED | 14 | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 38 | 本轮未覆盖 |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 1 | EXP-D5-8-3（Hermes tools/list 全量枚举，复用 D5-3 证据） |
| BLOCKED | 38 | EXP-C4 服务矩阵(22) + EXP-E 评测集(15) + EXP-NR3-10 升级矩阵(P0)，同源设计用例阻塞 |
| NOT_RUN | 9 | EXP-NR3-02/04/24 + EXP-D1-58 白名单矩阵(5) + EXP-D5-8-1，单 Linux 终端未覆盖 |
| **合计** | **48** | |

---

## 四、逐用例结果（已执行项）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| D1-1 | P1 | 全新环境引导安装 | PASS | `evidence/D1-1` | 隔离 HOME+HERMES_HOME，29 skills+MCP+安全策略+hooks 全落盘，status 确认已安装 |
| D1-3 | P1 | doctor 健康自检 | PASS | `evidence/D1-3` | 11 pass / 0 warn / 0 fail |
| D1-4 | P2 | status/update 幂等 | PASS | `evidence/D1-4` | 二次 status 一致，update 幂等 exit=0 |
| D1-5 | P1 | uninstall 干净度 | PASS | `evidence/D1-5` | 清理 29 skills/MCP/安全策略/hooks，status 回落未安装，残留仅空 config.yaml + allowlist |
| D1-41 | P1 | check_update 真实 MCP 返回契约 | PASS | `evidence/D1-41` | isError=false，8 字段完整，result=up_to_date（currentVersion=1.1.4） |
| D2-4 | P0 | 凭证脱敏正确性 | PASS | `evidence/D2-4` | show_profile_redacted/auth_status 均 `<redacted>`，无 AK/SK 泄露 |
| D2-11 | P0 | R3 STS token 拒绝落盘 | PASS | `evidence/D2-11` | `{status:error, scope:rejected}`，隔离 S1 未写文件 |
| D2-12 | P1 | R10 runtime 非空禁止落盘 | PASS | `evidence/D2-12` | `Runtime credentials are active; auto-sync suppressed (R10)` |
| D2-16 | P1 | import 文件读取后擦除 | PASS | `evidence/D2-16` | mode=import 读取后 creds-import.json 擦除（exists=false） |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1` | `cat ~/.hcloud/config.json` 等 → deny/credential |
| D4-2 | P0 | 凭证 env 打印拦截 | FAIL | `evidence/D4-2` | `env \| grep HW_ACCESS_KEY` 返回 allow，根因见缺陷 #1 |
| D4-3 | P0 | 明文 secret API 拦截 | PASS | `evidence/D4-3` | ShowSecretVersion/GetSecretValue → deny/secret；ListSecretVersions → allow/read_only（正确） |
| D4-5 | P0 | 写操作误判检测 | PASS | `evidence/D4-5` | DeleteServer/BatchDeleteServers/DeleteSecurityGroup → deny/write，safeToRun=false；ListServers → allow/read_only |
| D4-7 | P1 | hook 三工具有效性 | PASS | `evidence/D4-7` | command/artifacts/deploy_plan 三工具均返回结构化风险结论 |
| D4-8 | P1 | Python/Node 策略一致 | PASS | `evidence/D4-8` | 9 组命令两路径判定一致（含共同缺口 HW_ 前缀，见缺陷 #1） |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | `evidence/D4-9` | 公网管理端口(0.0.0.0/0:22)、rds --force、OBS public-write → 均 deny |
| D4-15 | P0 | hook 绕过尝试 | PASS | `evidence/D4-15` | 大小写/拼接引号/base64/xxd 编码变体均无绕过（deny） |
| D4-16 | P0 | 命令包裹穿透 | FAIL | `evidence/D4-16` | 包裹**删除命令**可拦截；但包裹 **env-dump 命令**被穿透（`sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` → allow），根因见缺陷 #2 |
| D4-21 | P0 | hook_check_artifacts 宽泛 IAM 制品拦截 | FAIL | `evidence/D4-21` | JSON `{"Action":"*"}` → deny/hwc-iam-admin-policy（主断言 PASS）；HCL `actions=["*"]` / `AdministratorFullAccess` 未拦截 → 见缺陷 #3 |
| D4-22 | P0 | hook_check_deploy_plan 公网暴露拦截/告警 | PASS | `evidence/D4-22` | FunctionGraph+public+auth NONE → warn；缺 TTL → warn；有 ttl+owner → allow |
| D5-3 | P1 | 工具全量枚举 | PASS | `evidence/D5-3` | tools/list 返回 40 工具（+1 obs_set_website_config），0 非法 schema |
| D8-7 | P0 | 7 个 meta/通用技能可机械执行 | PASS | `evidence/D8-7` | 7 技能 retrieve 均 isError=false、无占位符/断链、SKILL.md 落盘存在 |
| D9-1 | P1 | tools/list 合规 | PASS | `evidence/D9-1` | 40 工具 inputSchema 均 type=object |
| D9-2 | P1 | JSON-RPC 错误码 | FAIL | `evidence/D9-2` | 未知 method/tool 均返回 -32603，根因见缺陷 #4 |
| D9-3 | P1 | tools/call 响应格式 | PASS | `evidence/D9-3` | content 数组 + isError:false + content[0].type=text |
| D9-4 | P1 | 协议生命周期 | PASS | `evidence/D9-4` | initialize(2024-11-05)+capabilities.tools+serverInfo(1.1.4) 正常 |
| D9-5 | P1 | stdio 传输健壮 | PASS | `evidence/D9-5` | 并发 20 tools/list 全部返回 40 工具，10KB 大 payload 正常，stderr 无协议污染 |
| D9-7 | P2 | 协议版本协商降级 | PASS | `evidence/D9-7` | 老版本 initialize 不挂死，回显协商版本 |
| D9-8 | P2 | inputSchema 版本合规 | PASS | `evidence/D9-8` | 无 draft 混用，additionalProperties 取值一致（$schema 统一未标注，见遗留建议） |

> **逐用例结果与副本 CSV「执行状态」+「evidencePath」列完全一致**（同一来源，backfill.py 回填）。

---

## 五、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 `HW_` 前缀 | `env \| grep HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow, risk=not_huaweicloud` | `safety-policy.mjs:336` / `cloud-risk-rules.json:39` / `huaweicloud-safety.py:54` | G | 已跟踪 #652-1 |
| 2 | P0 | `D4-16` | env-dump 规则被 shell 包裹穿透 | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | 返回 `allow`（删除/secrets 包裹可拦，env 包裹漏网） | `safety-policy.mjs:335` / `cloud-risk-rules.json:35` | G | 已跟踪 #652-2 |
| 3 | P0 | `D4-21` | Terraform HCL 形态 broad IAM 未拦截（补充探针） | HCL `actions = ["*"]` 应 `deny` | `decision=allow`、findings 空（JSON 形态正确 `deny`） | `cloud-risk-rules.json:179` | G | 已跟踪 #652-3 |
| 4 | P1 | `D9-2` | JSON-RPC 错误码未区分 | 未知 method → `-32601`；未知 tool → `-32602` | 两者均 `-32603` | `mcp-server.mjs:169` / `mcp-protocol.mjs:95` / `tools.mjs:1485` | P | 已跟踪 #652-4 / #638 |

> **提单说明**：以上 4 项均为已知缺陷，`v1.1.4` GA 复现确认，已统一跟踪于上游 open issue **#652**（本机工作流于 2026-09-13 提单的合并单）。按「勿拆单 / 勿重复提单」红线，本轮**不重复提单**，仅在 FINDINGS.md 复测记录。4 项均未在 `v1.1.4`（release PR #669）修复，提示 1.1.4 GA 仍携带 3 个 P0 + 1 个 P1 安全/协议缺陷。

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 | Windows 升级检测链专项，Linux 终端无法复现 | Windows 真机 | Windows agent 补测 |
| D1-40 | 镜像 lag 检测需镜像源/Windows | 镜像源 + Windows | 镜像环境就绪 |
| D3-C4 | 服务创建类回归需真云配额（ECS/DevStation） | 付费配额 + 沙箱 | 配额到位后复测 |
| D4-18 | 审批语义需真云 + 标准客户端交互确认流 | 真云 + 标准客户端 | 交互环境就绪 |
| D4-19 | 确认流下预检需真云高危操作进入确认流 | 真云 | 真云环境就绪 |
| D4-23 | 全局规则注入需 11 个 Agent 安装目标（单机仅 Hermes；源码未见 huawei-agent-rules.md 制品） | 11 客户端多机 | 多客户端矩阵环境 |
| D7-4 | 国内镜像源安装需 GitCode/国内镜像网络 | GitCode 镜像 + GITCODE_TOKEN | 镜像环境就绪 |
| D9-6 | 跨客户端互通需多客户端并存环境 | 多客户端 | 多客户端矩阵环境 |
| D9-9 | 需 inspector/延迟 MCP 客户端夹具注入 30s 挂起以验证 -32000 超时与取消语义 | inspector 夹具 | 夹具就绪（本轮实测 capabilities.cancellation 未声明，见遗留建议） |
| D10-1~D10-5 | 评测需 harness + 预算门禁 | 评测集 + 预算 | 评测环境就绪 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 show_profile_redacted / auth_status 均无 AK/SK 泄露）
- [x] 写操作误判 read-only：`0`（D4-5 实测删除类写操作均判 deny/write）
- [x] 红线（I 类）违规：`无`（本轮未创建/删除任何真云资源）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以指纹出现；D2-11/D2-16 用假凭证 + mkdtemp 隔离）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 未创建，无残留 |
| 隔离 HERMES_HOME（install 测试） | 是 | 已删 | 残留仅空 config.yaml + shell-hooks-allowlist.json |
| 临时 HUAWEICLOUD_HOME（D2-11/D2-16） | 是 | 已删 | mkdtemp 临时目录随探针退出清理 |

> 真云只删本次创建资源；本轮未创建任何真云资源。

---

## 九、遗留与建议

- 待裁决 SPEC：无。
- 观察（非缺陷）：
  1. 工具全集由 `39` → `40`（新增 `huaweicloud_obs_set_website_config`）；设计真源 D5-3/EXP-D5-8-3 的「预期结果」仍写 `39 工具`，属真源文本漂移，按红线 5 不回改 test-cases 母版，仅此处记录。
  2. `tools/list` 各工具 `inputSchema` 未标注 `$schema`/draft 版本（统一缺省），MCP 规范允许（D9-8 遗留）。
  3. `capabilities.cancellation` 未声明（D9-9），取消为 MCP 可选能力，按规范未声明即不支持。
- 本轮未覆盖（说明范围）：真云 E2E（D3-C4/D4-18/19）、多终端枚举（展开级 9 格 NOT_RUN）、评测（D10-*）、性能（D6-*）、Windows 专项（D1-39/40）、跨客户端互通（D9-6）、升级检测域（D1-26~33/42/45）、白名单接入域（D1-58）。
- 建议：
  1. **P0（D4-2）优先修复**：`safety-policy.mjs:336`、`huaweicloud-safety.py:54`、`cloud-risk-rules.json:39` 三处 env-dump 正则统一补 `HW_` 前缀（`HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN`），与 `credentials.mjs:130-132` 读取的 env 名对齐。
  2. **P0（D4-16）**：env-dump 检测从 `(^|\s)(env|printenv...)` 词边界改为支持 unbox shell 包裹（`sh -c`/`bash -c`/`eval` 内层提取），或与 destructive-delete/secret-read 一样改用对全文的子串/特征匹配。
  3. **P0（D4-21）**：`cloud-risk-rules.json:179` `hwc-iam-admin-policy` 正则补 HCL 形态 `actions\s*=\s*\[.*\*\s*\]` 与 `AdministratorFullAccess` 后缀，覆盖 Terraform HCL broad IAM。
  4. **P1（D9-2）**：`mcp-server.mjs:169` catch 按异常类型映射错误码（未知 method→-32601，未知 tool→-32602），或在 `mcp-protocol.mjs`/`tools.mjs` 抛出时附 error code。

> **覆盖率说明**：design 级 NOT_RUN 38/81（46.9%），与 2026-09-14 单机 Hermes Linux 基线一致。多数为「明确不适用本客户端/OS」的 Windows 专项、真云 E2E、评测/性能/多客户端矩阵用例，属单 Linux 终端无法覆盖，已按状态口径如实标 NOT_RUN/BLOCKED；P0 全量覆盖（无 P0 NOT_RUN）。