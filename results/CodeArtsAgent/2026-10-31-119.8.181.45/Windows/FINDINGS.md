# FINDINGS - 每日测试缺陷清单

> **发现时间**：2026-10-31 05:13（北京时间）
> **客户端**：CodeArtsAgent + openpangu-2.0-pro
> **OS**：Windows

---

## #1【P0】Windows 升级检测链可用性 - FAIL

| 项 | 值 |
|---|---|
| **用例 ID** | D1-39 |
| **标题** | Windows 升级检测链可用性 |
| **状态** | FAIL |
| **描述** | `queryDistTagsSync` 和 `queryDistTags` 在 Windows 上返回 null，导致升级检测功能失效 |
| **断言** | `queryDistTagsSync` 和 `queryDistTags` 应正常返回 distTags 对象（含 latest 和 next 字段） |
| **根因** | `hdk/plugins/huaweicloud-core/src/update-check.mjs:86` - `parseDistTagsOutput` 函数拒绝数组格式的 JSON 输出，但 `npm view` 在 Windows 上返回数组 `[{latest, next}]` 而非对象 |
| **证据** | `evidence/D1-39/stdout.log` |
| **源码位置** | `hdk/plugins/huaweicloud-core/src/update-check.mjs:81-94` |

**详细分析**：
- `npm view huaweicloud-devkit dist-tags --json` 在 Windows 上返回数组格式：`[{"latest":"1.1.12","next":"1.1.13-next.0"}]`
- `parseDistTagsOutput` 函数第 86 行检查 `Array.isArray(parsed)`，如果是数组则返回 null
- 应修改为：如果 parsed 是数组且长度 > 0，则取 parsed[0] 作为 distTags 对象

**建议修复**：
```javascript
export function parseDistTagsOutput(stdout) {
  try {
    const text = String(stdout || '').trim();
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    // 处理数组格式
    const distTags = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!distTags || typeof distTags !== 'object') return null;
    return {
      latest: typeof distTags.latest === 'string' ? distTags.latest : null,
      next: typeof distTags.next === 'string' ? distTags.next : null,
    };
  } catch {
    return null;
  }
}
```

---

## 统计

| 状态 | 数量 |
|---|---|
| FAIL | 1 |
| SPEC-MISMATCH | 0 |

---

## 备注

- D1-39 缺陷为源码层面问题，已在 `hdk/plugins/huaweicloud-core/src/update-check.mjs:86` 定位
- 建议修复后回归验证
