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

$ErrorActionPreference = "Continue"
$Repo = "C:\Users\Administrator\devkit-test\huaweicloud-devkit-test"
$LogDir = "$env:LOCALAPPDATA\Hermes Agent CN Desktop\data\hermes-home\logs"
$LogFile = Join-Path $LogDir "devkit-test-sync.log"
$Stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# NOTE on PowerShell 5.1 quirks handled here:
#  1. git writes progress to STDERR; with $ErrorActionPreference=Stop those
#     lines become terminating errors and a SUCCESSFUL push looks like a
#     failure. Hence "Continue" + explicit throws.
#  2. Wrap git calls in `cmd /c "git ... 2>&1"` so stderr is merged inside
#     cmd and PowerShell never sees NativeCommandError.
#  3. Success is verified BY FACT (local not ahead of origin), never by
#     $LASTEXITCODE which is unreliable behind git aliases/redirection.

try { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null } catch {}

function Write-Log($msg) {
    $line = "[$Stamp] $msg"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    Write-Host $line
}

Set-Location $Repo

try {
    # 1. Fetch remote (stderr merged inside cmd to avoid NativeCommandError)
    & cmd /c "git fetchm --quiet 2>&1" | Out-Null

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

    # 5. Push via gh credentials, then verify BY FACT not by exit code
    & cmd /c "git pushm 2>&1" | Out-Null
    $syncState = & git status -sb | Out-String
    if ($syncState -match "\[ahead ") {
        throw "push did not complete: local still ahead of origin ($syncState)"
    }

    Write-Log "SYNC: committed and pushed $count file change(s): $files"
    Write-Log "SYNC: commit message = $msg"
    exit 0
}
catch {
    Write-Log "SYNC: FAILED - $($_.Exception.Message)"
    Write-Host "SYNC: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}