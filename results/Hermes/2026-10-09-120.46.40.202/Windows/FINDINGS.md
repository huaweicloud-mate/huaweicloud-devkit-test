# FINDINGS

## #1【P0】D4-2 凭证环境变量检测盲区

- **现象**: `classifyTextCommand` 对 `env | grep HW_SECRET` 和 `echo %HW_ACCESS_KEY%` 未拦截（返回 allow）
- **断言**: 以下命令应被 deny：`env | grep HW_SECRET` → 实际 allow；`echo %HW_ACCESS_KEY%` → 实际 allow
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:399` — env-dump 门控正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 不匹配 `HW_SECRET`；`safety-policy.mjs:418` — 凭证变量引用正则仅匹配 Unix-style `$HW_ACCESS_KEY`，不匹配 Windows-style `%HW_ACCESS_KEY%`
- **影响**: 攻击者可通过 `env | grep HW_SECRET` 或 `echo %HW_ACCESS_KEY%` 绕过凭证环境变量打印拦截
- **证据**: `evidence/D4-2/stdout.log`

## #2【P1】EXP-E 评测集 serviceCatalog 路由 MISS (21.4% 准确率)

- **现象**: serviceCatalog 对 15 条中文评测意图中 11 条 MISS，返回 "Run hcloud --help to list available services" 而非路由到对应云服务
- **断言**: 路由准确率 ≥ 90%，实际 21.4% (3 HIT / 14 HIT+MISS)
- **根因**: `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由映射表对中文自然语言意图覆盖不完整
- **影响**: 用户中文自然语言意图无法正确路由到对应华为云服务，影响用户体验
- **证据**: `evidence/EXP-E01/` 至 `evidence/EXP-E14/` 的 stdout.log
