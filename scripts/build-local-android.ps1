param(
  [string]$BuildRoot = "C:\gn-local",
  [ValidateSet("release", "debug")]
  [string]$Variant = "release"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nativeAndroidRoot = Join-Path $BuildRoot "apps\native\android"
$outputDirectory = Join-Path $repoRoot "artifacts\android"
$apkName = "golfers-nation-local-$Variant.apk"
$apkDestination = Join-Path $outputDirectory $apkName
$apkSource = Join-Path $nativeAndroidRoot "app\build\outputs\apk\$Variant\app-$Variant.apk"
$sdkDir = Join-Path $env:LOCALAPPDATA "Android\Sdk"

function Invoke-RobocopyMirror {
  param(
    [string]$Source,
    [string]$Destination
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null

  $arguments = @(
    $Source,
    $Destination,
    "/MIR",
    "/XD",
    ".git",
    "node_modules",
    "apps\native\node_modules",
    "apps\native\.expo",
    "apps\native\.expo-export",
    "apps\native\android\.gradle",
    "apps\native\android\build",
    "apps\native\android\app\build",
    "apps\native\android\app\.cxx",
    "coverage",
    "dist",
    "sideload-test",
    "/XF",
    "*.apk",
    "*.aab",
    "*.apks"
  )

  & robocopy @arguments | Out-Host
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
  }
}

function Ensure-LocalProperties {
  param(
    [string]$AndroidRoot,
    [string]$SdkPath
  )

  if (-not (Test-Path $SdkPath)) {
    throw "Android SDK not found at $SdkPath"
  }

  $escapedSdkPath = $SdkPath.Replace("\", "\\")
  $contents = "sdk.dir=$escapedSdkPath`n"
  Set-Content -Path (Join-Path $AndroidRoot "local.properties") -Value $contents -Encoding ASCII
}

Invoke-RobocopyMirror -Source $repoRoot -Destination $BuildRoot

if (-not (Test-Path (Join-Path $BuildRoot "package.json"))) {
  throw "Build workspace sync failed: package.json missing at $BuildRoot"
}

Write-Host "Installing workspace dependencies in $BuildRoot"
& npm install --prefix $BuildRoot
if ($LASTEXITCODE -ne 0) {
  throw "npm install failed with exit code $LASTEXITCODE"
}

Ensure-LocalProperties -AndroidRoot $nativeAndroidRoot -SdkPath $sdkDir

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$gradleTask = if ($Variant -eq "debug") { "assembleDebug" } else { "assembleRelease" }

Push-Location $nativeAndroidRoot
try {
  $env:EXPO_NO_METRO_WORKSPACE_ROOT = "1"
  $env:NODE_ENV = "production"
  & ".\gradlew.bat" $gradleTask
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle build failed with exit code $LASTEXITCODE"
  }
}
finally {
  Pop-Location
}

if (-not (Test-Path $apkSource)) {
  throw "APK not found after build: $apkSource"
}

Copy-Item -Force $apkSource $apkDestination
Write-Host "Local Android APK ready at $apkDestination"
