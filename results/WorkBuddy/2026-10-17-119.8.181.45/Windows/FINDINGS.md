# FINDINGS — 2026-10-17 WorkBuddy/Windows 每日测试缺陷清单

## #1【P0】D2-4 凭证脱敏正确性 — 小写 ak= 未脱敏

- **现象**: redactString 函数对命令字符串中的小写 `ak=`/`sk=` 不脱敏，hcloud CLI 风格的 `--ak=VALUE --sk=VALUE` 参数明文泄露
- **断言**: `redactSecrets('hcloud configure set --ak=HPUAN1ROXXXXXXXX --sk=SK1234567890abcdefghijklmnop')` 应返回不含明文凭证的字符串
- **根因**: safety-policy.mjs:45 正则 `/(AK|SK)\s*[:=]\s*(value)/g` 缺少 i 标志，仅匹配大写 AK=/SK=，不匹配小写 ak=/sk=
- **影响**: hcloud CLI 使用 --ak= --sk= 小写参数名，凭证明文可能泄露到日志/对话
- **证据**: evidence/D2-4/stdout.log

## #2【P0】D4-2 凭证 env 打印拦截 — Windows 风格 env 变量未拦截

- **现象**: `printenv | grep -i ak`、`set HW_ACCESS_KEY`、`echo %HW_ACCESS_KEY%` 等命令未被 evaluateCommandRisk 或 classifyTextCommand 拦截
- **断言**: 所有打印凭证环境变量的命令应被 deny 拦截
- **根因**: risk-rule-engine.mjs hwc-command-env-dump 规则未覆盖 Windows 风格环境变量访问（%VAR%）、set 命令、grep -i (ak|sk) 模式
- **影响**: Windows 环境下凭证环境变量可被打印泄露
- **证据**: evidence/D4-2/stdout.log

## #3【P0】D4-3 明文 secret API 拦截 — KMS DecryptData 未拦截

- **现象**: `hcloud KMS DecryptData`、`hcloud kms decrypt-data`、`hcloud CSMS ListSecrets`、`hcloud ECS ShowServerPassword`、`cat /etc/shadow` 等访问明文密钥的命令未被拦截
- **断言**: 所有访问明文 secret 的 API 命令应被 deny 拦截
- **根因**: risk-rule-engine.mjs hwc-command-secret-value-read 规则未覆盖 KMS DecryptData、CSMS ListSecrets、ECS ShowServerPassword 等操作；classifyHcloudArgs 仅对 Write 操作判 deny，未分类 sensitive-read
- **影响**: 敏感密钥数据（KMS 解密结果、CSMS 密钥列表、ECS 密码）可被读取泄露
- **证据**: evidence/D4-3/stdout.log

## #4【P1】D2-1 auth init 三端同步失败

- **现象**: auth init 三端同步（S1/S2/S3）未完全成功
- **断言**: auth init 后三端凭证一致
- **根因**: hcloud configure 未正确同步（见 evidence/D2-1/stdout.log）
- **影响**: 凭证不一致可能导致 hcloud 命令使用错误账号
- **证据**: evidence/D2-1/stdout.log

## #5【P1】D2-10 R7 current 档跟随逻辑异常

- **现象**: R7 current 档跟随逻辑未按预期工作
- **断言**: current 档应正确跟随 S1 变更
- **根因**: 见 evidence/D2-10/stdout.log
- **影响**: hcloud 命令可能使用过期档
- **证据**: evidence/D2-10/stdout.log

## #6【P1】D3-A1 skill 检索完整性不足

- **现象**: skill 检索未覆盖全部预期技能
- **断言**: 检索应返回完整技能列表
- **根因**: 见 evidence/D3-A1/stdout.log
- **影响**: 部分技能不可检索
- **证据**: evidence/D3-A1/stdout.log

## #7【P1】D3-B3 run_readonly 脱敏执行异常

- **现象**: run_readonly_command 输出脱敏不完整
- **断言**: 输出应经 redactSecrets 脱敏
- **根因**: 见 evidence/D3-B3/stdout.log
- **影响**: 只读命令输出可能含敏感信息
- **证据**: evidence/D3-B3/stdout.log

## #8【P1】D3-C4 服务创建类回归失败

- **现象**: 服务创建类 E2E 失败（VPC quota / sandbox 依赖）
- **断言**: 创建→验证→删除→归零完整流程
- **根因**: VPC 配额已满 + sandbox 未连接
- **影响**: 创建类用例无法完整执行
- **证据**: evidence/D3-C4/stdout.log

## #9【P1】D3-C5 工具冒烟失败

- **现象**: 工具冒烟测试未通过
- **断言**: 工具应正常响应
- **根因**: 见 evidence/D3-C5/stdout.log
- **影响**: 部分工具不可用
- **证据**: evidence/D3-C5/stdout.log

## #10【P1】D3-C7 跨区域资源操作引导失败

- **现象**: 跨区域资源操作引导未按预期工作
- **断言**: 应正确引导跨区域操作
- **根因**: 见 evidence/D3-C7/stdout.log
- **影响**: 跨区域操作可能出错
- **证据**: evidence/D3-C7/stdout.log

## #11【P1】D3-C13 OBS 静态网站托管配置返回 403

- **现象**: huaweicloud_obs_set_website_config 工具返回 HTTP 403
- **断言**: 应成功配置 OBS 静态网站托管
- **根因**: OBS API 授权问题（见 evidence/D3-C13/stdout.log）
- **影响**: OBS 静态网站托管不可配置
- **证据**: evidence/D3-C13/stdout.log

## #12【P1】D4-11 提示注入防护不足

- **现象**: 提示注入防护未完全拦截攻击输入
- **断言**: 应拦截所有提示注入攻击
- **根因**: 见 evidence/D4-11/stdout.log
- **影响**: 提示注入可能导致非预期行为
- **证据**: evidence/D4-11/stdout.log

## #13【P1】D4-13 最小权限凭证通过率

- **现象**: 只读子账号测试失败
- **断言**: 只读子账号应通过最小权限验证
- **根因**: 见 evidence/D4-13/stdout.log
- **影响**: 最小权限验证不完整
- **证据**: evidence/D4-13/stdout.log

## #14【P1】D4-24 确认令牌过期与重复确认边界异常

- **现象**: 确认令牌过期/重复确认边界行为异常
- **断言**: 令牌过期后应拒绝，重复确认应返回已处理
- **根因**: 见 evidence/D4-24/stdout.log
- **影响**: 审批流可能被重放
- **证据**: evidence/D4-24/stdout.log

## #15【P1】D4-27 双路径输出脱敏不完整

- **现象**: 双路径（stdout/stderr）输出脱敏不完整
- **断言**: 两条路径输出均应脱敏
- **根因**: 见 evidence/D4-27/stdout.log
- **影响**: stderr 可能泄露敏感信息
- **证据**: evidence/D4-27/stdout.log

## #16【P1】D5-3 工具全量枚举不完整

- **现象**: 工具全量枚举未覆盖所有工具
- **断言**: 应枚举全部 MCP 工具
- **根因**: 见 evidence/D5-3/stdout.log
- **影响**: 部分工具未被枚举
- **证据**: evidence/D5-3/stdout.log

## #17【P1】D8-4 引导步骤可机械执行性不足

- **现象**: 引导步骤不能完全机械执行
- **断言**: 引导步骤应可机械执行
- **根因**: 见 evidence/D8-4/stdout.log
- **影响**: 用户可能无法按引导完成操作
- **证据**: evidence/D8-4/stdout.log

## #18【P2】D1-33 skip 文件持久化多路径问题

- **现象**: skip 文件持久化多路径解析异常
- **断言**: skip 文件应正确解析到唯一路径
- **根因**: 见 evidence/D1-33/stdout.log
- **影响**: 升级提醒可能重复出现
- **证据**: evidence/D1-33/stdout.log

## #19【P2】D1-67 Agent toolkit 模式与 DSH 跳过安装环境变量

- **现象**: Agent toolkit 模式与 DSH 跳过安装环境变量处理异常
- **断言**: 应正确处理跳过安装环境变量
- **根因**: 见 evidence/D1-67/stdout.log
- **影响**: DSH 环境下安装可能异常
- **证据**: evidence/D1-67/stdout.log

## #20【P2】D2-27 KooCLI 版本管理异常

- **现象**: KooCLI 版本管理逻辑异常
- **断言**: 应正确管理 KooCLI 版本
- **根因**: 见 evidence/D2-27/stdout.log
- **影响**: 版本检测可能不准确
- **证据**: evidence/D2-27/stdout.log

## #21【P2】D3-B1 list_operations 规范名不完整

- **现象**: list_operations 返回的规范名不完整
- **断言**: 应返回完整规范名列表
- **根因**: 见 evidence/D3-B1/stdout.log
- **影响**: 部分操作不可发现
- **证据**: evidence/D3-B1/stdout.log

## #22【P2】D3-S5 场景-复合意图分层路由失败

- **现象**: 复合意图分层路由失败
- **断言**: 应正确路由复合意图
- **根因**: 见 evidence/D3-S5/stdout.log
- **影响**: 复合意图可能路由错误
- **证据**: evidence/D3-S5/stdout.log

## #23【P2】D3-S6 场景-FunctionGraph 定时任务路由失败

- **现象**: FunctionGraph 定时任务路由失败
- **断言**: 应正确路由 FunctionGraph 定时任务
- **根因**: 见 evidence/D3-S6/stdout.log
- **影响**: 定时任务可能路由错误
- **证据**: evidence/D3-S6/stdout.log

## #24【P2】D4-14 操作可审计性不足

- **现象**: 操作审计日志不完整
- **断言**: 所有操作应可审计
- **根因**: 见 evidence/D4-14/stdout.log
- **影响**: 操作不可追溯
- **证据**: evidence/D4-14/stdout.log

## #25【P2】D6-1 检索响应延迟超阈值

- **现象**: 检索响应延迟超过阈值
- **断言**: 响应延迟应在阈值内
- **根因**: 见 evidence/D6-1/stdout.log
- **影响**: 用户体验下降
- **证据**: evidence/D6-1/stdout.log

## #26【P2】D8-1 文档与能力不一致

- **现象**: 文档描述与实际能力不一致
- **断言**: 文档应与实际能力一致
- **根因**: 见 evidence/D8-1/stdout.log
- **影响**: 用户可能按文档操作失败
- **证据**: evidence/D8-1/stdout.log

## #27【P2】D8-6 中英文文档不一致

- **现象**: 中英文文档内容不一致
- **断言**: 中英文文档应内容一致
- **根因**: 见 evidence/D8-6/stdout.log
- **影响**: 英文用户可能获取错误信息
- **证据**: evidence/D8-6/stdout.log
