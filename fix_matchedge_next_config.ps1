param(
  [string]$ProjectRoot = "C:\Projects\matchedge"
)

$ErrorActionPreference = "Stop"

$nextConfigPath = Join-Path $ProjectRoot "next.config.ts"
$backupDir = Join-Path $ProjectRoot "_backup_before_next_config_fix"

if (-not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (Test-Path $nextConfigPath) {
  Copy-Item $nextConfigPath (Join-Path $backupDir "next.config.$stamp.ts") -Force
}

$cleanConfig = @"
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
"@

Set-Content -Path $nextConfigPath -Value $cleanConfig -Encoding UTF8

Write-Host "next.config.ts FIXED" -ForegroundColor Green
