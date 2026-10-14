# Deploys site files to GitHub Pages repository (unclegareth-create/ENGLISH-TUTOR) via gh CLI
param(
  [string[]]$files = @(
    "index.html",
    "blog.html",
    "sitemap.xml",
    "ads.txt",
    "robots.txt",
    "style.css",
    "site.js",
    "analytics.js",
    "privacy-policy.html",
    "terms.html",
    "video-courses.html",
    "ielts-7-syllabus.html",
    "ielts-writing-task-2.html",
    "ielts-speaking-part-3.html",
    "cae-essay.html",
    "key-word-transformations.html",
    "word-formation.html",
    "c1-c2-common-mistakes.html",
    "speaking-naturally.html",
    "learning-english-heritage.html",
    "cpe-inversion.html",
    "fce-interactive-lesson.html",
    "business-english-meetings.html",
    "grammar-crypt.html",
    "crypt.js",
    "cryptData.js",
    "cryptEngine.js",
    "crypt.css",
    "manifest.json",
    "sw.js",
    "icon-192.png",
    "icon-512.png",
    "icon-512-maskable.png",
    ".well-known/assetlinks.json",
    "phrasal-reactor.html",
    "reactor.html",
    "reactor.js",
    "reactor.css",
    "word-factory.html",
    "factory.html",
    "factory.js",
    "factory.css",
    "boardroom-pitch.html",
    "boardroom.html",
    "boardroom.js",
    "boardroom.css",
    "google-apps-script-cal-webhook.js"
  )
)

$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repo = "unclegareth-create/ENGLISH-TUTOR"
$root = $PSScriptRoot

foreach ($file in $files) {
  $filePath = Join-Path $root $file
  if (-not (Test-Path $filePath)) {
    Write-Warning "File not found: $filePath"
    continue
  }
  
  $apiPath = $file.Replace('\', '/')
  Write-Host "Deploying $file to $repo..."
  $bytes = [System.IO.File]::ReadAllBytes($filePath)
  $header = [System.Text.Encoding]::ASCII.GetBytes("blob $($bytes.Length)`0")
  $buffer = New-Object byte[] ($header.Length + $bytes.Length)
  [Buffer]::BlockCopy($header, 0, $buffer, 0, $header.Length)
  [Buffer]::BlockCopy($bytes, 0, $buffer, $header.Length, $bytes.Length)
  $sha1 = [System.Security.Cryptography.SHA1]::Create()
  $localSha = -join ($sha1.ComputeHash($buffer) | ForEach-Object { $_.ToString('x2') })

  # Check if file already exists in repo
  $existingSha = $null
  try {
    $meta = & $gh api "repos/$repo/contents/$apiPath" --jq ".sha" 2>$null
    if ($meta -and $meta.Length -ge 20) {
      $existingSha = $meta.Trim()
    }
  } catch {
    $existingSha = $null
  }

  if ($existingSha -and ($localSha -eq $existingSha)) {
    Write-Host "  Skipping $file (already up to date)."
    continue
  }

  $base64 = [Convert]::ToBase64String($bytes)

  $tempJson = Join-Path $env:TEMP "gh-payload-$([IO.Path]::GetRandomFileName()).json"
  try {
    $payloadObj = @{
      message = "Publish $file to live site"
      content = $base64
      branch  = "main"
    }
    if ($existingSha) {
      $payloadObj["sha"] = $existingSha
    }
    
    $payloadJson = $payloadObj | ConvertTo-Json -Compress
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($tempJson, $payloadJson, $utf8NoBom)

    $result = & $gh api --method PUT "repos/$repo/contents/$apiPath" --input "$tempJson" 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "$result"
    }
    Write-Host "  Success: $file pushed to GitHub (main)."
  } catch {
    Write-Error "Failed to push ${file}: $_"
  } finally {
    if (Test-Path $tempJson) { Remove-Item $tempJson -Force }
  }
}

Write-Host "All files deployed! GitHub Pages is building now at https://garethenglish.com"
