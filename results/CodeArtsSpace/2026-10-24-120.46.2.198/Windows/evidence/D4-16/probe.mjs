// D4-16: hook_check_command 命令包裹穿透
// ①sh -c "cat ~/.hcloud/credentials.json" => deny
// ②cmd /c type %USERPROFILE%\.hcloud\credentials.json => deny