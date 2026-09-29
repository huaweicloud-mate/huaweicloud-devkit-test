# MAINTAINER-REVIEW — 维护者复核记录（OfficeAce）

> 本文件由维护者追加，非客户端自产；未代执行、未代改标定。
> 落盘：`results/OfficeAce/2026-09-29-188.239.14.150/Windows/MAINTAINER-REVIEW.md`

## 一、evidencePath 回填指向不存在（106 条）

- 现象：设计级 79 条 + 展开级 27 条标 PASS 的用例，`evidencePath` 列填 `evidence/<case-id>/`，但该目录不存在（证据实际按维度组织，探针落在 `evidence/d1-upgrade/probe-*.mjs` 等维度目录，未按用例 ID 建独立目录）。
- 性质：**非虚报**——`probe.mjs` 为真实代码（空壳率 0，`verify_no_fake_pass` 复核探针非空壳），是证据组织方式未按 AGENTS.md「证据组织约定」（每个用例建独立 `evidence/<case-id>/` 目录）执行，导致 `evidencePath` 指向不存在的路径。

## 二、处置过程

- 已更新 AGENTS.md「证据组织约定」节（commit `e53c635a`），明确 `evidence/<case-id>/` 组织规范。
- 已发「补证据重组」触发语（2026-09-29 北京 11:40 起），令其按新约定重组证据 + 回填 `evidencePath` + push。
- 结果：未完成。`~/.openclaw/shim-trace.log` 尾部 rnd 62~84 显示模型走 LLM 直调、反复探查（`git status`/`git log`、`python -c` 读 CSV 表头、写检查脚本），持续 ~40 分钟无 `git add/commit/push`（零回填）。

## 三、根因定性（待运维）

- 命中 openclaw shim「已知天花板」：办公助手出身的模型在多轮 function-call 循环里，对「证据重组 + git commit/push」这类带副作用的收尾动作收不住手，倾向反复探查而不下手。
- 属单设备模型行为，非配置（重写 shim / 换 pro 模型 / 放宽 guard）能进一步修复。

## 四、结论与建议

- OfficeAce 当日 106 条 `evidencePath` 修复挂起，属「测试执行侧」问题，**非测试结论问题**（探针真实、缺陷已正常提交 FINDINGS 待提单）。
- 待运维：换原生 coding-agent runtime（代价=失去 OfficeAce 办公助手客户端身份）或等产品侧支持；修复前 OfficeAce 的 `evidencePath` 完整性不纳入通过率硬门禁。