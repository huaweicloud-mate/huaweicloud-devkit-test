**新发现（真机，AK/SK 方案 v4 相关——authEncrypt 环境指纹假阳性）**：

在真实环境（KooCLI 7.2.12，`authEncrypt=true`，Windows）验证 `getAuthStatus.reconciled`：

**现象**：`huaweicloud_auth_switch persist`（import）同步成功后，`hcloud configure show` 确认 S2 current 档已写入新 AK（HPU****YXD），但 `reconciled.stores.currentFingerprint`（f4571d59）**永远 ≠ s1Fingerprint**（caae65f2），`inconsistent: true` 恒存。

**根因链**：
1. `authEncrypt=true`（KooCLI 默认）→ `~/.hcloud/config.json` 整文件加密（crypter/nonce/localDea），**AK/SK 均密文存储**
2. `readKooCliProfiles()` 按方案 T2 "非 spawn 直读"设计 → 读到的是**密文**
3. `fingerprint(密文AK, 密文SK)` 与 S1 真实指纹**数学上必然不同**

**影响**：① getAuthStatus 恒告警（"当前账号不一致"的假阳性）② sync 每次触发 R4 自动重写 S2，写后指纹仍不匹配 → **无效循环重写**

**验证证据**（SHA-256 指纹）：真实值=caae65f2；`****` 掩码=c6de8701；文件直读密文路径与 f4571d59 一致。

**建议**：① authEncrypt 环境通过 `hcloud configure list`（解密输出）计算指纹，或 ② 检测到 authEncrypt 时跳过 S2 指纹比对（仅比对 current 档名与存在性），或 ③ 方案 T2/WSL-权限说明补充"文件直读遇密文"场景。此问题与早前 P0-2 报告中的测试 mock 问题无关，为真机独立发现。