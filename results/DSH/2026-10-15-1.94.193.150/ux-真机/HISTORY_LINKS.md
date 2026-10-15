# 历史问题关联清单（不重复提单）

> 生成说明：本批 DSH 真机专项发现的 3 项需求未实现，经 `scripts/file_issue.py` 查重命中上游仓已有历史 issue，**本次不新开单**，仅记录关联。DSH 真机复现证据与复现命令见同目录 `FINDINGS.md` 与 `evidence/`。

## D11-13 登录后自检五项与中文体检摘要未实现（UX-R3/R6）
- 今日 DSH 证据：`results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence/D11-13/{stdout.txt,result.json}`
- **关联历史单（已作为缺陷提过，本次为真机复核）**：
  - [#916](https://github.com/huaweicloud/huaweicloud-devkit/issues/916)（open）【UX体验用例真机专项】huaweicloud-devkit v1.1.9-next.0 需求未实现合并单（D11-13 / D11-34，2 项）

## D11-34 资源归零中文报告未实现（UX-R12）
- 今日 DSH 证据：`results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence/D11-34/{stdout.txt,result.json}`、真建真删 `.../evidence/D11-34-真机-e2e/`
- **关联历史单**：
  - [#916](https://github.com/huaweicloud/huaweicloud-devkit/issues/916)（open）【UX体验用例真机专项】huaweicloud-devkit v1.1.9-next.0 需求未实现合并单（D11-13 / D11-34，2 项）

## D11-38 独立可观测面自述轨 effective 契约未实现（UX-R2/R4 三轨一致缺失）
- 今日 DSH 证据：`results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence/D11-38/{stdout.txt,result.json}`
- **关联历史单**：
  - [#917](https://github.com/huaweicloud/huaweicloud-devkit/issues/917)（open）【UX体验用例真机专项·第2批】huaweicloud-devkit v1.1.9-next.0 需求未实现：D11-38 独立观测双轨（范式③三轨一致）

> 结论：本批 DSH 真机专项 3 条 P1 缺陷均为「需求未实现」，与 Hermes（#916）、testbot4-win-Opencode（#917）已核实一致，未新增缺陷单；BLOCKED 2 条（D11-35 无沙箱、D11-42 夹具自身异常）与 D11-24 环境边界均在 FINDINGS.md 记录。
