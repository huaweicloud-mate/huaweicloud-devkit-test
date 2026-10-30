# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-31 05:52:40（北京时间）
> **执行归档**：`results/OpenCode/2026-10-31-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.13-next.0`（npm @next，gitHead `47170d1`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |
| hcloud / 依赖 | `hcloud 7.2.12`（KooCLI）；Node v22.13.0 / Python 3.12.3 |
| 真云凭证 | `cn-north-4`（AK/SK + 只读子账号 test001） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand/evaluateCommandRisk/evaluateArtifacts/evaluateDeployPlan/judgeUpdate/semverParse/redactSecrets/serviceCatalog 等）落 `stdout.log`；MCP 协议直连 `mcp-server.mjs`（JSON-RPC initialize/tools-list/tools-call）；CLI 真机执行 `npx huaweicloud-devkit doctor/status/help/plugins/auth status`；真云 E2E 通过 `callTool` + `hcloud` 建删资源（ECS 全生命周期 / OBS 静态站 / VPC / FunctionGraph 全部建删归零）并只读子账号实测最小权限；D10 评测集经 `eval/harness/run-eval.mjs` + serviceCatalog 逐条路由。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 11 / 3 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.1%` |
| P0 / P1 / P2 新增缺陷 | `3 / 5 / 3` |
| 红线（I 类）违规 | `0`（无凭证明文泄露到日志/结果，全部输出经 redact 处理） |
| 资源释放 | `全部归零`（ECS/VPC/OBS 桶/FunctionGraph 均建删归零，只读子账号未创建任何资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:2424` serviceCatalog tokenizer 未按 CJK 边界切分，英文码「ecs」黏在中文「的」后无法命中 routeMap | 待提单 |
| 2 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:2424` 复合意图「物联网+时序数据+前端托管」无关键词命中，未拆分多 service | 待提单 |
| 3 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | `hcloud-cli.mjs` 未归一 func_urn `:latest` 后缀，DeleteFunction 触发 FSS.0400 | 待提单 |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `tools.mjs:2424` 复合意图「部署 Web+RDS」仅命中 RDS，未命中前端托管部署目标 | 待提单 |
| 5 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `safety-policy.mjs:549-550` env-dump 门 regex 未覆盖裸 `access_key` 词根 | 待提单 |
| 6 | P1 | `D4-6` | D4安全 | adminPass回显警告 | `cloud-risk-rules.json:372` secret-in-arg 只匹配 `--adminPass`，未覆盖 hcloud 的 `--admin_pass`；`:68` adminpass-exposure stages 不含 command | 待提单 |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `safety-policy.mjs:609` 无规则命中时默认 `allow`（fail-open） | 待提单 |
| 8 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `cloud-risk-rules.json:196` hwc-iam-admin-policy regex 未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess` 引用 | 待提单 |
| 9 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^\|[A-Za-z0-9])` 致「vpc CreateVpc」写操作误入 cli:invoke | 待提单 |
| 10 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:34` dispatch 无 initialize 前置状态机 + initialize 不接 runVersionCheck | 待提单 |
| 11 | P1 | `EXP-E01` | D10评测 | serviceCatalog 缺「云主机」别名 | `tools.mjs:2200` routeMap ECS keywords 缺口语化别名「云主机」 | 待提单 |
| 12 | P1 | `D9-9` | D9协议 | tools/call 超时协议语义与取消 | `mcp-protocol.mjs` capabilities 仅 `{tools:{}}` 未声明 cancellation（SPEC-MISMATCH） | 待提单 |
| 13 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190` sanitizeValue 无 AK/SK/token 脱敏（SPEC-MISMATCH） | 待提单 |
| 14 | P0 | `D10-4` | D10评测 | 安全干预-静态规则层 | `cloud-risk-rules.json` 规则数 16→19（9 deny + 10 warn），用例断言计数滞后（SPEC-MISMATCH，测试基线问题） | 待提单 |

### 根因详情

| 用例 | 期望 | 实际 | 根因（文件:行号） |
|---|---|---|---|
| D3-S1 | serviceCatalog 路由命中 ECS | recommendedServices=`["Run hcloud --help…"]`（未命中） | `tools.mjs:2424` tokenizer `split(/[\s,./-]+/)` 不切 CJK，`cn-north-4的ecs` 被切成 token `4的ecs` 而非 `ecs` |
| D3-S5 | 复合意图命中存储+托管多 service | `["Run hcloud --help…"]`（无关键词命中） | `tools.mjs:2200+` routeMap 无「物联网/时序/前端托管」组合关键词 |
| D3-S6 | 函数创建+定时触发器+可调用标识+归零 | create 返回 func_urn 含 `:latest`，DeleteFunction 报 FSS.0400 无法归零 | CreateFunction 返回 `func_urn:…:latest`，删除前需去 `:latest`，当前链路未归一 |
| D3-S7 | 先建库后部署，连接串注入，测后归零 | 仅命中 RDS，未命中部署目标 | `tools.mjs:2424` 复合意图未拆分「Web 部署」目标 |
| D4-2 | `env \| grep -i access_key` 被拦 | 判 `allow`（risk=not_huaweicloud） | `safety-policy.mjs:549-550` env 门 regex 只认 `HW_/HCLOUD/HWC/OS_` 前缀，裸 `access_key` 词根漏网 |
| D4-6 | `--admin_pass` 触发回显警告 | decision=allow, findings=[] | `cloud-risk-rules.json:372` 仅 `--adminPass`（camel），漏 hcloud snake_case `--admin_pass`；`:68` adminpass-exposure 限定 artifact/deploy_plan 阶段 |
| D4-17 | 异常输入默认拒绝（fail-closed） | `???`/`hcloud` 判 allow | `safety-policy.mjs:609` 兜底 `decision:'allow'` |
| D4-21 | broad IAM 制品（HCL `actions=["*"]`、AdministratorFullAccess）被拦 | HCL `actions=["*"]`→allow、AdministratorFullAccess→allow | `cloud-risk-rules.json:196` regex 覆盖 JSON `"Action":"*"` 但未覆盖 HCL `actions = ["*"]` 与 `AdministratorFullAccess` 引用 |
| D4-25 | 只读→cli:read、写→cli:write | `vpc CreateVpc`→cli:invoke（write 误判） | `hooks/huaweicloud-safety.py:46` 写正则前置 `(^\|[A-Za-z0-9])` 需前置字母/数字，「vpc CreateVpc」空格前无匹配 |
| D9-12 | initialize 返回 protocolVersion+capabilities+serverInfo 且前置状态机 | initialize 不触发 runVersionCheck；未 init 即 tools/list 未被拒 | `mcp-protocol.mjs:34-50` dispatch 无 initialize 前置状态机 |
| EXP-E01 | 「云主机」路由到 ECS | MISS（fallback） | `tools.mjs:2200` ECS keywords 无「云主机」口令 |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「Windows（升级检测链 EINVAL 专属）」；本机为 Linux，EINVAL 检测链不适用，Linux 检测链由 D1-40 覆盖（NOT_RUN 为 OS 专属豁免） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱服务维护中 `HDKIT_SANDBOX_MAINTENANCE`（check_user 返回维护公告），解除后补测 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 同上，沙箱服务维护中 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同上，沙箱服务维护中 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**（show_profile_redacted / auth_status / 只读子账号输出均经 redact，未现明文 AK/SK/token）
- [x] 写操作误判 read-only：**未发现**（D4-5 DeleteServer 判 deny，只读 ListVpcs/ListServers 判 allow）
- [x] 红线（I 类）违规：**0**
- [x] 脱敏复核：redactSecrets / 双路径输出无明文（D4-27 PASS）；D2-4 show_profile_redacted 无明文（PASS）；D9-13 tools/call 无 AK/SK 泄露（PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1 生命周期） | 创建 1 台（c6.large.2，含 VPC+子网+系统盘） | DeleteServers(含磁盘) + 轮询消失 | ListServersDetails 无该 ECS + ListVpcs 无该 VPC = true |
| VPC（D3-S2 场景） | 创建 1 个测试 VPC | plan→run_approved DeleteVpc | ListVpcs 不含该 VPC = true |
| OBS 桶（D3-C2/D3-C13） | 各创建 1 个测试桶 + set website | `hcloud OBS rm -f` 删桶 | ListBuckets 无 opencode 桶 = true |
| FunctionGraph（D3-S6） | CreateFunction 创建 1 个 | DeleteFunction 去 `:latest` 后删除 | ListFunctions 无 opencode 函数 = true |
| 只读子账号 test001（D4-13） | 建 KooCLI profile test001 | 测后删除 profile | CreateVpc 被 IAM 拒绝，未创建任何 VPC |
| 诊断临时资产（OBS/FG 探针） | 建/删 | 全部清理 | 复检归零 = true |

> 真云用例均「最低配置创建 → 测后删除归零 → 只删本次创建」；无计费资源残留。修复 runner 早期泄漏的 ECS/VPC/OBS 桶已全部人工归零复核。

---

## 八、遗留与建议

- 14 项缺陷（11 FAIL + 3 SPEC-MISMATCH）经 file_issue.py 历史查重后统一合单；去重后多为历史问题（见 HISTORY_LINKS.md，不重复开单）。
- D3-S3/D3-C3/D3-C6 沙箱用例因 `HDKIT_SANDBOX_MAINTENANCE` 阻塞，解除后应补测沙箱 E2E。
- D10-4 规则库断言计数已滞后（9 deny + 10 warn，共 19 条），建议维护者更新用例断言（测试基线，非产品缺陷）。
- D9-9/D8-9 契约漂移（cancellation / sanitizeValue 脱敏）待评审裁决。
- D3-S6 FunctionGraph `func_urn :latest` 归零缺陷建议在 hcloud-cli.mjs 增加归一化，避免真云 DeleteFunction 失败导致函数残留计费。