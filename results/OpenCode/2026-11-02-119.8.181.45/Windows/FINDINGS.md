# FINDINGS — OpenCode Windows 2026-11-02

## F-001: serviceCatalog 路由未命中中文自然语言查询"查云主机"

- **级别**: P1
- **用例ID**: EXP-E01
- **描述（现象）**: 用户输入"帮我查一下我账号在华北北京四有哪些云主机"，期望路由到 ECS 服务，实际返回 fallback "Run hcloud --help to list available services."
- **断言（唯一可判定）**: serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") 的 recommendedServices 应包含 "ECS"，实际 recommendedServices 为空数组，返回 fallback
- **根因（文件:行号）**: `plugins/huaweicloud-core/src/tools.mjs:2450` — `recommendedServices` 数组为空时返回 `['Run hcloud --help to list available services.']`。上游关键词匹配逻辑（serviceCatalog 函数 line 2195~2440）未将"云主机"识别为 ECS 关键词，导致 recommendedServices 未填充 ECS
- **证据**: `eval/harness/run-eval.mjs` 输出 `EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help to list available services.`；eval 结果文件 `eval/results/eval-run-20261101211316.csv`
- **影响范围**: 中文自然语言查询中包含"云主机"但不含"ECS"/"服务器"等关键词时，路由失败，用户无法通过自然语言直达 ECS 操作
- **建议修复**: 在 serviceCatalog 关键词匹配逻辑中增加"云主机"→ ECS 的映射（"云主机"是华为云控制台对 ECS 的中文标准称呼）
