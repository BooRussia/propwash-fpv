# ============================================================
# PropWash FPV — one-command publish to GitHub Pages
# Run this from the fpv-sim folder:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\publish.ps1
# It will: log you into GitHub (browser window, one time),
# create a PUBLIC repo "propwash-fpv", push the code, and
# enable GitHub Pages. Your sim ends up at:
#   https://<your-username>.github.io/propwash-fpv/
# ============================================================
param([string]$RepoName = "propwash-fpv")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# locate gh (fresh installs need a new shell for PATH)
$gh = "gh"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  $candidates = @(
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\gh.exe",
    "$env:ProgramFiles\GitHub CLI\gh.exe"
  )
  $found = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($found) { $gh = $found } else { Write-Error "GitHub CLI not found. Install: winget install GitHub.cli"; exit 1 }
}

# 1. auth (opens browser once; nothing stored in this script)
& $gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output ">> Logging into GitHub — follow the browser prompt..."
  & $gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { Write-Error "GitHub login failed/cancelled."; exit 1 }
}

$owner = (& $gh api user --jq .login).Trim()
Write-Output ">> Logged in as $owner"

# 2. create public repo + push (idempotent-ish: skips create if it exists)
& $gh repo view "$owner/$RepoName" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output ">> Creating public repo $owner/$RepoName and pushing..."
  & $gh repo create $RepoName --public --source . --push --description "Browser-based FPV drone simulator (three.js) - realistic physics, radio support, Miami + procedural maps"
} else {
  Write-Output ">> Repo exists; pushing main..."
  if (-not (git remote | Select-String -Quiet origin)) {
    git remote add origin "https://github.com/$owner/$RepoName.git"
  }
  git push -u origin main
}

# 3. enable GitHub Pages from main branch root
Write-Output ">> Enabling GitHub Pages..."
& $gh api "repos/$owner/$RepoName/pages" -X POST -f "source[branch]=main" -f "source[path]=/" 2>$null
if ($LASTEXITCODE -ne 0) {
  # already enabled -> update source instead
  & $gh api "repos/$owner/$RepoName/pages" -X PUT -f "source[branch]=main" -f "source[path]=/" 2>$null
}

Write-Output ""
Write-Output "============================================="
Write-Output "  DONE! Your simulator will be live at:"
Write-Output "  https://$owner.github.io/$RepoName/"
Write-Output "  (first Pages build takes ~1 minute)"
Write-Output "============================================="
