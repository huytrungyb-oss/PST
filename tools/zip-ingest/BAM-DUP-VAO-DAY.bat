@echo off
setlocal
title Nap du lieu vao Second Brain
cd /d "%~dp0"
echo ============================================================
echo   NAP DU LIEU VAO SECOND BRAIN - cu de cua so nay chay
echo ============================================================
echo.

set "PYEXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
set "PY="
py -3 -c "import sys" >nul 2>&1 && set "PY=py -3"
if not defined PY python -c "import sys" >nul 2>&1 && set "PY=python"
if not defined PY if exist "%PYEXE%" set PY="%PYEXE%"
if defined PY goto have_python

echo [1/3] May chua co Python. Dang tu cai dat, vui long doi 1-3 phut...
winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements >nul 2>&1
if exist "%PYEXE%" goto installed
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest 'https://www.python.org/ftp/python/3.12.7/python-3.12.7-amd64.exe' -OutFile \"$env:TEMP\py-setup.exe\"; Start-Process \"$env:TEMP\py-setup.exe\" -ArgumentList '/quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1 Include_tcltk=1' -Wait"
if exist "%PYEXE%" goto installed
echo.
echo LOI: Khong cai duoc Python. Hay chup man hinh nay gui cho Claude.
pause
exit /b 1

:installed
set PY="%PYEXE%"

:have_python
echo [2/3] Dang chuan bi cong cu doc file (lan dau mat vai phut)...
%PY% -m pip install --disable-pip-version-check -q --user "markitdown[all]"
if errorlevel 1 (
  echo.
  echo LOI: Khong tai duoc cong cu. Kiem tra mang Internet roi bam dup lai.
  pause
  exit /b 1
)

echo [3/3] Mo cua so chon file ZIP...
echo.
%PY% -X utf8 "%~dp0ingest.py"
echo.
echo Neu cua so nay bi tat giua chung, chi can bam dup lai: no se lam tiep tu cho dang do.
pause
