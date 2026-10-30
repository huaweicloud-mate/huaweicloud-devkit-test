// D4-1: 凭证文件读取拦截
// Tests evaluateCommandRisk on credential file read commands
// cat ~/.hcloud/credentials.json => expect deny
// type %USERPROFILE%\.hcloud\credentials.json => expect deny
// cat ~/.config/huaweicloud/credentials.json => expect deny
// Get-Content ~/.hcloud/credentials.json => expect deny