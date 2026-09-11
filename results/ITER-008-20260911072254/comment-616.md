## ✅ 回归验证完成（2026-09-11）：#616 已解决

用 **dev 分支真实代码**（git worktree 检出 `afa9dca` = 1.1.3-next.4）重新做了端到端验证，结论：**版本拦截问题已彻底解决**。

### 验证证据

**1. dev 真实代码调用沙箱 API（test env `devkit.topxtopx.com`）**

- `hdkitCheckUser()`（import dev 分支真实 `hdkitservice-api.mjs`，含 `X-HW-Client-Version` 契约 header）→ **HTTP 200**
  ```json
  {"realnameVerified": true, "agreementSigned": true}
  ```

**2. 严格 A/B 对照（真实凭据链 + 精确 header 差异）**

| 请求形态 | HTTP | 响应 |
|---|---|---|
| 无版本 header（裸认证） | 200 | `{"realnameVerified":true,"agreementSigned":true}` |
| 带 `X-HW-Client-Version: 1.1.3-next.2` | 200 | 同上 |

→ `HDKIT_VERSION_TOO_OLD` 拦截**已不存在**：测试环境 min 门槛关闭生效，旧/无头客户端不再被硬拦截，改走软提醒。

**3. 客户端修复在发布线**：`git show c6c0965`（1.1.3-next.2）原生代码已含

```js
const headers = {
  'Content-Type': 'application/json',
  'X-HW-AK': ak,
  'X-HW-SK': sk,
  'X-HW-Client-Version': readInstalledVersion() || '0.0.0',
};
```

即"客户端未携带版本号"的产品代码修复在 1.1.3-next.2 发布线已合入，早于本 issue 的复现环境（1.1.1）。

### 补充说明（对之前 500 的澄清）

此前一次试验观察到 `500 HDKIT_INTERNAL`——根因是**用 POST + 空 body 调用了 GET 接口**（`check-user` 为 GET），请求形态错误，非版本拦截问题；dev 真实代码 GET 调用完全正常。因此无需针对 500 另开 issue。

### 建议

1. **本 issue 可关闭**：服务端拦截已解除 + 客户端修复已在发布线，问题闭环。
2. **main 分支对齐建议（非本 issue 范围）**：GitHub `ref=main` 当前 HEAD（2d09d5b）的 `hdkitservice-api.mjs` 未含 `X-HW-Client-Version`，但发布线 1.1.3-next.2（c6c0965）已含——建议将 main 与 release 路径对齐，避免后续审查/排查误判。

（验证脚本与报告已在本地归档；凭据均经产品 `getCredentials()` 链内存读取，未落盘未外发。）