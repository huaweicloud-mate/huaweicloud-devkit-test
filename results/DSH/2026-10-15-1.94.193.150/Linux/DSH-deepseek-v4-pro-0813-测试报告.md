# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-15 05:35（北京时间）
> **执行归档**：`results/DSH/2026-10-15-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 12 项缺陷：5 P0 / 4 P1 / 3 P2）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4 LTS） |
| Node / npm / Python | Node v22.23.2 / npm 11.x / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921`，PR #914） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS，含新增 `huaweicloud_sandbox_expose_tunnel`） |
| hcloud / 依赖 | hcloud 已安装（prepare_env 自检通过） |
| 真云凭证 | `cn-north-4`（AKSK 已用；只读子账号 test001 用于 D4-13） |
| 测试类型 | 源码级探针直调 / 真机 CLI / MCP 协议 / 真云 E2E / D10 评测 harness |
| daily 用例 | 设计级 107 / 展开级 39（并摄入 mission-001 使命 9 条 = D4 安全集合） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 MCP 工具路由，结果落 `stdout.log`；真云建删资源走 hcloud 真机执行并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146` |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `91.5%`（130/142） |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 3`（共 12） |
| 红线（I 类）违规 | `6`（D2-4、D4-3、D4-16、D4-17、D4-21、D8-9） |
| 资源释放 | `全部归零`（本机 DSH 未残留任何云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 |
|---|---|
| PASS | `92` |
| FAIL | `10` |
| BLOCKED | `3`（D3-C1 VPC 配额 / D3-C7 跨区域 / D3-S3 沙箱配额） |
| SPEC-MISMATCH | `1`（D1-68 region 优先级） |
| NOT_RUN | `1`（D1-39 Windows 专属，P0 唯一 OS 专属豁免） |
| **合计** | **`107`** |

### 3.2 展开级

| 状态 | 数量 |
|---|---|
| PASS | `38` |
| FAIL | `1`（EXP-E01 查云主机路由 MISS） |
| BLOCKED | `0` |
| SPEC-MISMATCH | `0` |
| NOT_RUN | `0` |
| **合计** | **`39`** |

---

## 四、缺陷清单（12 项）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | `ak=/sk=` 小写也应脱敏 | `ak=AK123456 sk=SKsecret` 明文残留 | `safety-policy.mjs:42,45` |
| 2 | P0 | D4-3 | 明文 secret API 缺 kms DecryptData | `hcloud kms DecryptData` → deny | `allow` | `cloud-risk-rules.json` (hwc-command-secret-value-read) |
| 3 | P0 | D4-16 | 命令包裹穿透 | `sh -c "env \| grep HW_*"` → deny | `allow` | `cloud-risk-rules.json` (hwc-command-env-dump) + `risk-rule-engine.mjs:79-113` |
| 4 | P0 | D4-21 | HCL/Terraform 宽权限 IAM 未拦截 | HCL `actions=["*"]` → deny | `allow`（JSON 形态正常 deny） | `cloud-risk-rules.json` (hwc-iam-admin-policy) |
| 5 | P0 | D9-12 | 未 initialize 先 tools/list 未拒绝 | → -32600 | 返回 42 工具 | `mcp-protocol.mjs:57-59` |
| 6 | P1 | D4-17 | 命令替换 fail-open | `$(curl\|sh)` → deny/warn | `allow` | `cloud-risk-rules.json`（缺 curl\|sh、$() 规则） |
| 7 | P1 | D2-10 | KooCLI 缺失配置错误中英混排 | 精确 `KooCLI config not found` | 中文前缀+括号英文混合 | `auth/reconcile.mjs:50` + `auth/guidance.mjs:71` |
| 8 | P1 | D3-S7 | 复合意图 Web+RDS 漏部署目标 | 同时命中 RDS+部署目标 | 仅 `RDS` | `tools.mjs:1984,2223-2239` |
| 9 | P1 | EXP-E01 | 查云主机意图路由 MISS | 命中 `ECS` | 返回 `Run hcloud --help...` | `tools.mjs:1984,2239` |
| 10 | P2 | D1-68 | region 优先级契约漂移 | HUAWEICLOUD_REGION 优先 | HW_REGION 覆盖 | `auth/credentials.mjs:225` |
| 11 | P2 | D3-C14 | 沙箱无凭证错误中英不一致 | 精确 `credentials not configured` | 中文消息 | `auth/guidance.mjs:55` + `auth/credentials.mjs:286` |
| 12 | P2 | D8-9 | 遥测 sanitizeValue 未脱敏 | 隐去 AK/secret_key/token | 明文残留 | `telemetry/telemetry.mjs:189` |

> 根因详情（代码片段 + 复现证据）已并入 `FINDINGS.md`（统一提单脚本解析输入，格式严格满足 file_issue.py）。

---

## 五、未执行用例与原因（BLOCKED / NOT_RUN）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-C1 | 设计级 | P1 | BLOCKED | 补环境 | `VPC.0114 Quota exceeded for resources: ['router']`——共享账号 hw018619646 的 router/VPC 配额被其它 agent 泄漏的 4 个 VPC 耗尽（tctest-diag2/3、testbot1/3-hermes-e2e-*），本机 DSH 真机执行到 CreateVpc 即被配额拒绝；解除条件：清理其它 agent 泄漏 VPC/router 提升配额 |
| D3-C7 | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）：ECS 只读返回 Common.0013，EIP 创建返回 VPC.0501；已实测通过 list_regions 含该区域 + plan 含 --cli-region；解除条件：开通 ap-southeast-3 项目权限 |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）；解除条件：沙箱配额就绪且隧道可用 |
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（OS 列已标注「专属」），本机 Linux 不适用；P0 唯一 OS 专属豁免，Linux 侧由展开级 EXP-NR3 代表覆盖，无需改用例 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（本次运行自身未泄漏凭证；发现 6 项产品侧安全缺口，见缺陷清单）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：发现 `6` 项（D2-4 / D4-3 / D4-16 / D4-17 / D4-21 / D8-9），均记根因并入缺陷单
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针输出均已脱敏，D4-26 复核通过）
- [x] PASS 门禁：`verify_no_fake_pass.py` 通过（130 PASS 均有 evidencePath + 非空输出）
- [x] 覆盖率门禁：`verify_coverage.py` 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2/D3-C13） | 是 | 已删 | 归零（无 testbot2-dsh 桶残留） |
| VPC（D3-S2） | 是 | 已删 | 归零 |
| 沙箱会话（D3-C3/D3-C6/D3-S3） | 是 | 已 close | 归零 |
| ECS/VPC（D3-C1） | 否（CreateVpc 被配额拒绝） | — | 无创建即无残留 |
| 账号盘点 | 全量盘点 VPC/OBS/EIP/ECS，本机 DSH 均无残留，未删他人资源 | — | 残留 0 |

---

## 八、遗留与建议

- 待裁决 SPEC：D1-68 region 优先级契约漂移（实现 HW_REGION 优先，用例期望 HUAWEICLOUD_REGION 优先），需维护者裁决实现或改写用例。
- 本轮未覆盖：D3-C1 ECS 生命周期完成段（被共享账号 VPC quota 阻塞）、D3-C7 跨区域建删（ap-southeast-3 无项目权限）、D3-S3 沙箱预览出 URL（DevStation 配额）。
- 建议：① 统一 `risk-rule-engine.mjs`（JSON 目录）与 `safety-policy.mjs`（命令式）两套安全引擎的覆盖语义，补 `kms DecryptData`、shell-wrapper 解包、`curl|sh`/`$()` 命令替换、HCL `actions=[*]` 四类规则；② 修正 `ak=/sk=` 小写脱敏与 telemetry `sanitizeValue` 脱敏；③ 处理共享账号 VPC/router 配额泄漏（tctest-diag*、hermes-e2e-*）。