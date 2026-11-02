@echo off
chcp 65001 >nul
title My Office
where node >nul 2>nul
if errorlevel 1 (
  echo Chua cai Node.js. Tai ban LTS o https://nodejs.org roi chay lai file nay.
  start https://nodejs.org
  pause
  exit /b 1
)
start "" http://127.0.0.1:4317
node "%~dp0server.js"
pause
