# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-22 05:12:07（北京时间）
> **执行归档**：`results/OpenCode/2026-10-22-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.10`（npm latest，gitHead `b0e9f02`，正式版） |
| 工具全集 | `43`（`tools.mjs` `TOOL_DEFINITIONS`） |
| 真云凭证 | `cn-north-4`（AK/SK 主账号 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39（已按客户端+OS 预筛） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `evidence/<case-id>/stdout.log`；CLI 真机执行记录日志；真云 E2E 建删资源（VPC/ECS/OBS/沙箱）并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.7%` |
| P0 / P1 / P2 新增缺陷（FAIL） | `3 / 5 / 4` |
| P0 / P1 / P2 契约漂移（SPEC-MISMATCH） | `1 / 1 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/OBS/沙箱 均已删并核实不含本次资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `1` | D1-39（Windows 升级检测链专属，Linux 不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（serviceCatalog「云主机」未命中 ECS） |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 所有缺陷均为真实执行后填写；根因定位到文件:行号；全部命中历史 open issue，已查重不重复开单（见 HISTORY_LINKS.md）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖裸 access_key | `env \| grep access_key` 应返回 `deny risk=credential` | 返回 `allow risk=not_huaweicloud` | `src/safety-policy.mjs:546` | 历史复核（已提单） |
| 2 | P1 | `D4-6` | adminPass 回显警告与脱敏不覆盖空格/JSON 形态 | 命令行含 `--admin-pass <value>` 应告警且不回显 | `decision=allow findings=[]`；空格/JSON 形态未脱敏 | `safety/rules/cloud-risk-rules.json:74` | 历史复核（已提单） |
| 3 | P1 | `D4-17` | hook 模糊/畸形输入 fail-open | 模糊/畸形输入应 fail-closed | 空串/`&& rm -rf`/`$(curl)` 均判 `ok` | `src/risk-rule-engine.mjs:103` | 历史复核（已提单） |
| 4 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL 宽 IAM 制品 | HCL `actions=["*"]` 应 deny | 返回 `decision=allow findings=[]` | `safety/rules/cloud-risk-rules.json:196-218` | 历史复核（已提单） |
| 5 | P2 | `D4-25` | Python hook 写操作遥测误分类 cli:invoke | 写操作事件 key 应为 `cli:write` | 变为 `cli:invoke` | `hooks/huaweicloud-safety.py:46` | 历史复核（已提单） |
| 6 | P2 | `D4-26` | findings.evidence 脱敏未覆盖 JSON 带引号 key | 所有 AK/SK/adminPass 无明文残留 | `secret_key`/`adminPass` 明文残留 | `src/risk-rule-engine.mjs:22-23` | 历史复核（已提单） |
| 7 | P1 | `D3-S3` | 沙箱预览 URL 未返回（deploy_nginx 写验证假阴性） | deploy_nginx 应返回 ok:true 与可访问 URL | `ok:false url=`，但 deploy_check 实测 HTTP 200 | `src/sandbox/session-manager.mjs:814-820` | 历史复核（已提单） |
| 8 | P2 | `D3-S5` | 复合意图分层路由未分解 | 复合意图应拆分命中多个 service | 仅返回兜底 skills、多路=false | `src/tools.mjs:2023-2277` | 历史复核（已提单） |
| 9 | P2 | `D3-S6` | FunctionGraph 定时任务最小参数创建失败 | CreateFunction 最小参数集应成功返回 URN | `[USE_ERROR]Invalid parameter: code.filename` | `src/tools.mjs:1854` | 历史复核（已提单） |
| 10 | P1 | `D3-S7` | 跨服务交付复合意图与 RDS 最小实例创建失败 | 复合意图应命中 RDS+部署；RDS 最小实例应成功 | 仅命中 RDS；`[USE_ERROR]db.password` | `src/tools.mjs:1859` | 历史复核（已提单） |
| 11 | P0 | `D9-12` | initialize 握手协议安全基线两处缺口 | initialize 应执行版本检查；非法时序 tools/list 应拒 -32600 | runVersionCheck 未调用；未 initialize 即 tools/list 未拒 | `src/mcp-protocol.mjs:32-59` | 历史复核（已提单） |
| 12 | P1 | `EXP-E01` | serviceCatalog 中文意图「云主机」未命中 ECS | 「云主机」应命中 ECS(run_readonly) | 返回 `Run hcloud --help`（MISS） | `src/tools.mjs:2033-2037` | 历史复核（已提单） |
| 13 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK/token（契约漂移） | sanitizeValue 应移除/脱敏敏感值 | 原样返回 AK/SK/token | `src/telemetry/telemetry.mjs:189-197` | SPEC（历史复核） |
| 14 | P1 | `D9-9` | capabilities 未声明 cancellation（契约漂移） | 协议契约应声明 cancellation | `capabilities:{"tools":{}}` | `src/mcp-protocol.mjs:47-49` | SPEC（历史复核） |
| 15 | P0 | `D10-4` | 安全规则库计数契约漂移（16→19 条） | 用例断言与规则库条数一致 | 规则库 19 条(9 deny+10 warn) | `safety/rules/cloud-risk-rules.json` | SPEC（历史复核） |

### 根因详情（P0/P1 缺陷附代码片段）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截未覆盖裸 access_key**
- 期望：`env | grep access_key` → `deny risk=credential`
- 实际：`decision=allow risk=not_huaweicloud`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:546`
  env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 仅匹配云厂商前缀，未覆盖裸 `access_key`/`secret_key` 变量名。
- 证据：`evidence/D4-2/stdout.log`（classify.log D4-2 节）
```

```markdown
**#4 [P0] D4-21 hook_check_artifacts 未拦截 HCL 宽 IAM 制品**
- 期望：HCL `actions=["*"]` 与 `AdministratorFullAccess` 托管策略引用 → `deny`
- 实际：`decision=allow findings=[]`（对照 JSON broad IAM 正确 deny）
- 根因：`safety/rules/cloud-risk-rules.json:196-218`
  hwc-iam-admin-policy 仅匹配 JSON `"Action":"*"` 形态，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess`。
- 证据：`evidence/D4-21/stdout.log`（hook.log + hcl-probe.log）
```

```markdown
**#11 [P0] D9-12 initialize 握手协议安全基线两处缺口**
- 期望：initialize 调用 runVersionCheck；非法时序 tools/list 被拒 -32600
- 实际：`runVersionCheck in init=false`；tools/list(未 initialize) 返回 43 工具未拒
- 根因：`src/mcp-protocol.mjs:32-59` initialize 仅做 hash/telemetry 不接 runVersionCheck；dispatch 无 initialize 前置状态机
- 证据：`evidence/D9-12/stdout.log`（d9-12.log）
```

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），Linux/macOS 由 NR3 终端矩阵按负面/环境验证覆盖 | 本用例 OS 归属应为 Windows 专属，Linux 侧无需执行；无需改用例 |

> 无其它未执行为 NOT_RUN / BLOCKED 用例（真云用例均已真机执行，无环境阻塞项）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云探针全程 redact，无 AK/SK 明文落盘）
- [x] 写操作误判 read-only：`0`（D4-5/realcloud 实测写操作均 correct deny/确认流）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证 / 未脱敏日志（`grep -Rl 'HW_SECRET\|SK=\|AKIA' evidence/` 无命中）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 realcloud） | 是（tctest-opencode-*） | 已删 | ListVpcs 不含本次资源 |
| ECS（D3-C1） | 是（c6.large.2 最小规格） | 已删（含磁盘 delete_volume=true） | 归零验证不含本次服务器 |
| VPC+子网（D3-C1 配套） | 是 | 已删 | 清理 VPC+子网 cleanOk=true |
| OBS 桶（D3-C2） | 是（tctest-opencode-obs-*） | 探测后删除 | 静态站已验证 HTTP 200 后清理 |
| 沙箱（D3-C3/D3-C6） | 是（会话级） | close_session | 会话关闭，无残留 |
| 只读子账号 profile（D4-13） | 是（test001 profile） | 恢复 default | 未创建任何 VPC |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留 = 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D8-9`（sanitizeValue 脱敏契约）、`D9-9`（capabilities.cancellation）、`D10-4`（安全规则库计数 16→19）。
- 历史问题：全部 15 项缺陷命中上游 open issue，本次为复核，未重复开单（见 HISTORY_LINKS.md）。
- 本轮范围：真云 E2E（ECS/OBS/沙箱/只读子账号）已全部真机执行；多终端矩阵由展开级 EXP-D5 客户端矩阵代表。
- 建议：D4-6 真云 E2E「创建 ECS 含 adminPass 回显警告」需真云写场景，本次以源码级探针覆盖 flag/JSON 形态缺口（FINDINGS #2），非源级断言缺口保留。