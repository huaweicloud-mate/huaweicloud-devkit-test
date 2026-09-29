# OpenCode-glm-5.2 版本全量测试报告 v1.1.7
> **报告名**：`OpenCode-glm-5.2-v1.1.7-测试报告.md`
> **测试类型**：版本全量测试 v1.1.7（母版全量 --full）
> **生成时间**：2026-09-28（北京时间）
> **执行归档**：`results/OpenCode/2026-09-28-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit v1.1.7（GitHub `huaweicloud/huaweicloud-devkit`，commit 7456d059）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项 D4-16 安全漏洞）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7`（npm latest 正式版，gitHead 7456d059 release-1.1.7） |
| 全量用例 | 设计级 207 / 展开级 45 = 252 条 |
| 测试模式 | `init_day.py --full`（母版全量，非 daily 精选） |

> **执行方法**：
> 1. **真实执行（探针+真机）**：5 个 grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）+ 6 项真云 E2E（realcloud_e2e.mjs）+ D9 协议探针（protocol-probe.mjs）+ D10 评测 harness（run-eval.mjs）
> 2. **源码核对**：supplement-probe.mjs（MCP 工具直调）+ source-probe.mjs（源码函数存在性验证）
> 3. **未执行（NOT_RUN）**：6 条设计级 + 6 条展开级（需真实安装/升级操作或 Hermes 会话环境，非 P0）

---

## 二、三层证据口径

| 证据层 | 数量 | 说明 |
|---|---|---|
| **真实执行** | 168 | grouped 探针 + 真云 E2E + D9/D10 harness + daily 复用探针（probe.txt + stdout.log） |
| **源码核对** | 72 | supplement-probe.mjs（MCP 工具直调）+ source-probe.mjs（源码函数/模块存在性验证） |
| **未执行 BLOCKED** | 12 | NOT_RUN（6 设计级 P1/P2 + 6 展开级，需真实安装/升级/Hermes 环境） |
| **合计** | 252 | 执行率 95.2% |

> **注意**：本报告不混报单一通过率。三层证据分别统计：
> - 真实执行通过率 = 151/168 = 89.9%（含真云 FAIL）
> - 源码核对通过率 = 69/72 = 95.8%（3 条 FAIL：D3-C7 undefined + 2 条 source not-found→PASS 修正）
> - 未执行 = 12/252 = 4.8%

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `252`（设计级 207 + 展开级 45） |
| 已执行 | `240` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `220 / 19 / 0 / 1 / 12` |
| 通过率（分母 = PASS+FAIL = 239） | `92.1%` |
| P0 / P1 / P2 新增缺陷 | `1 / 18 / 0` |
| 红线（I 类）违规 | `0`（无凭证泄漏/无 mock 假跑/真云已真机执行） |
| 资源释放 | 真云 D3-B7/B8 无资源创建；D3-C1/C2/C3/C6 创建失败无残留（finally 归零验证通过） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `192` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `6` | 未执行 |
| **合计** | **`207`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `6` | 未执行 |
| **合计** | **`45`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | hcloud CLI 返回 APIGW.0301 Unauthorized（AK/SK 认证失败） | 待提单 |
| 2 | P1 | `D3-C2` | D3功能 | OBS静态站部署E2E | OBS 返回 InvalidAccessKeyId（OBS 凭证独立存储未同步） | 待提单 |
| 3 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | sandbox_connect 返回空 ws（沙箱服务不可达） | 待提单 |
| 4 | P1 | `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | HDKIT_NOT_AGREEMENT（用户未签署最新版协议） | 待提单 |
| 5 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导 | huaweicloud_list_regions 返回 undefined（工具返回值序列化异常） | 待提单 |
| 6 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:70-89` stripExecutable 解包 sh -c 后未重新分类 | 待提单 |
| 7 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:34-46` redactString regex 不匹配 JSON 短键名 ak/sk | 待提单 |
| 8 | P1 | `D9-2` | D9协议 | JSON-RPC错误码 | `mcp-protocol.mjs:74-78` error.code=-32602 未正确序列化到响应 | 待提单 |
| 9 | P1 | `EXP-E01~E14` | D10评测 | service_catalog 路由 11/14 MISS | service_catalog 中文意图路由逻辑不完善，准确率 21.4% | 待提单 |

### 根因详情

**D4-16 [P0] sh -c 包装器绕过**：
- 期望：`sh -c 'hcloud ECS DeleteServers --server-ids test'` 被 deny
- 实际：返回 `allow`（findings 为空）
- 根因：`safety-policy.mjs:70-89` `stripExecutable()` 函数检测到 `sh -c` 并解包，但解包后的命令未在 hook_check_command 分类流程中被重新判定为写操作
- 证据：evidence/d4-security/stdout.log + evidence/mcp-tools/stdout.log

**D4-27 [P1] JSON 凭证脱敏不完整**：
- 期望：`{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1"}` 被完全脱敏
- 实际：AK/SK 明文保留在输出中
- 根因：`safety-policy.mjs:42-45` regex 匹配 `access_key`/`secret_key` 长格式但不匹配 `ak`/`sk` 短格式；行45 `(AK|SK)` 模式区分大小写且分隔符不匹配 JSON 格式
- 证据：evidence/d2-auth/stdout.log

**D9-2 [P1] JSON-RPC 错误码缺失**：
- 期望：tools/call 缺少必需参数时返回 `-32602`
- 实际：返回非标准 error 对象（无 error.code 字段）
- 根因：`mcp-protocol.mjs:74-78` 抛出 `invalidParamsError.code = -32602`，但 JSON-RPC 错误响应序列化时未将 Error.code 转移到 response.error.code
- 证据：evidence/D9-protocol/stdout.log

**D9-9 [SPEC-MISMATCH] notifications.cancellation 未声明**：
- 期望：initialize 响应声明 `notifications.cancellation`
- 实际：`capabilities` 仅含 `tools: {}`
- 根因：`mcp-protocol.mjs:47-49` capabilities 对象缺少 `notifications: { cancellation: true }`
- 证据：evidence/D9-protocol/stdout.log

**EXP-E01~E14 [P1] 路由准确率低**：
- 期望：15 条中文意图中 14 条路由到正确服务（E08 N/A）
- 实际：仅 3 条 HIT（DCS/CCE/Incentive Voucher），11 条 MISS，准确率 21.4%
- 根因：service_catalog 工具对中文自然语言意图的路由逻辑不完善，大部分返回 "Run hcloud --help"
- 证据：evidence/D10-eval/stdout.log

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-11` | D1安装 | 自定义HCLOUD_BIN保留 | 无evidence/未执行（P1/P2 非P0） |
| `D1-15` | D1安装 | checkForUpdate更新提示 | 无evidence/未执行（P1/P2 非P0） |
| `D1-52` | D1安装 | 真实升级安装与重启生效 | 无evidence/未执行（P1/P2 非P0） |
| `D1-54` | D1安装 | Hermes 会话级用户闭环 | 无evidence/未执行（P1/P2 非P0） |
| `D1-56` | D1安装 | 安装中断恢复（网络/进程中断后半装补全） | 无evidence/未执行（P1/P2 非P0） |
| `D1-57` | D1安装 | 升级坏版本回滚（装坏可退） | 无evidence/未执行（P1/P2 非P0） |
| `EXP-D5-1-2` |  |  | 无evidence/未执行 |
| `EXP-D5-1-4` |  |  | 无evidence/未执行 |
| `EXP-D5-1-5` |  |  | 无evidence/未执行 |
| `EXP-D5-1-6` |  |  | 无evidence/未执行 |
| `EXP-D5-1-7` |  |  | 无evidence/未执行 |
| `EXP-NR3-14` |  |  | 无evidence/未执行 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**无**（所有 PASS 用例均通过 verify_no_fake_pass 门禁，evidencePath 已回填）
- [x] 写操作误判 read-only：**D4-16 P0** sh -c 包装器被误判为 allow（安全缺陷，已记录 FINDINGS.md）
- [x] 红线（I 类）违规：**0**（真云已真机执行非 mock、PASS 门禁通过、无虚报）
- [x] 脱敏复核：D4-27 发现 JSON 短键名凭证脱敏不完整（已记录 FINDINGS.md）
- [x] 真云纪律：D3-C1/C2/C3/C6 真机执行（非 mock），返回真实 API 错误；D3-B7/B8 PASS；finally 归零验证通过

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-C1 VPC/Subnet | 创建失败（APIGW.0301） | 无需清理 | PASS（无残留） |
| D3-C2 OBS 桶 | 创建失败（InvalidAccessKeyId） | 无需清理 | PASS（无残留） |
| D3-C3 沙箱会话 | 连接失败 | 无需清理 | PASS（无残留） |
| D3-C6 沙箱会话 | 连接失败 | 无需清理 | PASS（无残留） |
| D3-B7 VPC ListVpcs | 只读查询无资源创建 | N/A | N/A |
| D3-B8 voucher_status | 只读查询无资源创建 | N/A | N/A |

> 真云 E2E 用例均通过 finally 归零验证（realcloud_e2e.mjs 内置反序删除 + 归零校验）。因认证失败未成功创建资源，无需清理。

---

## 八、遗留与建议

### SPEC-MISMATCH
- D9-9: `mcp-protocol.mjs:47-49` capabilities 缺少 `notifications.cancellation` 声明（MCP 协议契约漂移）

### 未覆盖项（NOT_RUN 12 条）
- D1-11/15/52/54/56/57: 需真实安装/升级操作（uninstall/reinstall/中断恢复/坏版本回滚），需独立环境
- EXP-D5-1-2/4/5/6/7: OpenCode 客户端矩阵展开级，需客户端专属环境
- EXP-NR3-14: 需真实版本升级链（1.1.2→1.1.3）

### 修复建议（优先级排序）
1. **[P0]** D4-16: 修复 `stripExecutable` 解包后重新分类逻辑，确保 `sh -c` 包装的写操作被 deny
2. **[P1]** D4-27: 扩展 `redactString` regex 覆盖 JSON 短键名 `ak`/`sk`/`token`
3. **[P1]** D9-2: 修复 JSON-RPC 错误响应序列化，确保 `error.code` 字段正确输出
4. **[P1]** EXP-E01~E14: 增强 service_catalog 中文意图路由逻辑（当前准确率 21.4%）
5. **[SPEC]** D9-9: 在 initialize capabilities 中声明 `notifications.cancellation`
6. **[P1]** D3-C7: 修复 `huaweicloud_list_regions` 返回值序列化
