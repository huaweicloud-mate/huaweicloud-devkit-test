# hdk-secrets.ps1 - DPAPI-encrypted storage for Huawei Cloud AK/SK (Windows)
#
# Why DPAPI:
#   - Encryption is bound to the current Windows user + this machine
#     (DataProtectionScope.CurrentUser)
#   - A stolen file or offline disk read cannot be decrypted without an
#     authenticated session of this user on this machine
#   - No extra password management needed locally
#
# Usage (in PowerShell):
#   .\hdk-secrets.ps1 Set     # interactive AK/SK input, encrypts to ~\.hdk-secrets\credentials.bin
#   .\hdk-secrets.ps1 Get     # decrypts and injects env vars HW_ACCESS_KEY / HW_SECRET_KEY (current session)
#   .\hdk-secrets.ps1 Test    # verify decryptability (prints masked AK only, never plaintext)
#   .\hdk-secrets.ps1 Clear   # delete the encrypted file (revoke)
#
# Safety rules:
#   - Secrets are decrypted only on this machine, injected into local
#     processes, and sent to Huawei Cloud APIs. Never to chat/reports/repo.
#   - The archive repo .gitignore already blocks credential patterns;
#     this script itself must never contain real credentials.
#   - Switching Windows user or machine requires a fresh Set
#     (DPAPI does not travel across users/machines).
#   - For long-lived credentials, prefer an IAM least-privilege sub-account
#     plus STS temporary credentials so blast radius stays small.

param([Parameter(Position = 0)][ValidateSet("Set", "Get", "Test", "Clear")][string]$Action = "Test")

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Security

$secretDir  = Join-Path $HOME ".hdk-secrets"
$secretFile = Join-Path $secretDir "credentials.bin"

function Protect-Creds([string]$ak, [string]$sk) {
    $plain = "$ak`n$sk"   # line 1 = AK, line 2 = SK
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($plain)
    return [System.Security.Cryptography.ProtectedData]::Protect(
        $bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
}

function Unprotect-Creds {
    $bytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
        [System.IO.File]::ReadAllBytes($secretFile),
        $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    $lines = ([System.Text.Encoding]::UTF8.GetString($bytes)) -split "`n"
    return @{ AK = $lines[0].Trim(); SK = $lines[1].Trim() }
}

switch ($Action) {
    "Set" {
        if (-not (Test-Path $secretDir)) { New-Item -ItemType Directory -Path $secretDir -Force | Out-Null }
        Write-Host "Enter AK (hidden input):" -NoNewline
        $ak = Read-Host -AsSecureString
        Write-Host "Enter SK (hidden input):" -NoNewline
        $sk = Read-Host -AsSecureString
        $akStr = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ak))
        $skStr = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sk))
        if ([string]::IsNullOrWhiteSpace($akStr) -or [string]::IsNullOrWhiteSpace($skStr)) {
            throw "AK/SK must not be empty; cancelled"
        }
        [System.IO.File]::WriteAllBytes($secretFile, (Protect-Creds $akStr $skStr))
        Write-Host "OK: encrypted credentials saved to $secretFile (DPAPI CurrentUser)."
    }
    "Get" {
        if (-not (Test-Path $secretFile)) { throw "No encrypted credential file found; run '.\hdk-secrets.ps1 Set' first" }
        $c = Unprotect-Creds
        $env:HW_ACCESS_KEY = $c.AK
        $env:HW_SECRET_KEY = $c.SK
        Write-Host "OK: HW_ACCESS_KEY / HW_SECRET_KEY injected into current session only."
    }
    "Test" {
        if (-not (Test-Path $secretFile)) {
            Write-Host "STATUS: not set (run Set to store credentials)"
            exit 0
        }
        try {
            $c = Unprotect-Creds
            $mask = $c.AK.Substring(0, [Math]::Min(4, $c.AK.Length)) + "****"
            Write-Host "STATUS: OK - decryptable (AK mask: $mask; SK length: $($c.SK.Length))"
        } catch {
            Write-Host "STATUS: FAIL - cannot decrypt (written by another user/machine?) : $($_.Exception.Message)"
            exit 1
        }
    }
    "Clear" {
        if (Test-Path $secretFile) { Remove-Item $secretFile -Force; Write-Host "OK: credential file removed" }
        else { Write-Host "No credential file to remove" }
    }
}