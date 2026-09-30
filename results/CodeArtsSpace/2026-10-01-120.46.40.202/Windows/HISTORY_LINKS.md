# 历史问题关联清单

> FINDINGS 命中历史 issue，不重复开单。以下为关联的历史 issue：

## 核心关联（同一根因）

- **#705**: [serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足
  URL: https://github.com/huaweicloud/huaweicloud-devkit/issues/705
  状态: open
  说明: 本次每日测试 (v1.1.8-next.1) 复现同一缺陷，serviceCatalog 中文意图路由准确率仍为 21.4%

## 相关修复 PR

- **#789**: feat: #788 expand serviceCatalog routeMap for Chinese compound intent splitting and phased routing
  URL: https://github.com/huaweicloud/huaweicloud-devkit/pull/789
- **#768**: fix(catalog): route troubleshooting intent to explain_error (#766)
  URL: https://github.com/huaweicloud/huaweicloud-devkit/pull/768
- **#764**: fix: #762 deploy_check port fallback + CJK routeMap keywords
  URL: https://github.com/huaweicloud/huaweicloud-devkit/pull/764
- **#753**: fix(tools): route CJK+ASCII mixed intents to multiple services
  URL: https://github.com/huaweicloud/huaweicloud-devkit/pull/753

## 相关历史测试报告

- **#828**: v1.1.7 版本全量测试缺陷合并单（5 项）
- **#826**: v1.1.7 每日测试缺陷合并单（1 项）
- **#805**: Hermes 2026-09-23 EXP-E01~E14 路由基线
- **#786**: v1.1.5 每日测试缺陷合并单（2 项）
- **#767**: v1.1.5 每日测试缺陷合并单（4 项）
- **#762**: v1.1.5 每日测试缺陷合并单（3 项）
