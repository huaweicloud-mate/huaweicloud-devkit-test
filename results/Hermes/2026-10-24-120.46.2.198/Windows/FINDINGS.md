# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-24-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-24（北京时间）
> **本清单是统一提单脚本的解析输入**，格式严格遵循 templates/findings.md。

---

## #1【P1】D3-C2 OBS 静态站托管 AWS4 签名缺 x-amz-security-token

- **现象**：`huaweicloud_obs_set_website_config` 的 set / get 均返回 HTTP 400，OBS 返回 `InvalidArgument: Request has x-amz-security-token header but signed headers not`。
- **断言**：set 应返回 status 200 并在桶生效 WebsiteConfiguration；get 应返回 status 200 且 body 含 `<IndexDocument>`。实际 set/get 均 400，静态站无法配置。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2398-2402` 的 `obsSignedRequest` 计算 `canonicalHeaders`/`signedHeaders` 仅含 `host;x-amz-content-sha256;x-amz-date`，但同函数 `2438` 行在凭证带 `securityToken` 时把 `x-amz-security-token` 加入了实际请求头——签名字段清单与实际发送头不一致，导致 AWS4 签名校验失败（OBS 判定签名头缺失该 token）。真云账号使用 STS/临时凭证（带 securityToken）时必现。
- **影响**：OBS 静态网站托管 set/get/delete 能力在带 STS 凭证环境完全不可用，影响 D3-C2/D3-C13 类场景。
- **证据**：`evidence/D3-C2/stdout.log`（set 400 / get 400 body InvalidArgument）

## #2【P1】D3-C1 ECS 生命周期 E2E 删除异步超时，归零确认窗不足

- **现象**：CreateVpc/CreateSubnet/CreateServers 均成功（CreateServers 返回 serverIds），但 `finally` 阶段 DeleteServers 提交后，15×10s=150s 轮询窗口内 ECS 仍为 ACTIVE，`归零(校验真实删除)` 判定 False；残留 1 台 ECS 需人工二次删除后方归零。
- **断言**：ECS 生命周期应「购买→验证 ACTIVE→删除→只读验证归零」，测后 count=0。实测 create 后立即 delete 未在 150s 内完成删除（ECS 仍 ACTIVE），归零验证失败。
- **根因**：`scripts/realcloud_e2e.mjs:107-122` 清理步骤未等待 CreateServers 异步任务完成后（服务器真正 ACTIVE）再删除，且删除确认轮询窗口（15×10s）不足以覆盖 ECS 异步删除；属测试编排时序缺陷，非 huaweicloud-core 产品代码 bug。
- **影响**：真云 E2E 用例偶发资源残留风险；本次残留已由测试方手工删除并核实 ECS count=0、VPC 无 testbot3-hermes 残留。
- **证据**：`evidence/D3-C1/stdout.log`（finally归零 False；人工清理后 hcloud ListServersDetails count=0）

## #3【P1】D3-C3 沙箱 upload_project 在 Windows 上 tar 归档失败

- **现象**：`sandbox_upload_project`（local_dir=`/tmp/d3c3-proj`）报 `Error: Command failed: tar -czf ...`，upload_project 返回 False；connect/deploy_nginx/deploy_check/close_session 均通过。
- **断言**：upload_project 应成功打 tar.gz 并上传（md5Verified=true）。实际 tar 归档步骤失败。
- **根因**：`realcloud_e2e.mjs:153` 使用了 POSIX 路径 `/tmp/d3c3-proj`；`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:327-358` `createTarGz` 以 `execFile('tar', ['-czf', ..., '-C', dirname(localDir), basename(localDir)])` 归档，Windows 上 node 实际创建的是 `C:\` 路径而 MSYS `tar -C /tmp` 与其不匹配 → "Cannot stat"。属测试编排用 POSIX 路径 + createTarGz 依赖系统 `tar -C` 的组合脆弱性。
- **影响**：Windows 端沙箱项目上传路径脆弱；本次会话已 close，无资源残留。
- **证据**：`evidence/D3-C3/stdout.log`（upload_project False，connect/deploy/check/close 均 true）

## #4【P1】D10-3/EXP-E01~E14 serviceCatalog 路由准确率 21.4%

- **现象**：`huaweicloud_service_catalog` 对 15 条中文意图仅 3 条 HIT、11 条 MISS、1 条 N/A，准确率 21.4%（分母 HIT+MISS=14）。MISS 清单：EXP-E01/E02(ECS)、E03(OBS)、E04(EIP)、E05(RDS)、E07(CBR)、E10(FunctionGraph)、E11(BSS)、E12(CES)、E13(ELB)、E14(IAM)。
- **断言**：路由准确率应 ≥ 50%。实际 21.4%，绝大多数中文意图被回退到通用 "Run hcloud --help" 兜底，未命中对应服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `service_catalog` 路由层中文关键词匹配覆盖不足（与 2026-10-23 每日测试同一基线问题）。
- **影响**：自然语言描述需求时无法正确推荐对应华为云服务，影响 D10-3 与全部 EXP-E 评测用例。
- **证据**：`evidence/EXP-E01~EXP-E15/stdout.log`、`hdk/eval-results.json`（21.4%）