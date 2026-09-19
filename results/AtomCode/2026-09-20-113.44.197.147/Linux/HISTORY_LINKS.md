# HISTORY_LINKS — 历史问题关联清单（AtomCode 2026-09-20）

> 生成时间：2026-09-20 北京
> 依据：提单前对上游仓 `huaweicloud/huaweicloud-devkit` open issues（80 条）做用例号+语义查重。
> 以下缺陷在历史 open issue 中已有同源记录，本日不再重复开单，仅保留关联关系。

| 本日发现 | 级别 | 关联历史单 | 说明 |
|---|---|---|---|
| D4-2 凭证 env 打印拦截（`env | grep HW_SECRET_KEY` 漏拦） | P0 | #731（fix: D4-2/D4-16/D9-2）、#677 | 已有修复单，v1.1.5 仍复现特定 HW_ 前缀形态 |
| D4-16 命令包裹穿透（`sh -c "env | grep HUAWEICLOUD"`） | P0 | #731、#677 | 已有修复单 |
| D4-6 adminPass 空格形式值未脱敏 | P1 | #735（fix: D4-3/D4-6）、#712 | 已有修复单，空格形式仍在 |
| D4-27 文本裸 token=/小写 ak/sk 未脱敏 | P1 | #726（D4-27 裸 token）、#729 | 已有修复单（redact bare token=），小写 ak/sk 仍未覆盖 |
| D9-2 JSON-RPC 错误码不规范 | P1 | #731 | 已有修复单 |
| D10-3 中文意图路由准确率仅 21.4% | P1 | #705（serviceCatalog 中文意图路由准确率仅 21.4%） | 同一路由覆盖率问题 |

> 结论：6 项命中历史缺陷单，不重复开单；其余 9 项为新发现，已统一合一张缺陷单（见 FINDINGS.md 提单）。