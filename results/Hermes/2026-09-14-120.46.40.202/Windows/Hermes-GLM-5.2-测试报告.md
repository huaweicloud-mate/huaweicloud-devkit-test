# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-14 23:10:40`（北京时间）
> **执行归档**：`results/Hermes/2026-09-14-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（P0 有 5 个 FAIL，不可标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `GLM-5.2` |
| OS / 架构 | `Windows 10` / `x86_64` |
| Node / npm / Python | `Node v22.23.1` / `npm 10.9.8` / `Python 3.11.15` |
| 被测版本（SUT） | `v1.1.4-next.6`（npm @next） |
| 工具全集 | `39`（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12` / doctor 全 PASS (10/10) |
| 真云凭证 | `已配置（AKSK）` |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status）/ 单元测试 / lint / validate |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 hdk/plugins/huaweicloud-core/src/* 导出函数，决策/结果落 stdout.log；CLI 真机执行记录日志；证据统一落 evidence/<case-id>/。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计级） | `81` |
| 已执行（P0 全量） | `18` |
| PASS / FAIL / BLOCKED / NOT_RUN | `13 / 5 / 0 / 63` |
| 通过率（分母 = PASS+FAIL） | `72.2%`（13/18） |
| P0 新增缺陷 | `5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

### 基础套件结果

| 套件 | 结果 | 详情 |
|---|---|---|
| npm test (单元测试) | `470 pass / 3 fail / 14 skip` | 3 fail 均为 detectAgentHarness 环境特定（Hermes 环境变量泄漏） |
| npm run lint:md | `0 issues / 72 files` | PASS |
| npm run lint:js | `1 error` | mcp-server.mjs:1 Unix linebreaks (LF) 要求 |
| npm run validate | `29 skills validated / KooCLI 7.2.12` | PASS |
| npm run format:check | `231 files [warn]` | 非阻塞，仅格式 |
| doctor --target Hermes | `10 pass / 0 warn / 0 fail` | PASS |
| status --target Hermes | `未安装: Hermes Agent` | DevKit 未向 Hermes 注册安装 |
| version | `1.1.4` / OpenCode 1.1.1 / CodeArts 1.1.1 / CodeArts Work 1.1.4-next.6 | PASS |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `13` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `63` | P1/P2 本轮未覆盖（仅执行 P0 全量） |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `0` | 展开级用例继承设计级父用例状态 |
| FAIL | `0` | — |
| NOT_RUN | `71` | 本轮未逐条展开执行 |
| **合计** | **`71`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | Windows 升级检测链 EINVAL 静默失败 | queryDistTagsSync() 返回非 null 的 dist-tags 对象 | 返回 null，spawnSync npm.cmd EINVAL | `update-check.mjs:238` | P | 待提单 |
| 2 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | echo $HUAWEICLOUD_SDK_SK -> deny | 返回 allow，仅 printenv HUAWEICLOUD_SDK_AK 被拦截 | `safety-policy.mjs` env-dump 正则不完整 | P | 待提单 |
| 3 | P0 | `D4-3` | 明文 secret API 未拦截 | hcloud CSMS show-secret -> deny | 返回 allow（read-only），CSMS/KMS 明文 secret 未识别 | `safety-policy.mjs` 未覆盖 CSMS show-secret | P | 待提单 |
| 4 | P0 | `D4-15` | 引号包裹命令绕过 | hcloud "ECS delete-server" -> deny | 返回 allow，引号内命令未被检测 | `safety-policy.mjs` 引号/转义处理缺陷 | P | 待提单 |
| 5 | P0 | `D4-16` | 命令包裹穿透 | sh -c "hcloud ECS delete-server..." -> deny | 返回 allow，shell wrapper 内层命令未检测 | `safety-policy.mjs` 未解析 shell wrapper | P | 待提单 |

### 根因详情

**#1 [P0] D1-39 Windows 升级检测链 EINVAL 静默失败**

- 期望：queryDistTagsSync() 返回 {latest: "1.1.4", next: "1.1.4-next.6"}
- 实际：返回 null
- 根因：plugins/huaweicloud-core/src/update-check.mjs:238
  spawnSync(NPM_BIN, ...) 在 Windows 上对 npm.cmd 产生 EINVAL，未设置 shell: true
- 复现：spawnSync('npm.cmd', ['view', ...], {windowsHide: true}) -> error.code === 'EINVAL'
- 修复方案：添加 shell: true 选项
- 证据：evidence/D1-39/stdout.log

**#2 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：echo $HUAWEICLOUD_SDK_SK / echo %HUAWEICLOUD_SDK_AK% -> deny
- 实际：返回 allow（"No Huawei Cloud safety rule matched"）
- 根因：safety-policy.mjs env-dump 检测正则仅匹配 printenv 前缀，不覆盖 echo $VAR / echo %VAR% 模式
- 证据：evidence/D4-2/stdout.log

**#3 [P0] D4-3 明文 secret API 未拦截**

- 期望：hcloud CSMS show-secret --secret_id=xxx -> deny
- 实际：返回 allow（"Command appears to be a read-only Huawei Cloud operation"）
- 根因：safety-policy.mjs classifyHcloudArgs() 将 CSMS show-secret 归类为 read-only
- 证据：evidence/D4-3/stdout.log

**#4 [P0] D4-15 引号包裹命令绕过**

- 期望：hcloud "ECS delete-server" --server_id=12345 -> deny
- 实际：返回 allow（"Command does not match a known write or secret operation"）
- 根因：safety-policy.mjs classifyTextCommand() 引号内 ECS delete-server 未被正确解析
- 证据：evidence/D4-15/stdout.log

**#5 [P0] D4-16 命令包裹穿透**

- 期望：sh -c "hcloud ECS delete-server --server_id=12345" -> deny
- 实际：返回 allow（"No Huawei Cloud safety rule matched"）
- 根因：safety-policy.mjs classifyTextCommand() 未递归解析 sh -c / bash -c / cmd /c / eval / $() 等 shell wrapper
- 证据：evidence/D4-16/stdout.log

---

## 五、阻塞项

无环境阻塞项。所有 P0 用例均已实际执行。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 全 PASS）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无真云资源 | 否 | — | N/A |

> 本轮仅执行源码级探针和 CLI 检查，未创建真云资源。

---

## 八、遗留建议

1. **D1-39 修复优先级最高**：Windows 上整个升级检测链完全失效，用户无法收到更新提醒。修复方案：spawnSync 添加 shell: true。
2. **D4-2/D4-3/D4-15/D4-16 安全拦截类缺陷**：建议统一增强 classifyTextCommand() 的命令解析能力，覆盖 echo 变量、CSMS/KMS secret API、引号包裹、shell wrapper 场景。
3. **单元测试 3 个 fail**：均为 detectAgentHarness 环境特定（Hermes 进程的环境变量被检测为 harness），非代码缺陷。
4. **lint:js 1 error**：mcp-server.mjs 行尾符为 CRLF 而非 LF，建议在 .gitattributes 或 prettier 配置中强制 LF。