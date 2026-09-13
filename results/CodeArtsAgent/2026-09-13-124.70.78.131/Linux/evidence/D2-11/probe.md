# D2-11 R3 STS token 拒绝落盘
客户端: CodeArtsAgent / Linux / codearts
工具: huaweicloud_auth_switch (persist + securityToken) + huaweicloud_auth_confirm
步骤: ① persist + 假 AK/SK + securityToken ② 触发 R2 conflict 仲裁 ③ decision=newImported
断言: 返回 {status:error, scope:rejected}，且 S1 不写入 token（R3 拦截在 writeGlobalCredentials 之前）
