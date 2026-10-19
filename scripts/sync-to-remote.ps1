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
#   - Divergence self-heal (2026-10-19): other machines and Actions push to
#     origin/main continuously, so this clone
#     drifts behind; a stale history makes pushes non-fast-forward and piles up
#     dead local commits. When behind, realign to origin/main (server truth)
#     while preserving uncommitted work via stash (conflict => loud failure).
#   - results/Summary/** is authored server-side by .github/workflows/
#     auto-summary.yml (contents: write) and regenerated on every agent report:
#     a local copy must never overwrite it, so it is excluded from commits here.

$ErrorActionPreference = "Continue"
$Repo = "C:\Users\Administrator\devkit-test\huaweicloud-devkit-test"
$LogDir = "$env:LOCALAPPDATA\Hermes Agent CN Desktop\data\hermes-home\logs"
$LogFile = Join-Path $LogDir "devkit-test-sync.log"
$Stamp = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"

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

    # 1b. Divergence self-heal (2026-10-19): this clone drifts behind origin/main
    #     because other machines + GitHub Actions push continuously; a stale local
    #     history makes the push non-fast-forward and piles up dead local commits.
    #     When behind, realign history to origin/main (server truth). Uncommitted
    #     work is stashed and re-applied; a conflict THROWS and keeps the stash
    #     (never silently drops content).
    $counts = (& git rev-list --left-right --count "origin/main...HEAD") -split "\s+" |
        Where-Object { $_ -match '^\d+$' }
    $behind = [int]$counts[0]
    $ahead = [int]$counts[1]
    if ($behind -gt 0) {
        Write-Log "SYNC: local behind origin/main (behind=$behind ahead=$ahead) -> realign"
        # results/Summary is authored by Actions (auto-summary.yml) -> drop local edits
        & cmd /c "git checkout -- results/Summary 2>&1" | Out-Null
        $pending = @(& git status --porcelain | Where-Object { $_ -notmatch 'results/Summary/' })
        $stashed = $false
        if ($pending.Count -gt 0) {
            & cmd /c "git stash push -u -m auto-sync-realign 2>&1" | Out-Null
            $stashed = $true
        }
        & cmd /c "git reset --hard origin/main 2>&1" | Out-Null
        if ($stashed) {
            $pop = (& cmd /c "git stash pop 2>&1") -join "`n"
            if ($LASTEXITCODE -ne 0 -or $pop -match "CONFLICT") {
                throw "realign failed: stash pop conflict, stash kept (see 'git stash list'): $pop"
            }
        }
        Write-Log "SYNC: realigned to origin/main (uncommitted work preserved=$stashed)"
    }

    # 2. Check for pending changes (tracked + untracked), excluding server-authoritative results/Summary
    $status = @(& git status --porcelain | Where-Object { $_ -notmatch 'results/Summary/' })
    if ($status.Count -eq 0) {
        Write-Log "SYNC: no changes, skipped (idempotent OK)"
        exit 0
    }

    # 3. Change summary (first 10 files)
    $files = ($status | ForEach-Object { $_.Substring(3) } | Select-Object -First 10) -join ", "
    $count = $status.Count

    # 4. Commit with auto message (timestamp + file summary)
    & git add -A
    # results/Summary is regenerated server-side; never let a local copy overwrite it
    & cmd /c "git reset --quiet -- results/Summary 2>&1" | Out-Null
    if (@(& git diff --cached --name-only).Count -eq 0) {
        Write-Log "SYNC: only results/Summary changed (server-authoritative), skipped"
        exit 0
    }
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
