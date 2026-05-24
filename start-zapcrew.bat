@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  echo Starting ZapCrew with Python launcher...
  py -3 scripts\serve.py
  pause
  exit /b %errorlevel%
)

where python >nul 2>nul
if not errorlevel 1 (
  echo Starting ZapCrew with Python...
  python scripts\serve.py
  pause
  exit /b %errorlevel%
)

echo Python was not found.
echo Install Python 3 from https://www.python.org/downloads/ and run this file again.
pause
exit /b 1
