# HISTORY_LINKS — CodeArtsSpace/Windows 2026-09-20

本次测试发现的 2 项缺陷（D4-2, D4-3）均命中历史 issue，不重复开单。

## 历史关联清单

### #561 [open] [规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖

- **仓库**: huaweicloud/huaweicloud-devkit
- **状态**: open
- **URL**: https://github.com/huaweicloud/huaweicloud-devkit/issues/561
- **标题**: [规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）
- **关联用例**: D4-2 (凭证env打印拦截), D4-3 (明文secret参数拦截)
- **匹配说明**: 该 issue 明确描述了 risk-rule-engine 对 `echo $HW_SECRET_KEY` 和 `--adminPass` 参数零覆盖的问题，与本次测试 D4-2/D4-3 的发现完全一致
- **本次复核结论**: v1.1.5 仍存在该问题，hook_check_command 对 `echo $HW_SECRET_KEY` 和 `hcloud ECS CreateServers --adminPass MySecret123` 均返回 decision:allow

## 处理方式

- 不重复开单（命中 #561 强关联）
- 在 #561 追加复核评论，附本次测试结果
