# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-14 05:20:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-14-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit **v1.1.8**（npm `latest` 正式版，gitHead `74f519dc`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项；全部经历史查重，见 FINDINGS.md / HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（Ubuntu，aarch64） |
| 被测版本（SUT） | `v1.1.8`（npm `latest`，gitHead `74f519dc`） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| 真云凭证 | `cn-north-4`（AK/SK + 只读子账号 test001 均已就绪） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：① **源码级探针直调**（`hdk/plugins/huaweicloud-core` 固定 gitHead `74f519dc`：`safety-policy.mjs`、`risk-rule-engine.mjs`、`telemetry/telemetry.mjs`、`tools.mjs`、`mcp-protocol.mjs`、`hooks/huaweicloud-safety.py`）——确定性函数调用，覆盖 D1/D2/D4/D8/D9 多数用例；② **MCP server 真机**（stdio + remote JSON-RPC：`initialize`/`tools/list`/`tools/call`）；③ **真云 E2E 实机**（`scripts/realcloud_e2e.mjs` + 专用探针：ECS 全生命周期建删归零、OBS 静态站部署+桶建删归零、沙箱部署/7 隐式工具冒烟、跨区域引导）；④ **只读子账号实测**（`run-as-readonly.py` 临时注入 test001 凭证，验证最小权限 D4-13）；⑤ **评测集 harness**（`eval/harness/run-eval.mjs` 15 条中文意图跑 serviceCatalog 路由）。所有 PASS 用例证据落 `evidence/<case-id>/`（`probe.mjs` + `stdout.txt`）。
>
> **本轮变更**：SUT 由 `v1.1.8-next.2`（gitHead `681895da`）升级为 **`v1.1.8` 正式版（gitHead `74f519dc`）**。上一轮 14 项非 PASS 结论（11 FAIL + 3 SPEC-MISMATCH）在新版本上**逐一复现**，缺陷集合完全稳定（无新增、无修复）。真云 E2E（D3-C1/C2/C3/C6/C7 + D4-14 + D4-13）全部真机执行、建删归零。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146`（4 项 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 12 / 5 / 3 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 141） | `89.4%` |
| P0 / P1 / P2 缺陷 | `4 / 6 / 4` |
| 红线（I 类）违规 | `3`（明文凭证残留：D4-2 / D4-26 / D8-9） |
| 资源释放 | `全部归零`（ECS+VPC+子网 / OBS 桶 / 沙箱会话 建删归零；ECS 0、VPC 空、EIP 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `84` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞，见 §五 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行（OS 专属 / 超范围），见 §五 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | `EXP-E01`（云主机未命中，与 D10-3 同根因） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

> 门禁：`verify_coverage.py` 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 **2.8%** ≤ 15%）；`verify_no_fake_pass.py` 通过（全部 PASS 均有 evidencePath 且证据存在）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:515` 正则只匹配云厂商前缀 | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL broad IAM | `cloud-risk-rules.json:196` regex 不覆盖 HCL `actions=["*"]` | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线缺口 | `mcp-protocol.mjs:32-41/55-57` 无版本检查 + 无时序前置校验 | 待提单 |
| 4 | P0 | `D10-4` | D10评测 | 规则库 16→19 条（SPEC 漂移） | `cloud-risk-rules.json` 新增 3 条 warn，用例计数未同步 | 待提单 |
| 5 | P1 | `D4-6` | D4安全 | hook_check_command 对 `--admin-pass` 不告警 | `cloud-risk-rules.json:68` stages 缺 `command` | 待提单 |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | `risk-rule-engine.mjs:106` 无规则命中默认 `allow` | 待提单 |
| 7 | P1 | `D4-25` | D4安全 | Python hook 写操作遥测误判 cli:invoke | `huaweicloud-safety.py:46` 正则前置捕获组失配 | 待提单 |
| 8 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs:47-49` capabilities 仅 `{tools:{}}` | 待提单 |
| 9 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（云主机未命中，含 EXP-E01） | `tools.mjs:1985-2000` routeMap 缺「云主机」 | 待提单 |
| 10 | P1 | `D3-S7` | D3功能 | Web+RDS 复合意图部署目标未命中 | `tools.mjs:1985` routeMap 无部署目标分解 | 待提单 |
| 11 | P2 | `D4-26` | D4安全 | findings.evidence JSON 带引号 key 明文泄漏 | `risk-rule-engine.mjs:19` redactEvidence 正则不匹配 JSON 形态 | 待提单 |
| 12 | P2 | `D3-S5` | D3功能 | 复合意图分层路由未分解 | `tools.mjs:1985` 无多路分解逻辑 | 待提单 |
| 13 | P2 | `D3-S6` | D3功能 | FunctionGraph 最小场景未生成 URN | CreateFunction 最小参数集未被稳定接受 | 待提单 |
| 14 | P2 | `D8-9` | D8遥测 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | `telemetry.mjs:189` 仅空白/截断处理，无脱敏 | 待提单 |

### 根因详情

1. **D4-2（P0）**：`redactSecrets` / env-dump 第二段正则 `safety-policy.mjs:515` 只匹配云厂商前缀（`HW_`/`HCLOUD` 等），`env | grep -i access_key` 裸 `access_key` 关键字仍 `allow risk=not_huaweicloud`（应 `deny`）。证据 `evidence/D4-2/stdout.txt`。
2. **D4-21（P0）**：`cloud-risk-rules.json:196` `hwc-iam-admin-policy` regex 只覆盖 JSON 形态，HCL `actions = ["*"]` / `AdministratorFullAccess` 托管策略引用返回 `allow`。证据 `evidence/D4-21/stdout.txt`。
3. **D9-12（P0）**：initialize 分支（`mcp-protocol.mjs:32-41`）只调 `hdkitGenerateUserHash` 未调 `runVersionCheck`；`tools/list` 分支（`:55-57`）无 initialize 前置状态机，未 initialize 先 tools/list 未拒 `-32600`。证据 `evidence/D9-12/stdout.txt`。
4. **D10-4（P0/SPEC）**：规则库 16→19 条（deny 9 / warn 10），用例断言「16 条(9+7)」滞后；行为断言全通过，属测试契约漂移。证据 `evidence/D10-4/stdout.txt`。
5. **D4-6（P1）**：`cloud-risk-rules.json:68` `hwc-command-adminpass-exposure` 的 `stages=["artifact","deploy_plan"]` 缺 `command`，故 hook_check_command 不触发 `--admin-pass` 告警。证据 `evidence/D4-6/stdout.txt`。
6. **D4-17（P1）**：`risk-rule-engine.mjs:106` 汇总决策 `hasDeny ? deny : hasWarn ? warn : allow`，模糊/畸形输入无规则命中 → 默认 allow（fail-open）。证据 `evidence/D4-17/stdout.txt`。
7. **D4-25（P1）**：`huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 在 `hcloud vpc CreateVpc` 中永不匹配 → 写操作误判 `cli:invoke`。证据 `evidence/D4-25/stdout.txt`。
8. **D9-9（P1/SPEC）**：`mcp-protocol.mjs:47-49` capabilities 仅 `{tools:{}}`，未声明 `cancellation`。证据 `evidence/D9-9/stdout.txt`。
9. **D10-3（P1）**：`eval/harness` 15 条 HIT=13 MISS=1 N/A=1（92.9%）；唯一 MISS EXP-E01「云主机」未命中 ECS；根因 `tools.mjs:1985-2000` routeMap 缺口语化别名「云主机」。证据 `evidence/D10-3/stdout.txt`。
10. **D3-S7（P1）**：复合意图「带 MySQL 的 Web 应用」仅命中 RDS、部署目标未命中；`tools.mjs:1985` routeMap 无 Web 应用部署目标意图分解。证据 `evidence/D3-S7/stdout.txt`。
11. **D4-26（P2）**：`risk-rule-engine.mjs:19` `redactEvidence` 正则要求键名紧邻 `[:=]`，JSON `"secret_key":"X"` 键名与 `:` 隔 `"` 不匹配 → 明文残留。证据 `evidence/D4-26/stdout.txt`。
12. **D3-S5（P2）**：复合意图「物联网+时序+前端托管」回退 `--help`，未拆分多 service；`tools.mjs:1985` routeMap 单关键词匹配无分解。证据 `evidence/D3-S5/stdout.txt`。
13. **D3-S6（P2）**：FunctionGraph `CreateFunction` 最小参数集报 `Invalid parameter: code.filename`，未生成 URN；触发器连带失败。证据 `evidence/D3-S6/stdout.txt`。
14. **D8-9（P2/SPEC）**：`telemetry.mjs:189` `sanitizeValue` 仅空白/截断处理，未脱敏 AK/SK/token。证据 `evidence/D8-9/stdout.txt`。

### 真云 E2E 用例执行结论

| 用例 | 结论 | 证据（关键断言） |
|---|---|---|
| `D3-C1` ECS 生命周期 E2E | **PASS** | 建 VPC→子网→ECS→删除→`finally归零`（ECS 已归零 / subnet OK / vpc OK）；`evidence/D3-C1/stdout.txt` |
| `D3-C2` OBS 静态站部署 E2E | **PASS** | 建桶→删桶归零（`Delete bucket ... successfully!`）；`evidence/D3-C2/stdout.txt` |
| `D3-C3` 沙箱部署 E2E | **PASS** | `close_session`=ok；`evidence/D3-C3/stdout.txt` |
| `D3-C6` 沙箱 7 隐式工具冒烟 | **PASS** | `check_user`/`connect`/`credentials`/`exec_one_shot`/`close_session` 全部规范返回；`evidence/D3-C6/stdout.txt` |
| `D3-C7` 跨区域引导 | **PASS** | 归零验证 `ListEips` 无本次 id（无残留）；`evidence/D3-C7/stdout.txt` |
| `D4-14` 操作可审计 + VPC 建删归零 | **PASS** | CreateVpc→ListVpcs→CTS→DeleteVpc→归零（containsOwn=false）；`evidence/realcloud-probe/stdout.txt` |
| `D4-13` 只读子账号（test001） | **PASS** | 只读 6/6，`writeDenied=true`，`residualZero=true`；`evidence/D4-13/stdout.txt` |

---

## 五、未执行用例与原因

### BLOCKED（5 项，均已实测确认非假阻塞）

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|
| `D2-10` | 设计级 | P1 | 【补环境】 | R7「current 档跟随」需 KooCLI 多 profile 夹具（current=deploy 切换），单机无预置多 profile 环境 | 预置多 profile 夹具后复测 |
| `D2-13` | 设计级 | P1 | 【补环境】 | R9「configuredBySession 优先 env」需隔离 S1 + HW_ACCESS_KEY env 夹具，直接注入会污染统一账号凭证库 | 提供隔离 env 夹具后复测 |
| `D4-12` | 设计级 | P1 | 【补环境】 | 供应链「安装期安全」需 npm 安装期抓包 / SBOM 审计通道，每日黑盒环境无审计通道 | 接入 SBOM/抓包审计后复测 |
| `D4-24` | 设计级 | P2 | 【补环境】 | 「确认令牌过期/重复确认边界」需审批流 + 可注入时钟，无此夹具 | 提供可注入时钟 + 审批流夹具后复测 |
| `D9-6` | 设计级 | P1 | 【调归属】 | 跨客户端互通需多客户端并存环境（单机仅 Hermes），归属列应改 | 多客户端并存环境或调整归属列 |

### NOT_RUN（4 项）

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | 【调归属】 | Windows 升级检测链专属（OS 列标注「专属」），当前 OS=Linux 不适用；Linux 侧由展开级 `EXP-NR3-10` 代表覆盖（已 PASS） | 无需改用例；OS 专属 P0 豁免 NOT_RUN 符合状态口径 |
| `D8-1` | 设计级 | P2 | 【改用例】 | 文档与能力一致性需白盒 docs 全量比对，超出每日黑盒测试范围 | 迁移至 source-coverage 能力或版本全量测试 |
| `D8-4` | 设计级 | P2 | 【改用例】 | 引导步骤可机械执行需逐条核验 getting-started 步骤，超出每日范围 | 迁移至 source-coverage 能力 |
| `D8-6` | 设计级 | P2 | 【改用例】 | 中英文文档一致需中英双源逐段比对，超出每日范围 | 迁移至 source-coverage 能力 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**3 项明文残留**（I 类红线）——D4-2（generic `access_key` 未拦截）、D4-26（findings.evidence JSON 明文 password/secret_key）、D8-9（telemetry sanitizeValue 未脱敏）。均按 FINDINGS #1/#11/#14 记录根因（文件:行号）并纳入合并提单。
- [x] 写操作误判 read-only：**无**。D4-13 只读子账号 test001 实测：只读 6/6 可用，写 `CreateVpc` 被 IAM 拒（`VPC.0010` policy disallowed）→ 最小权限生效；`writeDenied=true`、`residualZero=true`。
- [x] 红线（I 类）违规：**3 项**，见上（凭证脱敏缺口）。无「未授权真云写操作」「跨目录提交」等其他红线违规。
- [x] 真云写操作审批链：D4-14 实测 `CreateVpc` 经 `plan_cli_command` 分类后 `run_approved_command` 执行 → 写操作审批链生效；D3-C1 ECS 建删均走审批链并归零。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `tctest-hermes-*` + 子网 + ECS（D3-C1 / D4-14） | true | true | `finally归零`：ECS 已归零 / subnet OK / vpc OK；D4-14 归零 containsOwn=false |
| OBS 桶（D3-C2 静态站 / D3-C13 桶管理） | true | true | `Delete bucket ... successfully!` |
| 沙箱会话（D3-C3 / D3-C6） | true | true | `close_session`=ok |
| EIP（D3-C7 跨区只读） | 未创建 | — | `ListEips` 无本次 id（无残留） |

> 只删本次创建资源。真云探测复用统一账号 hw018619646，区域 cn-north-4。本轮无遗留资源（ECS 0、VPC 空、EIP 0）。

---

## 八、遗留与建议

- **P0 优先**：D4-2（凭证 env 打印 generic `access_key` 缺口）、D4-21（HCL broad IAM 绕过）、D9-12（MCP initialize 状态机缺失）直接影响 I 类红线与协议基线，建议优先修复。
- **SPEC 裁决**：D8-9（sanitizeValue 未脱敏）、D9-9（cancellation 未声明）、D10-4（规则库 16→19 计数漂移）为实现与设计契约漂移，建议维护者裁决「改实现」或「改用例契约」。
- **路由覆盖**：D3-S5 / D3-S7 / D10-3 / EXP-E01 同源（`tools.mjs` serviceCatalog 中文关键词覆盖 + 复合意图无分层拆解），建议一并补「云主机」等口语化近义词并评估复合意图分层。
- **FunctionGraph/RDS 最小场景**：D3-S6（CreateFunction 参数集未稳定接受）、D3-S7（RDS 缺 VPC/子网/安全组前置）建议建最小闭环夹具或标注为「版本全量测试」执行。
- **版本稳定性**：SUT 由 `1.1.8-next.2` → `1.1.8`，14 项缺陷集合完全稳定（无回归、无修复）。

---

> 归档：`results/Hermes/2026-10-14-1.94.193.150/Linux/`（测试报告 + 设计级/展开级/追踪表 3 份 CSV + `evidence/<case-id>/` 证据 + FINDINGS.md），已 push 远端 main。