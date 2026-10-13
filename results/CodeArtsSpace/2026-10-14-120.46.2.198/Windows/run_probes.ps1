#!/usr/bin/env pwsh
# Batch execute all probe scripts
$todayEvidence = "C:\Users\Administrator\devkit-test\CodeArtsSpace\huaweicloud-devkit-test\results\CodeArtsSpace\2026-10-14-120.46.2.198\Windows\evidence"
Set-Location $todayEvidence

$dirs = Get-ChildItem $todayEvidence -Directory | Sort-Object Name
$total = $dirs.Count
$executed = 0
$success = 0
$failed = 0
$errors = @()

foreach ($dir in $dirs) {
    $probeFile = Join-Path $dir.FullName "probe.mjs"
    if (-not (Test-Path $probeFile)) { continue }
    
    $executed++
    $caseId = $dir.Name
    
    # Skip grouped dirs that are output targets, not probe sources
    if ($caseId -match '^(d1-upgrade|d2-auth|d4-security|mcp-tools|c4-service-matrix|d3-realcloud|d8-quality|d9-protocol|d10-eval)$') { continue }
    
    # Create any needed subdirs that the probe might write to
    foreach ($sub in @('d1-upgrade','d2-auth','d4-security','mcp-tools','c4-service-matrix','d3-realcloud','d8-quality','d9-protocol','d10-eval')) {
        $subDir = Join-Path $todayEvidence $sub
        if (-not (Test-Path $subDir)) { New-Item -ItemType Directory -Path $subDir -Force | Out-Null }
    }
    
    try {
        $output = node $probeFile 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0 -or $output -match '"total"') {
            $success++
        } else {
            $failed++
            $errors += "$caseId : $output".Substring(0, [Math]::Min(200, "$caseId : $output".Length))
        }
    } catch {
        $failed++
        $errors += "$caseId : $_"
    }
    
    if ($executed % 20 -eq 0) {
        Write-Output "Progress: $executed/$total (OK=$success, FAIL=$failed)"
    }
}

Write-Output "`n=== Summary ==="
Write-Output "Total dirs: $total, Executed: $executed, Success: $success, Failed: $failed"
if ($errors.Count -gt 0) {
    Write-Output "`n=== Errors ==="
    $errors | ForEach-Object { Write-Output $_ }
}
