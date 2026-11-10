# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-11-11-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-11 06:05（北京时间）

## #1【P1】D3-C1 ECS 生命周期 E2E 删除归零验证失败（异步删除超时）

- **现象**：真云最小 ECS 创建成功（serverIds=a2e013dd-…），finally 归零轮询 150s 后仍报「仍在/未确认」，导致残留 ECS + VPC + 子网（测试侧已手动 DeleteServers→DeleteSubnet→DeleteVpc 并二次归零验证 present=false）
- **断言**：测后 ECS/VPC/子网应全部归零，无残留
- **根因**：`scripts/realcloud_e2e.mjs` finally 归零轮询窗口（15×10s=150s）小于华为云 ECS 异步删除真实耗时，属测试编排缺陷
- **影响**：真实计费资源泄漏风险（c6.large.2 按小时计费）
- **证据**：`evidence/D3-C1/stdout.log`
- **分类**：【测试侧】测试编排脚本轮询窗口不足，非产品代码缺陷

## #2【P1】D3-C2 OBS 静态网站托管 set/get 返回 HTTP 400

- **现象**：OBS 建桶成功、删桶成功，但 set静态站/get静态站均 HTTP 400，body=`<Code>InvalidArgument</Code><Message>Request has x-amz-security-token header but signed headers not…`
- **断言**：obs_set_website_config 的 set/get 应走 AWS4 签名 REST 且成功
- **根因**：`plugins/huaweicloud-core/src/`（obs website 配置 AWS4 签名逻辑）——带 `x-amz-security-token` 头（STS 注入）但 SignedHeaders 未将其纳入签名，导致签名不匹配被 OBS 拒绝
- **影响**：STS 临时凭证场景下 OBS 静态网站托管配置不可用
- **证据**：`evidence/D3-C2/stdout.log`
- **分类**：【产品缺陷】

## #3【P1】D3-C3 / D3-S3 沙箱 upload_project 在 Windows 失败（tar 反斜杠路径）

- **现象**：沙箱 connect/deploy_nginx/deploy_check/close_session 均 PASS，但 `sandbox_upload_project` 抛 `Error: Command failed: tar -czf C:\Users\ADMINI~1\AppData\Local\Temp\multica-task-...\sandbox-...`（含反斜杠 Windows 路径）
- **断言**：upload_project 打包上传应成功，终点返回可访问公网 URL
- **根因**：`plugins/huaweicloud-core/src/` sandbox 上传打包命令构造——`tar -czf` 拼接 Windows 反斜杠路径未转义/未切正斜杠，Windows 下 tar 解析失败
- **影响**：Windows 客户端沙箱项目上传/预览不可用
- **证据**：`evidence/D3-C3/stdout.log`、`evidence/D3-S3/stdout.log`
- **分类**：【产品缺陷】

## #4【P1】EXP-E01 评测路由「云主机查询」MISS

- **现象**：`service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 回退「Run hcloud --help to list available services.」，未路由到 ECS 查询
- **断言**：期望路由 ECS 查询→run_readonly
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由层——中文意图「云主机」未映射到 ECS 服务别名
- **影响**：D10 评测路由准确率 92.9%（1 MISS），「云主机」类高频查询意图漏路由
- **证据**：`evidence/EXP-E01/stdout.log`
- **分类**：【产品缺陷】

## #5【P1】EXP-E08 评测路由「ECS 启动失败诊断」N/A

- **现象**：`service_catalog(intent="我的ECS启动失败了 帮我分析原因")` 回退 help，未路由到 explain_error 诊断
- **断言**：期望路由诊断（explain_error）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog——「分析原因」诊断类意图未映射到 explain_error 诊断能力
- **影响**：排障/诊断意图无法自动路由到诊断工具
- **证据**：`evidence/EXP-E08/stdout.log`
- **分类**：【产品缺陷】

## #6【P2】D8-9 sanitizeValue 未脱敏 AK/SK/token

- **现象**：`sanitizeValue('AKID-abc\nSK-xyz')` 返回 `'AKID-abc SK-xyz'`（仅折叠空白），未移除 AK/SK 敏感值
- **断言**：用例断言「sanitizeValue 移除 AK/SK/token 等敏感值与非法字符」
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue（约 190-196 行）——仅 `replace(/[\r\n\t]+/,' ').trim()` + 截断，无凭证脱敏逻辑
- **影响**：遥测 value 字段若携带凭证值会原样上报，用例契约与实现漂移
- **证据**：`evidence/D8-9/stdout.log`
- **分类**：【SPEC-MISMATCH】需裁决（实现补脱敏 或 用例改断言）

## #7【P0】D10-4 规则库规则数漂移（文档 16 vs 实际 19）

- **现象**：`loadRiskRules()` 返回 19 条规则（deny=9 warn=10），用例文档断言「9 deny + 7 warn」=16
- **断言**：规则库完整加载（9 deny + 7 warn=16）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`——warn 规则由 7 演进至 10 条（新增 3 条），用例文档未同步；规则引擎本身行为正确（高危判 deny、只读判 allow）
- **影响**：用例断言快照过期，非产品缺陷（规则完整加载满足）
- **证据**：`evidence/D10-4/stdout.log`
- **分类**：【SPEC-MISMATCH】用例文档快照需同步（16→19）