# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-26-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-26 06:40:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

---

## #1【P1】D3-C2 OBS 静态网站托管配置签名错误（x-amz-security-token 未纳入 SignedHeaders）

- **现象**：真云执行 `huaweicloud_obs_set_website_config` 配置/读取静态网站托管，返回 HTTP 400：`Request has x-amz-security-token header but signed headers not included`；建桶与删桶均成功，仅 website 子资源请求失败。
- **断言**：`obs_set_website_config` 应能成功设置/读取静态网站托管，返回 200 且 websiteUrl 可访问。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3071`——`obsSignedRequest()` 在 `creds.securityToken` 存在时把 `x-amz-security-token` 加入请求头（3071 行），但该头未纳入 `canonicalHeaders` / `signedHeaders`（3033-3034 行仅含 host/x-amz-content-sha256/x-amz-date），导致 AWS4 签名不覆盖该头，OBS 拒绝 400。
- **影响**：携带 securityToken 的场景下 OBS 静态网站托管（PUT/GET/DELETE /?website、/?cors）全部失败，功能不可用。
- **证据**：`evidence/D3-C2/stdout.log`（真云实测，建桶成功 + 删桶归零成功，website 配置失败）
- **状态**：待提单

## #2【P1】D3-C3 沙箱上传项目在 Windows 下 tar 打包失败（tmpdir 反斜杠路径）

- **现象**：真云执行 `huaweicloud_sandbox_upload_project` 报 `Command failed: tar -czf C:\Users\ADMINI~1\AppData\Local\Temp\...\sandbox-upload-...`，项目归档打包失败，后续 `deploy_nginx` 因无归档返回 `undefined:undefined`。
- **断言**：`sandbox_upload_project` 应能成功打包（tar.gz）并上传项目，返回 ok 且 md5Verify 通过。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:413`——`createTarGz()` 用 `join(tmpdir(), ...)` 生成的 Windows 路径（含 8.3 短名 `ADMINI~1` 与反斜杠）作为 `tar -czf` 的输出路径传给 `execFileAsync('tar', ...)`，Windows 下 tar 无法解析该路径 → 打包失败。
- **影响**：Windows 客户端沙箱项目上传（upload_project）不可用，阻断沙箱部署 E2E 链路。
- **证据**：`evidence/D3-C3/stdout.log`（真云实测，connect 成功、archive 失败、close 成功）
- **状态**：待提单

## #3【P1】EXP-E01 serviceCatalog 路由未命中「云主机」（ECS 关键词缺同义词）

- **现象**：评测意图「帮我查一下我账号在华北北京四有哪些云主机」路由结果为空，返回 `Run hcloud --help to list available services.`，未命中 ECS。
- **断言**：中文意图「云主机」应命中 ECS（expected=ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2192-2205`——ECS routeMap 关键词表含 `ecs/server/vm/instance/compute/弹性云服务器/云服务器/服务器/虚拟机/镜像`，缺常用同义词「云主机」，故「云主机」意图 0 命中 → 路由 MISS。
- **影响**：D10 评测集路由准确率受损（15 条中 1 MISS，准确率 92.9%），覆盖「云主机」这一高频用户表达。
- **证据**：`evidence/EXP-E01/stdout.log`（MCP 真实路由，HIT=13 MISS=1 N/A=1）
- **状态**：待提单

## #4【测试侧】D3-C1 ECS 异步删除超过 150s 轮询窗口，归零校验误报残留

- **现象**：真云 E2E CreateVpc/CreateSubnet/CreateServers 均成功，删除已提交，但 `scripts/realcloud_e2e.mjs` 轮询 15×10s=150s 后 ECS 仍 ACTIVE，`finally 归零` 误报「仍在/未确认」，存在真实泄漏风险（已手动二次删除并确认 ECS/VPC/subnet 归零）。
- **断言**：插件引导全程完成，无残留（ECS/VPC/subnet 最终归零）。
- **说明**：属测试编排问题，非 huaweicloud-devkit 产品缺陷。华为云 ECS 删除为异步，可超 150s；`realcloud_e2e.mjs` 轮询窗口不足，需延长轮询或改轮询 ListServersDetails 直到 count=0。
- **证据**：`evidence/D3-C1/stdout.log`

## #5【测试侧】D4-13 只读子账号凭证切换未生效（HW_ACCESS_KEY/HW_SECRET_KEY 不被 hcloud 读取）

- **现象**：用 `scripts/run-as-readonly.py` 注入只读子账号 `HW_ACCESS_KEY/HW_SECRET_KEY` env 后，`hcloud VPC CreateVpc` 仍 status=0 建 VPC 成功（未返回 403 / 无权限 / AccessDenied）。
- **断言**：只读子账号下读可用、写被 IAM 拒绝（最小权限生效）。
- **说明**：属测试侧凭证切换问题、非产品缺陷。`run-as-readonly.py` 注入的 `HW_ACCESS_KEY/HW_SECRET_KEY` 是 devkit `resolveCredentials` 的 env 口径，但探测直调 `hcloud`（KooCLI 读 `~/.hcloud` 管理员配置），不读这两个 env，故写操作仍以管理员身份执行。正确口径应经 devkit `run_readonly_command` 工具链路验证，或向 hcloud 注入其识别的 `HUAWEICLOUD_SDK_AK/SK`。
- **证据**：`evidence/D4-13/stdout.log`（READ status=0、WRITE status=0 建 VPC 成功，已手动删除归零）