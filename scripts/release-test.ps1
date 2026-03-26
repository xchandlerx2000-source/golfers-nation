param(
  [string]$CommitMessage = "redeploy latest update",
  [switch]$ForcePush
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [string]$Label,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Action
}

function Invoke-GitCommitIfNeeded {
  $status = git status --short
  if (-not $status) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    return
  }

  git add .
  $staged = git diff --cached --name-only
  if (-not $staged) {
    Write-Host "Nothing staged after git add." -ForegroundColor Yellow
    return
  }

  git commit -m $CommitMessage
}

Invoke-Step "Build Cloudflare package" {
  npm run build:cloudflare
}

Invoke-Step "Commit current repo state" {
  Invoke-GitCommitIfNeeded
}

Invoke-Step "Push main" {
  if ($ForcePush) {
    git push -f origin main
  } else {
    git push origin main
  }
}

Invoke-Step "Trigger sideload Android build" {
  npm exec --workspace golfers-nation-native -- eas build --platform android --profile sideload-android --no-wait
}

Invoke-Step "Show latest Android builds" {
  npm exec --workspace golfers-nation-native -- eas build:list --platform android --limit 3
}

Write-Host ""
Write-Host "Release flow completed." -ForegroundColor Green
