**AK-FP-2（新发现，与 AK-FP-1 同源不同面——R6 场景 S2 被漏检）**：

**现象**：设置 `HUAWEICLOUD_HOME`（指向其他目录）后，`readKooCliProfiles()` 返回 `"KooCLI config not found"`——即使真实 `~/.hcloud/config.json` 存在。

**实证**（本机 Windows + zhangshuang Linux 双环境一致）：
- 正常环境：`readKooCliProfiles()` → OK（current=default, profiles=1）
- 设 `HUAWEICLOUD_HOME=C:/.../hwc-alt-home` 后：→ `KooCLI config not found`（真实 S2 明明存在）

**根因**：`readKooCliProfiles()` 按 `join(baseHome(), '.hcloud', 'config.json')` 定位 S2（baseHome = HUAWEICLOUD_HOME || homedir）。但 KooCLI 自身配置文件**固定在 `$HOME/.hcloud/config.json`，与 HUAWEICLOUD_HOME 无关**。

**与方案文档冲突**：方案 §九 T1 断言 3 明确写「HUAWEICLOUD_HOME 只影响 devkit 自身文件（S1/S3/proxy），**不影响 S2 `~/.hcloud`（由 KooCLI 管理，位置固定）**，需实测确认 scan 路径映射正确避免漏掉 S2」——实测结论：**实现与该断言不符，S2 确实被漏检**。

**影响**（R6 环境，即 WSL 权限修复后 HUAWEICLOUD_HOME 被重定向的常见场景）：
1. `getAuthStatus.reconciled` 对 S2 的比对/告警失效（真实 KooCLI 配置不在扫描范围 → 手动改动检测、current 档跟踪全部失效）
2. `syncAuth`/reconcile 传播 S1→S2 的落点与真实 KooCLI 配置脱节（写 `HUAWEICLOUD_HOME/.hcloud` 而非 `~/.hcloud`）

**建议**：S2 定位应始终用 `homedir()/.hcloud/config.json`（KooCLI 约定固定路径），与 HUAWEICLOUD_HOME 解耦——即 `readKooCliProfiles` 不应走 `baseHome()`；方案 T1 待测项按其本意实施。