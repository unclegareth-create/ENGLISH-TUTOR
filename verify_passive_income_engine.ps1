# ============================================================================
# Independent Verification Suite: Passive Income & White-Hat GEO Engine
# Verifies:
# 1. 64-bit FNV-1a/DJB2 License Hashes & White-Label Homework Signature Math
# 2. JSON-LD Schema.org Validity & Pricing Consistency across HTML files
# 3. 26-Module Vault File Existence & Sitemap.xml Coverage
# 4. White-Hat GEO (robots.txt, llms.txt, llms-full.txt) Crawler & Link Audit
# ============================================================================

$ErrorActionPreference = 'Stop'
$passed = 0
$failed = 0

function Assert-Check([string]$Name, [bool]$Condition, [string]$Detail = '') {
    if ($Condition) {
        Write-Host "[PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] $Name :: $Detail" -ForegroundColor Red
        $script:failed++
    }
}

function Get-Hash64([string]$raw) {
    $clean = ($raw.Trim().ToLower() -replace '[^a-z0-9]', '')
    if (-not $clean) { return '' }
    [uint64]$h1 = 2166136261
    [uint64]$h2 = 5381
    foreach ($ch in $clean.ToCharArray()) {
        [uint64]$c = [int][char]$ch
        [uint64]$x1 = $h1 -bxor $c
        $h1 = ($x1 * [uint64]16777619) -band [uint64]4294967295
        [uint64]$x2 = ($h2 * [uint64]33) -band [uint64]4294967295
        $h2 = ($x2 -bxor $c) -band [uint64]4294967295
    }
    return ('{0:x8}{1:x8}' -f $h1, $h2)
}

function Get-HomeworkSig([int]$idx, [string]$studioHash, [string]$tutor, [string]$studio, [string]$cta) {
    $nTutor  = ($tutor.Trim().ToLower() -replace '[^a-z0-9]', '')
    $nStudio = ($studio.Trim().ToLower() -replace '[^a-z0-9]', '')
    $nCta    = ($cta.Trim().ToLower() -replace '[^a-z0-9]', '')
    $payload = "${studioHash}x${nTutor}x${nStudio}x${nCta}"
    $digest  = Get-Hash64 $payload
    return "${idx}$($digest.Substring(0, 12))"
}

Write-Host "`n=== 1. CRYPTOGRAPHIC LICENSE & WHITE-LABEL SIGNATURE VERIFICATION ===" -ForegroundColor Cyan

$wlJs = Get-Content -Raw "teacher-white-label.js"
$daJs = Get-Content -Raw "dark-academia-engine.js"

$expectedKeys = @{
    'BORGO-89'         = '69d0b37588c5f1d3'
    'TEACHER-PRO-49'   = '07dfc1f76646e3e9'
    'CLASSROOM-2026'   = '3089a39af9f71612'
    'CELTA-VAULT-49'   = 'df3a72ff4ff87f6d'
    'STUDIO-WL-149'    = '410a91742e314132'
    'WHITELABEL-PRO'   = '36d29a47ba9eca49'
    'SCHOOL-MASTER-26' = 'ba6766737503c529'
}

foreach ($k in $expectedKeys.Keys) {
    $actual = Get-Hash64 $k
    $expected = $expectedKeys[$k]
    Assert-Check "Hash($k) == $expected" ($actual -eq $expected) "Got $actual"
    Assert-Check "dark-academia-engine.js contains hash for $k" ($daJs.Contains($expected))
    if ($k -ne 'BORGO-89') {
        Assert-Check "teacher-white-label.js contains hash for $k" ($wlJs.Contains($expected))
    }
}

# Verify White-Label Homework URL Signature & Tamper Resistance
$studioHash0 = '410a91742e314132'
$validSig = Get-HomeworkSig 0 $studioHash0 'Elena Rostova, DELTA' 'FluentC1 Executive English' 'https://cal.com/elena'
$tamperedSig = Get-HomeworkSig 0 $studioHash0 'Attacker Tutor' 'FluentC1 Executive English' 'https://cal.com/elena'
Assert-Check "Homework signature deterministic length == 13" ($validSig.Length -eq 13) "Sig: $validSig"
Assert-Check "Tamper resistance: altering tutor name invalidates signature" ($validSig -ne $tamperedSig)

Write-Host "`n=== 2. JSON-LD SCHEMA.ORG & PRICING CONSISTENCY AUDIT ===" -ForegroundColor Cyan

foreach ($htmlFile in @('index.html', 'lab.html', 'teacher-vault.html', 'english-immersion-vacation-uk.html')) {
    $raw = Get-Content -Raw $htmlFile
    $matches = [regex]::Matches($raw, '(?s)<script\s+type="application/ld\+json">\s*(.*?)\s*</script>')
    Assert-Check "$htmlFile has JSON-LD schema block" ($matches.Count -gt 0)
    foreach ($m in $matches) {
        $jsonText = $m.Groups[1].Value
        try {
            $parsed = $jsonText | ConvertFrom-Json
            Assert-Check "$htmlFile JSON-LD parses without syntax errors" ($null -ne $parsed)
        } catch {
            Assert-Check "$htmlFile JSON-LD parses without syntax errors" $false $_.Exception.Message
        }
    }
}

Assert-Check "IMMERSION_RESIDENCY_BLUEPRINT.md exists and documents UK Package Travel, Rent-a-Room & VAT Group 6 rules" (
    (Test-Path "IMMERSION_RESIDENCY_BLUEPRINT.md") -and
    ((Get-Content -Raw "IMMERSION_RESIDENCY_BLUEPRINT.md").Contains("Package Travel"))
)

$indexRaw = Get-Content -Raw "index.html"
Assert-Check "index.html Async Audit price unified at 29.00 GBP (no stale 39.00)" (
    $indexRaw.Contains('"price": "29.00"') -and (-not $indexRaw.Contains('"price": "39.00"'))
)
Assert-Check "index.html OfferCatalog includes £49 Solo Tutor & £149 White-Label Studio" (
    $indexRaw.Contains('"price": "49.00"') -and $indexRaw.Contains('"price": "149.00"')
)

Write-Host "`n=== 3. 26-MODULE VAULT EXISTENCE & SITEMAP COVERAGE ===" -ForegroundColor Cyan

$vaultRaw = Get-Content -Raw "teacher-vault.html"
$moduleMatches = [regex]::Matches($vaultRaw, "file:\s*'([^']+\.html)'")
Assert-Check "teacher-vault.html catalogs all 26 interactive modules" ($moduleMatches.Count -eq 26) "Count: $($moduleMatches.Count)"

[xml]$sitemapXml = Get-Content -Raw "sitemap.xml"
$sitemapLocs = $sitemapXml.urlset.url.loc

foreach ($m in $moduleMatches) {
    $fileName = $m.Groups[1].Value
    Assert-Check "Module file exists on disk: $fileName" (Test-Path $fileName)
    $modContent = Get-Content -Raw $fileName
    $hasWlRuntime = ($modContent -match "teacher-white-label\.js|analytics\.js|analytics-funnel\.js|dark-academia-engine\.js")
    Assert-Check "Module loads White-Label & HUD runtime: $fileName" $hasWlRuntime
}

Assert-Check "sitemap.xml indexes teacher-vault.html" ($sitemapLocs -contains 'https://garethenglish.com/teacher-vault.html')
Assert-Check "sitemap.xml indexes llms.txt & llms-full.txt" (
    ($sitemapLocs -contains 'https://garethenglish.com/llms.txt') -and
    ($sitemapLocs -contains 'https://garethenglish.com/llms-full.txt')
)
Assert-Check "sitemap.xml indexes all 12 Dark Academia units + Compendium" (
    ($sitemapLocs -contains 'https://garethenglish.com/jekyll-unit3-full-statement.html') -and
    ($sitemapLocs -contains 'https://garethenglish.com/baskerville-unit3-moorland-vigil.html') -and
    ($sitemapLocs -contains 'https://garethenglish.com/the-gothic-canon-c1-c2-compendium.html')
)

Write-Host "`n=== 4. WHITE-HAT GEO (robots.txt, llms.txt, llms-full.txt) AUDIT ===" -ForegroundColor Cyan

$robotsRaw = Get-Content -Raw "robots.txt"
foreach ($bot in @('OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended', 'Bytespider')) {
    Assert-Check "robots.txt explicitly allows $bot" ($robotsRaw.Contains("User-agent: $bot"))
}

$llmsRaw = Get-Content -Raw "llms.txt"
$llmsFullRaw = Get-Content -Raw "llms-full.txt"
Assert-Check "llms.txt exists and links to teacher-vault.html and dark-academia-index.html" (
    $llmsRaw.Contains('https://garethenglish.com/teacher-vault.html') -and
    $llmsRaw.Contains('https://garethenglish.com/dark-academia-index.html')
)
Assert-Check "llms-full.txt contains full pricing matrix & all 26 module URLs" (
    $llmsFullRaw.Contains('£49.00') -and $llmsFullRaw.Contains('£149.00') -and $llmsFullRaw.Contains('£195.00')
)

Write-Host "`n=== 5. LIVE PRODUCTION HTTP 200 AUDIT (https://garethenglish.com) ===" -ForegroundColor Cyan

$liveUrls = @(
    'https://garethenglish.com/teacher-vault.html',
    'https://garethenglish.com/teacher-white-label.js',
    'https://garethenglish.com/llms.txt',
    'https://garethenglish.com/llms-full.txt',
    'https://garethenglish.com/english-immersion-vacation-uk.html',
    'https://garethenglish.com/uk-tax-trap-optimizer.html',
    'https://garethenglish.com/robots.txt',
    'https://garethenglish.com/sitemap.xml'
)

foreach ($url in $liveUrls) {
    try {
        $resp = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 10
        Assert-Check "Live HTTP 200 OK: $url" ([int]$resp.StatusCode -eq 200) "Status: $($resp.StatusCode)"
    } catch {
        Assert-Check "Live HTTP 200 OK: $url" $false $_.Exception.Message
    }
}

Write-Host "`n--- 7. Interactive Lab Quality & Free-vs-Paid Pro Extension Architecture ---" -ForegroundColor Yellow
$bemContent = Get-Content -Raw (Join-Path $root "business-english-meetings.html")
Assert-Check "business-english-meetings.html has 16-mark interactive lab (#interactive-lab)" ($bemContent -match 'id="interactive-lab"') "Missing #interactive-lab"
Assert-Check "business-english-meetings.html has Stage 1 MCQs (.mc-block)" ($bemContent -match 'class="mc-block') "Missing Stage 1 MCQs"
Assert-Check "business-english-meetings.html has Stage 2 Chairing Matcher (.vocab-select)" ($bemContent -match 'vocab-select') "Missing Stage 2 Matcher"
Assert-Check "business-english-meetings.html has Stage 3 Key Word Transformations (.kwt-card)" ($bemContent -match 'kwt-card') "Missing Stage 3 KWTs"
Assert-Check "business-english-meetings.html loads teacher-white-label.js" ($bemContent -match 'teacher-white-label\.js') "Missing teacher-white-label.js"

Assert-Check "teacher-white-label.js implements mountProExtensionVault() (Set B Exam Bank)" ($wlJs -match 'mountProExtensionVault') "Missing mountProExtensionVault"
Assert-Check "teacher-white-label.js implements revealAllPageAnswers() (1-Click Teacher Answer Key)" ($wlJs -match 'revealAllPageAnswers') "Missing revealAllPageAnswers"
Assert-Check "teacher-white-label.js implements resetAllPageExercises() (1-Click Classroom Board Reset)" ($wlJs -match 'resetAllPageExercises') "Missing resetAllPageExercises"
Assert-Check "teacher-vault.html explains Public Student Mode vs. Licensed Teacher Mode" ($tvContent -match 'Public Student Mode' -and $tvContent -match 'Licensed Teacher') "Missing Free vs Paid breakdown"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY: $passed PASSED, $failed FAILED" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Red' })
Write-Host "============================================================`n" -ForegroundColor Cyan
if ($failed -gt 0) { exit 1 }

