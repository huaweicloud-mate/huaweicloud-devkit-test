# sync-to-remote.ps1 - Scheduled auto-sync: local workspace -> GitHub archive repo
#
# Workflow:
#   1. All test artifacts are written directly into this repo directory
#      (docs/test-cases/templates/results/metrics/eval/scripts)
#   2. This script runs on a schedule (Windows Task Scheduler, default: hourly)
#   3. Commits ONLY when there are changes; no-op otherwise (idempotent);
#      failures are logged and retried on next run
#
# Safety:
#   - .gitignore locks credentials/secrets (22 rules, ad-hoc verified) -
#     a blind `git add -A` can never sweep sensitive files in
#   - Commit identity: repo-local shuangheaven@users.noreply.github.com
#     (global git config untouched)
#   - Push goes through the repo-local `pushm` alias (gh credentials,
#     bypassing the machine GCM conflict); failure does not block next run

$ErrorActionPreference = "Stop"
$Repo = "C:\Users\Administrator\devkit-test\huaweicloud-devkit-test"
$LogDir = "$env:LOCALAPPDATA\Hermes Agent CN Desktop\data\hermes-home\logs"
$LogFile = Join-Path $LogDir "devkit-test-sync.log"
$Stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null } catch {}

function Write-Log($msg) {
    $line = "[$Stamp] $msg"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

Set-Location $Repo

try {
    # 1. Fetch remote (via gh credentials)
    & git fetchm --quiet 2>&1 | Out-Null

    # 2. Check for pending changes (tracked + untracked)
    $status = & git status --porcelain
    if (-not $status) {
        Write-Log "SYNC: no changes, skipped (idempotent OK)"
        exit 0
    }

    # 3. Change summary (first 10 files)
    $files = ($status | ForEach-Object { $_.Substring(3) } | Select-Object -First 10) -join ", "
    $count = @($status).Count

    # 4. Commit with auto message (timestamp + file summary)
    & git add -A
    $msg = "auto-sync $Stamp [$count files] $files"
    & git commit -m $msg | Out-Null

    # 5. Push via gh credentials
    # NOTE: capture output into a variable FIRST, then read $LASTEXITCODE -
    # piping to Out-Null corrupts the exit code in PowerShell 5.1
    $pushOut = & git pushm 2>&1
    $pushExit = $LASTEXITCODE
    if ($pushExit -ne 0) { throw "push failed (exit=$pushExit): $pushOut" }

    Write-Log "SYNC: committed and pushed $count file change(s): $files"
    Write-Log "SYNC: commit message = $msg"
    exit 0
}
catch {
    Write-Log "SYNC: FAILED - $($_.Exception.Message)"
    Write-Host "SYNC: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}