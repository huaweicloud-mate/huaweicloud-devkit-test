$ErrorActionPreference = 'Continue'
$base = "C:\Users\Administrator\devkit-test\officeclaw\huaweicloud-devkit-test\results\OfficeAce\2026-09-22-188.239.14.150\Windows\evidence"
$nodeExe = "C:\Users\Administrator\AppData\Local\Programs\OfficeAce\tools\node\node.exe"
$nodeDir = "C:\Users\Administrator\AppData\Local\Programs\OfficeAce\tools\node"

# Case -> probe script mapping
$cases = @(
    @{id='D10-4';     script='probe-d10-4.mjs'},
    @{id='D2-1';      script='probe-d2-1.mjs'},
    @{id='D2-10';     script='probe-d2-10.mjs'},
    @{id='D2-11';     script='probe-d2-11.mjs'},
    @{id='D2-12';     script='probe-d2-12.mjs'},
    @{id='D2-13';     script='probe-d2-13.mjs'},
    @{id='D2-16';     script='probe-d2-16.mjs'},
    @{id='D2-2';      script='probe-d2-2.mjs'},
    @{id='D2-26';     script='probe-d2-26.mjs'},
    @{id='D2-27';     script='probe-d2-27.mjs'},
    @{id='D2-4';      script='probe-d2-4.mjs'},
    @{id='D2-5';      script='probe-d2-5-fixed.mjs'},
    @{id='D5-1';      script='probe-d5-1.mjs'},
    @{id='D5-3';      script='probe-d5-3.mjs'},
    @{id='D6-1';      script='probe-d6-1.mjs'},
    @{id='D6-3';      script='probe-d6-3.mjs'},
    @{id='D6-4';      script='probe-d6-4.mjs'},
    @{id='D6-9';      script='probe-d6-9.mjs'},
    @{id='D8-7';      script='probe-d8-7.mjs'},
    @{id='EXP-D5-7-1';script='probe.mjs'},
    @{id='EXP-D5-7-3';script='probe.mjs'}
)

$summary = @()

foreach ($c in $cases) {
    $caseId = $c.id
    $scriptName = $c.script
    $caseDir = Join-Path $base $caseId
    $scriptPath = Join-Path $caseDir $scriptName
    $stdoutPath = Join-Path $caseDir 'stdout.log'
    
    $ts = Get-Date
    $executedAt = $ts.ToString('yyyyMMddHHmmss')
    
    Write-Output "--- Executing $caseId ($scriptName) ---"
    
    if (-not (Test-Path $scriptPath)) {
        # Script not found, write BLOCKED
        $blocked = @{status='BLOCKED'; why="Probe script not found: $scriptName"; executedAt=$executedAt} | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($stdoutPath, $blocked, [System.Text.Encoding]::UTF8)
        $summary += "$caseId | BLOCKED | script not found"
        Write-Output "  -> BLOCKED: script not found"
        continue
    }
    
    # Set up environment
    $env:PATH = "$nodeDir;" + $env:PATH
    $env:PYTHONUTF8 = '1'
    $env:NODE_PATH = Join-Path $nodeDir 'node_modules'
    
    # Execute with timeout (60s)
    $stdout = ''
    $exitCode = -1
    $errorMsg = ''
    
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $nodeExe
        $psi.Arguments = "`"$scriptPath`""
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.CreateNoWindow = $true
        $psi.WorkingDirectory = $caseDir
        # Set env vars
        $psi.EnvironmentVariables['PATH'] = "$nodeDir;" + $env:PATH
        $psi.EnvironmentVariables['PYTHONUTF8'] = '1'
        if ($env:NODE_PATH) { $psi.EnvironmentVariables['NODE_PATH'] = $env:NODE_PATH }
        if ($env:HUAWEICLOUD_HOME) { $psi.EnvironmentVariables['HUAWEICLOUD_HOME'] = $env:HUAWEICLOUD_HOME }
        
        $proc = [System.Diagnostics.Process]::Start($psi)
        $stdout = $proc.StandardOutput.ReadToEnd()
        $stderr = $proc.StandardError.ReadToEnd()
        
        if (-not $proc.WaitForExit(60000)) {
            $proc.Kill()
            $errorMsg = 'TIMEOUT: script exceeded 60s'
            $exitCode = -999
        } else {
            $exitCode = $proc.ExitCode
        }
    } catch {
        $errorMsg = $_.Exception.Message
        $exitCode = -1
    }
    
    # Determine status
    $status = ''
    $why = ''
    
    if ($exitCode -eq -999) {
        $status = 'BLOCKED'
        $why = $errorMsg
    } elseif ($exitCode -eq 0) {
        $status = 'PASS'
        $why = 'All checks passed'
    } elseif ($exitCode -eq 1) {
        # Script ran but some checks failed - that's a valid FAIL result
        $status = 'FAIL'
        $why = 'One or more checks failed (exit code 1)'
    } else {
        # Other error - BLOCKED
        $status = 'BLOCKED'
        $why = if ($errorMsg) { $errorMsg } else { "exit code: $exitCode, stderr: $($stderr.Substring(0, [Math]::Min(500, $stderr.Length)))" }
    }
    
    # Try to extract JSON from stdout (last === RESULT === block)
    $resultJson = $null
    $lines = $stdout -split "`n"
    for ($i = $lines.Length - 1; $i -ge 0; $i--) {
        $line = $lines[$i].Trim()
        if ($line.StartsWith('{') -and $line.EndsWith('}')) {
            try {
                $resultJson = $line | ConvertFrom-Json
                break
            } catch {}
        }
    }
    
    # Build stdout.log content
    if ($resultJson -and $resultJson.status) {
        # Use the script's own JSON result
        $logObj = @{
            status = $resultJson.status
            why = if ($resultJson.why) { $resultJson.why } elseif ($resultJson.result) { $resultJson.result } else { $why }
            executedAt = $executedAt
        }
        if ($resultJson.testCase) { $logObj.testCase = $resultJson.testCase }
        if ($resultJson.checks) { $logObj.checks = $resultJson.checks }
        $logContent = $logObj | ConvertTo-Json -Depth 5 -Compress
    } elseif ($resultJson -and $resultJson.result) {
        $logObj = @{
            status = $resultJson.result
            why = $why
            executedAt = $executedAt
        }
        if ($resultJson.testCase) { $logObj.testCase = $resultJson.testCase }
        $logContent = $logObj | ConvertTo-Json -Depth 5 -Compress
    } else {
        # No JSON found, use our own status
        $logContent = @{status=$status; why=$why; executedAt=$executedAt} | ConvertTo-Json -Compress
    }
    
    # Write stdout.log
    [System.IO.File]::WriteAllText($stdoutPath, $logContent, [System.Text.Encoding]::UTF8)
    
    # Also write full stdout to a separate file for debugging
    [System.IO.File]::WriteAllText((Join-Path $caseDir 'stdout-raw.txt'), $stdout, [System.Text.Encoding]::UTF8)
    if ($stderr) {
        [System.IO.File]::WriteAllText((Join-Path $caseDir 'stderr-raw.txt'), $stderr, [System.Text.Encoding]::UTF8)
    }
    
    $summary += "$caseId | $status | $why"
    Write-Output "  -> $status (exit=$exitCode)"
}

Write-Output ""
Write-Output "=== SUMMARY ==="
foreach ($s in $summary) { Write-Output $s }
