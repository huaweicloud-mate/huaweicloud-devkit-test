$ErrorActionPreference = 'Continue'
Write-Output "client=Codex"
Write-Output "os=Windows"
Write-Output "node=$(& node --version)"
Write-Output "npm=$(& npm --version)"
Write-Output "--- version ---"
& huaweicloud-devkit version
Write-Output "exit=$LASTEXITCODE"
Write-Output "--- doctor ---"
& huaweicloud-devkit doctor
Write-Output "exit=$LASTEXITCODE"
Write-Output "--- status ---"
& huaweicloud-devkit status --target codex
Write-Output "exit=$LASTEXITCODE"
Write-Output "--- install-hcloud ---"
& huaweicloud-devkit install-hcloud
Write-Output "exit=$LASTEXITCODE"
Write-Output "--- mcp tools ---"
$mcp = Join-Path $env:APPDATA '..\Local\hermes\node\node_modules\huaweicloud-devkit\plugins\huaweicloud-core\src\mcp-server.mjs'
if (Test-Path -LiteralPath $mcp) {
  $payload = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"Codex-probe","version":"1"}}}' + "`n" +
    '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' + "`n"
  $payload | & node $mcp
  Write-Output "exit=$LASTEXITCODE"
} else {
  Write-Output "mcp_missing=$mcp"
}
