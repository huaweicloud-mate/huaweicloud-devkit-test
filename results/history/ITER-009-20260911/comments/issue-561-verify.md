## 测试方复验：dev 分支 @0316e00（v1.1.3-next.4）——部分修复（env 打印/凭据文件/密文读取已拦截，明文参数未覆盖）

**判定：部分修复。** 保持 open，不关单。

- 复验基线：官方仓 dev 分支最新 commit `0316e0076cbd6d1f435432d42fd5aef42d72cd23`（PR #621 合入后，GitHub API 实时态）；本地工作树源码核查。

**已覆盖（`safety/rules/cloud-risk-rules.json` + Node/Python 双实现）**：
- `hwc-command-env-dump`（deny）：`env / printenv / Get-ChildItem Env: / gci Env: / dir Env:` 配合 `HUAWEICLOUD|HWC_|HCLOUD|OS_` → 拦截（Python hook `ENV_DUMP_RE` 同步实现）
- `hwc-command-credential-file`（deny）：`cat/type/Get-Content/gc/less/more` 读取 `.hcloud`/`.huaweicloud` 配置 → 拦截
- `hwc-command-secret-value-read`（deny）：`ShowSecretVersion|DownloadSecret|GetSecretValue` 及 `secret_string|secret_binary` → 拦截

**未覆盖**：原报告样例中 `--adminPass=xxx` / `--password=xxx` 明文命令参数场景依然 allow（无对应规则）。

**建议**：补充"密钥类参数明文传递"规则（如 adminPass/password 参数值非红action 即 deny/warn）后复核关闭。