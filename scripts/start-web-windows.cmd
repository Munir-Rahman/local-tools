@echo off
setlocal
cd /d "%~dp0.."
if not exist "package.json" (echo Missing package.json & exit /b 1)
if not exist "D:\DevTools\npm-cache" mkdir "D:\DevTools\npm-cache"
if not exist "D:\DevTools\temp" mkdir "D:\DevTools\temp"
set "npm_config_cache=D:\DevTools\npm-cache"
set "TEMP=D:\DevTools\temp"
set "TMP=D:\DevTools\temp"
call npm.cmd run dev
endlocal
