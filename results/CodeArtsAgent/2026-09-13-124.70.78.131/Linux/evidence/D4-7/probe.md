# D4-7 hook 三工具有效性
客户端: CodeArtsAgent / Linux / codearts
工具: huaweicloud_hook_check_command / huaweicloud_hook_check_artifacts / huaweicloud_hook_check_deploy_plan
动作: 依次向三工具投递高危输入，断言全部正确拦截
- hook_check_command: 凭证文件读取(D4-1)、凭证 env 打印(D4-2)、明文 secret(D4-3)
- hook_check_artifacts: 宽泛 IAM 策略(D4-21)
- hook_check_deploy_plan: 公网无鉴权 FunctionGraph(D4-22)
