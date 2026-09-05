# huaweicloud-devkit-test

HuaweiCloud DevKit 插件**测试体系归档仓库**：规划 / 用例 / 模板 / 执行结果 / 度量 / 评测。

> 被测对象：https://github.com/huaweicloud/huaweicloud-devkit
> 当前基线：<填写被测插件 commit，首次 T0 时更新>

## 目录导航

| 路径 | 内容 |
|---|---|
| [docs/](docs/) | 测试规划（v1.3）/ 评审报告 / 执行准备清单 / 纪律 |
| [test-cases/](test-cases/) | 用例体系母版（设计级 92 + 展开级 107，可复现生成） |
| [templates/](templates/) | 报告 / issue / 缺口表 / 仪表盘模板 |
| [results/](results/) | 执行结果归档（`ITER-NNN-日期`，见 results/README.md） |
| [metrics/](metrics/) | 跨迭代执行率 / 通过率 / 缺陷趋势 / 质量仪表盘 |
| [eval/](eval/) | D10 Agent 行为评测集 / harness / 结果 / 趋势 |
| [scripts/](scripts/) | 前置检查 / 脱敏断言 / 链接扫描 / 归档脚本 |
| [assets/](assets/) | 测试金字塔 / 缺口热力图 / 框架总览图 |

## 快速开始（跑一轮测试）

1. 完成 [docs/03-执行准备清单.md](docs/03-执行准备清单.md) —— 8 组全部 ✅
2. 执行 T0 基线对齐（clone 上游 / 记录 commit / 能力清单核对）→ 写入 `results/ITER-001/baseline.md`
3. 每轮执行后运行 `scripts/archive-result.ps1` 归档（自动生成 ITER 骨架）
4. 每迭代末更新 `metrics/dashboard.md`，按 [templates/issue-template.md](templates/issue-template.md) 拆 issue 提交上游

## 安全红线

- **AK/SK/密钥永不入库**（.gitignore 已锁定；凭证纪律见 docs/01 §2.3）
- `evidence/` 只存**脱敏后**内容，原始凭证/未脱敏日志禁止入库
- 本仓库只含测试资产，不含插件源码与任何云凭证

## 关键文档

- [测试规划 v1.3](docs/01-测试规划.md)：10 维度 / ~207 用例 / 四级金字塔 / P·G·I 纪律
- [用例体系说明](test-cases/README.md)：编号规则与用例演进三铁律

## 相关链接

- 上游仓库：https://github.com/huaweicloud/huaweicloud-devkit
- 用例矩阵生成：`test-cases/design/gen_matrix.py`（修改后重新生成，保证可复现）