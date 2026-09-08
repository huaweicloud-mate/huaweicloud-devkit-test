> ✅ 已提交独立 issue #564（2026-09-09）

## 现象（1.1.2-next.4 基线实测）

`evaluateCommandRisk`（`plugins/huaweicloud-core/src/risk-rule-engine.mjs`，`huaweicloud_hook_check_command` 底层）对**异常/畸形输入不做类型归一，一律返回 allow 且 findings 空**：

| 输入 | decision | findings |
|---|---|---|
| `null` | **allow** | 无 |
| `undefined` | **allow** | 无 |
| `12345`（数字） | **allow** | 无 |
| `{cmd:'x'}`（对象） | **allow** | 无 |
| 超长命令（2000×"verylongcmd "） | **allow** | 无 |
| 空字符串 `''` | **allow** | 无 |

- 基线：**1.1.2-next.4（608b120）**
- **对照**：同一批异常输入传入写命令规划门 `planHcloudCommand` 时**全部 deny**（`risk=invalid, safeToRun=false`）——plan 层有类型守卫，规则引擎层没有

## 根因

- `evaluateCommandRisk` 未校验 `typeof command !== 'string' || !command.trim()`，直接进入规则匹配 → 字符串处理函数（`.includes/.match` 等）对非字符串静默返回 falsy → 无规则命中 → `allow`
- 与 plan 门的 `classifyHcloudArgs`（数组类型校验）不一致

## 影响评估（低-中）

- **当前不可直接利用**：`huaweicloud_hook_check_command` 是检查工具（不执行）；写执行路径有 plan 门（异常输入全 deny）兜底——**执行安全性不受影响**
- **纵深缺陷**：① hook 检查工具对异常输入返回"安全"可能误导调用方/上层门禁逻辑；② 任何未来复用 `evaluateCommandRisk` 的路径若忽略类型守卫，将继承 fail-open；③ 与其他异常输入处理不一致（OBS-12/13 同族：规则引擎输入健壮性）

## 修复建议

1. `evaluateCommandRisk` 入口加类型守卫：`typeof command !== 'string' || !command.trim() → { decision: 'deny', risk: 'invalid', reason: 'non-string or empty command' }`（与 plan 门对齐）
2. 补充畸形输入单测（null/undefined/数字/对象/超长/空串 6 例）

## 同族关联

- #561（OBS-12 规则缺失）/ #562（OBS-13 deploy_plan 盲区）——规则引擎同族输入健壮性系列