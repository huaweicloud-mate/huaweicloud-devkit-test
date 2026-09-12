# Hermes-Agent-DeepSeek-V4-Pro 测试报告

> 生成时间：2026-09-12 14:21:03（北京时间）
> 测试执行归档：`results/ITER-006-20260912115606/`
> 测试对象：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `v1.1.4-next.2` @ commit `8bcae14`（chore(release)#636，已切 dev 最新） |
| 工具全集 | 39 个（由 `plugins/huaweicloud-core/src/tools.mjs` 的 `TOOL_DEFINITIONS` 注册数组推导） |
| 本机环境 | Windows 10，Node v22.23.2，npm 10.9.8 |
| 真云 | cn-north-4（KooCLI 7.2.12 authenticated） |
| Linux 测试机 | testbot3（1.94.218.129，Ubuntu 24.04.4 aarch64，Node v22.23.2） |
| 测试类型 | 全量测试（P0 基线 + P1 协议/函数 + 真云 E2E + 认证域 + 多终端） |

**设计真源**：设计级 163 条 / 展开级 137 条 / 追踪表 169 条。设计门禁 `verify_new.py` + `scan_gaps.py` 全程 exit 0（39 工具覆盖、只读复现校验）。

## 二、执行结果

### 2.1 已执行并通过（有真实证据）

| 用例组 | 结果 |
|---|---|
| P1 MCP 协议（D9-1/3/4 + D1-26） | 12/12 ✓ |
| D3-A1 retrieve_skill | 5/5 ✓（core/ecs/obs/iam/ims） |
| D3-B5 detect_framework | Vite 正样本识别 ✓ |
| P2 真云只读（D2 auth_status + D3-A5 list_regions） | 3/3 ✓ |
| D3-B 能力发现（list_operations/plan/run_readonly） | 10/10 ✓ |
| D3-B7 审批链（deny→approve→execute + 单次消费 + 参数篡改） | 6/6 ✓ |
| D3-C7 EIP 真云 E2E（创建→释放→归零） | 3/3 ✓ |
| D3-C2 OBS 静态站（建桶（-location）→上传→校验→清理） | 通过 ✓ |
| D3-C8 EVS 生命周期（创建→ShowVolume→释放→归零） | 4/4 ✓ |
| D3-B8 voucher_status | claimed ✓ |
| P4 Linux 多终端（testbot3 MCP 冒烟，39 工具与 Windows 一致） | 4/4 ✓ |
| D2 认证域核心契约 | 27 断言 ✓ |
| D4 安全域核心（D4-1/21 deny、D4-22 warn） | 3 项 ✓，发现 #8/#9 |
| D1 安装域只读命令（doctor/status/version/install-hcloud） | 5/5 ✓ |

**D2 认证域细分**（3 批探针，27 项断言全绿）：
- `credentials.mjs`（11）：无凭证 HDKIT_CRED_MISSING、env 注入解析、R9 configuredBySession 优先 env、落盘字段/0600、OBS endpoint 生成 + 缺参报错、R10 runtime 优先、backup/restore。
- `auth/reconcile.mjs`（11）：scanState 空态、fingerprint=sha256[:8]、R7 current 档跟随、R5 命名档隔离、authEncrypt 跳过 S2 漂移（#533）、D2-18 isManualModified。
- `auth_switch` 工具级（5）：R3 STS 拒绝落盘（P0）、temporary 内存级、import 读后擦除 + SK 脱敏。

### 2.2 未执行（131 条 NOT_RUN 中的剩余项）

设计级执行状态：`NOT_RUN=75 / PASS=70 / FAIL=7 / SPEC-MISMATCH=6 / BLOCKED=5`（本轮回填 56 条，NOT_RUN 由 131 降至 75）。剩余 NOT_RUN 按域：D1(14)、D2(5)、D3(5)、D4(14)、D5(5)、D6(5)、D7(6)、D8(7)、D9(2)、D10(8)。详见 §五。

## 三、缺陷清单（11 个，均定位根因，统一合并提单）

| # | 级别 | 标题 | 根因 |
|---|---|---|---|
| 1 | P1 | mcp-server 畸形 JSON 进程崩溃（未返回 -32700） | `mcp-server.mjs` L152 裸 `JSON.parse` 无 try/catch |
| 2 | P2 | 未知方法/非法请求一律 -32603（未分 -32601/-32600） | `mcp-server.mjs` L169 硬编码 `-32603` |
| 3 | P2 | 审批令牌 TTL=5min 非幂等/时钟不可注入（vs 设计 60s） | `hcloud-cli.mjs` L14 `APPROVAL_TTL_MS=5*60_000` + consume 即删 |
| 4 | P2 | D3-C9 错误码断言 APIGW.0101 不符实际（Ecs.0114/EVS.5404） | 测试矩阵断言错误（非产品缺陷） |
| 5 | P3 | SERVICE_EXAMPLES 缺 EIP 缓存示例 | `tools.mjs` L1660 示例表无 EIP |
| 6 | P1 | check_update/upgrade Windows 失效（spawn npm.cmd EINVAL） | `update-check.mjs` L12/L241 `spawn('npm.cmd')`（#554 仍存） |
| 7 | P2 | OBS mb 示例缺 -location | `tools.mjs` L1669 示例缺 `-location` |
| 8 | P2 | hook 未拦截凭证环境变量打印（printenv→allow） | safety-policy 缺「凭证 env 打印」规则 |
| 9 | P2 | 大小写变体/命令包裹只触发 warn（非 deny） | `hwc-destructive-delete-operation` 返回 warn 级 |
| 10 | P2 | initialize.capabilities 缺 notifications.cancellation | 无法取消挂起 tools/call |
| 11 | P3 | README 缺 proxy 命令说明 | 文档命令清单缺口 |

> 根因、源码行号、证据路径详见 `FINDINGS.md`。#4 为测试矩阵断言错误（非产品缺陷），留待设计阶段修正。

## 四、阻塞项（环境/权限缺口，非产品缺陷）

| 项 | 原因 |
|---|---|
| D3-C8 企业项目 | `EPS ListEnterpriseProject` → `EPS.0004 Permission error`（账号无 EPS 权限） |
| D3-C1 ECS 购买 | 现金≈1 元 + 代金券，按时长计费需保证金，未执行 |
| BSS 余额查询 | 需 `--cli-region=cn-north-1`（全局服务） |

## 五、剩余待执行项

1. **D2 剩 5 条**：D2-1 三端同步、D2-3 sync 幂等、D2-21 AK/SK 轮换（需真云可轮换账号）、D2-17 非 TTY 守卫、D2-20 HUAWEICLOUD_HOME 重定向。
2. **D4 安全域 24 条**：审批链完整矩阵、token 生命周期、跨会话、结构化 args。
3. **D1 安装域 17 条**：升级 handler fixture、中断恢复、坏包回滚。
4. **D3 剩余 23 条**：沙箱 11 工具（DevStation 配额）、22 服务只读规划、explain_error、search_docs。
5. **D5/D6/D7/D8/D9/D10 共 47 条**：脚本/文档/质量/Agent E2E。
6. **终端矩阵补全**：Hook/非 Hook、TTY/PTY、stdio/remote（现仅 Linux stdio 一项）。

## 六、真云资源清理声明

本轮创建并释放：EIP（b3a83260…）、EVS 卷（914c2fb8…、ba5841bc…）、OBS 桶（tctest-static-1789191940498）。均已删除并只读验证归零（EIP 归零 / EVS.5404 / OBS NoSuchBucket），无真实资源残留。

## 七、后续计划

继续分域补测（D4 安全域 → D1 安装域 → D3 剩余 → D5-D10 → 终端矩阵），每完成一批即回填执行状态并**更新本报告**；全部完成后，统一合并提单（附本报告）。