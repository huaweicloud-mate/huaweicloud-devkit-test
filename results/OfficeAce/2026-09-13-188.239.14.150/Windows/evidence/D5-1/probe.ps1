# D5-1: Client Matrix Coverage
# Check that all 10 client plugins are installed in the package
# Expected: All 10 clients supported

$repoRoot = "C:\Users\Administrator\devkit-test\OfficeAce\hdk"
$expectedClients = @(
    "OpenCode",
    "Codex",
    "CodeArtsAgent",
    "CodeArtsWork",
    "WorkBuddy",
    "DSH",
    "OfficeAce",
    "Hermes",
    "OpenClaw",
    "AtomCode"
)

Write-Host "=== D5-1: Client Matrix Coverage ==="
Write-Host "Repository: $repoRoot"
Write-Host "Expected clients: $($expectedClients.Count)"
Write-Host ""

# Check each client
$results = @{}
$foundCount = 0
$missingCount = 0

# 1. OpenCode - integrations/opencode/
if (Test-Path "$repoRoot\integrations\opencode\opencode.json") {
    $results["OpenCode"] = "FOUND: integrations/opencode/opencode.json"
    $foundCount++
} else {
    $results["OpenCode"] = "MISSING: integrations/opencode/opencode.json"
    $missingCount++
}

# 2. Codex - .codex-plugin/plugin.json
if (Test-Path "$repoRoot\plugins\huaweicloud-core\.codex-plugin\plugin.json") {
    $results["Codex"] = "FOUND: .codex-plugin/plugin.json"
    $foundCount++
} else {
    $results["Codex"] = "MISSING: .codex-plugin/plugin.json"
    $missingCount++
}

# 3. CodeArtsAgent - .codeartsdoer/skills/
if (Test-Path "$repoRoot\.codeartsdoer\skills") {
    $results["CodeArtsAgent"] = "FOUND: .codeartsdoer/skills/"
    $foundCount++
} else {
    $results["CodeArtsAgent"] = "MISSING: .codeartsdoer/skills/"
    $missingCount++
}

# 4. CodeArtsWork - .claude-plugin/plugin.json (Claude = CodeArts Work)
if (Test-Path "$repoRoot\plugins\huaweicloud-core\.claude-plugin\plugin.json") {
    $results["CodeArtsWork"] = "FOUND: .claude-plugin/plugin.json"
    $foundCount++
} else {
    $results["CodeArtsWork"] = "MISSING: .claude-plugin/plugin.json"
    $missingCount++
}

# 5. WorkBuddy - integrations/workbuddy/ + .workbuddy-plugin/plugin.json
if ((Test-Path "$repoRoot\integrations\workbuddy") -and (Test-Path "$repoRoot\plugins\huaweicloud-core\.workbuddy-plugin\plugin.json")) {
    $results["WorkBuddy"] = "FOUND: integrations/workbuddy/ + .workbuddy-plugin/plugin.json"
    $foundCount++
} else {
    $results["WorkBuddy"] = "MISSING: workbuddy integration"
    $missingCount++
}

# 6. DSH - integrations/dsh/hook-plugin.mjs + cordis.patch.yml
if ((Test-Path "$repoRoot\integrations\dsh\hook-plugin.mjs") -and (Test-Path "$repoRoot\cordis.patch.yml")) {
    $results["DSH"] = "FOUND: integrations/dsh/hook-plugin.mjs + cordis.patch.yml"
    $foundCount++
} else {
    $results["DSH"] = "MISSING: DSH integration"
    $missingCount++
}

# 7. OfficeAce - openclaw.plugin.json (OpenClaw = OfficeAce)
if (Test-Path "$repoRoot\plugins\huaweicloud-core\openclaw.plugin.json") {
    $results["OfficeAce"] = "FOUND: openclaw.plugin.json (OpenClaw=OfficeAce)"
    $foundCount++
} else {
    $results["OfficeAce"] = "MISSING: openclaw.plugin.json"
    $missingCount++
}

# 8. Hermes - integrations/hermes/ + .hermes-plugin/plugin.json
if ((Test-Path "$repoRoot\integrations\hermes\manifest.yaml") -and (Test-Path "$repoRoot\plugins\huaweicloud-core\.hermes-plugin\plugin.json")) {
    $results["Hermes"] = "FOUND: integrations/hermes/ + .hermes-plugin/plugin.json"
    $foundCount++
} else {
    $results["Hermes"] = "MISSING: hermes integration"
    $missingCount++
}

# 9. OpenClaw - openclaw.plugin.json
if (Test-Path "$repoRoot\plugins\huaweicloud-core\openclaw.plugin.json") {
    $results["OpenClaw"] = "FOUND: openclaw.plugin.json"
    $foundCount++
} else {
    $results["OpenClaw"] = "MISSING: openclaw.plugin.json"
    $missingCount++
}

# 10. AtomCode - integrations/atomcode/
if (Test-Path "$repoRoot\integrations\atomcode\hooks.json") {
    $results["AtomCode"] = "FOUND: integrations/atomcode/hooks.json"
    $foundCount++
} else {
    $results["AtomCode"] = "MISSING: integrations/atomcode/"
    $missingCount++
}

# Also check package.json keywords for agent targets
$pkgJson = Get-Content "$repoRoot\package.json" -Raw | ConvertFrom-Json
Write-Host "Package.json keywords: $($pkgJson.keywords -join ', ')"
Write-Host "Package.json files array: $($pkgJson.files -join ', ')"
Write-Host ""

# Report results
foreach ($client in $expectedClients) {
    $status = if ($results[$client] -like "FOUND*") { "PASS" } else { "FAIL" }
    Write-Host "[$status] $client : $($results[$client])"
}

Write-Host ""
Write-Host "=== SUMMARY ==="
Write-Host "Found: $foundCount / $($expectedClients.Count)"
Write-Host "Missing: $missingCount / $($expectedClients.Count)"

if ($foundCount -eq $expectedClients.Count) {
    Write-Host "RESULT: PASS - All 10 client plugins are present"
} else {
    Write-Host "RESULT: FAIL - $missingCount client(s) missing"
}
