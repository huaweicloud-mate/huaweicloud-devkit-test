# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-15 05:35（北京时间）
> **执行归档**：`results/OpenCode/2026-10-15-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（12 FAIL + 3 SPEC-MISMATCH，其中 P0 缺陷 4 项，新增缺陷 1 项 D1-70）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（本机 IP 1.92.93.23） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921c`，PR #914） |
| 工具全集 | `42`（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置，KooCLI 三端同步 OK） |
| 真云凭证 | `cn-north-4`（管理员 AKSK 可用；只读子账号 test001 就绪） |
| 测试类型 | 源码级探针直调 + 真机 CLI（install/doctor/status/update/uninstall）+ MCP 协议 + 真云 E2E（ECS/OBS/EIP/VPC 建删归零）+ 沙箱 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针 .mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP stdio 协议直连 + 真机 CLI（隔离 HOME `install --target opencode` 全链）+ 真云 E2E（ECS 建删归零 / OBS 静态站建删归零 / EIP 建删归零 / VPC 建删归零）+ 沙箱 E2E（connect/upload_project/deploy_nginx/close_session）。证据统一落 `evidence/<case-id>/`（probe 脚本 + stdout.txt + stdout.log JSON status）。
> **SUT 说明**：本轮 2026-10-15 全量复测，SUT 由 10-14 的 `v1.1.8 @ 74f519dc` 升至 `v1.1.9-next.0 @ 6302921c`。全探针新鲜重跑 + 真云 E2E 重建删归零。#1~#14 与 10-14 逐条一致（无修复）；新增 #15 D1-70 undici 浮点依赖崩溃。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（唯一 NOT_RUN = D1-39 Windows 专属） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 12 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `89.7%` |
| P0 / P1 / P2 缺陷（FAIL + SPEC） | `4 / 6 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/OBS/EIP/VPC/沙箱均清理，无残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `3` | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（云主机 别名未命中路由） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截未覆盖 generic `access_key` | `safety-policy.mjs:514-515` | 复核（历史） |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 未拦截 HCL `actions=["*"]` 与 `AdministratorFullAccess` | `cloud-risk-rules.json:196-213` | 复核（历史） |
| 3 | P0 | `D9-12` | D9协议 | initialize 不触发版本检查 + 未 initialize 先 tools/list 未拒 -32600 | `mcp-protocol.mjs:32-59` | 复核（历史） |
| 4 | P0 | `D10-4` | D10安全 | 规则库 16→19 条（用例契约滞后，行为全过）（SPEC） | `cloud-risk-rules.json` | 复核（历史） |
| 5 | P1 | `D4-6` | D4安全 | hook_check_command 对 `--admin-pass` 不告警 | `cloud-risk-rules.json:68-72` | 复核（历史） |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（默认放行） | `risk-rule-engine.mjs:103-106` | 复核（历史） |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务交付复合意图未命中部署目标 | `tools.mjs:1983-2224` | 复核（历史） |
| 8 | P1 | `EXP-E01` | D10评测集 | serviceCatalog 中文意图「云主机」未命中 | `tools.mjs:1995-2002` | 复核（历史） |
| 9 | P1 | `D9-9` | D9协议 | capabilities.cancellation 未声明（SPEC） | `mcp-protocol.mjs:45-49` | 复核（历史） |
| 10 | P1 | `D1-70` | D1安装 | 代理配置后 undici 8.12.1 崩溃（Node 22.13 缺 zstd） | `package.json` + `proxy-agent.mjs:20-22` | **新增** |
| 11 | P2 | `D3-S5` | D3功能 | 复合意图分层路由未分解（存储+托管） | `tools.mjs:1983-2224` | 复核（历史） |
| 12 | P2 | `D3-S6` | D3功能 | FunctionGraph CreateFunction 最小参数集不被稳定接受 | `tools.mjs` CreateFunction 调用 | 复核（历史） |
| 13 | P2 | `D4-25` | D4安全 | Python hook 写操作遥测误分类为 cli:invoke | `huaweicloud-safety.py:46` | 复核（历史） |
| 14 | P2 | `D4-26` | D4安全 | findings.evidence JSON 带引号 key 未脱敏 | `risk-rule-engine.mjs:19-23` | 复核（历史） |
| 15 | P2 | `D8-9` | D8文档 | sanitizeValue 未移除 AK/SK/token 敏感值（SPEC） | `telemetry/telemetry.mjs:189-191` | 复核（历史） |

### 根因详情

完整根因（现象/断言/根因 文件:行号/影响/证据）见 `FINDINGS.md` 15 项。P0 四点：

**#1 [P0] D4-2 凭证 env 打印拦截未覆盖 generic `access_key`**
- 期望：`env | grep -i access_key` 应返回 `deny`
- 实际：`HW_ACCESS_KEY/HW_SECRET_KEY/HUAWEICLOUD_SDK_AK/HCLOUD_AK` 均 `deny`，`env | grep -i access_key` 返回 `allow risk=not_huaweicloud`
- 根因：`safety-policy.mjs:514-515` env-dump 第二段正则只匹配云厂商前缀

**#2 [P0] D4-21 hook_check_artifacts 未拦截 HCL broad IAM**
- 期望：`actions = ["*"]` 与 `AdministratorFullAccess` 引用均应 `deny`
- 实际：JSON `"Action":"*"` → deny；HCL `actions = ["*"]` → allow；`data "..._iam_policy"{name="AdministratorFullAccess"}` → allow
- 根因：`cloud-risk-rules.json:196-213` `hwc-iam-admin-policy` 仅覆盖 JSON 形态与单数 `Action = *`

**#3 [P0] D9-12 initialize 握手协议安全基线两处缺口**
- 期望：③ initialize 触发 runVersionCheck；⑥ 未 initialize 先 tools/list 返回 -32600
- 实际：③ runVersionCheck not called（改 hdkitGenerateUserHash）；⑥ tools/list 直接返回工具列表
- 根因：`mcp-protocol.mjs:32-55` 未调 runVersionCheck；`:57-59` dispatch 无 initialize 前置状态机

**#4 [P0] D10-4 规则库 16→19 条（SPEC，用例契约滞后）**
- 期望：用例断言「16 条(9 deny+7 warn)」
- 实际：`规则数=19 severity={deny:9, warn:10}`；四条行为断言全过
- 根因：`cloud-risk-rules.json` 新增 warn 规则，用例计数未同步

**#10 [P1] D1-70 undici 8.12.1 崩溃（新增，本轮唯一新增缺陷）**
- 期望：配置代理后 `getProxyDispatcher` 返回 ProxyAgent、`getWebSocketImpl` 返回 ProxyWebSocket
- 实际：`import('undici')` 加载 8.12.1 时 `decompress.js:78` 抛 `Cannot read properties of undefined (reading 'bind')`（`node:zlib.createZstdDecompress` 在 Node 22.13 为 undefined）
- 根因：`package.json` `engines.node >=22` + `undici ^8.11.2`；undici 8.12.1 `engines.node >=22.19.0`；`proxy-agent.mjs:20-22` `importUndici()` 崩溃。8 项配置级检查全过，仅 2 项 undici 代理路径崩溃。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 |
|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | `调归属` | OS 列=「Windows（升级检测链 EINVAL 专属）」；agent=「Hermes 代表终端」，OpenCode Linux 不适用。`disttags-probe` 已源码级验证 `queryDistTags({latest,next})` 正常返回（供 Linux 侧 NR3 参考）。 |

> 无 BLOCKED 用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-13 只读子账号 6/6 只读通过、写操作 IAM 拒绝 `PolicyNotAuthorized`、归零；真云探针全程脱敏，无 AK/SK 落盘日志）
- [x] 写操作误判 read-only：`0`（D4-5 写操作全判 deny、只读全判 allow，无误判）
- [x] 红线（I 类）违规：`0`（真云建删归零，未 mock、未虚报）
- [x] 脱敏复核：证据目录无原始密钥，`stdout.log` 仅含 status/why，无明文凭证

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1 真云） | 是（`tctest-opencode-ecs-*`，c6.large.2） | 已删（DeleteServers delete_volume） | ListServersDetails 不含本次资源 ✓ |
| VPC/子网（D3-C1/D3-C7/D4-14） | 是（`tctest-opencode-*`） | 已删（DeleteSubnet+DeleteVpc） | ListVpcs 不含本次资源 ✓ |
| OBS 桶（D3-C2 真云） | 是（`tctest-opencode-obs-*`） | 已删（obs rm -r + rm obs://bucket -f） | 归零验证 ✓ |
| EIP（D3-C7 真云） | 是（`tctest-*`） | 已删（DeletePublicip） | 归零验证 ✓ |
| 沙箱会话/项目（D3-C3/D3-C6） | 是（connect/upload/deploy） | close_session ✓ | 会话关闭、无残留 ✓ |
| KooCLI 只读 profile（D4-13 test001） | 临时创建 | 已删（configure delete） | 恢复 default ✓ |

> 真云只删本次创建资源；删除前唯一时间戳命名（`tctest-opencode-<ts>`/`tctest-*`），未删既有/他人资源（tctest-diag2/3、testbot*-hermes-e2e、hdk-probe-* 等为其他客户端资源，未触碰）。D3-C1 ECS 最小规格（c6.large.2）创建→ACTIVE→含磁盘删除→异步轮询归零闭环完整。

---

## 八、遗留与建议

- 待裁决 SPEC：`D10-4`（规则 16→19 计数）、`D9-9`（cancellation 未声明）、`D8-9`（sanitizeValue 脱敏契约）——均属「实现在前、用例契约滞后或需产品确认」，行为无安全回归。
- **新增 #15 D1-70（undici 浮点依赖）**：建议 `package.json` 将 `engines.node` 收紧至 `>=22.19.0`，或将 `undici` 锁为 `<8.12.0`，避免 `^8.11.2` 浮点解析到 8.12.1 在 Node 22.0–22.18 崩溃；本缺陷同时影响 1.1.8（非 1.1.9 特有）。
- #1~#14 缺陷与 10-14 逐条一致（SUT 1.1.8→1.1.9-next.0），无修复、无新回归；均命中历史 open issue，走查重不重复开单（见 `HISTORY_LINKS.md`）。
- D2-12（R10 runtime 禁止落盘）行为正确：`auth_sync` 返回 `ok:false` 且新增结构化错误码 `HDKIT_SYNC_SKIPPED_RUNTIME`（error 文案本地化为中文），PASS；探针 regex 需同步匹配新 code 字段（测试侧维护项，非产品缺陷）。
- 真云 E2E 新增 5 条（D3-C1/C2/C3/C6/C7）本轮全部 PASS 且建删归零：ECS/OBS/EIP/VPC 真机建删 + 沙箱部署 + 跨区域引导闭环实测通过。
- 执行期间观测到共享账号 VPC 路由器配额曾被其他客户端并发建 VPC 瞬时耗尽（VPC.0114 OverQuota），已确认非本客户端残留、稍后自动恢复；D4-13/D4-14 已复测通过。