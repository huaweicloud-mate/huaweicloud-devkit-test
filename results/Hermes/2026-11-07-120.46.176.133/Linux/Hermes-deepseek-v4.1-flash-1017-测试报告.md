# Hermes-deepseek-v4.1-flash-1017 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-07 05:20:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-07-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项；沙箱 3 项外部阻塞）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux aarch64`（Ubuntu, kernel 6.8.0-106） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14-next.0`（npm `next`，gitHead `ac955889`，源码仓 hdk checkout ac955889） |
| 工具全集 | `47`（tools/list 实测；较 v1.1.13 的 46 新增 `huaweicloud_install_hcloud`） |
| hcloud / 依赖 | `hcloud 7.2.12`（check_cli：`version_mismatch`，插件配对 7.3.12） |
| 真云凭证 | `cn-north-4`（AKSK，管理员凭证 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 107 / 展开级 43（daily 精选，展开级已按 Hermes+Linux 预筛） |
| daily 基础用例 | 设计级 107 + 展开级 43 = **150** |

> **执行方法**：`run_all.sh` 驱动 38 组探针（classify / hook / auth / protocol / extended / d8 / supplement / d1 隔离 HOME / updatecheck / routing / eval-harness / new-env / new-config / new-safety / new-mcp / new-cli / new-scenario / new-cloud / new-fg-rds / doc 等）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 MCP stdio/remote 服务；`run_realcloud.sh` 串行执行真云 E2E（D3-C1/C2/C3/C6/C7 建删资源、D4-13 只读子账号、D4-14/18/19/20 审批链、D4-23/24 规则与令牌、D1-70 代理）；证据按用例落 `evidence/<case-id>/{probe.mjs,stdout.txt,stdout.log}`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（唯一 NOT_RUN = D1-39 Windows 专属） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 18 / 3 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 146） | `85.6%` |
| 缺陷分布（P0 / P1 / P2） | `4 / 10 / 4`（均为历史在案缺陷在本版本实测复现） |
| 红线（I 类）违规 | `0`（无伪造证据、无 mock、无越权提交） |
| 资源释放 | `本机创建资源全部归零`（ECS/VPC/SUBNET/EIP/EVS/OBS 扫描；详见 §七） |

> **与昨日（v1.1.13）差异**：工具数 46→47（新增 `install_hcloud`）；沙箱三用例（D3-C3/C6/S3）由 PASS 转为 **BLOCKED**——沙箱服务端返回 `HDKIT_NOT_AGREEMENT`（用户未签署最新版协议，需账号本人确认），属账号侧外部依赖，非产品缺陷。其余 21 项缺陷根因路径未变，逐条实测复现。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `85` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 沙箱 HDKIT_NOT_AGREEMENT（账号协议未签，外部依赖） |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9 / D9-9 / D10-4） |
| NOT_RUN | `1` | D1-39 为 Windows 专属用例（Linux 侧由 EXP-NR3-10 覆盖） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14 / EXP-C4-18 / EXP-E01 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

### 3.3 门禁结果

- `verify_coverage.py`：设计级 106 条（OS 专属豁免 1）NOT_RUN=0 空=0 BLOCKED=3（无原因 0），**通过**。
- `verify_no_fake_pass.py`：所有 PASS 用例均有 evidencePath 且证据存在（非空输出 + 真实探针），**通过**。

---

## 四、缺陷清单

> 全部 21 项均本轮**真机实测复现**（非复读历史结论）；完整「现象/断言/根因/影响」见同目录 `FINDINGS.md`，证据见 `evidence/<case-id>/`。

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=/sk=、JSON 引号 key 未脱敏） | `src/safety-policy.mjs:45`（`(AK|SK)` 正则无 /i）、`:20`（isSecretKeyName 不匹配裸 ak/sk） | 待提单 |
| 2 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截（裸 access_key 漏拦） | `src/safety-policy.mjs` env-dump 正则未覆盖小写裸 key | 待提单 |
| 3 | P0 | `D4-21` | D4安全 | hook_check_artifacts HCL/托管策略漏拦截 | `safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 仅匹配 JSON `Action:*` | 待提单 |
| 4 | P0 | `D9-12` | D9协议 | initialize 握手安全基线（非法时序未拒 + 无版本检查） | `src/mcp-protocol.mjs` dispatch 无 initialize 前置状态机；initialize 未接 runVersionCheck | 待提单 |
| 5 | P1 | `D1-70` | D1安装 | 代理配置与 WebSocket 代理（undici 导入崩溃） | `undici/lib/interceptor/decompress.js:78`（Node22.13 aarch64 无 zstd 绑定）；`src/proxy/proxy-agent.mjs` 无内联回退 | 待提单 |
| 6 | P1 | `D3-C4` | D3功能 | 服务矩阵 DMS/DEW 无规范路由 | `src/tools.mjs` `list_operations` 对 DMS/DEW 未返回 command/result | 待提单 |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务交付 Web+RDS（db.password 缺参 + 部署目标未分解） | `src/tools.mjs` RDS CreateInstance 最小参数集缺 db.password；routeMap 无部署目标分解 | 待提单 |
| 8 | P1 | `D4-4` | D4安全 | 写操作审批门 Change* 漏拦截（0/8） | `safety/policy.json:27` `writeOperationPrefixes` 缺 Change 前缀 | 待提单 |
| 9 | P1 | `D4-6` | D4安全 | adminPass 回显警告（command 阶段未覆盖） | `safety/rules/cloud-risk-rules.json` `hwc-command-adminpass-exposure` stages 缺 command | 待提单 |
| 10 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | `src/risk-rule-engine.mjs` 无命中默认 allow | 待提单 |
| 11 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（1 条 MISS） | `src/tools.mjs` routeMap 缺「云主机」同义词 | 待提单 |
| 12 | P1 | `EXP-E01` | D10评测 | 「云主机」意图路由 MISS | 同上 | 待提单 |
| 13 | P1 | `EXP-C4-14` | D3功能 | DMS list_operations 无路由 | `src/tools.mjs` `list_operations(DMS)` | 待提单 |
| 14 | P1 | `EXP-C4-18` | D3功能 | DEW list_operations 无路由 | `src/tools.mjs` `list_operations(DEW)` | 待提单 |
| 15 | P2 | `D3-S5` | D3功能 | 复合意图分层路由（存储+托管未拆分） | `src/tools.mjs` serviceCatalog 单意图匹配 | 待提单 |
| 16 | P2 | `D3-S6` | D3功能 | FunctionGraph 最小参数集不完整（function_name/code） | `src/tools.mjs` CreateFunction 参数集 | 待提单 |
| 17 | P2 | `D4-25` | D4安全 | Python hook 遥测分类（写→cli:invoke） | `hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置捕获组 | 待提单 |
| 18 | P2 | `D4-26` | D4安全 | findings.evidence 明文残留 | `src/risk-rule-engine.mjs` redactEvidence 正则 | 待提单 |
| 19 | P0 | `D10-4` | D10评测 | **SPEC** 规则库计数契约滞后（16→19 条） | `safety/rules/cloud-risk-rules.json` + 用例断言未同步 | 待裁决 |
| 20 | P1 | `D9-9` | D9协议 | **SPEC** capabilities 未声明 cancellation | `src/mcp-protocol.mjs` initialize capabilities | 待裁决 |
| 21 | P2 | `D8-9` | D8文档/遥测 | **SPEC** sanitizeValue 未脱敏 AK/SK/token | `src/telemetry/telemetry.mjs` sanitizeValue | 待裁决 |

### 根因详情（P0 四项实测摘要）

1. **D2-4（P0）**：`redactSecrets('ak=AK123456 sk=SKsecret')` → 原样返回；`redactSecrets('{"ak":"AK123456","sk":"SKsecret"}')` → 原样返回；大写 `AK=` 与对象键 `accessKeyId` 正常脱敏。证据 `evidence/D2-4/stdout.txt`。
2. **D4-2（P0）**：`env | grep access_key` → `decision=allow risk=not_huaweicloud`；`env | grep HW_ACCESS_KEY` → `deny`。证据 `evidence/D4-2/stdout.txt`。
3. **D4-21（P0）**：JSON `Action:*` → deny；HCL `actions = ["*"]` → allow；`AdministratorFullAccess` 托管策略引用 → allow。证据 `evidence/D4-21/stdout.txt`（含 hcl-probe 段）。
4. **D9-12（P0）**：未 initialize 直接 `tools/list` → 返回 47 工具未拒绝 `-32600`；`runVersionCheck` 未在 initialize 调用。7 项断言 5 过 2 失。证据 `evidence/D9-12/stdout.txt`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 优先级 | 标题 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | D1安装 | P0 | Windows 升级检测链可用性 | 【不适用本 OS】 | 该用例 OS 列标注「专属（Windows）」，本机为 Linux aarch64，无 .cmd/EINVAL 语义；Linux 侧升级检测链由展开级 `EXP-NR3-10`（distTags 查询无 EINVAL，3/3 PASS）代表覆盖 | 无需改用例；OS 专属豁免已由 verify_coverage 机械识别 |

### BLOCKED

| 用例ID | 维度 | 优先级 | 标题 | 分类 | 详细原因 | 解除条件 |
|---|---|---|---|---|---|---|
| `D3-C3` | D3功能 | P1 | 沙箱部署E2E | 【补环境】账号侧 | 实测 05:04 `connect -> HDKIT_NOT_AGREEMENT: 用户未签署最新版协议，签署需由用户本人确认后完成`（trace 5c1f0d5db…）；upload/deploy/close 因无 workspace 全拒（0/5） | 账号本人在 DevStation 签署最新版协议后重跑 |
| `D3-C6` | D3功能 | P1 | 沙箱 7 隐式工具具名冒烟 | 【补环境】账号侧 | 实测 05:04 `check_user/connect -> HDKIT_NOT_AGREEMENT`（trace 8a15dac4/763d715c）；`sign_agreement` 返回 `HDKIT_INTERNAL`（0/8） | 同上 |
| `D3-S3` | D3功能 | P1 | 场景-沙箱预览出URL | 【补环境】账号侧 | 实测 05:04 `check_user -> HDKIT_NOT_AGREEMENT`，无 workspace 无法预览（探针已自判 BLOCKED） | 同上 |

> 三项 BLOCKED 的探针**均已真实执行**（非空跑），仅因账号协议未签导致沙箱侧调用被全部拒绝；依 AGENTS.md 第 4 条标 BLOCKED 并写明 blockedReason，不标 FAIL、不假 PASS。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 缺陷为产品侧脱敏失效，已提单；探针输出中 AK/SK 均由测试侧 `***` 遮蔽，无真实凭证明文入库）
- [x] 写操作误判 read-only：`0`（D4-5 实测 Delete/BatchDelete 判 deny risk=write；Change* 漏拦截已作为 D4-4 缺陷单列）
- [x] 红线（I 类）违规：`0`（无 mock、无伪造 PASS、无越权提交；只提交 `results/Hermes/`）
- [x] 脱敏复核：`D4-27` 双路径脱敏 5/5 PASS；`D9-13` tools/call 无 AK/SK 明文 8/8 PASS
- [x] 真云资源：最低配置创建、测后删除、只删本次创建（详见 §七）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | `tctest-hermes-ecs-<stamp>`（c6.large.2，cn-north-4a） | DeleteServers 含系统盘 | ✔ 轮询 ListServersDetails 不含本次资源（8/8 PASS） |
| VPC/子网（D3-C1、D4-14、D3-S2） | `tctest-hermes-ecs-*` / `tctest-hermes-2026…` / `tctest-hermes-s2-*` | DeleteSubnet + DeleteVpc | ✔ ListVpcs 不含本次资源 |
| OBS 桶（D3-C2、D3-C13） | `tctest-hermes-obs-*` | 清对象 + 删桶 | ✔ obs ls 无桶（7/7 PASS） |
| EIP（D3-C7） | 跨区域 EIP 建删 | DeletePublicip | ✔ 归零（7/7 PASS） |
| 只读子账号写操作（D4-13） | 尝试 CreateVpc（预期 IAM 拒绝） | 未创建 | ✔ 只读 6/6=100%，写被拒=true，residualZero=true |
| 沙箱资源（D3-C3/C6/S3） | 未创建（connect 即被协议检查拒绝） | — | ✔ 无残留 |

**收尾库存扫描**（`cloud_inv2.py`，cn-north-4，05:08 与 05:12 两次）：

```
ECS 0（本机创建）/ VPC 0 / SUBNET 0 / EIP 0 / EVS 0 / OBS 0
SG 仅 default
```

> **说明（外部资源，非本机创建）**：收尾扫描期间观察到 1 组以 `testbot3-hermes-e2e-3999221055` / `testbot3-hermes-ecs-3999221055` 命名的 VPC/子网/ECS/EVS，创建时间 `2026-11-07T05:07:09Z`（CST 05:07:09），**本机所有探针日志/进程均无该 TS**（本机真云探针统一使用 `tctest-hermes-*` 前缀且已全部删除）。该前缀为 `scripts/realcloud_e2e.mjs` 中硬编码的多机共用前缀，判为其他测试机并发执行中的资源，按「只删本次创建」红线**未做删除**，仅记录备查。

---

## 八、遗留与建议

- **P0 四项优先修复**：D2-4（脱敏正则加 `/i` + 裸 ak/sk 键名）、D4-2（env-dump 补裸 access_key）、D4-21（cloud-risk-rules 补 HCL/托管策略形态）、D9-12（dispatch 增加 initialize 前置状态机）。
- **SPEC 三项待裁决**：D10-4 规则计数（实现 19 条 vs 用例断言 16 条）、D9-9 capabilities.cancellation、D8-9 sanitizeValue 脱敏契约——需维护者确认是改用例还是改实现。
- **账号侧**：沙箱 3 项 BLOCKED 需账号本人签署最新版 DevStation 协议后重测（非代码问题）。
- **环境侧**：KooCLI 7.2.12 与插件配对版本 7.3.12 不一致（check_cli `version_mismatch`），建议各机执行 `npx huaweicloud-devkit install-hcloud` 对齐；不影响本轮功能结论。
- **探针健壮性**：D6-4 断言文本硬编码「全部返回40」，工具数已增至 47，建议改为与 tools/list 实际长度比较（本轮按「15 并发结果一致」判 PASS 并在此备注）。