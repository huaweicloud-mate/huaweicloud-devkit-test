# huaweicloud-devkit-test

HuaweiCloud DevKit 插件**测试体系归档仓库**：规划 / 用例 / 模板 / 执行结果 / 度量 / 评测。

> 被测对象：https://github.com/huaweicloud/huaweicloud-devkit
> 当前基线：`<被测插件 commit，T0 首轮执行时填写并归档至 results/ITER-001/baseline.md>`
> 项目状态：**准备阶段**（组 1–8 清单推进中，尚未执行首轮 T0）

## 目录导航

| 路径 | 内容 |
|---|---|
| [docs/](docs/) | 测试规划 v1.3 / 评审报告 / 执行准备清单 / 目录结构规划 / 团队评审稿 |
| [test-cases/](test-cases/) | 用例体系母版：设计级 92 + 展开级 107（可复现生成，含 README 编号规则） |
| [templates/](templates/) | 6 个模板：每晚报告 / 客户端矩阵 / 安全审计 / 缺口表 / 仪表盘 / issue |
| [results/](results/) | 执行结果归档（`ITER-NNN-日期`，命名规则见 results/README.md） |
| [metrics/](metrics/) | 跨迭代执行率 / 通过率 / 缺陷趋势 / 质量仪表盘 |
| [eval/](eval/) | D10 Agent 行为评测：评测集 / harness / 结果 / 趋势（纪律见 eval/README.md） |
| [scripts/](scripts/) | 工具脚本（规划中：前置检查 / 脱敏断言 / 链接扫描 / 归档） |
| [assets/](assets/) | 可视化素材（规划中：金字塔 / 缺口热力图 / 框架总览图） |

## 文档清单（docs/）

| 文件 | 说明 |
|---|---|
| [01-测试规划.md](docs/01-测试规划.md) | **主文档 v1.3**：10 维度 / 199 用例 / 四级金字塔 / P·G·I 纪律 / 执行分层 |
| [02-测试规划评审报告.md](docs/02-测试规划评审报告.md) | 测试经理评审（84 → 93 分演进） |
| [03-执行准备清单.md](docs/03-执行准备清单.md) | 8 组可勾选准备清单（是否就绪） |
| [05-归档仓库目录结构.md](docs/05-归档仓库目录结构.md) | 本仓库目录结构设计原则与命名规则 |
| [测试体系-评审稿.html](docs/测试体系-评审稿.html) | **团队评审用单文件**（固定导航 / 199 用例全量表 / 6 个评审决策点） |

## 快速开始（跑一轮测试）

1. 完成 [docs/03-执行准备清单.md](docs/03-执行准备清单.md) —— 8 组全部 ✅
2. 执行 T0 基线对齐（clone 上游 / 记录 commit / 能力清单核对 / 环境重置）→ 写入 `results/ITER-001/baseline.md`
3. 每轮执行结束，按 [results/README.md](results/README.md) 的 ITER 结构归档（归档脚本 `scripts/archive-result.ps1` 规划中，暂手动建目录）
4. 每迭代末更新 [templates/dashboard.md](templates/dashboard.md) 质量仪表盘（复制到 metrics/dashboard.md 填写），按 [templates/issue-template.md](templates/issue-template.md) 拆 issue 提交上游

## 安全红线

- **AK/SK/密钥永不入库**（.gitignore 已锁定 22 条忽略规则，含凭证/密钥/缓存/证据模式并经 ad-hoc 验证；凭证纪律见 01-测试规划 §2.3）
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
- **安全**：提交身份为仓库级 shuangheaven；敏感文件由 .gitignore 22 条规则封锁，自动 `git add -A` 不会带入任何凭证

## 相关链接

- 上游仓库：https://github.com/huaweicloud/huaweicloud-devkit
- 用例矩阵生成：`test-cases/design/gen_matrix.py`（修改后重新生成，保证可复现）
- 评审稿生成：`test-cases/gen_review_html.py`（评审稿 HTML 由脚本 + CSV 数据生成）