# Codex 2026-10-14 BLOCKED 纠正清单（12 条，全部可解假阻塞）

> 生成：2026-10-14 ｜ 维护者治理动作，非代执行。Codex 须按本清单自主复测并回填。
> 判定依据：这 12 条在另外 9 个客户端里绝大多为 PASS（9 PASS / 仅 D8-9、D9-12 为真缺陷 FAIL），
> 唯独 Codex 标 BLOCKED，属「没跑探针/没源码核对却标阻塞」的纪律问题。

## 一、源码核对类（9 条）—— 函数都存在，应源码核对 PASS，不是 BLOCKED

| ID | 优先级 | 用例 | 源码函数（文件:行号） | 正确做法 |
|---|---|---|---|---|
| D1-66 | P2 | 遥测开关与端点环境变量 | `telemetry/telemetry.mjs:175` `isTelemetryEnabled()`、`:180` 读 `HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT` | 直调 `isTelemetryEnabled()` + 设 env `off` 断言返回 false |
| D1-69 | P2 | CLI help 子命令 | `setup-cli.mjs:5126` `case 'help'` | 源码核对 help 分支存在 + 跑 `setup-cli help` 断言输出含 usage |
| D1-70 | P1 | 代理配置与 WebSocket 代理 | `proxy/proxy-config.mjs:23/35/60`（writeProxyConfig/clearProxyConfig/getProxySettings）、`proxy/proxy-agent.mjs:52/73`（createProxyWebSocket/getWebSocketImpl） | 直调这 5 个函数，断言配置读写 + WS 代理返回 |
| D8-9 | P2 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:150` `generateOrRecoverInstallId()`、`:189` `sanitizeValue()` | 直调 sanitizeValue，断言秘密字段被脱敏（注意：此条真实状态是 FAIL/SPEC，非 PASS） |
| D8-10 | P2 | MCP 配置备份与合并 | `mcp-config-backup.mjs:14/28/33/47/62`、`mcp-config-merge.mjs:36/58/85` | 直调 backup/merge 各函数，断言备份落盘 + 合并保留用户 delta |
| D9-10 | P1 | MCP remote transport | `mcp-server-remote.mjs:11` `startRemoteServer()`、`:8` DEFAULT_PORT 9528 | 启动 remote server，断言监听 9528 + HTTP/WS 可用 |
| D9-11 | P1 | WebSocket 隧道通道生命周期 | `ws-exec/hwlink-tunnel-channel.mjs:27` `class HwlinkTunnelChannel`、`:268` export | 直调类，断言 connect/disconnect/心跳/重连 |
| D9-12 | P0 | initialize 握手协议安全基线 | `mcp-protocol.mjs` `_decorateResult/_resetHintConsumption` | 跑 protocol-probe.mjs 或直调 initialize，断言 protocolVersion+capabilities+serverInfo；**注意：真实状态 FAIL（6 客户端 FAIL）** |
| D9-13 | P0 | tools/call 凭证不泄露与权限校验 | `auth/credentials.mjs` `setRuntimeCredentials/clearRuntimeCredentials` + `consumeApprovalToken`（审批令牌一次性） | 直调后核对返回不含 AK/SK/token 明文 + 审批令牌 consume 后失效 |

## 二、探针类（2 条）—— 探针已存在，直接跑

| ID | 优先级 | 用例 | 探针 | 正确做法 |
|---|---|---|---|---|
| D9-4 | P1 | 协议生命周期 | `eval/harness/protocol-probe.mjs`（注释明确「覆盖 D9-4」） | `node eval/harness/protocol-probe.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs` |
| D9-5 | P1 | stdio 传输健壮 | `supplement-probe.mjs`（D9 协议探针） | 跑探针，断言 stdio 帧解析/异常输入不崩 |

## 三、真机类（1 条）—— 真云凭证已具备，红线禁止以「需真机」阻塞

| ID | 优先级 | 用例 | 正确做法 |
|---|---|---|---|
| D3-S4 | P1 | 场景-领券闭环 | 真云凭证已具备（credentials.json 就绪），真机执行 voucher_status→voucher_claim→voucher_status 状态翻转闭环。其他 9 客户端均真机 PASS |

## 四、Codex 须遵守的三条判据（避免再犯）

1. **「函数存在」就源码核对，不是 BLOCKED**：blockedReason 写「源码核对(函数存在)」是自相矛盾——函数存在恰恰说明可源码核对。
2. **探针已存在就跑探针**：protocol-probe/supplement-probe 现成，不得以「无静态可核对依据」搪塞。
3. **真云已具备就真机执行**：不得以「需真机/真实CLI」标 BLOCKED（红线明确）。

## 五、两条真缺陷（D8-9、D9-12）的正确回填

- **D8-9**：真实状态应为 FAIL（AtomCode/Fail 等 4 客户端 FAIL）+ SPEC-MISMATCH，不是 BLOCKED。Codex 应源码核对后如实标 FAIL 并补根因。
- **D9-12**：真实状态 FAIL（DSH/Hermes/OpenCode 等 6 客户端 FAIL）。Codex 应跑 protocol-probe 后如实标 FAIL，补根因（文件+行号）。