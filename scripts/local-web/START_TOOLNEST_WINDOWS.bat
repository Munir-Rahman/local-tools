@echo off
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0run_toolnest.py" %*
  goto :finish
)
where python >nul 2>&1
if not errorlevel 1 (
  python "%~dp0run_toolnest.py" %*
  goto :finish
)
echo Python 3 is required to start this local web build.
echo https://www.python.org/downloads/
:finish
echo.
echo ToolNest local server has stopped.
pause
