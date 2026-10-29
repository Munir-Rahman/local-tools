# ToolNest system-check script; reads local state and makes no security-policy changes.
$ErrorActionPreference = 'Continue'
Write-Host 'ToolNest Windows prerequisites' -ForegroundColor Cyan
Write-Host ('Project: '+(Get-Location).Path)
Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{n='FreeGB';e={[math]::Round($_.Free/1GB,2)}},@{n='UsedGB';e={[math]::Round($_.Used/1GB,2)}} | Format-Table
foreach($cmd in @('node.exe','npm.cmd')) { $c=Get-Command $cmd -ErrorAction SilentlyContinue; if($c){Write-Host "$cmd : $($c.Source)"}else{Write-Warning "$cmd NOT FOUND"} }
if(Test-Path package.json){Write-Host 'package.json found.'}else{Write-Warning 'package.json missing! Move to extracted repository root.'}
if(Test-Path apps/web/package.json){Write-Host 'Web workspace found.'}else{Write-Warning 'apps/web/package.json missing'}
try {$f=Join-Path (Get-Location) '.toolnest-write-test'; [System.IO.File]::WriteAllText($f,'ok');Remove-Item $f;Write-Host 'Project folder is writable.'}catch{Write-Warning "Project folder NOT writable: $_"}
Write-Host 'Prefer npm.cmd over npm in PowerShell. Need several GB free for full mobile+Electron installation.'
