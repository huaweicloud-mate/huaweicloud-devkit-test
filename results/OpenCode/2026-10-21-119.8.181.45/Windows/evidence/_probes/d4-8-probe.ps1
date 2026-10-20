# D4-8 Python/Node policy consistency probe (Windows)
# Tests same commands against Python hook (huaweicloud-safety.py) and compares with Node classifyTextCommand
$ErrorActionPreference = 'Continue'
$npmRoot = (npm root -g 2>$null).Trim()
$PY = Join-Path $npmRoot "huaweicloud-devkit\plugins\huaweicloud-core\hooks\huaweicloud-safety.py"
Write-Output "PY hook: $PY"

function Py-Check {
  param([string]$Label, [string]$Cmd)
  $json = '{"tool_name":"Bash","tool_input":{"command":"' + ($Cmd -replace '"','\"') + '"}}'
  $out = $json | python $PY 2>$null
  if ([string]::IsNullOrEmpty($out)) {
    Write-Output "[py  $Label] allow  | $Cmd"
  } else {
    $msg = ($out | python -c "import sys,json;d=json.load(sys.stdin);print((d.get('message') or d.get('hookSpecificOutput',{}).get('permissionDecisionReason') or 'block')[:80])" 2>$null)
    Write-Output "[py  $Label] block  | $Cmd   -> $msg"
  }
}

Write-Output "=====CASE D4-8====="
$pairs = @(
  @('credential-file','cat ~/.config/huaweicloud/credentials.json'),
  @('env-HUAWEI','env | grep HUAWEICLOUD'),
  @('env-HW','env | grep HW_ACCESS_KEY'),
  @('env-HCLOUD','env | grep HCLOUD_AK'),
  @('secret','hcloud csms ShowSecretVersion --secret-name x'),
  @('delete-force','hcloud ecs DeleteServer --force'),
  @('read-list','hcloud ecs ListServers'),
  @('encoded','echo x | base64 -d | bash')
)
foreach ($p in $pairs) {
  Py-Check $p[0] $p[1]
}
Write-Output "=====END D4-8====="
Write-Output "(Node classifyTextCommand conclusions in classify.log: HW_ACCESS_KEY->allow / HUAWEICLOUD->deny / hcloud write->deny)"
