# ITER-001-2026-09-05 补测批次（D8-3/D9-2/D6-1/D10-5/D4-12，2026-09-07）

## 结果：5/5 完成

| 用例 | 结果 | 证据 |
|---|---|---|
| **D8-3 中英一致性** | ✅ | EN/ZH 标题 25=25 完全对称、命令示例 57=57（差异仅为翻译文本，正常） |
| **D9-2 协议错误封装** | ✅ | 缺必填参数 → `{ok:false,error:"Skill name is required."}`（友好业务错误）；未知工具 → JSON-RPC -32603 结构化（含正确工具名）；非法类型 → 宽松容忍执行 → **观察：参数类型未严格校验（P3 观察，建议补类型检查）** |
| **D6-1 超时机制** | ✅ | timeoutMs 参数存在（默认 60000）+ invoke-mcp 层 TIMEOUT 分支已验证（25s）；真实网络 hcloud <2s 未触发 |
| **D10-5 多轮扩展（4 轮）** | ✅ | 轮1 查 ECS/规格 → 轮2 正确答"0 台+最大 e7.96xlarge.21"→ 轮3 方案 A（OBS 托管）最省钱 → 轮4 服务清单（免费项/免费额度/纯计费分层）——**上下文延续 4 轮全对** |
| **D4-12 供应链（轻量）** | ✅ | hermes(1.1.1): undici 实装 8.10.2 = 锁文件 ✅；opencode(next.15): 8.10.1 = 8.10.1 ✅ |

## 复现

- test-cases/d8-d4-d6-local.py（D8-3/D4-12）
- test-cases/d9-error-probe.mjs（D9-2）
- test-cases/remote-d105.py（D10-5）

## 观察记录

- OBS-3（P3 观察）：MCP 工具参数类型未严格校验（timeoutMs='not-a-number' 被容忍）——建议输入 schema 类型校验或运行期类型断言
- D10-5 全程 agent 用 bash 直连 hcloud（OBS-2 行为再证：OpenCode agent 查询偏好 bash 而非 MCP run_readonly）