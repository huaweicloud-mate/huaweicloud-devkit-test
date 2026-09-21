# daily_sync.ps1 - nightly: push latest panorama xlsx to Feishu sheet + DM summary to owner
$ErrorActionPreference = 'Continue'
# fix encoding: python emits UTF-8, PS5.1 default is ANSI
try {
    $OutputEncoding = New-Object System.Text.UTF8Encoding $false
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
} catch { }

# Inject Feishu resource IDs from local-only .env.feishu (absent in public repo; falls back to system env)
$envFile = Join-Path $PSScriptRoot '.env.feishu'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(), 'Process')
        }
    }
}

$py    = 'C:\Users\Administrator\devkit-test\.venv-feishu\Scripts\python.exe'
$tool  = 'C:\Users\Administrator\devkit-test\feishu-sync\sync_sheet.py'
$log   = 'C:\Users\Administrator\devkit-test\feishu-sync\logs\daily-sync.log'
# 工作源（2026-09-10 迁移）：test manage 为唯一读写对象
$work = 'C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.xlsx'

New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

$latest = Get-Item -Path $work -ErrorAction SilentlyContinue

"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ==== daily sync start ====" | Add-Content -Path $log -Encoding UTF8
if ($null -eq $latest) {
    "[$(Get-Date -Format 'HH:mm:ss')] ERROR: 工作源不存在 $work" | Add-Content -Path $log -Encoding UTF8
    exit 1
}

"[$(Get-Date -Format 'HH:mm:ss')] source: $($latest.Name)" | Add-Content -Path $log -Encoding UTF8

& $py $tool --push $work --dm-after-push *>> $log 2>&1
$code = $LASTEXITCODE
"[$(Get-Date -Format 'HH:mm:ss')] exit code: $code" | Add-Content -Path $log -Encoding UTF8
exit $code