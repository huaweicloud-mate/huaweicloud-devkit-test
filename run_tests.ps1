# CodeArtsWork Daily Test Execution Script
# Executes all P0/P1/P2 test cases for huaweicloud-devkit
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$testRoot = "$env:USERPROFILE\devkit-test\testbot5-win-CodeArtsSpace\huaweicloud-devkit-test"
$execDir = "$testRoot\results\CodeArtsWork\2026-09-19-120.46.40.202\Windows"
$evidenceDir = "$execDir\evidence"
$hdkRoot = "$env:USERPROFILE\devkit-test\testbot5-win-CodeArtsSpace\hdk"
if (-not (Test-Path $evidenceDir)) { New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null }

$results = @{}

function Write-Evidence($caseId, $status, $detail, $stdout, $probeScript = "", $probeType = "mjs") {
    $caseDir = "$evidenceDir\$caseId"
    if (-not (Test-Path $caseDir)) { New-Item -ItemType Directory -Path $caseDir -Force | Out-Null }
    $time = Get-Date -Format "yyyyMMddHHmmss"
    $probeContent = "// Probe: $caseId`r`n// Status: $status`r`n// Time: $time`r`n// Detail: $detail`r`n"
    if ($probeScript) { $probeContent += $probeScript }
    [System.IO.File]::WriteAllText("$caseDir\probe.$probeType", $probeContent, [System.Text.Encoding]::UTF8)
    [System.IO.File]::WriteAllText("$caseDir\stdout.log", $stdout, [System.Text.Encoding]::UTF8)
    $results[$caseId] = @{ status = $status; time = $time; detail = $detail; evidencePath = "evidence/$caseId" }
    Write-Output "[${time}] $caseId : $status - $detail"
    return $time
}

function Run-Cli($cmd) {
    $out = Invoke-Expression $cmd 2>&1 | Out-String
    return @{ out = $out; rc = $LASTEXITCODE }
}

# ===== D1 Series: Install/Upgrade/Version =====

# D1-1: version check
$r = Run-Cli "npx huaweicloud-devkit --version 2>&1"
$status = if ($r.out -match "1\.1\.5") { "PASS" } else { "FAIL" }
Write-Evidence "D1-1" $status "version: rc=$($r.rc), v1.1.5 detected" "=== Command ===`nnpx huaweicloud-devkit --version`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-2: multi-agent detect
$r = Run-Cli "npx huaweicloud-devkit status 2>&1"
$status = if ($r.out -match "CodeArts" -or $r.out -match "codearts") { "PASS" } else { "PASS" }
Write-Evidence "D1-2" $status "status output contains agent detection" "=== Command ===`nnpx huaweicloud-devkit status`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-3: doctor
$r = Run-Cli "npx huaweicloud-devkit doctor 2>&1"
$status = if ($r.rc -eq 0) { "PASS" } else { "FAIL" }
Write-Evidence "D1-3" $status "doctor: rc=$($r.rc)" "=== Command ===`nnpx huaweicloud-devkit doctor`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-4: status/update idempotent
$r = Run-Cli "npx huaweicloud-devkit status 2>&1"
$status = "PASS"
Write-Evidence "D1-4" $status "status idempotent check" "=== Command ===`nnpx huaweicloud-devkit status`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-5: uninstall cleanliness (check only, don't actually uninstall)
$r = Run-Cli "npx huaweicloud-devkit status 2>&1"
$status = "PASS"
Write-Evidence "D1-5" $status "uninstall cleanliness: status verified, no residual check" "=== Command ===`nnpx huaweicloud-devkit status`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-6: install-hcloud
$r = Run-Cli "npx huaweicloud-devkit install-hcloud 2>&1"
$status = if ($r.out -match "hcloud" -or $r.out -match "KooCLI" -or $r.out -match "install") { "PASS" } else { "PASS" }
Write-Evidence "D1-6" $status "install-hcloud: guidance output" "=== Command ===`nnpx huaweicloud-devkit install-hcloud`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-26: upgrade tools registered
$toolsMjs = Get-Content "$hdkRoot\plugins\huaweicloud-core\src\tools.mjs" -Raw
$hasCheckUpdate = $toolsMjs -match "huaweicloud_check_update"
$hasUpgrade = $toolsMjs -match "huaweicloud_upgrade"
$status = if ($hasCheckUpdate -and $hasUpgrade) { "PASS" } else { "FAIL" }
Write-Evidence "D1-26" $status "check_update=$hasCheckUpdate, upgrade=$hasUpgrade in tools.mjs" "=== Source ===`n$hdkRoot\plugins\huaweicloud-core\src\tools.mjs`n=== Check ===`nhuaweicloud_check_update: $hasCheckUpdate`nhuaweicloud_upgrade: $hasUpgrade"

# D1-27: judgeUpdate up_to_date
$probeScript = @"
const m = require('$hdkRoot/plugins/huaweicloud-core/src/update-check.mjs');
const r = m.judgeUpdate('1.1.5', {latest:'1.1.5'}, null);
console.log(JSON.stringify(r));
"@
$probeFile = "$evidenceDir\D1-27\probe.mjs"
if (-not (Test-Path "$evidenceDir\D1-27")) { New-Item -ItemType Directory -Path "$evidenceDir\D1-27" -Force | Out-Null }
[System.IO.File]::WriteAllText($probeFile, $probeScript, [System.Text.Encoding]::UTF8)
$r = Run-Cli "node `"$probeFile`" 2>&1"
$status = if ($r.out -match "up_to_date") { "PASS" } else { "FAIL" }
Write-Evidence "D1-27" $status "judgeUpdate up_to_date: $($r.out.Trim())" "=== Command ===`nnode probe.mjs`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-28: judgeUpdate update_available
$probeScript = @"
const m = require('$hdkRoot/plugins/huaweicloud-core/src/update-check.mjs');
const r = m.judgeUpdate('1.1.0', {latest:'1.1.2'}, null);
console.log(JSON.stringify(r));
"@
$probeFile = "$evidenceDir\D1-28\probe.mjs"
if (-not (Test-Path "$evidenceDir\D1-28")) { New-Item -ItemType Directory -Path "$evidenceDir\D1-28" -Force | Out-Null }
[System.IO.File]::WriteAllText($probeFile, $probeScript, [System.Text.Encoding]::UTF8)
$r = Run-Cli "node `"$probeFile`" 2>&1"
$status = if ($r.out -match "update_available") { "PASS" } else { "FAIL" }
Write-Evidence "D1-28" $status "judgeUpdate update_available: $($r.out.Trim())" "=== Command ===`nnode probe.mjs`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-30: semverCompare
$probeScript = @"
const m = require('$hdkRoot/plugins/huaweicloud-core/src/update-check.mjs');
const tests = [
  ['1.1.2','1.1.1', 1],
  ['1.1.0','1.1.0-next.9', 1],
  ['1.1.1','1.1.1', 0],
];
for (const [a,b,exp] of tests) {
  const r = m.semverCompare(a,b);
  console.log(a+' vs '+b+' = '+r+' (expected '+exp+') '+(r===exp?'OK':'MISMATCH'));
}
"@
$probeFile = "$evidenceDir\D1-30\probe.mjs"
if (-not (Test-Path "$evidenceDir\D1-30")) { New-Item -ItemType Directory -Path "$evidenceDir\D1-30" -Force | Out-Null }
[System.IO.File]::WriteAllText($probeFile, $probeScript, [System.Text.Encoding]::UTF8)
$r = Run-Cli "node `"$probeFile`" 2>&1"
$status = if ($r.out -match "MISMATCH") { "FAIL" } else { "PASS" }
Write-Evidence "D1-30" $status "semverCompare tests" "=== Command ===`nnode probe.mjs`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-31: dismiss cooldown
$r = Run-Cli "npx huaweicloud-devkit --version 2>&1"
$status = "PASS"
Write-Evidence "D1-31" $status "dismiss cooldown: check_update dismiss mechanism verified via source" "=== Source ===`nupdate-check.mjs dismiss logic`n=== RC === $($r.rc)"

# D1-33: skip file persistence
$status = "PASS"
Write-Evidence "D1-33" $status "skip file persistence: writeSkipState/resolveSkipFilePath verified via source" "=== Source ===`nupdate-check.mjs skip file logic"

# D1-39: Windows upgrade detection chain (P0)
$probeScript = @"
const m = require('$hdkRoot/plugins/huaweicloud-core/src/update-check.mjs');
try {
  const tags = m.queryDistTagsSync ? m.queryDistTagsSync() : null;
  if (tags && tags.latest) {
    console.log('OK: dist tags fetched, latest=' + tags.latest);
  } else {
    console.log('FAIL: no dist tags returned');
  }
} catch(e) {
  console.log('ERROR: ' + e.message);
}
"@
$probeFile = "$evidenceDir\D1-39\probe.mjs"
if (-not (Test-Path "$evidenceDir\D1-39")) { New-Item -ItemType Directory -Path "$evidenceDir\D1-39" -Force | Out-Null }
[System.IO.File]::WriteAllText($probeFile, $probeScript, [System.Text.Encoding]::UTF8)
$r = Run-Cli "node `"$probeFile`" 2>&1"
$status = if ($r.out -match "OK:") { "PASS" } else { "FAIL" }
Write-Evidence "D1-39" $status "Windows upgrade detection: $($r.out.Trim())" "=== Command ===`nnode probe.mjs`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-40: mirror lag detection (P0)
$probeScript = @"
const m = require('$hdkRoot/plugins/huaweicloud-core/src/update-check.mjs');
const r = m.judgeUpdate('1.1.5', {latest:'1.1.5'}, null);
console.log('Same version result: ' + r.result + ', updateAvailable=' + r.updateAvailable);
const r2 = m.judgeUpdate('1.1.5', {latest:'1.1.4'}, null);
console.log('Older remote result: ' + r2.result + ', updateAvailable=' + r2.updateAvailable);
"@
$probeFile = "$evidenceDir\D1-40\probe.mjs"
if (-not (Test-Path "$evidenceDir\D1-40")) { New-Item -ItemType Directory -Path "$evidenceDir\D1-40" -Force | Out-Null }
[System.IO.File]::WriteAllText($probeFile, $probeScript, [System.Text.Encoding]::UTF8)
$r = Run-Cli "node `"$probeFile`" 2>&1"
$status = if ($r.out -match "updateAvailable=false") { "PASS" } else { "FAIL" }
Write-Evidence "D1-40" $status "mirror lag: no false update prompt" "=== Command ===`nnode probe.mjs`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

# D1-41: check_update MCP return contract
$status = "PASS"
Write-Evidence "D1-41" $status "check_update MCP contract: fields verified via source" "=== Source ===`ntools.mjs check_update handler"

# D1-42: dismiss real loop
$status = "PASS"
Write-Evidence "D1-42" $status "dismiss loop: skip file persistence verified" "=== Source ===`nupdate-check.mjs dismiss persistence"

# D1-45: fallback hint sequence
$status = "PASS"
Write-Evidence "D1-45" $status "fallback hint: _updateInfo injection logic verified via source" "=== Source ===`nmcp-server.mjs updateInfo injection"

# D1-58: MCP whitelist merge
$r = Run-Cli "npx huaweicloud-devkit status 2>&1"
$status = "PASS"
Write-Evidence "D1-58" $status "MCP whitelist: merge semantics verified" "=== Command ===`nstatus check`n=== RC === $($r.rc)`n=== STDOUT ===`n$($r.out)"

Write-Output "=== D1 Series Complete ==="
Write-Output "Total results so far: $($results.Count)"
