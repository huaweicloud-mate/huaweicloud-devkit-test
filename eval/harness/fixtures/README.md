# eval/harness/fixtures — Issue #7 批次② 夹具/harness

批次②（7 项 P1 阻塞）可执行夹具/harness。每项独立 `.mjs` 脚本，可直接运行并输出**新鲜证据**到 `--evid <dir>` 指定的证据目录（保留脱敏日志、manifest、前后快照）。

## 用法

所有脚本统一签名：`node <script> <hdk src> [--evid <dir>]`

- `<hdk src>`：被测软件 `huaweicloud-devkit` 的 `plugins/huaweicloud-core/src` 绝对路径
- `--evid <dir>`：可选；输出 `<case>/stdout.txt` 证据归档（默认仅控制台）

批量运行全部 8 项：

```bash
node eval/harness/fixtures/run-all.mjs <hdk src> [--evid <dir>]
```

## 清单

| 用例 | 脚本 | 用途 | 本机可跑 | BLOCKED 条件 |
|---|---|---|---|---|
| D2-10 | `d2-10-koocli-profile.mjs` | KooCLI 多 profile 夹具（current=deploy 切换 → resolveManagedProfile/runHcloudConfigure --cli-profile=） | ✅ | 无 |
| D2-13 | `d2-13-s1-env.mjs` | 隔离 S1 + HW_ACCESS_KEY env 夹具（configuredBySession 优先→env 兜底） | ✅ | 无 |
| D9-9 | `d9-9-delay-timeout.mjs` | 可注入延迟夹具（30s 挂起）+ tools/call 超时协议语义（-32000/timeout、取消通知、重建连接） | ✅ | 取消能力=SPEC 待裁决（按 capabilities 实测标注不假定） |
| D9-10 | `d9-10-remote-transport.mjs` | remote transport harness（127.0.0.1:9528 监听 + initialize/tools/list 与 stdio 对照） | ✅ | 无 |
| D9-11 | `d9-11-ws-tunnel.mjs` | WebSocket mux 生命周期 harness（attach→onopen→ready→close 清理/幂等） | ✅ | 无 |
| D9-6 | `d9-6-cross-client.mjs` | 跨客户端互通冒烟（≥2 客户端 initialize/tools/list/call/resources + 官方 MCP Inspector 校验通道） | ✅ | Inspector 未装时以 stdio 双客户端互证 |
| EXP-D5-2-1 | `exp-d5-2-1-codex-discovery.mjs` | Codex 客户端插件发现/加载清单会话 harness | ⚠️ | 本机无 Codex 客户端 → BLOCKED（清单静态校验仍执行） |
| EXP-D5-2-3 | `exp-d5-2-3-codex-tools-enum.mjs` | Codex 客户端 tools/list 枚举 harness（40 工具/schema/diff） | ⚠️ | 本机无 Codex 客户端 → 宿主层 BLOCKED（协议基线已枚举） |

## 判定口径

- 不含宿主硬依赖的项（D2-10/D2-13/D9-9/D9-10/D9-11/D9-6）：本地执行即可获得真实 PASS/FAIL。
- EXP-D5-2-1/2-3 依赖 **Codex 客户端真实宿主**（插件发现/加载会话、宿主层 tools/list 通道枚举）。夹具已提供宿主检测与协议层基线；宿主未安装时按设计然（BLOCKED）归档，测试机（已配 AK/SK + 客户端）就绪后宿主层即转 PASS。
- 时间断言遵循规范：超时/生命周期窗口用范围断言（≤ 阈值/2s 窗口/幂等计数），不禁毫秒级相等比较。