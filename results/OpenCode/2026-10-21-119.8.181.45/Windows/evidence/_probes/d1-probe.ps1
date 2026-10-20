# D1 install probe (Windows) - isolated USERPROFILE/HOME
# Covers D1-3(doctor) / D1-4(status/update idempotency)
$ErrorActionPreference = 'Continue'
$ISO = Join-Path $env:TEMP "dkt-iso-home-20261020"
if (Test-Path $ISO) { Remove-Item -LiteralPath $ISO -Recurse -Force }
New-Item -ItemType Directory -Path $ISO -Force | Out-Null
# Resolve setup.cjs directly (avoid wrapper version mismatch -2 vs -3)
$SETUP = 'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\bin\setup.cjs'
if (-not (Test-Path $SETUP)) { $SETUP = (Join-Path (npm root -g 2>$null) 'huaweicloud-devkit\bin\setup.cjs') }

function Run-Step {
  param([string]$Label, [string[]]$CmdArgs)
  Write-Output ""
  Write-Output "================================================================================"
  Write-Output "## $Label"
  Write-Output "================================================================================"
  $env:HOME = $ISO
  $env:USERPROFILE = $ISO
  $env:APPDATA = Join-Path $ISO "AppData"
  $env:LOCALAPPDATA = Join-Path $ISO "AppData"
  & node $SETUP @CmdArgs 2>&1 | Where-Object { $_ -notmatch 'ExperimentalWarning|trace-warnings' }
  Write-Output "--- exit=$LASTEXITCODE ---"
}

Write-Output "########## STEP 1: install --target opencode (isolated HOME) ##########"
Run-Step "install" @('install','--target','opencode')

Write-Output ""
Write-Output "########## STEP 2: status --target opencode ##########"
Run-Step "status" @('status','--target','opencode')

Write-Output ""
Write-Output "########## STEP 3: doctor --target opencode ##########"
Run-Step "doctor" @('doctor','--target','opencode')

Write-Output ""
Write-Output "########## STEP 4: status (2nd) - idempotency (D1-4) ##########"
Run-Step "status-2nd" @('status','--target','opencode')

Write-Output ""
Write-Output "########## STEP 5: update - idempotency (D1-4) ##########"
Run-Step "update" @('update','--target','opencode')

Write-Output ""
Write-Output "########## STEP 6: files under isolated config root ##########"
Get-ChildItem (Join-Path $ISO ".config") -Recurse -ErrorAction SilentlyContinue | Select-Object -First 40 FullName

Write-Output ""
Write-Output "########## STEP 7: uninstall --target opencode ##########"
Run-Step "uninstall" @('uninstall','--target','opencode')

Write-Output ""
Write-Output "########## STEP 8: status after uninstall ##########"
Run-Step "status-after-uninstall" @('status','--target','opencode')

Write-Output ""
Write-Output "########## STEP 9: residue check ##########"
Get-ChildItem (Join-Path $ISO ".config") -Recurse -ErrorAction SilentlyContinue | Select-Object -First 20 FullName
Write-Output "$ISO (residue above; empty or minimal = clean)"
