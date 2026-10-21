# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-22 05:17（北京时间）
> **执行归档**：`results/AtomCode/2026-10-22-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64） |
| Node / npm / Python | `v22.13.0 / 10.9.2 / 3.12.3` |
| 被测版本（SUT） | `1.1.10`（npm latest，gitHead `b0e9f02`） |
| hcloud | KooCLI（真云） |
| 真云凭证 | `cn-north-4`（管理员 AK/SK + 只读子账号 test001） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（`.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（redactSecrets/classifyTextCommand/serviceCatalog/callTool/mcp-protocol 等）真实运行，决策与结果落 `stdout.log`；真云 E2E（ECS/OBS/沙箱/跨区域）经 `scripts/realcloud_e2e.mjs` 及专用探针实机建删资源 + 归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（设计级 106 + 展开级 39；D1-39 为 OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 13 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `90.3%` |
| P0 / P1 / P2 新增缺陷（产品级） | `1 / 6 / 3` |
| 红线（I 类）违规 | `1`（D2-4 凭证脱敏漏，见缺陷 #1） |
| 资源释放 | `全部归零`（ECS 经补删确认归零，VPC/子网/OBS/沙箱均已释放） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `1` | D9-9 cancellation 未声明 |
| NOT_RUN | `1` | D1-39 Windows 专属在 Linux 豁免 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文意图未路由 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | JSON 键值形态凭证漏脱敏 | JSON 凭证值应 `<redacted>` | `{"ak":"AKID123456"...}` 原样返回 | `safety-policy.mjs:34-62` | 待提单 |
| 2 | P1 | `D4-27` | 小写 ak/sk 漏脱敏 | 输出不得含明文 AKID456 | `token=<redacted> ak=AKID456 sk=secret789` | `safety-policy.mjs:45` | 待提单 |
| 3 | P1 | `D3-S1` | 中文只读查ECS未路由 | 应路由到 `ECS` | `Run hcloud --help`（MISS） | `tools.mjs:2023-2278` | 待提单 |
| 4 | P1 | `D3-S2` | 中文删VPC未路由 | 应路由到 `VPC` 并确认 | `Run hcloud --help`（MISS） | `tools.mjs:2023-2278` | 待提单 |
| 5 | P1 | `D3-S3` | 中文沙箱预览未路由 | 应路由到 `Sandbox` | `Run hcloud --help`（MISS） | `tools.mjs:2023-2278` | 待提单 |
| 6 | P1 | `EXP-E01` | 中文「云主机」未路由 | 应命中 ECS查询 | `Run hcloud --help`（MISS） | `tools.mjs:2023-2278` | 待提单 |
| 7 | P1 | `D9-9` | tools/call 取消能力未声明 | capabilities 应声明 cancellation | 仅 `tools:{}` | `mcp-protocol.mjs:47-49` | 待提单 |
| 8 | P2 | `D3-S5` | 中文复合意图未路由 | 应命中多 service 分层 | `Run hcloud --help`（MISS） | `tools.mjs:2023-2278` | 待提单 |
| 9 | P2 | `D4-25` | 写命令边界未命中 | 应分类 `cli:write` | 落入 `cli:invoke` | `hooks/huaweicloud-safety.py:46` | 待提单 |
| 10 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK | 应移除敏感值 | `AK=ABC123XYZ` 原样返回 | `telemetry/telemetry.mjs:189-196` | 待提单 |
| 11 | 测试侧 | `D3-C1` | ECS 归零验证窗口不足 | 150s 内确认归零 | 轮询未确认（后补删已归零） | 非源码缺陷 | 不提单 |
| 12 | 测试侧 | `D3-C2` | OBS建桶 exit-code 假阴性 | 建删成功 | mb.ok=false 但实际成功 | 非源码缺陷 | 不提单 |
| 13 | 测试侧 | `D3-C3` | deploy_nginx 端口占用 | 8080 | 8083（deploy_check PASS） | 非源码缺陷 | 不提单 |
| 14 | 测试侧 | `D3-C7` | 跨区域创建需多区域项目 | 创建成功 | VPC.0501 region 不匹配 | 非源码缺陷 | 不提单 |

### 根因详情（P0/P1 附代码片段）

**#1 [P0] D2-4 JSON 键值形态漏脱敏**

- 期望：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` → 全 `<redacted>`
- 实际：原样返回，明文凭证未脱敏
- 根因：`safety-policy.mjs:34-62`，`redactString()` 正则只匹配无引号键 `key[:=]value`，JSON 引号键 `"ak":"..."` 中键与 `:` 之间多引号导致 `\s*[:=]` 不命中

**#2 [P1] D4-27 小写 ak/sk 漏脱敏**

- 期望：`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` → 全 `<redacted>`
- 实际：`token=<redacted> ak=AKID456 sk=secret789`
- 根因：`safety-policy.mjs:45`，`(AK|SK)` 正则缺 `/i`，小写 `ak=`/`sk=` 不命中（`token` 因第 42 行 `/gi` 正确脱敏）

**#7 [P1] D9-9 取消能力未声明**

- 期望：capabilities 声明 `cancellation`
- 实际：initialize 响应仅 `{ tools: {} }`
- 根因：`mcp-protocol.mjs:47-49` capabilities 对象缺 `cancellation`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义，OS 列标注「专属」，Linux 由 D1-40（镜像 lag 下检测正确性）代表覆盖 | — |

> 其余无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- 凭证泄漏事件：`1 项缺陷（D2-4 / D4-27 / D8-9 脱敏漏），未发现实际运行时密钥外泄`
- 写操作误判 read-only：`0`
- 红线（I 类）违规：`1（D2-4 凭证脱敏不完整）`
- 脱敏复核：证据目录中 D4-1/D4-2/D4-3 等探针已按 `<redacted>` 落盘，无原始凭证残留

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（`12032c5c-5505-4b7e-90e3-2d6598f9bcfb`） | 是（c6.large.2） | 已补删（`DeleteServers`） | 已归零（轮询确认 `ListServersDetails` 不再包含） |
| VPC | 是 | 已删 | OK |
| 子网 | 是 | 已删 | OK |
| OBS bucket | 是 | 已删 | 删桶成功 |
| 沙箱会话 | 是（connect） | close_session | OK |
| EIP（D3-C7） | 尝试创建（失败 VPC.0501） | — | total_count=0 |

> 真云只删本次创建资源；删除前全量盘点，未触碰他人/既有资源。本机另见 `testbot3-hermes` 前缀的历史 ECS（非本客户端本次创建），未动。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（mcp-protocol cancellation 能力声明）
- 本轮未覆盖：D1-39 Windows 专属升级检测（Linux 豁免）；D10 真实 Agent 会话评测（本客户端无 dsh/CDP 自动化，走源码级 serviceCatalog 路由层已覆盖）
- 建议：1.10 仍存在脱敏（D2-4/D4-27/D8-9）与中文意图路由（D3-S1/S2/S3/S5/EXP-E01）多处缺口，建议下版优先修复 `safety-policy.mjs` 的 JSON 键与大小写脱敏及 `serviceCatalog` 中文分词；真云 E2E 归零验证窗口建议从 150s 放宽；`testbot3-hermes` 同前缀历史 ECS 疑似泄漏，建议维护者统一盘点。