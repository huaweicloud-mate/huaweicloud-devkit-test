# huaweicloud-devkit-test

> 时间格式约定：文档正文和表格使用北京时间时间戳 `YYYY-MM-DD HH:mm:ss`（如 `2026-09-10 19:35:00`）；Windows 文件名和目录使用紧凑时间戳 `YYYYMMDDHHmmss`。不使用 ISO 8601（`T`/`+08:00`）形式。历史归档保留原始命名和事实日期，不凭空补造缺失的时分秒。

HuaweiCloud DevKit 插件**测试体系归档仓库**：规划 / 用例 / 模板 / 执行结果 / 度量 / 评测。

> 被测对象：https://github.com/huaweicloud/huaweicloud-devkit
> 当前基线：**1.1.1 正式版**（迭代基线 `dev` @ 74b9642 = 1.1.1-next.16，对照 `main` @ bcefb32；2026-09-07 发布正式版并冒烟 PASS）
> 项目状态：**ITER-002-2026-09-08 执行完成**（跨客户端会话级 7 客户端 · 安全门禁缺陷族 #557/#558/#559 · OfficeAce 连接修复+根因 #560 · RDS 真云 E2E · 详见 [results/LATEST.md](results/LATEST.md) + [收尾总结](results/ITER-002-2026-09-08/收尾总结.md)）

## 目录导航

| 路径 | 内容 |
|---|---|
| [docs/](docs/) | 测试规划 v1.3 / 评审报告 / 执行准备清单 / 目录结构规划 / Hermes-Codex 闭环规范 / 团队评审稿 |
| [test-cases/](test-cases/) | 用例体系母版：设计级 163 + 展开级 137 = 300 条（CSV 真源，gen_matrix.py 可复现生成；设计级 14 列含「用例当前状态」（预期结果与当前状态分离，2026-09-11）；展开级 12 列结构化状态：NR3 25 行 + D1-58 白名单 5 行含 status/blockedReason/requiredEvidence/observedAt；追踪表 tracing/需求-设计-证据追踪表.csv 169 行；门禁 verify_new.py（27 项 exit 码）/scan_gaps.py；R10-R12 补充 10 条设计级 D1-56~58、D2-21、D3-C7~9、D4-24、D6-8、D9-9 + D1-58 专属展开 5 行） |
| [templates/](templates/) | 8 个模板：每晚报告 / 客户端矩阵 / 安全审计 / 缺口表 / 仪表盘 / issue / Hermes-Codex 交接状态 / 多终端矩阵 |
| [reviews/](reviews/) | 测试设计评审归档（Hermes/Codex 轮次、决策、放行状态和多终端矩阵） |
| [results/](results/) | 测试执行结果归档（`ITER-NNN-时间戳`，命名规则见 results/README.md） |
| [metrics/](metrics/) | 跨迭代执行率 / 通过率 / 缺陷趋势 / 质量仪表盘 |
| [eval/](eval/) | D10 Agent 行为评测：评测集 / harness / 结果 / 趋势（纪律见 eval/README.md） |
| [scripts/](scripts/) | 工具脚本：hdk-secrets.ps1（DPAPI 凭证加密）/ sync-to-remote.ps1（每日 20:00 自动同步） |
| [assets/](assets/) | 可视化素材（规划中：金字塔 / 缺口热力图 / 框架总览图） |

## 文档清单（docs/）

| 文件 | 说明 |
|---|---|
| [01-测试规划.md](docs/01-测试规划.md) | **主文档 v1.3**：10 维度 / 285 用例（矩阵 CSV 真源）/ 四级金字塔 / P·G·I 纪律 / 执行分层 |
| [02-测试规划评审报告.md](docs/02-测试规划评审报告.md) | 测试经理评审（84 → 93 分演进） |
| [03-执行准备清单.md](docs/03-执行准备清单.md) | 8 组可勾选准备清单（是否就绪） |
| [05-归档仓库目录结构.md](docs/05-归档仓库目录结构.md) | 本仓库目录结构设计原则与命名规则 |
| [06-Hermes-Codex测试设计评审闭环.md](docs/06-Hermes-Codex测试设计评审闭环.md) | Hermes 生成、Codex 评审、反复修订直到 `TEST_DESIGN_READY` 的固定流程 |
| [测试体系-评审稿.html](docs/测试体系-评审稿.html) | **团队评审用单文件**（固定导航 / 285 用例全量表 / 6 个评审决策点） |

## 快速开始（跑一轮测试）

1. 完成 [docs/03-执行准备清单.md](docs/03-执行准备清单.md) —— 8 组全部 ✅
2. 新需求先按 [Hermes-Codex 测试设计评审闭环](docs/06-Hermes-Codex测试设计评审闭环.md) 往复评审，评审产物归档到 `reviews/ITER-<NNN>-<YYYYMMDDHHmmss>/`
3. 只有出现 `TEST_DESIGN_READY` 后才执行测试；T0 基线和执行证据写入 `results/ITER-<NNN>-<YYYYMMDDHHmmss>/`
4. 每轮执行结束，按 [results/README.md](results/README.md) 的 ITER 结构归档（归档脚本 `scripts/archive-result.ps1` 规划中，暂手动建目录）
5. 每迭代末更新 [templates/dashboard.md](templates/dashboard.md) 质量仪表盘（复制到 metrics/dashboard.md 填写），按 [templates/issue-template.md](templates/issue-template.md) 拆 issue 提交上游

## 安全红线

- **AK/SK/密钥永不入库**（.gitignore 已锁定 23 条忽略规则，含凭证/密钥/缓存/证据模式并经 ad-hoc 验证；凭证纪律见 01-测试规划 §2.3）
- **凭证存储方案**：AK/SK 用 `scripts/hdk-secrets.ps1`（DPAPI 加密）存本机 `~\.hdk-secrets\credentials.bin`，运行前 `Get` 注入环境变量 `HW_ACCESS_KEY/HW_SECRET_KEY`；密钥只在本机解密、发往华为云 API（详见 scripts/hdk-secrets.ps1 头注释）
- `evidence/` 只存**脱敏后**内容，原始凭证/未脱敏日志禁止入库
- 本仓库只含测试资产，不含插件源码与任何云凭证

## Git 协作（凭据说明）

本机 git 全局凭据管理器（GCM）缓存了非 shuangheaven 的 token，与本仓库冲突会导致 `git push` 报 404（认证成功但无权限）。本仓库已配置 gh 凭据别名，**日常推送请用**：

```bash
git pushm    # 推送（等同 push，走 gh 凭据）
git fetchm   # 拉取
git pullm    # 拉取并合并
```

注意：

- 别名仅在**本仓库**生效，不影响其他仓库
- 执行前确认 gh 活跃账号：`gh auth switch --user shuangheaven`
- 长期方案（可选）：`gh auth setup-git` 让 git 全局走 gh 凭据——需自行评估对本机其他仓库的影响

## 自动同步工作流（本地修改 → 定时上传）

- **本地工作区 = 本仓库目录**：所有测试产出**直接写入**本目录（docs / test-cases / templates / results / metrics / eval / scripts），改完即完
- **`scripts/sync-to-remote.ps1`**：有变更才提交（commit message 含时间戳 + 变更文件摘要），推送走 gh 凭据；无变更零操作（幂等）；失败记录日志、下次自动重试
- **Windows 计划任务 `devkit-test-auto-sync`**：**每天 20:00（北京时间）自动同步**（查询：`schtasks /Query /TN devkit-test-auto-sync`）
- **临时同步（需即推即达时）**：手动触发 `schtasks /Run /TN devkit-test-auto-sync`，或在仓库目录直接运行 `scripts/sync-to-remote.ps1`
- **运行日志**：`%LOCALAPPDATA%\Hermes Agent CN Desktop\data\hermes-home\logs\devkit-test-sync.log`
- **安全**：提交身份为仓库级 shuangheaven；敏感文件由 .gitignore 23 条规则封锁，自动 `git add -A` 不会带入任何凭证

## 相关链接

- 上游仓库：https://github.com/huaweicloud/huaweicloud-devkit
- 用例矩阵生成：`test-cases/design/gen_matrix.py`（修改后重新生成，保证可复现）
- 评审稿生成：`test-cases/gen_review_html.py`（评审稿 HTML 由脚本 + CSV 数据生成）
