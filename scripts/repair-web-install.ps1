param([switch]$Reset)
# Repairs the WEB workspace only. No changes to PowerShell execution policy, registry, or user files.
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root
if(!(Test-Path '.\apps\web\package.json')){throw 'Run the script from a complete ToolNest source checkout.'}
$drive=Get-PSDrive -Name ([System.IO.Path]::GetPathRoot($root).Substring(0,1))
$free=[math]::Round($drive.Free/1GB,2)
Write-Host "ToolNest web repair from $root" -ForegroundColor Cyan
Write-Host "Free space on $($drive.Name): $free GB"
if($free -lt 3){throw 'Under 3 GB free. Free disk space before reinstalling dependencies.'}
$env:npm_config_cache=Join-Path $root '.npm-cache'
$env:NODE_ENV='development'
Write-Host 'For best results, stop Expo, Vite, Electron and any other npm installers first.'
if($Reset){
 $node=Get-Process node -ErrorAction SilentlyContinue
 if($node){throw 'Node.js processes are running. Close Metro, Vite, and desktop dev servers before using -Reset.'}
 Write-Host 'Removing only repository node_modules dependency directories...' -ForegroundColor Yellow
 foreach($p in @('.\node_modules','.\apps\web\node_modules','.\packages\core\node_modules')){
   if(Test-Path $p){Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction Stop}
 }
}
Write-Host 'Installing web + core workspaces (including Vite devDependencies)...'
& npm.cmd install --workspace '@local-tools/web' --workspace '@local-tools/core' --include-workspace-root --include=dev --no-audit --no-fund --foreground-scripts
if($LASTEXITCODE -ne 0){throw "npm install failed (exit $LASTEXITCODE). Check disk, antivirus, background npm processes and npm logs. Do not start Vite yet."}
$vite=(@('.\node_modules\.bin\vite.cmd','.\apps\web\node_modules\.bin\vite.cmd') | Where-Object {Test-Path $_} | Select-Object -First 1)
if(!$vite){throw 'Vite executable is still missing. Installation did not produce its dev dependency.'}
Write-Host "Vite installed at $vite" -ForegroundColor Green
Write-Host 'Start web with: npm.cmd run dev'
