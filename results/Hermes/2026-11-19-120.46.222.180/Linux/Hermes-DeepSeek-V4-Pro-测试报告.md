# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-19 05:20:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-19-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux aarch64`（Ubuntu 6.8.0-106） |
| Node / npm | `Node v22.23.5 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14`（npm latest，gitHead `bd985051`，PR #1139） |
| 工具全集 | 40 MCP 工具（`huaweicloud_*`）+ CLI（install/doctor/status/update/…） |
| hcloud / 依赖 | KooCLI 7.2.12（plugin 配对 7.3.12，D2-27 记录） |
| 真云凭证 | `cn-north-4`（管理员 AKSK 已就绪；只读子账号 test001 已就绪） |
| 测试类型 | 源码级探针直调 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 43（预筛前 66） |

> **执行方法**：探针脚本（.mjs）`file://` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，真实运行结果落 `stdout.log`；CLI 真机执行（install/status/doctor）+ `d1-probe.sh` 隔离 HOME；真云 E2E（ECS/OBS/沙箱/EIP 建删 + CTS 审计）经 `hcloud`/MCP 真机执行并归零验证；D10 路由经 `eval/harness/run-eval.mjs` 跑 15 条意图。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（NOT_RUN 1 条 = D1-39 Windows 专属，Linux 侧由 EXP-NR3-10 覆盖） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 17 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 146） | `88.4%` |
| P0 / P1 / P2 新增缺陷（FAIL） | `4 / 10 / 3`（另有 3 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS=0 / VPC 无本次残留 / EIP=0 / OBS 桶已删）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `1` | Windows 专属（D1-39） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期（EXP-C4-14/18、EXP-E01） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏（小写/JSON 形态漏脱敏） | `redactSecrets` 对小写 `ak=/sk=`、JSON `{"ak":...}` 均返 `<redacted>` | 小写与 JSON 带引号 key 明文返回 | `safety-policy.mjs` redactString (AK\|SK) 正则大小写敏感 + isSecretKeyName 不匹配裸 ak/sk | 待提单 |
| 2 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `env \| grep -i access_key` 应 deny | 判 allow(risk=not_huaweicloud) | `safety-policy.mjs` env-dump 正则未覆盖 access_key/HW_ACCESS_KEY | 待提单 |
| 3 | P0 | `D4-21` | 制品预检漏拦宽泛 IAM 授权 | HCL `actions=["*"]`/AdministratorFullAccess 应 deny | 判 allow | `cloud-risk-rules.json` hwc-iam-admin-policy 仅匹配 JSON Action:* | 待提单 |
| 4 | P0 | `D9-12` | initialize 握手协议安全基线 | 非法时序 tools/list 应 -32600；版本检查应接 | 未拒(returned tools=true) | `mcp-protocol.mjs` dispatch 无 initialize 前置状态机 | 待提单 |
| 5 | P1 | `D3-C4` | DMS/DEW 两服务无规范路由 | 22 服务 list_operations+plan 全通过 | DMS/DEW 无 command/result | `tools.mjs` list_operations 对 DMS/DEW 未返回 command/result | 待提单 |
| 6 | P1 | `D4-4` | 写操作审批门漏拦截 Change* | ChangeServerOs*/ChangeVpc 等应 deny(write) | 判 allow(risk=unknown_read) | `safety/policy.json:27` writeOperationPrefixes 缺 Change 前缀 | 待提单 |
| 7 | P1 | `D4-6` | adminPass 回显警告缺失 | 含 --admin_pass 写命令应 warn | findings=[] allow | `cloud-risk-rules.json` hwc-command-adminpass-exposure stages 缺 command | 待提单 |
| 8 | P1 | `D4-17` | hook 模糊输入 fail-open | 无规则命中应 fail-closed(deny) | 默认 decision=allow | `risk-rule-engine.mjs` 无命中默认 allow | 待提单 |
| 9 | P1 | `D4-25` | Python hook 写命令遥测分类 | CreateVpc 应 cli:write | 分类为 cli:invoke | `huaweicloud-safety.py` WRITE_OPERATION_RE 前置捕获组 | 待提单 |
| 10 | P2 | `D4-26` | findings 证据脱敏不完整 | JSON 带引号 key secret_key/adminPass 应脱敏 | 明文残留 | `risk-rule-engine.mjs` redactEvidence 正则不匹配 JSON key | 待提单 |
| 11 | P2 | `D3-S5` | 复合意图分层路由未拆分 | 存储+托管应多路命中 | 多路命中=false | `tools.mjs` serviceCatalog 单意图匹配 | 待提单 |
| 12 | P2 | `D3-S6` | FunctionGraph 最小参数集缺 code | CreateFunction 应返回 URN+绑触发器 | USE_ERROR code.filename | `tools.mjs` FunctionGraph 最小参数集缺 code | 待提单 |
| 13 | P1 | `D3-S7` | 跨服务交付 RDS+部署目标 | RDS 创建应带 db.password + 部署目标命中 | USE_ERROR db.password / 部署目标命中=false | `tools.mjs` RDS 缺 db.password + routeMap 无 Web 部署目标 | 待提单 |
| 14 | P1 | `D10-3` | 路由准确率 92.9% | 15 条意图 100% 命中 | HIT=13 MISS=1 N/A=1（云主机 MISS） | `tools.mjs` routeMap 缺「云主机」同义词 | 待提单 |
| 15 | P1 | `EXP-C4-14` | DMS 只读规划冒烟失败 | list_operations+plan 通过 | 无 command/result | `tools.mjs` list_operations(DMS) 无 command/result | 待提单 |
| 16 | P1 | `EXP-C4-18` | DEW 只读规划冒烟失败 | list_operations+plan 通过 | 无 command/result | `tools.mjs` list_operations(DEW) 无 command/result | 待提单 |
| 17 | P1 | `EXP-E01` | ECS 路由缺「云主机」别名 | 云主机意图应路由 ECS | MISS | `tools.mjs` routeMap ECS 缺云主机 | 待提单 |

> 另有 2 项 SPEC-MISMATCH（D8-9 telemetry sanitizeValue 缺 AK/SK/token 脱敏、D9-9 initialize capabilities 未声明 cancellation）+ 1 项改用例（D10-4 断言计数滞后 16→19 条），详见 `FINDINGS.md`（D10-4 标【非产品缺陷】，不重复提单）。

### 根因详情（关键 P0 缺陷代码定位）

**#1 [P0] D2-4 小写 ak/sk 漏脱敏** — `plugins/huaweicloud-core/src/safety-policy.mjs`：`redactString` 第三个 `.replace` 的 `(AK|SK)` 正则大小写敏感（无 `/i`），`isSecretKeyName` 仅匹配 `access_key/secret_key/token/password` 等长键名，不匹配裸 `ak`/`sk`；实测 `redactSecrets('ak=AK123456 sk=SKsecret')` 原样返回。

**#4 [P0] D9-12 initialize 时序** — `plugins/huaweicloud-core/src/mcp-protocol.mjs`：`dispatch` 无 initialize 前置状态机，`tools/list`（未 initialize）未拒绝且返回 tools。

**#6 [P1] D4-4 Change* 漏拦截** — `safety/policy.json:27` `writeOperationPrefixes` 仅含 Create/Delete/Update 等，缺 `Change`/`Modify` 前缀，`hcloud ecs ChangeServerOsWithoutCloudInit` 判 `allow(risk=unknown_read)`。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（升级检测链 EINVAL 专属，OS 列标注「专属」），Linux 侧由展开级 `EXP-NR3-10` 覆盖 | 无需改（OS 归属正确，仅 Windows 执行） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针使用伪造 AK/SK，证据目录无真实凭证；D4-13 探针 redact 处理只读子账号）
- [x] 写操作误判 read-only：`0`（执行侧未误判；D4-4 Change* 被产品误判为 unknown_read 已记缺陷 #6）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：通过（evidence 无原始 AK/SK；realcloud-probe 与 D4-13 均 redact 输出）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是 | 已删（含磁盘） | `ListServersDetails` 无 tctest-hermes 残留 ✓ |
| VPC（D4-14 / D3-C1） | 是 | 已删 | `ListVpcs` 无 tctest-hermes 残留 ✓ |
| 子网/路由表（D3-C1） | 是 | 已删 | cleanOk=true，与 VPC 一并清理 ✓ |
| EIP（D3-C7） | 是 | 已释放 | `ListPublicips` total_count=0 ✓ |
| OBS 桶（D3-C2） | 是 | 已删 | `rm -r -f` 清对象 + `rm -f` 删桶 ✓ |
| 沙箱（D3-C3/C6） | 是 | 释放 | deploy_check 完成后关闭会话 ✓ |

> 真云只删本次创建资源；删除前盘点全量，未触碰 `testbot2-opencode-vpc`、`testbot3-hermes-e2e` 等他人既有资源。残留 0 项。

---

## 八、遗留与建议

- 待裁决 SPEC：`D8-9`（telemetry sanitizeValue 敏感值契约）、`D9-9`（capabilities 未声明 cancellation）、`D10-4`（规则库 16→19 条，用例断言需同步）。
- 本轮恢复项：`D1-70` 代理功能在 1.1.14 恢复 PASS（11-14 的 undici 导入崩溃已随新版本/Node v22.23.5 解除）。
- 真云 E2E 全量 PASS（D3-C1/C2/C3/C6/C7 建删归零、D4-14 CTS 审计、D4-13 只读子账号 readPassRate=100%），无 BLOCKED。
- 建议：① 补 `Change`/`Modify` 进 `writeOperationPrefixes`（D4-4 P0 级安全缺口）；② `redactSecrets`/`redactEvidence` 键名正则加 `/i` 并覆盖裸 `ak`/`sk`（D2-4/D4-26）；③ routeMap 补「云主机」等口语化别名（D10-3/EXP-E01）。