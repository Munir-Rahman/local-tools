@echo off
setlocal
cd /d "%~dp0.."
if not exist "package.json" (echo Missing package.json & exit /b 1)
if not exist "D:\DevTools\npm-cache" mkdir "D:\DevTools\npm-cache"
if not exist "D:\DevTools\temp" mkdir "D:\DevTools\temp"
set "npm_config_cache=D:\DevTools\npm-cache"
set "TEMP=D:\DevTools\temp"
set "TMP=D:\DevTools\temp"
echo Installing WEB and CORE only. This avoids downloading the mobile SDK and Electron.
call npm.cmd install --workspace @local-tools/web --workspace @local-tools/core --no-audit --no-fund
endlocal
