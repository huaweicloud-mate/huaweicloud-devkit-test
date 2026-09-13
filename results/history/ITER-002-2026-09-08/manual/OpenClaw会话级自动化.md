# ITER-002-2026-09-08 OpenClaw 客户端会话级（testbot1，CLI 自动化）

## 结论：✅ G1 + G2 全通过（最简洁的自动化路径）

## 路径

```
testbot1（Linux）：OpenClaw 2026.8.2 CLI（~/.openclaw/bin/openclaw，模型已配 deepseek-v4-pro-0813）
→ huaweicloud-devkit install --target openclaw（插件）
→ openclaw mcp set huaweicloud-devkit {"command":"node","args":[<mcp-server.mjs>]}（注册 MCP）
→ openclaw agent --local --message "用 huaweicloud_devkit 只读工具查询 ECS…"
```

## 会话结果（真实）

```
{"count": 0, "servers": []}   ← 真实 ECS 查询返回
agent 分析：当前凭证账号默认区域确实无 ECS 实例；或区域定位偏差；
          建议换区域或 list_regions 确认 —— 正确推理 + 后续建议
agent run ended stopReason=stop（会话正常完成）
```

- **G1 工具可用**：✅（mcp set 后 agent 会话内调 huaweicloud 工具）
- **G2 只读调用**：✅ 真实查询成功 + 正确解释

## 跨客户端会话级矩阵（更新）

| 客户端 | G1 | G2 | 方式 |
|---|---|---|---|
| Hermes / OpenCode | ✅ | ✅ | 会话/CLI |
| OpenClaw | ✅ | ✅ | **CLI（最简）** |
| WorkBuddy | ⚠️ 需激活 | ✅ | CDP |
| OfficeAce | ❌ 离线 | ✅ | CDP |
| DSH | ✅ 29 技能 | ⏳ approval | 浏览器 |
| AtomCode/CodeArts Space | 待测 | 待测 | testbot1 残留/win120 CDP |

## 复现

- tb1-openclaw*.py（探测/注册/会话）；关键命令：install --target openclaw + mcp set + agent --message