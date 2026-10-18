## 测试概览
- 被测版本：1.1.9（正式版，gitHead 05a67b64）
- 缺陷：1 项（其余 15 项为历史延续，见对应用例号的历史单）

## 缺陷清单

### 1. [P1] 沙箱 deploy_nginx 每次部署在 /etc/nginx/conf.d/ 残留 .conf 未清理，耗尽 8080-8089 端口

- **描述**：`huaweicloud_sandbox_deploy_nginx` 每部署一次即在沙箱 `/etc/nginx/conf.d/<project>.conf`（或隐藏 `.hdk-s3-*.conf`）写入一个 nginx 配置，从不清理。多客户端/多轮每日测试共享同一沙箱实例后，conf.d 累积到 38 个 hdk-*/.hdk-s3-* conf，把 8080-8089 全部 listen 占满；此后 `deploy_nginx` 抛 `sandbox deploy nginx: all ports 8080-8089 are in use`，D3-C3 沙箱部署 E2E 首轮 FAIL，需手工删除测试残留 conf + `nginx -s reload` 才恢复。
- **预期（精确断言）**：deploy_nginx 应复用固定 conf 名幂等覆盖（或会话关闭/复用前清理本次 conf），不得无限累积耗尽端口；返回 `ok=true` 并完成 nginx 部署。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:880` `sudo tee /etc/nginx/conf.d/${configName || project}.conf` 每次用唯一项目名写新 conf，无删除/幂等覆盖逻辑；端口探测只检测端口占用（`ss -tlnp`），不感知残留 conf 文件。
- **证据**：`results/OpenClaw/2026-10-19-120.46.222.180/Linux/evidence/D3-C3/stdout.log`（sandbox-e2e-20261019.log 首轮 `all ports 8080-8089 are in use`；清理 conf 后复测 `deploy_nginx port=8080` + `nginx_serving PASS HTTP 200`）
- **影响**：共享沙箱场景下端口逐步耗尽，后续所有部署失败，阻断 D3-C3/D3-S3 等沙箱部署链路。

**测试报告**：https://github.com/huaweicloud-mate/huaweicloud-devkit-test/blob/main/results/OpenClaw/2026-10-19-120.46.222.180/Linux/OpenClaw-deepseek-v4-pro-0813-测试报告.md