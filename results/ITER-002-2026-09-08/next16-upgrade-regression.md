# ITER-001-2026-09-05 next.16 升级与增量回归（2026-09-07）

## 升级记录

- 本机 Hermes 插件：1.1.1-next.15 → **1.1.1-next.16**（`npx huaweicloud-devkit@next install --target hermes`）
- 本地源码：dev @ **74b9642**（PR #506）
- MCP 工具需重启会话后加载 next.16（当前会话仍为旧进程；CLI/源码层验证不受影响）

## 已测结论复检（74b9642 / next.16）

| 结论 | 复检 | 结果 |
|---|---|---|
| P0-1 hook 盲区 | 规则引擎直调复跑 | ✅ 仍在（4 操作；issue #501 有效） |
| D5-3 工具枚举 | tools-enum.py | ✅ 37/37 一致 |
| rules 规则集 | 15→15 无增删（内容微调） | ✅ 无新增缺口 |

## next.16 增量修复回归（web-port 规则）

| 场景 | 期望 | 实际 | 结果 |
|---|---|---|---|
| 安全组开放 80（web） | allow | allow | ✅ 误报修复生效 |
| 安全组开放 443（web） | allow | allow | ✅ |
| 开放 22（ssh） | deny | deny（hwc-network-public-admin-port） | ✅ 拦截保留 |
| 开放 3306/6379 | deny | deny | ✅ |
| 自然语言"22 台服务器" | allow | allow | ✅ 无新误报 |
| nginx listen 80 普通配置 | allow | allow | ✅ 不误报 |

- 复现脚本：test-cases/webport-regression.mjs（7 断言，node 直跑）
- 修复定性：旧 regex 误匹配 "port" 关键词（80/443 也报）→ 新 regex 仅匹配敏感端口号清单（22/3389/3306/5432/6379/9200/27017/1433/2375/2376/5900/11211/8080/8443）——**修复正确且无回归**（PASS）

## 归档说明

- 已测结论全部保持有效；web-port 修复验证通过；无新增缺口
- 下一轮（ITER-002）起点：dev @ 74b9642 / Hermes 插件 next.16（重启后 MCP 工具为 16 版）