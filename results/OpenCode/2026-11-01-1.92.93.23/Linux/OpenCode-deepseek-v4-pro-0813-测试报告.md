# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-01 05:40:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-01-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.0`（gitHead `47170d1`，npm latest=1.1.12 / next=1.1.13-next.0 取最高） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：① 源码级直调探针（`safety-policy.mjs` classifyTextCommand/redactSecrets、`update-check.mjs` judgeUpdate/semverParse、`tools.mjs` TOOL_DEFINITIONS 等）；② MCP 协议真机（stdio JSON-RPC 驱动 `mcp-server.mjs`，tools/list、tools/call、initialize）；③ CLI 真机（`huaweicloud-devkit doctor/status/auth/plugins/help`）；④ 真云 E2E（VPC/子网/ECS 建删归零、OBS 静态站建删、只读子账号最小权限实测）；⑤ 评测集 harness（`eval/harness/run-eval.mjs` 15 条中文意图路由）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39，另使命 mission-001 9 条已回填） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 4 / 5 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 140） | `97.1%` |
| P0 / P1 / P2 新增缺陷 | `2 / 2 / 0` |
| 红线（I 类）违规 | `1`（D2-4 凭证脱敏缺失=red-line；D4-3 明文 secret API 放行） |
| 资源释放 | 真云资源已全部归零（详见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 沙箱 DevStation 维护（真·外部依赖） |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 由 NR3 覆盖） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:45` 脱敏正则缺 `i` 旗标，小写 `ak=`/`sk=` 未覆盖 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截 | `safety/policy.json:26` blockedSecretOperations 缺 `DecryptData` | 待提单 |
| 3 | P1 | `D3-C1` | D3功能 | ECS 生命周期 E2E（归零） | KooCLI 异步删除 exit0 ≠ 真实删除，归零窗口内未自证完成 | 待提单 |
| 4 | P1 | `EXP-E01` | D10评测 | 路由准确率（查云主机） | `tools.mjs:2199-2212` ECS route keywords 缺「云主机」别名 | 待提单 |

### 根因详情

**#1 D2-4 凭证脱敏（P0，red-line）**
- 断言：`redactSecrets("config: ak=TESTAK... sk=TESTSK...")` 输出不得包含原始 AK/SK 值。
- 实际：小写 `ak=`/`sk=` 原样输出（akLeak=true, skLeak=true）；大写 `AK=`/`SK=`、`access_key=` 均正确脱敏。
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `/(AK|SK)\s*[:=].../g` 只有 `g` 无 `i`，仅命中大写；`isSecretKeyName` 的 `ak`/`sk` 只作用于对象键名，不作用于字符串值。
- 证据：`evidence/D2-4/stdout.log`。

**#2 D4-3 明文 secret API 拦截（P0）**
- 断言：`classifyTextCommand("hcloud KMS DecryptData --cipher_text=xxx")` 应返回 `deny`/`warn`。
- 实际：返回 `allow`（明文 secret 可进入 agent 上下文）。
- 根因：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations=["ShowSecret","ShowSecretVersion","DownloadSecret","GetSecretValue"]` 未含 `DecryptData`；`safety-policy.mjs:249` 据此不拦截 KMS 解密。
- 证据：`evidence/D4-3/stdout.log`。

**#3 D3-C1 ECS 生命周期 E2E 归零（P1）**
- 断言：建 VPC/子网/ECS → 删除后云上资源真实消失。
- 实际：create（plan allow→run_approved）成功返回 serverIds；但 finally 归零环节 `DeleteServers` 返回 job_id 后实例 150s 仍 `ACTIVE`，`DeleteSubnet/DeleteVpc` 返回 exit0 但资源仍残留（VPC/subnet 未删），探针 self-check 失败（4/5 通过、归零 false）。
- 根因：KooCLI 异步删除语义（提交即 exit0 但资源未即时删除），归零依赖轮询窗口且 `hcloud` exit0 被误判为「已删除」；归零验证不可靠。
- 处置：已人工二次删除归零（ECS `a7692436...`、子网 `1a2922dc...`、VPC `cd5ec176...` 均核实消失，见 §七）。
- 证据：`evidence/D3-C1/stdout.log`。

**#4 EXP-E01 路由准确率（P1）**
- 断言：意图「帮我查一下我账号在华北北京四有哪些云主机」应命中 `ECS`。
- 实际：MISS，`recommendedServices` 返回兜底 "Run hcloud --help to list available services."。
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2199-2212` serviceCatalog ECS route `keywords` 缺「云主机」别名（仅有 云服务器/服务器/虚拟机/镜像）。
- 影响：15 条评测集基线 13 HIT / 1 MISS / 1 N/A = 92.9%。
- 证据：`evidence/EXP-E01/stdout.log`、`evidence/D10-3/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属：Windows 升级检测链 EINVAL 专属用例，Linux/macOS 由 NR3 终端矩阵按负面/环境验证覆盖 |

### BLOCKED（真·外部依赖：DevStation 沙箱维护）

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 实测 `huaweicloud_sandbox_check_user` 返回 `HDKIT_SANDBOX_MAINTENANCE`（沙箱升级优化中，DevStation 后端）；解除条件=维护结束 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 同上：check_user/connect/credentials/exec_one_shot/close_session 5 项子步全阻塞 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | 同上（沙箱维护） |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同上（沙箱维护，无法 expose_tunnel 出预览 URL） |
| `D3-S7` | D3功能 | 场景-跨服务交付并归零 | 同上（沙箱维护，无法 Web+RDS 交付归零） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：发现 1 处 red-line（D2-4 小写 `ak=`/`sk=` 未脱敏），已记根因待提单；测试过程未向报告/证据写入真实 AK/SK（攻击输入为合成 TESTAK/TESTSK）。
- [x] 写操作误判 read-only：D4-5/D4-9/D4-18/D4-19 高危写（DeleteServer/DeleteUser/Destructive）均 deny/warn，无误判 allow。
- [x] 红线（I 类）违规：D2-4、D4-3 两项（凭证脱敏缺失、明文 secret API 放行）。
- [x] 脱敏复核：`evidence/D9-13` 证明 tools/call 响应无真实 AK/SK 泄漏；`D4-26/D4-27` findings/双路径脱敏通过。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `opencode-devkit-e2e-3481923037` | 真机创建 | 探针 finally 未删净 → 人工 `DeleteVpc` | 已核实消失（0 remaining） |
| 子网 `...-subnet` | 真机创建 | 人工 `DeleteSubnet` | 已核实消失 |
| ECS `opencode-devkit-ecs-3481923037` | 真机创建（serverIds 返回） | `DeleteServers` 提交 + 人工二次提交 | 已核实消失 |
| OBS bucket `opencode-devkit-obs-3481923037` | 真机创建 | `OBS rm` | 已核实删除 |
| 只读子账号 D4-13 写 VPC 尝试 | 被 IAM 拒绝（未创建） | — | 归零（无残余资源） |
| D3-C1 二次复测 VPC `opencode-d3c1-…` / 子网 / ECS `9f6812ae…` | 真机创建（WaitActive 后） | DeleteServers 提交 + 人工二次删除 | 已核实消失（VPC/子网/ECS 均 0 remaining） |

> 真云 E2E 全部资源已归零（两次 D3-C1 复现均人工补齐归零并核实）；D3-C1「删除自证」暴露 KooCLI 异步删除 exit0 但资源残留的问题，见 §四 #3。

---

## 八、遗留与建议

1. **修复 D2-4**：`safety-policy.mjs:45` 脱敏正则补 `i` 旗标（或把 `ak|sk` 纳入 line 42 的 `access[_-]?key|secret[_-]?key` 语义），覆盖小写 `ak=`/`sk=` 与无分隔写法。
2. **修复 D4-3**：`safety/policy.json` `blockedSecretOperations` 增加 `DecryptData`（KMS）等返回明文 secret 的操作，或补 `cipher_text|decrypt` 语义规则。
3. **修复 EXP-E01**：`tools.mjs` ECS route `keywords` 增加「云主机」「弹性云主机」等别名，提升路由准确率。
4. **加固 D3-C1 归零**：`run_approved_command`/E2E probe 的删除归零改为「提交后轮询 ListServersDetails/ListVpcs/ListSubnets 确认消失」并显式断言，不得以 `hcloud` exit0 作为已删除依据（异步删除 exit0 ≠ 归零）。
5. 沙箱（DevStation）5 用例待维护结束补测（D3-C3/C6/C14/S3/S7）。